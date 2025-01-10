import { FirstPersonControls } from './base/FirstPersonControls';
declare const FPKeyboardDragControls_base: Constructor<import("../mixins/KeyboardMixin").HasKeyboardMethod> & Constructor<import("../mixins/DragMixin").HasDragMethod> & typeof FirstPersonControls;
declare class FPKeyboardDragControls extends FPKeyboardDragControls_base {
}
export { FPKeyboardDragControls };
