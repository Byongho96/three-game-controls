import { type Action } from './base/FirstPersonControls';
import { ThirdPersonControls } from './base/ThirdPersonControls';
declare const TPKeyboardControls_base: Constructor<import("../mixins/KeyboardMixin").HasKeyboardMethod> & typeof ThirdPersonControls;
declare class TPKeyboardControls extends TPKeyboardControls_base {
    keyToActions: Record<string, Action[]>;
}
export { TPKeyboardControls };
