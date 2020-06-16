/* [[ RESOURCES ]] 
http://archive.gamedev.net/archive/reference/articles/article1497.html
http://paulbourke.net/miscellaneous/interpolation/
https://codeplea.com/simple-interpolation
https://codeplea.com/introduction-to-splines
https://codeplea.com/triangular-interpolation // Barycentric Coordinates and Alternatives
*/
class Lerp{
	////////////////////////////////////////////////////////////////
	// Linear
	////////////////////////////////////////////////////////////////
		static linear( t, a, b ){ return (1-t) * a + t * b; }

		static linear_quat( t, a, b, out ){
			let ti = 1 - t;
			out[0] = a[0] * ti + b[0] * t;
			out[1] = a[1] * ti + b[1] * t;
			out[2] = a[2] * ti + b[2] * t;
			out[3] = a[3] * ti + b[3] * t;
			return out.normalize();
		}

		static linear_vec3( t, a, b, out ){
			let ti = 1 - t;
			out[0] = a[0] * ti + b[0] * t;
			out[1] = a[1] * ti + b[1] * t;
			out[2] = a[2] * ti + b[2] * t;
			return out;
		}


	////////////////////////////////////////////////////////////////
	// Hermite Spline
	////////////////////////////////////////////////////////////////
		
		// http://paulbourke.net/miscellaneous/interpolation/
		static hermite( t, a, b, c, d, tension, bias ){
		   	let m0  = (b-a) * (1+bias) * (1-tension) * 0.5;
				m0 += (c-b) * (1-bias) * (1-tension) * 0.5;
			let m1  = (c-b) * (1+bias) * (1-tension) * 0.5;
				m1 += (d-c) * (1-bias) * (1-tension) * 0.5;

			let t2 = t * t;
			let t3 = t2 * t;
			let a0 = 2*t3 - 3*t2 + 1;
			let a1 = t3 - 2*t2 + t;
			let a2 = t3 - t2;
			let a3 = -2*t3 + 3*t2;

			return a0*b + a1*m0 + a2*m1 + a3*c ;
		}

		// Optimized to compute a quaternion without repeating many operations
		static hermite_quat( t, a, b, c, d, tension, bias, out ){
			let btn	= (1-bias) * (1-tension) * 0.5,
				btp	= (1+bias) * (1-tension) * 0.5,
				t2	= t * t,
				t3	= t2 * t,
				a0	= 2*t3 - 3*t2 + 1,
				a1	= t3 - 2*t2 + t,
				a2	= t3 - t2,
				a3	= -2*t3 + 3*t2;

			out[0] = a0*b[0] + a1 * ( (b[0]-a[0]) * btp + (c[0]-b[0]) * btn ) + a2 * ( (c[0]-b[0]) * btp + (d[0]-c[0]) * btn ) + a3*c[0];
			out[1] = a0*b[1] + a1 * ( (b[1]-a[1]) * btp + (c[1]-b[1]) * btn ) + a2 * ( (c[1]-b[1]) * btp + (d[1]-c[1]) * btn ) + a3*c[1];
			out[2] = a0*b[2] + a1 * ( (b[2]-a[2]) * btp + (c[2]-b[2]) * btn ) + a2 * ( (c[2]-b[2]) * btp + (d[2]-c[2]) * btn ) + a3*c[2];
			out[3] = a0*b[3] + a1 * ( (b[3]-a[3]) * btp + (c[3]-b[3]) * btn ) + a2 * ( (c[3]-b[3]) * btp + (d[3]-c[3]) * btn ) + a3*c[3];
			return out.normalize();
		}


	////////////////////////////////////////////////////////////////
	// Catmull-Rom
	////////////////////////////////////////////////////////////////
		// http://paulbourke.net/miscellaneous/interpolation/
		static catmull( t, a, b, c, d ){
			let t2 = t*t;
			let a0 = -0.5*a + 1.5*b - 1.5*c + 0.5*d;
			let a1 = a - 2.5*b + 2*c - 0.5*d;
			let a2 = -0.5*a + 0.5*c;
			let a3 = b;

			return a0*t*t2 + a1*t2 + a2*t + a3;
		}

		static catmull_quat( t, a, b, c, d, out ){
			let t2 = t * t,
				t3 = t * t2;

			out[0] = ( -0.5*a[0] + 1.5*b[0] - 1.5*c[0] + 0.5*d[0] )*t3 + ( a[0] - 2.5*b[0] + 2*c[0] - 0.5*d[0] )*t2 + ( -0.5*a[0] + 0.5*c[0] )*t + b[0];
			out[1] = ( -0.5*a[1] + 1.5*b[1] - 1.5*c[1] + 0.5*d[1] )*t3 + ( a[1] - 2.5*b[1] + 2*c[1] - 0.5*d[1] )*t2 + ( -0.5*a[1] + 0.5*c[1] )*t + b[1];
			out[2] = ( -0.5*a[2] + 1.5*b[2] - 1.5*c[2] + 0.5*d[2] )*t3 + ( a[2] - 2.5*b[2] + 2*c[2] - 0.5*d[2] )*t2 + ( -0.5*a[2] + 0.5*c[2] )*t + b[2];
			out[3] = ( -0.5*a[3] + 1.5*b[3] - 1.5*c[3] + 0.5*d[3] )*t3 + ( a[3] - 2.5*b[3] + 2*c[3] - 0.5*d[3] )*t2 + ( -0.5*a[3] + 0.5*c[3] )*t + b[3];			
			return out.normalize();
		}

		// http://archive.gamedev.net/archive/reference/articles/article1497.html
		// ta > td is the time value of the specific key frames the values belong to.
		static catmull_irregular_frames( t, a, b, c, d, ta, tb, tc, td ){
			//let bb = ((b-a) / (tb-ta)) * 0.5 + ((c-b) / (tb-ta)) * 0.5;	// Original but the second denom seems wrong.
			//let cc = ((c-a) / (tc-tb)) * 0.5 + ((d-c) / (tc-tb)) * 0.5;
			let t2 = t * t;
			let t3 = t * t2;
			let bb = ((b-a) / (tb-ta)) * 0.5 + ((c-b) / (tc-tb)) * 0.5;	// Tangent at b
			let cc = ((c-a) / (tc-tb)) * 0.5 + ((d-c) / (td-tc)) * 0.5;	// Tangent at c
			let ti = 1.0; //tc - tb;	// This hurts the animation with the BB, CC change
			return	b * (2 * t3 - 3 * t2 + 1) +
					c * (3 * t2 - 2* t3) +
					bb * ti * (t3 - 2 * t2 + t) +
					cc * ti * (t3 - t2);
		}


	////////////////////////////////////////////////////////////////
	// Cubic
	////////////////////////////////////////////////////////////////
	
		// http://archive.gamedev.net/archive/reference/articles/article1497.html
		static cubic( t, a, b ){
			let t2 = t * t,
				t3 = t2 * t;
			return a * ( 2*t3 - 3*t2 + 1 ) + b * ( 3 * t2 - 2 * t3 );
		}

		static cubic_quat( t, a, b, out ){
			//a * ( 2*t3 - 3*t2 + 1 ) + b * ( 3 * t2 - 2 * t3 );
			let t2 = t * t,
				t3 = t * t2,
				aa = ( 2*t3 - 3*t2 + 1 ),
				bb = ( 3 * t2 - 2 * t3 );

			out[0] = a[0] * aa + b[0] * bb;
			out[1] = a[1] * aa + b[1] * bb;
			out[2] = a[2] * aa + b[2] * bb;
			out[3] = a[3] * aa + b[3] * bb;
			return out.normalize();
		}

		// http://paulbourke.net/miscellaneous/interpolation/
		static cubic_spline( t, a, b, c, d ){
			let t2 = t*t;
			let a0 = d - c - a + b;
			let a1 = a - b - a0;
			let a2 = c - a;
			let a3 = b;
			return a0*t*t2 + a1*t2 + a2*t + a3;
		}

		static cubic_spline_quat( t, a, b, c, d, out ){
			let t2 = t * t,
				t3 = t * t2,
				a0 = d[0] - c[0] - a[0] + b[0],
				a1 = d[1] - c[1] - a[1] + b[1],
				a2 = d[2] - c[2] - a[2] + b[2],
				a3 = d[3] - c[3] - a[3] + b[3];

			out[0] = a0*t3 + ( a[0] - b[0] - a0 )*t2 + ( c[0] - a[0] )*t + b[0];
			out[1] = a1*t3 + ( a[1] - b[1] - a1 )*t2 + ( c[1] - a[1] )*t + b[1];
			out[2] = a2*t3 + ( a[2] - b[2] - a2 )*t2 + ( c[2] - a[2] )*t + b[2];
			out[3] = a3*t3 + ( a[3] - b[3] - a3 )*t2 + ( c[3] - a[3] )*t + b[3];
			return out.normalize();
		}

		static cubic_spline_vec3( t, a, b, c, d, out ){
			let t2 = t * t,
				t3 = t * t2,
				a0 = d[0] - c[0] - a[0] + b[0],
				a1 = d[1] - c[1] - a[1] + b[1],
				a2 = d[2] - c[2] - a[2] + b[2];

			out[0] = a0*t3 + ( a[0] - b[0] - a0 )*t2 + ( c[0] - a[0] )*t + b[0];
			out[1] = a1*t3 + ( a[1] - b[1] - a1 )*t2 + ( c[1] - a[1] )*t + b[1];
			out[2] = a2*t3 + ( a[2] - b[2] - a2 )*t2 + ( c[2] - a[2] )*t + b[2];
			return out;
		}


	////////////////////////////////////////////////////////////////
	// Cosine
	////////////////////////////////////////////////////////////////
		// NOTE : Can calulate about the same curve without cos by using smoothstep equations which would be better
		// smoothstep( t ){ return 3*t**2 - 2*t**3; }
		// smoothTStep(t){ return (t**2) * (3 - 2 * t); }

		// http://paulbourke.net/miscellaneous/interpolation/
		static cosine( t, a, b ){
			t = (1 - Math.cos( t * Math.PI)) / 2;
		   	return a * (1-t) + b * t;
		}

		static cosine_quat( t, a, b, out ){
			let tt	= ( 1 - Math.cos( t * Math.PI ) ) * 0.5,
				ti	= 1 - tt;

			out[0] = a[0] * ti + b[0] * tt;
			out[1] = a[1] * ti + b[1] * tt;
			out[2] = a[2] * ti + b[2] * tt;
			out[3] = a[3] * ti + b[3] * tt;
			return out.normalize();
		}
}