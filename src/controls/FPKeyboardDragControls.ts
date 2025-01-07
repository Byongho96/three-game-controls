import { DragMixin } from '../mixins/DragMixin';
import { KeyboardMixin } from '../mixins/KeyboardMixin';
import { FirstPersonControls } from './base/FirstPersonControls';

class FPKeyboardDragControls extends KeyboardMixin( DragMixin( FirstPersonControls ) ) {}

export { FPKeyboardDragControls };
