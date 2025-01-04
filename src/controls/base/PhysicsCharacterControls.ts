import {
	AnimationAction,
	AnimationClip,
	AnimationMixer,
	LoopOnce,
	Object3D,
	Quaternion,
	Vector3,
} from 'three';
import { PhysicsControls } from './PhysicsControls';

type Animations =
  | 'idle'
  | 'forward'
  | 'backward'
  | 'rightward'
  | 'leftward'
  | 'runForward'
  | 'runBackward'
  | 'runRightward'
  | 'runLeftward'
  | 'jumpUp'
  | 'land'
  | 'fall';

export type AnimationClips = Partial<Record<Animations, AnimationClip>>;

class PhysicsCharacterControls extends PhysicsControls {

	// Animation mixer for the object
	private _animationMixer: AnimationMixer;

	// Animation clips
	private _animationClips: Record<string, AnimationClip> = {};

	// Animation actions synced with the clips
	private _animationActions: Record<string, AnimationAction> = {};

	/** Time for transitioning between animations. */
	transitionTime: number = 0.3;

	/** Delay for transitioning between animations. */
	transitionDelay: number = 0.3;

	/** Speed threshold to trigger the falling animation. */
	fallSpeedThreshold: number = 15;

	/** Speed threshold to trigger the moving animation. */
	moveSpeedThreshold: number = 1;

	/** Speed threshold to trigger running animations. */
	runSpeedThreshold: number = 10;

	// Internals
	private _currentActionKey: Animations | null = null;
	private _objectLocalVelocity: Vector3 = new Vector3();
	private _objectWorldQuaternion: Quaternion = new Quaternion();

	/**
	 * Constructs a new PhysicsCharacterControls instance.
	 * @param object - The character object to control.
	 * @param domElement - The HTML element for capturing input events.
	 * @param world - The world object used for collision detection.
	 * @param animationClips - The animation clips for the character.
	 */
	constructor(
		object: Object3D,
		domElement: HTMLElement | null = null,
		world: Object3D | null = null,
		animationClips : AnimationClips = {}
	) {

		super( object, domElement, world );

		this._animationMixer = new AnimationMixer( this.object );

		Object.entries( animationClips ).forEach( ( [ key, clip ] ) => {

			this.setAnimationClip( key, clip );

		} );

	}


	/**
	 * Gets a frozen copy of the animation clips.
	 */
	get animationClips(): Readonly<Record<string, AnimationClip>> {

		return Object.freeze( { ...this._animationClips } );

	}


	/**
	 * Sets an animation clip for a given key.
	 * @param key - The key to associate with the animation clip.
	 * @param clip - The animation clip.
	 */
	setAnimationClip( key: string, clip: AnimationClip ): void {

		const action = this._animationMixer.clipAction( clip );

		this._animationClips[ key ] = clip;
		this._animationActions[ key ] = action;

	}

	/**
	 * Deletes an animation clip associated with a given key.
	 * @param key - The key of the animation clip to delete.
	 */
	deleteAnimationClip( key: string ): void {

		const clip = this._animationClips[ key ];
		const action = this._animationActions[ key ];

		if ( action ) {

			action.stop();
			this._animationMixer.uncacheAction( clip, this.object );
			delete this._animationActions[ key ];

		}

		if ( clip ) {

			this._animationMixer.uncacheClip( clip );
			delete this._animationClips[ key ];

		}

	}

	/**
	 * Gets the animation action associated with a given key.
	 * @param key - The key of the animation action to retrieve.
	 */
	getAnimationAction( key: string ): AnimationAction | undefined {

		return this._animationActions[ key ];

	}

	// Fades to a new animation action
	private _fadeToAction( key: Animations, duration: number, isOnce?: boolean ): void {

		if ( key === this._currentActionKey ) return;

		const action = this._animationActions[ key ];
		if ( ! action ) return;

		const currentAction = this._currentActionKey ? this._animationActions[ this._currentActionKey ] : null;
		if ( currentAction ) currentAction.fadeOut( duration );

		action.reset();

		if ( isOnce ) {

			action.setLoop( LoopOnce, 1 );
			action.clampWhenFinished = true;

		}

		action.fadeIn( duration );
		action.play();

		this._currentActionKey = key;

	}

	// Updates the animation based on the character's state
	private _updateAnimation(): void {

		this.object.getWorldQuaternion( this._objectWorldQuaternion );
		this._objectLocalVelocity.copy( this.velocity ).applyQuaternion( this._objectWorldQuaternion.invert() );

		if ( this._objectLocalVelocity.y > 0 && this._animationActions.jumpUp ) {

			return this._fadeToAction( 'jumpUp', this.transitionTime, true );

		}

		if ( this.isLanding && this._animationActions.land ) {

			return this._fadeToAction( 'land', this.transitionTime, true );

		}

		if ( this.velocity.y < - this.fallSpeedThreshold && this._currentActionKey !== 'land' && this._animationActions.fall ) {

			return this._fadeToAction( 'fall', this.transitionTime );

		}

		if ( ! this.isGrounded ) return;

		if ( this._objectLocalVelocity.z > this.runSpeedThreshold && this._animationActions.runForward ) {

			return this._fadeToAction( 'runForward', this.transitionTime );

		}

		if ( this._objectLocalVelocity.z > this.moveSpeedThreshold && this._animationActions.forward ) {

			return this._fadeToAction( 'forward', this.transitionTime );

		}

		if ( this._objectLocalVelocity.z < - this.runSpeedThreshold && this._animationActions.runBackward ) {

			return this._fadeToAction( 'runBackward', this.transitionTime );

		}

		if ( this._objectLocalVelocity.z < - this.moveSpeedThreshold && this._animationActions.backward ) {

			return this._fadeToAction( 'backward', this.transitionTime );

		}

		if ( this._objectLocalVelocity.x > this.runSpeedThreshold && this._animationActions.runLeftward ) {

			return this._fadeToAction( 'runLeftward', this.transitionTime );

		}

		if ( this._objectLocalVelocity.x > this.moveSpeedThreshold && this._animationActions.leftward ) {

			return this._fadeToAction( 'leftward', this.transitionTime );

		}

		if ( this._objectLocalVelocity.x < - this.runSpeedThreshold && this._animationActions.runRightward ) {

			return this._fadeToAction( 'runRightward', this.transitionTime );

		}

		if ( this._objectLocalVelocity.x < - this.moveSpeedThreshold && this._animationActions.rightward ) {

			return this._fadeToAction( 'rightward', this.transitionTime );

		}

		return this._fadeToAction( 'idle', this.transitionTime );

	}

	/**
	 * Updates the character's state, including physics and animations.
	 * @param delta - The time elapsed since the last update (sec).
	 */
	update( delta: number ): void {

		super.update( delta );

		this._updateAnimation();

		this._animationMixer.update( delta );

	}

	/**
	 * Disposes of the character controls, cleaning up animations and resources.
	 */
	dispose(): void {

		super.dispose();

		this._animationMixer.stopAllAction();
		this._animationMixer.uncacheRoot( this.object );

	}

}

export { PhysicsCharacterControls };
