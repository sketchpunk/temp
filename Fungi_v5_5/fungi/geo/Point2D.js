import App, { Draw, Colour }	from "../App.js";
import InterleavedFloatArray	from "../lib/InterleavedFloatArray.js";

const	INITAL_CNT	= 5;
const	AUTO_EXTEND = 10;
let 	INITIAL		= true;

//###################################################################################

function Point2DSys( ecs ){
	let ary = ecs.query_comp( "Point2D" );
	if( !ary ) return;
	
	let c;
	for( c of ary ) if( c.updated ) c.update();
}

class Point2D{
	// #region MAIN
	constructor( ini_cnt=INITAL_CNT, auto_ext=AUTO_EXTEND ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		if( INITIAL ){
			App.ecs.systems.reg( Point2DSys, 801 );
			App.shader.new( "Point2D", v_src, f_src, null, App.ubo.get_array( "Global" ) );
			INITIAL = false;
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// MAIN DATA
		this.material		= App.shader.new_material( "Point2D" );
		this.default_color	= "red";
		this.default_size	= 10;
		this.color		= new Colour();
		this.updated	= true;

		this.data = new InterleavedFloatArray([
			{ name:"pos",	size:2 },
			{ name:"color",	size:3 },
			{ name:"size",	size:1 },
		], ini_cnt, auto_ext );
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// MESH
		this.buf	= App.buffer.new_empty_array( this.data.byte_capacity, false );
		this.mesh	= App.mesh.new( "Point2D" );
		this.mesh.vao = App.vao.new([ 
			{ buffer: this.buf, interleaved: this.data.generate_config() }
		]);
	}
	// #endregion /////////////////////////////////////////////////////////////

	// #region METHODS
	get_draw_item(){ return Draw.new_draw_item( this.mesh, this.material, 0 ); }

	reset(){
		this.data.reset();
		this.mesh.element_cnt	= 0;
		this.updated			= true;
	}

	add( pos, color=this.default_color, size=this.default_size ){
		this.updated = true;
		return this.data.push( pos, this.color.set( color ).rgb, size ); // Return Index 
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
	layout(location=0) in vec2	a_pos;
	layout(location=1) in vec3	a_color;
	layout(location=2) in float	a_size;

	uniform Global{ 
		mat4 proj_view; 
		mat4 camera_matrix;
		vec3 camera_pos;
		float delta_time;
		vec2 screen_size;
		float clock;
	} global;

	out vec3 v_color;

	void main(void){
		v_color			= a_color;
		gl_PointSize 	= a_size;

		// Normalize Position based on Screen Size. Then remap to normalized screen space ( -1, 1 );
		// For Y, Flip the normalized position before remaping. Y = 0 at the top of the screen, not bottom.
		gl_Position		= vec4(
			a_pos.x / global.screen_size.x * 2.0 - 1.0,
			( 1.0 - a_pos.y / global.screen_size.y ) * 2.0 - 1.0,
			0.0,
			1.0
		);
	}`;

let f_src = `#version 300 es
	precision mediump float;
	in	vec3 v_color;
	out	vec4 out_color;
	void main(void){
		out_color = vec4( v_color, 1.0 );
	}`;

//###################################################################################
export default Point2D;