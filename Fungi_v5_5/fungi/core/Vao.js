/*
let buf = App.Buffer.new_array( new Float32Array([0,0,0]) );
let vao = App.Vao.new([
	{ name:"a", buffer:buf, attrib_loc:App.shader.POS_LOC, instanced:false, },
	{ name:"a", buffer:buf, instanced:false, interleaved: [
		{ attrib_loc:0, size:3, stride_len:4 * 4, offset:0 * 4 },
		{ attrib_loc:1, size:1, stride_len:4 * 4, offset:3 * 4 },
	]},
]);
*/

class Vao{ constructor( id ){ this.id = id; } }

class VaoFactory{
	constructor( gl ){ this.gl = gl; }

	// #region CREATION
	new( config ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Create Vao
		let itm, buf, vao = new Vao( this.gl.ctx.createVertexArray() );
		this.gl.ctx.bindVertexArray( vao.id );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Bind Buffer to VAO
		for( itm of config ){
			buf = itm.buffer;
			this.gl.ctx.bindBuffer( buf.type, buf.id );
			//console.log( "vao", itm );

			//----------------------------------------------
			if( !itm.interleaved ){
				// Only Array Buffers have Attribute Loc.
				if( itm.attrib_loc !== undefined && itm.attrib_loc !== null ){
					this.gl.ctx.enableVertexAttribArray( itm.attrib_loc );
					this.gl.ctx.vertexAttribPointer( itm.attrib_loc, buf.component_len, this.gl.ctx.FLOAT, false, buf.stride_len, buf.offset );
					if( itm.instanced ) this.gl.ctx.vertexAttribDivisor( itm.attrib_loc, 1 );
				}
			//----------------------------------------------
			}else{
				let spec;
				for( spec of itm.interleaved ){
					this.gl.ctx.enableVertexAttribArray( spec.attrib_loc );
					this.gl.ctx.vertexAttribPointer( spec.attrib_loc, spec.size, this.gl.ctx.FLOAT, false, spec.stride_len, spec.offset );
					if( itm.instanced ) this.gl.ctx.vertexAttribDivisor( spec.attrib_loc, 1 );
				}
			}
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Close VAO in the proper order, VAO first then Buffers
		this.gl.ctx.bindVertexArray( null );
		this.gl.ctx.bindBuffer( 34962, null ); // Array Buffer
		this.gl.ctx.bindBuffer( 34963, null ); // Element Array Buffer

		return vao;
	}
	// #endregion ////////////////////////////////////////////////////////////////////////////////////// 

	// #region BINDING
	bind( v ){ this.gl.ctx.bindVertexArray( v.id ); return this; }
	unbind(){ this.gl.ctx.bindVertexArray( null ); return this; }
	unbind_all(){
		this.gl.ctx.bindVertexArray( null );
		this.gl.ctx.bindBuffer( 34962, null ); // Array Buffer
		this.gl.ctx.bindBuffer( 34963, null ); // Element Array Buffer
		return this;
	}
	// #endregion ////////////////////////////////////////////////////////////////////////////////////// 
}

/*
		add_partition( attrib_loc, comp_len=3, stride=0, offset=0, is_instance=false ){
			gl.ctx.enableVertexAttribArray( attrib_loc );
			gl.ctx.vertexAttribPointer( attrib_loc, comp_len, gl.ctx.FLOAT, false, stride, offset );

			if( is_instance ) gl.ctx.vertexAttribDivisor( attrib_loc, 1 );
			return this;
		}

		{
			comp_len 	: How Many Floats Make the Stride
			stride_len	: IN_BYTES
			partition	: [
				{ name, comp_len:x, offset:IN_BYTES }
			],
		}
		add_interleaved( buf, attrib_loc_ary, is_instance=false ){
			gl.ctx.bindBuffer( buf.type, buf.ref );

			let i_info = buf.interleaved,
				attr_loc, i, p;

			for( i=0; i < i_info.partition.length; i++ ){
				attr_loc 	= attrib_loc_ary[ i ];
				p			= i_info.partition[ i ];
				gl.ctx.enableVertexAttribArray( attr_loc );
				gl.ctx.vertexAttribPointer( attr_loc, p.comp_len, gl.ctx.FLOAT, false, i_info.stride_len, p.offset );

				if( is_instance ) gl.ctx.vertexAttribDivisor( attr_loc, 1 );
			}

			return this;
		}
*/

export default VaoFactory;