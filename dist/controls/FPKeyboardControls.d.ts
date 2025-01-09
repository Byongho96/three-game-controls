import { FirstPersonControls, type Action } from './base/FirstPersonControls';
declare const FPKeyboardControls_base: Constructor<import("../mixins/KeyboardMixin").HasKeyboardMethod> & typeof FirstPersonControls;
declare class FPKeyboardControls extends FPKeyboardControls_base {
    keyToActions: Record<string, Action[]>;
}
export { FPKeyboardControls };
