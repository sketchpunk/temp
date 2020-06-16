
const ARRAY 	= 34962;
const ELEMENT	= 34963;
const UNIFORM	= 35345;
const STATIC	= 35044;
const DYNAMIC	= 35048;

class Buffer{
	// #region MAIN	
    id              = null;		// Buffer GL ID
	type			= null;		// Buffer Type
	usage 			= 0;		// Is it static or dynamic
    capacity		= 0;		// Capacity in bytes of the gpu buffer
	byte_len		= 0;		// How Many Bytes Currently Posted ot the GPU
	component_len	= 1;		// How many Elements make one component, Like Vec3 has 3.
	
	interleaved     = null;		
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
	constructor( gl ){ this.gl = gl; }

	// #region CREATE
	new_buffer( buf_type, t_ary=null, is_static=true, unbind=true ){
		let buf = new Buffer( this.gl.ctx.createBuffer(), buf_type, is_static );
		
		if( t_ary ){
			this.gl.ctx.bindBuffer( buf.type, buf.id );
			this.gl.ctx.bufferData( buf.type, t_ary, buf.usage );
			buf.byte_len = buf.capacity = t_ary.byteLength;
			if( unbind ) this.gl.ctx.bindBuffer( buf.type, null );
		}

		return buf;
	}
	
	new_element( t_ary=null, is_static=true, unbind=true ){	return this.new_buffer( ELEMENT, t_ary, is_static, unbind ); }
	new_uniform( t_ary=null, is_static=true, unbind=true ){	return this.new_buffer( UNIFORM, t_ary, is_static, unbind ); }
	new_array( t_ary=null, comp_len=3, is_static=true, unbind=true ){
		let buf = this.new_buffer( ARRAY, t_ary, is_static, unbind );
		buf.component_len = comp_len;
		return buf;
	}
	// #endregion ////////////////////////////////////////////////////////////////////////////////////// 
	
	// #region UPDATE
	update_data( buf, type_ary=null ){
		let b_len = type_ary.byteLength;
		this.gl.ctx.bindBuffer( this.type, this.ref );

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

	set_empty_buffer( buf, byte_size ){ 
		this.gl.ctx.bufferData( buf.type, byte_size, buf.usage );
		buf.capacity = byte_size;
		return this;
	}

	set_dataview( buf, dv, b_start, b_len ){
		this.gl.ctx.bufferData( buf.type, dv, buf.usage, b_start, b_len );
		buf.byte_len = buf.capacity = b_len;
		return this;
	}
	// #endregion ////////////////////////////////////////////////////////////////////////////////////// 
	
	// #region UNBIND
	unbind_array(){ this.gl.ctx.bindBuffer( ARRAY, null ); return this; }
	unbind_element(){ this.gl.ctx.bindBuffer( ELEMENT, null ); return this; }
	unbind_uniform(){ this.gl.ctx.bindBuffer( UNIFORM, null ); return this; }
	// #endregion ////////////////////////////////////////////////////////////////////////////////////// 
}

export default BufferFactory; 