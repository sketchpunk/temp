https://www.cubic.org/docs/hermite.htm


function _curve_pos( a, b, c, d, t, out ){
	let t2	= t * t,
		t3	= t2 * t,
		a0	= 2*t3 - 3*t2 + 1,
		a1	= t3 - 2*t2 + t,
		a2	= t3 - t2,
		a3	= -2*t3 + 3*t2;

	out[0] = a0*b[0] + a1 * ( (b[0]-a[0]) * this.ten_bias_p + (c[0]-b[0]) * this.ten_bias_n ) + a2 * ( (c[0]-b[0]) * this.ten_bias_p + (d[0]-c[0]) * this.ten_bias_n ) + a3*c[0];
	out[1] = a0*b[1] + a1 * ( (b[1]-a[1]) * this.ten_bias_p + (c[1]-b[1]) * this.ten_bias_n ) + a2 * ( (c[1]-b[1]) * this.ten_bias_p + (d[1]-c[1]) * this.ten_bias_n ) + a3*c[1];
	out[2] = a0*b[2] + a1 * ( (b[2]-a[2]) * this.ten_bias_p + (c[2]-b[2]) * this.ten_bias_n ) + a2 * ( (c[2]-b[2]) * this.ten_bias_p + (d[2]-c[2]) * this.ten_bias_n ) + a3*c[2];
	return out;
}

function _curve_pos_dxdy( a, b, c, d, t, out ){
	let tt  = t * t,
		tt6 = 6 * tt,
		tt3 = 3 * tt,
		a0  = tt6 - 6*t,
		a1  = tt3 - 4*t + 1,
		a2  = tt3 - 2*t,
		a3  = 6*t - tt6;

	 out[0] = a0 * b[0] + a1 * ( (b[0]-a[0]) * this.ten_bias_p  + (c[0]-b[0]) * this.ten_bias_n ) + a2 * ( (c[0]-b[0]) * this.ten_bias_p  + (d[0]-c[0]) * this.ten_bias_n ) + a3 * c[0];
	 out[1] = a0 * b[1] + a1 * ( (b[1]-a[1]) * this.ten_bias_p  + (c[1]-b[1]) * this.ten_bias_n ) + a2 * ( (c[1]-b[1]) * this.ten_bias_p  + (d[1]-c[1]) * this.ten_bias_n ) + a3 * c[1];
	 out[2] = a0 * b[2] + a1 * ( (b[2]-a[2]) * this.ten_bias_p  + (c[2]-b[2]) * this.ten_bias_n ) + a2 * ( (c[2]-b[2]) * this.ten_bias_p  + (d[2]-c[2]) * this.ten_bias_n ) + a3 * c[2];
	 return out;
}

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

	function hermite_dxdy( t, a, b, c, d, tension, bias ){
		let m0  = ( (b-a) * (1+bias) * (1-tension) * 0.5 ) + ( (c-b) * (1-bias) * (1-tension) * 0.5 ),
			m1  = ( (c-b) * (1+bias) * (1-tension) * 0.5 ) + ( (d-c) * (1-bias) * (1-tension) * 0.5 ),
			tt  = t * t,
			tt6 = 6 * tt,
			tt3 = 3 * tt,
			a0  = tt6 - 6*t,
			a1  = tt3 - 4*t + 1,
			a2  = tt3 - 2*t,
			a3  = 6*t - tt6;
		return a0*b + a1*m0 + a2*m1 + a3*c ;
	}


class Hermite{
	static at( info, pnts, out ){
		let t 	= info.t,
			ti 	= 1 - t,
			t2	= t * t,
			t3	= t2 * t,
			a0	= 2*t3 - 3*t2 + 1,
			a1	= t3 - 2*t2 + t,
			a2	= t3 - t2,
			a3	= -2*t3 + 3*t2;

		let a = pnts[ info.a ].pos,
			b = pnts[ info.b ].pos,
			c = pnts[ info.c ].pos,
			d = pnts[ info.d ].pos;

		let b_tension 	= pnts[ info.b ].data?.tension || 0, 
			c_tension 	= pnts[ info.c ].data?.tension || 0, 
			b_bias		= pnts[ info.b ].data?.bias || 0,
			c_bias		= pnts[ info.c ].data?.bias || 0;

		let tension	= b_tension * ti	+ c_tension * t,	// Lerp Tension between Points
			bias 	= b_bias * ti		+ c_bias * t,		// Lerp Bias between Points
			tb_n 	= ( 1 - bias) * ( 1 - tension ) * 0.5,
			tb_p 	= ( 1 + bias) * ( 1 - tension ) * 0.5;

		out[0] = a0*b[0] + a1 * ( (b[0]-a[0]) * tb_p + (c[0]-b[0]) * tb_n ) + a2 * ( (c[0]-b[0]) * tb_p + (d[0]-c[0]) * tb_n ) + a3*c[0];
		out[1] = a0*b[1] + a1 * ( (b[1]-a[1]) * tb_p + (c[1]-b[1]) * tb_n ) + a2 * ( (c[1]-b[1]) * tb_p + (d[1]-c[1]) * tb_n ) + a3*c[1];
		out[2] = a0*b[2] + a1 * ( (b[2]-a[2]) * tb_p + (c[2]-b[2]) * tb_n ) + a2 * ( (c[2]-b[2]) * tb_p + (d[2]-c[2]) * tb_n ) + a3*c[2];
		return out;
	}

	static dxdy( info, pnts, out ){
		let t 	= info.t,
			ti 	= 1 - t,
			tt  = t * t,
			tt6 = 6 * tt,
			tt3 = 3 * tt,
			a0  = tt6 - 6*t,
			a1  = tt3 - 4*t + 1,
			a2  = tt3 - 2*t,
			a3  = 6*t - tt6;

		let a = pnts[ info.a ].pos,
			b = pnts[ info.b ].pos,
			c = pnts[ info.c ].pos,
			d = pnts[ info.d ].pos;

		let b_tension 	= pnts[ info.b ].data?.tension || 0, 
			c_tension 	= pnts[ info.c ].data?.tension || 0, 
			b_bias		= pnts[ info.b ].data?.bias || 0,
			c_bias		= pnts[ info.c ].data?.bias || 0;

		let tension	= b_tension * ti	+ c_tension * t,	// Lerp Tension between Points
			bias 	= b_bias * ti		+ c_bias * t,		// Lerp Bias between Points
			tb_n 	= ( 1 - bias) * ( 1 - tension ) * 0.5,
			tb_p 	= ( 1 + bias) * ( 1 - tension ) * 0.5;

		out[0] = a0 * b[0] + a1 * ( (b[0]-a[0]) * tb_p  + (c[0]-b[0]) * tb_n ) + a2 * ( (c[0]-b[0]) * tb_p  + (d[0]-c[0]) * tb_n ) + a3 * c[0];
		out[1] = a0 * b[1] + a1 * ( (b[1]-a[1]) * tb_p  + (c[1]-b[1]) * tb_n ) + a2 * ( (c[1]-b[1]) * tb_p  + (d[1]-c[1]) * tb_n ) + a3 * c[1];
		out[2] = a0 * b[2] + a1 * ( (b[2]-a[2]) * tb_p  + (c[2]-b[2]) * tb_n ) + a2 * ( (c[2]-b[2]) * tb_p  + (d[2]-c[2]) * tb_n ) + a3 * c[2];
		return out;
	}

	static spline_count( point_cnt, is_loop=false ){ return ( is_loop )? point_cnt : point_cnt - 3; }

	static spline_get( i, point_cnt, is_loop=false ){
		return ( is_loop )?
			{ a:mod( i-1, point_cnt ), b:i, c:mod( i+1, point_cnt ), d:mod( i+2, point_cnt ) } :
			{ a:i, b:i+1, c:i+2, d:i+3 };
	}

	static spline_t( t, point_cnt, is_loop=false ){
		let i, tt, ti, ai, bi, ci, di;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Figure out the starting index of the curve and the time on the curve.
		if( t > 1 ) 		t = 1;
		else if( t < 0 )	t = 0;

		if( is_loop ){
			if( t != 1 ){
				tt = t * point_cnt;
				i  = tt | 0;
				tt -= i;	
			}else{
				i	= point_cnt - 1;
				tt	= 1;
			}	

			ti = 1 - tt;
			ai = mod( i-1, point_cnt );
			bi = i;
			ci = mod( i+1, point_cnt );
			di = mod( i+2, point_cnt );
		}else{ 								// Determine which curve is being accessed
			if( t != 1 ){
				tt	= t * (point_cnt - 3) 	// curve_cnt = point_cnt-3
				i 	= tt | 0;				// Curve index by stripping out the decimal, BitwiseOR 0 same op as Floor
				tt	-= i;					// Strip out the whole number to get the decimal norm to be used for the curve ( FRACT )
			}else{
				i	= point_cnt - 4;
				tt	= 1;
			}

			ti 	= 1 - tt;	// Time Inverse	
			ai 	= i;
			bi 	= i + 1;
			ci	= i + 2;
			di	= i + 3;
		}

		return { t:tt, a:ai, b:bi, c:ci, d:di };
	}
}
