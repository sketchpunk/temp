import App						from "../fungi/App.js";
import InterleavedFloatArray	from "../fungi/data/InterleavedFloatArray.js";
import Capsule					from "../fungi/geo/Capsule.js";

class ProtoRig{
	static init( priority = 810 ){
		App.Components.reg( ProtoRig );
        App.ecs.sys_add( ProtoRigSys, priority );
        
        if( !SHADER ) load_shader();
	}

    static $( name, config, use_preview=false ){
		let e = App.$( name, ["Node","Draw","ProtoRig","Armature"] );
		let p = e.ProtoRig;
        
		p.build( e, config );
		
		if( use_preview ) e.add_com( "BoneView" ).init();
		return e;
	}

	constructor(){
		this.bone_buffer = null;

		// Flat Worldspace Transfrom from Armature Bones
	    this.bone_transform = new InterleavedFloatArray()
	    	.add_var( "rot", 4 )
	    	.add_var( "pos", 3 );

	    // Capsule Visual Configuration
	    this.config = new InterleavedFloatArray()
	    	.add_var( "top", 4 )	// xyz = scale dome, w translate Y position
	    	.add_var( "bot", 4 )
			.add_var( "rot", 4 )	// Quaternion Rotation
			.add_var( "pos", 3 );	// Quaternion Rotation
	}

	build( e, ary ){
        let cnt = ary.length,
            arm = e.Armature,
            bt  = this.bone_transform,
            cfg = this.config;

        bt.expand_by( cnt, true );      // Initialize Bone Transform Buffer, Auto fill with 0s
        cfg.expand_by( cnt, false );    // Initialize Capsule Config Buffer, Fill in Manually

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Build up armature bones and capsule configurations
        let itm, ttop, bbot, top = [0,0,0,0], bot = [0,0,0,0];    
        for( itm of ary ){
			// Create Bone Entity
			//console.log( itm.name );
            arm.add_bone( itm.name, itm.len, itm.p_idx )
            	.Node
				.set_rot( itm.bone_rot )
				.set_pos( itm.bone_pos );

			// Save Visual Config
			if( itm.top.length == 2 ){
				top[ 0 ] = top[ 1 ] = top[ 2 ] = itm.top[ 0 ];
				top[ 3 ] = itm.top[ 1 ];
				ttop = top;
			}else ttop = itm.top;

			if( itm.bot.length == 2 ){
				bot[ 0 ] = bot[ 1 ] = bot[ 2 ] = itm.bot[ 0 ];
				bot[ 3 ] = itm.bot[ 1 ];
				bbot = bot;
			}else bbot = itm.bot;

            cfg.push( ttop, bbot, ( itm.rot || [0,0,0,1] ), ( itm.pos || [0,0,0] ) ); 
		}
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Setup Buffer to hold the Flat World Space Transform of the Bones
		this.bone_buffer = App.Buf.new_array( bt.buffer, 0, false );
		this.bone_buffer.set_interleaved( bt.get_stride_info() );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Build Capsule Mesh
		// (arc_div-1) * lathe_cnt + 1 == Dome Vert Count
		let geo 	= Capsule.geo( 10, 4, 0.5, 0 ), //Capsule.geo( lathe_cnt=8, arc_div=5, radius=0.5, height=0.25 )
			mesh	= new App.Mesh( "Proto" ),
			vao 	= new App.Vao().bind();

		mesh.buf.idx = App.Buf.new_element( geo.ind, true, false );
		vao.add_indices( mesh.buf.idx );

		mesh.buf.vert = App.Buf.new_array( geo.vert, 3, true, false );
		vao.add_buf( mesh.buf.vert, App.Shader.POS_LOC );
		
		mesh.buf.norm = App.Buf.new_array( geo.norm, 3, true, false );
		vao.add_buf( mesh.buf.norm, App.Shader.NORM_LOC );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Instanced Data 
		
		// Capsule Configuration
		mesh.buf.cfg = App.Buf
			.new_array( cfg.buffer )
			.set_interleaved( cfg.get_stride_info() );
		vao.add_interleaved( mesh.buf.cfg, [12,13,14,15], true );

		// Bone Transform ( Instanced )
		vao.add_interleaved( this.bone_buffer, [10,11], true );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Clean up VAO Building and Get Mesh Ready
		App.Vao.unbind();
		App.Buf.unbind_array().unbind_element();

		mesh.set( vao, geo.ind.length, cfg.len );	// Set VAO and Count Values to render mesh
		arm.finalize();								// Compile Bind Pose

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let mat = SHADER.new_material( "ProtoRigMat" );
		e.Draw.add( mesh, mat, App.Mesh.TRI );
	}

	update_bone_buffer(){ 
		this.bone_buffer.update( this.bone_transform.buffer );
	}
}

//#################################################################

function ProtoRigSys( ecs ){
	let ary = ecs.query_comp( "ProtoRig" );
	if( !ary ) return; // No Componets, skip.

	let i, a, e, ws, bones, flat;
	for( a of ary ){
		e = ecs.entities[ a.entity_id ];		
		if( !e.Armature.updated ) continue;

		bones	= e.Armature.bones;
		flat	= e.ProtoRig.bone_transform;
				
		for( i=0; i < bones.length; i++ ){
			ws = bones[ i ].ref.Node.world;
			flat.set( i, ws.rot, ws.pos );
		}

		e.ProtoRig.update_bone_buffer();
	}
}

//#################################################################

// #region shader

let SHADER = null;
function load_shader(){
	SHADER = App.Shader.from_src( "ProtoRig", vert_src, frag_src )
		.add_uniform_blocks( ["Global","Model"] );
}

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

	//out vec2 frag_uv;
	out vec3 frag_norm;
	out vec3 frag_cam_pos;
	out vec3 frag_pos;

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
		frag_pos		= wpos.xyz;

		frag_norm 		= quat_mul_vec3( qmul( a_cfg_rot, a_ins_rot ), a_norm );
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
	in vec3 frag_pos;

	const vec3 color 				= vec3( 1.0, 0.0, 0.0 );
	const vec3 lightPosition 		= vec3( 6.0, 10.0, 1.0 );
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
		vec3 lightVector	= normalize( lightPosition - frag_pos );		//light direction based on pixel world position
		float diffuseAngle	= max( dot( frag_norm, lightVector ) ,0.0 );	//Angle between Light Direction and Pixel Direction (1==90d)
		vec3 cDiffuse		= lightColor * diffuseAngle * uDiffuseStrength;

		out_color = vec4( color * ( cAmbient + cDiffuse ), 1.0 );
	}
`;

// #endregion

//#################################################################
export default ProtoRig;
export {};
