const USHORT	= 5123;
const UINT		= 5125;

class Mesh{
	name			= name;
	vao 			= null;
	element_cnt		= 0;
	element_type	= 0;
	instance_cnt	= 0;
	instanced		= false;
	buffers			= new Map();

	constructor( name ){
		this.name = name;
	}
}

/*
this.mesh 	= App.mesh.from_buffer_config([
	{ name: "indices", buffer: buf_idx },
	{ name: "vertices", buffer: verts, attrib_loc:0, size:3, stride_len:0, offset:0 },
	{ name: "quad", buffer: buf_vert, interleaved: [
		{ attrib_loc:0, size:3, stride_len:8 * 4, offset:0 * 4 },
		{ attrib_loc:1, size:3, stride_len:8 * 4, offset:3 * 4 },
		{ attrib_loc:2, size:2, stride_len:8 * 4, offset:6 * 4 },
	]},
	{ name: "inst", buffer: this.buf, instanced:true, interleaved: this.data.generate_config( 6, true ) },
], "PointShapes", 6 );

let config	= [
	// Static Mesh
	{ name:"indices",	data:geo.idx,	size:1, is_index:true, },
	{ name:"vertices",	data:geo.vert,	size:4, attrib_loc:App.shader.POS_LOC, },
	{ name:"color",		data:geo.color,	size:3, attrib_loc:App.shader.COLOR_LOC, },

	// Mesh Instances
	{ name:"rot",	data:bv.rot_buffer,	size:4, attrib_loc:10, is_static:false,	instanced:true, },
	{ name:"pos",	data:bv.pos_buffer,	size:3, attrib_loc:11, is_static:false,	instanced:true, },
	{ name:"scl",	data:bv.scl_buffer,	size:3, attrib_loc:12, is_static:false,	instanced:true, },
	{ name:"len",	data:len_buf,		size:1, attrib_loc:13, is_static:true,	instanced:true, },
];
*/

class MeshFactory{
	PNT			= 0;
	LINE		= 1;
	LINE_LOOP	= 2;
	LINE_STRIP	= 3;
	TRI			= 4;
	TRI_STRIP	= 5;

	constructor( gl, vao, buf, shader ){
		this.shader = shader;
		this.buffer	= buf;
		this.vao	= vao;
		this.gl		= gl;
	}

	new( name ){ return new Mesh( name ); }

	draw( m, draw_mode = 0, do_bind=true ){
		if( do_bind ) this.gl.ctx.bindVertexArray( m.vao.id );

		if( m.element_cnt != 0 ){
			if( m.element_type !== 0 )	this.gl.ctx.drawElements( draw_mode, m.element_cnt, m.element_type, 0 );
			else						this.gl.ctx.drawArrays( draw_mode, 0, m.element_cnt );
		}

		if( do_bind ) this.gl.ctx.bindVertexArray( null );
		return this;
	}

	from_data( name, vert, vert_comp_len=3, idx=null, norm=null, uv=null, color=null, is_rgba=false, b_idx=null, b_wgt=null, bone_limit=4 ){
		let mesh	= new Mesh( name ),
			buf 	= this.buffer.new_array( vert, vert_comp_len, true, true ),
			config	= [
				{ buffer: buf, attrib_loc: this.shader.POS_LOC },
			];

		mesh.buffers.set( "vertices", buf );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		if( idx ){
			buf = this.buffer.new_element( idx, true, true );
			mesh.buffers.set( "indices", buf );
			config.push({ buffer: buf });

			if( idx instanceof Uint16Array ) 		mesh.element_type = USHORT;
			else if( idx instanceof Uint32Array ) 	mesh.element_type = UINT;
		}

		if( norm ){
			buf = this.buffer.new_array( norm, 3, true, true );
			mesh.buffers.set( "normal", buf );
			config.push( { buffer: buf, attrib_loc: this.shader.NORM_LOC } );
		}

		if( uv ){
			buf = this.buffer.new_array( uv, 2, true, true );
			mesh.buffers.set( "uv", buf );
			config.push( { buffer: buf, attrib_loc: this.shader.UV_LOC } );
		}

		if( color ){
			buf = this.buffer.new_array( color, (is_rgba)?4:3, true, true );
			mesh.buffers.set( "color", buf );
			config.push( { buffer: buf, attrib_loc: this.shader.COLOR_LOC } );
		}		

		if( b_idx && b_wgt ){
			buf = this.buffer.new_array( b_idx, bone_limit, true, true );
			mesh.buffers.set( "skin_idx", buf );
			config.push( { buffer: buf, attrib_loc: this.shader.SKIN_IDX_LOC } );

			buf = this.buffer.new_array( b_wgt, bone_limit, true, true );
			mesh.buffers.set( "skin_wgt", buf );
			config.push( { buffer: buf, attrib_loc: this.shader.SKIN_WGT_LOC } );
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		mesh.vao			= this.vao.new( config );
		mesh.element_cnt	= ( idx )? idx.length : vert.length / vert_comp_len;
		return mesh;
	}

	from_buffer_config( config, name, element_cnt=0, instance_cnt=0 ){
		let i, m = new Mesh( name );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Basic Configuration
		for( i of config ){
			m.buffers.set( i.name, i.buffer );			// Save Buffer to Mesh
			if( i.instanced ) m.instanced = true;		// Is there instanced Data being used?

			if( i.buffer.type == this.buffer.ELEMENT )	// What Data Type is the Element Buffer
				m.element_type = i.buffer.data_type;
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Final Configuration
		m.element_cnt	= element_cnt;
		m.instance_cnt	= instance_cnt;
		m.vao 			= this.vao.new( config );

		return m;
	}

	from_bin( name, json, bin, load_skin=false ){
		let mesh	= new Mesh( name ),
			dv		= ( bin instanceof ArrayBuffer )? new DataView( bin ) : bin,
			config	= [],
			buf, o;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Index Buffer
		if( json.indices ){
			o = json.indices;
			switch( o.data_type ){ // Indices can be imported as different Int types.
				case "uint16": mesh.element_type = USHORT; break;
				case "uint32": mesh.element_type = INT; break;
				default: console.error("Unknown Array Type when Adding Indices", o.data_type ); return null;
			}

			buf	= this.buffer.bin_element( dv, o.byte_offset, o.byte_size, o.component_len, true, false );
			buf.data_type = mesh.element_type;
			mesh.buffers.set( "indices", buf );
			config.push( { buffer: buf, } );
		}
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Array Buffers
		o	= json.vertices;
		buf	= this.buffer.bin_array( dv, o.byte_offset, o.byte_size, o.component_len, true, false );
		mesh.buffers.set( "vertices", buf );
		config.push( { buffer: buf, attrib_loc: this.shader.POS_LOC } );

		if( json.normal ){
			o	= json.normal;
			buf	= this.buffer.bin_array( dv, o.byte_offset, o.byte_size, o.component_len, true, false );
			mesh.buffers.set( "normal", buf );
			config.push( { buffer: buf, attrib_loc: this.shader.NORM_LOC } );
		}

		if( json.uv ){
			o	= json.uv;
			buf	= this.buffer.bin_array( dv, o.byte_offset, o.byte_size, o.component_len, true, false );
			mesh.buffers.set( "uv", buf );
			config.push( { buffer: buf, attrib_loc: this.shader.UV_LOC } );
		}
	
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// BONE INDICES AND WEIGHTS
		if( load_skin && json.joints && json.weights ){
			// JOINT INDICES
			// Can make this work BUT need to parse joints out of BIN as a Uint16 array, then
			// convert it to a Float32Array. This is a work around since there doesn't 
			// seem to be a way to use Uint16 as an ARRAY buffer.
			// elmCount * compLen = Total Uints ( not total bytes )
			
			o = json.joints;
			let data = new Float32Array(
				new Uint16Array( bin, o.byte_offset, o.element_cnt * o.component_len )
			);
			buf = this.buffer.new_array( data, o.component_len, true, false );
			mesh.buffers.set( "skin_idx", buf );
			config.push( { buffer: buf, attrib_loc: this.shader.SKIN_IDX_LOC } );

			o = json.weights;
			buf	= this.buffer.bin_array( dv, o.byte_offset, o.byte_size, o.component_len, true, false );
			mesh.buffers.set( "skin_wgt", buf );
			config.push( { buffer: buf, attrib_loc: this.shader.SKIN_WGT_LOC } );
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		mesh.vao			= this.vao.new( config );
		mesh.element_cnt	= ( json.indices )? json.indices.element_cnt : json.vertices.element_cnt;
		return mesh;
	}

	from_data_config( config, name, element_cnt, instance_cnt=0 ){
		let i, buf, mesh = new Mesh( name );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Generate Buffers
		for( i of config ){
			if( i.is_index ){
				buf = this.buffer.new_element( i.data, i.is_static ?? true );

				if( i.data instanceof Uint16Array ) 		mesh.element_type = USHORT;
				else if( i.data instanceof Uint32Array ) 	mesh.element_type = UINT;
			}else{
				buf = this.buffer.new_array( i.data, i.size, i.is_static ?? true );
			}

			if( i.instanced )	mesh.instanced = true;

			mesh.buffers.set( i.name, buf );	// Save Buffer to Mesh
			i.buffer = buf;						// Save Buffer to Config for VAO Generator
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Final Configurations
		mesh.vao			= this.vao.new( config );
		mesh.element_cnt	= element_cnt;
		mesh.instance_cnt	= instance_cnt;

		return mesh;
	}
}

export default MeshFactory;