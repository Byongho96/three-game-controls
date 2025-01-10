import { Vector3, type Object3D } from 'three';
import { PhysicsControls } from '../base/PhysicsControls';
export type Action = 'MOVE_FORWARD' | 'MOVE_BACKWARD' | 'MOVE_LEFTWARD' | 'MOVE_RIGHTWARD' | 'JUMP' | 'ACCELERATE' | 'ROTATE_UP' | 'ROTATE_DOWN' | 'ROTATE_RIGHT' | 'ROTATE_LEFT';
declare class FirstPersonControls extends PhysicsControls {
    actionStates: Record<string, number>;
    /** Height of the camera from the ground
     * @default 1.5
     */
    eyeHeight: number;
    /** Force applied for jumping.
     * @default 15
     */
    jumpForce: number;
    /** Speed of movement when grounded.
     * @default 30
     */
    groundedMoveSpeed: number;
    /** Speed of movement when floating.
     * @default 8
     */
    floatingMoveSpeed: number;
    /** Speed of rotation.
     * @default 1
     */
    rotateSpeed: number;
    /** Maximum rotation tilt-up angle (radians).
     * @default Math.PI / 2
     */
    maxTiltAngle: number;
    /** Minimum rotation tilt-down angle (radians).
     * @default -Math.PI / 2
     */
    minTiltAngle: number;
    /** Whether to enable acceleration when holding the accelerate key.
     * @default true
     */
    enableAcceleration: boolean;
    /** Multiplier for movement speed when accelerating.
     * @default 1.5
     */
    accelerationFactor: number;
    /** Whether to enable zooming with the mouse wheel.
     * @default true
     */
    enableZoom: boolean;
    /** Speed of zooming.
     * @default 1
     */
    zoomSpeed: number;
    /** Minimum zoom level.
     * @default 0
     */
    minZoom: number;
    /** Maximum zoom level.
         * @default Infinity
         */
    maxZoom: number;
    private _movementVector;
    private _objectLocalVector;
    private _bindOnMouseWheel;
    /**
     * Constructs a new FirstPersonControls instance.
     * @param object - The object to control.
     * @param domElement - The DOM element for capturing input.
     * @param world - The world object used for collision detection.
     */
    constructor(object: Object3D, domElement?: HTMLElement | null, world?: Object3D | null);
    /**
     * Returns the forward direction vector of the object.
     * @param target - The result will be copied into this vector.
     */
    getForwardVector(target: Vector3): Vector3;
    /**
         * Returns the right direction vector of the object.
         * @param target - The result will be copied into this vector.
         */
    getRightwardVector(target: Vector3): Vector3;
    protected _updateMovement(delta: number): void;
    protected _updateRotation(delta: number): void;
    /**
     * Update the controls.
     * @param delta - The time elapsed since the last update (sec).
     */
    update(delta: number): void;
    /**
     * Connects the event listeners.
     */
    connect(): void;
    /**
     * Disconnects the event listeners.
     */
    disconnect(): void;
    protected _onMouseWheel(event: WheelEvent): void;
}
export { FirstPersonControls };
