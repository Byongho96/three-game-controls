import { Camera, Object3D } from 'three';
import { ThirdPersonControls } from './ThirdPersonControls';
import { AnimationClips } from '../base/PhysicsCharacterControls';


type Rotations = 'turnLeft' | 'turnRight' | 'turnUp' | 'turnDown';

type RotationKeys = {
  [K in Rotations]?: string[];
};

class TPKeyboardControls extends ThirdPersonControls {

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

		super( object, domElement, world, animationClips, camera );

		this._handleKeyDown = handleKeyDown.bind( this );
		this._handleKeyUp = handleKeyUp.bind( this );
		this._handleBlur = handleBlur.bind( this );

		this.connect();

	}

	// Update rotation based on key states
	_updateRotation( delta: number ) {

		const rotationSpeed = this.rotateSpeed * delta;

		if ( this._rotationKeyStates.turnLeft ) {

			this._spherical.theta += rotationSpeed;

		}

		if ( this._rotationKeyStates.turnRight ) {

			this._spherical.theta -= rotationSpeed;

		}

		if ( this._rotationKeyStates.turnUp ) {

			this._spherical.phi -= rotationSpeed;

		}

		if ( this._rotationKeyStates.turnDown ) {

			this._spherical.phi += rotationSpeed;

		}

		this._spherical.phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, this._spherical.phi ) );
		this._spherical.makeSafe();

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
	connect() {

		super.connect();

		window.addEventListener( 'keydown', this._handleKeyDown );
		window.addEventListener( 'keyup', this._handleKeyUp );
		window.addEventListener( 'blur', this._handleBlur );

	}

	/**
   * Disconnects the controls.
   */
	disconnect() {

		super.disconnect();

		window.removeEventListener( 'keydown', this._handleKeyDown );
		window.removeEventListener( 'keyup', this._handleKeyUp );
		window.removeEventListener( 'blur', this._handleBlur );

	}

	/**
   * Disposes of the controls.
   */
	dispose() {

		super.dispose();

		this.disconnect();

	}


}

// Handles keydown events and updates the rotation key states.
function handleKeyDown( this:TPKeyboardControls, event: KeyboardEvent ) {

	for ( const [ action, keys ] of Object.entries( this.rotationKeys ) ) {

		if ( keys?.includes( event.code ) ) {

			this._rotationKeyStates[ action as Rotations ] = true;
			break;

		}

	}

}

// Handles keyup events and resets the rotation key states.
function handleKeyUp( this:TPKeyboardControls, event: KeyboardEvent ) {

	for ( const [ action, keys ] of Object.entries( this.rotationKeys ) ) {

		if ( keys?.includes( event.code ) ) {

			this._rotationKeyStates[ action as Rotations ] = false;
			break;

		}

	}

}

// Resets all rotation key states.
function handleBlur( this:TPKeyboardControls ) {

	for ( const action of Object.keys( this._rotationKeyStates ) as Rotations[] ) {

		this._rotationKeyStates[ action ] = false;

	}

}

export { TPKeyboardControls };
