import { type FirstPersonControls, type Action } from '../controls/base/FirstPersonControls';

export interface HasDragMethod {
	dragXActions: Action[],
	dragYActions: Action[],

	dragDampingFactor: number,
	enableDragDamping: boolean,
}

function DragMixin<T extends Constructor<FirstPersonControls>>( Base: T ): Constructor<HasDragMethod> & T {

	return class DragMixin extends Base {

		dragXActions: Action[] = [ 'ROTATE_RIGHT' ];
		dragYActions: Action[] = [ 'ROTATE_DOWN' ];

		dragDampingFactor: number = 1;
		enableDragDamping: boolean = true;

		// Internals
		protected _isMouseDown: boolean = false;

		private _bindOnMouseDown: ( ) => void;
		private _bindOnMouseUp: ( ) => void;
		private _bindOnMouseMove: ( event: MouseEvent ) => void;


		constructor( ...args: any[] ) {

			super( ...args );

			this._bindOnMouseDown = this._onMouseDown.bind( this );
			this._bindOnMouseUp = this._onMouseUp.bind( this );
			this._bindOnMouseMove = this._onMouseMove.bind( this );

			this.connect();

		}

		/**
		 * Connects the controls.
		 */
		connect(): void {

			super.connect();

			this.domElement?.addEventListener( 'mousedown', this._bindOnMouseDown );
			document.addEventListener( 'mouseup', this._bindOnMouseUp );
			this.domElement?.addEventListener( 'mousemove', this._bindOnMouseMove );

		}

		/**
		 * Disconnects the controls.
		 */
		disconnect(): void {

			super.disconnect();

			this.domElement?.removeEventListener( 'mousedown', this._bindOnMouseDown );
			document.removeEventListener( 'mouseup', this._bindOnMouseUp );
			this.domElement?.removeEventListener( 'mousemove', this._bindOnMouseMove );

		}

		/**
		 * Disposes of the controls.
		 */
		dispose(): void {

			super.dispose();

			this.disconnect();

		}

		update( delta: number ): void {

			super.update( delta );

			if ( this.enableDragDamping ) {

				this.dragXActions.forEach( ( action ) => {

					this.actionStates[ action ] *= 1 - this.dragDampingFactor;

				} );

				this.dragYActions.forEach( ( action ) => {

					this.actionStates[ action ] *= 1 - this.dragDampingFactor;

				} );

			}

		}

		// Handles the mousedown event and sets the mouse down state.
		protected _onMouseDown( ) {

			this._isMouseDown = true;

		}

		// Handles the mouseup event and resets the mouse down state.
		protected _onMouseUp( ) {

			this._isMouseDown = false;

		}

		// Handles the mousemove event and update action states.
		protected _onMouseMove( event: MouseEvent ) {

			if ( ! this._isMouseDown ) return;

			this.dragXActions.forEach( ( action ) => {

				this.actionStates[ action ] = event.movementX;

			} );

			this.dragYActions.forEach( ( action ) => {

				this.actionStates[ action ] = event.movementY;

			} );

		}

	};

}

export { DragMixin };
