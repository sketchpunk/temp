import App from "../fungi/App.js";

const vert_src = `#version 300 es
	layout(location=0) in vec4 a_pos;
	layout(location=1) in vec3 a_norm;

	layout(location=3)	in vec4 a_ins_rot;
	layout(location=4)	in vec3 a_ins_pos;
	layout(location=5)	in vec3 a_ins_scl;

	layout(location=6)	in vec3 scl_top;
	layout(location=7)	in vec3 scl_mid;
	layout(location=8)	in vec3 scl_bot;
	layout(location=9)	in vec3 pos_top;
	layout(location=10)	in vec3 pos_mid;
	layout(location=11)	in vec3 pos_bot;
	layout(location=12)	in vec4 base_rot;
	layout(location=13)	in vec3 base_pos;
	layout(location=14)	in float base_opt;

	uniform Global{ 
		mat4	proj_view; 
		mat4	camera_matrix;
		vec3	camera_pos;
		float	delta_time;
		vec2	screen_size;
		float	clock;
	} global;

	uniform Model{ 
		mat4 view_matrix;
	} model;

	out vec3 frag_norm;
	out vec3 frag_wpos;

	const vec3	UP	= vec3( 0.0, 1.0, 0.0 );
	const float	PI	= 3.1415926535897932384626433832795;

	//-------------------------
	// HELPER MATH FUNCTIONS

	// QUATERNIONS
	vec3 quat_mul_vec3( vec4 q, vec3 v ){ return v + (2.0 * cross(q.xyz, cross(q.xyz, v) + (q.w * v))); }

	vec4 quat_mul(vec4 q1, vec4 q2){
		return vec4(q2.xyz * q1.w + q1.xyz * q2.w + cross(q1.xyz, q2.xyz), q1.w * q2.w - dot(q1.xyz, q2.xyz) );
	}

	vec4 quat_axis_angle( vec3 axis, float angle ){ return vec4( axis * sin( angle * 0.5 ), cos( angle * 0.5 ) ); }

	vec4 quat_unit_vecs( vec3 a, vec3 b ){
		// Using unit vectors, Shortest rotation from Direction A to Direction B
		// http://glmatrix.net/docs/quat.js.html#line548
		// http://physicsforgames.blogspot.com/2010/03/Quat-tricks.html
		float dot = dot( a, b );

		if( dot < -0.999999 ){
			vec3 v = cross( vec3( 1.0, 0.0, 0.0 ), a );
			if( length( v ) < 0.000001 ) v = cross( vec3( 0.0, 1.0, 0.0 ), a );
			return quat_axis_angle( normalize( v ), PI );
		}else if( dot > 0.999999 ){
			return vec4( 0.0, 0.0, 0.0, 1.0 );
		}

		return normalize( vec4( cross( a, b ), 1.0 + dot ) );
	}

	// QUADRATIC BEZIER CURVE
	vec3 qbezier_at( vec3 a, vec3 b, vec3 c, float t ){
		float s = 1.0 - t;
		return s * ( s * a + t * b ) + t * ( s * b + t * c );
	}
	vec3 qbezier_dxdy( vec3 a, vec3 b, vec3 c, float t ){
		return 2.0 * ( 1.0 - t ) * ( b - a ) + 2.0 * t * ( c - b );
	}

	//-------------------------

	vec3 mode_linear( vec3 pos, int grp ){
		//vec3 scl_top	= vec3( 1.0, 1.0, 1.0 );
		//vec3 scl_bot	= vec3( 1.0, 1.0, 1.0 );
		//vec3 pos_top	= vec3( 0.0, 0.0, 0.0 );
		//vec3 pos_bot	= vec3( 0.0, 0.0, 0.0 );

		if( grp == 1 ){
			// To scale correctly, Need to shift the dome to origin, then shift back
			pos.y	-= 1.0;
			pos.xyz	*= scl_top;
			pos.y	+= 1.0;

			// Apply Transition
			pos.xz	+= pos_top.xz;
			pos.y	+= pos_top.y - 1.0;	// Dome is already 1u up, -1 will zero out.
		}

		if( grp == 2 ){
			//float t	= ( a_pos.y + 1.0 ) / 2.0; // Old Way, tends to curve

			// To Keep the transition linear instead of a lil curved, Need to add up
			// the total height of the cylinder for normalizing, then scale the height
			// of the top half and add it to the height of the bottom half.
			float t	= ( pos.y * pos_top.y + pos_bot.y ) / ( pos_top.y + pos_bot.y );
			pos.xz	*= mix( scl_bot.xz, scl_top.xz, t );
			
			pos.xz	+= pos_top.xz * a_pos.y;
			pos.y	*= pos_top.y;
		}

		if( grp == 3 ){
			//float t	= ( a_pos.y + 1.0 ) / 2.0;
			float t	=  ( pos.y + 1.0 ) * pos_bot.y / ( pos_top.y + pos_bot.y );
			pos.xz	*= mix( scl_bot.xz, scl_top.xz, t );

			pos.xz	+= pos_bot.xz * a_pos.y;
			pos.y	*= pos_bot.y;
		}

		if( grp == 4 ){
			// To scale correctly, Need to shift the dome to origin, then shift back
			pos.y	+= 1.0;
			pos.xyz	*= scl_bot;
			pos.y	-= 1.0;

			// Apply Transition
			pos.xz	+= pos_bot.xz;
			pos.y	-= pos_bot.y - 1.0;	// Dome is already 1u up, -1 will zero out.
		}

		return pos;
	}

	vec3 mode_capped_curve( vec3 pos, int grp ){
		//vec3 pos_top = vec3( 0.0, 1.0, 0.0 );
		//vec3 pos_mid = vec3( 0.0, 0.0, 0.0 );
		//vec3 pos_bot = vec3( 0.0, -1.0, 0.0 );
		//vec3 scl_top = vec3( 1.0 );
		//vec3 scl_mid = vec3( 1.0 );
		//vec3 scl_bot = vec3( 1.0 );

		float t = 1.0;	// when Grp=1, Want T to be 1.0, the end of the curve

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Scale Rings rings between the Top and Bottom Domes.
		if( grp == 2 || grp == 3 ){
			t		= ( pos.y + 1.0 ) / 2.0;
			pos.y	= 0.0;	// Shift ring to origin

			//if( grp <= 2 ) pos *= mix( scl_mid, scl_top, norm_bezier3( 0.0, 0.3, a_pos.y ) );
			//if( grp >= 3 ) pos *= mix( scl_mid, scl_bot, norm_bezier3( 0.0, 0.3, abs( a_pos.y ) ) );

			if( grp <= 2 ) pos *= mix( scl_mid, scl_top, a_pos.y );
			if( grp >= 3 ) pos *= mix( scl_mid, scl_bot, abs( a_pos.y ) );
		}

		// Scale Top Dome
		if( grp == 1 ){
			pos.y	-= 1.0;		// Move the Whole Dome to Origin.
			pos.xyz	*= scl_top;	// Scale Dome
		}

		// Scale Bottom Dome
		if( grp == 4 ){
			pos.y	+= 1.0;		// Move Whole Dome to Origin
			pos.xyz	*= scl_bot;	// Scale Dome
			t = 0.0;			// Reset Curve T so its at the beginning of the curve
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		vec3 dir	= normalize( qbezier_dxdy( pos_bot, pos_mid, pos_top, t ) );	// Get the Direction of the T Position on the Curve.
		vec4 q 		= quat_unit_vecs( UP, dir );					// Create a Rotation that goes from UP to that Curve T Direction
		pos			= quat_mul_vec3( q, pos );						// Rotate the Ring/Dome
		pos 		+= qbezier_at( pos_bot, pos_mid, pos_top, t );	// Move the Ring/Dome a Position T of the curve

		return pos;
	}
	
	vec3 mode_full_curve( vec3 pos, int grp ){
		//vec3 pos_top = vec3( 0.0, 1.5, 0.0 );
		//vec3 pos_mid = vec3( 0.0, 0.0, 0.0 );
		//vec3 pos_bot = vec3( 0.0, -1.5, 0.0 );
		//vec3 scl_top = vec3( 1.0 );
		//vec3 scl_mid = vec3( 1.0 );
		//vec3 scl_bot = vec3( 1.0 );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Remap Capsule height from -1.5 > 1.5 to 0.0 > 3.0
		// Then normalize the vert height in relation to total height.
		float t		= ( 1.5 + a_pos.y ) / 3.0;

		// Using the Norm Height, use that as T for bezier curve's first derivative/
		vec3 dir	= normalize( qbezier_dxdy( pos_bot, pos_mid, pos_top, t ) );

		// Create Rotation between UP and the curve point's direction.
		vec4 q 		= quat_unit_vecs( UP, dir );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		//if( grp <= 2 ) pos *= mix( sb, sc, norm_bezier3( 0.5, 1.3, pos.y / 1.5 ) );
		//if( grp >= 3 ) pos *= mix( sb, sa, norm_bezier3( 0.2, 0.7, abs( pos.y ) / 1.5 ) );

		// Apply Scale based from the mid point scale to either TOP or BOTTOM Scale.
		if( grp <= 2 ) pos *= mix( scl_mid, scl_top, pos.y / 1.5 );
		if( grp >= 3 ) pos *= mix( scl_mid, scl_bot, abs( pos.y ) / 1.5 );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		pos.y		= 0.0;											// Vert belongs to a ring, shift it to height origin
		pos			= quat_mul_vec3( q, pos );						// Then rotate it toward the curve point direction
		pos 		+= qbezier_at( pos_bot, pos_mid, pos_top, t );	// Then move the ring to the curve's position.
		return pos;
	}

	//-------------------------

	void main(void){
		vec3 pos	= a_pos.xyz;
		int grp		= int( a_pos.w );
		int mode	= int( base_opt );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Apply Capsule Morphing
		if( mode == 0 ) pos = mode_linear( pos, grp );
		if( mode == 1 ) pos = mode_capped_curve( pos, grp );
		if( mode == 2 ) pos = mode_full_curve( pos, grp );

		// Apply Base Rotation and Translation
		pos		= quat_mul_vec3( base_rot, pos );
		pos		+= base_pos;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Apply Bone Transform
		pos		= quat_mul_vec3( a_ins_rot, pos * a_ins_scl );
		pos		+= a_ins_pos;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		vec4 wpos = model.view_matrix * vec4( pos, 1.0 ); //

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		frag_wpos		= wpos.xyz;
		//frag_norm		= a_norm;

		frag_norm 		= quat_mul_vec3( quat_mul( a_ins_rot, base_rot ), a_norm );
		frag_norm 		= mat3( transpose( inverse( model.view_matrix ) ) ) * frag_norm;
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		gl_Position		= global.proj_view * wpos;
		gl_PointSize	= 5.0;

	}`;

const frag_src = `#version 300 es
	precision mediump float;
	
	out vec4 out_color;

	//-------------------------

	in vec3 frag_norm;
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

//export default function(){
//	App.shader.new( "ProtoForm", vert_src, frag_src, null, App.ubo.get_array( "Global", "Model" ) );
	//console.log( "[ Loaded ShaderDiffuse ]" );
//}

let sh	= App.shader.new( "ProtoForm", vert_src, frag_src, null , App.ubo.get_array( "Global","Model" ) );

export default sh;