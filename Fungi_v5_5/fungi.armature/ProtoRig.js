import App, { Draw }			from "../fungi/App.js";
import InterleavedFloatArray	from "../fungi/lib/InterleavedFloatArray.js";
import Capsule					from "../fungi/geo/Capsule.js";

class ProtoRig{
	armature		= null;
	mesh			= null;	// Instanced Mesh
	trans_buffer	= null;	// Copy of World Space Pos / Rot from Armature Bones
	config_buffer	= null;	// Instance Configuration of each capsule

	constructor(){
		/*
		this.bone_transform = new InterleavedFloatArray([
			{ name:"rot",	size:4 },
			{ name:"pos",	size:3 },
		], ini_cnt, auto_ext );

		this.config = new InterleavedFloatArray([
			{ name:"top",	size:4 },
			{ name:"bot",	size:4 },
			{ name:"rot",	size:4 },
			{ name:"pos",	size:3 },
		], ini_cnt, auto_ext );
		*/

		/*
		// Flat Worldspace Transform from Armature Bones
		this.bone_transform = new InterleavedFloatArray()
			.add_var( "rot", 4 )
			.add_var( "pos", 3 );

		// Capsule Visual Configuration
		this.config = new InterleavedFloatArray()
			.add_var( "top", 4 )	// xyz = scale dome, w translate Y position
			.add_var( "bot", 4 )
			.add_var( "rot", 4 )	// Quaternion Rotation
			.add_var( "pos", 3 );	// Quaternion Rotation
		*/
	}

	use_armature( arm, config=null ){
		let bcnt = arm.bones.length;

		this.trans_buffer = new InterleavedFloatArray([
			{ name:"rot",	size:4 },
			{ name:"pos",	size:3 },
		], bcnt, 0, true );

		this.config_buffer = new InterleavedFloatArray([
			{ name:"top",	size:4 },
			{ name:"bot",	size:4 },
			{ name:"rot",	size:4 },
			{ name:"pos",	size:3 },
		], bcnt, 0 );

		this.armature = arm;

		if( config ) this.from_config( config );

		return this;
	}

	from_config( config ){
		let cfg = this.config_buffer;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Build capsule configuration buffer
		let i, usetop, usebot,
			default_pos	= [0,0,0],
			default_rot	= [0,0,0,1],
			top			= [0,0,0,0],
			bot			= [0,0,0,0];

        for( i of config ){
			//--------------------------------------
			if( i.top.length == 2 ){	// Simple Form [ scl, y ]
				top[ 0 ] = top[ 1 ] = top[ 2 ] = i.top[ 0 ];	// Scale
				top[ 3 ] = i.top[ 1 ];							// Move Y
				usetop = top;
			}else usetop = i.top;		// Complex Form [ scl_x, scl_y, scl_z, y ]

			//--------------------------------------
			if( i.bot.length == 2 ){	// Simple Form [ scl, y ]
				bot[ 0 ] = bot[ 1 ] = bot[ 2 ] = i.bot[ 0 ];	// Scale
				bot[ 3 ] = i.bot[ 1 ];							// Move Y
				usebot = bot;
			}else usebot = i.bot;		// Complex Form [ scl_x, scl_y, scl_z, y ]

			//--------------------------------------
            cfg.push( usetop, usebot, ( i.rot || default_rot ), ( i.pos || default_pos ) ); 
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

		
		// (arc_div-1) * lathe_cnt + 1 == Dome Vert Count
		let geo 	= Capsule.geo( 10, 4, 0.5, 0 ); //Capsule.geo( lathe_cnt=8, arc_div=5, radius=0.5, height=0.25 )
		
		// Static Buffers
		let vert_buf	= App.buffer.new_array( geo.vert );
		let norm_buf	= App.buffer.new_array( geo.norm );
		let idx_buf		= App.buffer.new_element( geo.idx );
		
		// Instanced Buffers
		let cfg_buf		= App.buffer.new_array( this.config_buffer.buffer, this.config_buffer.stride_len, true );
		let tran_buf	= App.buffer.new_array( this.trans_buffer.buffer, this.trans_buffer.stride_len, false );

		
		let bconfig = [
			// Static
			{ name:"indices", buffer:idx_buf },
			{ name:"vertices", buffer:vert_buf, attrib_loc:App.shader.POS_LOC, instanced:false, },
			{ name:"normal", buffer:norm_buf, attrib_loc:App.shader.NORM_LOC, instanced:false, },
			// Instances
			{ name:"cfg", buffer:cfg_buf, instanced:true, interleaved: this.config_buffer.generate_config( 12 ) },
			{ name:"tran", buffer:tran_buf, instanced:true, interleaved: this.trans_buffer.generate_config( 10 ) },
		];

		this.mesh = App.mesh.from_buffer_config( bconfig, "PRMesh", geo.idx.length, cfg.len );

		console.log( bconfig );
		console.log( this.mesh );

		/**/

		return this;
	}

	get_draw_item(){ 
		let mat = App.shader.new_material( "ProtoRig" );
		return Draw.new_draw_item( this.mesh, mat, App.mesh.TRI );
	}

	update_buffers(){
		let nodes	= this.armature.nodes,
			len		= this.armature.bones.length,
			buf 	= this.mesh.buffers,
			n;
	
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Update Local Buffers
		for( let i=0; i < len; i++ ){
			n = nodes[ i ];
			//this.rot_buffer.set( n.world.rot, i*4 );
			//this.pos_buffer.set( n.world.pos, i*3 );
			//this.scl_buffer.set( n.world.scl, i*3 );

			this.trans_buffer.set( i, n.world.rot, n.world.pos );
		}
	
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Update GPU Buffers
		App.buffer.update_data( buf.get( "tran" ), this.trans_buffer.buffer );
	}
}

//#################################################################

function ProtoRigSys( ecs ){
	let ary = ecs.query_comp( "ProtoRig" );
	if( !ary ) return; // No Componets, skip.

	let i, a, e, ws, bones, flat;
	for( a of ary ){
		if( !a.armature.updated ) continue;

		console.log( "- ProtoRigSys" );
		a.update_buffers();

		console.log( a.trans_buffer );


		/*
		e = ecs.entities[ a.entity_id ];		
		if( !e.Armature.updated ) continue;

		bones	= e.Armature.bones;
		flat	= e.ProtoRig.bone_transform;
				
		for( i=0; i < bones.length; i++ ){
			ws = bones[ i ].ref.Node.world;
			flat.set( i, ws.rot, ws.pos );
		}

		e.ProtoRig.update_bone_buffer();
		*/
	}
}


//#################################################################

// #region SHADER
function LoadShader(){
	App.shader.new( "ProtoRig", vert_src, frag_src, null, App.ubo.get_array( "Global", "Model" ) );
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

	const vec3 color 				= vec3( 1.0, 1.0, 1.0 );
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

export default ProtoRig;
export { ProtoRigSys, LoadShader };