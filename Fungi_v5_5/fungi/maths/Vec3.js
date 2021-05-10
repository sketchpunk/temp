
class Vec3 extends Float32Array{
	constructor(ini){
		super(3);

		if( ini instanceof Vec3 || ini instanceof Float32Array || (ini && ini.length == 3)){
			this[0] = ini[0]; this[1] = ini[1]; this[2] = ini[2];
		}else if(arguments.length == 3){
			this[0] = arguments[0]; this[1] = arguments[1]; this[2] = arguments[2];
		}else{
			this[0] = this[1] = this[2] = ini || 0;
		}
	}

	////////////////////////////////////////////////////////////////////
	// GETTER - SETTERS
	////////////////////////////////////////////////////////////////////

		get x(){ return this[0]; }	set x( v ){ this[0] = v; }
		get y(){ return this[1]; }	set y( v ){ this[1] = v; }
		get z(){ return this[2]; }	set z( v ){ this[2] = v; }

		set_x( v ){ this[0] = v; return this; }
		set_y( v ){ this[1] = v; return this; }
		set_z( v ){ this[2] = v; return this; }
		set( x=null, y=null, z=null ){ 
			if( x != null ) this[0] = x;
			if( y != null ) this[1] = y; 
			if( z != null ) this[2] = z;
			return this;
		}

		from_struct( o ){ this[0] = o.x; this[1] = o.y; this[2] = o.z; return this; }

		copy( v ){ this[0] = v[0]; this[1] = v[1]; this[2] = v[2]; return this; }
		copy_to( v ){ v[0] = this[0]; v[1] = this[1]; v[2] = this[2]; return v; }
		
		clone(){ return new Vec3( this ); }

		reset(){ this[0] = 0; this[1] = 0; this[2] = 0; return this; }

		to_string( rnd=0 ){
			if( rnd == 0 ) return "[" + this.join(",") + "]";
			else{
				let s = "[";
				for( let i=0; i < 3; i++ ){
					switch( this[i] ){
						case 0	: s += "0,"; break;
						case 1	: s += "1,"; break;
						default	: s += this[ i ].toFixed( rnd ) + ","; break;
					}
				}

				return s.slice(0,-1) + "]";
			}
		}
		
		is_zero(){ return ( this[0] == 0 && this[1] == 0 && this[2] == 0 ); }

		//-------------------------------------------

		from_buf( ary, i ){ this[0] = ary[i]; this[1] = ary[i+1]; this[2] = ary[i+2]; return this;}
		to_buf( ary, i ){ ary[i] = this[0]; ary[i+1] = this[1]; ary[i+2] = this[2]; return this; }

		push_to( ary ){ ary.push( this[0], this[1], this[2] ); return this; }

		//-------------------------------------------

		set_len( len ){ return this.norm().scale(len); }

		len( v ){
			//Only get the magnitude of this vector
			if( !v ) return Math.sqrt( this[0]**2 + this[1]**2 + this[2]**2 );

			//Get magnitude based on another vector
			let x = this[0] - v[0],
				y = this[1] - v[1],
				z = this[2] - v[2];

			return Math.sqrt( x*x + y*y + z*z );
		}
		
		len_sqr( v ){
			//Only get the squared magnitude of this vector
			if(v === undefined) return this[0]**2 + this[1]**2 + this[2]**2;

			//Get squared magnitude based on another vector
			let x = this[0] - v[0],
				y = this[1] - v[1],
				z = this[2] - v[2];

			return x*x + y*y + z*z;
		}

		rnd( x0=0, x1=1, y0=0, y1=1, z0=0, z1=1 ){
			let t;
			t = Math.random(); this[ 0 ] = x0 * (1-t) + x1 * t;
			t = Math.random(); this[ 1 ] = y0 * (1-t) + y1 * t;
			t = Math.random(); this[ 2 ] = z0 * (1-t) + z1 * t;
			return this;
		}

		// Which axis has the smallest value
		get_min_axis(){
			if( this[0] < this[1] & this[0] < this[2] ) return 0;
			if( this[1] < this[2] ) return 1;
			return 2;
		}

	////////////////////////////////////////////////////////////////////
	// FROM SETTERS
	////////////////////////////////////////////////////////////////////

		from_add( a, b ){
			this[0] = a[0] + b[0];
			this[1] = a[1] + b[1];
			this[2] = a[2] + b[2];
			return this;
		}

		from_sub( a, b ){
			this[0] = a[0] - b[0];
			this[1] = a[1] - b[1];
			this[2] = a[2] - b[2];
			return this;
		}

		from_mul( a, b ){
			this[0] = a[0] * b[0];
			this[1] = a[1] * b[1];
			this[2] = a[2] * b[2];
			return this;
		}

		from_div( a, b ){
			this[0] = ( b[0] != 0 )? a[0] / b[0] : 0;
			this[1] = ( b[1] != 0 )? a[1] / b[1] : 0;
			this[2] = ( b[2] != 0 )? a[2] / b[2] : 0;
			return this;
		}

		from_scale( a, s ){
			this[0] = a[0] * s;
			this[1] = a[1] * s;
			this[2] = a[2] * s;
			return this;
		}

		from_div_scale( a, s ){
			this[0] = a[0] / s;
			this[1] = a[1] / s;
			this[2] = a[2] / s;
			return this;
		}


		//-------------------------------------------

		from_norm( v ){
			let mag = Math.sqrt( v[0]**2 + v[1]**2 + v[2]**2 );
			if( mag == 0 ) return this;

			mag = 1 / mag;
			this[0] = v[0] * mag;
			this[1] = v[1] * mag;
			this[2] = v[2] * mag;
			return this;
		}

		from_invert( a ){
			this[0] = -a[0];
			this[1] = -a[1];
			this[2] = -a[2];
			return this;
		}

		from_cross( a, b ){
			let ax = a[0], ay = a[1], az = a[2],
				bx = b[0], by = b[1], bz = b[2];
			this[0] = ay * bz - az * by;
			this[1] = az * bx - ax * bz;
			this[2] = ax * by - ay * bx;
			return this;
		}

		from_lerp( a, b, t ){
			let ti = 1 - t; // Linear Interpolation : (1 - t) * v0 + t * v1;
			this[0] = a[0] * ti + b[0] * t;
			this[1] = a[1] * ti + b[1] * t;
			this[2] = a[2] * ti + b[2] * t;
			return this;
		}

		from_polar( lon, lat ) {
			let phi 	= ( 90 - lat ) * 0.01745329251, //deg 2 rad
				theta 	= lon * 0.01745329251,  //( lon + 180 ) * 0.01745329251,
				sp     	= Math.sin(phi);

			this[0] = -sp * Math.sin( theta );
			this[1] = Math.cos( phi );
			this[2] = sp * Math.cos( theta );
			return this;
		}

		from_quat( q, v=Vec3.FORWARD ){
			//Vec3.transform_quat( dir || Vec3.FORWARD, q, this );
			let qx = q[0], qy = q[1], qz = q[2], qw = q[3],
				vx = v[0], vy = v[1], vz = v[2],
				x1 = qy * vz - qz * vy,
				y1 = qz * vx - qx * vz,
				z1 = qx * vy - qy * vx,
				x2 = qw * x1 + qy * z1 - qz * y1,
				y2 = qw * y1 + qz * x1 - qx * z1,
				z2 = qw * z1 + qx * y1 - qy * x1;

			this[0] = vx + 2 * x2;
			this[1] = vy + 2 * y2;
			this[2] = vz + 2 * z2;
			return this;
		}

		from_axis_angle( axis, rad, v=Vec3.FORWARD ){
			// Rodrigues Rotation formula:
			// v_rot = v * cos(theta) + cross( axis, v ) * sin(theta) + axis * dot( axis, v) * (1-cos(theta))
			let cp	= Vec3.cross( axis, v ),
				dot	= Vec3.dot( axis, v ),
				s	= Math.sin( rad ),
				c	= Math.cos( rad ),
				ci	= 1 - c;

			this[ 0 ] = v[0] * c + cp[0] * s + axis[0] * dot * ci;
			this[ 1 ] = v[1] * c + cp[1] * s + axis[1] * dot * ci;
			this[ 2 ] = v[2] * c + cp[2] * s + axis[2] * dot * ci;
			return this;
		}


	////////////////////////////////////////////////////////////////////
	// INSTANCE OPERATORS
	////////////////////////////////////////////////////////////////////
		
		add( v, out=null ){
			out = out || this;
			out[0] = this[0] + v[0];
			out[1] = this[1] + v[1];
			out[2] = this[2] + v[2];
			return out;
		}

		sub( v, out=null ){
			out = out || this;
			out[0] = this[0] - v[0];
			out[1] = this[1] - v[1];
			out[2] = this[2] - v[2];
			return out;
		}

		mul( v, out=null ){
			out = out || this;
			out[0] = this[0] * v[0];
			out[1] = this[1] * v[1];
			out[2] = this[2] * v[2];
			return out;
		}

		div( v, out=null ){
			out = out || this;
			out[0] = (v[0] != 0)? this[0] / v[0] : 0;
			out[1] = (v[1] != 0)? this[1] / v[1] : 0;
			out[2] = (v[2] != 0)? this[2] / v[2] : 0;
			return out;
		}

		div_scale( v, out=null ){
			out = out || this;
			out[0] = this[0] / v;
			out[1] = this[1] / v;
			out[2] = this[2] / v;
			return out;
		}

		div_inv_scale( v=1, out=null ){
			out = out || this;
			out[0] = (this[0] != 0)? v / this[0] : 0;
			out[1] = (this[1] != 0)? v / this[1] : 0;
			out[2] = (this[2] != 0)? v / this[2] : 0;
			return out;
		}	

		scale( v, out=null ){
			out = out || this;
			out[0] = this[0] * v;
			out[1] = this[1] * v;
			out[2] = this[2] * v;
			return out;
		}

		//-------------------------------------------

		abs( out=null ){
			out = out || this;
			out[0] = Math.abs( this[0] );
			out[1] = Math.abs( this[1] );
			out[2] = Math.abs( this[2] );
			return out;
		}

		floor( out=null ){
			out = out || this;
			out[0] = Math.floor( this[0] );
			out[1] = Math.floor( this[1] );
			out[2] = Math.floor( this[2] );
			return out;
		}

		//When values are very small, like less then 0.000001, just make it zero.
		near_zero( out=null ){
			out = out || this;
			if(Math.abs(out[0]) <= 1e-6) out[0] = 0;
			if(Math.abs(out[1]) <= 1e-6) out[1] = 0;
			if(Math.abs(out[2]) <= 1e-6) out[2] = 0;
			return out;
		}

		invert( out=null ){
			out = out || this;
			out[0] = -this[0];
			out[1] = -this[1];
			out[2] = -this[2];
			return out;
		}

		norm( out=null ){
			let mag = Math.sqrt( this[0]**2 + this[1]**2 + this[2]**2 );
			if(mag == 0) return this;

			mag = 1 / mag;
			out = out || this;
			out[0] = this[0] * mag;
			out[1] = this[1] * mag;
			out[2] = this[2] * mag;

			return out;
		}

		clamp( min, max ){
			this[ 0 ] = Math.min( Math.max( this[0], min[ 0 ] ), max[ 0 ] );
			this[ 1 ] = Math.min( Math.max( this[1], min[ 1 ] ), max[ 1 ] );
			this[ 2 ] = Math.min( Math.max( this[2], min[ 2 ] ), max[ 2 ] );
			return this;
		}


	////////////////////////////////////////////////////////////////////
	// TRANSFORMATIONS
	////////////////////////////////////////////////////////////////////
		
		transform_mat3( m, out=null ){
			let x = this[0], y = this[1], z = this[2];
			out = out || this;
			out[0] = x * m[0] + y * m[3] + z * m[6];
			out[1] = x * m[1] + y * m[4] + z * m[7];
			out[2] = x * m[2] + y * m[5] + z * m[8];
			return out;
		}

		transform_mat4( m, out=null ){
		    let x = this[0], y = this[1], z = this[2],
		        w = m[3] * x + m[7] * y + m[11] * z + m[15];
		    w = w || 1.0;

		    out = out || this;
		    out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
		    out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
		    out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
		    return out;
		}

		rotate( rad, axis="x", out=null ){
			//https://www.siggraph.org/education/materials/HyperGraph/modeling/mod_tran/3drota.htm
			out = out || this;

			let sin = Math.sin(rad),
				cos = Math.cos(rad),
				x 	= this[0],
				y 	= this[1],
				z 	= this[2];

			switch( axis ){
				case "y": //..........................
					out[0]	= z*sin + x*cos; //x
					out[2]	= z*cos - x*sin; //z
				break;
				case "x": //..........................
					out[1]	= y*cos - z*sin; //y
					out[2]	= y*sin + z*cos; //z
				break;
				case "z": //..........................
					out[0]	= x*cos - y*sin; //x
					out[1]	= x*sin + y*cos; //y
				break;
			}

			return out;
		}

		lerp( v, t, out ){
			if(out == null) out = this;
			let ti = 1 - t;

			//Linear Interpolation : (1 - t) * v0 + t * v1;
			out[0] = this[0] * ti + v[0] * t;
			out[1] = this[1] * ti + v[1] * t;
			out[2] = this[2] * ti + v[2] * t;
			return out;
		}

		transform_quat( q ){ 
			let qx = q[0], qy = q[1], qz = q[2], qw = q[3],
				vx = this[0], vy = this[1], vz = this[2],
				x1 = qy * vz - qz * vy,
				y1 = qz * vx - qx * vz,
				z1 = qx * vy - qy * vx,
				x2 = qw * x1 + qy * z1 - qz * y1,
				y2 = qw * y1 + qz * x1 - qx * z1,
				z2 = qw * z1 + qx * y1 - qy * x1;

			this[0] = vx + 2 * x2;
			this[1] = vy + 2 * y2;
			this[2] = vz + 2 * z2;
			return this;
		}

		rot_axis_angle( axis, rad, out ){
			// Rodrigues Rotation formula:
			// v_rot = v * cos(theta) + cross( axis, v ) * sin(theta) + axis * dot( axis, v) * (1-cos(theta))
			let cp	= Vec3.cross( axis, this ),
				dot	= Vec3.dot( axis, this ),
				s	= Math.sin(rad),
				c	= Math.cos(rad),
				ci	= 1 - c;

			out = out || this;
			out[ 0 ] = this[0] * c + cp[0] * s + axis[0] * dot * ci;
			out[ 1 ] = this[1] * c + cp[1] * s + axis[1] * dot * ci;
			out[ 2 ] = this[2] * c + cp[2] * s + axis[2] * dot * ci;
			return out;
		}


	////////////////////////////////////////////////////////////////////
	// STATIC OPERATORS
	////////////////////////////////////////////////////////////////////
		
		static add( a, b, out=null ){ 
			out = out || new Vec3();
			out[0] = a[0] + b[0];
			out[1] = a[1] + b[1];
			out[2] = a[2] + b[2];
			return out;
		}

		static sub( a, b, out=null){ 
			out = out || new Vec3();
			out[0] = a[0] - b[0];
			out[1] = a[1] - b[1];
			out[2] = a[2] - b[2];
			return out;
		}

		static mul( a, b, out=null ){
			out = out || new Vec3();
			out[0] = a[0] * b[0];
			out[1] = a[1] * b[1];
			out[2] = a[2] * b[2];
			return out;
		}

		static div( v, s, out=null ){
			out = out || new Vec3();
			out[0] = v[0] / s;
			out[1] = v[1] / s;
			out[2] = v[2] / s;
			return out;			
		}

		static scale( v, s, out=null ){
			out = out || new Vec3();
			out[0] = v[0] * s;
			out[1] = v[1] * s;
			out[2] = v[2] * s;
			return out;
		}

		//-------------------------------------------

		static norm( v ){ return new Vec3().from_norm( v ); }

		static dot( a, b ){ return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
		
		static cross( a, b, out ){
			let ax = a[0], ay = a[1], az = a[2],
				bx = b[0], by = b[1], bz = b[2];

			out	= out || new Vec3();
			out[0] = ay * bz - az * by;
			out[1] = az * bx - ax * bz;
			out[2] = ax * by - ay * bx;
			return out;
		}

		static angle( v0, v1 ){
			//acos(dot(a,b)/(len(a)*len(b))) 
			//let theta = this.dot( v0, v1 ) / ( Math.sqrt( v0.len_sqr() * v1.len_sqr() ) );
			//return Math.acos( Math.max( -1, Math.min( 1, theta ) ) ); // clamp ( t, -1, 1 )

			// atan2(len(cross(a,b)),dot(a,b))  
			let d = this.dot( v0, v1 ),
				c = this.cross( v0, v1 );
			return Math.atan2( c.len(), d ); 

			//let cosine = this.dot( v0, v1 );
			//if(cosine > 1.0) return 0;
			//else if(cosine < -1.0) return Math.PI;
			//else return Math.acos( cosine / ( Math.sqrt( v0.len_sqr() * v1.len_sqr() ) ) );
		}

		static project( from, to, out=null ){
			// Modified from https://github.com/Unity-Technologies/UnityCsReference/blob/master/Runtime/Export/Math/Vector3.cs#L265
			// dot( a, b ) / dot( b, b ) * b
			out = out || new Vec3();

			let denom = Vec3.dot( to, to );
			if( denom < 0.000001 ) return out.copy( Vec3.ZERO );
		
			let scl	= Vec3.dot( from, to ) / denom;
			return out.set( to[0] * scl, to[1] * scl, to[2] * scl );
		}

		static project_plane( from, norm, out=null ){ // TODO, this is not Correct for Ray
			// a - ( dot( a, b ) / dot( b, b ) * b )
			out = out || new Vec3();

			let denom = Vec3.dot( norm, norm );
			if( denom < 0.000001 ) return out.copy( Vec3.ZERO );
		
			let scl	= Vec3.dot( from, norm ) / denom;
			out.set( norm[0] * scl, norm[1] * scl, norm[2] * scl );

			return Vec3.sub( from, out, out );
		}

		//-------------------------------------------

		static len( a, b ){ return Math.sqrt( (a[0]-b[0]) ** 2 + (a[1]-b[1]) ** 2 + (a[2]-b[2]) ** 2 ); }
		static len_sqr( a, b ){ return (a[0]-b[0]) ** 2 + (a[1]-b[1]) ** 2 + (a[2]-b[2]) ** 2; }

		//-------------------------------------------

		static transform_quat( v, q, out=null ){
			out = out || new Vec3();
			let qx = q[0], qy = q[1], qz = q[2], qw = q[3],
				vx = v[0], vy = v[1], vz = v[2],
				x1 = qy * vz - qz * vy,
				y1 = qz * vx - qx * vz,
				z1 = qx * vy - qy * vx,
				x2 = qw * x1 + qy * z1 - qz * y1,
				y2 = qw * y1 + qz * x1 - qx * z1,
				z2 = qw * z1 + qx * y1 - qy * x1;

			out[0] = vx + 2 * x2;
			out[1] = vy + 2 * y2;
			out[2] = vz + 2 * z2;
			return out;
		}

		static lerp( a, b, t, out=null ){
			out = out || new Vec3();

			let ti = 1 - t; // Linear Interpolation : (1 - t) * v0 + t * v1;
			out[0] = a[0] * ti + b[0] * t;
			out[1] = a[1] * ti + b[1] * t;
			out[2] = a[2] * ti + b[2] * t;
			return out;
		}

	////////////////////////////////////////////////////////////////////
	// INTERPOLATION
	////////////////////////////////////////////////////////////////////

		// B & C are the main points, A & D are the tangents
		static cubic_spline( a, b, c, d, t, out ){
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

	////////////////////////////////////////////////////////////////////
	// MISC
	////////////////////////////////////////////////////////////////////

		static struct( o ){ return new Vec3( o.x, o.y, o.z ); }

		// From a point in space, closest spot to a 3D line
		static point_to_line( a, b, p, out=null ){
			let dx	= b[0] - a[0],
				dy	= b[1] - a[1],
				dz	= b[2] - a[2],
				t	= ( (p[0]-a[0])*dx + (p[1]-a[1])*dy + (p[2]-a[2])*dz ) / ( dx*dx + dy*dy + dz*dz ) ;

			if( out ){
				let ti = 1-t;
				out[ 0 ] = a[0] * ti + b[0] * t;
				out[ 1 ] = a[1] * ti + b[1] * t;
				out[ 2 ] = a[2] * ti + b[2] * t;
			}
			return t;
		}

		// Create an Array of Vectors
		static create_array( len ){
			let i, ary = new Array( len );
			for(i=0; i < len; i++) ary[i] = new Vec3();
			return ary;
		}

		// Create an Iterator Object that allows an easy
		// way to loop a Float32Buffer
		static f32buf_iter( buf ){
			let result  = { value:new Vec3(), done:false },
				len     = buf.length,
				i       = 0;
		
			let next    = ()=>{
				if( i >= len ) result.done = true;
				else{
					result.value.from_buf( buf, i );
					i += 3;
				}
				return result;
			};
		
			return { [Symbol.iterator](){ return { next }; } };
		}
}


//########################################################################
// CONSTANTS
Vec3.UP			= new Vec3(  0,  1,  0 );
Vec3.DOWN		= new Vec3(  0, -1,  0 );
Vec3.LEFT		= new Vec3(  1,  0,  0 );
Vec3.RIGHT		= new Vec3( -1,  0,  0 );
Vec3.FORWARD	= new Vec3(  0,  0,  1 );
Vec3.BACK		= new Vec3(  0,  0, -1 );
Vec3.ZERO		= new Vec3(  0,  0,  0 );


class VRot90{
    // #region SINGLE AXIS ROTATION
    static xp( v, o ){ let x = v[0], y = v[1], z = v[2]; o[0] = x; o[1] = -z; o[2] = y; return o; }    // x-zy rot x+90
	static xn( v, o ){ let x = v[0], y = v[1], z = v[2]; o[0] = x; o[1] = z; o[2] = -y; return o; }    // xz-y rot x-90
	static x2( v, o ){ let x = v[0], y = v[1], z = v[2]; o[0] = x; o[1] = -y; o[2] = -z; return o; }   // x-y-z rot x+180
    
    static yp( v, o ){ let x = v[0], y = v[1], z = v[2]; o[0] = -z; o[1] = y; o[2] = x; return o; }    // -zyx rot y+90
	static yn( v, o ){ let x = v[0], y = v[1], z = v[2]; o[0] = z; o[1] = y; o[2] = -x; return o; }    // zy-x rot y-90
	static y2( v, o ){ let x = v[0], y = v[1], z = v[2]; o[0] = -x; o[1] = y; o[2] = -z; return o; }   // -xy-z rot y-180

    static zp( v, o ){ let x = v[0], y = v[1], z = v[2]; o[0] = y; o[1] = -x; o[2] = z; return o; }    // y-xz rot z+90
	static zn( v, o ){ let x = v[0], y = v[1], z = v[2]; o[0] = -y; o[1] = x; o[2] = z; return o; }    // -yxz rot z-90
	static z2( v, o ){ let x = v[0], y = v[1], z = v[2]; o[0] = -x; o[1] = -y; o[2] = z; return o; }   // -x-yz rot z+180
    // #endregion

    // #region COMBINATIONS
    static xp_yn( v, o ){ let x = v[0], y = v[1], z = v[2]; o[0] = -y; o[1] = -z; o[2] = x; return o; }     // -y-zx rot x+90, y-90
    static xp_yp( v, o ){ let x = v[0], y = v[1], z = v[2]; o[0] = y; o[1] = -z; o[2] = -x; return o; }     // y-z-x rot x+90, y+90
    static xp_yp_yp( v, o ){ let x = v[0], y = v[1], z = v[2]; o[0] = -x; o[1] = -z; o[2] = -y; return o; } // -x-z-y rot x+90, y+90, y+90
	static xp_xp( v, o ){ let x = v[0], y = v[1], z = v[2]; o[0] = x; o[1] = -y; o[2] = -z; return o; }     // x-y-z rot x+90, x+90
	static yn2( v, o ){ let x = v[0], y = v[1], z = v[2]; o[0] = -x; o[1] = y; o[2] = -z; return o; }		// -xy-z rot y-180
	// #endregion
}

//########################################################################
export default Vec3;
export { VRot90 };




/**
 * Performs a bezier interpolation with two control points
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {vec3} c the third operand
 * @param {vec3} d the fourth operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec3} out

export function bezier(out, a, b, c, d, t) {
  let inverseFactor = 1 - t;
  let inverseFactorTimesTwo = inverseFactor * inverseFactor;
  let factorTimes2 = t * t;
  let factor1 = inverseFactorTimesTwo * inverseFactor;
  let factor2 = 3 * t * inverseFactorTimesTwo;
  let factor3 = 3 * factorTimes2 * inverseFactor;
  let factor4 = factorTimes2 * t;

  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;

  return out;
}


		//static scalarRev(v,s,out){ //TODO, Is this even needed?
		//	out = out || new Vec3();
		//	out[0] = s * v[0];
		//	out[1] = s * v[1];
		//	out[2] = s * v[2];
		//	return out;
		//}

//https://keithmaggio.wordpress.com/2011/02/15/math-magician-lerp-slerp-and-nlerp/

Vector3 Slerp(Vector3 start, Vector3 end, float percent)
{
     // Dot product - the cosine of the angle between 2 vectors.
     float dot = Vector3.Dot(start, end);
     // Clamp it to be in the range of Acos()
     // This may be unnecessary, but floating point
     // precision can be a fickle mistress.
     Mathf.Clamp(dot, -1.0f, 1.0f);
     // Acos(dot) returns the angle between start and end,
     // And multiplying that by percent returns the angle between
     // start and the final result.
     float theta = Mathf.Acos(dot)*percent;
     Vector3 RelativeVec = end - start*dot;
     RelativeVec.Normalize();
     // Orthonormal basis
     // The final result.
     return ((start*Mathf.Cos(theta)) + (RelativeVec*Mathf.Sin(theta)));
}

Vector3 Nlerp(Vector3 start, Vector3 end, float percent){
     return Lerp(start,end,percent).normalized();
}

*/
