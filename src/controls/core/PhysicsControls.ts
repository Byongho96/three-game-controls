import { Ray, Vector3, Controls, type Object3D, Quaternion } from 'three';
import { BVH } from '../../math/BVH';
import { Collider } from '../../math/Collider';


export interface PhysicsControlsEventMap {

	collide: { type: 'collide', normal: Vector3 }; // Fires when the collider has collided with the world.

}

const _collideEvent = { type: 'collide' as const };

class PhysicsControls extends Controls<PhysicsControlsEventMap> {

	private _world: Object3D | null = null;

	/** BVH structure of the world object for collision detection. */
	worldBVH: BVH = new BVH();

	/** Gravitational force applied to the object.
	 * @default 30
	 */
	gravity: number = 30;

	/** Maximum fall speed of the object.
	 * @default 20
	 */
	maxFallSpeed: number = 20;

	/** Resistance applied to the object, dampen velocity.
	 * @default 6
	 */
	resistance: number = 6;

	/** World axis velocity vector of the object.
	 * @default `new THREE.Vector3()` - that is `(0, 0, 0)`
	 */
	velocity: Vector3 = new Vector3();

	/** Time step for calculating physics with more precision.
	 * @default 5
	 */
	step: number = 5;

	/** Time threshold for determining if the object is landing. (sec)
	 * @default 0.3
	 */
	landTimeThreshold: number = 0.3;

	/** Distance tolerance for landing detection.
	 * @default 0.6
	 */
	landTolerance: number = 0.6;

	/** Collider for the object.
	 * @default `new Collider()`
	 */
	collider: Collider = new Collider();

	/** Reset position for the object when it's out of the boundary
	 * @default `new THREE.Vector3()` - that is `(0, 0, 0)`
	 */
	resetPoint: Vector3 = new Vector3();

	/** X-axis boundary: minimum value.
	 * @default - Infinity
	 */
	minXBoundary: number = - Infinity;

	/** X-axis boundary: maximum value.
	 * @default Infinity
	 */
	maxXBoundary: number = Infinity;

	/** Y-axis boundary: minimum value.
	 * @default - Infinity
	 */
	minYBoundary: number = - Infinity;

	/** Y-axis boundary: maximum value.
	 * @default Infinity
	 */
	maxYBoundary: number = Infinity;

	/** Z-axis boundary: minimum value.
	 * @default - Infinity
	 */
	minZBoundary: number = - Infinity;

	/** Z-axis boundary: maximum value.
	 * @default Infinity
	 */
	maxZBoundary: number = Infinity;

	// Flags
	private _isLanding: boolean = false;
	private _isGrounded: boolean = false;

	// Internals
	private _ray: Ray = new Ray( new Vector3(), new Vector3( 0, - 1, 0 ) );
	private _distance: Vector3 = new Vector3();

	private _objectWorldPosition: Vector3 = new Vector3();
	private _objectWorldQuaternion: Quaternion = new Quaternion();
	private _colliderLocalPosition: Vector3 = new Vector3();

	/**
	 * Constructs a new PhysicsControls instance.
	 * @param object - The 3D object to apply physics controls to.
	 * @param domElement - The HTML element for event listeners.
	 * @param world - The world object used to build the collision octree.
	 */
	constructor( object: Object3D, domElement: HTMLElement | null = null, world: Object3D | null = null ) {

		super( object, domElement );

		this.world = world;

	}

	/**
	 * Gets the current world object.
	 */
	get world(): Object3D | null {

		return this._world;

	}

	/**
	 * Sets a new world object and rebuilds the collision octree.
	 * @param world - The new world object.
	 */
	set world( world: Object3D | null ) {

		this._world = world;

		if ( world ) {

			this.worldBVH.clear();
			this.worldBVH.buildFromObject( world );

		}

	}

	/**
	 * Checks if the object is currently landing.
	 */
	get isLanding(): boolean {

		return this._isLanding;

	}

	/**
	 * Checks if the object is currently grounded.
	 */
	get isGrounded(): boolean {

		return this._isGrounded;

	}

	/**
	 * Returns the velocity into the object's local coordinate system.
	 * @param target - The result will be copied into this vector.
	 */
	getLocalVelocity( target: Vector3 ): Vector3 {

		this.object.getWorldQuaternion( this._objectWorldQuaternion );
		return target.copy( this.velocity ).applyQuaternion( this._objectWorldQuaternion.invert() );

	}


	// Check for collisions and translate the collider.
	protected _checkCollisions(): void {

		this._isGrounded = false;

		const collisionResult = this.worldBVH.capsuleIntersect( this.collider );	// Check for collisions with the world octree.

		if ( ! collisionResult ) return;

		if ( collisionResult.normal.y > 0 ) {

			this._isGrounded = true;
			this.velocity.y = 0;

		}

		if ( collisionResult.depth >= 1e-10 ) {

			this.collider.translate( collisionResult.normal.multiplyScalar( collisionResult.depth * 1.01 ) );
			this.dispatchEvent( { ..._collideEvent, normal: collisionResult.normal.normalize() as Vector3 } );

		}

	}

	// Check if the object is landing based on the landTimeThreshold.
	protected _checkIsLanding(): void {

		this._isLanding = false;

		if ( this._isGrounded || this.velocity.y >= 0 ) return;

		this._ray.origin.copy( this.collider.start ).y -= this.collider.radius;
		const rayResult = this.worldBVH.rayIntersect( this._ray );

		if ( ! rayResult ) return;

		const t1 = Math.min( ( this.maxFallSpeed + this.velocity.y ) / this.gravity, this.landTimeThreshold );
		const d1 = ( - this.velocity.y + 0.5 * this.gravity * t1 ) * t1;

		const t2 = this.landTimeThreshold - t1;
		const d2 = this.maxFallSpeed * t2;

		if ( this.landTolerance < rayResult.distance && rayResult.distance < d1 + d2 ) {

			this._isLanding = true;

		}

	}

	// Teleport the player back to the reset point if it's out of the boundary.
	protected _teleportPlayerIfOutOfBounds(): void {

		const { x: px, y: py, z: pz } = this.object.getWorldPosition( this._objectWorldPosition );


		if ( px < this.minXBoundary || px > this.maxXBoundary || py < this.minYBoundary || py > this.maxYBoundary || pz < this.minZBoundary || pz > this.maxZBoundary ) {

			this.collider.translate( this._distance.subVectors( this.resetPoint, this._objectWorldPosition ) );
			this.velocity.set( 0, 0, 0 );

		}

	}

	/**
	 * Calculate the physics collision calculations and update object state.
	 * @param delta - The time elapsed since the last update (sec).
	 */
	update( delta: number ): void {

		super.update( delta );

		if ( ! this.enabled ) return;

		const stepDelta = delta / this.step;

		for ( let i = 0; i < this.step; i ++ ) {

			let damping = Math.exp( - this.resistance * stepDelta ) - 1; // Always negative (resistance)

			if ( ! this._isGrounded ) {

				this.velocity.y -= this.gravity * stepDelta;
				this.velocity.y = Math.max( this.velocity.y, - this.maxFallSpeed );
				damping *= 0.1; // Small air resistance

			}

			this.velocity.x += damping * this.velocity.x;
			this.velocity.z += damping * this.velocity.z;

			this._distance.copy( this.velocity ).multiplyScalar( stepDelta );
			this.collider.translate( this._distance );

			this._checkCollisions();

		}

		this._checkIsLanding();

		this._teleportPlayerIfOutOfBounds();

		// Sync the object's position with the collider.
		this._colliderLocalPosition.copy( this.collider.start );
		this._colliderLocalPosition.y -= this.collider.radius;
		if ( this.object.parent ) this.object.parent.worldToLocal( this._colliderLocalPosition );
		this.object.position.copy( this._colliderLocalPosition );


	}

	dispose() {

		super.dispose();

		this.worldBVH.clear();

	}

}

export { PhysicsControls };
