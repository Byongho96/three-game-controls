import { EventDispatcher, LoopOnce, LoopRepeat } from 'three';

const MONSTER_STATE_NAME = {
	RUN: 'RUN',
	ATTACK: 'ATTACK',
	HURT: 'HURT',
	DYING: 'DYING',
	DEAD: 'DEAD',
};

const MONSTER_EVENTS = {
	EMPTY_HEALTH: 'EMPTY_HEALTH',
	GET_SHOT: 'GET_SHOT',
	CLOSE_TO_TARGET: 'CLOSE_TO_TARGET',
	ON_END_STATE: 'ON_END_STATE',
};

class StateMachine {

	constructor( defaultState, states ) {

		this.state = defaultState;
		this.states = states;

		this.state.enter();

	}

	handleEvent( event ) {

		const nextStateName = this.state.getNextStateName( event );
		if ( nextStateName === null ) return;

		this.state.exit();
		const nextState = this.states?.[ nextStateName ];
		if ( ! nextState ) return;

		nextState.enter();
		this.state = nextState;

	}

}

class State extends EventDispatcher {

	constructor( action, audio, buffer ) {

		super();
		this.name = null;
		this.action = action;
		this.audio = audio;
		this.buffer = buffer;

		this.enterCallbacks = [];
		this.updateCallbacks = [];
		this.exitCallbacks = [];

		this.timeOutId = null;
		this.stateDuration = null;

	}

	addDuration( duration ) {

		const dispatchEndState = () => {

			this.dispatchEvent( { type: 'endState', stateName: this.name } );

		};

		const setTimeOutCallback = () => {

			this.timeOutId = setTimeout( dispatchEndState, duration );

		};

		const clearTimeOutCallback = () => {

			if ( this.timeOutId ) clearTimeout( this.timeOutId );

		};

		this.addEnterCallback( setTimeOutCallback.bind( this ) );
		this.addExitCallback( clearTimeOutCallback.bind( this ) );

	}

	addAction( {
		action,
		fadeInDuration = null,
		fadeOutDuration = null,
		loop = LoopRepeat,
		clampWhenFinished = true,
		timeScale = 1,
	} ) {

		action.loop = loop;
		action.clampWhenFinished = clampWhenFinished;
		action.timeScale = timeScale;

		if ( loop == LoopOnce ) {

			this.addDuration( ( action.getClip().duration / action.timeScale ) * 1000 );

		}

		this.addEnterCallback( () => {

			action.reset();
			if ( fadeInDuration ) action.fadeIn( fadeInDuration );
			action.play();

		} );

		this.addExitCallback( () => {

			if ( fadeOutDuration ) action.fadeOut( fadeOutDuration );

		} );

	}

	addAudio( audio, buffer, loop ) {

		this.addEnterCallback( () => {

			audio.stop();
			audio.setBuffer( buffer );
			audio.setLoop( loop );
			audio.play();

		} );

	}

	addEnterCallback( callback ) {

		this.enterCallbacks.push( callback );

	}

	addUpdateCallback( callback ) {

		this.updateCallbacks.push( callback );

	}

	addExitCallback( callback ) {

		this.exitCallbacks.push( callback );

	}

	getNextStateName( event ) {

		console.log( event );

	}

	enter() {

		this.enterCallbacks.forEach( callback => {

			callback();

		} );

	}

	update( delta ) {

		this.updateCallbacks.forEach( callback => {

			callback( delta );

		} );

	}

	exit() {

		this.exitCallbacks.forEach( callback => {

			callback();

		} );

	}

}

class RunState extends State {

	constructor( action, audio, buffer ) {

		super( action, audio, buffer );
		this.name = MONSTER_STATE_NAME.RUN;
		this.addAudio( this.audio, this.buffer, true );
		this.addAction( { action: this.action, fadeInDuration: 0.5, fadeOutDuration: 0.5 } );

	}
	getNextStateName( event ) {

		switch ( event ) {

			case MONSTER_EVENTS.EMPTY_HEALTH:
				return MONSTER_STATE_NAME.DYING;
			case MONSTER_EVENTS.GET_SHOT:
				return MONSTER_STATE_NAME.HURT;
			case MONSTER_EVENTS.CLOSE_TO_TARGET:
				return MONSTER_STATE_NAME.ATTACK;
			default:
				return null;

		}

	}

}

class HurtState extends State {

	constructor( action, audio, buffer ) {

		super( action, audio, buffer );
		this.name = MONSTER_STATE_NAME.HURT;
		this.addAudio( this.audio, this.buffer, false );
		this.addAction( {
			action: this.action,
			fadeInDuration: 0.2,
			fadeOutDuration: 0.5,
			loop: LoopOnce,
			timeScale: 3,
		} );

	}
	getNextStateName( event ) {

		switch ( event ) {

			case MONSTER_EVENTS.EMPTY_HEALTH:
				return MONSTER_STATE_NAME.DYING;
			case MONSTER_EVENTS.ON_END_STATE:
				return MONSTER_STATE_NAME.RUN;
			case MONSTER_EVENTS.GET_SHOT:
				return MONSTER_STATE_NAME.HURT;
			default:
				return null;

		}

	}

}

class AttackState extends State {

	constructor( action, audio, buffer ) {

		super( action, audio, buffer );
		this.name = MONSTER_STATE_NAME.ATTACK;
		this.addAudio( this.audio, this.buffer, false );
		this.addAction( { action: this.action, fadeInDuration: 0.5, fadeOutDuration: 0.5, loop: LoopOnce } );

	}
	getNextStateName( event ) {

		switch ( event ) {

			case MONSTER_EVENTS.EMPTY_HEALTH:
				return MONSTER_STATE_NAME.DYING;
			case MONSTER_EVENTS.GET_SHOT:
				return MONSTER_STATE_NAME.HURT;
			case MONSTER_EVENTS.ON_END_STATE:
				return MONSTER_STATE_NAME.RUN;
			default:
				return null;

		}

	}

}

class DyingState extends State {

	constructor( action, audio, buffer ) {

		super( action, audio, buffer );
		this.name = MONSTER_STATE_NAME.DYING;
		this.addAudio( this.audio, this.buffer, false );
		this.addAction( { action: this.action, fadeInDuration: 0.5, fadeOutDuration: 30, loop: LoopOnce } );

	}
	getNextStateName( event ) {

		switch ( event ) {

			case MONSTER_EVENTS.ON_END_STATE:
				return MONSTER_STATE_NAME.DEAD;
			default:
				return null;

		}

	}

}

export { MONSTER_STATE_NAME, MONSTER_EVENTS, StateMachine, RunState, AttackState, DyingState, HurtState };
