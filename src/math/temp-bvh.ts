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

const _v1 = new Vector3();
const _v2 = new Vector3();

let obj = 0;
let spa = 0;
let tra = 0;
let cnt = 0;
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

	/** The max depth of the BVH tree. This is used to limit the recursion depth. Up to (2 ** depth) BVH nodes can be created.
	 * @default 0
	 */
	level: number = 0;

	/** The max depth of the BVH tree. This is used to limit the recursion depth. Up to (2 ** depth) BVH nodes can be created.
	 * @default 48
	 */
	maxLevel: number = 48;

	/** The max depth of the BVH tree. This is used to limit the recursion depth. Up to (2 ** depth) BVH nodes can be created.
	 * @default 48
	 */
	depth: number = 48;

	/** The threshold triangle size used to determine duplication at boundaries. Triangles larger than this value may be duplicated across sub-BVH nodes.
	 * @default 0.01
	 */
	duplicationThreshold: number = 0.01;

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

		this.bounds.min.x = Math.min( this.bounds.min.x, triangle.a.x, triangle.b.x, triangle.c.x );
		this.bounds.min.y = Math.min( this.bounds.min.y, triangle.a.y, triangle.b.y, triangle.c.y );
		this.bounds.min.z = Math.min( this.bounds.min.z, triangle.a.z, triangle.b.z, triangle.c.z );
		this.bounds.max.x = Math.max( this.bounds.max.x, triangle.a.x, triangle.b.x, triangle.c.x );
		this.bounds.max.y = Math.max( this.bounds.max.y, triangle.a.y, triangle.b.y, triangle.c.y );
		this.bounds.max.z = Math.max( this.bounds.max.z, triangle.a.z, triangle.b.z, triangle.c.z );

		this.triangles.push( triangle );

	}

	/**
	 * Calculates the bounding box of this BVH node based on the stored triangles. Use this after adding triangles.
	 */
	calcBox(): void {

		this.box.copy( this.bounds );

		this.box.min.x -= 0.01;
		this.box.min.y -= 0.01;
		this.box.min.z -= 0.01;

	}

	/**
	 * Optimizes the bounding box of this node to fit within the bounds of the parent node. Use this after the size of the box is determined.
	 */
	optimizeBox(): void {

		if ( this.bounds.isEmpty() ) return;

		this.box.min.x = Math.max( this.box.min.x, this.bounds.min.x );
		this.box.min.y = Math.max( this.box.min.y, this.bounds.min.y );
		this.box.min.z = Math.max( this.box.min.z, this.bounds.min.z );
		this.box.max.x = Math.min( this.box.max.x, this.bounds.max.x );
		this.box.max.y = Math.min( this.box.max.y, this.bounds.max.y );
		this.box.max.z = Math.min( this.box.max.z, this.bounds.max.z );

	}

	/**
	 * Recursively splits this node into two child BVHs along the largest axis, distributing triangles into sub-volumes.
	 * @param {number} level - Current depth of recursion (used to limit max depth).
	 */
	split(): void {

		this.optimizeBox();

		if ( this.level > this.maxLevel - 1 ) {

			cnt += 1;
			return;

		}



		if ( this.triangles.length < 9 ) {

			cnt += 1;
			return;

		}



		const size = this.box.getSize( _v1 );

		// Determine the longest axis
		let splitAxis: 'x' | 'y' | 'z' = 'x';

		if ( size.y > size.x && size.y > size.z ) splitAxis = 'y';

		if ( size.z > size.y && size.z > size.x ) splitAxis = 'z';


		// Distribute triangles into bins
		const bins = new Array( BIN_COUNT ).fill( 0 ).map( () => ( { triangles: [] as Triangle[], box: new Box3() } ) );

		for ( let i = 0; i < this.triangles.length; i ++ ) {

			const triangle = this.triangles[ i ];
			const center = triangle.getMidpoint( _v2 );

			let binIndex = Math.floor( ( center[ splitAxis ] - this.box.min[ splitAxis ] ) / size[ splitAxis ] * BIN_COUNT );

			if ( binIndex > BIN_COUNT - 1 ) binIndex = BIN_COUNT - 1;
			if ( binIndex < 0 ) binIndex = 0;

			bins[ binIndex ].triangles.push( triangle );

			bins[ binIndex ].box.expandByPoint( triangle.a );
			bins[ binIndex ].box.expandByPoint( triangle.b );
			bins[ binIndex ].box.expandByPoint( triangle.c );

		}

		// Cumulate bins to find the best split
		const leftCumBins = new Array( BIN_COUNT ).fill( 0 ).map( () => ( new Box3() ) );
		const rightCumBins = new Array( BIN_COUNT ).fill( 0 ).map( () => ( new Box3() ) );

		leftCumBins[ 0 ].copy( bins[ 0 ].box );
		leftCumBins[ 0 ].intersect( this.box );

		rightCumBins[ BIN_COUNT - 1 ].copy( bins[ BIN_COUNT - 1 ].box );
		rightCumBins[ BIN_COUNT - 1 ].intersect( this.box );

		for ( let li = 1; li < BIN_COUNT - 1; li ++ ) {

			leftCumBins[ li ].copy( leftCumBins[ li - 1 ] ).union( bins[ li ].box );
			leftCumBins[ li ].intersect( this.box );

			const ri = BIN_COUNT - li - 1;
			rightCumBins[ ri ].copy( rightCumBins[ ri + 1 ] ).union( bins[ ri ].box );
			rightCumBins[ ri ].intersect( this.box );

		}

		// Find the best split point : SAH cost
		// https://www.sci.utah.edu/~wald/Publications/2007/ParallelBVHBuild/fastbuild.pdf
		let bestIdx = - 1;
		let bestCost = Infinity;

		let N_L = 0;
		let N_R = this.triangles.length;

		for ( let i = 0; i < BIN_COUNT - 1; i ++ ) {

			N_L += bins[ i ].triangles.length;
			N_R -= bins[ i ].triangles.length;

			leftCumBins[ i ].getSize( _v2 );
			const A_L = _v2.x * _v2.y + _v2.y * _v2.z + _v2.z * _v2.x;

			rightCumBins[ i + 1 ].getSize( _v2 );
			const A_R = _v2.x * _v2.y + _v2.y * _v2.z + _v2.z * _v2.x;

			const cost = N_L * A_L + N_R * A_R;

			if ( cost < bestCost ) {

				bestIdx = i;
				bestCost = cost;

			}

		}

		// Spatial Split
		const currentCost = this.triangles.length * size.x * size.y + size.y * size.z + size.z * size.x;

		if ( bestCost > currentCost * 0.8 ) {

			spa += 1;

			const splitPoint = this.box.getCenter( _v1 )[ splitAxis ];

			const minVolume = new BVH( this.box.clone() );
			minVolume.box.max[ splitAxis ] = splitPoint;

			const maxVolume = new BVH( this.box.clone() );
			maxVolume.box.min[ splitAxis ] = splitPoint;

			const triangleList = this.triangles; // pop을 쓰지 말고 참조
			this.triangles = [];

			for ( const triangle of triangleList ) {

				if ( triangle.getArea() > this.duplicationThreshold ) {

					if ( minVolume.box.intersectsTriangle( triangle ) ) minVolume.addTriangle( triangle );
					if ( maxVolume.box.intersectsTriangle( triangle ) ) maxVolume.addTriangle( triangle );

				} else {

					const center = triangle.getMidpoint( _v1 )[ splitAxis ];
					if ( center < splitPoint ) {

						minVolume.addTriangle( triangle );

					} else {

						maxVolume.addTriangle( triangle );

					}

				}

			}

			// if ( minVolume.triangles.length == 0 || maxVolume.triangles.length == 0 ) return;
			if ( minVolume.triangles.length > 0 ) {

				this.minVolume = minVolume;
				minVolume.level = this.level + 1;
				minVolume.maxLevel = this.maxLevel;
				minVolume.duplicationThreshold = this.duplicationThreshold;
				this.minVolume.split();

			}

			if ( maxVolume.triangles.length > 0 ) {

				this.maxVolume = maxVolume;
				maxVolume.level = this.level + 1;
				maxVolume.maxLevel = this.maxLevel;
				maxVolume.duplicationThreshold = this.duplicationThreshold;
				this.maxVolume.split();

			}


			return;

		}

		obj += 1;

		// Create sub-volumes based on the best split
		const leftVolume = new BVH( leftCumBins[ bestIdx ] );
		leftVolume.level = this.level + 1;
		leftVolume.maxLevel = this.maxLevel;
		leftVolume.triangles = bins.reduce( ( acc, bin, i ) => i <= bestIdx ? acc.concat( bin.triangles ) : acc, [] as Triangle[] );

		const rightVolume = new BVH( rightCumBins[ bestIdx + 1 ] );
		rightVolume.level = this.level + 1;
		rightVolume.maxLevel = this.maxLevel;
		rightVolume.triangles = bins.reduce( ( acc, bin, i ) => i >= bestIdx + 1 ? acc.concat( bin.triangles ) : acc, [] as Triangle[] );


		if ( leftVolume.triangles.length == 0 || rightVolume.triangles.length == 0 ) return;

		this.minVolume = leftVolume;
		this.maxVolume = rightVolume;

		this.triangles = [];

		this.minVolume.split( );
		this.maxVolume.split( );

	}

	/**
	 * Builds the BVH by recursively splitting the node until the max. Use this after adding triangles.
	 */
	build() {

		this.calcBox();
		this.split();
		console.log( 'cnt', cnt );

	}

	/**
	 * Build BVH by traversing an Object3D hierarchy. It will gather triangles from Meshes in the specified layers, and build a BVH.
	 * @param {Object3D} group - The root Object3D to traverse.
	 */
	buildFromObject( group: Object3D ): void {

		group.updateWorldMatrix( true, true );

		// Traverse the group and collect triangles
		group.traverse( ( obj ) => {

			if ( ! ( obj instanceof Mesh ) ) return;

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
