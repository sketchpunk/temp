class Vec3Buffer{
	constructor( capacity=3, use_all=false ){
		this.capacity 		= capacity;
		this.buffer			= new Float32Array( capacity * 3 );
		this.len 			= ( !use_all )? 0 : capacity;
		this.auto_expand	= 0;
	}

	// #region MANAGE DATA
	reset(){ this.len = 0; return this; }

	push( v ){
		if( this.len + 1 > this.capacity ){
			if( !this.auto_expand ){ console.error( "Vec3Buffer is at capacity" ); return this; }
			else this.expand_by( this.auto_expand );
		}
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let idx = this.len;
		this.len++;
		this.buffer.set( v, idx * 3 );
		return idx;
	}

	push_extra(){
		// Check of push will go over compacity.
		if( this.len + arguments.length > this.capacity ){
			if( !this.auto_expand ){ console.error( "Vec3Buffer is at capacity" ); return this; }
			else this.expand_by( this.auto_expand );
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let a, offset = this.len * 3;
		for( a of arguments ){
			if( a.length != 3 ){ console.log( "Vec3Buffer PushExtra: Array's Len does not equal component len."); continue; }

			this.buffer.set( a, offset );	// Copy Array To Buffer
			offset += 3;					// Move Offset to Next
			this.len++;						// Increment Vec Length
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		return this;
	}

	set( i, v ){
		this.buffer.set( v, i*3 );
		return this;
	}

	get( i, out ){
		i *= 3;
		out[ 0 ] = this.buffer[ i++ ];
		out[ 1 ] = this.buffer[ i++ ];
		out[ 2 ] = this.buffer[ i++ ];
		return out;
	}

	set_raw( i, x, y, z ){
		i *= 3;
		this.buffer[ i++ ] = x;
		this.buffer[ i++ ] = y;
		this.buffer[ i++ ] = z;
		return this;
	}

	expand_by( size, use_all=false ){
		let capacity	= this.capacity + size,
			fb			= new Float32Array( capacity * 3 );

		fb.set( this.buffer );

		this.capacity	= capacity;
		this.buffer		= fb;

		if( use_all ) this.len = this.capacity;
		return this;
	}
	// #endregion ////////////////////////////////////////////////////////////////////

	// #region Getters
	get byte_capacity(){ return this.buffer.byteLength; }	// Get the Capacity Length in Bytes
	get byte_len(){ return this.len * 3 * 4; }				// How much space is used in Bytes
	get buf_len(){ return this.len * 3; }					// How many floats being used
	get buf_capacity(){ return this.buffer.length; }		// Total floats available

	// Create a new View into the Buffer, but only up to whats being used, not total capacity.
	get_used(){ return new Float32Array( this.buffer.buffer, 0, this.len * 3 ); }
	// #endregion ////////////////////////////////////////////////////////////////////
}



/*
class VecBuffer{
	constructor( comp_len, capacity  ){
		this.comp_len	= comp_len;
		this.capacity 	= capacity;
		this.len 		= 0;
		this.buffer		= null;
	}

	static from_buf( buf, comp_len=3 ){
		let vb = new VecBuffer( comp_len, buf.length / comp_len );
		vb.buffer	= buf;
		vb.len 		= vb.capacity;
		return vb;
	}

	static mk( capacity=3, comp_len=3, use_all ){
		let vb = new VecBuffer( comp_len, capacity );
		vb.buffer	= new Float32Array( capacity * comp_len );
		vb.len 		= ( !use_all )? 0 : capacity;
		return vb;
	}

	///////////////////////////////////////////////////////////////////
	// Buffer Data Management
	///////////////////////////////////////////////////////////////////

		push(){
			let t_len = this.len + arguments.length;
			if( t_len > this.capacity ){ console.log("VecBuffer is at capacity"); return this; }

			let j, i, ii, offset = this.len * this.comp_len;
			for( i=0; i < arguments.length; i++ ){
				ii = offset + i * this.comp_len;

				for( j=0; j < this.comp_len; j++ ) this.buffer[ ii+j ] = arguments[ i ][ j ];
			}

			this.len = t_len;
			return this;
		}


		rm( i ){
			if( i >= this.len ){ console.log( "Can not remove, Index is greater then length"); return this; }

			//If removing last one, Just change the length
			let b_idx = this.len - 1;
			if( i == b_idx ){ this.len--; return this; }

			let a_idx				= i * this.comp_len;	// Index of Vec to Remove
			b_idx					*= this.comp_len;		// Index of Final Vec.
			this.buffer[ a_idx ]	= this.buffer[ b_idx ];
			this.buffer[ a_idx+1 ]	= this.buffer[ b_idx+1 ];
			this.buffer[ a_idx+2 ]	= this.buffer[ b_idx+2 ];
			this.len--;
			
			console.error("VecArray.rm is not implemented");
			return this;
		}

		expand_by( size, use_all=false ){
			let capacity	= this.capacity + size,
				fb			= new Float32Array( capacity * this.comp_len ),
				i;

			for( i=0; i < this.buffer.length; i++ ) fb[ i ] = this.buffer[ i ];

			this.capacity	= capacity;
			this.buffer		= fb;

			if( use_all ) this.len = this.capacity;
			return this;
		}


	///////////////////////////////////////////////////////////////////
	// Getters / Setters
	///////////////////////////////////////////////////////////////////
		get byte_capacity(){ return this.buffer.byteLength; }	// Total Bytes Available
		get byte_len(){ return this.len * this.comp_len * 4; }	// Length of Bytes in Use
		get buf_len(){ return this.len * this.comp_len; }
		get buf_capacity(){ return this.buffer.length; }

		set( i, v ){
			i *= this.comp_len;
			for( let j=0; j < this.comp_len; j++ ){ this.buffer[ i+j ] = v[ j ]; }
			return this;
		}

		set_raw( i ){
			i *= this.comp_len;
			for( let j=1; j < arguments.length; j++ ) this.buffer[ i++ ] = arguments[ j ];
			return this;
		}
}
*/

export default Vec3Buffer;