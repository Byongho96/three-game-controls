import { Box3, Triangle, Vector3, Layers, type Ray, type Object3D } from 'three';
import { Capsule } from 'three/examples/jsm/math/Capsule.js';
declare class BVH {
    /** The bounding box of this BVH node used for intersection tests.
     * @default new THREE.Box3()
     */
    box: Box3;
    /** The min max bounds of all the triangles in the BVH.
     * @default new THREE.Box3()
     */
    bounds: Box3;
    /** The max depth of the BVH tree. This is used to limit the recursion depth. Up to (2 ** depth) BVH nodes can be created.
     * @default 48
     */
    depth: number;
    /** The threshold triangle size used to determine duplication at boundaries. Triangles larger than this value may be duplicated across sub-BVH nodes.
     * @default 0.01
     */
    duplicationThreshold: number;
    /** Which layers (bitmask) this BVH should consider.
     * @default new THREE.Layers()
     */
    layers: Layers;
    /** The sub-BVH node that contains the minimum volume among the split regions.
     * @default null
     */
    minVolume: BVH | null;
    /** The sub-BVH node that contains the maximum volume among the split regions.
     * @default null
     */
    maxVolume: BVH | null;
    /** Triangles directly stored at this volume. If this volume has sub-volumes, this will be empty.
     * @default []
     */
    triangles: Triangle[];
    /** Constructs a new BVH instance.
     * @param {Box3} [box] - Optional bounding box to start with.
     */
    constructor(box?: Box3);
    /**
     * Adds a triangle to this node, expanding the node's bounds if necessary.
     * @param {Triangle} triangle
     */
    addTriangle(triangle: Triangle): void;
    /**
     * Calculates the bounding box of this BVH node based on the stored triangles. Use this after adding triangles.
     */
    calcBox(): void;
    /**
     * Optimizes the bounding box of this node to fit within the bounds of the parent node. Use this after the size of the box is determined.
     */
    optimizeBox(): void;
    /**
     * Recursively splits this node into two child BVHs along the largest axis, distributing triangles into sub-volumes.
     * @param {number} level - Current depth of recursion (used to limit max depth).
     */
    split(level: number): void;
    /**
     * Builds the BVH by recursively splitting the node until the max. Use this after adding triangles.
     */
    build(): void;
    /**
     * Build BVH by traversing an Object3D hierarchy. It will gather triangles from Meshes in the specified layers, and build a BVH.
     * @param {Object3D} group - The root Object3D to traverse.
     */
    buildFromObject(group: Object3D): void;
    protected _getRayTriangles(ray: Ray, triangles: Triangle[]): void;
    protected _getCapsuleTriangles(capsule: Capsule, triangles: Triangle[]): void;
    /**
     * Performs a ray intersection test against the BVH. Returns the closest intersection or false.
     * @param {Ray} ray - The ray to test against the BVH.
     */
    rayIntersect(ray: Ray): {
        distance: number;
        triangle: Triangle;
        position: Vector3;
    } | false;
    /**
     * Check for intersections between a capsule and the BVH.
     * @param {Capsule} capsule - The capsule to test against the BVH.
     */
    capsuleIntersect(capsule: Capsule): {
        normal: Vector3;
        depth: number;
    } | false;
    /**
     * Clears this BVH node's data. Useful if you want to reuse the BVH object.
     */
    clear(): this;
}
export { BVH };
