import { type FirstPersonControls, type Action } from '../controls/core/FirstPersonControls';

export interface HasGyroMethod {
	gyroXActions: Action[],
	gyroYActions: Action[],
	gyroZActions: Action[],

	gyroXOffset: number,
	gyroYOffset: number,
	gyroZOffset: number,

	gyroXMultiplier: number,
	gyroYMultiplier: number,
	gyroZMultiplier: number,
}

function GyroMixin<T extends Constructor<FirstPersonControls>>( Base: T ): Constructor<HasGyroMethod> & T {

	return class GyroMixin extends Base {

		/**
		 * The actions to be performed when gyro is accelerated along the x-axis.
		 * @default [ 'MOVE_BACKWARD' ]
		 */
		gyroXActions: Action[] = [ 'MOVE_BACKWARD' ];

		/**
		 * The reference value of x-axis orientation.
		 * @default 0
		 */
		gyroXOffset: number = 0;

		/**
		 * The multiplier for the x-axis orientation.
		 * @default 0.1
		 */
		gyroXMultiplier: number = 0.1;

		/**
		 * The actions to be performed when gyro is accelerated along the y-axis.
		 * @default [ 'MOVE_RIGHTWARD' ]
		*/
		gyroYActions: Action[] = [ 'MOVE_RIGHTWARD' ];

		/**
		 * The reference value of y-axis orientation.
		 * @default 0
		 */
		gyroYOffset: number = 0;

		/**
		 * The multiplier for the y-axis orientation.
		 * @default 0.1
		 */
		gyroYMultiplier: number = 0.1;

		/**
		 * The actions to be performed when gyro is accelerated along the z-axis.
		 * @default [  ]
		*/
		gyroZActions: Action[] = [ ];

		/**
		 * The reference value of z-axis orientation.
		 * @default 0
		 */
		gyroZOffset: number = 0;

		/**
		 * The multiplier for the z-axis orientation.
		 * @default 0.1
		 */
		gyroZMultiplier: number = 0.1;

		/**
		 * Whether the reset the reference values for orientation (gyroXOffset, gyroYOffset, gyroZOffset) on the next device orientation event.
		 */
		needsResetOrientation: boolean = true;

		// Internals
		private _bindOnDeviceOrientation: ( event: DeviceOrientationEvent ) => void;
		private _bindRequestDeviceOrientationEvent: () => void;


		constructor( ...args: any[] ) {

			super( ...args );

			this._bindOnDeviceOrientation = this._onDeviceOrientation.bind( this );
			this._bindRequestDeviceOrientationEvent = this._requestDeviceOrientationEvent.bind( this );

			this.connect();

		}

		/**
		 * Connects the controls.
		 */
		connect(): void {

			super.connect();

			if ( ! ( 'DeviceOrientationEvent' in window ) ) {

				console.warn( 'DeviceOrientationEvent is not supported' );
				return;

			}

			if ( 'requestPermission' in DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function' ) { // https://stackoverflow.com/questions/56514116/how-do-i-get-deviceorientationevent-and-devicemotionevent-to-work-on-safari

				// ios 13+
				this.domElement?.addEventListener( 'click', this._bindRequestDeviceOrientationEvent );

			} else {

				// non-ios
				window.addEventListener( 'deviceorientation', this._bindOnDeviceOrientation );

			}

		}

		/**
		 * Disconnects the controls.
		 */
		disconnect(): void {

			super.disconnect();

			this.domElement?.removeEventListener( 'click', this._bindRequestDeviceOrientationEvent );
			window.removeEventListener( 'deviceorientation', this._bindOnDeviceOrientation );

		}

		/**
		 * Disposes the controls.
		 */
		dispose(): void {

			super.dispose();

			this.disconnect();

		}

		// Handles the device orientation event and updates the action states.
		protected _onDeviceOrientation( event: DeviceOrientationEvent ): void {

			let { alpha, beta, gamma } = event;


			if ( alpha === null || beta === null || gamma === null ) return;

			if ( this.needsResetOrientation ) {

				this.gyroXOffset = beta;
				this.gyroYOffset = gamma;
				this.gyroZOffset = alpha;

				this.needsResetOrientation = false;

			}

			beta = ( beta - this.gyroXOffset ) * this.gyroXMultiplier;
			gamma = ( gamma - this.gyroYOffset ) * this.gyroYMultiplier;
			alpha = ( alpha - this.gyroZOffset ) * this.gyroZMultiplier;

			this.gyroXActions.forEach( action => {

				this.actionStates[ action ] = beta;

			} );

			this.gyroYActions.forEach( action => {

				this.actionStates[ action ] = gamma;

			} );

			this.gyroZActions.forEach( action => {

				this.actionStates[ action ] = alpha;

			} );

		}

		// Requests the device orientation event permission. (ios 13+)
		protected _requestDeviceOrientationEvent(): void {

			if ( 'requestPermission' in DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function' ) {

				DeviceOrientationEvent.requestPermission()
					.then( ( permissionState: any ) => {

						if ( permissionState === 'granted' ) {

							window.addEventListener( 'deviceorientation', this._bindOnDeviceOrientation );

						} else {

							console.warn( 'DeviceOrientationEvent.requestPermission() was not granted' );

						}

					} )
					.catch( ( error: any ) => {

						console.error( error );

					} );

			}

		}

	};

}

export { GyroMixin };
