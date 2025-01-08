import { OrthographicCamera, PerspectiveCamera, Vector3, type Object3D } from 'three';
import { PhysicsControls } from '../base/PhysicsControls';

export type Action = 'MOVE_FORWARD' | 'MOVE_BACKWARD' | 'MOVE_LEFTWARD' | 'MOVE_RIGHTWARD' | 'JUMP' | 'ACCELERATE' | 'ROTATE_UP' | 'ROTATE_DOWN' | 'ROTATE_RIGHT' | 'ROTATE_LEFT';

const _worldYDirection = new Vector3( 0, 1, 0 );

class FirstPersonControls extends PhysicsControls {

	actionStates: Record<string, number> = {
		'MOVE_FORWARD': 0,
		'MOVE_BACKWARD': 0,
		'MOVE_LEFTWARD': 0,
		'MOVE_RIGHTWARD': 0,
		'JUMP': 0,
		'ACCELERATE': 0,
		'ROTATE_UP': 0,
		'ROTATE_DOWN': 0,
		'ROTATE_RIGHT': 0,
		'ROTATE_LEFT': 0
	};

	/** Height of the camera from the ground
	 * @default 1.5
	 */
	eyeHeight: number = 1.6;

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

	/** Speed of zooming.
	 * @default 1
	 */
	zoomSpeed: number = 1;

	// Internals
	private _movementVector: Vector3 = new Vector3();
	private _objectLocalVector: Vector3 = new Vector3();

	private _bindOnMouseWheel: ( event: WheelEvent ) => void = this._onMouseWheel.bind( this );

	/**
	 * Constructs a new FirstPersonControls instance.
	 * @param object - The object to control.
	 * @param domElement - The DOM element for capturing input.
	 * @param world - The world object used for collision detection.
	 */
	constructor( object : Object3D, domElement: HTMLElement | null = null, world : Object3D | null = null ) {

		super( object, domElement, world );

		this.object.rotation.order = 'YZX';

		// Set the collider size based on the eye height.
		this.collider.radius = this.eyeHeight / 4;
		this.collider.length = this.eyeHeight / 2;

		this.connect();

	}

	/**
	 * Returns the forward direction vector of the object.
	 * @param target - The result will be copied into this vector.
	 */
	getForwardVector( target: Vector3 ): Vector3 {

		this.object.getWorldDirection( target );
		target.y = 0;
		target.normalize();
		return target;

	}

	/**
		 * Returns the right direction vector of the object.
		 * @param target - The result will be copied into this vector.
		 */
	getRightwardVector( target: Vector3 ): Vector3 {

		this.object.getWorldDirection( target );
		target.y = 0;
		target.cross( _worldYDirection );
		target.normalize();
		return target;

	}


	protected _updateMovement( delta: number ): void {

		// Calculate speed
		let speedDelta = delta * ( this.isGrounded ? this.groundedMoveSpeed : this.floatingMoveSpeed );

		if ( this.enableAcceleration && this.actionStates.ACCELERATE ) speedDelta *= this.accelerationFactor;

		// Move
		this._movementVector.set( 0, 0, 0 );

		if ( this.actionStates.MOVE_FORWARD ) this._movementVector.add( this.getForwardVector( this._objectLocalVector ).multiplyScalar( this.actionStates.MOVE_FORWARD * speedDelta ) );

		if ( this.actionStates.MOVE_BACKWARD ) this._movementVector.sub( this.getForwardVector( this._objectLocalVector ).multiplyScalar( this.actionStates.MOVE_BACKWARD * speedDelta ) );

		if ( this.actionStates.MOVE_RIGHTWARD ) this._movementVector.add( this.getRightwardVector( this._objectLocalVector ).multiplyScalar( this.actionStates.MOVE_RIGHTWARD * speedDelta ) );

		if ( this.actionStates.MOVE_LEFTWARD ) this._movementVector.sub( this.getRightwardVector( this._objectLocalVector ).multiplyScalar( this.actionStates.MOVE_LEFTWARD * speedDelta ) );


		// Jump.
		if ( this.actionStates.JUMP && this.isGrounded ) {

			this._movementVector.addScaledVector( _worldYDirection, this.jumpForce );

		}

		this.velocity.add( this._movementVector );

	}

	protected _updateRotation( delta: number ): void {

		const speedDelta = this.rotateSpeed * delta / 5;

		if ( this.actionStates.ROTATE_UP ) this.object.rotateX( this.actionStates.ROTATE_UP * speedDelta );

		if ( this.actionStates.ROTATE_DOWN ) this.object.rotateX( - this.actionStates.ROTATE_DOWN * speedDelta );

		if ( this.actionStates.ROTATE_RIGHT ) this.object.rotateOnWorldAxis( _worldYDirection, - this.actionStates.ROTATE_RIGHT * speedDelta );

		if ( this.actionStates.ROTATE_LEFT ) this.object.rotateOnWorldAxis( _worldYDirection, this.actionStates.ROTATE_LEFT * speedDelta );

		this.object.rotation.x = Math.max( - Math.PI / 2, Math.min( Math.PI / 2, this.object.rotation.x ) );

	}

	/**
	 * Update the controls.
	 * @param delta - The time elapsed since the last update (sec).
	 */
	update( delta: number ): void {

		super.update( delta );

		this.object.position.y += this.eyeHeight;

		this._updateMovement( delta );
		this._updateRotation( delta );

	}

	/**
	 * Connects the event listeners.
	 */
	connect(): void {

		super.connect();

		this.domElement?.addEventListener( 'wheel', this._bindOnMouseWheel );

	}

	/**
	 * Disconnects the event listeners.
	 */
	disconnect(): void {

		super.disconnect();

		this.domElement?.removeEventListener( 'wheel', this._bindOnMouseWheel );

	}

	protected _onMouseWheel( event: WheelEvent ): void {

		if ( ! this.enableZoom ) return;

		if ( ! ( this.object instanceof PerspectiveCamera ) && ! ( this.object instanceof OrthographicCamera ) ) {

			console.warn( 'WARNING: FirstPersonControls.js encountered an unknown camera type - dolly/zoom disabled.' );
			this.enableZoom = false;

			return;

		}

		const normalizedDelta = Math.pow( 0.95, this.zoomSpeed * Math.abs( event.deltaY * 0.01 ) );

		if ( event.deltaY > 0 ) this.object.zoom *= normalizedDelta;
		else if ( event.deltaY < 0 ) this.object.zoom /= normalizedDelta;

		this.object.updateProjectionMatrix();

	}

}




export { FirstPersonControls };
