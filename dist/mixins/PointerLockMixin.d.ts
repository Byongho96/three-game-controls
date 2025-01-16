import { type FirstPersonControls, type Action } from '../controls/core/FirstPersonControls';
export interface HasPointerLockMethod {
    pointerLockXActions: Action[];
    pointerLockYActions: Action[];
    pointerLockDampingFactor: number;
    enablePointerLockDamping: boolean;
}
declare function PointerLockMixin<T extends Constructor<FirstPersonControls>>(Base: T): Constructor<HasPointerLockMethod> & T;
export { PointerLockMixin };
