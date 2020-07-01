/*
let flat_ary = new InterleavedFloatArray([
	{ name:"pos",	size:3 },
	{ name:"size",	size:1 },
], 2 );
*/

class InterleavedFloatArray{
	buffer 		= null;			// Array Object that will hold the raw aata.
	capacity 	= 0;			// Total Possible Elements (Note Bytes)
	len			= 0;			// Count of Elements ( Total set of stride components )
	stride_len 	= 0; 			// Stride Length in Float Count, not Bytes
	var_config	= new Array();	
	var_map		= {};			// Definition of Interleaved Data 
	auto_expand	= 0;
	
	constructor( config, init_size=1, auto_expend=0, use_all=false ){
		this.auto_expand = auto_expend;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let c, o;
		for( c of config ){
			this.var_map[ c.name ] = this.var_config.length;
			this.var_config.push({
				name	: c.name,
				size	: c.size,
				offset	: this.stride_len,
			});

			this.stride_len += c.size;
		}
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.expand_by( init_size );

		if( use_all ) this.len = this.capacity;
	}

	get byte_capacity(){ return this.buffer.byteLength; }	// Get the Capacity Length in Bytes
	get byte_stride_len(){ return this.stride_len * 4; }

	generate_config( attrib_loc=0 ){
		let i, v, 
			rtn		= new Array( this.var_config.length ),
			bstride	= this.byte_stride_len;

		for( i=0; i < this.var_config.length; i++ ){
			v			= this.var_config[ i ];
			rtn[ i ]	= {
				attrib_loc	: attrib_loc + i,
				size 		: v.size,
				stride_len	: bstride,
				offset		: v.offset * 4,
			};
		}
		return rtn;
	}

	reset(){ this.len = 0; return this; }

	expand_by( size, use_all=false ){
		let capacity	= this.capacity + size,
			fb			= new Float32Array( capacity * this.stride_len );

		if( this.buffer ) fb.set( this.buffer );

		this.capacity	= capacity;
		this.buffer		= fb;

		if( use_all ) this.len = this.capacity;
		return this;
	}

	push(){
		// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// VALIDATION

		// Must have the same amount of vars pass in.
		if( arguments.length != this.var_config.length ){ 
			console.error( "push argument length mismatch for var length" ); 
			return null;
		}

		// Check if there is enough space to save data
		if( this.len >= this.capacity ){ 
			if( this.auto_expand == 0 ){
				console.error( "InterleavedFloatArray is at capacity" );
				return null;
			}else this.expand_by( this.auto_expand );
		}

		// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let i, v, idx = this.len, offset = idx * this.stride_len;

		for( i=0; i < arguments.length; i++ ){
			//--------------------------------
			// Validate Data Sizes
			v = this.var_config[ i ];
			if( v.size > 1 && arguments[ i ].length != v.size ){ 
				console.error( "Variable len mismatch for ", v.name ); 
				return null;
			}

			//--------------------------------
			// Store Data
			if( v.size == 1 )	this.buffer[ offset + v.offset ] = arguments[ i ];
			else				this.buffer.set( arguments[ i ], offset + v.offset );
		}

		this.len++;
		return idx;
	}

	set( idx, ...args ){
		let i, v;
		idx *= this.stride_len;

		for( i=0; i < args.length; i++ ){
			v = this.var_config[ i ];

			if( v.len == 1 ) 	this.buffer[ idx + v.offset ] = args[ i ];
			else				this.buffer.set( args[ i ], idx + v.offset );
		}

		return this;
	}

	/*
	set_var( idx, v_name, data ){
		let vr = this.vars[ this.map[ v_name ] ];

		idx = (idx * this.stride_len) + vr.offset;

		if( vr.len == 1 )	this.buffer[ idx ] = data;
		else				this.buffer.set( data, idx );

		//for( let i=0; i < vr.len; i++ ) this.buffer[ idx + i ] = data[ i ];
		//}

		return this;
	}
	*/
	

	
}

export default InterleavedFloatArray