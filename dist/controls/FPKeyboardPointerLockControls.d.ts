import { FirstPersonControls } from './base/FirstPersonControls';
declare const FPKeyboardPointerLockControls_base: Constructor<import("../mixins/KeyboardMixin").HasKeyboardMethod> & Constructor<import("../mixins/PointerLockMixin").HasPointerLockMethod> & typeof FirstPersonControls;
declare class FPKeyboardPointerLockControls extends FPKeyboardPointerLockControls_base {
}
export { FPKeyboardPointerLockControls };
