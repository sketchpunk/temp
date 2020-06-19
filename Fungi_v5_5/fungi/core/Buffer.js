
const ARRAY 	= 34962;
const ELEMENT	= 34963;
const UNIFORM	= 35345;
const STATIC	= 35044;
const DYNAMIC	= 35048;
const USHORT	= 5123;
const UINT		= 5125;
const FLOAT		= 5126;

class Buffer{
	// #region MAIN	
    id              = null;		// Buffer GL ID
	type			= null;		// Buffer Type
	data_type		= FLOAT;	// Data Type Used
	usage 			= 0;		// Is it static or dynamic
    capacity		= 0;		// Capacity in bytes of the gpu buffer
	byte_len		= 0;		// How Many Bytes Currently Posted to the GPU
	component_len	= 0;		// How many Elements make one component, Like Vec3 has 3.
	
	//interleaved     = null;		
    stride_len		= 0;		// Length of Data chunks, interleaved data.
    offset			= 0;		// Offset of Of Data Chunk, Data Leaved

	constructor( id, type, is_static=true ){
		this.id		= id;
		this.type	= type;
		this.usage	= ( is_static )? STATIC : DYNAMIC;
	}
	// #endregion ////////////////////////////////////////////////////////////////////////////////////// 
}

class BufferFactory{
	ARRAY 	= 34962;
	ELEMENT	= 34963;
	UNIFORM	= 35345;
	STATIC	= 35044;
	DYNAMIC	= 35048;
	USHORT	= 5123;
	UINT	= 5125;
	FLOAT	= 5126;

	constructor( gl ){ this.gl = gl; }

	// #region CREATE
	from_type_array( buf_type, t_ary=null, is_static=true, unbind=true ){
		let buf = new Buffer( this.gl.ctx.createBuffer(), buf_type, is_static );
		
		if( t_ary ){
			this.gl.ctx.bindBuffer( buf.type, buf.id );
			this.gl.ctx.bufferData( buf.type, t_ary, buf.usage );
			if( unbind ) this.gl.ctx.bindBuffer( buf.type, null );

			buf.byte_len = buf.capacity = t_ary.byteLength;
			if( t_ary instanceof Uint16Array ) 			buf.data_type = USHORT;
			else if( t_ary instanceof Uint32Array ) 	buf.data_type = UINT;
		}

		return buf;
	}

	from_bin( buf_type, data_view, byte_offset, byte_size, component_len, is_static=true, unbind=true ){
		let buf = new Buffer( this.gl.ctx.createBuffer(), buf_type, is_static );
		buf.component_len = component_len;
		
		this.gl.ctx.bindBuffer( buf_type, buf.id );
		this.gl.ctx.bufferData( buf_type, data_view, buf.usage, byte_offset, byte_size );
		if( unbind ) this.gl.ctx.bindBuffer( buf_type, null );

		buf.byte_len = buf.capacity = byte_size;
		return buf;
	}

	new_uniform( t_ary=null, is_static=true, unbind=true ){	return this.from_type_array( UNIFORM, t_ary, is_static, unbind ); }
	new_element( t_ary=null, is_static=true, unbind=true ){	return this.from_type_array( ELEMENT, t_ary, is_static, unbind ); }
	new_array( t_ary=null, comp_len=3, is_static=true, unbind=true ){
		let buf = this.from_type_array( ARRAY, t_ary, is_static, unbind );
		buf.component_len = comp_len;
		return buf;
	}

	bin_element( data_view, byte_offset, byte_size, component_len, is_static=true, unbind=true ){
		return this.from_bin( ELEMENT, data_view, byte_offset, byte_size, component_len, is_static, unbind ); }
	
	bin_array( data_view, byte_offset, byte_size, component_len, is_static=true, unbind=true ){
		return this.from_bin( ARRAY, data_view, byte_offset, byte_size, component_len, is_static, unbind ); }

	new_empty_array( byte_size, is_static=true, unbind=true ){
		let buf = new Buffer( this.gl.ctx.createBuffer(), ARRAY, is_static );

		this.gl.ctx.bindBuffer( buf.type, buf.id );
		this.gl.ctx.bufferData( buf.type, byte_size, buf.usage );

		buf.capacity = byte_size;
		if( unbind ) this.gl.ctx.bindBuffer( buf.type, null );
		return buf;
	}
	// #endregion ////////////////////////////////////////////////////////////////////////////////////// 
	
	// #region UPDATE
	update_data( buf, type_ary ){
		let b_len = type_ary.byteLength;
		this.gl.ctx.bindBuffer( buf.type, buf.id );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		if( type_ary instanceof Float32Array ) 		buf.data_type = FLOAT;
		else if( type_ary instanceof Uint16Array ) 	buf.data_type = USHORT;
		else if( type_ary instanceof Uint32Array )	buf.data_type = UINT;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// if the data size is of capacity on the gpu, can set it up as sub data.
		if( b_len <= buf.capacity ) this.gl.ctx.bufferSubData( buf.type, 0, type_ary, 0, null );
		else{
			buf.capacity = b_len;
			// if( this.byte_len > 0) gl.ctx.bufferData( this.type, null, gl.ctx.DYNAMIC_DRAW ); // Clean up previus data
			this.gl.ctx.bufferData( buf.type, type_ary, buf.usage );
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.gl.ctx.bindBuffer( buf.type, null ); // unbind buffer
		buf.byte_len = b_len;
	}

	/*
	set_dataview( buf, dv, b_start, b_len ){
		this.gl.ctx.bufferData( buf.type, dv, buf.usage, b_start, b_len );
		buf.byte_len = buf.capacity = b_len;
		return this;
	}
	*/
	// #endregion ////////////////////////////////////////////////////////////////////////////////////// 
	
	// #region UNBIND
	unbind_array(){ this.gl.ctx.bindBuffer( ARRAY, null ); return this; }
	unbind_element(){ this.gl.ctx.bindBuffer( ELEMENT, null ); return this; }
	unbind_uniform(){ this.gl.ctx.bindBuffer( UNIFORM, null ); return this; }
	// #endregion ////////////////////////////////////////////////////////////////////////////////////// 
}

export default BufferFactory; 