import App from "../fungi/App.js";

const vert_src = `#version 300 es
	layout(location=0) in vec3 a_pos;
	layout(location=1) in vec3 a_norm;
	layout(location=2) in vec2 a_uv;

	layout(location=9)	in vec4 a_ins_rot;
	layout(location=10)	in vec3 a_ins_pos;
	layout(location=11)	in vec3 a_ins_scl;

	layout(location=12)	in vec4 a_cfg_top;
	layout(location=13)	in vec4 a_cfg_bot;
	layout(location=14)	in vec4 a_cfg_rot;
	layout(location=15)	in vec3 a_cfg_pos;

	const int DIV_IDX = 31; // LT = TOP DOME

	//***********************************************************

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

	//***********************************************************

	out vec3 frag_norm;
	out vec3 frag_cam_pos;
	out vec3 frag_wpos;
	out vec2 screen_uv;

	//***********************************************************

	vec3 quat_mul_vec3( vec4 q, vec3 v ){ return v + (2.0 * cross(q.xyz, cross(q.xyz, v) + (q.w * v))); }
	vec4 qmul(vec4 q1, vec4 q2){ return vec4(q2.xyz * q1.w + q1.xyz * q2.w + cross(q1.xyz, q2.xyz), q1.w * q2.w - dot(q1.xyz, q2.xyz) ); }

	//***********************************************************

	void main(void){
		vec3 pos = a_pos;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Capsule Configuration
		if( gl_VertexID < DIV_IDX ){
			pos.xyz	*= a_cfg_top.xyz;	// Scale Dom
			pos.y	+= a_cfg_top.w;		// Move Dome
		}else{
			pos.xyz	*= a_cfg_bot.xyz;	// Scale Dom
			pos.y	+= a_cfg_bot.w;		// Move Dome
		}

		pos = quat_mul_vec3( a_cfg_rot, pos );
		pos += a_cfg_pos;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Transform Instances
		pos 		= quat_mul_vec3( a_ins_rot, pos * a_ins_scl );
		pos 		+= a_ins_pos;

		vec4 wpos	= vec4( pos, 1.0 ); //model.view_matrix * 

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		frag_wpos		= wpos.xyz;
		frag_cam_pos	= global.camera_pos;
		frag_norm 		= quat_mul_vec3( qmul( a_ins_rot, a_cfg_rot ), a_norm );
		frag_norm 		= mat3( transpose( inverse( model.view_matrix ) ) ) * frag_norm;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		gl_Position		= global.proj_view * wpos;
		//gl_PointSize	= 5.0;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// SCREEN SPACE UV
		screen_uv.xy	= gl_Position.xy / gl_Position.w;
		screen_uv.x 	*= global.screen_size.x / global.screen_size.y;	// Fix X Stretch
		screen_uv.xy	= screen_uv.xy * 0.5 + 0.5;						// To -1,1 to 0,1
	}`;

const frag_src = `#version 300 es
	precision mediump float;

	//***********************************************************

	out vec4 out_color;

	in vec3 frag_norm;
	in vec3 frag_cam_pos;
	in vec3 frag_wpos;
	in vec2 screen_uv;

	const vec3 light_pos	= vec3( 6.0, 10.0, 1.0 ); //vec3( 0.0, 10.0, 0.0 );
	const vec3 light_color	= vec3( 1.0, 1.0, 1.0 );
	
	const float uv_scale		= 140.0;
	const float specular_pow	= 50.0;
	const float shadow_strength	= 0.4;
	
	//***********************************************************

	float ease( float x ){ return 3.0 * x * x - 2.0 * x * x * x; }

	vec3 rgb( int c ){
		return vec3(
			float( ( c >> 16 ) & 0xff ) * 0.00392156863,
			float( ( c >> 8 ) & 0xff ) * 0.00392156863,
			float( c & 0xff ) * 0.00392156863
		);
	}
	
	struct DotRamp{
	  vec3 color_a;
	  vec3 color_b;
	  float t;
	};
	
	void color_dot_ramp2( vec3[5] color, float[5] wgt, float t, float feather, int i, out DotRamp dr ){
		for( i; i > 0; i-- ){
			if( ( wgt[ i ] ) <= t ){
				dr.color_a	= color[ i-1 ];
				dr.color_b	= color[ i ];
				dr.t		= clamp( ( t - wgt[i] ) / feather, 0.0, 1.0 );
				return;
			}
		}
		dr.color_a	= color[ 0 ];
		dr.color_b	= color[ 0 ];
		dr.t		= 0.0;
	}
	
	//***********************************************************

	void main( void ){

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		vec3 norm 			= normalize( frag_norm );					// Must normalized, Since it has been interpolated
		vec3 dir_light		= normalize( light_pos - frag_wpos );		// Frag to Light Directiom
		vec3 dir_cam		= normalize( frag_cam_pos - frag_wpos );	// Frag tp Camera Direction
		float d_lite		= dot( dir_light, norm );
		float d_lite_c	    = clamp( d_lite, 0.0, 1.0 );	// Clamp Light
		//float d_lite_a	    = d_lite * 0.5 + 0.5;			// Remap Light from -1,1 to 0,1
	
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		//float uv_scale		= 140.0;
	
		// Experiment with changing scale based on distance from camera
		//uv_scale = mix( 100.0, 180.0, clamp( length( frag_cam_pos - frag_wpos ) / 6.0, 0.0, 1.0 ) );
	
		vec2 rot_uv			= mat2( 0.707, -0.707, 0.707, 0.707 ) * screen_uv;	// Rotate Screen UV by 45d
		vec2 cell_pos		= fract( uv_scale * rot_uv ) * 2.0 - 1.0;			// Scale UV, Cell Pos, Remap to -1,1
	
		float radius_max	= 2.0;					// Total Radius for Halftone Dots.
		float cell_pos_len	= length( cell_pos );	// Distance from Cell Center
	
		float radius_rng	= 0.0;					// What the Radius Range is after some math
		float radius_step	= 0.0;					// Define the inner or outer part of the halftone circle.
	
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// COLOR RAMP
	
		vec3	ramp_col[5]	= vec3[]( rgb(0x1D212A), rgb(0x2A4B53), rgb(0x81FFE9), vec3(.0), vec3(.0) );	
		float	ramp_wgt[5]	= float[]( 0.0, 0.35, 0.75, .0, .0 );
	
		// Get the Color based on the Angle of the Light in relation to normal
		DotRamp dotramp;
		color_dot_ramp2( ramp_col, ramp_wgt, d_lite_c, 0.17, 1, dotramp );
	
		radius_rng		= radius_max * pow( 1.0 - dotramp.t, 1.4 );
		radius_step		= step( radius_rng, cell_pos_len );
		out_color.rgb	= mix( dotramp.color_a, dotramp.color_b, radius_step );
	
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// SPECULAR COLOR
		vec3 specular_light = rgb( 0x81FFE9 );
		
		vec3 half_dir	= normalize( dir_light + dir_cam ); 		// Direction between Light and Camera
		float NdH		= clamp( dot( norm, half_dir ), 0.0, 1.0 );	// Angle of Norm to Half
		float gloss		= specular_pow; //50.0;						// How Much Power to Raise Specular Light angle
		float spec		= pow( NdH, gloss );

		
		radius_rng		= radius_max * ease( spec );				// Use an ease function to curve the light results
		radius_step		= step( radius_rng, cell_pos_len );
		out_color.rgb	+= ( 1.0 - radius_step ) * specular_light;	// Invert the step to make specular into white
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// DIRECTIONAL RIM
		float rim_pow	= 0.03;
		//float shadow_strength = 0.4;

		float dot_nl	= d_lite * -1.0;
		float rim_dot	= 1.0 - dot( dir_cam, norm ) ;
		float rim_rng	= smoothstep( 0.5, 0.9, rim_dot * pow( dot_nl, rim_pow ) );
	
		radius_rng		= radius_max * rim_rng;
		radius_step		= 1.0 - step( radius_rng, cell_pos_len );
		out_color.rgb	= mix( out_color.rgb, out_color.rgb * shadow_strength, radius_step );
	}
`;


export default function(){
	App.shader.new( "ProtoForm", vert_src, frag_src, null, App.ubo.get_array( "Global", "Model" ) );
	//console.log( "[ Loaded ShaderHalftone ]" );
}