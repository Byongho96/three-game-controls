import { type FirstPersonControls, type Action } from '../controls/core/FirstPersonControls';

export interface HasDragMethod {
	dragXActions: Action[],
	dragYActions: Action[],

	dragDampingFactor: number,
	enableDragDamping: boolean,
}

function DragMixin<T extends Constructor<FirstPersonControls>>( Base: T ): Constructor<HasDragMethod> & T {

	return class DragMixin extends Base {

		/**
		 * The actions to be performed when dragging along the x-axis.
		 * @default [ 'ROTATE_RIGHT' ]
		 */
		dragXActions: Action[] = [ 'ROTATE_RIGHT' ];

		/**
		 * The actions to be performed when dragging along the y-axis.
		 * @default [ 'ROTATE_DOWN' ]
		 */
		dragYActions: Action[] = [ 'ROTATE_DOWN' ];

		/**
		 * The damping factor for drag actions.
		 * @default 1
		 */
		dragDampingFactor: number = 1;

		/**
		 * Whether to enable drag damping.
		 * @default true
		 */
		enableDragDamping: boolean = true;

		// Internals
		protected _isDragging: boolean = false;

		private _lastTouchX: number = 0;
		private _lastTouchY: number = 0;

		private _bindOnDragStart: ( event: MouseEvent | TouchEvent ) => void;
		private _bindOnDragEnd: ( ) => void;
		private _bindOnDragMove: ( event: MouseEvent | TouchEvent ) => void;



		constructor( ...args: any[] ) {

			super( ...args );

			this._bindOnDragStart = this._onDragStart.bind( this );
			this._bindOnDragEnd = this._onDragEnd.bind( this );
			this._bindOnDragMove = this._onDragMove.bind( this );

			this.connect();

		}

		/**
		 * Connects the controls.
		 */
		connect(): void {

			super.connect();

			this.domElement?.addEventListener( 'mousedown', this._bindOnDragStart );
			document.addEventListener( 'mouseup', this._bindOnDragEnd );
			this.domElement?.addEventListener( 'mousemove', this._bindOnDragMove );

			this.domElement?.addEventListener( 'touchstart', this._bindOnDragStart );
			document.addEventListener( 'touchend', this._bindOnDragEnd );
			this.domElement?.addEventListener( 'touchmove', this._bindOnDragMove );

		}

		/**
		 * Disconnects the controls.
		 */
		disconnect(): void {

			super.disconnect();

			this.domElement?.removeEventListener( 'mousedown', this._bindOnDragStart );
			document.removeEventListener( 'mouseup', this._bindOnDragEnd );
			this.domElement?.removeEventListener( 'mousemove', this._bindOnDragMove );

			this.domElement?.removeEventListener( 'touchstart', this._bindOnDragStart );
			document.removeEventListener( 'touchend', this._bindOnDragEnd );
			this.domElement?.removeEventListener( 'touchmove', this._bindOnDragMove );

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

		// Handles the drag start event and sets the mouse down state.
		protected _onDragStart( event: MouseEvent | TouchEvent ) {

			this._isDragging = true;

			if ( event instanceof TouchEvent ) {

				const touch = event.touches[ 0 ];
				if ( ! touch ) return;

				this._lastTouchX = touch.clientX;
				this._lastTouchY = touch.clientY;

			}

		}

		// Handles the drag end event and sets the mouse up state.
		protected _onDragEnd( ) {

			this._isDragging = false;

		}

		// Handles the drag move event and updates the action states.
		protected _onDragMove( event: MouseEvent | TouchEvent ) {

			if ( ! this._isDragging ) return;

			let movementX = 0;
			let movementY = 0;

			if ( event instanceof MouseEvent ) {

				movementX = event.movementX;
				movementY = event.movementY;

			} else if ( event instanceof TouchEvent ) {

				const touch = event.touches[ 0 ];
				if ( ! touch ) return;

				movementX = touch.clientX - this._lastTouchX;
				movementY = touch.clientY - this._lastTouchY;

				this._lastTouchX = touch.clientX;
				this._lastTouchY = touch.clientY;

			}


			this.dragXActions.forEach( ( action ) => {

				this.actionStates[ action ] = movementX;

			} );

			this.dragYActions.forEach( ( action ) => {

				this.actionStates[ action ] = movementY;

			} );

		}

	};

}

export { DragMixin };
