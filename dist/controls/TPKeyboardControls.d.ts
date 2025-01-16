import { type Action } from './core/FirstPersonControls';
import { ThirdPersonControls } from './core/ThirdPersonControls';
declare const TPKeyboardControls_base: Constructor<import("../mixins/KeyboardMixin").HasKeyboardMethod> & typeof ThirdPersonControls;
declare class TPKeyboardControls extends TPKeyboardControls_base {
    keyToActions: Record<string, Action[]>;
}
export { TPKeyboardControls };
