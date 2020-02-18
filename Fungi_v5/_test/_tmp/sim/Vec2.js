class Vec2 extends Float32Array{
	constructor( ini ){
		super(2);

		if(ini instanceof Vec2 || (ini && ini.length == 2)){
			this[0] = ini[0]; this[1] = ini[1];
		}else if(arguments.length == 2){
			this[0] = arguments[0]; this[1] = arguments[1];
		}else{
			this[0] = this[1] = ini || 0;
		}
	}

	////////////////////////////////////////////////////////////////////
	// GETTER - SETTERS
	////////////////////////////////////////////////////////////////////

		get x(){ return this[0]; }	set x( v ){ this[0] = v; }
		get y(){ return this[1]; }	set y( v ){ this[1] = v; }

		set( x=null, y=null ){ 
			if( x != null ) this[0] = x;
			if( y != null ) this[1] = y; 
			return this;
		}

		copy( v ){ this[0] = v[0]; this[1] = v[1]; return this; }
		clone(){ return new Vec2( this ); }
		
		//-------------------------------------------

		from_buf( ary, i ){ this[0] = ary[i]; this[1] = ary[i+1]; return this;}
		to_buf( ary, i ){ ary[i] = this[0]; ary[i+1] = this[1]; return this; }

		//-------------------------------------------

		set_len( len ){ return this.norm().scale(len); }

		len( v ){
			//Only get the magnitude of this vector
			if( !v ) return Math.sqrt( this[0]**2 + this[1]**2  );

			//Get magnitude based on another vector
			let x = this[0] - v[0],
				y = this[1] - v[1];

			return Math.sqrt( x*x + y*y );
		}
		
		len_sqr( v ){
			//Only get the squared magnitude of this vector
			if(v === undefined) return this[0]**2 + this[1]**2;

			//Get squared magnitude based on another vector
			let x = this[0] - v[0],
				y = this[1] - v[1];

			return x*x + y*y;
		}


	////////////////////////////////////////////////////////////////////
	// FROM SETTERS
	////////////////////////////////////////////////////////////////////

		from_add( a, b ){
			this[0] = a[0] + b[0];
			this[1] = a[1] + b[1];
			return this;
		}

		from_sub( a, b ){
			this[0] = a[0] - b[0];
			this[1] = a[1] - b[1];
			return this;
		}

		from_mul( a, b ){
			this[0] = a[0] * b[0];
			this[1] = a[1] * b[1];
			return this;
		}

		from_div( a, b ){
			this[0] = ( b[0] != 0 )? a[0] / b[0] : 0;
			this[1] = ( b[1] != 0 )? a[1] / b[1] : 0;
			return this;
		}

		from_scale( a, s ){
			this[0] = a[0] * s;
			this[1] = a[1] * s;
			return this;
		}

		//-------------------------------------------

		from_cross( a, b ){
			let ax = a[0], ay = a[1],
				bx = b[0], by = b[1];
			this[0] = ay * bz - az * by;
			this[1] = az * bx - ax * bz;
			return this;
		}

		from_lerp( a, b, t ){
			let ti = 1 - t; // Linear Interpolation : (1 - t) * v0 + t * v1;
			this[0] = a[0] * ti + b[0] * t;
			this[1] = a[1] * ti + b[1] * t;
			return this;
		}


	////////////////////////////////////////////////////////////////////
	// INSTANCE OPERATORS
	////////////////////////////////////////////////////////////////////
		
		add( v, out=null ){
			out = out || this;
			out[0] = this[0] + v[0];
			out[1] = this[1] + v[1];
			return out;
		}

		sub( v, out=null ){
			out = out || this;
			out[0] = this[0] - v[0];
			out[1] = this[1] - v[1];
			return out;
		}

		mul( v, out=null ){
			out = out || this;
			out[0] = this[0] * v[0];
			out[1] = this[1] * v[1];
			return out;
		}

		div( v, out=null ){
			out = out || this;
			out[0] = (v[0] != 0)? this[0] / v[0] : 0;
			out[1] = (v[1] != 0)? this[1] / v[1] : 0;
			return out;
		}

		div_scale( v, out=null ){
			out = out || this;
			out[0] = this[0] / v;
			out[1] = this[1] / v;
			return out;
		}

		div_inv_scale( v=1, out=null ){
			out = out || this;
			out[0] = (this[0] != 0)? v / this[0] : 0;
			out[1] = (this[1] != 0)? v / this[1] : 0;
			return out;
		}	

		scale( v, out=null ){
			out = out || this;
			out[0] = this[0] * v;
			out[1] = this[1] * v;
			return out;
		}

		//-------------------------------------------

		abs( out=null ){
			out = out || this;
			out[0] = Math.abs( this[0] );
			out[1] = Math.abs( this[1] );
			return out;
		}

		floor( out=null ){
			out = out || this;
			out[0] = Math.floor( this[0] );
			out[1] = Math.floor( this[1] );
			return out;
		}

		//When values are very small, like less then 0.000001, just make it zero.
		near_zero( out=null ){
			out = out || this;
			if(Math.abs(out[0]) <= 1e-6) out[0] = 0;
			if(Math.abs(out[1]) <= 1e-6) out[1] = 0;
			return out;
		}

		invert( out=null ){
			out = out || this;
			out[0] = -this[0];
			out[1] = -this[1];
			return out;
		}

		norm( out=null ){
			let mag = Math.sqrt( this[0]**2 + this[1]**2 );
			if(mag == 0) return this;

			mag = 1 / mag;
			out = out || this;
			out[0] = this[0] * mag;
			out[1] = this[1] * mag;

			return out;
		}


	////////////////////////////////////////////////////////////////////
	// TRANSFORMATIONS
	////////////////////////////////////////////////////////////////////
		lerp( v, t, out ){
			if(out == null) out = this;
			let ti = 1 - t;

			//Linear Interpolation : (1 - t) * v0 + t * v1;
			out[0] = this[0] * ti + v[0] * t;
			out[1] = this[1] * ti + v[1] * t;
			return out;
		}


	////////////////////////////////////////////////////////////////////
	// STATIC OPERATORS
	////////////////////////////////////////////////////////////////////
		
		static add( a, b, out=null ){ 
			out = out || new Vec2();
			out[0] = a[0] + b[0];
			out[1] = a[1] + b[1];
			return out;
		}

		static sub( a, b, out=null){ 
			out = out || new Vec2();
			out[0] = a[0] - b[0];
			out[1] = a[1] - b[1];
			return out;
		}

		static mul( a, b, out=null ){
			out = out || new Vec2();
			out[0] = a[0] * b[0];
			out[1] = a[1] * b[1];
			return out;
		}

		static scale( v, s, out=null ){
			out = out || new Vec2();
			out[0] = v[0] * s;
			out[1] = v[1] * s;
			return out;
		}

		//-------------------------------------------

		static dot( a, b ){ return a[0] * b[0] + a[1] * b[1]; }
		
		//-------------------------------------------

		static len( a, b ){ return Math.sqrt( (a[0]-b[0]) ** 2 + (a[1]-b[1]) ** 2 ); }
		static len_sqr( a, b ){ return (a[0]-b[0]) ** 2 + (a[1]-b[1]) ** 2; }

		//-------------------------------------------


	////////////////////////////////////////////////////////////////////
	// INTERPOLATION
	////////////////////////////////////////////////////////////////////

		// B & C are the main points, A & D are the tangents
		static cubic_spline( a, b, c, d, t, out ){
			let t2 = t * t,
				t3 = t * t2,
				a0 = d[0] - c[0] - a[0] + b[0],
				a1 = d[1] - c[1] - a[1] + b[1];
			out[0] = a0*t3 + ( a[0] - b[0] - a0 )*t2 + ( c[0] - a[0] )*t + b[0];
			out[1] = a1*t3 + ( a[1] - b[1] - a1 )*t2 + ( c[1] - a[1] )*t + b[1];
			return out;
		}
}