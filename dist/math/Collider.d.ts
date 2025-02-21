import { Vector3 } from 'three';
import { Capsule } from 'three/examples/jsm/math/Capsule.js';
declare class Collider extends Capsule {
    private _center;
    /**
     * Constructs a new Collider instance.
     * @param start - The starting point of the capsule.
     * @param end - The ending point of the capsule.
     * @param radius - The radius of the capsule.
     */
    constructor(start?: Vector3, end?: Vector3, radius?: number);
    /**
     * Gets the length of the capsule (distance between start and end points).
     */
    get length(): number;
    /**
     * Sets the length of the capsule by modifying the start and end points while preserving the center position.
     * @param value - The new length of the capsule.
     */
    set length(value: number);
}
export { Collider };
