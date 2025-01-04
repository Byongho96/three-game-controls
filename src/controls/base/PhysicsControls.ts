import { Box3, Object3D, Ray, Vector3, Controls } from 'three';
import { Octree } from 'three/examples/jsm/math/Octree.js';
import { Collider } from '../../math/Collider.js';


export interface PhysicsControlsEventMap {

  collide: { type: 'collide', normal: Vector3 }; // Fires when the collider has collided with the world.

}

const _collideEvent = { type: 'collide' as const };


class PhysicsControls extends Controls<PhysicsControlsEventMap> {

	private _world: Object3D | null;

	/** Octree structure of the world object for collision detection. */
	worldOctree: Octree = new Octree();

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

	/** Time threshold for determining if the object is landing.
	 * @default 250
	*/
	landTimeThreshold: number = 250;

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

	/**
   * Constructs a new PhysicsControls instance.
   * @param object - The 3D object to apply physics controls to.
   * @param domElement - The HTML element for event listeners.
   * @param world - The world object used to build the collision octree.
   */
	constructor( object: Object3D, domElement: HTMLElement | null = null, world: Object3D | null = null ) {

		super( object, domElement );

		this._world = world;
		if ( world ) this.worldOctree.fromGraphNode( world );

		// Set the collider size based on the object's bounding box.
		const objectSize = new Vector3();
		new Box3().setFromObject( this.object ).getSize( objectSize );
		this.collider.radius = objectSize.y / 4;
		this.collider.length = objectSize.y / 2;

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
		if ( world ) this.worldOctree.fromGraphNode( world );

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

	// Check for collisions and translate the collider.
	private _checkCollisions(): void {

		this._isGrounded = false;

		const collisionResult = this.worldOctree.capsuleIntersect( this.collider );	// Check for collisions with the world octree.

		if ( ! collisionResult ) return;

		if ( collisionResult.normal.y > 0 ) this._isGrounded = true;

		if ( collisionResult.depth >= 1e-10 ) {

			this.collider.translate( collisionResult.normal.multiplyScalar( collisionResult.depth ) );
			this.dispatchEvent( { ..._collideEvent, normal: collisionResult.normal.normalize() as Vector3 } );

		}

	}

	// Check if the object is landing based on the landTimeThreshold.
	private _checkIsLanding(): void {

		this._isLanding = false;

		if ( this._isGrounded || this.velocity.y >= 0 ) return;

		this._ray.origin.copy( this.collider.start ).y -= this.collider.radius;
		const rayResult = this.worldOctree.rayIntersect( this._ray );

		if ( Math.abs( rayResult.distance / - this._distance.y - this.landTimeThreshold ) < 50 ) {

			this._isLanding = true;

		}

	}

	// Teleport the player back to the reset point if it's out of the boundary.
	private _teleportPlayerIfOutOfBounds(): void {

		const { x: px, y: py, z: pz } = this.object.position;


		if ( px < this.minXBoundary || px > this.maxXBoundary || py < this.minYBoundary || py > this.maxYBoundary || pz < this.minZBoundary || pz > this.maxZBoundary ) {

			this.collider.translate( this._distance.subVectors( this.resetPoint, this.object.position ) );
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

			this.velocity.addScaledVector( this.velocity, damping );

			this._distance.copy( this.velocity ).multiplyScalar( stepDelta );
			this.collider.translate( this._distance );

			this._checkCollisions();

		}

		this._checkIsLanding();

		this._teleportPlayerIfOutOfBounds();

		// Sync the object's position with the collider.
		this.object.position.copy( this.collider.start );
		this.object.position.y -= this.collider.radius;

	}

}

export { PhysicsControls };
