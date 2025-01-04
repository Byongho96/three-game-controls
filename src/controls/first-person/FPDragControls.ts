import { Object3D, Vector3 } from 'three';
import { FirstPersonControls } from './FirstPersonControls';

const _worldYDirection = new Vector3( 0, 1, 0 );

class FPDragControls extends FirstPersonControls {

	// Internals but accessed by handlers
	_isMouseDown: boolean = false;

	// Event handlers
	private _onMouseDown: ( ) => void;
	private _onMouseUp: ( ) => void;
	private _onMouseMove: ( event: MouseEvent ) => void;

	/**
   * Constructs a new FPKeyboardControls instance.
   * @param object - The object to control.
   * @param domElement - The HTML element for capturing input events.
   * @param world - The world object used for collision detection.
   */
	constructor( object : Object3D, domElement: HTMLElement | null = null, world : Object3D | null = null ) {

		super( object, domElement, world );

		this._onMouseDown = onMouseDown.bind( this );
		this._onMouseUp = onMouseUp.bind( this );
		this._onMouseMove = onMouseMove.bind( this );

		this.connect();

	}

	/**
   * Connects the controls.
   */
	connect(): void {

		super.connect();

		this.domElement?.addEventListener( 'mousedown', this._onMouseDown );
		document.addEventListener( 'mouseup', this._onMouseUp );
		this.domElement?.addEventListener( 'mousemove', this._onMouseMove );

	}

	/**
   * Disconnects the controls.
   */
	disconnect(): void {

		super.disconnect();

		this.domElement?.removeEventListener( 'mousedown', this._onMouseDown );
		document.removeEventListener( 'mouseup', this._onMouseUp );
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

// Handles the mousedown event and sets the mouse down state.
function onMouseDown( this: FPDragControls ) {

	this._isMouseDown = true;

}

// Handles the mouseup event and resets the mouse down state.
function onMouseUp( this: FPDragControls ) {

	this._isMouseDown = false;

}

// Handles the mousemove event and updates the object's rotation based on mouse movement.
function onMouseMove( this: FPDragControls, event: MouseEvent ) {

	if ( ! this._isMouseDown ) return;

	this.object.rotateOnWorldAxis( _worldYDirection, ( - 1 * event.movementX * this.rotateSpeed ) / 100 );
	this.object.rotateX( ( - 1 * event.movementY * this.rotateSpeed ) / 100 );

	this.object.rotation.x = Math.max( this.minXAngle, Math.min( this.maxXAngle, this.object.rotation.x ) );

}


export { FPDragControls };
