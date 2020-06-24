class Animation{
	frame_cnt	= 0;
	time_max	= 0;
	time_ary	= new Array();
	tracks		= new Array();

	static from_gltf( o ){
		let i, a = new Animation();

		a.frame_cnt	= o.frame_cnt;
		a.time_max	= o.time;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Make a copy of the Time Arrays
		for( i of o.times ) a.time_ary.push( i.slice( 0 ) );
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Convert Track Data
		for( i of o.tracks ) a.tracks.push( BoneTrack.from_gltf( i ) );

		return a;
	}
}

class BoneTrack{
	prop			= "pos";
	skin_idx		= 0;
	time_idx		= 0;
	interpolation	= "LINEAR"
	data			= null;
	raw				= null;
	frame_pose		= null;

	static from_gltf( o ){
		let t = new BoneTrack();

		t.prop			= o.type;
		t.skin_idx		= o.joint_idx;
		t.time_idx		= o.time_idx;
		t.interpolation	= o.interp;
		t.data			= o.data.slice( 0 );
		t.raw			= (t.prop == "rot")? [0,0,0,0] : [0,0,0];
		t.frame_pose	= this.FN[ t.prop ][ t.interpolation ];

		return t;
	}

	// How to Process the data for a bone
	static FN = {
		rot: {
			STEP: function( pose, frame ){
				quat_buf_copy( this.data, this.raw, frame.a_idx*4 );
				pose.set_local_rot( this.skin_idx, this.raw );
			},
			LINEAR:function( pose, frame ){
				quat_buf_blend( this.data, frame.a_idx*4, frame.b_idx*4, frame.time, this.raw );
				pose.set_local_rot( this.skin_idx, this.raw );
			},
		},
		pos:{
			STEP: function( pose, frame ){
				vec3_buf_copy( this.data, this.raw, frame.a_idx*3 );
				pose.set_local_pos( this.skin_idx, this.raw );
			},
			LINEAR:function( pose, frame ){
				vec3_buf_lerp( this.data, frame.a_idx*3, frame.b_idx*3, frame.time, this.raw );
				pose.set_local_pos( this.skin_idx, this.raw );
			},
		},
	};
}

class PoseAnimator{
	clock			= 0;
	frames			= new Array();

	// #region METHODS
	tick( dt ){ this.clock += dt; return this; }
	reset(){ this.clock = 0; return this; }
	// #endregion /////////////////////////////////////////////////////////

	// #region METHODS
	update( anim, pose ){
		let track, time = this.clock % anim.time_max;
		this.compute_frame_time( time, anim.time_ary );

		//console.log( time, this.frames );

		for( track of anim.tracks ){
			track.frame_pose( pose, this.frames[ track.time_idx ] );
		}
	}

	compute_frame_time( time, time_ary ){
		let j, i, ary, itm, len = time_ary.length;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Precreate date to hold our frame data
		if( this.frames.length < len ){
			for( i=this.frames.length; i < len; i++ ){
				this.frames.push( { a_idx:0, b_idx:0, time:0 } );
			}
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		for( j=0; j < len; j++ ){
			ary	= time_ary[ j ];	// Set of Frame Time Data
			itm	= this.frames[ j ];	// Container
			
			//-----------------------------------
			// Find the first frame that is less then the clock.
			itm.a_idx = 0;
			for( i=ary.length-2; i > 0; i-- ){
				if( ary[i] < time ){ itm.a_idx = i; break; }
			}

			//-----------------------------------
			// Normalize Time Between Frames
			itm.b_idx = itm.a_idx + 1;	// Next Frame

			// if not over, compute T between the two frames
			if( itm.b_idx < ary.length ){ 
				itm.time = ( time - ary[ itm.a_idx ] ) / ( ary[ itm.b_idx ] - ary[ itm.a_idx ] );
			}else{ 
				itm.b_idx	= 0;
				itm.time	= 0;
			}
		}
	}
	// #endregion /////////////////////////////////////////////////////////
}

// #region QUATERNION FUNCTIONS
function quat_norm( q ){
	let len =  q[0]**2 + q[1]**2 + q[2]**2 + q[3]**2;
	if(len > 0){
		len = 1 / Math.sqrt( len );
		q[0] *= len;
		q[1] *= len;
		q[2] *= len;
		q[3] *= len;
	}
	return q;
}

function quat_buf_copy( buf, q, i ){ 
	q[ 0 ] = buf[ i ];
	q[ 1 ] = buf[ i+1 ];
	q[ 2 ] = buf[ i+2 ];
	q[ 3 ] = buf[ i+3 ];
	return q;
}
// Special Quaternion NLerp Function. Does DOT checking & Fix
function quat_buf_blend( buf, ai, bi, t, out ){
	let a_x = buf[ ai ],	// Quaternion From
		a_y = buf[ ai+1 ],
		a_z = buf[ ai+2 ],
		a_w = buf[ ai+3 ],
		b_x = buf[ bi ],	// Quaternion To
		b_y = buf[ bi+1 ],
		b_z = buf[ bi+2 ],
		b_w = buf[ bi+3 ],
		dot = a_x * b_x + a_y * b_y + a_z * b_z + a_w * b_w,
		ti 	= 1 - t,
		s 	= 1;

	// if Rotations with a dot less then 0 causes artifacts when lerping,
	// We can fix this by switching the sign of the To Quaternion.
	if( dot < 0 ) s = -1;
	out[ 0 ] = ti * a_x + t * b_x * s;
	out[ 1 ] = ti * a_y + t * b_y * s;
	out[ 2 ] = ti * a_z + t * b_z * s;
	out[ 3 ] = ti * a_w + t * b_w * s;
	return quat_norm( out );
}

function quat_cubic_spline( a, b, c, d, t, out ){
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
	return quat_norm( out );
}
// #endregion /////////////////////////////////////////////////////////

// #region VEC3 FUNCTIONS
function vec3_buf_copy( buf, v, i ){ 
	v[ 0 ] = buf[ i ];
	v[ 1 ] = buf[ i+1 ];
	v[ 2 ] = buf[ i+2 ];
	return v;
 }

// basic vec3 lerp
function vec3_buf_lerp( buf, ai, bi, t, out ){
	let ti = 1 - t;
	out[ 0 ] = ti * buf[ ai ]		+ t * buf[ bi ];
	out[ 1 ] = ti * buf[ ai + 1 ]	+ t * buf[ bi + 1 ];
	out[ 2 ] = ti * buf[ ai + 2 ]	+ t * buf[ bi + 2 ];
	return out;
}

// #endregion /////////////////////////////////////////////////////////

export { Animation, PoseAnimator };