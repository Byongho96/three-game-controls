import { KeyboardMixin } from '../mixins/KeyboardMixin';
import { type Action } from './base/FirstPersonControls';
import { ThirdPersonControls } from './base/ThirdPersonControls';

class TPKeyboardControls extends KeyboardMixin( ThirdPersonControls ) {

	keyToActions: Record<string, Action[]> = {
		'KeyW': [ 'MOVE_FORWARD' ],
		'KeyS': [ 'MOVE_BACKWARD' ],
		'KeyA': [ 'MOVE_LEFTWARD' ],
		'KeyD': [ 'MOVE_RIGHTWARD' ],
		'Space': [ 'JUMP' ],
		'ShiftLeft': [ 'ACCELERATE' ],
		'ArrowUp': [ 'ROTATE_UP' ],
		'ArrowDown': [ 'ROTATE_DOWN' ],
		'ArrowRight': [ 'ROTATE_RIGHT' ],
		'ArrowLeft': [ 'ROTATE_LEFT' ]
	};

}

export { TPKeyboardControls };
