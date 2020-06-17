import App from "../App.js";

class Renderer{
	constructor(){
		//Render Objects
		this.frame_buffer 		= null;
		this.material			= null;
		this.shader				= null;
		this.vao				= null;

		//UBOs for Updating
		this.ubo_model			= App.ubo.get( "Model" );
		this.ubo_global			= App.ubo.get( "Global" );

		//GL Option states
		this.options	= {
			blend 					: { state : false,	id : App.gl.ctx.BLEND },
			sampleAlphaCoverage 	: { state : false,	id : App.gl.ctx.SAMPLE_ALPHA_TO_COVERAGE },
			depthTest				: { state : true,	id : App.gl.ctx.DEPTH_TEST },
			depthMask				: { state : true },
			cullFace				: { state : true,	id : App.gl.ctx.CULL_FACE },
			cullDir					: { state : App.gl.ctx.BACK },
			blendMode				: { state : App.gl.BLEND_ALPHA },
		}		
	}

	// #region FRAMES
	begin_frame(){
		App.gl.clear();

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Reset State checks incase things where used before a frame render.
		this.material	= null;
		this.shader		= null;
		this.vao		= null;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Update Global UBO
		this.ubo_global
			.set( "proj_view",		App.cam_com.proj_view )
			.set( "camera_matrix",	App.cam_com.view )
			.set( "camera_pos",		App.cam_node.world.pos )
			.set( "clock",			App.since_start )
			.set( "delta_time",		App.delta_time );
		App.ubo.update( this.ubo_global );
	}

	end_frame(){
		App.gl.ctx.bindVertexArray( null );
	}
	// #endregion /////////////////////////////////////////////////////////////////////////// 

	// #region LOADERS
	load_shader( s ){
		if( this.shader !== s ){
			this.shader = s;
			gl.ctx.useProgram( s.program );
			//console.log("LOAD SHADER", s );
		}
		return this;
	}

	//Load Material and its shader
	load_material( mat ){
		//...............................
		//If material is the same, exit.
		if( this.material === mat ) return;
		this.material = mat;

		//...............................
		//Is the shader for the material different
		this.load_shader( mat.shader );

		//...............................
		mat.apply();						//Push any saved uniform values to shader.
		this.load_options( mat.options );	//Enabled/Disable GL Options

		return this;
	}

	load_options( aryOption ){
		var k, v;
		for( k in aryOption ){
			v = aryOption[k];

			if(this.options[k] && this.options[k].state != v){
				this.options[k].state = v;

				switch( k ){
					case "blendMode"	: gl.blendMode( v ); break;
					case "depthMask"	: gl.ctx.depthMask( v ); break;
					case "cullDir"		: gl.ctx.cullFace( v ); break;
					default:
						gl.ctx[ (this.options[k].state)? "enable" : "disable" ]( this.options[k].id );
					break;
				}
				
			}
		}

		return this;
	}

	load_entity( e ){
		/*
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.ubo_model
			.var( "view_matrix", e.Node.model_matrix )
			.update();
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		if( e.Armature && this.ubo_armature ){
			this.ubo_armature
				.set_var( "bones", e.Armature.fbuf_offset )
				.update();
		App.ubo.update( this.ubo_global );
		}
		*/
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		return this;
	}
	// #endregion /////////////////////////////////////////////////////////////////////////// 

	// #region DRAWING
	draw( d ){
		let m = d.mesh;
		//console.log( "Draw", m, d.mode );
		//...............................
		if(this.vao !== m.vao){
			this.vao = m.vao;
			gl.ctx.bindVertexArray( m.vao.ref );
		}

		//...............................
		if( !m.is_instanced ){
			if( m.buf.idx ) gl.ctx.drawElements( d.mode, m.elm_cnt, m.elm_type, 0 );
			else		 	gl.ctx.drawArrays( d.mode, 0, m.elm_cnt );
		}else{
			if( m.buf.idx )	gl.ctx.drawElementsInstanced( d.mode, m.elm_cnt, m.elm_type, 0, m.instance_cnt ); 
			else			gl.ctx.drawArraysInstanced( d.mode, 0, m.elm_cnt, m.instance_cnt );
		}

		return this;
	}
	// #endregion /////////////////////////////////////////////////////////////////////////// 
}

export default Renderer;