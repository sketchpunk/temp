import Colour from "./Colour.js";

class Uniform{
	constructor( n, type, loc, data=null ){
		this.name	= n;
		this.type	= type;
		this.loc	= loc;
		this.data	= ( !data )? null : parse_data( data, type );
	}
}

class Shader{
    name		= name;
    program		= null;
    uniforms	= new Map();
	
	//tex_slot	= 0;
	
    options		= {
        depthTest			: true,
        blend				: false,
        sampleAlphaCoverage : false,
        cullFace			: true,
    };

    constructor( name, prog ){
		this.name		= name;
		this.program	= prog;
	}

    set_depth_test( v ){ this.options.depthTest = v; return this; }
    set_blend( v ){ this.options.blend = v; return this; }
    set_alpha_coverage( v ){ this.options.sampleAlphaCoverage = v; return this; }
	set_cullface( v ){ this.options.cullFace = v; return this; }
}


class ShaderFactory{
	static POS_LOC		= 0;
	static NORM_LOC		= 1;
	static UV_LOC		= 2;
	static COL_LOC		= 3;
	static BONE_IDX_LOC	= 8;
	static BONE_WGT_LOC	= 9;

    constructor( gl ){
		this.gl		= gl;
		this.cache	= new Map();
    }

    new( name, src_vert, src_frag, uniforms=null, ubos=null ){
		// TODO Check if shader exists in cache

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Compile the shader Code, When successful, create struct to wrap the program
		let prog = this.create_shader( src_vert, src_frag, false );
		if( !prog ) return null;

		let sh = new Shader( name, prog );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		if( uniforms || ubos ){
			//--------------------------------------
			if( uniforms ){
				let i, loc, itm;
				for( i=0; i < uniforms.length; i++ ){
					itm = uniforms[ i ];
					loc = this.gl.ctx.getUniformLocation( sh.program, itm.name );
					
					if( loc )	sh.uniforms.set( new Uniform( itm.name, itm.type, loc, itm.value ) );
					else		console.error( "add_uniform : Uniform not found %s ", itm.name );
				}
			}

			//--------------------------------------
			if( ubos ){
				let idx, u;
				for( u of ubos ){
					idx = this.gl.ctx.getUniformBlockIndex( sh.program, u.name );
					if( idx > 1000 ){ console.log("Ubo not found in shader %s : %s ", name, u.name ); return this; }
					this.gl.ctx.uniformBlockBinding( sh.program, idx, u.bind_point );
				}
			}
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.cache.set( name, sh );
		return sh;
	}

	get( name ){ return this.cache.get( name ); }

	load_uniforms( sh ){
		
	}
	
	new_material( name=null, u_struct=null ){
		/*
		let k, v, mat = new Material( name, this );

		// Copy Uniforms
		for( [ k, v ] of this.uniforms ) mat.uniforms.set( k, v.value );

		// Copy Options
		for( k in this.options ) mat.options[ k ] = this.options[ k ];

		// Load in custom Uniform Data if exists
		if( u_struct ){
			let n;
			for( n in u_struct ) mat.set_uniform( n, u_struct[ n ] );
		}		

		return mat;
		*/
	}


	
	// #region BINDING
	unbind(){ this.gl.ctx.useProgram( null ); return this; }
	bind( sh ){ this.gl.ctx.useProgram( sh.prog ); return this; }
	// #endregion ////////////////////////////////////////////////////////////////////////////////////// 

    // #region COMPILE SHADER
    // Compile Vertex/Fragment Shaders then Link them as a Program
	create_shader( vert_src, frag_src, do_dalidate=true, transFeedbackVars=null, transFeedbackInterleaved=false ){
        let vert = this.compile_shader( vert_src, this.gl.ctx.VERTEX_SHADER );
        if( !vert ) return null;

        let frag = this.compile_shader( frag_src, this.gl.ctx.FRAGMENT_SHADER );
        if( !frag ){ this.gl.ctx.deleteShader( vert ); return null; }

        return this.create_shader_program( vert, frag, do_dalidate, transFeedbackVars, transFeedbackInterleaved );
    }

    //Create a shader by passing in its code and what type
    compile_shader( src, type ){
        let shader = this.gl.ctx.createShader( type );
        this.gl.ctx.shaderSource( shader, src );
        this.gl.ctx.compileShader( shader );

        //Get Error data if shader failed compiling
        if( !this.gl.ctx.getShaderParameter( shader, this.gl.ctx.COMPILE_STATUS ) ){
            console.error("Error compiling shader : " + src, this.gl.ctx.getShaderInfoLog( shader ) );
            this.gl.ctx.deleteShader( shader );
            return null;
        }

        return shader;
    }

	//Link two compiled shaders to create a program for rendering.
	create_shader_program( vert, frag, do_validate = true, transFeedbackVars = null, transFeedbackInterleaved = false ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Link shaders together
        let prog = this.gl.ctx.createProgram();
        this.gl.ctx.attachShader( prog, vert );
        this.gl.ctx.attachShader( prog, frag );

        //Force predefined locations for specific attributes. If the attibute isn't used in the shader its location will default to -1
        //ctx.bindAttribLocation(prog,ATTR_POSITION_LOC,ATTR_POSITION_NAME);
        //ctx.bindAttribLocation(prog,ATTR_NORMAL_LOC,ATTR_NORMAL_NAME);
        //ctx.bindAttribLocation(prog,ATTR_UV_LOC,ATTR_UV_NAME);

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Need to setup Transform Feedback Varying Vars before linking the program.
        if( transFeedbackVars != null ){
            this.gl.ctx.transformFeedbackVaryings(prog, transFeedbackVars,
                ((transFeedbackInterleaved)? this.gl.ctx.INTERLEAVED_ATTRIBS : this.gl.ctx.SEPARATE_ATTRIBS)
            );
        }

        this.gl.ctx.linkProgram( prog );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Check if successful
        if( !this.gl.ctx.getProgramParameter( prog, this.gl.ctx.LINK_STATUS ) ){
            console.error( "Error creating shader program.", this.gl.ctx.getProgramInfoLog( prog ) );
            this.gl.ctx.deleteProgram( prog );
            return null;
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Only do this for additional debugging.
        if( do_validate ){
            this.gl.ctx.validateProgram( prog );
            if( !this.gl.ctx.getProgramParameter( prog, this.gl.ctx.VALIDATE_STATUS ) ){
                console.error( "Error validating program", this.gl.ctx.getProgramInfoLog( prog ) );
                this.gl.ctx.deleteProgram( prog );
                return null;
            }
        }
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Can delete the shaders since the program has been made.
        this.gl.ctx.detachShader( prog, vert ); // TODO, detaching might cause issues on some browsers, Might only need to delete.
        this.gl.ctx.detachShader( prog, frag );
        this.gl.ctx.deleteShader( frag );
        this.gl.ctx.deleteShader( vert );
        return prog;
    }
    // #endregion ////////////////////////////////////////////////////////////////////////////////////// 
}

function parse_data( value, type ){
	switch( type ){
		case "rgb"	: value = new Colour( value ); break;
		case "rgba"	: value = new Colour( value ); break;
		case "sampler2D" : 
		case "samplerCube" :
			let tmp = ( value instanceof WebGLTexture )? value : Cache.get_tex( value ); 
			if(tmp == null){
				console.error( "Shader.parse_data: Texture not found", value );
				return this;
			}else value = tmp;
		break;
	}

	return ( Array.isArray( value ) && value.length == 0 )? null : value;
}

function set_uniform( u_name, u_value ){
	let itm	= this.uniforms.get( u_name );
	if( !itm ){ console.error( "set uniform not found %s in %s", u_name, this.name ); return this; }

	switch( itm.type ){
		case "float":	gl.ctx.uniform1f(	itm.loc, u_value ); break;
		case "afloat":	gl.ctx.uniform1fv(	itm.loc, u_value ); break;
		case "vec2":	gl.ctx.uniform2fv(	itm.loc, u_value ); break;
		
		case "rgb":
		case "vec3":	gl.ctx.uniform3fv(	itm.loc, u_value ); break;
		
		case "rgba":
		case "vec4":	gl.ctx.uniform4fv(	itm.loc, u_value ); break;
		
		case "int":		gl.ctx.uniform1i(	itm.loc, u_value ); break;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		case "mat4":	gl.ctx.uniformMatrix4fv(	itm.loc, false, u_value ); break;
		case "mat3":	gl.ctx.uniformMatrix3fv(	itm.loc, false, u_value ); break;
		case "mat2x4": 	gl.ctx.uniformMatrix2x4fv(	itm.loc, false, u_value ); break;
		case "mat3x4": 	gl.ctx.uniformMatrix3x4fv(	itm.loc, false, u_value ); break;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		case "sampler2D":
			//console.log( this.tex_slot, u_value._name_ );
			gl.ctx.activeTexture(	gl.ctx.TEXTURE0 + this.tex_slot );
			gl.ctx.bindTexture(		gl.ctx.TEXTURE_2D, u_value );
			gl.ctx.uniform1i(		itm.loc, this.tex_slot );
			this.tex_slot++;
			break;

		case "sampler2DArray":
			gl.ctx.activeTexture(	gl.ctx.TEXTURE0 + this.tex_slot );
			gl.ctx.bindTexture(		gl.ctx.TEXTURE_2D_ARRAY, u_value );
			gl.ctx.uniform1i(		itm.loc, this.tex_slot );
			this.tex_slot++;
			break;

		case "samplerCube":
			gl.ctx.activeTexture(	gl.ctx.TEXTURE0 + this.tex_slot );
			gl.ctx.bindTexture(		gl.ctx.TEXTURE_CUBE_MAP, u_value );
			gl.ctx.uniform1i(		itm.loc, this.tex_slot );
			this.tex_slot++;
			break;

		default: console.error("unknown uniform type %s for %s in %s", itm.type, u_name, this.name ); break;
	}
	return this;
}

function add_uniform_block( ubo_name ){
	// Check if UBO exists in the shader
	let bIdx = gl.ctx.getUniformBlockIndex( this.program, ubo_name );
	if( bIdx > 1000 ){ console.log("Ubo not found in shader %s : %s ", this.name, ubo_name ); return this; }

	let ubo = Cache.get_ubo( ubo_name );
	if( !ubo ){ console.log( "Can not find UBO in fungi cache : %s for %s", ubo_name, this.name ); return this; }

	//console.log( "prepare UBO", uboName, ubo.bindPoint, bIdx );
	gl.ctx.uniformBlockBinding( this.program, bIdx, ubo.bind_pnt );
	return this;
}

class Material{
	constructor( shader ){
		this.shader		= shader;
		this.uniforms	= new Map();

		this.options 	= {
			depthTest			: true,
			blend				: false,
			sampleAlphaCoverage : false,
			cullFace			: true,
		}
	}

	///////////////////////////////////////////////////////
	// METHODS
	///////////////////////////////////////////////////////
		// bind assigned shader
		bind(){ gl.ctx.useProgram( this.shader.program ); return this; }
		unbind(){ gl.ctx.useProgram( null ); }

		// push uniform data to the shader
		apply(){
			if( this.shader && this.uniforms.size > 0 ){
				this.shader.reset_tex_slot();

				let k, v;
				for( [ k, v ] of this.uniforms ){
					if( v != null ) this.shader.set_uniform( k, v );
				}
			}
			return this;
		}

		// modify stored uniform data
		set_uniform( u_name, u_value ){
			if( !this.uniforms.has( u_name ) ){
				console.error("Material.set_uniform: not found %s for material %s", u_name, this.name);
				return this;
			}

			let u_type = this.shader.uniforms.get( u_name ).type;
			this.uniforms.set( u_name, parse_data( u_value, u_type ) );

			return this;
		}

		opt_depth_test( b ){ this.options.depthTest = b; return this; }
		opt_blend( b ){ this.options.blend = b; return this; }
		opt_cullface( b ){ this.options.cullFace = b; return this; }

		/*
		static clone( mat, name ){
			if( typeof mat == "string" ) mat = Cache.getMaterial( mat );

			let key, itm, m = new Material( name, mat.shader );
			Cache.materials.set( name, m );
			
			for( [ key, itm ] of mat.uniforms ){
				if( Array.isArray( itm ) )	m.uniforms.set( key, itm.slice(0) );
				else 						m.uniforms.set( key, itm );
			}		

			return m;
		}
		*/
}

export default ShaderFactory;