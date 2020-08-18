class CurveCache{
	constructor(){
		this.samples 		= new Array();
		this.sampleCnt 		= 0;
		this.sampleCntInv 	= 0;
	}
	
	fromCurve( c, s ){
		let i;
		for(i=0; i <= s; i++) this.samples.push( c.at( i / s ) );
			
		this.sampleCnt		= this.samples.length - 1;
		this.sampleCntInv 	= 1 / this.sampleCnt;
	}

	at( t, out=null ){
		out = out || new THREE.Vector3();
		if( t <= 0 ) return out.copy( this.samples[ 0 ] );
		if( t >= 1 ) return out.copy( this.samples[ this.sampleCnt ] );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let i;
		t = this.sampleCnt * t;
		i = t | 0;

		return out.lerpVectors( this.samples[i], this.samples[i+1], t - i );
	}
}


class CurveArcLength{
	constructor(){
		this.samples		= null;
		this.sampleCnt		= 0;
		this.sampleCntInv	= 0;
		this.arcLength		= 0;
	}

	fromCurve( c, s=null ){
		// Change Sample Count
		if( s ){
			this.sampleCnt 		= s;
			this.sampleCntInv 	= 1 / s;
		}

		// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let p0 = [ 0, 0 ],
			p1 = [ 0, 0 ],
			i;

		c.at( 0 , p0 );							// Save point at Time Zero
		this.samples		= new Array( this.sampleCnt+1 );	// New Sample Array
		this.samples[ 0 ]	= 0;				// First Value is zero.
		this.arcLength		= 0;				// Reset Arc Length

		// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		for( i=1; i <= s; i++ ){
			c.at( i * this.sampleCntInv , p1 );
			this.arcLength 		+= Math.sqrt( (p1[0] - p0[0]) ** 2 + (p1[1] - p0[1]) ** 2 );
			this.samples[ i ] 	=  this.arcLength;

			p0[ 0 ] = p1[ 0 ];	// Save point for next loop
			p0[ 1 ] = p1[ 1 ];
		}

		return this;
	}

	mapT( t ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Return Extremes, else set variables
		if(t <= 0) return 0;
		if(t >= 1) return 1;
		
		let targetLen	= t * this.arcLength,
			minIdx 		= 0,
			min 		= 0,
			max 		= this.sampleCnt;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Binary Search to find the idx of a sample
		// that is just below the target length so if the target is 10, 
		// find index that has a length at 10 or ver close on the min side,like 9
		while( min < max ){
			minIdx = min + ( ((max - min) * 0.5) | 0 ); //get mid index, use pipe for same op as Math.floor()
			
			// if sample is under target, use mid index+1 as new min
			// else sample is over target, use index as max for next iteration
			if(this.samples[ minIdx ] < targetLen)	min	= minIdx + 1;
			else 									max	= minIdx;
		}

		// if by chance sample is over target because we ended up with max index, go back one.
		if( this.samples[ minIdx ] > targetLen ) minIdx--;

		//Check if the idex is within bounds
		if( minIdx < 0 )					return 0;	// Well, can't have less then 0 as an index :)
		if( minIdx >= this.sampleCnt )		return 1;	// if the max value is less then target, just return 1;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Interpolate between the min and max indexes.
		let minLen = this.samples[ minIdx ];
		if( minLen == targetLen )	return minIdx * this.sampleCntInv;

		// Where does the targetLen exist between the min and maxLen... this t is the
		// Length interplation between the two sample points. Since Each sample point
		// itself is the t of the curve. So for example,
		// minIdx is 2 and we have 10 samples,  So we can get the curve t by doing minIdx / SampleCnt
		// Now are target leng lives between  index 2 and 3... So by finding the gradient  value between
		// for example 0.5...   So we're on index 2 but we need an extra half of index... So 2.5 sample index
		// We take that value and divide - 2.5 / sampleCnt = t of curve in relation to arc length.
		let maxLen	= this.samples[ minIdx + 1 ],
			tLen	= (targetLen - minLen) / ( maxLen - minLen );

		return ( minIdx + tLen ) * this.sampleCntInv;
	}
}

class SplineMap{
	arc_len		= 0;	// Total Length of the Spline
	curve_cnt 	= 0;	// How many curves in spline
	samp_per 	= 0;	// How many samples per curve
	samp_cnt 	= 0;	// Total Sample Count
	len_ary 	= null;	// Total length at each sample 
	inc_ary 	= null;	// Length Traveled at each samples
	time_ary 	= null; // Curve T Value at each samples
	//spline 		= null;	// Reference to Spline

	constructor( s=null, samp_cnt=5 ){
		if( s ) this.from_spine( s, samp_cnt );
	}

	from_spine( s, samp_cnt=5 ){
		//this.spline 	= s;
		this.curve_cnt	= s.curve_count();
		this.samp_per 	= samp_cnt;
		this.samp_cnt	= this.curve_cnt * samp_cnt + 1;
		this.len_ary 	= new Array( this.samp_cnt );
		this.inc_ary	= new Array( this.samp_cnt );
		this.time_ary	= new Array( this.samp_cnt );
	
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let v0	= new Vec3(),
			v1	= new Vec3(),
			a	= 1, 
			i, j, t, len;

		s.at( 0, v0 );
		this.len_ary[ 0 ]	= 0;
		this.inc_ary[ 0 ]	= 0;
		this.time_ary[ 0 ]	= 0;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		for( i=0; i < this.curve_cnt; i++ ){				// One Iteration Per Curve
			for( j=1; j <= samp_cnt; j++ ){					// One Iteractin per Sample on 1 Curve
				t = j / samp_cnt;							// Time on the curve
				s.at_curve( i, t, v1 );						// Get Position of the curve

				//.................................
				len 				= Vec3.len( v0, v1 );
				this.arc_len		+= len;					// Total Length
				this.len_ary[ a ]	= this.arc_len;			// Current Total Length
				this.inc_ary[ a ]	= len;					// Length between Current+Previous Point
				this.time_ary[ a ]	= i + t;				// Time Curve Step

				//.................................
				v0.copy( v1 );								// Save for next loop
				a++;										// Move Array Index up
			}
		}
		return this;
	}

	// Compute the Spline's T Value based on a specific length of the curve
	at_len( len, a=null, b=null ){
		if( a == null ) a = 0;
		if( b == null ) b = this.samp_cnt-2;

		for( let i=b; i >= a; i-- ){
			if( this.len_ary[ i ] < len ){
				let tt	= ( len - this.len_ary[ i ] ) / this.inc_ary[ i+1 ]; 		// Normalize the Search Length   ( x-a / b-a )
				let ttt	= this.time_ary[ i ] * (1-tt) + this.time_ary[ i+1 ] * tt;	// Interpolate the Curve Time between two points
				return ttt / this.curve_cnt;	// Since time saved as as Curve# + CurveT, Normalize it based on total time which is curve count
			}
		}
		return 0;
	}

	// Get Spline T based on Time of Arc Length
	at( t ){
		if( t >= 1 ) return 1;
		if( t <= 0 ) return 0;
		return this.at_len( this.arc_len * t );
	}

	// Get Spline T based on Time between Two Main Points on the Spline
	at_range( a, b, t ){
		let ai 	= a * this.samp_per,
			bi	= b * this.samp_per,
			len	= this.len_ary[ ai ] * (1-t) + this.len_ary[ bi ] * t;
		return this.at_len( len, ai, bi );
	}
}
