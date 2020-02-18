class HermiteSpline{
	constructor( is_loop=false ){
		this.points 	= new Array();
		this.curve_cnt 	= 0;
		this.point_cnt	= 0;
		this.is_loop	= is_loop;

		// Private PreComputed Values for each sample of the curve
		this.time		= 0;
		this.tension	= 0;
		this.bias 		= 0;
		this.ten_bias_p = 0;
		this.ten_bias_n = 0;
	}

	/////////////////////////////////////////////////////////////////////////////
	// 
	/////////////////////////////////////////////////////////////////////////////
		add( pnt, tension=0, bias=0 ){
			this.points.push( { pos:pnt, tension, bias } );
			this.point_cnt = this.points.length;
			this.curve_cnt = this.point_cnt - 3;
			return this;
		}

	/////////////////////////////////////////////////////////////////////////////
	// 
	/////////////////////////////////////////////////////////////////////////////
		at( t=0, out=null, dx_out=null ){
			let i = this._calc_index( t ),
			 	a = this.points[ i[0] ].pos,
				b = this.points[ i[1] ].pos,
				c = this.points[ i[2] ].pos,
				d = this.points[ i[3] ].pos;

			if( out )		this._curve_pos( a, b, c, d, this.time, out );
			if( dx_out )	this._curve_pos_dxdy( a, b, c, d, this.time, dx_out );

			return out || dx_out;
		}

		at_idx( t, ia, ib, out=null, dx_out=null  ){
			let i = this._calc_from_range( t, ia, ib ),
			 	a = this.points[ i[0] ].pos,
				b = this.points[ i[1] ].pos,
				c = this.points[ i[2] ].pos,
				d = this.points[ i[3] ].pos;

			if( out ) 		this._curve_pos( a, b, c, d, this.time, out );
			if( dx_out )	this._curve_pos_dxdy( a, b, c, d, this.time, dx_out );

			return out || dx_out;
		}

	/////////////////////////////////////////////////////////////////////////////
	// 
	/////////////////////////////////////////////////////////////////////////////
		_calc_index( t ){
			let i, tt, ai, bi, ci, di;

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Figure out the starting index of the curve and the time on the curve.
			if( t > 1 ) 		t = 1;
			else if( t < 0 )	t = 0;

			if( this.is_loop ){
				if( t != 1 ){
					tt = t * this.point_cnt;
					i  = tt | 0;
					tt -= i;	
				}else{
					i	= this.point_cnt - 1;
					tt	= 1;
				}	

				ai = this.mod( i-1, this.point_cnt );
				bi = i;
				ci = this.mod( i+1, this.point_cnt );
				di = this.mod( i+2, this.point_cnt );
			}else{ 											// Determine which curve is being accessed
				if( t != 1 ){
					tt	= t * this.curve_cnt;
					i 	= tt | 0;	// Curve index by stripping out the decimal, BitwiseOR 0 same op as Floor
					tt	-= i;		// Strip out the whole number to get the decimal norm to be used for the curve ( FRACT )
				}else{
					i	= this.point_cnt - 4;
					tt	= 1;
				}

				ai 	= i;
				bi 	= i + 1;
				ci	= i + 2;
				di	= i + 3;
			}

			this._calc_params( tt, bi, ci );
			return [ai, bi, ci, di];
		}

		_calc_from_range( t, ia, ib ){
			let curve_cnt = (ib - ia),
				tt, i, ai, bi, ci, di;
			
			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Figure out the starting index of the curve and the time on the curve.
			if( t > 1 ) 		t = 1;
			else if( t < 0 )	t = 0;

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			if( t < 1 ){
				tt	= curve_cnt * t;
				i 	= tt | 0;
				tt	-= i;
				i	+= ia;
			}else{
				i	= ib - 1;
				tt	= 1;
			}

			ai = this.mod( i-1, this.point_cnt );
			bi = this.mod( i  , this.point_cnt );
			ci = this.mod( i+1, this.point_cnt );
			di = this.mod( i+2, this.point_cnt );
			
			this._calc_params( tt, bi, ci );
			return [ ai, bi, ci, di ];
		}

		_calc_params( t, bi, ci ){
			// Pre-caluate Paramters for Curve & Derivative Equations
			let ti 			= 1 - t;
			this.time 		= t;
			this.tension	= ti * this.points[ bi ].tension	+ t * this.points[ ci ].tension;
			this.bias 		= ti * this.points[ bi ].bias		+ t * this.points[ ci ].bias;

			this.ten_bias_n	= ( 1 - this.bias) * ( 1 - this.tension ) * 0.5;
			this.ten_bias_p	= ( 1 + this.bias) * ( 1 - this.tension ) * 0.5;
		}

	/////////////////////////////////////////////////////////////////////////////
	// 
	/////////////////////////////////////////////////////////////////////////////
		_curve_pos( a, b, c, d, t, out ){
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

		_curve_pos_dxdy( a, b, c, d, t, out ){
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

	/////////////////////////////////////////////////////////////////////////////
	// 
	/////////////////////////////////////////////////////////////////////////////
		mod( a, b ){ let v = a % b; return ( v < 0 )? b+v : v; } // Modulas that handles Negatives, so (-1, 5) = 4
	
		get_samples( s_cnt ){
			let max 	= s_cnt-1,
				max_inv	= 1 / max,
				out 	= new Array( s_cnt ),
				i, t;
			for( i=0; i <= max; i++ ){
				let p = [0,0,0];
				t = i * max_inv;
				out[ i ] = this.at( t, p );
			}
			return out;
		}
}