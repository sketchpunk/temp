import Vec3 from "../Vec3.js";

class QBezier{

	static at( a, b, c, t, out=null ){
		// https://en.wikipedia.org/wiki/B%C3%A9zier_curve
		// (1-t) * ((1-t) * a + t * b) + t((1-t) * b + t * c)
		out = out || new Vec3();

		let s = 1 - t;
		out[ 0 ] = s * ( s * a[0] + t * b[0] ) + t * ( s * b[0] + t * c[0] );
		out[ 1 ] = s * ( s * a[1] + t * b[1] ) + t * ( s * b[1] + t * c[1] );
		out[ 2 ] = s * ( s * a[2] + t * b[2] ) + t * ( s * b[2] + t * c[2] );

		// b + (1-t)^2 * (a-b) + t^2(c-b) -- this is a linear version, no good
		//out[ 0 ] = b[0] + ss * ( a[0] - b[0] ) + tt * ( c[0] - b[0] );
		//out[ 1 ] = b[1] + ss * ( a[1] - b[1] ) + tt * ( c[1] - b[1] );
		//out[ 2 ] = b[2] + ss * ( a[2] - b[2] ) + tt * ( c[2] - b[2] );
		return out;
	}

	static dxdy( a, b, c, t, out=null ){
		// 2 * (1-t) * (b-a) + 2 * t * ( c - b );
		out = out || new Vec3();
		let s2 = 2 * ( 1-t );
		let t2 = 2 * t;
		out[ 0 ] = s2 * ( b[0] - a[0] ) + t2 * ( c[0] - b[0] );
		out[ 1 ] = s2 * ( b[1] - a[1] ) + t2 * ( c[1] - b[1] );
		out[ 2 ] = s2 * ( b[2] - a[2] ) + t2 * ( c[2] - b[2] );

		// 2((c - 2b + a)t + b - a); - belongs to the linear version,
		//out[ 0 ] = 2 * ( ( c[0] - 2 * b[0] + a[0] ) * t + b[0] - a[0] );
		//out[ 1 ] = 2 * ( ( c[1] - 2 * b[1] + a[1] ) * t + b[1] - a[1] );
		//out[ 2 ] = 2 * ( ( c[2] - 2 * b[2] + a[2] ) * t + b[2] - a[2] );
		return out;
	}

	static dxdy2( a, b, c, t, out=null ){
		// 2( c - 2b + a )
		// 2 * ( c - 2 * b + a )
		out = out || new Vec3();
		//out[ 0 ] = 2 * ( c[0] - 2 * b[0] + a[0] );
		//out[ 1 ] = 2 * ( c[1] - 2 * b[1] + a[1] );
		//out[ 2 ] = 2 * ( c[2] - 2 * b[2] + a[2] );

		// -4b + 2a + 2c  same as above, just simplified.
		out[ 0 ] = -4 * b[0] + 2 * a[0] + 2 * c[0];
		out[ 1 ] = -4 * b[1] + 2 * a[1] + 2 * c[1];
		out[ 2 ] = -4 * b[2] + 2 * a[2] + 2 * c[2];

		return out;
	}
}

export default QBezier;