import {
	AnimationAction,
	AnimationMixer,
	Box3,
	LoopOnce,
	OrthographicCamera,
	PerspectiveCamera,
	Spherical,
	Vector3,
	type AnimationClip,
	type Camera,
	type Object3D,
} from 'three';
import { FirstPersonControls } from './FirstPersonControls';

type Animation = 'IDLE' | 'MOVE_FORWARD' | 'RUN_FORWARD' | 'MOVE_BACKWARD' | 'RUN_BACKWARD' | 'MOVE_LEFTWARD' | 'RUN_LEFTWARD' | 'MOVE_RIGHTWARD' | 'RUN_RIGHTWARD' | 'JUMP_UP' | 'LAND' | 'FALL';

export type AnimationClips = Partial<Record<Animation, AnimationClip>>;

const _worldYDirection = new Vector3( 0, 1, 0 );
class ThirdPersonControls extends FirstPersonControls {

	// Animation mixer for the object
	private _animationMixer: AnimationMixer;

	// Animation clips
	private _animationClips: Record<string, AnimationClip> = {};

	// Animation actions synced with the clips
	private _animationActions: Record<string, AnimationAction> = {};

	// Override the eye height  of FirstPersonControls
	eyeHeight: number = 0;

	/** Time for transitioning between animations. */
	transitionTime: number = 0.3;

	/** Delay for transitioning between animations. */
	transitionDelay: number = 0.3;

	/** Speed threshold to trigger the falling animation. */
	fallSpeedThreshold: number = 15;

	/** Speed threshold to trigger the moving animation. */
	moveSpeedThreshold: number = 1;

	/** Speed threshold to trigger running animations. */
	runSpeedThreshold: number = 8;

	/** The camera used for third-person perspective. */
	camera: Camera | null;

	/** Offset for the camera position relative to the object. */
	cameraPositionOffset: Vector3;

	/** Offset for the camera look-at position relative to the object. */
	cameraLookAtOffset: Vector3;

	/** Lerp factor for smooth camera transitions.
	 * @default 1
	 */
	cameraLerpFactor: number = 1;

	/** Whether to rotate the object towards the moving direction.
	 * @default true
	 */
	enableRotationOnMove: boolean = true;

	/** The value that determines when to synchronize the object's directional coordinates with the camera's directional coordinates.
	 *
	 * Possible values:
	 * - `'ALWAYS'`: The object's forward axis is always synchronized with the camera, regardless of movement.
	 * - `'MOVE'`: The object's forward axis is synchronized with the camera only when the object is moving.
	 * - `'NEVER'`: The object's forward axis is not synchronized with the camera.
	 *
	 * @default 'MOVE'
	 */
	syncAxisWithCamera : 'ALWAYS' | 'MOVE' | 'NEVER' = 'MOVE';

	/* Spherical coordinates for camera position.
	 * @default `new THREE.Spherical()`
	 */
	protected _spherical: Spherical = new Spherical();


	// Internals
	private _forwardDirection: Vector3 = new Vector3();
	private _objectLocalVelocity: Vector3 = new Vector3();
	private _objectLookAtPosition: Vector3 = new Vector3();
	private _movementDirection: Vector3 = new Vector3();

	private _currentActionKey: Animation | null = null;

	private _cameraLookAtPosition: Vector3 = new Vector3();
	private _cameraOffsetPosition: Vector3 = new Vector3();

	/**
	 * Constructs a new ThirdPersonControls instance.
	 * @param object - The character object to control.
	 * @param domElement - The HTML element for capturing input events.
	 * @param world - The world object used for collision detection.
	 * @param animationClips - The animation clips for the character.
	 * @param camera - The camera to use for third-person perspective.
	 */
	constructor(
		object: Object3D,
		domElement: HTMLElement | null = null,
		world: Object3D | null = null,
		animationClips : AnimationClips = {},
		camera: Camera | null = null,
	) {

		super( object, domElement, world );

		this._animationMixer = new AnimationMixer( this.object );

		Object.entries( animationClips ).forEach( ( [ key, clip ] ) => {

			this.setAnimationClip( key, clip );

		} );

		this.camera = camera;

		// Set the camera position and look-at offsets based on the object size.
		const objectSize = new Vector3();
		new Box3().setFromObject( this.object ).getSize( objectSize );

		this.cameraPositionOffset = new Vector3( 0, objectSize.y * 1.5, - objectSize.y * 1.5 );
		this.cameraLookAtOffset = new Vector3( 0, objectSize.y * 0.8, 0 );

		// Set the spherical coordinates.
		const subVector = this.cameraPositionOffset.clone().sub( this.cameraLookAtOffset );
		this._spherical.setFromVector3( subVector );

		this.collider.radius = objectSize.y / 4;
		this.collider.length = objectSize.y / 2;

	}


	/**
	 * Gets a frozen copy of the animation clips.
	 */
	get animationClips(): Readonly<Record<string, AnimationClip>> {

		return Object.freeze( { ...this._animationClips } );

	}

	/**
	 * Returns the forward direction vector of the object.
	 * @param target - The result will be copied into this vector.
	 */
	getForwardVector( target: Vector3 ): Vector3 {

		target.copy( this._forwardDirection );
		return target;

	}

	/**
		 * Returns the right direction vector of the object.
		 * @param target - The result will be copied into this vector.
		 */
	getRightwardVector( target: Vector3 ): Vector3 {

		target.copy( this._forwardDirection );
		target.cross( _worldYDirection );
		return target;

	}


	/**
	 * Sets an animation clip for a given key.
	 * @param key - The key to associate with the animation clip.
	 * @param clip - The animation clip.
	 */
	setAnimationClip( key: string, clip: AnimationClip ): void {

		const action = this._animationMixer.clipAction( clip );

		this._animationClips[ key ] = clip;
		this._animationActions[ key ] = action;

	}

	/**
	 * Deletes an animation clip associated with a given key.
	 * @param key - The key of the animation clip to delete.
	 */
	deleteAnimationClip( key: string ): void {

		const clip = this._animationClips[ key ];
		const action = this._animationActions[ key ];

		if ( action ) {

			action.stop();
			this._animationMixer.uncacheAction( clip, this.object );
			delete this._animationActions[ key ];

		}

		if ( clip ) {

			this._animationMixer.uncacheClip( clip );
			delete this._animationClips[ key ];

		}

	}

	/**
	 * Gets the animation action associated with a given key.
	 * @param key - The key of the animation action to retrieve.
	 */
	getAnimationAction( key: string ): AnimationAction | undefined {

		return this._animationActions[ key ];

	}

	// Fades to a new animation action
	protected _fadeToAction( key: Animation, duration: number, isOnce?: boolean ): void {

		if ( key === this._currentActionKey ) return;

		const action = this._animationActions[ key ];
		if ( ! action ) return;

		const currentAction = this._currentActionKey ? this._animationActions[ this._currentActionKey ] : null;
		if ( currentAction ) currentAction.fadeOut( duration );

		action.reset();

		if ( isOnce ) {

			action.setLoop( LoopOnce, 1 );
			action.clampWhenFinished = true;

		}

		action.fadeIn( duration );
		action.play();

		this._currentActionKey = key;

	}

	protected _syncForwardDirection(): void {

		if ( ! this.camera ) return;

		if ( this.syncAxisWithCamera === 'NEVER' ) return;

		if ( this.syncAxisWithCamera === 'ALWAYS' || this.actionStates.MOVE_FORWARD || this.actionStates.MOVE_BACKWARD || this.actionStates.MOVE_LEFTWARD || this.actionStates.MOVE_RIGHTWARD ) {

			this.camera.getWorldDirection( this._forwardDirection );
			this._forwardDirection.y = 0;
			this._forwardDirection.normalize();

			return;

		}

	}

	protected _updateObjectDirection() {

		this._movementDirection.copy( this.velocity );
		this._movementDirection.y = 0;
		this.object.getWorldPosition( this._objectLookAtPosition );

		// rotate on move
		if ( this._movementDirection.length() > 1e-2 && this.enableRotationOnMove ) {

			this._objectLookAtPosition.add( this._movementDirection );
			this.object.lookAt( this._objectLookAtPosition );
			return;

		}

		// rotate by sync
		if ( this.syncAxisWithCamera === 'ALWAYS' || this._movementDirection.length() > 1e-2 ) {

			this._objectLookAtPosition.add( this._forwardDirection );
			this.object.lookAt( this._objectLookAtPosition );
			return;

		}

	}

	protected _lerpCameraPosition( ): void {

		if ( ! this.camera ) return;

		this._spherical.radius = this.cameraPositionOffset.distanceTo( this.cameraLookAtOffset );

		this.object.getWorldPosition( this._cameraLookAtPosition ).add( this.cameraLookAtOffset );
		this._cameraOffsetPosition.setFromSpherical( this._spherical ).add( this._cameraLookAtPosition );

		this.camera.position.lerp( this._cameraOffsetPosition, this.cameraLerpFactor );
		this.camera.lookAt( this._cameraLookAtPosition );

		this.camera.updateMatrixWorld();

	}

	// Updates the animation based on the character's state
	protected _updateAnimation( ): void {

		this.getLocalVelocity( this._objectLocalVelocity );

		if ( this._objectLocalVelocity.y > 0 && this._animationActions.JUMP_UP ) {

			return this._fadeToAction( 'JUMP_UP', this.transitionTime, true );

		}

		if ( this.isLanding && this._animationActions.LAND ) {

			return this._fadeToAction( 'LAND', this.transitionTime, true );

		}

		if ( this.velocity.y < - this.fallSpeedThreshold && this._currentActionKey !== 'LAND' && this._animationActions.FALL ) {

			return this._fadeToAction( 'FALL', this.transitionTime );

		}

		if ( ! this.isGrounded ) {

			return;

		}

		if ( this._objectLocalVelocity.z > this.runSpeedThreshold && this._animationActions.RUN_FORWARD ) {

			return this._fadeToAction( 'RUN_FORWARD', this.transitionTime );

		}

		if ( this._objectLocalVelocity.z > this.moveSpeedThreshold && this._animationActions.MOVE_FORWARD ) {

			return this._fadeToAction( 'MOVE_FORWARD', this.transitionTime );

		}

		if ( this._objectLocalVelocity.z < - this.runSpeedThreshold && this._animationActions.RUN_BACKWARD ) {

			return this._fadeToAction( 'RUN_BACKWARD', this.transitionTime );

		}

		if ( this._objectLocalVelocity.z < - this.moveSpeedThreshold && this._animationActions.MOVE_BACKWARD ) {

			return this._fadeToAction( 'MOVE_BACKWARD', this.transitionTime );

		}

		if ( this._objectLocalVelocity.x < - this.runSpeedThreshold && this._animationActions.RUN_RIGHTWARD ) {

			return this._fadeToAction( 'RUN_RIGHTWARD', this.transitionTime );

		}

		if ( this._objectLocalVelocity.x < - this.moveSpeedThreshold && this._animationActions.MOVE_RIGHTWARD ) {

			return this._fadeToAction( 'MOVE_RIGHTWARD', this.transitionTime );

		}

		if ( this._objectLocalVelocity.x > this.runSpeedThreshold && this._animationActions.RUN_LEFTWARD ) {

			return this._fadeToAction( 'RUN_LEFTWARD', this.transitionTime );

		}

		if ( this._objectLocalVelocity.x > this.moveSpeedThreshold && this._animationActions.MOVE_LEFTWARD ) {

			return this._fadeToAction( 'MOVE_LEFTWARD', this.transitionTime );

		}


		return this._fadeToAction( 'IDLE', this.transitionTime );

	}


	protected _updateRotation( delta: number ): void {

		const deltaSpeed = this.rotateSpeed * delta;

		if ( this.actionStates.ROTATE_UP	) this._spherical.phi += this.actionStates.ROTATE_UP * deltaSpeed;

		if ( this.actionStates.ROTATE_DOWN ) this._spherical.phi -= this.actionStates.ROTATE_DOWN * deltaSpeed;

		if ( this.actionStates.ROTATE_RIGHT )	this._spherical.theta -= this.actionStates.ROTATE_RIGHT * deltaSpeed;

		if ( this.actionStates.ROTATE_LEFT ) this._spherical.theta += this.actionStates.ROTATE_LEFT * deltaSpeed;

		const maxPolarAngle = this.maxTiltAngle + Math.PI / 2;
		const minPolarAngle = this.minTiltAngle + Math.PI / 2;
		this._spherical.phi = Math.max( minPolarAngle, Math.min( maxPolarAngle, this._spherical.phi ) );
		this._spherical.makeSafe();

	}

	/**
	 * Updates the character's state, including physics and animations.
	 * @param delta - The time elapsed since the last update (sec).
	 */
	update( delta: number ): void {

		super.update( delta );

		this._updateAnimation();

		this._animationMixer.update( delta );

		this._syncForwardDirection();

		this._updateObjectDirection();

		this._lerpCameraPosition();

	}

	/**
	 * Disposes of the character controls, cleaning up animations and resources.
	 */
	dispose(): void {

		super.dispose();

		this._animationMixer.stopAllAction();
		this._animationMixer.uncacheRoot( this.object );

	}

	// Handles the mouse wheel event for zooming the camera.
	protected _onMouseWheel( event: WheelEvent ): void {

		if ( ! this.enableZoom ) return;

		if ( ! ( this.camera instanceof PerspectiveCamera ) && ! ( this.camera instanceof OrthographicCamera ) ) {

			console.warn( 'WARNING: FirstPersonControls.js encountered an unknown camera type - dolly/zoom disabled.' );
			this.enableZoom = false;

			return;

		}

		const normalizedDelta = Math.pow( 0.95, this.zoomSpeed * Math.abs( event.deltaY * 0.01 ) );

		if ( event.deltaY > 0 ) this.camera.zoom *= normalizedDelta;
		else if ( event.deltaY < 0 ) this.camera.zoom /= normalizedDelta;

		this.camera.zoom = Math.max( this.minZoom, Math.min( this.maxZoom, this.camera.zoom ) );

		this.camera.updateProjectionMatrix();

	}

}

export { ThirdPersonControls };
