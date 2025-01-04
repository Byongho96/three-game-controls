import { Camera, Object3D } from 'three';
import { ThirdPersonControls } from './ThirdPersonControls';
import { AnimationClips } from '../base/PhysicsCharacterControls';

class TPDragControls extends ThirdPersonControls {

	// Internals but accessed by handlers
	_isMouseDown: boolean = false;

	// Event handlers
	private _onMouseDown: ( ) => void;
	private _onMouseUp: ( ) => void;
	private _onMouseMove: ( event: MouseEvent ) => void;

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

		this._onMouseDown = onMouseDown.bind( this );
		this._onMouseUp = onMouseUp.bind( this );
		this._onMouseMove = onMouseMove.bind( this );

		this.connect();

	}

	/**
   * Connects the controls.
   */
	connect() {

		super.connect();

		this.domElement?.addEventListener( 'mousedown', this._onMouseDown );
		document.addEventListener( 'mouseup', this._onMouseUp );
		this.domElement?.addEventListener( 'mousemove', this._onMouseMove );

	}

	/**
   * Disconnects the controls.
   */
	disconnect() {

		super.disconnect();

		this.domElement?.removeEventListener( 'mousedown', this._onMouseDown );
		document.removeEventListener( 'mouseup', this._onMouseUp );
		this.domElement?.removeEventListener( 'mousemove', this._onMouseMove );

	}

	/**
   * Disposes of the controls.
   */
	dispose() {

		super.dispose();

		this.disconnect();

	}

}

// Handles the mousedown event and sets the mouse down state.
function onMouseDown( this: TPDragControls ) {

	this._isMouseDown = true;

}

// Handles the mouseup event and resets the mouse down state.
function onMouseUp( this: TPDragControls ) {

	this._isMouseDown = false;

}

// Handles the mousemove event and updates the object's rotation based on mouse movement.
function onMouseMove( this: TPDragControls, event: MouseEvent ) {

	if ( ! this._isMouseDown ) return;

	this._spherical.theta -= ( event.movementX * this.rotateSpeed ) / 100;
	this._spherical.phi -= ( event.movementY * this.rotateSpeed ) / 100;

	this._spherical.makeSafe();

}


export { TPDragControls };
