import Vec3 from "../Vec3.js";

// Modulas that handles Negatives, so (-1, 5) = 4
function mod( a, b ){ let v = a % b; return ( v < 0 )? b+v : v; }

class Point{
	constructor( pos ){
		this.pos = new Vec3( pos );
    }
}

class BezierCubicSpline{
	constructor(){
		this.points     = new Array();  // All the Points that defines all the curves of the Spline
		this._curve_cnt = 0;            // How many curves make up the spline
		this._point_cnt = 0;            // Total points in spline
	}

    //#region GETTERS / SETTERS
    get curve_cnt(){ return this._curve_cnt; }
    get point_cnt(){ return this._point_cnt; }
    //#endregion ////////////////////////////////////////////////////////

	//#region MANAGE POINTS
	add( pos ){
		this.points.push( new Point( pos ) );
		this._point_cnt = this.points.length;
		this._curve_cnt = Math.max( 0, Math.floor( (this.point_cnt - 1) / 3 ) );
		return this;
    }
    
    update_pos( idx, pos ){ this.points[ idx ].pos.copy( pos ); }
	//#endregion ////////////////////////////////////////////////////////

    //#region SPLINE
    at( t, pos=null, dxdy=null, dxdy2=null ){
        if( t > 1 )      t = 1;
        else if( t < 0 ) t = 0;

        let i = this._non_loop_index( t );
        let a = this.points[ i[0] ].pos;
        let b = this.points[ i[1] ].pos;
        let c = this.points[ i[2] ].pos;
        let d = this.points[ i[3] ].pos;
        
        t = i[4];

        if( pos )   this._at( a, b, c, d, t, pos );
        if( dxdy )  this._dxdy( a, b, c, d, t, dxdy );
        if( dxdy2 ) this._dxdy2( a, b, c, d, t, dxdy2 );

        return pos || dxdy || dxdy2;
    }
    //#endregion ////////////////////////////////////////////////////////

    //#region COMPUTE
    _non_loop_index( t ){
        let i, tt;

        if( t != 1 ){
            tt  = t * this._curve_cnt;  // Using Curve count as a way to get the Index and the remainder is the T of the curve
            i   = tt | 0;	            // BitwiseOR 0 same op as Floor, use to FRACT the T of the curve
            tt -= i;		            // Strip out the whole number to get the decimal norm to be used for the curve ( FRACT )
            i  *= 3;                    // Every 3 points Plus one back counts as 1 bezier cubic curve
        }else{
            i	= this._point_cnt - 4;  // The last 4 points make up the final curve in the spline
            tt	= 1;                    // The end of the final curve.
        }

        return [ i, i+1, i+2, i+3, tt ];
    }

	_at( a, b, c, d, t, out=null ){
		let i		= 1 - t,
			ii		= i * i,
			iii		= ii * i,
			tt 		= t * t,
			ttt 	= tt * t,
			iit3 	= 3 * ii * t,
            itt3 	= 3 * i * tt;
            
		out = out || new Vec3();
		out[ 0 ] = iii * a[0] + iit3 * b[0] + itt3 * c[0] + ttt * d[0];
		out[ 1 ] = iii * a[1] + iit3 * b[1] + itt3 * c[1] + ttt * d[1];
		out[ 2 ] = iii * a[2] + iit3 * b[2] + itt3 * c[2] + ttt * d[2];
		return out;
	}

	_dxdy( a, b, c, d, t, out=null ){
		let i	= 1 - t,
			ii3	= 3 * i * i,
			it6	= 6 * i * t,
			tt3	= 3 * t * t;

		out = out || new Vec3();
		out[ 0 ] = ii3 * ( b[0] - a[0] ) + it6 * ( c[0] - b[0] ) + tt3 * ( d[0] - c[0] );
		out[ 1 ] = ii3 * ( b[1] - a[1] ) + it6 * ( c[1] - b[1] ) + tt3 * ( d[1] - c[1] );
		out[ 2 ] = ii3 * ( b[2] - a[2] ) + it6 * ( c[2] - b[2] ) + tt3 * ( d[2] - c[2] );
		return out;
	}

	_dxdy2( a, b, c, d, t, out=null ){
		// https://stackoverflow.com/questions/35901079/calculating-the-inflection-point-of-a-cubic-bezier-curve
		let t6 = 6 * t;
		out = out || new Vec3();
		out[ 0 ] = t6 * ( d[0] + 3 * ( b[0] - c[0] ) - a[0] ) + 6 * ( a[0] - 2 * b[0] + c[0] );
		out[ 1 ] = t6 * ( d[1] + 3 * ( b[1] - c[1] ) - a[1] ) + 6 * ( a[1] - 2 * b[1] + c[1] );
		out[ 2 ] = t6 * ( d[2] + 3 * ( b[2] - c[2] ) - a[2] ) + 6 * ( a[2] - 2 * b[2] + c[2] );
		return out;
	}
    //#endregion ////////////////////////////////////////////////////////

    //#region MISC
    debug( draw, steps=10, inc_dxdy=false, inc_dxdy2=false ){
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
            // Draw Forward Direction
            if( inc_dxdy2 ){
                this.at( t, null, null, dev );
                draw.ln( pos, dev.norm().scale( 0.4 ).add( pos ), "cyan" );
            }

            //------------------------------------
            prev.copy( pos );
        }
    }
    //#endregion ////////////////////////////////////////////////////////
}

export default BezierCubicSpline;