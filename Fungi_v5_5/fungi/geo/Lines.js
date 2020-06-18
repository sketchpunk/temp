import App, { Vec3, Draw, Colour }	from "../App.js";
import InterleavedFloatArray		from "../lib/InterleavedFloatArray.js";

const	INITAL_CNT	= 2;
const	AUTO_EXTEND = 10;
const	DASH_SEG	= 1 / 0.07;
const	DASH_DIV 	= 0.4;
let		INITIAL		= true;

//###################################################################################

function LinesSys( ecs ){
	let c, ary = ecs.query_comp( "Lines" );
	if( !ary ) return;
	for( c of ary ) if( c.updated ) c.update();
}

class Lines{
	// #region MAIN
	constructor( ini_cnt=INITAL_CNT, auto_ext=AUTO_EXTEND ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		if( INITIAL ){
			App.ecs.systems.reg( LinesSys, 801 );
			App.shader.new( "LineDash", v_src, f_src, [
				{ name:"dash_seg", type:"float", value:DASH_SEG },
				{ name:"dash_div", type:"float", value:DASH_DIV }
			], App.ubo.get_array( "Global", "Model" ) ).set_blend( true );

			INITIAL = false;
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// MAIN DATA
		this.material		= App.shader.new_material( "LineDash" );
		this.default_color	= "red";
		this.color			= new Colour();
		this.updated		= true;

		this.data = new InterleavedFloatArray([
			{ name:"pos",	size:3 },
			{ name:"color",	size:3 },
			{ name:"len",	size:1 },
		], ini_cnt, auto_ext );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// MESH
		this.buf		= App.buffer.new_empty_array( this.data.byte_capacity, false );
		this.mesh		= App.mesh.new( "Lines" );
		this.mesh.vao 	= App.vao.new([ 
			{ buffer: this.buf, interleaved: this.data.generate_config() }
		]);
	}
	// #endregion /////////////////////////////////////////////////////////////

	// #region METHODS
	get_draw_item(){ return Draw.new_draw_item( this.mesh, this.material, 1 ); }

	reset(){
		this.data.reset();
		this.mesh.element_cnt	= 0;
		this.updated			= true;
	}

	add( a, b, col_a=this.default_color, col_b=null, is_dash=false ){
		let alen = -1, blen = -1;

		// Calc Line Length if its dashed
		if( is_dash ){
			alen = 0;
			blen = Vec3.len( a, b );
		}	

		// Return Point Index for Line
		this.updated = true;
		return [ 
			this.data.push( a, this.color.set( col_a ).rgb, alen ),
			this.data.push( b, this.color.set( col_b || col_a ).rgb, blen ),
		];
	}
	// #endregion /////////////////////////////////////////////////////////////

	// #region HELPERS
	update(){
		if( !this.updated ) return this;
		this.mesh.element_cnt	= this.data.len;
		this.updated			= false;

		// Update the GPU buffers with the new data.
		if( this.mesh.element_cnt > 0 ){
			App.buffer.update_data( this.buf, this.data.buffer );
		}
		return this;
	}
	// #endregion /////////////////////////////////////////////////////////////
}

//###################################################################################

let v_src = `#version 300 es
	layout(location=0) in vec3 a_pos;
	layout(location=1) in vec3 a_color;
	layout(location=2) in float a_len;

	uniform Global{ 
		mat4 proj_view; 
		mat4 camera_matrix;
		vec3 camera_pos;
		float delta_time;
		vec2 screen_size;
		float clock;
	} global;
	uniform Model{ mat4 view_matrix; } model;

	out vec3 v_color;
	out float v_len;

	void main(void){
		v_len 			= a_len;
		v_color			= a_color;
		vec4 world_pos 	= model.view_matrix * vec4( a_pos.xyz, 1.0 );
		gl_Position 	= global.proj_view * world_pos;
	}`;

let f_src = `#version 300 es
	precision mediump float;

	in vec3 v_color;
	in float v_len;

	uniform float dash_seg;
	uniform float dash_div;

	out vec4 out_color;

	void main(void){
		float alpha = 1.0;
		if( v_len >= 0.0 ) alpha = step( dash_div, fract( v_len * dash_seg ) );
		out_color = vec4( v_color, alpha );
	}`;

//###################################################################################
export default Lines;