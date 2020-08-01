import App from "../fungi/App.js";

const vert_src = `#version 300 es
	layout(location=0) in vec3 a_pos;
	layout(location=8) in vec4 a_skin_idx;
	layout(location=9) in vec4 a_skin_wgt;

	out vec3		frag_pos;
	flat out vec3	frag_cam_pos;

	//------------------------------------------

	uniform Global{ 
		mat4 proj_view; 
		mat4 camera_matrix;
		vec3 camera_pos;
		float delta_time;
		vec2 screen_size;
		float clock;
	} global;

	uniform Model{ 
		mat4x4 view_matrix;
	} model;

	uniform Armature{
		mat4x4[90] bones;
	} arm;

	//------------------------------------------

	vec4 mtx_bone_transform( vec3 pos, mat4x4[90] pose_mtx, vec4 b_idx, vec4 b_wgt ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// NORMALIZE BONE WEIGHT VECTOR 
		
		int a = int( b_idx.x ),
			b = int( b_idx.y ),
			c = int( b_idx.z ),
			d = int( b_idx.w );

		b_wgt *= 1.0 / (b_wgt.x + b_wgt.y + b_wgt.z + b_wgt.w); // 1 Div, 4 Mul, instead of 4 Div.

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// WEIGHT

		mat4x4 wgt_mtx	=	pose_mtx[ a ] * b_wgt.x +  
							pose_mtx[ b ] * b_wgt.y +
							pose_mtx[ c ] * b_wgt.z +
							pose_mtx[ d ] * b_wgt.w;

		return wgt_mtx * vec4( pos, 1.0 );
	}

	vec4 mtx_bone_transform2( vec3 pos, vec4 b_idx, vec4 b_wgt ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// NORMALIZE BONE WEIGHT VECTOR 
		
		int a = int( b_idx.x ),
			b = int( b_idx.y ),
			c = int( b_idx.z ),
			d = int( b_idx.w );

		b_wgt *= 1.0 / (b_wgt.x + b_wgt.y + b_wgt.z + b_wgt.w); // 1 Div, 4 Mul, instead of 4 Div.

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// WEIGHT

		mat4x4 wgt_mtx	=	arm.bones[ a ] * b_wgt.x +  
							arm.bones[ b ] * b_wgt.y +
							arm.bones[ c ] * b_wgt.z +
							arm.bones[ d ] * b_wgt.w;

		vec4 rtn = wgt_mtx * vec4( pos, 1.0 );
		return rtn;
	}

	//------------------------------------------

	void main(void){
		//vec4 wpos		= model.view_matrix * mtx_bone_transform( a_pos, arm.bones, a_skin_idx, a_skin_wgt );
		vec4 wpos		= model.view_matrix * mtx_bone_transform2( a_pos, a_skin_idx, a_skin_wgt );
		frag_pos		= wpos.xyz;
		frag_cam_pos	= global.camera_pos;

		gl_Position		= global.proj_view * wpos;		
	}`;

const frag_src = `#version 300 es
	precision mediump float;

	out 	vec4	out_color;

	in		vec3	frag_pos;
	flat in	vec3	frag_cam_pos;

	//------------------------------------------

	uniform vec3 color;

	//------------------------------------------

	const vec3 lightPosition 		= vec3( 6.0, 10.0, 1.0 );
	const vec3 lightColor 			= vec3( 1.0, 1.0, 1.0 );
	const float uAmbientStrength	= 0.5;
	const float uDiffuseStrength	= 0.5;
	const float uSpecularStrength	= 0.2f;	//0.15
	const float uSpecularShininess	= 1.0f; //256.0

	//------------------------------------------

	void main(void){ 
		vec3 pixelNorm = normalize( cross( dFdx(frag_pos), dFdy(frag_pos) ) ); // Calc the Normal of the Rasterizing Pixel

		// Ambient Lighting
		vec3 cAmbient		= lightColor * uAmbientStrength;
		
		// Diffuse Lighting
		vec3 lightVector	= normalize(lightPosition - frag_pos);		// light direction based on pixel world position
		float diffuseAngle	= max( dot(pixelNorm,lightVector) ,0.0);	// Angle between Light Direction and Pixel Direction (1==90d)
		vec3 cDiffuse		= lightColor * diffuseAngle * uDiffuseStrength;

		// Specular Lighting
		vec3 camVector		= normalize( frag_cam_pos - frag_pos );	// Camera Direction based on pixel world position
		vec3 reflectVector	= reflect(-lightVector, pixelNorm);		// Reflective direction of line from pixel direction as pivot.
		float specular		= pow( max( dot(reflectVector,camVector) ,0.0), uSpecularShininess ); // Angle of reflected light and camera eye
		vec3 cSpecular		= lightColor * specular * uSpecularStrength;

		out_color = vec4( color * (cAmbient + cDiffuse + cSpecular), 1.0 );
	}`;

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
let sh	= App.shader.new( "LowPolySkin", vert_src, frag_src, [
	{ name:"color", type:"rgb", value:"#ff7f7f" }
	], App.ubo.get_array( "Global","Model","Armature" )
);

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
export default sh;