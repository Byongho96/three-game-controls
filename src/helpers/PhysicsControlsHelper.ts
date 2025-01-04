import {
	CapsuleGeometry,
	ColorRepresentation,
	LineBasicMaterial,
	LineSegments,
} from 'three';
import { PhysicsControls } from '../controls/base/PhysicsControls';

class PhysicsControlsHelper extends LineSegments<CapsuleGeometry, LineBasicMaterial> {

	readonly type: string = 'PhysicsControlsHelper';

	private _controls: PhysicsControls;

	/**
	 * Constructs a new PhysicsControlsHelper.
	 * @param controls - The PhysicsControls instance to visualize.
	 * @param color - The color for the helper visualization.
	 */
	constructor( controls: PhysicsControls, color: ColorRepresentation = 0xffffff ) {

		const capsuleGeometry = new CapsuleGeometry( controls.collider.radius, controls.collider.length );
		super( capsuleGeometry, new LineBasicMaterial( { color: color, toneMapped: false } ) );

		this._controls = controls;

		this.matrixAutoUpdate = false;
		this.frustumCulled = false;

		this.update();

	}

	/**
	 * Updates the position and rotation of the helper to match the controls' object.
	 */
	update() {

		// Sync the collider size
		this.geometry.dispose();
		this.geometry = new CapsuleGeometry(
			this._controls.collider.radius,
			this._controls.collider.length,
		);

		// Sync the collider position
		this.position.copy( this._controls.collider.position );

		this.updateMatrix();

	}

	/**
   * Disposes of the helper's geometry and material.
   */
	dispose() {

		this.geometry.dispose();
		this.material.dispose();

	}

}

export { PhysicsControlsHelper };
