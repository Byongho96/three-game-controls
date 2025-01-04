import { Camera, Object3D, } from 'three';
import { ThirdPersonControls } from './ThirdPersonControls';
import { AnimationClips } from '../base/PhysicsCharacterControls';


class TPPointerLockControls extends ThirdPersonControls {

	// Event handlers
	private _onMouseDown: ( ) => void;
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
		this._onMouseMove = onMouseMove.bind( this );

		this.connect();

	}

	/**
   * Connects the controls.
   */
	connect() {

		super.connect();

		this.domElement?.addEventListener( 'mousedown', this._onMouseDown );
		this.domElement?.addEventListener( 'mousemove', this._onMouseMove );

	}

	/**
   * Disconnects the controls.
   */
	disconnect() {

		super.disconnect();

		this.domElement?.removeEventListener( 'mousedown', this._onMouseDown );
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

// Handles the mousedown event to request pointer lock.
function onMouseDown( this: TPPointerLockControls ) {

	this.domElement?.requestPointerLock();

}


// Handles the mousemove event to update the object's rotation based on mouse movement.
function onMouseMove( this: TPPointerLockControls, event: MouseEvent ) {

	if ( document.pointerLockElement !== this.domElement ) return;

	this._spherical.theta -= ( event.movementX * this.rotateSpeed ) / 100;
	this._spherical.phi -= ( event.movementY * this.rotateSpeed ) / 100;

	this._spherical.phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, this._spherical.phi ) );
	this._spherical.makeSafe();

}


export { TPPointerLockControls };
