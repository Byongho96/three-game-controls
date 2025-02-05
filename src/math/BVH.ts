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

const _v1 = new Vector3();
const _v2 = new Vector3();

const _capsule = new Capsule();

let cnt = 0;
let num = 0;
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
	 * @default 48
	 */
	depth: number = 48;

	/** Which layers (bitmask) this BVH should consider.
	 * @default new THREE.Layers()
	 */
	layers: Layers = new Layers();

	/** The sub-BVH node that contains the minimum volume among the split regions.
	 * @default null
	 */
	leftVolume: BVH | null = null;

	/** The sub-BVH node that contains the maximum volume among the split regions.
	 * @default null
	 */
	rightVolume: BVH | null = null;

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
	 * Recursively splits this node into two child BVHs along the largest axis, distributing triangles into sub-volumes.
	 * @param {number} level - Current depth of recursion (used to limit max depth).
	 */
	split( level: number ): void {

		// this.optimizeBox();

		const size = this.box.getSize( _v1 );

		// Determine the longest axis
		let splitAxis: 'x' | 'y' | 'z' = 'x';

		if ( size.y > size.x && size.y > size.z ) {

			splitAxis = 'y';

		} else if ( size.z > size.x && size.z > size.y ) {

			splitAxis = 'z';

		}

		// Create bins along
		const binCount = Math.floor( 16 - ( level / 4 ) );
		const bins = new Array( binCount ).fill( 0 ).map( () => ( { triangles: [] as Triangle[], bounds: new Box3() } ) );

		// Distribute triangles into bins
		let triangle: Triangle | undefined = this.triangles.pop();

		while ( triangle ) {

			const center = triangle.getMidpoint( _v2 )[ splitAxis ];

			let binIndex = Math.floor( ( center - this.box.min[ splitAxis ] ) / size[ splitAxis ] * binCount );

			if ( binIndex > binCount - 1 ) binIndex = binCount - 1;
			if ( binIndex < 0 ) binIndex = 0;

			bins[ binIndex ].triangles.push( triangle );

			bins[ binIndex ].bounds.min.x = Math.min( bins[ binIndex ].bounds.min.x, triangle.a.x, triangle.b.x, triangle.c.x );
			bins[ binIndex ].bounds.min.y = Math.min( bins[ binIndex ].bounds.min.y, triangle.a.y, triangle.b.y, triangle.c.y );
			bins[ binIndex ].bounds.min.z = Math.min( bins[ binIndex ].bounds.min.z, triangle.a.z, triangle.b.z, triangle.c.z );
			bins[ binIndex ].bounds.max.x = Math.max( bins[ binIndex ].bounds.max.x, triangle.a.x, triangle.b.x, triangle.c.x );
			bins[ binIndex ].bounds.max.y = Math.max( bins[ binIndex ].bounds.max.y, triangle.a.y, triangle.b.y, triangle.c.y );
			bins[ binIndex ].bounds.max.z = Math.max( bins[ binIndex ].bounds.max.z, triangle.a.z, triangle.b.z, triangle.c.z );

			triangle = this.triangles.pop();

		}

		// Calculate bounds for each bin
		const leftBounds = new Array( binCount ).fill( 0 ).map( () => ( new Box3() ) );
		const rightBounds = new Array( binCount ).fill( 0 ).map( () => ( new Box3() ) );

		leftBounds[ 0 ].copy( bins[ 0 ].bounds );
		rightBounds[ binCount - 1 ].copy( bins[ binCount - 1 ].bounds );

		for ( let i = 1; i < binCount; i ++ ) {

			leftBounds[ i ].union( leftBounds[ i - 1 ] );
			leftBounds[ i ].union( bins[ i - 1 ].bounds );

			rightBounds[ binCount - i - 1 ].union( rightBounds[ binCount - i ] );
			rightBounds[ binCount - i - 1 ].union( bins[ binCount - i - 1 ].bounds );

		}


		// SAH cost calculation for the bins
		// https://www.sci.utah.edu/~wald/Publications/2007/ParallelBVHBuild/fastbuild.pdf
		let bestIndex = - 1;
		let bestCost = Infinity;

		let N_L = 0;
		let N_R = this.triangles.length;

		for ( let i = 0; i < binCount - 1; i ++ ) {

			N_L += bins[ i ].triangles.length;
			N_R -= bins[ i ].triangles.length;

			leftBounds[ i ].getSize( _v2 );
			const A_L = _v2.x * _v2.y + _v2.y * _v2.z + _v2.z * _v2.x;

			rightBounds[ i ].getSize( _v2 );
			const A_R = _v2.x * _v2.y + _v2.y * _v2.z + _v2.z * _v2.x;

			const cost = N_L * A_L + N_R * A_R;

			if ( cost < bestCost ) {

				bestIndex = i;
				bestCost = cost;

			}

		}

		// Create sub-volumes based on the best split
		const leftVolume = new BVH( leftBounds[ bestIndex ] );
		leftVolume.depth = this.depth;
		leftVolume.triangles = bins.reduce( ( acc, bin, i ) => i < bestIndex ? acc.concat( bin.triangles ) : acc, [] as Triangle[] );

		const rightVolume = new BVH( rightBounds[ bestIndex ] );
		rightVolume.depth = this.depth;
		rightVolume.triangles = bins.reduce( ( acc, bin, i ) => i >= bestIndex ? acc.concat( bin.triangles ) : acc, [] as Triangle[] );

		// Assign the min and max volumes to this node
		if ( leftVolume.triangles.length > 0 ) {

			this.leftVolume = leftVolume;

		}

		if ( rightVolume.triangles.length > 0 ) {

			this.rightVolume = rightVolume;

		}

		// Recursively split the sub-volumes
		if ( leftVolume.triangles.length > 8 && level < this.depth ) {

			leftVolume.split( level + 1 );

		}

		if ( rightVolume.triangles.length > 8 && level < this.depth ) {

			rightVolume.split( level + 1 );

		}

		if ( ( rightVolume.triangles.length > 0 && leftVolume.triangles.length < 9 ) || level === this.depth - 1 ) {

			cnt += rightVolume.triangles.length;
			num ++;

		}

		if ( ( leftVolume.triangles.length > 0 && rightVolume.triangles.length < 9 ) || level === this.depth - 1 ) {

			cnt += leftVolume.triangles.length;
			num ++;

		}

	}

	/**
	 * Builds the BVH by recursively splitting the node until the max. Use this after adding triangles.
	 */
	build() {

		this.calcBox();
		this.split( 0 );

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

		console.log( this.triangles.length );
		this.build();
		console.log( cnt, num );

	}

	// Collects all triangles that intersect with the given ray.
	protected _getRayTriangles( ray: Ray, triangles: Triangle[] ): void {

		// leftVolume check
		if ( this.leftVolume && ray.intersectsBox( this.leftVolume.box ) ) {

			if ( this.leftVolume.triangles.length > 0 ) {

				for ( let j = 0; j < this.leftVolume.triangles.length; j ++ ) {

					if ( triangles.indexOf( this.leftVolume.triangles[ j ] ) === - 1 ) triangles.push( this.leftVolume.triangles[ j ] );

				}

			} else {

				this.leftVolume._getRayTriangles( ray, triangles );

			}

		}

		// rightVolume check
		if ( this.rightVolume && ray.intersectsBox( this.rightVolume.box ) ) {

			if ( this.rightVolume.triangles.length > 0 ) {

				for ( let j = 0; j < this.rightVolume.triangles.length; j ++ ) {

					if ( triangles.indexOf( this.rightVolume.triangles[ j ] ) === - 1 ) triangles.push( this.rightVolume.triangles[ j ] );

				}

			} else {

				this.rightVolume._getRayTriangles( ray, triangles );

			}

		}

	}

	// Collects all triangles that intersect the given capsule's bounding box.
	protected _getCapsuleTriangles( capsule: Capsule, triangles: Triangle[] ): void {

		// leftVolume check
		if ( this.leftVolume && capsule.intersectsBox( this.leftVolume.box ) ) {

			if ( this.leftVolume.triangles.length > 0 ) {

				for ( let j = 0; j < this.leftVolume.triangles.length; j ++ ) {

					if ( triangles.indexOf( this.leftVolume.triangles[ j ] ) === - 1 ) triangles.push( this.leftVolume.triangles[ j ] );

				}

			} else {

				this.leftVolume._getCapsuleTriangles( capsule, triangles );

			}

		}

		// rightVolume check
		if ( this.rightVolume && capsule.intersectsBox( this.rightVolume.box ) ) {

			if ( this.rightVolume.triangles.length > 0 ) {

				for ( let j = 0; j < this.rightVolume.triangles.length; j ++ ) {

					if ( triangles.indexOf( this.rightVolume.triangles[ j ] ) === - 1 ) triangles.push( this.rightVolume.triangles[ j ] );

				}

			} else {

				this.rightVolume._getCapsuleTriangles( capsule, triangles );

			}

		}

	}

	/**
	 * Performs a ray intersection test against the BVH. Returns the closest intersection or false.
	 * @param {Ray} ray - The ray to test against the BVH.
	 */
	rayIntersect( ray: Ray ): { distance: number; triangle: Triangle; position: Vector3 } | false {

		if ( ray.direction.length() === 0 ) return false;

		const triangles: Triangle[] = [];
		this._getRayTriangles( ray, triangles );

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

		this._getCapsuleTriangles( _capsule, triangles );

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

		this.leftVolume = null;
		this.rightVolume = null;

		this.triangles = [];

		return this;

	}

}

export { BVH };
