import { ThirdPersonControls } from './core/ThirdPersonControls';
declare const TPKeyboardDragControls_base: Constructor<import("../mixins/KeyboardMixin").HasKeyboardMethod> & Constructor<import("../mixins/DragMixin").HasDragMethod> & typeof ThirdPersonControls;
declare class TPKeyboardDragControls extends TPKeyboardDragControls_base {
}
export { TPKeyboardDragControls };
