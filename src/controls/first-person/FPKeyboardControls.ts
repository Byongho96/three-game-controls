import { Object3D, Vector3 } from 'three';
import { FirstPersonControls } from './FirstPersonControls';


type Rotations = 'turnLeft' | 'turnRight' | 'turnUp' | 'turnDown';

type RotationKeys = {
  [K in Rotations]: string[];
};

const _worldYDirection = new Vector3( 0, 1, 0 );

class FPKeyboardControls extends FirstPersonControls {

	/**
	 * Keyboard keys mapped to rotation actions
	 * @default { turnUp: [ 'ArrowUp' ], turnDown: [ 'ArrowDown' ], turnLeft: [ 'ArrowLeft' ], turnRight: [ 'ArrowRight' ] }
	 */
	rotationKeys: RotationKeys = {
		turnUp: [ 'ArrowUp' ],
		turnDown: [ 'ArrowDown' ],
		turnLeft: [ 'ArrowLeft' ],
		turnRight: [ 'ArrowRight' ],
	};

	// Internals but accessed by handlers
	_rotationKeyStates: Record<Rotations, boolean> = {
		turnUp: false,
		turnDown: false,
		turnLeft: false,
		turnRight: false,
	};

	// Event handlers
	private _handleKeyDown: ( event: KeyboardEvent ) => void;
	private _handleKeyUp: ( event: KeyboardEvent ) => void;
	private _handleBlur: ( ) => void = handleBlur.bind( this );

	/**
   * Constructs a new FPKeyboardControls instance.
   * @param object - The object to control.
   * @param domElement - The HTML element for capturing input events.
   * @param world - The world object used for collision detection.
   */
	constructor( object : Object3D, domElement: HTMLElement | null = null, world : Object3D | null = null ) {

		super( object, domElement, world );

		this._handleKeyDown = handleKeyDown.bind( this );
		this._handleKeyUp = handleKeyUp.bind( this );
		this._handleBlur = handleBlur.bind( this );

		this.connect();

	}

	// Update rotation based on key states
	_updateRotation( delta: number ): void {

		if ( this._rotationKeyStates.turnLeft ) {

			this.object.rotateOnWorldAxis( _worldYDirection, this.rotateSpeed * delta );

		}

		if ( this._rotationKeyStates.turnRight ) {

			this.object.rotateOnWorldAxis( _worldYDirection, - this.rotateSpeed * delta );

		}

		if ( this._rotationKeyStates.turnUp ) {

			this.object.rotateX( this.rotateSpeed * delta );

		}

		if ( this._rotationKeyStates.turnDown ) {

			this.object.rotateX( - this.rotateSpeed * delta );

		}

		this.object.rotation.x = Math.max( this.minXAngle, Math.min( this.maxXAngle, this.object.rotation.x ) );

	}

	/**
   * Update the controls.
	 * @param delta - The time elapsed since the last update (sec).
   */
	update( delta: number ): void {

		super.update( delta );

		this._updateRotation( delta );

	}

	/**
   * Connects the controls.
   */
	connect(): void {

		super.connect();

		window.addEventListener( 'keydown', this._handleKeyDown );
		window.addEventListener( 'keyup', this._handleKeyUp );
		window.addEventListener( 'blur', this._handleBlur );

	}

	/**
   * Disconnects the controls.
   */
	disconnect(): void {

		super.disconnect();

		window.removeEventListener( 'keydown', this._handleKeyDown );
		window.removeEventListener( 'keyup', this._handleKeyUp );
		window.removeEventListener( 'blur', this._handleBlur );

	}

	/**
   * Disposes of the controls.
   */
	dispose(): void {

		super.dispose();

		this.disconnect();

	}

}

// Handles keydown events and updates the rotation key states.
function handleKeyDown( this:FPKeyboardControls, event: KeyboardEvent ): void {

	for ( const [ action, keys ] of Object.entries( this.rotationKeys ) ) {

		if ( keys?.includes( event.code ) ) {

			this._rotationKeyStates[ action as Rotations ] = true;
			break;

		}

	}

}

// Handles keyup events and resets the rotation key states.
function handleKeyUp( this:FPKeyboardControls, event: KeyboardEvent ): void {

	for ( const [ action, keys ] of Object.entries( this.rotationKeys ) ) {

		if ( keys?.includes( event.code ) ) {

			this._rotationKeyStates[ action as Rotations ] = false;
			break;

		}

	}

}

// Resets all rotation key states.
function handleBlur( this:FPKeyboardControls ): void {

	for ( const action of Object.keys( this._rotationKeyStates ) as Rotations[] ) {

		this._rotationKeyStates[ action ] = false;

	}

}

export { FPKeyboardControls };
