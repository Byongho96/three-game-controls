import { type FirstPersonControls, type Action } from '../controls/base/FirstPersonControls';
export interface HasKeyboardMethod {
    keyToActions: Record<string, Action[]>;
}
declare function KeyboardMixin<T extends Constructor<FirstPersonControls>>(Base: T): Constructor<HasKeyboardMethod> & T;
export { KeyboardMixin };
