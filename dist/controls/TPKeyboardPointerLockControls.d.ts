import { ThirdPersonControls } from './base/ThirdPersonControls';
declare const TPKeyboardPointerLockControls_base: Constructor<import("../mixins/KeyboardMixin").HasKeyboardMethod> & Constructor<import("../mixins/PointerLockMixin").HasPointerLockMethod> & typeof ThirdPersonControls;
declare class TPKeyboardPointerLockControls extends TPKeyboardPointerLockControls_base {
}
export { TPKeyboardPointerLockControls };
