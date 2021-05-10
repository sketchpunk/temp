import App from "../App.js";

const VERT_SRC = `#version 300 es
	layout(location=0) in vec3 a_pos;

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

	void main(void){
		gl_PointSize = 10.0;
		//gl_Position = projMatrix * viewMatrix * vec4( a_pos, 1.0 );

		vec4 world_pos = model.view_matrix * vec4( a_pos, 1.0 );

		gl_Position = global.proj_view * world_pos;
		//gl_Position = global.proj_view * vec4( a_pos, 1.0 );
		//gl_Position = model.view_matrix * vec4( a_pos, 1.0 );
	}`;

const FRAG_SRC = `#version 300 es
	precision mediump float;
	uniform vec4 color;
	out vec4 out_color;
	void main(void){ out_color = color; }`;

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

let sh	= App.shader.new( "BaseColor", VERT_SRC, FRAG_SRC, [
	{ name:"color", type:"rgba", value:"green" }
	], App.ubo.get_array( "Global","Model" )
);

export default sh;