import { Vector3 } from 'three';
import { Capsule } from 'three/examples/jsm/math/Capsule.js';

class Collider extends Capsule {

	private _center: Vector3 = new Vector3();

	/**
	 * Constructs a new Collider instance.
	 * @param start - The starting point of the capsule.
	 * @param end - The ending point of the capsule.
	 * @param radius - The radius of the capsule.
	 */
	constructor( start?: Vector3, end?: Vector3, radius?: number ) {

		super( start, end, radius );

	}

	/**
	 * Gets the length of the capsule (distance between start and end points).
	 */
	get length() {

		return this.start.distanceTo( this.end );

	}

	/**
	 * Sets the length of the capsule by modifying the start and end points while preserving the center position.
	 * @param value - The new length of the capsule.
	 */
	set length( value: number ) {

		const center = this.getCenter( this._center );
		const direction = this.end.clone().sub( this.start ).normalize().multiplyScalar( value / 2 );

		this.start.copy( center ).sub( direction );
		this.end.copy( center ).add( direction );

	}

}

export { Collider };
