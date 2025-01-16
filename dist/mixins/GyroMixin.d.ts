import { type FirstPersonControls, type Action } from '../controls/core/FirstPersonControls';
export interface HasGyroMethod {
    gyroXActions: Action[];
    gyroYActions: Action[];
    gyroZActions: Action[];
    gyroXOffset: number;
    gyroYOffset: number;
    gyroZOffset: number;
    gyroXMultiplier: number;
    gyroYMultiplier: number;
    gyroZMultiplier: number;
}
declare function GyroMixin<T extends Constructor<FirstPersonControls>>(Base: T): Constructor<HasGyroMethod> & T;
export { GyroMixin };
