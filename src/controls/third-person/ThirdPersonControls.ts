import { Box3, Camera, Object3D, OrthographicCamera, PerspectiveCamera, Spherical, Vector3 } from 'three';
import { PhysicsCharacterControls, AnimationClips } from '../base/PhysicsCharacterControls';

type Actions = 'forward' | 'backward' | 'leftward' | 'rightward' | 'jump' | 'accelerate';

type ActionKeys = {
  [K in Actions]?: string[];
};


class ThirdPersonControls extends PhysicsCharacterControls {

	/** Keyboard keys mapped to actions
	 * @default { forward: [ 'KeyW' ], backward: [ 'KeyS' ], leftward: [ 'KeyA' ], rightward: [ 'KeyD' ], jump: [ 'Space' ], accelerate: [ 'ShiftLeft' ] }
	 */
	actionKeys: ActionKeys = {
		forward: [ 'KeyW' ],
		backward: [ 'KeyS' ],
		leftward: [ 'KeyA' ],
		rightward: [ 'KeyD' ],
		jump: [ 'Space' ],
		accelerate: [ 'ShiftLeft' ],
	};

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

	/** Whether to sync the object's forward axis with the camera.
	 *
	 * Possible values:
	 * - `'always'`: The object's forward axis is always synchronized with the camera, regardless of movement.
	 * - `'move'`: The object's forward axis is synchronized with the camera only when the object is moving.
	 * - `'never'`: The object's forward axis is not synchronized with the camera.
	 *
	 * @default 'move'
	 */
	syncAxisWithCamera : 'always' | 'move' | 'never' = 'move';

	/** Force applied for jumping.
	 * @default 15
	 */
	jumpForce: number = 15;

	/** Speed of movement when grounded.
	 * @default 30
	 */
	groundedMoveSpeed: number = 30;

	/** Speed of movement when floating.
	 * @default 8
	 */
	floatingMoveSpeed: number = 8;

	/** Speed of camera rotation.
	 * @default 1
	 */
	rotateSpeed: number = 1;

	/** Minimum camera polar angle.
	 * @default 0
	 */
	minPolarAngle: number = 0;

	/** Maximum camera polar angle.
	 * @default Math.PI
	 */
	maxPolarAngle: number = Math.PI;

	/** Whether to rotate the object towards the moving direction.
	 * @default true
	 */
	enableRotationOnMove: boolean = true;

	/** Whether to allow diagonal movement when pressing two action keys.
	 * @default true
	 */
	enableDiagonalMovement: boolean = true;

	/** Whether to enable acceleration when holding the accelerate key.
	 * @default true
	 */
	enableAcceleration: boolean = true;

	/** Multiplier for movement speed when accelerating.
	 * @default 1.5
	 */
	accelerationFactor: number = 1.5;

	/** Whether to enable zooming with the mouse wheel.
	 * @default true
	 */
	enableZoom: boolean = true;

	/** Minimum zoom level.
	 * @default 0
	 */
	minZoom: number = 0;

	/** Maximum zoom level.
	 * @default Infinity
	 */
	maxZoom: number = Infinity;

	/** Speed of zooming.
	 * @default 1
	 */
	zoomSpeed: number = 1;

	/* Spherical coordinates for camera position.
	 * @default `new THREE.Spherical()`
	 */
	protected _spherical: Spherical = new Spherical();

	// Internals but accessed by handlers
	_actionKeyStates: Record<Actions, number> = {
		forward: 0,
		backward: 0,
		leftward: 0,
		rightward: 0,
		jump: 0,
		accelerate: 0,
	};

	_actionKeyCount: number = 0;

	// Internals
	private _forwardDirection: Vector3 = new Vector3();
	private _objectLocalVector: Vector3 = new Vector3();
	private _movingDirection: Vector3 = new Vector3();
	private _objectLookAtPosition: Vector3 = new Vector3();
	private _cameraLookAtPosition: Vector3 = new Vector3();
	private _cameraOffsetPosition: Vector3 = new Vector3();


	// Event handlers
	private _onKeyDown: ( event: KeyboardEvent ) => void;
	private _onKeyUp: ( event: KeyboardEvent ) => void;
	private _onBlur: ( ) => void;
	private _onMouseWheel: ( event: WheelEvent ) => void;

	/**
   * Constructs a new ThirdPersonControls instance.
   * @param object - The object to control.
   * @param domElement - The HTML element for capturing input events.
   * @param world - The world object used for collision detection.
   * @param animationClips - Animation clips for the object.
   * @param camera - The camera to use for third-person perspective.
   */
	constructor(
		object: Object3D,
		domElement: HTMLElement | null = null,
		world: Object3D | null = null,
		animationClips : AnimationClips = {},
		camera: Camera | null = null,
	) {

		super( object, domElement, world, animationClips );

		this.camera = camera;

		// Set the camera position and look-at offsets based on the object size.
		const objectSize = new Vector3();
		new Box3().setFromObject( this.object ).getSize( objectSize );
		this.cameraPositionOffset = new Vector3( 0, objectSize.y * 1.5, - objectSize.y * 1.5 );
		this.cameraLookAtOffset = new Vector3( 0, objectSize.y * 0.8, 0 );

		// Set the spherical coordinates.
		const subVector = this.cameraPositionOffset.clone().sub( this.cameraLookAtOffset );
		this._spherical.setFromVector3( subVector );

		this._onKeyDown = onKeyDown.bind( this );
		this._onKeyUp = onKeyUp.bind( this );
		this._onBlur = onBlur.bind( this );
		this._onMouseWheel = onMouseWheel.bind( this );

		this.connect();

	}

	private _getForwardVector(): Vector3 {

		this._objectLocalVector.copy( this._forwardDirection );
		this._objectLocalVector.y = 0;
		this._objectLocalVector.normalize();

		return this._objectLocalVector;

	}

	private _getSideVector(): Vector3 {

		this._objectLocalVector.copy( this._forwardDirection );
		this._objectLocalVector.y = 0;
		this._objectLocalVector.normalize();
		this._objectLocalVector.cross( this.object.up );

		return this._objectLocalVector;

	}

	private _accumulateDirection(): Vector3 {

		this._movingDirection.set( 0, 0, 0 );

		if ( this._actionKeyStates.forward ) {

			this._movingDirection.add( this._getForwardVector() );

		}

		if ( this._actionKeyStates.backward ) {

			this._movingDirection.add( this._getForwardVector().multiplyScalar( - 1 ) );

		}

		if ( this._actionKeyStates.leftward ) {

			this._movingDirection.add( this._getSideVector().multiplyScalar( - 1 ) );

		}

		if ( this._actionKeyStates.rightward ) {

			this._movingDirection.add( this._getSideVector() );

		}

		return this._movingDirection.normalize();

	}


	private _getMostRecentDirection(): Vector3 {

		this._movingDirection.set( 0, 0, 0 );

		const [ lastAction, _ ] = Object.entries( this._actionKeyStates ).reduce<[Actions | null, number]>(
			( acc, [ key, count ] ) => ( count > acc[ 1 ] ? [ key as Actions, count ] : acc ),
			[ null, 0 ]
		);


		switch ( lastAction ) {

			case null:
				break;
			case 'forward':
				this._movingDirection.add( this._getForwardVector() );
				break;
			case 'backward':
				this._movingDirection.add( this._getForwardVector().multiplyScalar( - 1 ) );
				break;
			case 'leftward':
				this._movingDirection.add( this._getSideVector().multiplyScalar( - 1 ) );
				break;
			case 'rightward':
				this._movingDirection.add( this._getSideVector() );
				break;

		}

		return this._movingDirection;

	}

	private _updateMovement( delta: number ): void {

		let speedDelta = delta * ( this.isGrounded ? this.groundedMoveSpeed : this.floatingMoveSpeed );
		if ( this.enableAcceleration && this._actionKeyStates.accelerate ) speedDelta *= this.accelerationFactor;

		// Move
		const movement = this.enableDiagonalMovement ? this._accumulateDirection() : this._getMostRecentDirection();
		this.velocity.add( movement.multiplyScalar( speedDelta ) );

		if ( movement.lengthSq() > 1e-10 && this.enableRotationOnMove ) {

			this._objectLookAtPosition.copy( this.object.position ).add( movement );
			this.object.lookAt( this._objectLookAtPosition );

		}

		// Jump if grounded.
		if ( this._actionKeyStates.jump && this.isGrounded ) {

			this.velocity.y = this.jumpForce;

		}

		this.object.updateMatrixWorld();

	}

	private _syncForwardDirection(): void {

		if ( ! this.camera ) return;

		if ( this.syncAxisWithCamera === 'always' ) {

			this.camera.getWorldDirection( this._forwardDirection );
			this.object.lookAt( this.object.position.clone().add( this._getForwardVector() ) );
			return;

		}

		if (
			this.syncAxisWithCamera === 'move' &&
      ( this._actionKeyStates.forward || this._actionKeyStates.backward || this._actionKeyStates.leftward || this._actionKeyStates.rightward )
		) {

			this.camera.getWorldDirection( this._forwardDirection );
			this.object.lookAt( this.object.position.clone().add( this._getForwardVector() ) );
			return;

		}

	}

	private _lerpCameraPosition( ): void {

		if ( ! this.camera ) return;

		this._spherical.radius = this.cameraPositionOffset.distanceTo( this.cameraLookAtOffset );

		this._cameraLookAtPosition.copy( this.object.position ).add( this.cameraLookAtOffset );
		this._cameraOffsetPosition.setFromSpherical( this._spherical ).add( this._cameraLookAtPosition );

		this.camera.position.lerp( this._cameraOffsetPosition, this.cameraLerpFactor );
		this.camera.lookAt( this._cameraLookAtPosition );

		this.camera.updateMatrixWorld();

	}

	/**
   * Update the controls.
	 * @param delta - The time elapsed since the last update (sec).
   */
	update( delta: number ): void {

		super.update( delta );

		this._syncForwardDirection();
		this._updateMovement( delta );
		this._lerpCameraPosition();

	}

	/**
   * Connects the controls.
   */
	connect(): void {

		super.connect();

		window.addEventListener( 'keydown', this._onKeyDown );
		window.addEventListener( 'keyup', this._onKeyUp );
		window.addEventListener( 'blur', this._onBlur );
		this.domElement?.addEventListener( 'wheel', this._onMouseWheel );

	}

	/**
   * Disconnects the controls.
   */
	disconnect(): void {

		super.disconnect();

		window.removeEventListener( 'keydown', this._onKeyDown );
		window.removeEventListener( 'keyup', this._onKeyUp );
		window.removeEventListener( 'blur', this._onBlur );
		this.domElement?.addEventListener( 'wheel', this._onMouseWheel );

	}

	/**
   * Disposes of the controls.
   */
	dispose(): void {

		super.dispose();

		this.disconnect();

	}

}


// Handles keydown events and updates the action key states.
function onKeyDown( this: ThirdPersonControls, event: KeyboardEvent ): void {

	for ( const [ action, keys ] of Object.entries( this.actionKeys ) ) {

		if ( keys?.includes( event.code ) ) {

			this._actionKeyStates[ action as Actions ] = ++ this._actionKeyCount;
			break;

		}

	}

}

// Handles keydown events and updates the action key states.
function onKeyUp( this: ThirdPersonControls, event: KeyboardEvent ): void {

	for ( const [ action, keys ] of Object.entries( this.actionKeys ) ) {

		if ( keys?.includes( event.code ) ) {

			this._actionKeyStates[ action as Actions ] = 0;
			break;

		}

	}

}

// Handles keydown events and updates the action key states.
function onBlur( this: ThirdPersonControls ): void {

	for ( const action of Object.keys( this._actionKeyStates ) as Actions[] ) {

		this._actionKeyStates[ action ] = 0;

	}

}

// Handles mouse wheel events to zoom in and out.
function onMouseWheel( this: ThirdPersonControls, event: WheelEvent ): void {

	if ( ! this.enableZoom ) return;

	if ( ! ( this.camera instanceof PerspectiveCamera ) && ! ( this.camera instanceof OrthographicCamera ) ) {

		console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
		this.enableZoom = false;
		return;

	}

	const normalizedDelta = Math.pow( 0.95, this.zoomSpeed * Math.abs( event.deltaY * 0.01 ) );

	if ( event.deltaY > 0 ) this.camera.zoom *= normalizedDelta;
	else if ( event.deltaY < 0 ) this.camera.zoom /= normalizedDelta;

	this.camera.zoom = Math.max( this.minZoom, Math.min( this.maxZoom, this.camera.zoom ) );

	this.camera.updateProjectionMatrix();

}




export { ThirdPersonControls };
