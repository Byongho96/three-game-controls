import { Line3, Vector3, type Triangle } from 'three';
import { type Capsule } from 'three/examples/jsm/math/Capsule';
/**
 * Finds the closest points between two line segments in 3D space.
 * This function can optionally write the resulting points into `target1` and `target2`.
 *
 * @param {Line3} line1 - The first line segment.
 * @param {Line3} line2 - The second line segment.
 * @param {Vector3 | null} [target1=null] - If provided, this will be set to the closest point on `line1`.
 * @param {Vector3 | null} [target2=null] - If provided, this will be set to the closest point on `line2`.
 */
export declare function lineToLineClosestPoints(line1: Line3, line2: Line3, target1?: Vector3 | null, target2?: Vector3 | null): void;
/**
 * Checks the intersection between a capsule and a triangle in 3D.
 * If they intersect, returns an object containing intersection details;
 *
 * @param {Capsule} capsule - The capsule to check for intersection.
 * @param {Triangle} triangle - The triangle to check against.
*/
export declare function triangleCapsuleIntersect(capsule: Capsule, triangle: Triangle): false | {
    normal: Vector3;
    point: Vector3;
    depth: number;
};
