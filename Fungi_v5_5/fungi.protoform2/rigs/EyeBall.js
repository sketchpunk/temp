import App			from "../../fungi/App.js";
import UVSphere		from "../../fungi/geo/UVSphere.js";


function init_shader(){	
	return App.shader.new( "EyeBall", VERT_SRC, FRAG_SRC, [
		{ name:"eye_color", type:"rgb", value:"#ffffff" },
		{ name:"eye_shadow", type:"rgb", value:"#6666CB" },
		{ name:"iris_color_a", type:"rgb", value:"#fae125" },
		{ name:"iris_color_b", type:"rgb", value:"#ff6f00" },
		{ name:"edge_color", type:"rgb", value:"#000000" },
		{ name:"iris_radius", type:"float", value:0.35 },
		{ name:"edge_size", type:"float", value:0.15 },
		{ name:"pupil_radius", type:"float", value:0.2 },
		{ name:"pupil_scl", type:"vec2", value:new Float32Array( [6.0, 1.0] ) },
		{ name:"iris_scl", type:"vec2", value:new Float32Array( [1.0, 1.0] ) },
	], App.ubo.get_array( "Global", "Model" ) );

	//{ name:"specular_color", type:"rgb", value:"#CC7233" },
	//{ name:"rim_color", type:"rgb", value:"#FF4C4C" },
}

const VERT_SRC = `#version 300 es
	layout(location=0) in vec3 a_pos;
	layout(location=1) in vec3 a_norm;
	
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
	out vec3 frag_cam;
	out vec3 frag_wpos;
	out vec3 frag_lpos;

	//-------------------------

	void main(void){
		vec4 wpos	= model.view_matrix * vec4( a_pos, 1.0 );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		frag_lpos 		= a_pos.xyz;
		frag_wpos		= wpos.xyz;
		frag_cam		= global.camera_pos;
		frag_norm 		= mat3( transpose( inverse( model.view_matrix ) ) ) * a_norm; // Need to Rotate and Scale Normal, do on CPU

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		gl_Position = global.proj_view * wpos;
		gl_PointSize = 8.0;
	}`;

const FRAG_SRC = `#version 300 es
	precision mediump float;
	
	out vec4 out_color;

	//-------------------------
	
	const vec3 light_pos = vec3( 6.0, 10.0, 1.0 );

	uniform vec3 pupil_color;
	uniform vec3 iris_color_a;
	uniform vec3 iris_color_b;

	uniform float iris_radius; // 0.35;
	uniform float edge_size; // 0.15;
	uniform float pupil_radius; // 0.2;
	uniform vec2 pupil_scl;	//vec2( 6.0, 1.0 );
	uniform vec2 iris_scl;	//vec2( 1.0, 1.0 );

	uniform vec3 eye_color;
	uniform vec3 eye_shadow;
	uniform vec3 edge_color;

	in vec3 frag_norm;
	in vec3 frag_cam;
	in vec3 frag_wpos;
	in vec3 frag_lpos;

	//-------------------------

	float step_ramp( float t, float step_val[5], float step_pos[5], float feather, int i ){
		for( i; i > 0; i-- ){
			if( (step_pos[ i ]-feather) <= t ){
				return mix( 
					step_val[ i-1 ], 
					step_val[ i ],
					smoothstep( step_pos[ i ] - feather, step_pos[ i ] + feather, t )
				);
			}
		}
		return step_val[ 0 ];
	}

	//-------------------------

	void main( void ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		vec3 norm 		= normalize( frag_norm );				// Must normalized, Since it has been interpolated
		vec3 dir_light	= normalize( light_pos - frag_wpos );	// Frag to Light Directiom
		vec3 dir_cam	= normalize( frag_cam - frag_wpos );	// Frag tp Camera Direction

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// New Fragment local position, shifting closer to origin on Z Axis
		// This way frags that are z=0.5 will have a length of 0, moving closer
		// to 1 when world space z == 0.

		vec3 fpos			= vec3( frag_lpos.xy, frag_lpos.z - 0.5 );
		vec2 uv				= vec2( -frag_lpos.x , -frag_lpos.y );
		float lite_ratio	= clamp( dot( norm, dir_light ) * 0.5 + 0.5, 0.0, 1.0 ); 
        
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// IRIS
		//const float iris_radius		= 0.35;
		//const vec2	iris_scl		= vec2( 1.0, 1.0 );
		
		float iris_len	= length( fpos * vec3( iris_scl, 1.0 ) ); // w->b
		float iris_rng	= iris_len / iris_radius; // w->b
		float iris_grad	= 1.0 - clamp( iris_rng, 0.0, 1.0 ); // b->w
		float iris_mask	= clamp( iris_grad * 20.0, 0.0, 1.0 );

		//out_color.rgb = vec3( iris_mask );

		/*
		// Parallax Texture
		vec2 iris_uv	= ( uv / 0.8 ) + 0.5;					// Center UV					
		vec4 hmap_px	= texture( heightmap_tex, iris_uv );	// Height Map
		
		//vec2 para_uv	= parallax_offset( 2.0, hmap_px.r, dir_cam ) + iris_uv;	// From Code
		vec2 para_uv	= parallax_uv( 0.6, hmap_px.r, dir_cam, iris_uv );		// From Shader Nodes
		vec4 iris_px	= texture( heightmap_tex, para_uv );	// Reuse as Texure Map
		*/

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// IRIS EDGE
		//const float edge_size	= 0.15;

		float edge_grad			= 1.0 - clamp( iris_rng - edge_size, 0.0, 1.0 );
		float edge_mask			= clamp( edge_grad * 30.0, 0.0, 1.0 );

		// Cut Hole in Edge Circle, Both does the same thing but second one simpler
		//float edge_ring_mask	= edge_mask * ( 1.0 - iris_mask );
		float edge_ring_mask	= edge_mask - iris_mask;

		//out_color.rgb = vec3( edge_ring_mask );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// PUPIL

		//const float pupil_radius	= 0.2;
		//const vec2	pupil_scl		= vec2( 6.0, 1.0 );

		float pupil_len		= length( fpos * vec3( pupil_scl, 1.0 ) ); // w->b
		float pupil_rng		= pupil_len / pupil_radius;
		float pupil_grad	= 1.0 - clamp( pupil_rng, 0.0, 1.0 );
		float pupil_mask	= clamp( pupil_grad * 20.0, 0.0, 1.0 );

		//out_color.rgb = vec3( iris_mask );
		//out_color.rgb = vec3( pupil_mask );
		//out_color.rgb = vec3( iris_mask - pupil_mask );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // SPECULAR
		
		/* Original
		float specu = dot( norm, normalize( dir_light + dir_cam ) ) * 0.5;
		specu = step( 0.48, specu );
		*/

		/* Standard */
		const float specular_strength	= 5.0;
		const float shininess 			= 32.0;

		vec3 dir_reflect	= reflect( -dir_light, norm );				// Reflection Dir of Fragment to Light
		vec3 dir_frag_cam	= normalize( frag_cam - frag_lpos );		// Dir from Fragment to Camera
        float specu 		= specular_strength * pow( max( dot( dir_frag_cam, dir_reflect ), 0.0 ), shininess );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// COLORING

		// GRADIENT MAP
		float step_val[5]	= float[]( 0.65, 0.70, 0.9, 0.0, 0.0 );
		float step_pos[5]	= float[]( 0.0, 0.15, 0.4, 9.0, 9.0 );
		float ramp			= step_ramp( lite_ratio, step_val, step_pos, 0.02, 2 );

		//-------------------
		// MAIN
		vec3 eye_c	= mix( eye_shadow, eye_color, ramp ) * ( 1.0 - edge_mask );

		//-------------------
		// IRIS
		vec3 iris_c = mix( iris_color_a, iris_color_b, iris_grad ) ;	// Bled by Iris Gradient
		//vec3 iris_c	= mix( iris_color_a, iris_color_b, hmap_px.r * 1.1 ); // Blend color based on Hitemap
		
		// Cut pupil circle out of iris circle,  Then Apply Iris Texture
		iris_c		*= ( iris_mask - pupil_mask );// * ( iris_px.rgb * 1.7 ) ;

		//-------------------
		// EDGE
		vec3 edge_c = edge_color * edge_ring_mask;

		//-------------------
		// PUPIL
		vec3 pupil_c = mix( vec3( .25, 0.0, 0.0 ), vec3( 0.0, 0.0, 0.0), pupil_grad );
		pupil_c *= pupil_mask;

		//-------------------
		// MERGE
		out_color.rgb = eye_c + 					// Eye color has ramp shading
			( iris_c + pupil_c + edge_c ) * ramp + 	// Use ramp to Shadow the non-eye parts
			vec3( 1.0 ) * specu;					// Throw in some specular glare
	}`;

let MESH	= null;
let SHADER	= null;

function EyeBall( config=null ){
	if( !MESH )		MESH	= UVSphere.mesh( "Eye", 18, 25, 0.5, true, true );
	if( !SHADER )	SHADER	= init_shader();

	let mat = App.shader.new_material( "EyeBall", config );
	return App.mesh_entity( "EyeBall", MESH, mat, App.mesh.TRI_STRIP ); //TRI_STRIP
}

export default EyeBall;