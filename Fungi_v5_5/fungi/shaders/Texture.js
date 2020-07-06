import App from "../App.js";

const vert_src = `#version 300 es
	layout( location=0 ) in vec3 a_pos;
	layout( location=2 ) in vec2 a_uv;

	//-------------------------

	uniform Global{ 
		mat4 proj_view; 
		mat4 camera_matrix;
		vec3 camera_pos;
		float delta_time;
		vec2 screen_size;
		float clock;
	} global;

	uniform Model{ 
		mat4 view_matrix;
	} model;

	uniform vec2 scale;

	//-------------------------

	out vec2 frag_uv;

	//-------------------------

	void main( void ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		vec4 world_pos = model.view_matrix * vec4( a_pos, 1.0 );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		frag_uv		= a_uv * scale;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		gl_Position	= global.proj_view * world_pos;
	}`;

const frag_src = `#version 300 es
	precision mediump float;

	out vec4 out_color;

	//-------------------------
	
	uniform sampler2D base_tex;
	
	in vec2 frag_uv;

	//-------------------------

	void main(void){
		out_color = texture( base_tex, frag_uv );
	}`;

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

let sh	= App.shader.new( "Texture", vert_src, frag_src, [
	{ name:"base_tex", type:"sampler2D", value:"null" },
	{ name:"scale", type:"vec2", value:new Float32Array([1,1]), },
], App.ubo.get_array( "Global", "Model" ) );

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
export default sh;