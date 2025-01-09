import { AnimationAction, Spherical, Vector3, type AnimationClip, type Camera, type Object3D } from 'three';
import { FirstPersonControls } from './FirstPersonControls';
type Animation = 'IDLE' | 'MOVE_FORWARD' | 'RUN_FORWARD' | 'MOVE_BACKWARD' | 'RUN_BACKWARD' | 'MOVE_LEFTWARD' | 'RUN_LEFTWARD' | 'MOVE_RIGHTWARD' | 'RUN_RIGHTWARD' | 'JUMP_UP' | 'LAND' | 'FALL';
export type AnimationClips = Partial<Record<Animation, AnimationClip>>;
declare class ThirdPersonControls extends FirstPersonControls {
    private _animationMixer;
    private _animationClips;
    private _animationActions;
    eyeHeight: number;
    /** Time for transitioning between animations. */
    transitionTime: number;
    /** Delay for transitioning between animations. */
    transitionDelay: number;
    /** Speed threshold to trigger the falling animation. */
    fallSpeedThreshold: number;
    /** Speed threshold to trigger the moving animation. */
    moveSpeedThreshold: number;
    /** Speed threshold to trigger running animations. */
    runSpeedThreshold: number;
    /** The camera used for third-person perspective. */
    camera: Camera | null;
    /** Offset for the camera position relative to the object. */
    cameraPositionOffset: Vector3;
    /** Offset for the camera look-at position relative to the object. */
    cameraLookAtOffset: Vector3;
    /** Lerp factor for smooth camera transitions.
     * @default 0.2
     */
    cameraLerpFactor: number;
    /** Whether to rotate the object towards the moving direction.
     * @default true
     */
    enableRotationOnMove: boolean;
    /** Whether to sync the object's forward axis with the camera.
     *
     * Possible values:
     * - `'ALWAYS'`: The object's forward axis is always synchronized with the camera, regardless of movement.
     * - `'MOVE'`: The object's forward axis is synchronized with the camera only when the object is moving.
     * - `'NEVER'`: The object's forward axis is not synchronized with the camera.
     *
     * @default 'move'
     */
    syncAxisWithCamera: 'ALWAYS' | 'MOVE' | 'NEVER';
    protected _spherical: Spherical;
    private _forwardDirection;
    private _objectLocalVelocity;
    private _objectLookAtPosition;
    private _movementDirection;
    private _currentActionKey;
    private _cameraLookAtPosition;
    private _cameraOffsetPosition;
    /**
     * Constructs a new ThirdPersonControls instance.
     * @param object - The character object to control.
     * @param domElement - The HTML element for capturing input events.
     * @param world - The world object used for collision detection.
     * @param animationClips - The animation clips for the character.
     * @param camera - The camera to use for third-person perspective.
     */
    constructor(object: Object3D, domElement?: HTMLElement | null, world?: Object3D | null, animationClips?: AnimationClips, camera?: Camera | null);
    /**
     * Gets a frozen copy of the animation clips.
     */
    get animationClips(): Readonly<Record<string, AnimationClip>>;
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
    /**
     * Sets an animation clip for a given key.
     * @param key - The key to associate with the animation clip.
     * @param clip - The animation clip.
     */
    setAnimationClip(key: string, clip: AnimationClip): void;
    /**
     * Deletes an animation clip associated with a given key.
     * @param key - The key of the animation clip to delete.
     */
    deleteAnimationClip(key: string): void;
    /**
     * Gets the animation action associated with a given key.
     * @param key - The key of the animation action to retrieve.
     */
    getAnimationAction(key: string): AnimationAction | undefined;
    protected _fadeToAction(key: Animation, duration: number, isOnce?: boolean): void;
    protected _syncForwardDirection(): void;
    protected _updateObjectDirection(): void;
    protected _lerpCameraPosition(): void;
    protected _updateAnimation(): void;
    protected _updateRotation(delta: number): void;
    /**
     * Updates the character's state, including physics and animations.
     * @param delta - The time elapsed since the last update (sec).
     */
    update(delta: number): void;
    /**
     * Disposes of the character controls, cleaning up animations and resources.
     */
    dispose(): void;
    protected _onMouseWheel(event: WheelEvent): void;
}
export { ThirdPersonControls };
