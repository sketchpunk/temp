import Vec3 from "../Vec3.js";

// Modulas that handles Negatives, so (-1, 5) = 4
function mod( a, b ){ let v = a % b; return ( v < 0 )? b+v : v; }

class Point{
	constructor( pos, tension=0, bias=0 ){
		this.pos	    = new Vec3( pos );
        this.tension	= tension;
        this.bias	    = bias;
    }
}

class HermiteSpline{
	constructor( isLoop=false ){
		this.points     = new Array();  // All the Points that defines all the curves of the Spline
		this._curve_cnt = 0;            // How many curves make up the spline
		this._point_cnt = 0;            // Total points in spline
        this._is_loop   = isLoop;       // Is the spline closed? Meaning should the ends be treated as another curve
        
        // Private PreComputed Values for each sample of the curve
		this.time		= 0;    // Time of the selected curve of the spline
		this.tension	= 0;    // Lerped Tension between end points of curve
		this.bias 		= 0;    // Lerped Bias between end points of curve
		this.ten_bias_p = 0;    // Precomputed Value thats uses often
		this.ten_bias_n = 0;    // Precomputed Value thats uses often
	}

    //#region GETTERS / SETTERS
    get curve_count(){ return this._curve_cnt; }
    get point_count(){ return this._point_cnt; }
    //#endregion ////////////////////////////////////////////////////////

	//#region MANAGE POINTS
	add( pos, tension=0, bias=0 ){
		this.points.push( new Point( pos, tension, bias ) );
        this._point_cnt = this.points.length;
        this._curve_cnt = ( !this._is_loop )?
            Math.max( 0, this._point_cnt - 3 ) :
            this._point_cnt;
		return this;
    }
    
    update_pos( idx, pos ){ this.points[ idx ].pos.copy( pos ); }
	//#endregion ////////////////////////////////////////////////////////

    //#region SPLINE
    at( t, pos=null, dxdy=null ){
        let i = ( !this._is_loop )? this._non_loop_index( t ) : this._loop_index( t );
        let a = this.points[ i[0] ].pos;
        let b = this.points[ i[1] ].pos;
        let c = this.points[ i[2] ].pos;
        let d = this.points[ i[3] ].pos;

        if( pos )  this._at( a, b, c, d, this.time, pos );
        if( dxdy ) this._dxdy( a, b, c, d, this.time, dxdy );

        return pos || dxdy;
    }

    // Get postion of only a specific curve on the spline
    at_curve( idx, t, pos=null, dxdy=null ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( t < 0 )      t = 0;
        else if( t > 1 ) t = 1;

        let i  = ( this._is_loop )? idx : idx+1;
        let ia = mod( i-1, this._point_cnt );   // Get Previous Point as Starting Tangent
        let ic = mod( i+1, this._point_cnt );   // Get Next point is the end point of the curve
        let id = mod( i+2, this._point_cnt );   // The the following point as the Ending Tangent
        this._precalc_params( t, i, ic );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let a = this.points[ ia ].pos;
        let b = this.points[ i  ].pos;
        let c = this.points[ ic ].pos;
        let d = this.points[ id ].pos;

        if( pos )  this._at( a, b, c, d, this.time, pos );
        if( dxdy ) this._dxdy( a, b, c, d, this.time, dxdy );

        return pos || dxdy;
    }
    //#endregion ////////////////////////////////////////////////////////

    //#region COMPUTE
    _non_loop_index( t ){
        let i, tt;

        if( t != 1 ){
            tt	= t * this._curve_cnt;  // Using Curve count as a way to get the Index and the remainder is the T of the curve
            i 	= tt | 0;	            // Curve index by stripping out the decimal, BitwiseOR 0 same op as Floor
            tt	-= i;		            // Strip out the whole number to get the decimal norm to be used for the curve ( FRACT )
        }else{
            i	= this._point_cnt - 4;  // The last 4 points make up the final curve in the spline
            tt	= 1;                    // The end of the final curve.
        }

        this._precalc_params( tt, i+1, i+2 );
        return [ i, i+1, i+2, i+3 ];
    }

    _loop_index( t ){
        let i, tt;

        if( t != 1 ){
            tt = t * this._point_cnt;    // Find the starting point for a curve.
            i  = tt | 0;                // Curve index by stripping out the decimal, BitwiseOR 0 same op as Floor
            tt -= i;	                // Strip out the whole number to get the decimal norm to be used for the curve ( FRACT )
        }else{
            i	= this._point_cnt - 1;   // Use the last point as the starting point
            tt	= 1;
        }	

        let ia = mod( i-1, this._point_cnt );   // Get Previous Point as Starting Tangent
        let ic = mod( i+1, this._point_cnt );   // Get Next point is the end point of the curve
        let id = mod( i+2, this._point_cnt );   // The the following point as the Ending Tangent

        this._precalc_params( tt, i, ic );
        return [ ia, i, ic, id ];
    }

    _precalc_params( t, bi, ci ){
        // Pre-caluate Paramters for Curve & Derivative Equations
        let ti 			= 1 - t;
        this.time 		= t;

        // Lerp Tension and Biass between the main 2 points of the curve
        this.tension	= ti * this.points[ bi ].tension	+ t * this.points[ ci ].tension;
        this.bias 		= ti * this.points[ bi ].bias		+ t * this.points[ ci ].bias;

        // Main Equation uses these values 4 times per component, Better
        // to precompute now for optimization
        this.ten_bias_n	= ( 1 - this.bias ) * ( 1 - this.tension ) * 0.5;
        this.ten_bias_p	= ( 1 + this.bias ) * ( 1 - this.tension ) * 0.5;
    }

    _at( a, b, c, d, t, out ){
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

    _dxdy( a, b, c, d, t, out ){
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
    //#endregion ////////////////////////////////////////////////////////

    //#region MISC
    debug( draw, steps=10, inc_dxdy=false ){
        let prev = new Vec3();
        let pos  = new Vec3();
        let dev  = new Vec3();
        let t;

        // Draw First Point
        this.at( 0, prev );
        draw.pnt( prev, "yellow", 0.05, 1 );

        for( let i=1; i <= steps; i++ ){
            t = i / steps;

            //------------------------------------
            // Draw Step
            this.at( t, pos );
            draw
                .ln( prev, pos, "yellow" )
                .pnt( pos, "yellow", 0.05, 1 );

            //------------------------------------
            // Draw Forward Direction
            if( inc_dxdy ){
                this.at( t, null, dev );
                draw.ln( pos, dev.norm().scale( 0.4 ).add( pos ), "white" );
            }

            //------------------------------------
            prev.copy( pos );
        }
    }

    debug_points( draw, offset=null ){
        let p, col, cnt = this.points.length;

        if( !offset ) offset = new Vec3();
        let pos = new Vec3();

        for( let i=0; i < cnt; i++ ){
            p   = this.points[ i ];
            col = ( i == 0 )? "green" :
                  ( i == cnt-1 )? "red" : "yellow";

            pos.from_add( p.pos, offset ); 
            draw.pnt( pos, col, 0.08 );
        }
    }
    //#endregion ////////////////////////////////////////////////////////
}

export default HermiteSpline;