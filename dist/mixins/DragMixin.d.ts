import { type FirstPersonControls, type Action } from '../controls/base/FirstPersonControls';
export interface HasDragMethod {
    dragXActions: Action[];
    dragYActions: Action[];
    dragDampingFactor: number;
    enableDragDamping: boolean;
}
declare function DragMixin<T extends Constructor<FirstPersonControls>>(Base: T): Constructor<HasDragMethod> & T;
export { DragMixin };
