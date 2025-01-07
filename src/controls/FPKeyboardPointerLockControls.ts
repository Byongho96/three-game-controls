import { KeyboardMixin } from '../mixins/KeyboardMixin';
import { PointerLockMixin } from '../mixins/PointerLockMixin';
import { FirstPersonControls } from './base/FirstPersonControls';

class FPKeyboardPointerLockControls extends KeyboardMixin( PointerLockMixin( FirstPersonControls ) ) {}

export { FPKeyboardPointerLockControls };
