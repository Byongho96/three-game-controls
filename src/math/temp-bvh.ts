import {
	Box3,
	Triangle,
	Vector3,
	Layers,
	type Ray,
	type Object3D,
	Mesh,
} from 'three';
import { Capsule } from 'three/examples/jsm/math/Capsule.js';
import { triangleCapsuleIntersect } from '../utils/math.js';

const BIN_COUNT = 16;

const _size = new Vector3();
const _v1 = new Vector3();
const _v2 = new Vector3();

let obj = 0;
let spa = 0;
let tra = 0;
// let cnt = 0;
const _capsule = new Capsule();

class BVH {

	/** The bounding box of this BVH node used for intersection tests.
	 * @default new THREE.Box3()
	 */
	box: Box3;

	/** The min max bounds of all the triangles in the BVH.
	 * @default new THREE.Box3()
	 */
	bounds: Box3 = new Box3();

	/** The current level of this BVH node in the tree. This is used to limit the max depth of the BVH.
	 * @default 0
	 */
	depth: number = 0;

	/** Which layers (bitmask) this BVH should consider.
	 * @default new THREE.Layers()
	 */
	layers: Layers = new Layers();

	/** The sub-BVH node that contains the minimum volume among the split regions.
	 * @default null
	 */
	minVolume: BVH | null = null;

	/** The sub-BVH node that contains the maximum volume among the split regions.
	 * @default null
	 */
	maxVolume: BVH | null = null;

	/** The max depth of the BVH tree. This is used to limit the recursion depth. Up to (2 ** depth) BVH nodes can be created.
	 * @default 48
	 */
	maxDepth: number = 48;

	/** The maximum number of triangles that can be stored at a single BVH node before it splits.
	 * @default 9
	 */
	maxLeafSize: number = 8;

	/** The number of bins used for the object split. This is used to determine how to split the triangles into sub-volumes.
	 * @default 16
	 */
	objectSplitBinCount: number = 16;

	/** The accuracy of the spatial split. If the triangle is smaller than this value, it will not be duplicated in both sub-volumes.
	 * @default 0.01
	 */
	spatialSplitAccuracy: number = 0.01;

	/** The split axis of this BVH node. This is used to determine how to split the triangles into sub-volumes.
	 * @default null
	 */
	splitAxis: 'x' | 'y' | 'z' | null = null;

	/** Triangles directly stored at this volume. If this volume has sub-volumes, this will be empty.
	 * @default []
	 */
	triangles: Triangle[] = [];

	/** Constructs a new BVH instance.
	 * @param {Box3} [box] - Optional bounding box to start with.
	 */
	constructor( box?: Box3 ) {

		this.box = box || new Box3();

	}

	/**
	 * Adds a triangle to this node, expanding the node's bounds if necessary.
	 * @param {Triangle} triangle
	 */
	addTriangle( triangle: Triangle ): void {

		this.bounds.expandByPoint( triangle.a );
		this.bounds.expandByPoint( triangle.b );
		this.bounds.expandByPoint( triangle.c );

		this.triangles.push( triangle );

	}

	/**
	 * Calculates the bounding box of this BVH node based on the stored triangles. Use this after adding triangles.
	 */
	calcBox(): void {

		this.box.copy( this.bounds );

		this.box.min.addScalar( - 0.01 ); // to avoid zero size boxes

	}

	/**
	 * Optimizes the bounding box of this node to fit within the bounds of the parent node. Use this after the size of the box is determined.
	 */
	optimizeBox(): void {

		if ( this.bounds.isEmpty() ) return;

		this.box.min.max( this.bounds.min );
		this.box.max.min( this.bounds.max );

	}

	protected _computeObjectSplitCost(): {cost:number, minVolume: BVH, maxVolume: BVH} {

		if ( this.splitAxis === null ) throw new Error( 'splitAxis is null' );

		const size = this.box.getSize( _size );

		// Distribute triangles into bins
		const bins = new Array( BIN_COUNT ).fill( 0 ).map( () => ( { triangles: [] as Triangle[], bounds: new Box3() } ) );

		for ( const triangle of this.triangles ) {

			const center = triangle.getMidpoint( _v1 );

			let binIndex = Math.floor( ( center[ this.splitAxis ] - this.bounds.min[ this.splitAxis ] ) / size[ this.splitAxis ] * BIN_COUNT );

			binIndex = Math.max( 0, Math.min( binIndex, BIN_COUNT - 1 ) );

			bins[ binIndex ].bounds.expandByPoint( triangle.a );
			bins[ binIndex ].bounds.expandByPoint( triangle.b );
			bins[ binIndex ].bounds.expandByPoint( triangle.c );

			bins[ binIndex ].triangles.push( triangle );

		}

		// Cumulate bins from left to right and right to left
		const minCumBox = new Array<Box3>( BIN_COUNT );
		const maxCumBox = new Array<Box3>( BIN_COUNT );

		minCumBox[ 0 ] = bins[ 0 ].bounds.clone().intersect( this.box );
		maxCumBox[ BIN_COUNT - 1 ] = bins[ BIN_COUNT - 1 ].bounds.clone().intersect( this.box );

		for ( let li = 1; li < BIN_COUNT - 1; li ++ ) {

			minCumBox[ li ] = minCumBox[ li - 1 ].clone().union( bins[ li ].bounds ).intersect( this.box );

			const ri = BIN_COUNT - li - 1;
			maxCumBox[ ri ] = maxCumBox[ ri + 1 ].clone().union( bins[ ri ].bounds ).intersect( this.box );

		}

		// Find the best split point : SAH cost
		// https://www.sci.utah.edu/~wald/Publications/2007/ParallelBVHBuild/fastbuild.pdf
		let bestIdx = - 1;
		let bestCost = Infinity;

		let N_min = 0;
		let N_max = this.triangles.length;

		for ( let i = 0; i < BIN_COUNT - 1; i ++ ) {

			N_min += bins[ i ].triangles.length;
			N_max -= bins[ i ].triangles.length;

			minCumBox[ i ].getSize( _v2 );
			const A_min = _v2.x * _v2.y + _v2.y * _v2.z + _v2.z * _v2.x;

			maxCumBox[ i + 1 ].getSize( _v2 );
			const A_max = _v2.x * _v2.y + _v2.y * _v2.z + _v2.z * _v2.x;

			const cost = N_min * A_min + N_max * A_max;

			if ( cost < bestCost ) {

				bestIdx = i;
				bestCost = cost;

			}

		}

		// Create sub-volumes based on the best bin split
		const minVolume = new BVH( minCumBox[ bestIdx ] );
		minVolume.triangles = bins.slice( 0, bestIdx + 1 ).flatMap( ( b ) => b.triangles );
		for ( let i = 0; i < bestIdx + 1; i ++ ) {

			minVolume.bounds.union( bins[ i ].bounds );

		}

		const maxVolume = new BVH( maxCumBox[ bestIdx + 1 ] );
		maxVolume.triangles = bins.slice( bestIdx + 1 ).flatMap( ( b ) => b.triangles );
		for ( let i = bestIdx + 1; i < BIN_COUNT; i ++ ) {

			maxVolume.bounds.union( bins[ i ].bounds );

		}

		return { cost: bestCost, minVolume: minVolume, maxVolume: maxVolume };

	}


	protected _computeSpatialSplitCost(): {cost:number, minVolume: BVH, maxVolume: BVH} {

		if ( this.splitAxis === null ) throw new Error( 'splitAxis is null' );

		const splitPoint = this.box.getCenter( _v1 )[ this.splitAxis ];

		// Create two new BVH nodes for the spatial split
		const minVolume = new BVH( this.box.clone() );
		minVolume.box.max[ this.splitAxis ] = splitPoint;

		const maxVolume = new BVH( this.box.clone() );
		maxVolume.box.min[ this.splitAxis ] = splitPoint;

		for ( const triangle of this.triangles ) {

			if ( triangle.getArea() > this.spatialSplitAccuracy ) {

				// If the triangle is larger than the duplication threshold,  add it to both volumes if it intersects
				if ( minVolume.box.intersectsTriangle( triangle ) ) minVolume.addTriangle( triangle );
				if ( maxVolume.box.intersectsTriangle( triangle ) ) maxVolume.addTriangle( triangle );

			} else {

				// If the triangle is smaller than the duplication threshold, add it to the volume based on its center
				const center = triangle.getMidpoint( _v1 )[ this.splitAxis ];
				if ( center < splitPoint ) minVolume.addTriangle( triangle );
				else maxVolume.addTriangle( triangle );

			}

		}

		// Calculate the sah cost for the spatial split
		minVolume.box.getSize( _v2 );
		const A_min = _v2.x * _v2.y + _v2.y * _v2.z + _v2.z * _v2.x;

		maxVolume.box.getSize( _v2 );
		const A_max = _v2.x * _v2.y + _v2.y * _v2.z + _v2.z * _v2.x;

		const cost = minVolume.triangles.length * A_min + maxVolume.triangles.length * A_max;

		return { cost: cost, minVolume: minVolume, maxVolume: maxVolume };

	}

	protected _setChildren( minVolume: BVH, maxVolume: BVH ): void {

		this.triangles = [];

		if ( minVolume.triangles.length > 0 ) {

			this.minVolume = minVolume;
			this.minVolume.depth = this.depth + 1;
			this.minVolume.maxDepth = this.maxDepth;
			this.minVolume.maxLeafSize = this.maxLeafSize;
			this.minVolume.objectSplitBinCount = this.objectSplitBinCount;
			this.minVolume.spatialSplitAccuracy = this.spatialSplitAccuracy;

		}

		if ( maxVolume.triangles.length > 0 ) {

			this.maxVolume = maxVolume;
			this.maxVolume.depth = this.depth + 1;
			this.maxVolume.maxDepth = this.maxDepth;
			this.maxVolume.maxLeafSize = this.maxLeafSize;
			this.maxVolume.objectSplitBinCount = this.objectSplitBinCount;
			this.maxVolume.spatialSplitAccuracy = this.spatialSplitAccuracy;

		}

	}

	/**
	 * Recursively splits this node into two child BVHs along the largest axis, distributing triangles into sub-volumes.
	 */
	split(): void {

		this.optimizeBox();

		if ( this.depth >= this.maxDepth || this.triangles.length < this.maxLeafSize + 1 ) return;

		// Determine the longest axis
		const size = this.box.getSize( _size );

		this.splitAxis = 'x';
		if ( size.y > size.x && size.y > size.z ) this.splitAxis = 'y';
		if ( size.z > size.x && size.z > size.y ) this.splitAxis = 'z';


		// Choose the optimal split method based on the number of triangles and depth and the SAH cost
		const currentCost = this.triangles.length * size.x * size.y + size.y * size.z + size.z * size.x;

		const { cost: objectSplitCost, minVolume: objectMinVolume, maxVolume: objectMaxVolume } = this._computeObjectSplitCost();

		if ( objectSplitCost > currentCost * 0.8 ) {

			const { cost: spatialSplitCost, minVolume: spatialMinVolume, maxVolume: spatialMAxVolume } = this._computeSpatialSplitCost();

			if ( spatialSplitCost < objectSplitCost ) {

				spa += 1;
				this._setChildren( spatialMinVolume, spatialMAxVolume );

			} else {

				obj += 1;

				this._setChildren( objectMinVolume, objectMaxVolume );

			}

		} else {

			obj += 1;
			this._setChildren( objectMinVolume, objectMaxVolume );

		}

		// Recursively split the child nodes
		if ( this.minVolume ) this.minVolume.split();
		if ( this.maxVolume ) this.maxVolume.split();

	}

	/**
	 * Builds the BVH by recursively splitting the node until the max. Use this after adding triangles.
	 */
	build() {

		this.calcBox();
		this.split();
		// console.log( 'cnt', cnt );

	}

	/**
	 * Build BVH by traversing an Object3D hierarchy. It will gather triangles from Meshes in the specified layers, and build a BVH.
	 * @param {Object3D} group - The root Object3D to traverse.
	 */
	buildFromObject( group: Object3D ): void {

		// requestAnimationFrame

		group.updateWorldMatrix( true, true );

		// Traverse the group and collect triangles
		group.traverse( ( obj ) => {

			if ( ! ( obj instanceof Mesh ) ) return;

			if ( [ /bamboo/, /Pine/, /small/, /grass/, /maple/, /tree/, /elec/, /SM_house_Material #108_0/, /SM_cakeShop_Material #15_0/, /sm_houseBrewery_Material #25_0/, /SM_yakitoriRestaurant_Material #25_0/ ].some( ( re ) => re.test( obj.name ) ) ) {

				console.log( obj.name );
				return;

			}

			if ( this.layers.test( obj.layers ) ) {

				let geometry = null;
				let isTemp = false;

				if ( obj.geometry.index !== null ) {

					isTemp = true;
					geometry = obj.geometry.toNonIndexed();

				} else {

					geometry = obj.geometry;

				}

				const positionAttribute = geometry.getAttribute( 'position' );

				for ( let i = 0; i < positionAttribute.count; i += 3 ) {

					const v1 = new Vector3().fromBufferAttribute( positionAttribute, i );
					const v2 = new Vector3().fromBufferAttribute( positionAttribute, i + 1 );
					const v3 = new Vector3().fromBufferAttribute( positionAttribute, i + 2 );

					v1.applyMatrix4( obj.matrixWorld );
					v2.applyMatrix4( obj.matrixWorld );
					v3.applyMatrix4( obj.matrixWorld );

					this.addTriangle( new Triangle( v1, v2, v3 ) );

				}

				if ( isTemp ) {

					geometry.dispose();	// dispose of the temporary non-indexed geometry

				}

			}

		} );

		this.build();

		console.log( 'obj', obj );
		console.log( 'spa', spa );

	}

	// Collects all triangles that intersect with the given ray.
	protected _getRayTriangles( ray: Ray, triangles: Triangle[] ): void {

		if ( ray.intersectsBox( this.box ) === false ) return;


		if ( this.triangles.length > 0 ) {

			for ( let j = 0; j < this.triangles.length; j ++ ) {

				if ( triangles.indexOf( this.triangles[ j ] ) === - 1 ) {

					triangles.push( this.triangles[ j ] );

				}

			}

			return;

		}

		if ( this.minVolume ) this.minVolume._getRayTriangles( ray, triangles );
		if ( this.maxVolume ) this.maxVolume._getRayTriangles( ray, triangles );


	}

	// Collects all triangles that intersect the given capsule's bounding box.
	protected _getCapsuleTriangles( capsule: Capsule, triangles: Triangle[] ): void {

		if ( capsule.intersectsBox( this.box ) === false ) return;

		if ( this.triangles.length > 0 ) {

			tra += 1;
			for ( let j = 0; j < this.triangles.length; j ++ ) {

				if ( triangles.indexOf( this.triangles[ j ] ) === - 1 ) triangles.push( this.triangles[ j ] );

			}

			return;

		}

		if ( this.minVolume ) this.minVolume._getCapsuleTriangles( capsule, triangles );
		if ( this.maxVolume ) this.maxVolume._getCapsuleTriangles( capsule, triangles );


	}

	/**
	 * Performs a ray intersection test against the BVH. Returns the closest intersection or false.
	 * @param {Ray} ray - The ray to test against the BVH.
	 */
	rayIntersect( ray: Ray ): { distance: number; triangle: Triangle; position: Vector3 } | false {

		if ( ray.direction.length() === 0 ) return false;

		const triangles: Triangle[] = [];
		this._getRayTriangles( ray, triangles );

		// console.log( 'ray', triangles.length );

		let triangle: Triangle;
		let position: Vector3;
		let distance = 1e100;

		for ( let i = 0; i < triangles.length; i ++ ) {

			const result = ray.intersectTriangle( triangles[ i ].a, triangles[ i ].b, triangles[ i ].c, true, _v1 );

			if ( result ) {

				const newDistance = result.sub( ray.origin ).length();

				if ( distance > newDistance ) {

					position = result.clone().add( ray.origin );
					distance = newDistance;
					triangle = triangles[ i ];

				}

			}

		}

		if ( distance < 1e100 ) {

			return { distance: distance, triangle: triangle!, position: position! };

		}

		return false;

	}

	/**
	 * Check for intersections between a capsule and the BVH.
	 * @param {Capsule} capsule - The capsule to test against the BVH.
	 */
	capsuleIntersect( capsule: Capsule ): { normal: Vector3; depth: number } | false {

		_capsule.copy( capsule );

		const triangles: Triangle[] = [];

		tra = 0;
		this._getCapsuleTriangles( _capsule, triangles );

		console.log( 'capsule', triangles.length, 'tra', tra );

		let hit = false;

		for ( let i = 0; i < triangles.length; i ++ ) {

			const result = triangleCapsuleIntersect( _capsule, triangles[ i ] );

			if ( result ) {

				hit = true;

				_capsule.translate( result.normal.multiplyScalar( result.depth ) );

			}

		}

		if ( hit ) {

			const collisionVector = _capsule.getCenter( new Vector3() ).sub( capsule.getCenter( _v1 ) );
			const depth = collisionVector.length();

			return { normal: collisionVector.normalize(), depth: depth };

		}

		return false;

	}

	/**
	 * Clears this BVH node's data. Useful if you want to reuse the BVH object.
	 */
	clear() {

		this.box.makeEmpty();
		this.bounds.makeEmpty();

		this.minVolume = null;
		this.maxVolume = null;

		this.triangles = [];

		return this;

	}

}

export { BVH };
