import { DragMixin } from '../mixins/DragMixin';
import { KeyboardMixin } from '../mixins/KeyboardMixin';
import { ThirdPersonControls } from './base/ThirdPersonControls';

class TPKeyboardDragControls extends KeyboardMixin( DragMixin( ThirdPersonControls ) ) {}

export { TPKeyboardDragControls };
