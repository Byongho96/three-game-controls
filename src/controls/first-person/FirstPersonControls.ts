import { Object3D, OrthographicCamera, PerspectiveCamera, Vector3 } from 'three';
import { PhysicsControls } from '../base/PhysicsControls';

type Actions = 'forward' | 'backward' | 'leftward' | 'rightward' | 'jump' | 'accelerate';

type ActionKeys = {
  [K in Actions]: string[];
};

class FirstPersonControls extends PhysicsControls {

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

	/** Height of the camera from the ground
	 * @default 1.5
	 */
	eyeHeight: number = 1.5;

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

	/** Speed of rotation.
	 * @default 1
	 */
	rotateSpeed: number = 1;

	/** Minimum local X-axis rotation angle.
	 * @default - Math.PI / 2
	 */
	minXAngle: number = - Math.PI / 2;

	/** Maximum local X-axis rotation angle.
	 * @default Math.PI / 2
	 */
	maxXAngle: number = Math.PI / 2;

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
	private _objectLocalVector: Vector3 = new Vector3();
	private _movingDirection: Vector3 = new Vector3();

	// Event handlers
	private _onKeyDown: ( event: KeyboardEvent ) => void;
	private _onKeyUp: ( event: KeyboardEvent ) => void;
	private _onBlur: ( ) => void;
	private _onMouseWheel: ( event: WheelEvent ) => void;

	/**
   * Constructs a new FirstPersonControls instance.
   * @param object - The object to control.
   * @param domElement - The DOM element for capturing input.
   * @param world - The world object used for collision detection.
   */
	constructor( object : Object3D, domElement: HTMLElement | null = null, world : Object3D | null = null ) {

		super( object, domElement, world );

		// Automatically set the collider size based on the eye height.
		this.collider.radius = this.eyeHeight / 4;
		this.collider.length = this.eyeHeight / 2;

		this.object.rotation.order = 'YZX';

		this._onKeyDown = onKeyDown.bind( this );
		this._onKeyUp = onKeyUp.bind( this );
		this._onBlur = onBlur.bind( this );
		this._onMouseWheel = onMouseWheel.bind( this );

		this.connect();

	}

	private _getForwardVector(): Vector3 {

		this.object.getWorldDirection( this._objectLocalVector );
		this._objectLocalVector.y = 0;
		this._objectLocalVector.normalize();

		return this._objectLocalVector;

	}

	private _getSideVector(): Vector3 {

		this.object.getWorldDirection( this._objectLocalVector );
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

		// Jump if grounded.
		if ( this._actionKeyStates.jump && this.isGrounded ) this.velocity.y = this.jumpForce;

		this.object.updateMatrixWorld();

	}

	/**
   * Update the controls.
	 * @param delta - The time elapsed since the last update (sec).
   */
	update( delta: number ): void {

		super.update( delta );

		this.object.position.y += this.eyeHeight;

		this._updateMovement( delta );

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
		this.domElement?.removeEventListener( 'wheel', this._onMouseWheel );

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
function onKeyDown( this: FirstPersonControls, event: KeyboardEvent ): void {

	for ( const [ action, keys ] of Object.entries( this.actionKeys ) ) {

		if ( keys?.includes( event.code ) ) {

			this._actionKeyStates[ action as Actions ] = ++ this._actionKeyCount;
			break;

		}

	}

}

// Handles keydown events and updates the action key states.
function onKeyUp( this: FirstPersonControls, event: KeyboardEvent ): void {

	for ( const [ action, keys ] of Object.entries( this.actionKeys ) ) {

		if ( keys?.includes( event.code ) ) {

			this._actionKeyStates[ action as Actions ] = 0;
			break;

		}

	}

}

// Handles keydown events and updates the action key states.
function onBlur( this: FirstPersonControls ): void {

	for ( const action of Object.keys( this._actionKeyStates ) as Actions[] ) {

		this._actionKeyStates[ action ] = 0;

	}

}

// Handles mouse wheel events to zoom in and out.
function onMouseWheel( this: FirstPersonControls, event: WheelEvent ): void {

	if ( ! this.enableZoom ) return;

	if ( ! ( this.object instanceof PerspectiveCamera ) && ! ( this.object instanceof OrthographicCamera ) ) {

		console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
		this.enableZoom = false;
		return;

	}

	const normalizedDelta = Math.pow( 0.95, this.zoomSpeed * Math.abs( event.deltaY * 0.01 ) );

	if ( event.deltaY > 0 ) this.object.zoom *= normalizedDelta;
	else if ( event.deltaY < 0 ) this.object.zoom /= normalizedDelta;

	this.object.zoom = Math.max( this.minZoom, Math.min( this.maxZoom, this.object.zoom ) );

	this.object.updateProjectionMatrix();

}



export { FirstPersonControls };
