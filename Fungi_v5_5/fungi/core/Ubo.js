// DEFINE THE DATA
class Var{
	constructor( type, ary_len ){
		this.type			= type;		// Data Type Of Variable
		this.type_buffer	= null;		// Type Array as DataView into a shared ArrayBuffer

		this.array_count	= ary_len;	// How many Array Elements
		
		this.offset			= 0;		// Byte Offset in Array Buffer
		this.block_size		= 0;		// Block Size (16 byte alignment)
		this.data_size		= 0;		// Byte length in Shared Arraybuffer, might be padded.
	}	
}

class Ubo{
    name			= "";
    bind_point		= null;			// Need this to bind UBO to shaders later on.
	buffer_id		= null;			// GL Buffer
	array_buffer	= null;			// Byte Array
	data_view		= null;			// View to Byte Array
	vars			= new Map();	// Ubo Configuration and Type Views into Array Buffer
	byte_size		= 0;

	constructor( n, pnt ){
		this.name		= n;
		this.bind_point	= pnt;
	}

	set( name, data ){
		let v = this.vars.get( name );
		if( !v ){ console.error( "Ubo variable not found %s for %s.", name, this.name ); return this; }

		if( v.type_buffer.length == 1 ) v.type_buffer[ 0 ] = data;
		else							v.type_buffer.set( data );

		return this;
	}

	create_byte_buffer(){
		this.byte_size 		= calculate_size( this.vars );
		this.array_buffer	= new ArrayBuffer( this.byte_size );
		this.data_view 		= new DataView( this.array_buffer );

		let k, v;
		for( [k,v] of this.vars ){
			switch( v.type ){
				case "int32":
					v.type_buffer = new Int32Array( this.array_buffer, v.offset, v.data_size / 4 ); break;
					break;
				case "float": 
				case "mat2x4":
				case "mat4":
				case "mat3":
				case "vec2":
				case "vec3":
				case "vec4":
					v.type_buffer = new Float32Array( this.array_buffer, v.offset, v.data_size / 4 ); break;
					break;
			}
		}

		return this;
	}
}


class UboFactory{
	constructor( gl ){
		this.gl		= gl;
		this.cache	= new Map();
	}

	get( n ){ return this.cache.get( n ); }

	get_array(){
		let name, rtn = new Array();
		for( name of arguments ){
			rtn.push( this.cache.get( name ) );
		}
		return rtn;
	}

	update( ubo ){
		this.gl.ctx.bindBuffer(		this.gl.ctx.UNIFORM_BUFFER, ubo.buffer_id ); 
		this.gl.ctx.bufferSubData(	this.gl.ctx.UNIFORM_BUFFER, 0, ubo.data_view, 0, ubo.byte_size );
		this.gl.ctx.bindBuffer(		this.gl.ctx.UNIFORM_BUFFER, null );
		return this;
	}
	
	new( name, bind_point, config ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Setup the Object
		let i, c, ubo = new Ubo( name, bind_point );
		for( i=0; i < config.length; i++ ){
			c = config[i];
			ubo.vars.set( c.name, new Var( c.type, c.ary_len || 0 ) );
		}

		ubo.create_byte_buffer();

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Create GL Buffer
		let b_id = this.gl.ctx.createBuffer();// Create Standard Buffer

		this.gl.ctx.bindBuffer( this.gl.ctx.UNIFORM_BUFFER, b_id );						// Bind it for work
		this.gl.ctx.bufferData( this.gl.ctx.UNIFORM_BUFFER, ubo.byte_size, this.gl.ctx.DYNAMIC_DRAW );	// Allocate Space in empty buf
		this.gl.ctx.bindBuffer( this.gl.ctx.UNIFORM_BUFFER, null );						// Unbind
		this.gl.ctx.bindBufferBase( this.gl.ctx.UNIFORM_BUFFER, bind_point, b_id );		// Save Buffer to Uniform Buffer Bind point

		ubo.buffer_id = b_id;

		this.cache.set( name, ubo );
		return ubo;
	}
}

function get_size( type ){ 
	switch(type){ //[Alignment,Size]
		case "float": case "int32": case "b": return [ 4, 4 ];
		case "mat2x4":	return [ 32, 32 ]; //16*2
		case "mat4": 	return [ 64, 64 ]; //16*4
		case "mat3":	return [ 48, 48 ]; //16*3
		case "vec2":	return [ 8, 8 ];
		case "vec3":	return [ 16, 12 ]; //Special Case
		case "vec4":	return [ 16, 16 ];
		default:		return [ 0, 0 ];
	}
}

function calculate_size( m ){
	let block_space	= 16,	// Data size in Bytes, UBO using layout std140 needs to build out the struct in blocks of 16 bytes.
		offset		= 0,	// Offset in the buffer allocation
		prev_item	= null,
		size,				// Data Size of the current type
		key, itm, i;

	for( [ key, itm ] of m ){
		//.....................................
		// When dealing with arrays, Each element takes up 16 bytes regardless of type, but if the type
		// is a factor of 16, then that values times array length will work, in case of matrices
		size = get_size( itm.type );
		if( itm.array_count > 0 ){
			for( i=0; i < 2; i++ ){
				if( size[i] < 16 )	size[ i ] =  itm.array_count * 16;
				else				size[ i ] *= itm.array_count;
			}
		}

		//.....................................
		// Check if there is enough block space, if not 
		// give previous item the remainder block space
		// If the block space is full and the size is equal too or greater, dont give back to previous
		if( block_space >= size[ 0 ] ) block_space -= size[ 1 ];
		else if( block_space > 0 && prev_item && !(block_space == 16 && size[ 1 ] >= 16) ){
			prev_item.block_size	+= block_space;
			offset 					+= block_space;
			block_space				=  16 - size[ 1 ];
		}

		//.....................................
		// Save data about the item
		itm.offset		= offset;
		itm.block_size	= size[ 1 ];
		itm.data_size	= size[ 1 ];
		
		//.....................................
		// Cleanup
		offset			+= size[1];
		prev_item		= itm;

		if( block_space <= 0 ) block_space = 16; // Reset
	}
	
	// Must pad the rest of the buffer to keep things 16Byte Aligned. If not, will break on Macs
	let padding = offset % 16;
	if( padding != 0) offset += 16 - padding;

	return offset;
}

export default UboFactory;