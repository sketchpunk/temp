import App from "../App.js";

const VERT_SRC = `#version 300 es
	layout(location=0) in vec3 a_pos;
	layout(location=2) in vec2 a_uv;

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

	out vec2 frag_uv;

	void main(void){
		vec4 world_pos	= model.view_matrix * vec4( a_pos, 1.0 );
		frag_uv			= a_uv;
		gl_Position		= global.proj_view * world_pos;
	}`;

const FRAG_SRC = `#version 300 es
	precision mediump float;
	
	uniform vec3 color_a;
	uniform vec3 color_b;
	uniform float border;
	
	in vec2 frag_uv;
	out vec4 out_color;

	void main(void){
		/*
		float x = 
			1.0 - step( border, frag_uv.x ) + 
			step( 1.0 - border, frag_uv.x ) +
			1.0 - step( border, frag_uv.y ) + 
			step( 1.0 - border, frag_uv.y )
		;
		*/
		float s		= 0.01;
		float edge	= 1.0 - border;
		float x = 
			1.0 - smoothstep( border-s, border+s, frag_uv.x ) + 
			smoothstep( edge-s, edge+s, frag_uv.x ) +
			1.0 - smoothstep( border-s, border+s, frag_uv.y ) + 
			smoothstep( edge-s, edge+s, frag_uv.y )
		;

		out_color = vec4( mix( color_a, color_b, x ), 1.0 );

		//if( frag_uv.x < 0.01 ) out_color = vec4( vec3(0.0), 1.0 );
		//else out_color = vec4( color, 1.0 );
	}`;

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

let sh	= App.shader.new( "UvBorder", VERT_SRC, FRAG_SRC, [
	{ name:"color_a", type:"rgb", value:"black" },
	{ name:"color_b", type:"rgb", value:"white" },
	{ name:"border", type:"float", value:0.03 },
	], App.ubo.get_array( "Global","Model" )
);

export default sh;