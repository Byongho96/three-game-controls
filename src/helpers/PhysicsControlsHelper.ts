import {
	CapsuleGeometry,
	LineBasicMaterial,
	LineSegments,
	Vector3,
	type ColorRepresentation,
} from 'three';
import { PhysicsControls } from '../controls/base/PhysicsControls';

class PhysicsControlsHelper extends LineSegments<CapsuleGeometry, LineBasicMaterial> {

	readonly type: string = 'PhysicsControlsHelper';

	/**
	 * The PhysicsControls instance to visualize.
	 */
	controls: PhysicsControls;

	// Internals
	private _colliderPosition: Vector3 = new Vector3();

	/**
	 * Constructs a new PhysicsControlsHelper.
	 * @param controls - The PhysicsControls instance to visualize.
	 * @param color - The color for the helper visualization.
	 */
	constructor( controls: PhysicsControls, color: ColorRepresentation = 0xffffff ) {

		const capsuleGeometry = new CapsuleGeometry( controls.collider.radius, controls.collider.length );
		super( capsuleGeometry, new LineBasicMaterial( { color: color, toneMapped: false } ) );

		this.controls = controls;

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
			this.controls.collider.radius,
			this.controls.collider.length,
		);

		// Sync the collider position
		this.position.copy( this.controls.collider.getCenter( this._colliderPosition ) );

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
