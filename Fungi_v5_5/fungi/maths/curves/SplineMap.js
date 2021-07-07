import Vec3 from "../Vec3.js";

class SplineMap{
    // #region MAIN
    total_len  = 0;     // Total Length of the Spline
    sample_cnt = 0;     // Total Samples Collected
    curve_cnt  = 0;     // Total Curves in Spline
    ary_len    = null;  // Total Length at each sample point
    ary_inc    = null;  // Delta Length at each sample point, Cached as a Range value when Remapping Distance between Samples
    ary_time   = null;  // Curve T at each sample point

    constructor( spline=null, samp_cnt=5 ){
        if( spline ) this.from_spline( spline, samp_cnt );
    }
    // #endregion ///////////////////////////////////////////////////////

    // #region SETUP
    from_spline( spline, samp_cnt=5 ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Setup
        let ccnt                = spline.curve_count;
        this.curve_cnt          = ccnt;
        this.per_curve_sample   = samp_cnt;
        this.sample_cnt         = samp_cnt * ccnt + 1;
		this.ary_len 	        = new Array( this.sample_cnt );
		this.ary_inc	        = new Array( this.sample_cnt );
		this.ary_time	        = new Array( this.sample_cnt );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let prev = new Vec3(),
			pos	 = new Vec3();

		this.ary_len[ 0 ]  = 0;
		this.ary_inc[ 0 ]  = 0;
		this.ary_time[ 0 ] = 0;

        spline.at_curve( 0, 0, prev );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let c, s, t, len, i=1;
        for( c=0; c < ccnt; c++ ){                          // For Every Curve...
            for( s=1; s <= samp_cnt; s++ ){                 // Compute the same Samples
                t = s / samp_cnt;
                spline.at_curve( c, t, pos );	
                
                //------------------------------
                len 				= Vec3.len( prev, pos );
				this.total_len		+= len;					// Total Length
				this.ary_len[ i ]	= this.total_len;		// Current Total Length at this point
				this.ary_inc[ i ]	= len;					// Length between Current+Previous Point
				this.ary_time[ i ]	= c + t;				// Time Curve Step, Saving Curve Index with T
                //console.log( "map", c, s, i, this.total_len );
                //------------------------------
                prev.copy( pos );
                i++;
            }
        }
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        return this;
    }
    // #endregion ///////////////////////////////////////////////////////

    // #region GETTERS

	// Compute the Spline's T Value based on a specific length of the curve
	at_len( len, a=null, b=null ){
		if( a == null ) a = 0;
		if( b == null ) b = this.sample_cnt-2;

		for( let i=b; i >= a; i-- ){
			if( this.ary_len[ i ] < len ){
				let tt	= ( len - this.ary_len[ i ] ) / this.ary_inc[ i+1 ]; 		// Normalize the Search Length   ( x-a / b-a )
                let ttt	= this.ary_time[ i ] * (1-tt) + this.ary_time[ i+1 ] * tt;	// Interpolate the Curve Time between two points
				return ttt / this.curve_cnt;	// Since time saved as as Curve# + CurveT, Normalize it based on total time which is curve count
			}
		}
		return 0;
	}

	// Get Spline T based on Time of Arc Length
	at( t ){
		if( t >= 1 ) return 1;
		if( t <= 0 ) return 0;
		return this.at_len( this.total_len * t );
    }

    at_curve( idx, t ){
        let ai = this.per_curve_sample * idx;
        let bi = ai + this.per_curve_sample;

        let a = this.ary_len[ ai ];
        let b = this.ary_len[ bi ];

        let len = a * (1-t) + b * t;
        return this.at_len( len );
    }

    at_idx_range( t, idx_a, idx_b ){
        let ai = this.per_curve_sample * idx_a;
        let bi = this.per_curve_sample * idx_b + this.per_curve_sample;

        let a = this.ary_len[ ai ];
        let b = this.ary_len[ bi ];

        let len = a * (1-t) + b * t;
        return this.at_len( len );
    }
    // #endregion ///////////////////////////////////////////////////////
}

export default SplineMap;