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
	split( level: number ): void {

		this.optimizeBox();

		const size = this.box.getSize( _v1 );

		// Determine the longest axis
		let splitAxis: 'x' | 'y' | 'z' = 'x';

		if ( size.y > size.x && size.y > size.z ) {

			splitAxis = 'y';

		} else if ( size.z > size.x && size.z > size.y ) {

			splitAxis = 'z';

		}

		// Create sub-volumes along the split axis
		const splitPoint = this.box.getCenter( _v1 )[ splitAxis ];

		const minVolume = new BVH( this.box.clone() );
		minVolume.depth = this.depth;
		minVolume.duplicationThreshold = this.duplicationThreshold;
		minVolume.box.max[ splitAxis ] = splitPoint;

		const maxVolume = new BVH( this.box.clone() );
		maxVolume.depth = this.depth;
		maxVolume.duplicationThreshold = this.duplicationThreshold;
		maxVolume.box.min[ splitAxis ] = splitPoint;

		// Distribute triangles into sub-volumes
		let triangle: Triangle | undefined = this.triangles.pop();

		while ( triangle ) {

			if ( triangle.getArea() > this.duplicationThreshold ) {

				// Duplicate a triangle that cross the boundary

				if ( minVolume.box.intersectsTriangle( triangle ) ) minVolume.addTriangle( triangle );

				if ( maxVolume.box.intersectsTriangle( triangle ) ) maxVolume.addTriangle( triangle );

			} else {

				// Assign a triangle to a sub-volume based on the center of the triangle

				const center = triangle.getMidpoint( _v1 )[ splitAxis ];

				if ( center < splitPoint ) {

					minVolume.addTriangle( triangle );

				} else {

					maxVolume.addTriangle( triangle );

				}

			}

			triangle = this.triangles.pop();

		}

		// Assign the min and max volumes to this node
		if ( minVolume.triangles.length > 0 ) {

			this.minVolume = minVolume;

		}

		if ( maxVolume.triangles.length > 0 ) {

			this.maxVolume = maxVolume;

		}

		// Recursively split the sub-volumes
		if ( minVolume.triangles.length > 8 && level < this.depth ) {

			minVolume.split( level + 1 );

		}

		if ( maxVolume.triangles.length > 8 && level < this.depth ) {

			maxVolume.split( level + 1 );

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

		this.build();

	}

	// Collects all triangles that intersect with the given ray.
	protected _getRayTriangles( ray: Ray, triangles: Triangle[] ): void {

		// minVolume check
		if ( this.minVolume && ray.intersectsBox( this.minVolume.box ) ) {

			if ( this.minVolume.triangles.length > 0 ) {

				for ( let j = 0; j < this.minVolume.triangles.length; j ++ ) {

					if ( triangles.indexOf( this.minVolume.triangles[ j ] ) === - 1 ) triangles.push( this.minVolume.triangles[ j ] );

				}

			} else {

				this.minVolume._getRayTriangles( ray, triangles );

			}

		}

		// maxVolume check
		if ( this.maxVolume && ray.intersectsBox( this.maxVolume.box ) ) {

			if ( this.maxVolume.triangles.length > 0 ) {

				for ( let j = 0; j < this.maxVolume.triangles.length; j ++ ) {

					if ( triangles.indexOf( this.maxVolume.triangles[ j ] ) === - 1 ) triangles.push( this.maxVolume.triangles[ j ] );

				}

			} else {

				this.maxVolume._getRayTriangles( ray, triangles );

			}

		}

	}

	// Collects all triangles that intersect the given capsule's bounding box.
	protected _getCapsuleTriangles( capsule: Capsule, triangles: Triangle[] ): void {

		// minVolume check
		if ( this.minVolume && capsule.intersectsBox( this.minVolume.box ) ) {

			if ( this.minVolume.triangles.length > 0 ) {

				for ( let j = 0; j < this.minVolume.triangles.length; j ++ ) {

					if ( triangles.indexOf( this.minVolume.triangles[ j ] ) === - 1 ) triangles.push( this.minVolume.triangles[ j ] );

				}

			} else {

				this.minVolume._getCapsuleTriangles( capsule, triangles );

			}

		}

		// maxVolume check
		if ( this.maxVolume && capsule.intersectsBox( this.maxVolume.box ) ) {

			if ( this.maxVolume.triangles.length > 0 ) {

				for ( let j = 0; j < this.maxVolume.triangles.length; j ++ ) {

					if ( triangles.indexOf( this.maxVolume.triangles[ j ] ) === - 1 ) triangles.push( this.maxVolume.triangles[ j ] );

				}

			} else {

				this.maxVolume._getCapsuleTriangles( capsule, triangles );

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

		this.minVolume = null;
		this.maxVolume = null;

		this.triangles = [];

		return this;

	}

}

export { BVH };
