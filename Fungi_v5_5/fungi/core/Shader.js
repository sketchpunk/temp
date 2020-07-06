import Colour		from "./Colour.js";
import { Texture }	from "./Texture.js";

//#######################################################################################################

class Uniform{
	constructor( n, type, loc, data=null ){
		this.name	= n;
		this.type	= type;
		this.loc	= loc;
		this.data	= ( !data )? null : this.parse( data );
	}

	set( data ){ this.data = this.parse( data ); return this; }

	clone(){ 
		let u = new Uniform( this.name, this.type, this.loc );

		if( Array.isArray( this.data ) )	u.data = this.data.slice( 0 );
		else 								u.data = this.data;

		return u;
	}

	parse( value ){
		switch( this.type ){
			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			case "rgb"	: 
			case "rgba"	:
				value = new Colour( value );
			break;

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			/*
			case "sampler2D"	: 
			case "samplerCube"	:
				let tmp = ( value instanceof Texture )? value : Cache.get( value ); 
				if( tmp == null ){
					console.error( "Uniform.parse: Texture not found", value );
					return this;
				}else value = tmp;
			break;
			*/
		}
	
		return ( Array.isArray( value ) && value.length == 0 )? null : value;
	}
}

//#######################################################################################################

class Shader{
    name		= name;
    program		= null;
    uniforms	= new Map();

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

//#######################################################################################################

class ShaderFactory{
	POS_LOC			= 0;
	NORM_LOC		= 1;
	UV_LOC			= 2;
	COLOR_LOC		= 3;
	SKIN_IDX_LOC	= 8;
	SKIN_WGT_LOC	= 9;

    constructor( gl, tex ){
		this.gl		= gl;
		this.cache	= new Map();

		this.tex 	= tex; // TODO, may need to remove this if never using texture cache.
    }

	// #region METHODS
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
					
					if( loc )	sh.uniforms.set( itm.name, new Uniform( itm.name, itm.type, loc, itm.value ) );
					else		console.error( "add_uniform : Uniform not found %s ", itm.name );
				}
			}

			//--------------------------------------
			if( ubos ){
				let idx, u;
				for( u of ubos ){
					idx = this.gl.ctx.getUniformBlockIndex( sh.program, u.name );
					if( idx > 1000 ){ console.log( "Ubo not found in shader %s : %s ", name, u.name ); continue; }
					this.gl.ctx.uniformBlockBinding( sh.program, idx, u.bind_point );

					//console.log( "BIND UBO %s to SHADER %s on Index %s to Bind Point %s ", u.name, sh.name, idx, u.bind_point );
				}
			}
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.cache.set( name, sh );
		return sh;
	}

	get( name ){ return this.cache.get( name ); }

	load_uniforms( o ){
		let name, itm,
			map			= o.uniforms,
			gl			= this.gl,
			tex_slot	= 0;
			
		for( [ name, itm ] of map ){
			//console.log( itm );
			switch( itm.type ){
				case "float":	gl.ctx.uniform1f(	itm.loc, itm.data ); break;
				case "afloat":	gl.ctx.uniform1fv(	itm.loc, itm.data ); break;
				case "vec2":	gl.ctx.uniform2fv(	itm.loc, itm.data ); break;
				
				case "rgb":		gl.ctx.uniform3fv(	itm.loc, itm.data.rgb ); break;
				case "vec3":	gl.ctx.uniform3fv(	itm.loc, itm.data ); break;
				
				case "rgba":	gl.ctx.uniform4fv(	itm.loc, itm.data.rgba ); break;
				case "vec4":	gl.ctx.uniform4fv(	itm.loc, itm.data ); break;
				
				case "int":		gl.ctx.uniform1i(	itm.loc, itm.data ); break;
		
				//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
				case "mat4":	gl.ctx.uniformMatrix4fv(	itm.loc, false, itm.data ); break;
				case "mat3":	gl.ctx.uniformMatrix3fv(	itm.loc, false, itm.data ); break;
				case "mat2x4": 	gl.ctx.uniformMatrix2x4fv(	itm.loc, false, itm.data ); break;
				case "mat3x4": 	gl.ctx.uniformMatrix3x4fv(	itm.loc, false, itm.data ); break;
		
				//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
				case "sampler2D":
					//if( !(itm.data instanceof Texture) ){
					//	let tmp = this.tex.get( itm.data );
					//	if( !tmp )	console.error( "Shader.load_uniforms: Texture not found", itm.data );
					//	else		itm.data = tmp;
					//}
					gl.ctx.activeTexture(	gl.ctx.TEXTURE0 + tex_slot );
					gl.ctx.bindTexture(		gl.ctx.TEXTURE_2D, itm.data.id );
					gl.ctx.uniform1i(		itm.loc, tex_slot );
					tex_slot++;
					break;
		
				case "sampler2DArray":
					gl.ctx.activeTexture(	gl.ctx.TEXTURE0 + tex_slot );
					gl.ctx.bindTexture(		gl.ctx.TEXTURE_2D_ARRAY, itm.data );
					gl.ctx.uniform1i(		itm.loc, tex_slot );
					tex_slot++;
					break;
		
				case "samplerCube":
					gl.ctx.activeTexture(	gl.ctx.TEXTURE0 + tex_slot );
					gl.ctx.bindTexture(		gl.ctx.TEXTURE_CUBE_MAP, itm.data );
					gl.ctx.uniform1i(		itm.loc, tex_slot );
					tex_slot++;
					break;
		
				default: console.error("unknown uniform type %s for %s in %s", itm.type, name, o.name ); break;
			}

		}
		return this;
	}
	
	new_material( name=null, uniforms=null, options=null ){
		let sh = this.cache.get( name );
		if( !sh ){ console.error( "No Shader by the name %s.", name ); return null; }
		
		let k, v, mat = new Material( sh );

		// Copy Uniforms
		for( [ k, v ] of sh.uniforms ) mat.uniforms.set( k, v.clone() );

		// Copy Options
		for( k in sh.options ) mat.options[ k ] = sh.options[ k ];

		// Load in custom Uniform Data if exists
		if( uniforms ){
			let n;
			for( n in uniforms ) mat.set( n, uniforms[ n ] );
		}

		// Load in custom Option Data if exists
		if( options ){
			let o;
			for( o in options ) mat.options[ o ] = options[ o ];
		}	

		return mat;
	}
	// #endregion ////////////////////////////////////////////////////////////////////////////////////// 

	// #region BINDING
	unbind(){ this.gl.ctx.useProgram( null ); return this; }
	bind( sh ){ this.gl.ctx.useProgram( sh.program ); return this; }
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

//#######################################################################################################

class Material{
	constructor( shader ){
		this.shader		= shader;
		this.uniforms	= new Map();
		this.options 	= {
			depthTest			: true,
			blend				: false,
			sampleAlphaCoverage : false,
			cullFace			: true,
		};
	}

	set( u_name, data ){
		let u = this.uniforms.get( u_name );
		if( !u ){ console.log("Uniform: %s not found in material %s", u_name, this.shader.name ); return this; }

		u.set( data );
		return this;
	}

	set_depth_test( v ){ this.options.depthTest = v; return this; }
	set_blend( v ){ this.options.blend = v; return this; }
	set_alpha_coverage( v ){ this.options.sampleAlphaCoverage = v; return this; }
	set_cullface( v ){ this.options.cullFace = v; return this; }
}

export default ShaderFactory;