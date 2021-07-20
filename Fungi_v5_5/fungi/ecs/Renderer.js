import App from "../App.js";

class Renderer{
	constructor(){
		// Render Objects
		this.handler			= null;
		//this.frame_buffer 	= null;
		this.material			= null;
		this.shader				= null;
		this.vao				= null;

		// UBOs for Updating
		this.ubo_model			= App.ubo.get( "Model" );
		this.ubo_global			= App.ubo.get( "Global" );
		this.ubo_globalext		= App.ubo.get( "GlobalExt" );

		// GL Option states
		this.options	= {
			blend 					: { state : false,	id : App.gl.ctx.BLEND },
			sampleAlphaCoverage 	: { state : false,	id : App.gl.ctx.SAMPLE_ALPHA_TO_COVERAGE },
			depthTest				: { state : true,	id : App.gl.ctx.DEPTH_TEST },
			depthMask				: { state : true },
			cullFace				: { state : true,	id : App.gl.ctx.CULL_FACE },
			cullDir					: { state : App.gl.ctx.BACK },
			blendMode				: { state : App.gl.BLEND_ALPHA },
		}
		
		// MISC
		this.custom_loaders	= null;
	}

	add_custom_loader( loader ){
		if( !this.custom_loaders ) this.custom_loaders = new Array();
		this.custom_loaders.push( loader );
		return this;
	}

	run_loaders( e ){
		if( !this.custom_loaders ) return;
		let o;
		for( o of this.custom_loaders ) o.load( e, App );
	}

	// #region FRAMES
	begin_frame(){
		if( this.handler )	this.handler.begin_frame( this );
		else				App.gl.clear();

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
			.set( "delta_time",		App.delta_time )
			.set( "screen_size", [ App.gl.width, App.gl.height ] );

		App.ubo.update( this.ubo_global );

		this.ubo_globalext.set( "proj_matrix", App.cam_com.proj );
		App.ubo.update( this.ubo_globalext );
	}

	end_frame(){
		if( this.handler )	this.handler.end_frame( this );

		App.gl.ctx.bindVertexArray( null );
	}
	// #endregion /////////////////////////////////////////////////////////////////////////// 

	// #region LOADERS
	load_shader( s ){
		if( this.shader !== s ){
			this.shader = s;
			App.gl.ctx.useProgram( s.program );
		}
		return this;
	}

	//Load Material and its shader
	load_material( mat ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		//If material is the same, exit.
		if( this.material === mat ) return this;
		this.material = mat;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		//Is the shader for the material different
		this.load_shader( mat.shader );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		App.shader.load_uniforms( mat );	// Push any saved uniform values to shader.
		this.load_options( mat.options );	// Enabled/Disable GL Options

		return this;
	}

	load_options( aryOption ){
		let k, v, gl = App.gl;
		for( k in aryOption ){
			v = aryOption[ k ];

			if( this.options[ k ] && this.options[ k ].state != v ){
				this.options[ k ].state = v;
				switch( k ){
					case "blendMode"	: gl.blendMode( v ); break;
					case "depthMask"	: gl.ctx.depthMask( v ); break;
					case "cullDir"		: gl.ctx.cullFace( v ); break;
					default:
						gl.ctx[ (this.options[ k ].state)? "enable" : "disable" ]( this.options[k].id );
					break;
				}
			}
		}
		return this;
	}

	load_node( n ){
		this.ubo_model.set( "view_matrix", n.model_matrix );
		App.ubo.update( this.ubo_model );
		return this;
	}

	load_mesh( m ){
		if( this.vao !== m.vao ){
			this.vao = m.vao;
			App.gl.ctx.bindVertexArray( m.vao.id );
		}

		return this;
	}


	// #endregion /////////////////////////////////////////////////////////////////////////// 

	// #region DRAWING
	draw( di ){
		let m = di.mesh;
		//console.log( "Draw", di );
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		if( this.vao !== m.vao ){
			this.vao = m.vao;
			App.gl.ctx.bindVertexArray( m.vao.id );
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		if( !m.instanced ){
			if( m.element_type )
				App.gl.ctx.drawElements( di.draw_mode, m.element_cnt, m.element_type, 0 );
			else
				App.gl.ctx.drawArrays( di.draw_mode, 0, m.element_cnt );
		}else{
			if( m.element_type )
				App.gl.ctx.drawElementsInstanced( di.draw_mode, m.element_cnt, m.element_type, 0, m.instance_cnt ); 
			else
				App.gl.ctx.drawArraysInstanced( di.draw_mode, 0, m.element_cnt, m.instance_cnt );
		}

		return this;
	}

	draw_mesh( m, draw_mode ){
		if( !m.instanced ){
			if( m.element_type )	App.gl.ctx.drawElements( draw_mode, m.element_cnt, m.element_type, 0 );
			else					App.gl.ctx.drawArrays( draw_mode, 0, m.element_cnt );
		}else{
			if( m.element_type )	App.gl.ctx.drawElementsInstanced( draw_mode, m.element_cnt, m.element_type, 0, m.instance_cnt ); 
			else					App.gl.ctx.drawArraysInstanced( draw_mode, 0, m.element_cnt, m.instance_cnt );
		}

		return this;
	}
	// #endregion /////////////////////////////////////////////////////////////////////////// 
}

export default Renderer;