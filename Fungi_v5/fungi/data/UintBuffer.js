class UintBuffer{
	constructor( capacity=3, use_all=false, uint_type = Uint16Array ){
		this.capacity 		= capacity;
		this.buffer			= new uint_type( capacity );
		this.len 			= ( !use_all )? 0 : capacity;
		this.auto_expand	= 0;
		this.t_ary			= uint_type;
	}

	// #region MANAGE DATA
	reset(){ this.len = 0; return this; }

	push( v ){
		if( this.len + 1 > this.capacity ){
			if( !this.auto_expand ){ console.error( "UintBuffer is at capacity" ); return this; }
			else this.expand_by( this.auto_expand );
		}
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.buffer[ this.len++ ] = v;
		return this;
	}

	push_extra(){
		// Check of push will go over compacity.
		if( this.len + arguments.length > this.capacity ){
			if( !this.auto_expand ){ console.error( "UintBuffer is at capacity" ); return this; }
			else this.expand_by( this.auto_expand );
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let a;
		for( a of arguments ) this.buffer[ this.len++ ] = a;

		return this;
	}

	set( i, v ){ this.buffer[ i ] = v; return this; }
	get( i ){ return this.buffer[ i ]; }

	expand_by( size, use_all=false ){
		let capacity	= this.capacity + size,
			fb			= new this.t_ary( capacity );

		fb.set( this.buffer );

		this.capacity	= capacity;
		this.buffer		= fb;

		if( use_all ) this.len = this.capacity;
		return this;
	}
	// #endregion ////////////////////////////////////////////////////////////////////

	// #region Getters
	get byte_capacity(){ return this.buffer.byteLength; }	// Get the Capacity Length in Bytes
	get byte_len(){ return this.len * 3 * this.buffer.BYTES_PER_ELEMENT; }				// How much space is used in Bytes
	get buf_len(){ return this.len * 3; }					// How many floats being used
	get buf_capacity(){ return this.buffer.length; }		// Total floats available

	// Create a new View into the Buffer, but only up to whats being used, not total capacity.
	get_used(){ return new this.t_ary( this.buffer.buffer, 0, this.len ); }
	// #endregion ////////////////////////////////////////////////////////////////////
}


export default UintBuffer;