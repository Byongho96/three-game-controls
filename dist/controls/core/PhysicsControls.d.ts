import { Vector3, Controls, type Object3D } from 'three';
import { Octree } from 'three/examples/jsm/math/Octree.js';
import { Collider } from '../../math/Collider.js';
export interface PhysicsControlsEventMap {
    collide: {
        type: 'collide';
        normal: Vector3;
    };
}
declare class PhysicsControls extends Controls<PhysicsControlsEventMap> {
    private _world;
    /** Octree structure of the world object for collision detection. */
    worldOctree: Octree;
    /** Gravitational force applied to the object.
     * @default 30
     */
    gravity: number;
    /** Maximum fall speed of the object.
     * @default 20
     */
    maxFallSpeed: number;
    /** Resistance applied to the object, dampen velocity.
     * @default 6
     */
    resistance: number;
    /** World axis velocity vector of the object.
     * @default `new THREE.Vector3()` - that is `(0, 0, 0)`
     */
    velocity: Vector3;
    /** Time step for calculating physics with more precision.
     * @default 5
     */
    step: number;
    /** Time threshold for determining if the object is landing. (sec)
     * @default 0.3
     */
    landTimeThreshold: number;
    /** Distance tolerance for landing detection.
     * @default 0.6
     */
    landTolerance: number;
    /** Collider for the object.
     * @default `new Collider()`
     */
    collider: Collider;
    /** Reset position for the object when it's out of the boundary
     * @default `new THREE.Vector3()` - that is `(0, 0, 0)`
     */
    resetPoint: Vector3;
    /** X-axis boundary: minimum value.
     * @default - Infinity
     */
    minXBoundary: number;
    /** X-axis boundary: maximum value.
     * @default Infinity
     */
    maxXBoundary: number;
    /** Y-axis boundary: minimum value.
     * @default - Infinity
     */
    minYBoundary: number;
    /** Y-axis boundary: maximum value.
     * @default Infinity
     */
    maxYBoundary: number;
    /** Z-axis boundary: minimum value.
     * @default - Infinity
     */
    minZBoundary: number;
    /** Z-axis boundary: maximum value.
     * @default Infinity
     */
    maxZBoundary: number;
    private _isLanding;
    private _isGrounded;
    private _ray;
    private _distance;
    private _objectWorldPosition;
    private _objectWorldQuaternion;
    private _colliderLocalPosition;
    /**
     * Constructs a new PhysicsControls instance.
     * @param object - The 3D object to apply physics controls to.
     * @param domElement - The HTML element for event listeners.
     * @param world - The world object used to build the collision octree.
     */
    constructor(object: Object3D, domElement?: HTMLElement | null, world?: Object3D | null);
    /**
     * Gets the current world object.
     */
    get world(): Object3D | null;
    /**
     * Sets a new world object and rebuilds the collision octree.
     * @param world - The new world object.
     */
    set world(world: Object3D | null);
    /**
     * Checks if the object is currently landing.
     */
    get isLanding(): boolean;
    /**
     * Checks if the object is currently grounded.
     */
    get isGrounded(): boolean;
    /**
     * Returns the velocity into the object's local coordinate system.
     * @param target - The result will be copied into this vector.
     */
    getLocalVelocity(target: Vector3): Vector3;
    protected _checkCollisions(): void;
    protected _checkIsLanding(): void;
    protected _teleportPlayerIfOutOfBounds(): void;
    /**
     * Calculate the physics collision calculations and update object state.
     * @param delta - The time elapsed since the last update (sec).
     */
    update(delta: number): void;
}
export { PhysicsControls };
