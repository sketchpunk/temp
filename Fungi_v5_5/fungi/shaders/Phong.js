import App from "../App.js";

const vert_src = `#version 300 es
	layout( location=0 ) in vec3 a_pos;
	layout( location=1 ) in vec3 a_norm;

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

	//-------------------------

	out vec3 frag_norm;
	out vec3 frag_pos;
	flat out vec3 frag_cam;

	//-------------------------

	void main( void ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		vec4 world_pos = model.view_matrix * vec4( a_pos, 1.0 );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		frag_norm 	= mat3( transpose( inverse( model.view_matrix ) ) ) * a_norm; // Need to Rotate and Scale Normal, do on CPU
		frag_pos	= world_pos.xyz;
		frag_cam	= global.camera_pos;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		gl_Position	= global.proj_view * world_pos;
	}`;

const frag_src = `#version 300 es
	precision mediump float;

	out vec4 out_color;

	//-------------------------

	const vec3 ambient		= vec3( 0.4 );
	const vec3 light_pos 	= vec3( 6.0, 10.0, 5.0 );
	const vec3 light_color	= vec3( 1.0, 1.0, 1.0 );

	uniform vec4	base_color;
	uniform vec3	specular_color;
	uniform float	specular_strength;
	uniform float	specular_shine;

	in vec3			frag_norm;
	in vec3			frag_pos;
	flat in vec3	frag_cam;

	//-------------------------

	void main(void){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// INFO

		vec3 norm 		= normalize( frag_norm );				// Must normalized, Since it has been interpolated
		vec3 dir_light	= normalize( light_pos - frag_pos );	// Direction of light from fragment

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// DIFFUSE LIGHT

		float diff		= max( dot( norm, dir_light ), 0.0 ); 	// Angle between Frag Normal and Light Direction ( 0 to 1 )
		vec3 diffuse	= diff * light_color;					// Use the angle to scale the amount of light to use.

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// SPECULAR LIGHT

		vec3 dir_reflect	= reflect( -dir_light, norm );		// Reflection Dir of Fragment to Light
		vec3 dir_frag_cam	= normalize( frag_cam - frag_pos );	// Dir from Fragment to Camera
		float specular 		= specular_strength * pow( max( dot( dir_frag_cam, dir_reflect ), 0.0 ), specular_shine );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// OUTPUT

		out_color = vec4( base_color.rgb * ( ambient + diffuse ), 1.0 );
		out_color.rgb = mix( out_color.rgb, specular_color, specular );
	}`;

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

let sh	= App.shader.new( "Phong", vert_src, frag_src, [
	{ name:"base_color", type:"rgba", value:"#ff7f7fff" },
	{ name:"specular_color", type:"rgb", value:"#ffffff" },
	{ name:"specular_strength", type:"float", value:"1.0" },
	{ name:"specular_shine", type:"float", value:"32.0" },
], App.ubo.get_array( "Global", "Model" ) );

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
export default sh;