import { CapsuleGeometry, LineBasicMaterial, LineSegments, type ColorRepresentation } from 'three';
import { PhysicsControls } from '../controls/base/PhysicsControls';
declare class PhysicsControlsHelper extends LineSegments<CapsuleGeometry, LineBasicMaterial> {
    readonly type: string;
    /**
     * The PhysicsControls instance to visualize.
     */
    controls: PhysicsControls;
    private _colliderPosition;
    /**
     * Constructs a new PhysicsControlsHelper.
     * @param controls - The PhysicsControls instance to visualize.
     * @param color - The color for the helper visualization.
     */
    constructor(controls: PhysicsControls, color?: ColorRepresentation);
    /**
     * Updates the position and rotation of the helper to match the controls' object.
     */
    update(): void;
    /**
     * Disposes of the helper's geometry and material.
     */
    dispose(): void;
}
export { PhysicsControlsHelper };
