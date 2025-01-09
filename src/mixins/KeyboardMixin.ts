import { type FirstPersonControls, type Action } from '../controls/base/FirstPersonControls';

export interface HasKeyboardMethod {
	keyToActions: Record<string, Action[]>
}

function KeyboardMixin<T extends Constructor<FirstPersonControls>>( Base: T ): Constructor<HasKeyboardMethod> & T {

	return class KeyboardMixin extends Base {

		keyToActions: Record<string, Action[]> = {
			'KeyW': [ 'MOVE_FORWARD' ],
			'KeyS': [ 'MOVE_BACKWARD' ],
			'KeyA': [ 'MOVE_LEFTWARD' ],
			'KeyD': [ 'MOVE_RIGHTWARD' ],
			'Space': [ 'JUMP' ],
			'ShiftLeft': [ 'ACCELERATE' ],
		};

		// Event handlers
		private _bindOnKeyDown: ( event: KeyboardEvent ) => void;
		private _bindOnKeyUp: ( event: KeyboardEvent ) => void;
		private _bindOnBlur: ( ) => void;

		constructor( ...args: any[] ) {

			super( ...args );

			this._bindOnKeyDown = this._onKeyDown.bind( this );
			this._bindOnKeyUp = this._onKeyUp.bind( this );
			this._bindOnBlur = this._onBlur.bind( this );

			this.connect();

		}

		/**
		 * Connects the controls.
		 */
		connect(): void {

			super.connect();

			window.addEventListener( 'keydown', this._bindOnKeyDown );
			window.addEventListener( 'keyup', this._bindOnKeyUp );
			window.addEventListener( 'blur', this._bindOnBlur );

		}

		/**
		 * Disconnects the controls.
		 */
		disconnect(): void {

			super.disconnect();

			window.removeEventListener( 'keydown', this._bindOnKeyDown );
			window.removeEventListener( 'keyup', this._bindOnKeyUp );
			window.removeEventListener( 'blur', this._bindOnBlur );

		}

		/**
		 * Disposes of the controls.
		 */
		dispose(): void {

			super.dispose();

			this.disconnect();

		}

		// Handles keydown events and set action states.
		protected _onKeyDown( event: KeyboardEvent ): void {

			if ( event.code in this.keyToActions ) {

				this.keyToActions[ event.code ].forEach( ( action ) => {

					this.actionStates[ action ] = 1;

				} );

			}

		}

		// Handles keyup events and reset action states.
		protected _onKeyUp( event: KeyboardEvent ): void {

			if ( event.code in this.keyToActions ) {

				this.keyToActions[ event.code ].forEach( ( action ) => {

					this.actionStates[ action ] = 0;

				} );

			}

		}

		// Resets all the action states.
		protected _onBlur(): void {

			Object.keys( this.keyToActions ).forEach( ( key ) => {

				this.keyToActions[ key ].forEach( ( action ) => {

					this.actionStates[ action ] = 0;

				} );

			} );

		}

	};



}


export { KeyboardMixin };
