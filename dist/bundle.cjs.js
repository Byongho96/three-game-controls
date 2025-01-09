'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var three = require('three');

function _classCallCheck(a, n) {
  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
}
function _defineProperties(e, r) {
  for (var t = 0; t < r.length; t++) {
    var o = r[t];
    o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o);
  }
}
function _createClass(e, r, t) {
  return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", {
    writable: !1
  }), e;
}
function _toPrimitive(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == typeof i ? i : i + "";
}

var Capsule = /*#__PURE__*/function () {
  function Capsule() {
    var start = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new three.Vector3(0, 0, 0);
    var end = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new three.Vector3(0, 1, 0);
    var radius = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
    _classCallCheck(this, Capsule);
    this.start = start;
    this.end = end;
    this.radius = radius;
  }
  return _createClass(Capsule, [{
    key: "clone",
    value: function clone() {
      return new Capsule(this.start.clone(), this.end.clone(), this.radius);
    }
  }, {
    key: "set",
    value: function set(start, end, radius) {
      this.start.copy(start);
      this.end.copy(end);
      this.radius = radius;
    }
  }, {
    key: "copy",
    value: function copy(capsule) {
      this.start.copy(capsule.start);
      this.end.copy(capsule.end);
      this.radius = capsule.radius;
    }
  }, {
    key: "getCenter",
    value: function getCenter(target) {
      return target.copy(this.end).add(this.start).multiplyScalar(0.5);
    }
  }, {
    key: "translate",
    value: function translate(v) {
      this.start.add(v);
      this.end.add(v);
    }
  }, {
    key: "checkAABBAxis",
    value: function checkAABBAxis(p1x, p1y, p2x, p2y, minx, maxx, miny, maxy, radius) {
      return (minx - p1x < radius || minx - p2x < radius) && (p1x - maxx < radius || p2x - maxx < radius) && (miny - p1y < radius || miny - p2y < radius) && (p1y - maxy < radius || p2y - maxy < radius);
    }
  }, {
    key: "intersectsBox",
    value: function intersectsBox(box) {
      return this.checkAABBAxis(this.start.x, this.start.y, this.end.x, this.end.y, box.min.x, box.max.x, box.min.y, box.max.y, this.radius) && this.checkAABBAxis(this.start.x, this.start.z, this.end.x, this.end.z, box.min.x, box.max.x, box.min.z, box.max.z, this.radius) && this.checkAABBAxis(this.start.y, this.start.z, this.end.y, this.end.z, box.min.y, box.max.y, box.min.z, box.max.z, this.radius);
    }
  }]);
}();

var _v1 = new three.Vector3();
var _v2 = new three.Vector3();
var _point1 = new three.Vector3();
var _point2 = new three.Vector3();
var _plane = new three.Plane();
var _line1 = new three.Line3();
var _line2 = new three.Line3();
var _sphere = new three.Sphere();
var _capsule = new Capsule();
var _temp1 = new three.Vector3();
var _temp2 = new three.Vector3();
var _temp3 = new three.Vector3();
var EPS = 1e-10;
function lineToLineClosestPoints(line1, line2) {
  var target1 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var target2 = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
  var r = _temp1.copy(line1.end).sub(line1.start);
  var s = _temp2.copy(line2.end).sub(line2.start);
  var w = _temp3.copy(line2.start).sub(line1.start);
  var a = r.dot(s),
    b = r.dot(r),
    c = s.dot(s),
    d = s.dot(w),
    e = r.dot(w);
  var t1, t2;
  var divisor = b * c - a * a;
  if (Math.abs(divisor) < EPS) {
    var d1 = -d / c;
    var d2 = (a - d) / c;
    if (Math.abs(d1 - 0.5) < Math.abs(d2 - 0.5)) {
      t1 = 0;
      t2 = d1;
    } else {
      t1 = 1;
      t2 = d2;
    }
  } else {
    t1 = (d * a + e * c) / divisor;
    t2 = (t1 * a - d) / c;
  }
  t2 = Math.max(0, Math.min(1, t2));
  t1 = Math.max(0, Math.min(1, t1));
  if (target1) {
    target1.copy(r).multiplyScalar(t1).add(line1.start);
  }
  if (target2) {
    target2.copy(s).multiplyScalar(t2).add(line2.start);
  }
}
var Octree = /*#__PURE__*/function () {
  function Octree(box) {
    _classCallCheck(this, Octree);
    this.box = box;
    this.bounds = new three.Box3();
    this.subTrees = [];
    this.triangles = [];
    this.layers = new three.Layers();
  }
  return _createClass(Octree, [{
    key: "addTriangle",
    value: function addTriangle(triangle) {
      this.bounds.min.x = Math.min(this.bounds.min.x, triangle.a.x, triangle.b.x, triangle.c.x);
      this.bounds.min.y = Math.min(this.bounds.min.y, triangle.a.y, triangle.b.y, triangle.c.y);
      this.bounds.min.z = Math.min(this.bounds.min.z, triangle.a.z, triangle.b.z, triangle.c.z);
      this.bounds.max.x = Math.max(this.bounds.max.x, triangle.a.x, triangle.b.x, triangle.c.x);
      this.bounds.max.y = Math.max(this.bounds.max.y, triangle.a.y, triangle.b.y, triangle.c.y);
      this.bounds.max.z = Math.max(this.bounds.max.z, triangle.a.z, triangle.b.z, triangle.c.z);
      this.triangles.push(triangle);
      return this;
    }
  }, {
    key: "calcBox",
    value: function calcBox() {
      this.box = this.bounds.clone();

      // offset small amount to account for regular grid
      this.box.min.x -= 0.01;
      this.box.min.y -= 0.01;
      this.box.min.z -= 0.01;
      return this;
    }
  }, {
    key: "split",
    value: function split(level) {
      if (!this.box) return;
      var subTrees = [];
      var halfsize = _v2.copy(this.box.max).sub(this.box.min).multiplyScalar(0.5);
      for (var x = 0; x < 2; x++) {
        for (var y = 0; y < 2; y++) {
          for (var z = 0; z < 2; z++) {
            var box = new three.Box3();
            var v = _v1.set(x, y, z);
            box.min.copy(this.box.min).add(v.multiply(halfsize));
            box.max.copy(box.min).add(halfsize);
            subTrees.push(new Octree(box));
          }
        }
      }
      var triangle;
      while (triangle = this.triangles.pop()) {
        for (var i = 0; i < subTrees.length; i++) {
          if (subTrees[i].box.intersectsTriangle(triangle)) {
            subTrees[i].triangles.push(triangle);
          }
        }
      }
      for (var _i = 0; _i < subTrees.length; _i++) {
        var len = subTrees[_i].triangles.length;
        if (len > 8 && level < 16) {
          subTrees[_i].split(level + 1);
        }
        if (len !== 0) {
          this.subTrees.push(subTrees[_i]);
        }
      }
      return this;
    }
  }, {
    key: "build",
    value: function build() {
      this.calcBox();
      this.split(0);
      return this;
    }
  }, {
    key: "getRayTriangles",
    value: function getRayTriangles(ray, triangles) {
      for (var i = 0; i < this.subTrees.length; i++) {
        var subTree = this.subTrees[i];
        if (!ray.intersectsBox(subTree.box)) continue;
        if (subTree.triangles.length > 0) {
          for (var j = 0; j < subTree.triangles.length; j++) {
            if (triangles.indexOf(subTree.triangles[j]) === -1) triangles.push(subTree.triangles[j]);
          }
        } else {
          subTree.getRayTriangles(ray, triangles);
        }
      }
      return triangles;
    }
  }, {
    key: "triangleCapsuleIntersect",
    value: function triangleCapsuleIntersect(capsule, triangle) {
      triangle.getPlane(_plane);
      var d1 = _plane.distanceToPoint(capsule.start) - capsule.radius;
      var d2 = _plane.distanceToPoint(capsule.end) - capsule.radius;
      if (d1 > 0 && d2 > 0 || d1 < -capsule.radius && d2 < -capsule.radius) {
        return false;
      }
      var delta = Math.abs(d1 / (Math.abs(d1) + Math.abs(d2)));
      var intersectPoint = _v1.copy(capsule.start).lerp(capsule.end, delta);
      if (triangle.containsPoint(intersectPoint)) {
        return {
          normal: _plane.normal.clone(),
          point: intersectPoint.clone(),
          depth: Math.abs(Math.min(d1, d2))
        };
      }
      var r2 = capsule.radius * capsule.radius;
      var line1 = _line1.set(capsule.start, capsule.end);
      var lines = [[triangle.a, triangle.b], [triangle.b, triangle.c], [triangle.c, triangle.a]];
      for (var i = 0; i < lines.length; i++) {
        var line2 = _line2.set(lines[i][0], lines[i][1]);
        lineToLineClosestPoints(line1, line2, _point1, _point2);
        if (_point1.distanceToSquared(_point2) < r2) {
          return {
            normal: _point1.clone().sub(_point2).normalize(),
            point: _point2.clone(),
            depth: capsule.radius - _point1.distanceTo(_point2)
          };
        }
      }
      return false;
    }
  }, {
    key: "triangleSphereIntersect",
    value: function triangleSphereIntersect(sphere, triangle) {
      triangle.getPlane(_plane);
      if (!sphere.intersectsPlane(_plane)) return false;
      var depth = Math.abs(_plane.distanceToSphere(sphere));
      var r2 = sphere.radius * sphere.radius - depth * depth;
      var plainPoint = _plane.projectPoint(sphere.center, _v1);
      if (triangle.containsPoint(sphere.center)) {
        return {
          normal: _plane.normal.clone(),
          point: plainPoint.clone(),
          depth: Math.abs(_plane.distanceToSphere(sphere))
        };
      }
      var lines = [[triangle.a, triangle.b], [triangle.b, triangle.c], [triangle.c, triangle.a]];
      for (var i = 0; i < lines.length; i++) {
        _line1.set(lines[i][0], lines[i][1]);
        _line1.closestPointToPoint(plainPoint, true, _v2);
        var d = _v2.distanceToSquared(sphere.center);
        if (d < r2) {
          return {
            normal: sphere.center.clone().sub(_v2).normalize(),
            point: _v2.clone(),
            depth: sphere.radius - Math.sqrt(d)
          };
        }
      }
      return false;
    }
  }, {
    key: "getSphereTriangles",
    value: function getSphereTriangles(sphere, triangles) {
      for (var i = 0; i < this.subTrees.length; i++) {
        var subTree = this.subTrees[i];
        if (!sphere.intersectsBox(subTree.box)) continue;
        if (subTree.triangles.length > 0) {
          for (var j = 0; j < subTree.triangles.length; j++) {
            if (triangles.indexOf(subTree.triangles[j]) === -1) triangles.push(subTree.triangles[j]);
          }
        } else {
          subTree.getSphereTriangles(sphere, triangles);
        }
      }
    }
  }, {
    key: "getCapsuleTriangles",
    value: function getCapsuleTriangles(capsule, triangles) {
      for (var i = 0; i < this.subTrees.length; i++) {
        var subTree = this.subTrees[i];
        if (!capsule.intersectsBox(subTree.box)) continue;
        if (subTree.triangles.length > 0) {
          for (var j = 0; j < subTree.triangles.length; j++) {
            if (triangles.indexOf(subTree.triangles[j]) === -1) triangles.push(subTree.triangles[j]);
          }
        } else {
          subTree.getCapsuleTriangles(capsule, triangles);
        }
      }
    }
  }, {
    key: "sphereIntersect",
    value: function sphereIntersect(sphere) {
      _sphere.copy(sphere);
      var triangles = [];
      var result,
        hit = false;
      this.getSphereTriangles(sphere, triangles);
      for (var i = 0; i < triangles.length; i++) {
        if (result = this.triangleSphereIntersect(_sphere, triangles[i])) {
          hit = true;
          _sphere.center.add(result.normal.multiplyScalar(result.depth));
        }
      }
      if (hit) {
        var collisionVector = _sphere.center.clone().sub(sphere.center);
        var depth = collisionVector.length();
        return {
          normal: collisionVector.normalize(),
          depth: depth
        };
      }
      return false;
    }
  }, {
    key: "capsuleIntersect",
    value: function capsuleIntersect(capsule) {
      _capsule.copy(capsule);
      var triangles = [];
      var result,
        hit = false;
      this.getCapsuleTriangles(_capsule, triangles);
      for (var i = 0; i < triangles.length; i++) {
        if (result = this.triangleCapsuleIntersect(_capsule, triangles[i])) {
          hit = true;
          _capsule.translate(result.normal.multiplyScalar(result.depth));
        }
      }
      if (hit) {
        var collisionVector = _capsule.getCenter(new three.Vector3()).sub(capsule.getCenter(_v1));
        var depth = collisionVector.length();
        return {
          normal: collisionVector.normalize(),
          depth: depth
        };
      }
      return false;
    }
  }, {
    key: "rayIntersect",
    value: function rayIntersect(ray) {
      if (ray.direction.length() === 0) return;
      var triangles = [];
      var triangle,
        position,
        distance = 1e100;
      this.getRayTriangles(ray, triangles);
      for (var i = 0; i < triangles.length; i++) {
        var result = ray.intersectTriangle(triangles[i].a, triangles[i].b, triangles[i].c, true, _v1);
        if (result) {
          var newdistance = result.sub(ray.origin).length();
          if (distance > newdistance) {
            position = result.clone().add(ray.origin);
            distance = newdistance;
            triangle = triangles[i];
          }
        }
      }
      return distance < 1e100 ? {
        distance: distance,
        triangle: triangle,
        position: position
      } : false;
    }
  }, {
    key: "fromGraphNode",
    value: function fromGraphNode(group) {
      var _this = this;
      group.updateWorldMatrix(true, true);
      group.traverse(function (obj) {
        if (obj.isMesh === true) {
          if (_this.layers.test(obj.layers)) {
            var geometry,
              isTemp = false;
            if (obj.geometry.index !== null) {
              isTemp = true;
              geometry = obj.geometry.toNonIndexed();
            } else {
              geometry = obj.geometry;
            }
            var positionAttribute = geometry.getAttribute('position');
            for (var i = 0; i < positionAttribute.count; i += 3) {
              var v1 = new three.Vector3().fromBufferAttribute(positionAttribute, i);
              var v2 = new three.Vector3().fromBufferAttribute(positionAttribute, i + 1);
              var v3 = new three.Vector3().fromBufferAttribute(positionAttribute, i + 2);
              v1.applyMatrix4(obj.matrixWorld);
              v2.applyMatrix4(obj.matrixWorld);
              v3.applyMatrix4(obj.matrixWorld);
              _this.addTriangle(new three.Triangle(v1, v2, v3));
            }
            if (isTemp) {
              geometry.dispose();
            }
          }
        }
      });
      this.build();
      return this;
    }
  }, {
    key: "clear",
    value: function clear() {
      this.box = null;
      this.bounds.makeEmpty();
      this.subTrees.length = 0;
      this.triangles.length = 0;
      return this;
    }
  }]);
}();

class Collider extends Capsule {
    /**
     * Constructs a new Collider instance.
     * @param start - The starting point of the capsule.
     * @param end - The ending point of the capsule.
     * @param radius - The radius of the capsule.
     */
    constructor(start, end, radius) {
        super(start, end, radius);
        this._center = new three.Vector3();
    }
    /**
     * Gets the length of the capsule (distance between start and end points).
     */
    get length() {
        return this.start.distanceTo(this.end);
    }
    /**
     * Sets the length of the capsule by modifying the start and end points while preserving the center position.
     * @param value - The new length of the capsule.
     */
    set length(value) {
        const center = this.getCenter(this._center);
        const direction = this.end.clone().sub(this.start).normalize().multiplyScalar(value / 2);
        this.start.copy(center).sub(direction);
        this.end.copy(center).add(direction);
    }
}

const _collideEvent = { type: 'collide' };
class PhysicsControls extends three.Controls {
    /**
     * Constructs a new PhysicsControls instance.
     * @param object - The 3D object to apply physics controls to.
     * @param domElement - The HTML element for event listeners.
     * @param world - The world object used to build the collision octree.
     */
    constructor(object, domElement = null, world = null) {
        super(object, domElement);
        /** Octree structure of the world object for collision detection. */
        this.worldOctree = new Octree();
        /** Gravitational force applied to the object.
         * @default 30
         */
        this.gravity = 30;
        /** Maximum fall speed of the object.
         * @default 20
         */
        this.maxFallSpeed = 20;
        /** Resistance applied to the object, dampen velocity.
         * @default 6
         */
        this.resistance = 6;
        /** World axis velocity vector of the object.
         * @default `new THREE.Vector3()` - that is `(0, 0, 0)`
         */
        this.velocity = new three.Vector3();
        /** Time step for calculating physics with more precision.
         * @default 5
         */
        this.step = 5;
        /** Time threshold for determining if the object is landing. (sec)
         * @default 0.3
         */
        this.landTimeThreshold = 0.3;
        /** Distance tolerance for landing detection.
         * @default 0.2
         */
        this.landTolerance = 0.2;
        /** Collider for the object.
         * @default `new Collider()`
         */
        this.collider = new Collider();
        /** Reset position for the object when it's out of the boundary
         * @default `new THREE.Vector3()` - that is `(0, 0, 0)`
         */
        this.resetPoint = new three.Vector3();
        /** X-axis boundary: minimum value.
         * @default - Infinity
         */
        this.minXBoundary = -Infinity;
        /** X-axis boundary: maximum value.
         * @default Infinity
         */
        this.maxXBoundary = Infinity;
        /** Y-axis boundary: minimum value.
         * @default - Infinity
         */
        this.minYBoundary = -Infinity;
        /** Y-axis boundary: maximum value.
         * @default Infinity
         */
        this.maxYBoundary = Infinity;
        /** Z-axis boundary: minimum value.
         * @default - Infinity
         */
        this.minZBoundary = -Infinity;
        /** Z-axis boundary: maximum value.
         * @default Infinity
         */
        this.maxZBoundary = Infinity;
        // Flags
        this._isLanding = false;
        this._isGrounded = false;
        // Internals
        this._ray = new three.Ray(new three.Vector3(), new three.Vector3(0, -1, 0));
        this._distance = new three.Vector3();
        this._objectWorldPosition = new three.Vector3();
        this._objectWorldQuaternion = new three.Quaternion();
        this._colliderLocalPosition = new three.Vector3();
        this._world = world;
        if (world)
            this.worldOctree.fromGraphNode(world);
    }
    /**
     * Gets the current world object.
     */
    get world() {
        return this._world;
    }
    /**
     * Sets a new world object and rebuilds the collision octree.
     * @param world - The new world object.
     */
    set world(world) {
        this._world = world;
        if (world)
            this.worldOctree.fromGraphNode(world);
    }
    /**
     * Checks if the object is currently landing.
     */
    get isLanding() {
        return this._isLanding;
    }
    /**
     * Checks if the object is currently grounded.
     */
    get isGrounded() {
        return this._isGrounded;
    }
    /**
     * Returns the velocity into the object's local coordinate system.
     * @param target - The result will be copied into this vector.
     */
    getLocalVelocity(target) {
        this.object.getWorldQuaternion(this._objectWorldQuaternion);
        return target.copy(this.velocity).applyQuaternion(this._objectWorldQuaternion.invert());
    }
    // Check for collisions and translate the collider.
    _checkCollisions() {
        this._isGrounded = false;
        const collisionResult = this.worldOctree.capsuleIntersect(this.collider); // Check for collisions with the world octree.
        if (!collisionResult)
            return;
        if (collisionResult.normal.y > 0) {
            this._isGrounded = true;
            this.velocity.y = 0;
        }
        if (collisionResult.depth >= 1e-10) {
            this.collider.translate(collisionResult.normal.multiplyScalar(collisionResult.depth));
            this.dispatchEvent({ ..._collideEvent, normal: collisionResult.normal.normalize() });
        }
    }
    // Check if the object is landing based on the landTimeThreshold.
    _checkIsLanding() {
        this._isLanding = false;
        if (this._isGrounded || this.velocity.y >= 0)
            return;
        this._ray.origin.copy(this.collider.start).y -= this.collider.radius;
        const rayResult = this.worldOctree.rayIntersect(this._ray);
        const t1 = Math.min((this.maxFallSpeed + this.velocity.y) / this.gravity, this.landTimeThreshold);
        const d1 = (-this.velocity.y + 0.5 * this.gravity * t1) * t1;
        const t2 = this.landTimeThreshold - t1;
        const d2 = this.maxFallSpeed * t2;
        if (this.landTolerance < rayResult.distance && rayResult.distance < d1 + d2) {
            this._isLanding = true;
        }
    }
    // Teleport the player back to the reset point if it's out of the boundary.
    _teleportPlayerIfOutOfBounds() {
        const { x: px, y: py, z: pz } = this.object.getWorldPosition(this._objectWorldPosition);
        if (px < this.minXBoundary || px > this.maxXBoundary || py < this.minYBoundary || py > this.maxYBoundary || pz < this.minZBoundary || pz > this.maxZBoundary) {
            this.collider.translate(this._distance.subVectors(this.resetPoint, this._objectWorldPosition));
            this.velocity.set(0, 0, 0);
        }
    }
    /**
     * Calculate the physics collision calculations and update object state.
     * @param delta - The time elapsed since the last update (sec).
     */
    update(delta) {
        super.update(delta);
        if (!this.enabled)
            return;
        const stepDelta = delta / this.step;
        for (let i = 0; i < this.step; i++) {
            let damping = Math.exp(-this.resistance * stepDelta) - 1; // Always negative (resistance)
            if (!this._isGrounded) {
                this.velocity.y -= this.gravity * stepDelta;
                this.velocity.y = Math.max(this.velocity.y, -this.maxFallSpeed);
                damping *= 0.1; // Small air resistance
            }
            this.velocity.x += damping * this.velocity.x;
            this.velocity.z += damping * this.velocity.z;
            this._distance.copy(this.velocity).multiplyScalar(stepDelta);
            this.collider.translate(this._distance);
            this._checkCollisions();
        }
        this._checkIsLanding();
        this._teleportPlayerIfOutOfBounds();
        // Sync the object's position with the collider.
        this._colliderLocalPosition.copy(this.collider.start);
        this._colliderLocalPosition.y -= this.collider.radius;
        if (this.object.parent)
            this.object.parent.worldToLocal(this._colliderLocalPosition);
        this.object.position.copy(this._colliderLocalPosition);
    }
}

const _worldYDirection$1 = new three.Vector3(0, 1, 0);
class FirstPersonControls extends PhysicsControls {
    /**
     * Constructs a new FirstPersonControls instance.
     * @param object - The object to control.
     * @param domElement - The DOM element for capturing input.
     * @param world - The world object used for collision detection.
     */
    constructor(object, domElement = null, world = null) {
        super(object, domElement, world);
        this.actionStates = {
            'MOVE_FORWARD': 0,
            'MOVE_BACKWARD': 0,
            'MOVE_LEFTWARD': 0,
            'MOVE_RIGHTWARD': 0,
            'JUMP': 0,
            'ACCELERATE': 0,
            'ROTATE_UP': 0,
            'ROTATE_DOWN': 0,
            'ROTATE_RIGHT': 0,
            'ROTATE_LEFT': 0
        };
        /** Height of the camera from the ground
         * @default 1.5
         */
        this.eyeHeight = 1.6;
        /** Force applied for jumping.
         * @default 15
         */
        this.jumpForce = 15;
        /** Speed of movement when grounded.
         * @default 30
         */
        this.groundedMoveSpeed = 30;
        /** Speed of movement when floating.
         * @default 8
         */
        this.floatingMoveSpeed = 8;
        /** Speed of rotation.
         * @default 1
         */
        this.rotateSpeed = 1;
        /** Whether to enable acceleration when holding the accelerate key.
         * @default true
         */
        this.enableAcceleration = true;
        /** Multiplier for movement speed when accelerating.
         * @default 1.5
         */
        this.accelerationFactor = 1.5;
        /** Whether to enable zooming with the mouse wheel.
         * @default true
         */
        this.enableZoom = true;
        /** Speed of zooming.
         * @default 1
         */
        this.zoomSpeed = 1;
        // Internals
        this._movementVector = new three.Vector3();
        this._objectLocalVector = new three.Vector3();
        this._bindOnMouseWheel = this._onMouseWheel.bind(this);
        this.object.rotation.order = 'YZX';
        // Set the collider size based on the eye height.
        this.collider.radius = this.eyeHeight / 4;
        this.collider.length = this.eyeHeight / 2;
        this.connect();
    }
    /**
     * Returns the forward direction vector of the object.
     * @param target - The result will be copied into this vector.
     */
    getForwardVector(target) {
        this.object.getWorldDirection(target);
        target.y = 0;
        target.normalize();
        return target;
    }
    /**
         * Returns the right direction vector of the object.
         * @param target - The result will be copied into this vector.
         */
    getRightwardVector(target) {
        this.object.getWorldDirection(target);
        target.y = 0;
        target.cross(_worldYDirection$1);
        target.normalize();
        return target;
    }
    _updateMovement(delta) {
        // Calculate speed
        let speedDelta = delta * (this.isGrounded ? this.groundedMoveSpeed : this.floatingMoveSpeed);
        if (this.enableAcceleration && this.actionStates.ACCELERATE)
            speedDelta *= this.accelerationFactor;
        // Move
        this._movementVector.set(0, 0, 0);
        if (this.actionStates.MOVE_FORWARD)
            this._movementVector.add(this.getForwardVector(this._objectLocalVector).multiplyScalar(this.actionStates.MOVE_FORWARD * speedDelta));
        if (this.actionStates.MOVE_BACKWARD)
            this._movementVector.sub(this.getForwardVector(this._objectLocalVector).multiplyScalar(this.actionStates.MOVE_BACKWARD * speedDelta));
        if (this.actionStates.MOVE_RIGHTWARD)
            this._movementVector.add(this.getRightwardVector(this._objectLocalVector).multiplyScalar(this.actionStates.MOVE_RIGHTWARD * speedDelta));
        if (this.actionStates.MOVE_LEFTWARD)
            this._movementVector.sub(this.getRightwardVector(this._objectLocalVector).multiplyScalar(this.actionStates.MOVE_LEFTWARD * speedDelta));
        // Jump.
        if (this.actionStates.JUMP && this.isGrounded) {
            this._movementVector.addScaledVector(_worldYDirection$1, this.jumpForce);
        }
        this.velocity.add(this._movementVector);
    }
    _updateRotation(delta) {
        const speedDelta = this.rotateSpeed * delta / 5;
        if (this.actionStates.ROTATE_UP)
            this.object.rotateX(this.actionStates.ROTATE_UP * speedDelta);
        if (this.actionStates.ROTATE_DOWN)
            this.object.rotateX(-this.actionStates.ROTATE_DOWN * speedDelta);
        if (this.actionStates.ROTATE_RIGHT)
            this.object.rotateOnWorldAxis(_worldYDirection$1, -this.actionStates.ROTATE_RIGHT * speedDelta);
        if (this.actionStates.ROTATE_LEFT)
            this.object.rotateOnWorldAxis(_worldYDirection$1, this.actionStates.ROTATE_LEFT * speedDelta);
        this.object.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.object.rotation.x));
    }
    /**
     * Update the controls.
     * @param delta - The time elapsed since the last update (sec).
     */
    update(delta) {
        super.update(delta);
        this.object.position.y += this.eyeHeight;
        this._updateMovement(delta);
        this._updateRotation(delta);
    }
    /**
     * Connects the event listeners.
     */
    connect() {
        var _a;
        super.connect();
        (_a = this.domElement) === null || _a === void 0 ? void 0 : _a.addEventListener('wheel', this._bindOnMouseWheel);
    }
    /**
     * Disconnects the event listeners.
     */
    disconnect() {
        var _a;
        super.disconnect();
        (_a = this.domElement) === null || _a === void 0 ? void 0 : _a.removeEventListener('wheel', this._bindOnMouseWheel);
    }
    _onMouseWheel(event) {
        if (!this.enableZoom)
            return;
        if (!(this.object instanceof three.PerspectiveCamera) && !(this.object instanceof three.OrthographicCamera)) {
            console.warn('WARNING: FirstPersonControls.js encountered an unknown camera type - dolly/zoom disabled.');
            this.enableZoom = false;
            return;
        }
        const normalizedDelta = Math.pow(0.95, this.zoomSpeed * Math.abs(event.deltaY * 0.01));
        if (event.deltaY > 0)
            this.object.zoom *= normalizedDelta;
        else if (event.deltaY < 0)
            this.object.zoom /= normalizedDelta;
        this.object.updateProjectionMatrix();
    }
}

const _worldYDirection = new three.Vector3(0, 1, 0);
class ThirdPersonControls extends FirstPersonControls {
    /**
     * Constructs a new ThirdPersonControls instance.
     * @param object - The character object to control.
     * @param domElement - The HTML element for capturing input events.
     * @param world - The world object used for collision detection.
     * @param animationClips - The animation clips for the character.
     * @param camera - The camera to use for third-person perspective.
     */
    constructor(object, domElement = null, world = null, animationClips = {}, camera = null) {
        super(object, domElement, world);
        // Animation clips
        this._animationClips = {};
        // Animation actions synced with the clips
        this._animationActions = {};
        // Override the eye height  of FirstPersonControls
        this.eyeHeight = 0;
        /** Time for transitioning between animations. */
        this.transitionTime = 0.3;
        /** Delay for transitioning between animations. */
        this.transitionDelay = 0.3;
        /** Speed threshold to trigger the falling animation. */
        this.fallSpeedThreshold = 15;
        /** Speed threshold to trigger the moving animation. */
        this.moveSpeedThreshold = 1;
        /** Speed threshold to trigger running animations. */
        this.runSpeedThreshold = 10;
        /** Lerp factor for smooth camera transitions.
         * @default 0.2
         */
        this.cameraLerpFactor = 0.2;
        /** Whether to rotate the object towards the moving direction.
         * @default true
         */
        this.enableRotationOnMove = true;
        /** Whether to sync the object's forward axis with the camera.
         *
         * Possible values:
         * - `'ALWAYS'`: The object's forward axis is always synchronized with the camera, regardless of movement.
         * - `'MOVE'`: The object's forward axis is synchronized with the camera only when the object is moving.
         * - `'NEVER'`: The object's forward axis is not synchronized with the camera.
         *
         * @default 'move'
         */
        this.syncAxisWithCamera = 'MOVE';
        /* Spherical coordinates for camera position.
         * @default `new THREE.Spherical()`
         */
        this._spherical = new three.Spherical();
        // Internals
        this._forwardDirection = new three.Vector3();
        this._objectLocalVelocity = new three.Vector3();
        this._objectLookAtPosition = new three.Vector3();
        this._movementDirection = new three.Vector3();
        this._currentActionKey = null;
        this._cameraLookAtPosition = new three.Vector3();
        this._cameraOffsetPosition = new three.Vector3();
        this._animationMixer = new three.AnimationMixer(this.object);
        Object.entries(animationClips).forEach(([key, clip]) => {
            this.setAnimationClip(key, clip);
        });
        this.camera = camera;
        // Set the camera position and look-at offsets based on the object size.
        const objectSize = new three.Vector3();
        new three.Box3().setFromObject(this.object).getSize(objectSize);
        this.cameraPositionOffset = new three.Vector3(0, objectSize.y * 1.5, -objectSize.y * 1.5);
        this.cameraLookAtOffset = new three.Vector3(0, objectSize.y * 0.8, 0);
        // Set the spherical coordinates.
        const subVector = this.cameraPositionOffset.clone().sub(this.cameraLookAtOffset);
        this._spherical.setFromVector3(subVector);
        this.collider.radius = objectSize.y / 4;
        this.collider.length = objectSize.y / 2;
    }
    /**
     * Gets a frozen copy of the animation clips.
     */
    get animationClips() {
        return Object.freeze({ ...this._animationClips });
    }
    /**
     * Returns the forward direction vector of the object.
     * @param target - The result will be copied into this vector.
     */
    getForwardVector(target) {
        target.copy(this._forwardDirection);
        return target;
    }
    /**
         * Returns the right direction vector of the object.
         * @param target - The result will be copied into this vector.
         */
    getRightwardVector(target) {
        target.copy(this._forwardDirection);
        target.cross(_worldYDirection);
        return target;
    }
    /**
     * Sets an animation clip for a given key.
     * @param key - The key to associate with the animation clip.
     * @param clip - The animation clip.
     */
    setAnimationClip(key, clip) {
        const action = this._animationMixer.clipAction(clip);
        this._animationClips[key] = clip;
        this._animationActions[key] = action;
    }
    /**
     * Deletes an animation clip associated with a given key.
     * @param key - The key of the animation clip to delete.
     */
    deleteAnimationClip(key) {
        const clip = this._animationClips[key];
        const action = this._animationActions[key];
        if (action) {
            action.stop();
            this._animationMixer.uncacheAction(clip, this.object);
            delete this._animationActions[key];
        }
        if (clip) {
            this._animationMixer.uncacheClip(clip);
            delete this._animationClips[key];
        }
    }
    /**
     * Gets the animation action associated with a given key.
     * @param key - The key of the animation action to retrieve.
     */
    getAnimationAction(key) {
        return this._animationActions[key];
    }
    // Fades to a new animation action
    _fadeToAction(key, duration, isOnce) {
        if (key === this._currentActionKey)
            return;
        const action = this._animationActions[key];
        if (!action)
            return;
        const currentAction = this._currentActionKey ? this._animationActions[this._currentActionKey] : null;
        if (currentAction)
            currentAction.fadeOut(duration);
        action.reset();
        if (isOnce) {
            action.setLoop(three.LoopOnce, 1);
            action.clampWhenFinished = true;
        }
        action.fadeIn(duration);
        action.play();
        this._currentActionKey = key;
    }
    _syncForwardDirection() {
        if (!this.camera)
            return;
        if (this.syncAxisWithCamera === 'NEVER')
            return;
        if (this.syncAxisWithCamera === 'ALWAYS' || this.actionStates.MOVE_FORWARD || this.actionStates.MOVE_BACKWARD || this.actionStates.MOVE_LEFTWARD || this.actionStates.MOVE_RIGHTWARD) {
            this.camera.getWorldDirection(this._forwardDirection);
            this._forwardDirection.y = 0;
            this._forwardDirection.normalize();
            return;
        }
    }
    _updateObjectDirection() {
        this._movementDirection.copy(this.velocity);
        this._movementDirection.y = 0;
        this.object.getWorldPosition(this._objectLookAtPosition);
        // rotate on move
        if (this._movementDirection.length() > 1e-2 && this.enableRotationOnMove) {
            this._objectLookAtPosition.add(this._movementDirection);
            this.object.lookAt(this._objectLookAtPosition);
            return;
        }
        // rotate by sync
        if (this.syncAxisWithCamera === 'ALWAYS' || this._movementDirection.length() > 1e-2) {
            this._objectLookAtPosition.add(this._forwardDirection);
            this.object.lookAt(this._objectLookAtPosition);
            return;
        }
    }
    _lerpCameraPosition() {
        if (!this.camera)
            return;
        this._spherical.radius = this.cameraPositionOffset.distanceTo(this.cameraLookAtOffset);
        this.object.getWorldPosition(this._cameraLookAtPosition).add(this.cameraLookAtOffset);
        this._cameraOffsetPosition.setFromSpherical(this._spherical).add(this._cameraLookAtPosition);
        this.camera.position.lerp(this._cameraOffsetPosition, this.cameraLerpFactor);
        this.camera.lookAt(this._cameraLookAtPosition);
        this.camera.updateMatrixWorld();
    }
    // Updates the animation based on the character's state
    _updateAnimation() {
        this.getLocalVelocity(this._objectLocalVelocity);
        if (this._objectLocalVelocity.y > 0 && this._animationActions.JUMP_UP) {
            return this._fadeToAction('JUMP_UP', this.transitionTime, true);
        }
        if (this.isLanding && this._animationActions.LAND) {
            return this._fadeToAction('LAND', this.transitionTime, true);
        }
        if (this.velocity.y < -this.fallSpeedThreshold && this._currentActionKey !== 'LAND' && this._animationActions.FALL) {
            return this._fadeToAction('FALL', this.transitionTime);
        }
        if (!this.isGrounded) {
            return;
        }
        if (this._objectLocalVelocity.z > this.runSpeedThreshold && this._animationActions.RUN_FORWARD) {
            return this._fadeToAction('RUN_FORWARD', this.transitionTime);
        }
        if (this._objectLocalVelocity.z > this.moveSpeedThreshold && this._animationActions.MOVE_FORWARD) {
            return this._fadeToAction('MOVE_FORWARD', this.transitionTime);
        }
        if (this._objectLocalVelocity.z < -this.runSpeedThreshold && this._animationActions.RUN_BACKWARD) {
            return this._fadeToAction('RUN_BACKWARD', this.transitionTime);
        }
        if (this._objectLocalVelocity.z < -this.moveSpeedThreshold && this._animationActions.MOVE_BACKWARD) {
            return this._fadeToAction('MOVE_BACKWARD', this.transitionTime);
        }
        if (this._objectLocalVelocity.x < -this.runSpeedThreshold && this._animationActions.RUN_RIGHTWARD) {
            return this._fadeToAction('RUN_RIGHTWARD', this.transitionTime);
        }
        if (this._objectLocalVelocity.x < -this.moveSpeedThreshold && this._animationActions.MOVE_RIGHTWARD) {
            return this._fadeToAction('MOVE_RIGHTWARD', this.transitionTime);
        }
        if (this._objectLocalVelocity.x > this.runSpeedThreshold && this._animationActions.RUN_LEFTWARD) {
            return this._fadeToAction('RUN_LEFTWARD', this.transitionTime);
        }
        if (this._objectLocalVelocity.x > this.moveSpeedThreshold && this._animationActions.MOVE_LEFTWARD) {
            return this._fadeToAction('MOVE_LEFTWARD', this.transitionTime);
        }
        return this._fadeToAction('IDLE', this.transitionTime);
    }
    _updateRotation(delta) {
        const deltaSpeed = this.rotateSpeed * delta;
        if (this.actionStates.ROTATE_UP)
            this._spherical.phi += this.actionStates.ROTATE_UP * deltaSpeed;
        if (this.actionStates.ROTATE_DOWN)
            this._spherical.phi -= this.actionStates.ROTATE_DOWN * deltaSpeed;
        if (this.actionStates.ROTATE_RIGHT)
            this._spherical.theta -= this.actionStates.ROTATE_RIGHT * deltaSpeed;
        if (this.actionStates.ROTATE_LEFT)
            this._spherical.theta += this.actionStates.ROTATE_LEFT * deltaSpeed;
        this._spherical.makeSafe();
    }
    /**
     * Updates the character's state, including physics and animations.
     * @param delta - The time elapsed since the last update (sec).
     */
    update(delta) {
        super.update(delta);
        this._updateAnimation();
        this._animationMixer.update(delta);
        this._syncForwardDirection();
        this._updateObjectDirection();
        this._lerpCameraPosition();
    }
    /**
     * Disposes of the character controls, cleaning up animations and resources.
     */
    dispose() {
        super.dispose();
        this._animationMixer.stopAllAction();
        this._animationMixer.uncacheRoot(this.object);
    }
    // Handles the mouse wheel event for zooming the camera.
    _onMouseWheel(event) {
        if (!this.enableZoom)
            return;
        if (!(this.camera instanceof three.PerspectiveCamera) && !(this.camera instanceof three.OrthographicCamera)) {
            console.warn('WARNING: FirstPersonControls.js encountered an unknown camera type - dolly/zoom disabled.');
            this.enableZoom = false;
            return;
        }
        const normalizedDelta = Math.pow(0.95, this.zoomSpeed * Math.abs(event.deltaY * 0.01));
        if (event.deltaY > 0)
            this.camera.zoom *= normalizedDelta;
        else if (event.deltaY < 0)
            this.camera.zoom /= normalizedDelta;
        this.camera.updateProjectionMatrix();
    }
}

function KeyboardMixin(Base) {
    return class KeyboardMixin extends Base {
        constructor(...args) {
            super(...args);
            this.keyToActions = {
                'KeyW': ['MOVE_FORWARD'],
                'KeyS': ['MOVE_BACKWARD'],
                'KeyA': ['MOVE_LEFTWARD'],
                'KeyD': ['MOVE_RIGHTWARD'],
                'Space': ['JUMP'],
                'ShiftLeft': ['ACCELERATE'],
            };
            this._bindOnKeyDown = this._onKeyDown.bind(this);
            this._bindOnKeyUp = this._onKeyUp.bind(this);
            this._bindOnBlur = this._onBlur.bind(this);
            this.connect();
        }
        /**
         * Connects the controls.
         */
        connect() {
            super.connect();
            window.addEventListener('keydown', this._bindOnKeyDown);
            window.addEventListener('keyup', this._bindOnKeyUp);
            window.addEventListener('blur', this._bindOnBlur);
        }
        /**
         * Disconnects the controls.
         */
        disconnect() {
            super.disconnect();
            window.removeEventListener('keydown', this._bindOnKeyDown);
            window.removeEventListener('keyup', this._bindOnKeyUp);
            window.removeEventListener('blur', this._bindOnBlur);
        }
        /**
         * Disposes of the controls.
         */
        dispose() {
            super.dispose();
            this.disconnect();
        }
        // Handles keydown events and set action states.
        _onKeyDown(event) {
            if (event.code in this.keyToActions) {
                this.keyToActions[event.code].forEach((action) => {
                    this.actionStates[action] = 1;
                });
            }
        }
        // Handles keyup events and reset action states.
        _onKeyUp(event) {
            if (event.code in this.keyToActions) {
                this.keyToActions[event.code].forEach((action) => {
                    this.actionStates[action] = 0;
                });
            }
        }
        // Resets all the action states.
        _onBlur() {
            Object.keys(this.keyToActions).forEach((key) => {
                this.keyToActions[key].forEach((action) => {
                    this.actionStates[action] = 0;
                });
            });
        }
    };
}

class FPKeyboardControls extends KeyboardMixin(FirstPersonControls) {
    constructor() {
        super(...arguments);
        this.keyToActions = {
            'KeyW': ['MOVE_FORWARD'],
            'KeyS': ['MOVE_BACKWARD'],
            'KeyA': ['MOVE_LEFTWARD'],
            'KeyD': ['MOVE_RIGHTWARD'],
            'Space': ['JUMP'],
            'ShiftLeft': ['ACCELERATE'],
            'ArrowUp': ['ROTATE_UP'],
            'ArrowDown': ['ROTATE_DOWN'],
            'ArrowRight': ['ROTATE_RIGHT'],
            'ArrowLeft': ['ROTATE_LEFT']
        };
    }
}

function DragMixin(Base) {
    return class DragMixin extends Base {
        constructor(...args) {
            super(...args);
            this.dragXActions = ['ROTATE_RIGHT'];
            this.dragYActions = ['ROTATE_DOWN'];
            this.dragDampingFactor = 1;
            this.enableDragDamping = true;
            // Internals
            this._isMouseDown = false;
            this._bindOnMouseDown = this._onMouseDown.bind(this);
            this._bindOnMouseUp = this._onMouseUp.bind(this);
            this._bindOnMouseMove = this._onMouseMove.bind(this);
            this.connect();
        }
        /**
         * Connects the controls.
         */
        connect() {
            var _a, _b;
            super.connect();
            (_a = this.domElement) === null || _a === void 0 ? void 0 : _a.addEventListener('mousedown', this._bindOnMouseDown);
            document.addEventListener('mouseup', this._bindOnMouseUp);
            (_b = this.domElement) === null || _b === void 0 ? void 0 : _b.addEventListener('mousemove', this._bindOnMouseMove);
        }
        /**
         * Disconnects the controls.
         */
        disconnect() {
            var _a, _b;
            super.disconnect();
            (_a = this.domElement) === null || _a === void 0 ? void 0 : _a.removeEventListener('mousedown', this._bindOnMouseDown);
            document.removeEventListener('mouseup', this._bindOnMouseUp);
            (_b = this.domElement) === null || _b === void 0 ? void 0 : _b.removeEventListener('mousemove', this._bindOnMouseMove);
        }
        /**
         * Disposes of the controls.
         */
        dispose() {
            super.dispose();
            this.disconnect();
        }
        update(delta) {
            super.update(delta);
            if (this.enableDragDamping) {
                this.dragXActions.forEach((action) => {
                    this.actionStates[action] *= 1 - this.dragDampingFactor;
                });
                this.dragYActions.forEach((action) => {
                    this.actionStates[action] *= 1 - this.dragDampingFactor;
                });
            }
        }
        // Handles the mousedown event and sets the mouse down state.
        _onMouseDown() {
            this._isMouseDown = true;
        }
        // Handles the mouseup event and resets the mouse down state.
        _onMouseUp() {
            this._isMouseDown = false;
        }
        // Handles the mousemove event and update action states.
        _onMouseMove(event) {
            if (!this._isMouseDown)
                return;
            this.dragXActions.forEach((action) => {
                this.actionStates[action] = event.movementX;
            });
            this.dragYActions.forEach((action) => {
                this.actionStates[action] = event.movementY;
            });
        }
    };
}

class FPKeyboardDragControls extends KeyboardMixin(DragMixin(FirstPersonControls)) {
}

function PointerLockMixin(Base) {
    return class PointerLockMixin extends Base {
        constructor(...args) {
            super(...args);
            this.pointerLockXActions = ['ROTATE_RIGHT'];
            this.pointerLockYActions = ['ROTATE_DOWN'];
            this.pointerLockDampingFactor = 1;
            this.enablePointerLockDamping = true;
            this._bindOnMouseDown = this._onMouseDown.bind(this);
            this._bindOnMouseMove = this._onMouseMove.bind(this);
            this.connect();
        }
        /**
         * Connects the controls.
         */
        connect() {
            var _a, _b;
            super.connect();
            (_a = this.domElement) === null || _a === void 0 ? void 0 : _a.addEventListener('mousedown', this._bindOnMouseDown);
            (_b = this.domElement) === null || _b === void 0 ? void 0 : _b.addEventListener('mousemove', this._bindOnMouseMove);
        }
        /**
         * Disconnects the controls.
         */
        disconnect() {
            var _a, _b;
            super.disconnect();
            (_a = this.domElement) === null || _a === void 0 ? void 0 : _a.removeEventListener('mousedown', this._bindOnMouseDown);
            (_b = this.domElement) === null || _b === void 0 ? void 0 : _b.removeEventListener('mousemove', this._bindOnMouseMove);
        }
        /**
         * Disposes of the controls.
         */
        dispose() {
            super.dispose();
            this.disconnect();
        }
        update(delta) {
            super.update(delta);
            if (this.enablePointerLockDamping) {
                this.pointerLockXActions.forEach((action) => {
                    this.actionStates[action] *= 1 - this.pointerLockDampingFactor;
                });
                this.pointerLockYActions.forEach((action) => {
                    this.actionStates[action] *= 1 - this.pointerLockDampingFactor;
                });
            }
        }
        // Handles the mousedown event to lock pointer.
        _onMouseDown() {
            var _a;
            (_a = this.domElement) === null || _a === void 0 ? void 0 : _a.requestPointerLock();
        }
        // Handles the mousemove event and update action states.
        _onMouseMove(event) {
            if (document.pointerLockElement !== this.domElement)
                return;
            this.pointerLockXActions.forEach((action) => {
                this.actionStates[action] = event.movementX;
            });
            this.pointerLockYActions.forEach((action) => {
                this.actionStates[action] = event.movementY;
            });
        }
    };
}

class FPKeyboardPointerLockControls extends KeyboardMixin(PointerLockMixin(FirstPersonControls)) {
}

class TPKeyboardControls extends KeyboardMixin(ThirdPersonControls) {
    constructor() {
        super(...arguments);
        this.keyToActions = {
            'KeyW': ['MOVE_FORWARD'],
            'KeyS': ['MOVE_BACKWARD'],
            'KeyA': ['MOVE_LEFTWARD'],
            'KeyD': ['MOVE_RIGHTWARD'],
            'Space': ['JUMP'],
            'ShiftLeft': ['ACCELERATE'],
            'ArrowUp': ['ROTATE_UP'],
            'ArrowDown': ['ROTATE_DOWN'],
            'ArrowRight': ['ROTATE_RIGHT'],
            'ArrowLeft': ['ROTATE_LEFT']
        };
    }
}

class TPKeyboardDragControls extends KeyboardMixin(DragMixin(ThirdPersonControls)) {
}

class TPKeyboardPointerLockControls extends KeyboardMixin(PointerLockMixin(ThirdPersonControls)) {
}

class PhysicsControlsHelper extends three.LineSegments {
    /**
     * Constructs a new PhysicsControlsHelper.
     * @param controls - The PhysicsControls instance to visualize.
     * @param color - The color for the helper visualization.
     */
    constructor(controls, color = 0xffffff) {
        const capsuleGeometry = new three.CapsuleGeometry(controls.collider.radius, controls.collider.length);
        super(capsuleGeometry, new three.LineBasicMaterial({ color: color, toneMapped: false }));
        this.type = 'PhysicsControlsHelper';
        // Internals
        this._colliderPosition = new three.Vector3();
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
        this.geometry = new three.CapsuleGeometry(this.controls.collider.radius, this.controls.collider.length);
        // Sync the collider position
        this.position.copy(this.controls.collider.getCenter(this._colliderPosition));
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

exports.FPKeyboardControls = FPKeyboardControls;
exports.FPKeyboardDragControls = FPKeyboardDragControls;
exports.FPKeyboardPointerLockControls = FPKeyboardPointerLockControls;
exports.FirstPersonControls = FirstPersonControls;
exports.PhysicsControls = PhysicsControls;
exports.PhysicsControlsHelper = PhysicsControlsHelper;
exports.TPKeyboardControls = TPKeyboardControls;
exports.TPKeyboardDragControls = TPKeyboardDragControls;
exports.TPKeyboardPointerLockControls = TPKeyboardPointerLockControls;
exports.ThirdPersonControls = ThirdPersonControls;
