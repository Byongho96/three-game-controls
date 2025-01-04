import { Object3D, Vector3 } from 'three';
import { FirstPersonControls } from './FirstPersonControls';

const _worldYDirection = new Vector3( 0, 1, 0 );

class FPPointerLockControls extends FirstPersonControls {

	// Event handlers
	private _onMouseDown: ( ) => void;
	private _onMouseMove: ( event: MouseEvent ) => void;

	/**
   * Constructs a new FPPointerLockControls instance.
   * @param object - The object to control.
   * @param domElement - The HTML element for capturing input events.
   * @param world - The world object used for collision detection.
   */
	constructor( object : Object3D, domElement: HTMLElement | null = null, world : Object3D | null = null ) {

		super( object, domElement, world );

		this._onMouseDown = onMouseDown.bind( this );
		this._onMouseMove = onMouseMove.bind( this );

		this.connect();

	}

	/**
   * Connects the controls.
   */
	connect(): void {

		super.connect();

		this.domElement?.addEventListener( 'mousedown', this._onMouseDown );
		this.domElement?.addEventListener( 'mousemove', this._onMouseMove );

	}

	/**
   * Disconnects the controls.
   */
	disconnect(): void {

		super.disconnect();

		this.domElement?.removeEventListener( 'mousedown', this._onMouseDown );
		this.domElement?.removeEventListener( 'mousemove', this._onMouseMove );

	}

	/**
   * Disposes of the controls.
   */
	dispose(): void {

		super.dispose();

		this.disconnect();

	}

}

// Handles the mousedown event to request pointer lock.
function onMouseDown( this: FPPointerLockControls ) {

	this.domElement?.requestPointerLock();

}


// Handles the mousemove event to update the object's rotation based on mouse movement.
function onMouseMove( this: FPPointerLockControls, event: MouseEvent ) {

	if ( document.pointerLockElement !== this.domElement ) return;

	this.object.rotateOnWorldAxis( _worldYDirection, ( - 1 * event.movementX * this.rotateSpeed ) / 100 );
	this.object.rotateX( ( - 1 * event.movementY * this.rotateSpeed ) / 100 );

	this.object.rotation.x = Math.max( - Math.PI / 2, Math.min( Math.PI / 2, this.object.rotation.x ) );

}


export { FPPointerLockControls };
