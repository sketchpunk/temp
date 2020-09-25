import App, { Draw } from "../fungi/App.js";

class BoneView{
	armature	= null;
	mesh		= null;
	rot_buffer	= null;
	pos_buffer	= null;
	scl_buffer	= null;

	constructor(){
	}

	use_armature( arm ){
		let b_cnt		= arm.bones.length;
		this.rot_buffer = new Float32Array( b_cnt * 4 );
		this.pos_buffer = new Float32Array( b_cnt * 3 );
		this.scl_buffer = new Float32Array( b_cnt * 3 );
		this.armature	= arm;

		build_mesh( this );
		return this;
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
			this.rot_buffer.set( n.world.rot, i*4 );
			this.pos_buffer.set( n.world.pos, i*3 );
			this.scl_buffer.set( n.world.scl, i*3 );
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Update GPU Buffers
		App.buffer.update_data( buf.get( "rot" ), this.rot_buffer );
		App.buffer.update_data( buf.get( "pos" ), this.pos_buffer );
		App.buffer.update_data( buf.get( "scl" ), this.scl_buffer );
	}

	get_draw_item( depth=false ){
		let mat = App.shader.new_material( "BoneView" ).set_depth_test( depth );
		return Draw.new_draw_item( this.mesh, mat, App.mesh.LINE );
	}

	apply_draw_item( depth=false ){
		let draw	= App.ecs.get_com( this._entity_id, "Draw" );
		let mat		= App.shader.new_material( "BoneView" ).set_depth_test( depth );
		draw.add( this.mesh, mat, App.mesh.LINE );
		return this;
	}
}

function BoneViewSys( ecs ){
	let bv, ary = ecs.query_comp( "BoneView" );
	if( ary == null ) return;
	for( bv of ary ) if( bv.armature.updated ) bv.update_buffers();
}

//####################################################################

function geo_axis(){
	const	x	= 0.035,
			z	= 0.035;

	const vert	= [
		0, 0, 0, 0,				// 0 Bottom
		0, 1, 0, 1,				// 1 Top
		x, 0, 0, 0,				// Left
		0, 0, z, 0,				// Forward
	];

	const color = [
		0.4, 0.4, 0.4,
		0.7, 0.7, 0.7,
		1, 0, 0,
		0, 0.7, 0,
	];

	const idx = [ 0, 1, 0, 2, 0, 3, 1, 2, 1, 3, 2, 3 ];

	return { vert:new Float32Array(vert), idx:new Uint16Array(idx), color:new Float32Array(color) };
}

function build_mesh( bv ){
	let arm = bv.armature;
	
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Build a float buffer of all the lengths of the bones
	let len_buf = new Float32Array( arm.bones.length );
	for( let i=0; i < arm.bones.length; i++ ) len_buf[ i ] = arm.bones[ i ].len;

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	let geo		= geo_axis();
	let config	= [
		// Static Mesh
		{ name:"indices",	data:geo.idx,	size:1, is_index:true, },
		{ name:"vertices",	data:geo.vert,	size:4, attrib_loc:App.shader.POS_LOC, },
		{ name:"color",		data:geo.color,	size:3, attrib_loc:App.shader.COLOR_LOC, },

		// Mesh Instances
		{ name:"rot",	data:bv.rot_buffer,	size:4, attrib_loc:10, is_static:false,	instanced:true, },
		{ name:"pos",	data:bv.pos_buffer,	size:3, attrib_loc:11, is_static:false,	instanced:true, },
		{ name:"scl",	data:bv.scl_buffer,	size:3, attrib_loc:12, is_static:false,	instanced:true, },
		{ name:"len",	data:len_buf,		size:1, attrib_loc:13, is_static:true,	instanced:true, },
	];

	bv.mesh = App.mesh.from_data_config( config, "BoneView", geo.idx.length, arm.bones.length );
	//bv.mesh = App.mesh.from_data_config( config, "BoneView", geo.idx.length );
	// App.mesh.LINE
}

//####################################################################
function LoadShader(){
	let sh = App.shader
		.new( "BoneView", v_src, f_src, null, App.ubo.get_array( "Global","Model" ) )
		.set_depth_test( false )
		.set_blend( true )
		.set_alpha_coverage( true );
}

let v_src = `#version 300 es
	layout(location=0) in vec4		a_pos;
	layout(location=3) in vec3		a_color;

	layout(location=10) in vec4		i_rot;
	layout(location=11) in vec3		i_pos;
	layout(location=12) in vec3 	i_scl;
	layout(location=13) in float 	i_len;

	uniform Global{ 
		mat4 proj_view; 
		mat4 camera_matrix;
		vec3 camera_pos;
		float delta_time;
		vec2 screen_size;
		float clock;
	} global;
	uniform Model{ mat4 view_matrix; } model;

	out vec3 v_color;

	vec3 quat_mul_vec( vec4 q, vec3 v ){ return v + cross(2.0 * q.xyz, cross(q.xyz, v) + q.w * v); }

	void main(void){
		vec4 w_pos	= vec4( a_pos.xyz, 1.0 ); 

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// setup bone instance position
		if( a_pos.w == 1.0 ) w_pos.y = i_len;
		//w_pos.xyz = quat_mul_vec( i_rot, w_pos.xyz * i_scl ) + i_pos;
		w_pos.xyz = quat_mul_vec( i_rot, w_pos.xyz ) * i_scl + i_pos;

		//w_pos.xyz += i_pos;
 
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		v_color		= a_color;
		w_pos		= model.view_matrix * w_pos;
		gl_Position	= global.proj_view * w_pos;
		//gl_PointSize = 10.0;
	}`;

let f_src = `#version 300 es
	precision mediump float;
	in vec3 v_color;
	out vec4 out_color;
	void main(void){ out_color = vec4( v_color, 1.0 ); }`;

//####################################################################
export default BoneView;
export { BoneViewSys, LoadShader };