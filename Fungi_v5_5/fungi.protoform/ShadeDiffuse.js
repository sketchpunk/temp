import App from "../fungi/App.js";

const vert_src = `#version 300 es
	layout(location=0) in vec3 a_pos;
	layout(location=1) in vec3 a_norm;
	layout(location=2) in vec2 a_uv;

	layout(location=10)	in vec4 a_ins_rot;
	layout(location=11)	in vec3 a_ins_pos;

	layout(location=12)	in vec4 a_cfg_top;
	layout(location=13)	in vec4 a_cfg_bot;
	layout(location=14)	in vec4 a_cfg_rot;
	layout(location=15)	in vec3 a_cfg_pos;

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

	out vec3 frag_norm;
	out vec3 frag_cam_pos;
	out vec3 frag_wpos;

	const int DIV_IDX = 31; // LT = TOP DOME
	vec3 quat_mul_vec3( vec4 q, vec3 v ){ return v + (2.0 * cross(q.xyz, cross(q.xyz, v) + (q.w * v))); }

	vec4 qmul(vec4 q1, vec4 q2){
		return vec4(q2.xyz * q1.w + q1.xyz * q2.w + cross(q1.xyz, q2.xyz), q1.w * q2.w - dot(q1.xyz, q2.xyz) );
	}

	void main(void){
		vec3 pos	= a_pos;

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
		pos 		= quat_mul_vec3( a_ins_rot, pos );
		pos 		+= a_ins_pos;

		vec4 wpos = vec4( pos, 1.0 ); //model.view_matrix *

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		//frag_uv		= a_uv;
		frag_wpos		= wpos.xyz;

		frag_norm 		= quat_mul_vec3( qmul( a_ins_rot, a_cfg_rot ), a_norm );
		frag_norm 		= mat3( transpose( inverse( model.view_matrix ) ) ) * frag_norm;
		
		//frag_cam_pos	= global.camera_pos;
		

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		gl_Position = global.proj_view * wpos;
		gl_PointSize = 5.0;

	}`;

const frag_src = `#version 300 es
	precision mediump float;
	
	out vec4 out_color;

	//-------------------------

	in vec3 frag_norm;
	//in vec3 frag_cam_pos;
	in vec3 frag_wpos;

	const vec3 color 				= vec3( 1.0, 1.0, 1.0 );
	const vec3 lightPosition 		= vec3( 0.0, 5.0, 0.0 );
	const vec3 lightColor 			= vec3( 1.0, 1.0, 1.0 );
	const float uAmbientStrength	= 0.5;
	const float uDiffuseStrength	= 0.5;

	//-------------------------

	void main( void ){
		//out_color = vec4( 1.0, 0.0, 0.0, 1.0 );
		//vec3 frag_norm = normalize( cross( dFdx(frag_pos), dFdy(frag_pos) ) ); //Calc the Normal of the Rasterizing Pixel

		// Ambient Lighting
		vec3 cAmbient		= lightColor * uAmbientStrength;

		// Diffuse Lighting
		vec3 lightVector	= normalize( lightPosition - frag_wpos );		//light direction based on pixel world position
		float diffuseAngle	= max( dot( frag_norm, lightVector ) ,0.0 );	//Angle between Light Direction and Pixel Direction (1==90d)
		vec3 cDiffuse		= lightColor * diffuseAngle * uDiffuseStrength;

		out_color = vec4( color * ( cAmbient + cDiffuse ), 1.0 );
	}
`;


export default function(){
	App.shader.new( "ProtoForm", vert_src, frag_src, null, App.ubo.get_array( "Global", "Model" ) );
	console.log( "[ Loaded ShaderDiffuse ]" );
}