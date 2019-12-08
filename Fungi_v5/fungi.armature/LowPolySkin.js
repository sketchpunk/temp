import App from "../fungi/App.js";
// https://www.cs.utah.edu/~ladislav/dq/dqs.cg
// http://rodolphe-vaillant.fr/?e=78
const vert_src = `#version 300 es
	layout(location=0) in vec3 a_pos;
	layout(location=8) in vec4 a_bone_idx;
	layout(location=9) in vec4 a_bone_wgt;

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

	uniform Armature{
		mat2x4[90]	bones;
		vec3[90]	scales;
	} arm;

vec4 mulQ(vec4 Q1, vec4 Q2) {
	return vec4(
		 Q2.x * Q1.w + Q2.y * Q1.z - Q2.z * Q1.y + Q2.w * Q1.x,
		-Q2.x * Q1.z + Q2.y * Q1.w + Q2.z * Q1.x + Q2.w * Q1.y,
		 Q2.x * Q1.y - Q2.y * Q1.x + Q2.z * Q1.w + Q2.w * Q1.z,
		-Q2.x * Q1.x - Q2.y * Q1.y - Q2.z * Q1.z + Q2.w * Q1.w
	);
}

vec4 transformVector(mat2x4 dq, vec3 v) {
	vec4 real = dq[0];
	vec3 r_vector = real.xyz;
	float r_scalar = real.w;
	
	vec3 rotated = r_vector * 2.0f * dot(r_vector, v) +
			v * (r_scalar * r_scalar - dot(r_vector, r_vector)) +
			cross(r_vector, v) * 2.0f * r_scalar;

	return vec4(rotated, 0);
}

vec3 transformPoint(mat2x4 dq, vec3 v) {
	vec4 real = dq[0];
	vec4 dual = dq[1];

	vec3 rotated = transformVector(dq, v).xyz;
	vec4 conjugate = vec4(-real.xyz, real.w);
	vec3 t = mulQ(conjugate, dual * 2.0).xyz;
	
	return rotated + t;
}

	vec3 dq_mul_vec( mat2x4 dq, vec3 v ){
		vec4 Qr 	= dq[0].xyzw; //real (rot)
		vec4 Qd 	= dq[1].xyzw; //dual (trans)
		
		//vec3 pos = v + cross(2.0 * Qr.xyz, cross(Qr.xyz, v) + Qr.w * v );	//Rotate Vector
		vec3 pos = v + 2.0 * cross( Qr.xyz, cross( Qr.xyz, v ) + Qr.w * v );
		
		//vec3 tran = 2.0 * ( Qr.w * Qd.xyz - Qd.w * Qr.xyz + cross( Qr.xyz, Qd.xyz ));	//Pull out Translation from DQ
		vec3 tran = 2.0 * ( Qr.w * Qd.xyz - Qd.w * Qr.xyz + cross( Qr.xyz, Qd.xyz ));
		return pos + tran;
	}

	mat4x4 scl_mat( vec3 scl ){
		mat4x4 m;
		m[0][0] = scl.x;
		m[1][1] = scl.y;
		m[2][2] = scl.z;
		m[3][3] = 1.0;
		return m;
	}


	vec3 scl_bone( vec3 pos, vec3[90] b_scl, vec4 b_wgt, int a, int b, int c, int d ){
		mat4x4 ma = scl_mat( b_scl[ a ] );
		mat4x4 mb = scl_mat( b_scl[ b ] );
		mat4x4 mc = scl_mat( b_scl[ c ] );
		mat4x4 md = scl_mat( b_scl[ d ] );

		mat4x4 s = 
			ma * b_wgt.x +
			mb * b_wgt.y +
			mc * b_wgt.z +
			md * b_wgt.w;

		return pos * 1.0;
		return (s * vec4( pos, 1.0 )).xyz;
	}
	

	vec3 dq_bone_transform( vec3 pos, mat2x4[90] b_dq, vec4 b_idx, vec4 b_wgt, vec3[90] b_scl ){
		/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		NORMALIZE BONE WEIGHT VECTOR */
		int a = int( b_idx.x ),
			b = int( b_idx.y ),
			c = int( b_idx.z ),
			d = int( b_idx.w );

		b_wgt *= 1.0 / (b_wgt.x + b_wgt.y + b_wgt.z + b_wgt.w); // 1 Div, 4 Mul, instead of 4 Div.

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// WEIGHT DQ

		// Antipodality correction.
		//if (dot(dq0[0], dq1[0]) < 0.0) dq1 *= -1.0;
		//if (dot(dq0[0], dq2[0]) < 0.0) dq2 *= -1.0;	
		//if (dot(dq0[0], dq3[0]) < 0.0) dq3 *= -1.0;

		// Neightborhood all of the weights correctly
		if (dot(b_dq[ a ][0], b_dq[ b ][0]) < 0.0) b_wgt.y *= -1.0; 
		if (dot(b_dq[ a ][0], b_dq[ c ][0]) < 0.0) b_wgt.z *= -1.0; 
		if (dot(b_dq[ a ][0], b_dq[ d ][0]) < 0.0) b_wgt.w *= -1.0;


		mat2x4 wgt_dq	=	b_dq[ a ] * b_wgt.x +  
							b_dq[ b ] * b_wgt.y +
							b_dq[ c ] * b_wgt.z +
							b_dq[ d ] * b_wgt.w;

		wgt_dq *= 1.0 / length( wgt_dq[0] ); // Normalize DQ by the length of the Quaternion

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// WEIGHT SCALE
		vec3 wgt_scl	=	b_scl[ a ]	* b_wgt.x +
							b_scl[ b ]	* b_wgt.y +
							b_scl[ c ]	* b_wgt.z +
							b_scl[ d ]	* b_wgt.w;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// SCALE, ROTATE - TRANSLATE
		//return dq_mul_vec( wgt_dq, pos * wgt_scl);
		//return dq_mul_vec( wgt_dq, scl_bone( pos, b_scl, b_wgt, a, b, c, d ) );
		//return dq_mul_vec( wgt_dq, pos * wgt_scl ) ;

		return transformPoint( wgt_dq, pos * wgt_scl );
	}

	out vec3 w_pos;
	flat out vec3 cam_pos;

	void main(void){
		vec3 pos	= dq_bone_transform( a_pos, arm.bones, a_bone_idx, a_bone_wgt, arm.scales );
		w_pos		= pos;
		cam_pos		= global.camera_pos;
		gl_Position = global.proj_view * vec4( pos, 1.0 );
	}`;

const frag_src = `#version 300 es
	precision mediump float;

	in vec3 w_pos;
	flat in vec3 cam_pos;

	uniform vec3 color;
	out vec4 out_color;

	const vec3 lightPosition 		= vec3( 6.0, 10.0, 1.0 );
	const vec3 lightColor 			= vec3( 1.0, 1.0, 1.0 );
	const float uAmbientStrength	= 0.5;
	const float uDiffuseStrength	= 0.5;
	const float uSpecularStrength	= 0.2f;	//0.15
	const float uSpecularShininess	= 1.0f; //256.0

	void main(void){ 
		vec3 pixelNorm = normalize( cross( dFdx(w_pos), dFdy(w_pos) ) ); //Calc the Normal of the Rasterizing Pixel

		// Ambient Lighting
		vec3 cAmbient		= lightColor * uAmbientStrength;
		
		// Diffuse Lighting
		vec3 lightVector	= normalize(lightPosition - w_pos);		//light direction based on pixel world position
		float diffuseAngle	= max( dot(pixelNorm,lightVector) ,0.0);	//Angle between Light Direction and Pixel Direction (1==90d)
		vec3 cDiffuse		= lightColor * diffuseAngle * uDiffuseStrength;

		// Specular Lighting
		vec3 camVector		= normalize( cam_pos - w_pos );	//Camera Direction based on pixel world position
		vec3 reflectVector	= reflect(-lightVector, pixelNorm);		//Reflective direction of line from pixel direction as pivot.
		float specular		= pow( max( dot(reflectVector,camVector) ,0.0), uSpecularShininess ); //Angle of reflected light and camera eye
		vec3 cSpecular		= lightColor * specular * uSpecularStrength;

		out_color = vec4( color * (cAmbient + cDiffuse + cSpecular), 1.0 );
	}`;

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
let sh = App.Shader.from_src( "LowPolySkin", vert_src, frag_src )
	.add_uniform_blocks( ["Global","Model","Armature"] )
	.add_uniform( "color", "rgb", "#ff7f7f" );

App.Cache.set_shader( sh.name, sh );

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
export default sh;


/*
// optimized version (avoids dual quaternion - matrix conversion):
outputs dqsFast(inputs IN,
			uniform float4x4 modelViewProj,
			uniform float4x4 modelViewIT,
			uniform float2x4 boneDQ[100])
{
	outputs OUT;			
		
	float2x4 blendDQ = IN.weights.x*boneDQ[IN.matrixIndices.x];
	blendDQ += IN.weights.y*boneDQ[IN.matrixIndices.y];
	blendDQ += IN.weights.z*boneDQ[IN.matrixIndices.z];
	blendDQ += IN.weights.w*boneDQ[IN.matrixIndices.w];	
		
	float len = length(blendDQ[0]);
	blendDQ /= len;

	float3 position = IN.position.xyz + 2.0*cross(blendDQ[0].yzw, cross(blendDQ[0].yzw, IN.position.xyz) + blendDQ[0].x*IN.position.xyz);
	float3 trans = 2.0*(blendDQ[0].x*blendDQ[1].yzw - blendDQ[1].x*blendDQ[0].yzw + cross(blendDQ[0].yzw, blendDQ[1].yzw));
	position += trans;

	float3 inpNormal = IN.normal.xyz;
	float3 normal = inpNormal + 2.0*cross(blendDQ[0].yzw, cross(blendDQ[0].yzw, inpNormal) + blendDQ[0].x*inpNormal);

	OUT.hPosition = mul(modelViewProj, float4(position, 1.0));
	OUT.hNormal = mul(modelViewIT, float4(normal, 0.0));
		
	return OUT;
}

float3x3 adjointTransposeMatrix(float3x3 M)
{
	float3x3 atM;
	atM._m00 = M._m22 * M._m11 - M._m12 * M._m21;
	atM._m01 = M._m12 * M._m20 - M._m10 * M._m22;
	atM._m02 = M._m10 * M._m21 - M._m20 * M._m11;

	atM._m10 = M._m02 * M._m21 - M._m22 * M._m01;
	atM._m11 = M._m22 * M._m00 - M._m02 * M._m20;
	atM._m12 = M._m20 * M._m01 - M._m00 * M._m21;

	atM._m20 = M._m12 * M._m01 - M._m02 * M._m11;
	atM._m21 = M._m10 * M._m02 - M._m12 * M._m00;
	atM._m22 = M._m00 * M._m11 - M._m10 * M._m01;

	return atM;
}

// two-phase skinning: dqsFast combined with scale/shear transformations:
outputs dqsScale(inputs IN,
			uniform float4x4 modelViewProj,
			uniform float4x4 modelViewIT,
			uniform float2x4 boneDQ[100],
			uniform float3x4 scaleM[100])
{
	outputs OUT;			

	// first pass:
	float3x4 blendS = IN.weights.x*scaleM[IN.matrixIndices.x];
	blendS += IN.weights.y*scaleM[IN.matrixIndices.y];
	blendS += IN.weights.z*scaleM[IN.matrixIndices.z];
	blendS += IN.weights.w*scaleM[IN.matrixIndices.w];	
		
	float3 pass1_position = mul(blendS, IN.position);
	float3x3 blendSrotAT = adjointTransposeMatrix(float3x3(blendS));
	float3 pass1_normal = normalize(mul(blendSrotAT, IN.normal.xyz));
		
	// second pass:
	float2x4 blendDQ = IN.weights.x*boneDQ[IN.matrixIndices.x];
	blendDQ += IN.weights.y*boneDQ[IN.matrixIndices.y];
	blendDQ += IN.weights.z*boneDQ[IN.matrixIndices.z];
	blendDQ += IN.weights.w*boneDQ[IN.matrixIndices.w];	
		
	float len = length(blendDQ[0]);
	blendDQ /= len;

	float3 position = pass1_position + 2.0*cross(blendDQ[0].yzw, cross(blendDQ[0].yzw, pass1_position) + blendDQ[0].x*pass1_position);
	float3 trans = 2.0*(blendDQ[0].x*blendDQ[1].yzw - blendDQ[1].x*blendDQ[0].yzw + cross(blendDQ[0].yzw, blendDQ[1].yzw));
	position += trans;

	float3 normal = pass1_normal + 2.0*cross(blendDQ[0].yzw, cross(blendDQ[0].yzw, pass1_normal) + blendDQ[0].x*pass1_normal);

	OUT.hPosition = mul(modelViewProj, float4(position, 1.0));
	OUT.hNormal = mul(modelViewIT, float4(normal, 0.0));
		
	return OUT;
}
 */