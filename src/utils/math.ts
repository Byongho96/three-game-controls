import {
	Line3,
	Plane,
	Vector3,
	type Triangle,
} from 'three';
import { type Capsule } from 'three/examples/jsm/math/Capsule';

/**
 * Math utilities from :
 * https://github.com/mrdoob/three.js/blob/master/examples/jsm/math/Octree.js
 */

const _temp1 = new Vector3();
const _temp2 = new Vector3();
const _temp3 = new Vector3();

const EPS = 1e-10; // A small number to avoid division by zero

/**
 * Finds the closest points between two line segments in 3D space.
 * This function can optionally write the resulting points into `target1` and `target2`.
 *
 * @param {Line3} line1 - The first line segment.
 * @param {Line3} line2 - The second line segment.
 * @param {Vector3 | null} [target1=null] - If provided, this will be set to the closest point on `line1`.
 * @param {Vector3 | null} [target2=null] - If provided, this will be set to the closest point on `line2`.
 */
export function lineToLineClosestPoints( line1: Line3, line2:Line3, target1: Vector3 | null = null, target2: Vector3 | null = null ) {

	const r = _temp1.copy( line1.end ).sub( line1.start );
	const s = _temp2.copy( line2.end ).sub( line2.start );
	const w = _temp3.copy( line2.start ).sub( line1.start );

	const a = r.dot( s ),
		b = r.dot( r ),
		c = s.dot( s ),
		d = s.dot( w ),
		e = r.dot( w );

	let t1, t2;
	const divisor = b * c - a * a;

	// If the lines are almost parallel, handle that separately to avoid division by nearly zero
	if ( Math.abs( divisor ) < EPS ) {

		const d1 = - d / c;
		const d2 = ( a - d ) / c;

		if ( Math.abs( d1 - 0.5 ) < Math.abs( d2 - 0.5 ) ) {

			t1 = 0;
			t2 = d1;

		} else {

			t1 = 1;
			t2 = d2;

		}

	} else {

		t1 = ( d * a + e * c ) / divisor;
		t2 = ( t1 * a - d ) / c;

	}

	// Clamp t1, t2 to [0,1] so that we stay within each line segment
	t2 = Math.max( 0, Math.min( 1, t2 ) );
	t1 = Math.max( 0, Math.min( 1, t1 ) );

	if ( target1 ) {

		target1.copy( r ).multiplyScalar( t1 ).add( line1.start );

	}

	if ( target2 ) {

		target2.copy( s ).multiplyScalar( t2 ).add( line2.start );

	}

}

const _v1 = new Vector3();

const _point1 = new Vector3();
const _point2 = new Vector3();

const _line1 = new Line3();
const _line2 = new Line3();

const _plane1 = new Plane();


/**
 * Checks the intersection between a capsule and a triangle in 3D.
 * If they intersect, returns an object containing intersection details;
 *
 * @param {Capsule} capsule - The capsule to check for intersection.
 * @param {Triangle} triangle - The triangle to check against.
*/
export function triangleCapsuleIntersect( capsule: Capsule, triangle: Triangle ) {

	triangle.getPlane( _plane1 );

	const d1 = _plane1.distanceToPoint( capsule.start ) - capsule.radius;
	const d2 = _plane1.distanceToPoint( capsule.end ) - capsule.radius;

	// If both ends are outside the plane, no intersection.
	if ( ( d1 > 0 && d2 > 0 ) || ( d1 < - capsule.radius && d2 < - capsule.radius ) ) return false;

	const delta = Math.abs( d1 / ( Math.abs( d1 ) + Math.abs( d2 ) ) );
	const intersectPoint = _v1.copy( capsule.start ).lerp( capsule.end, delta );

	// If the intersect point is inside the triangle, return the intersection.
	if ( triangle.containsPoint( intersectPoint ) ) {

		return { normal: _plane1.normal.clone(), point: intersectPoint.clone(), depth: Math.abs( Math.min( d1, d2 ) ) };

	}

	const r2 = capsule.radius * capsule.radius;

	const line1 = _line1.set( capsule.start, capsule.end );

	const lines = [
		[ triangle.a, triangle.b ],
		[ triangle.b, triangle.c ],
		[ triangle.c, triangle.a ]
	];

	// check for collision along the triangle edges.
	for ( let i = 0; i < lines.length; i ++ ) {

		const line2 = _line2.set( lines[ i ][ 0 ], lines[ i ][ 1 ] );

		lineToLineClosestPoints( line1, line2, _point1, _point2 );

		if ( _point1.distanceToSquared( _point2 ) < r2 ) {

			return {
				normal: _point1.clone().sub( _point2 ).normalize(),
				point: _point2.clone(),
				depth: capsule.radius - _point1.distanceTo( _point2 )
			};

		}

	}

	return false;

}
