import App, { Draw }			from "../fungi/App.js";
import InterleavedFloatArray	from "../fungi/lib/InterleavedFloatArray.js";
import FlatGeo					from "../fungi/geo/FlatGeo.js";
import Vec3						from "../fungi/maths/Vec3.js";
import Quat						from "../fungi/maths/Quat.js";


class BoneConfig{
	// #region MAIN
	mode		= 0;
	scl_top		= new Vec3();
	scl_mid		= new Vec3();
	scl_bot		= new Vec3();
	pos_top		= new Vec3();
	pos_mid		= new Vec3();
	pos_bot		= new Vec3();
	base_pos	= new Vec3();
	base_rot	= new Quat();
	// #endregion////////////////////////////////////////////////////

	// #region MAIN
	serialize(){
		let ary	= [ "scl_top", "scl_mid", "scl_bot", "pos_top", "pos_mid", "pos_bot", "base_pos", "base_rot" ],
			buf	= "{mode:" + this.mode + ", ",
			i;
		
		for( i of ary ) buf += i + ":" + this[ i ].to_string( 4 ) + ", ";

		return buf.slice( 0, -2 ) + "}";
	}
	// #endregion////////////////////////////////////////////////////

	// #region MODES & SHAPES
	as_linear(){
		this.mode = 0;
		this.scl_top.set( 1,1,1 );
		this.scl_mid.set( 1,1,1 );
		this.scl_bot.set( 1,1,1 );
		this.pos_top.set( 0, 1, 0 );
		this.pos_mid.set( 0, 0, 0 );
		this.pos_bot.set( 0, 1, 0 );
		this.base_pos.reset();
		this.base_rot.reset();
		return this;
	}

	as_cap_curve(){
		this.mode = 1;
		this.scl_top.set( 1,1,1 );
		this.scl_mid.set( 1,1,1 );
		this.scl_bot.set( 1,1,1 );
		this.pos_top.set( 0, 1, 0 );
		this.pos_mid.set( 0, 0, 0 );
		this.pos_bot.set( 0, -1, 0 );
		this.base_pos.reset();
		this.base_rot.reset();
		return this;
	}

	as_full_curve(){
		this.mode = 2;
		this.scl_top.set( 1,1,1 );
		this.scl_mid.set( 1,1,1 );
		this.scl_bot.set( 1,1,1 );
		this.pos_top.set( 0, 1.5, 0 );
		this.pos_mid.set( 0, 0, 0 );
		this.pos_bot.set( 0, -1.5, 0 );
		this.base_pos.reset();
		this.base_rot.reset();
		return this;
	}

	as_shape_shere( scl=0.02 ){
		this.mode = 0;
		this.scl_top.set( scl,scl,scl );
		this.scl_mid.set( 1,1,1 );
		this.scl_bot.set( scl,scl,scl );
		this.pos_top.set( 0, 0, 0 );
		this.pos_mid.set( 0, 0, 0 );
		this.pos_bot.set( 0, 0, 0 );
		this.base_pos.reset();
		this.base_rot.reset();
		return this;
	}
	// #endregion////////////////////////////////////////////////////
}


class ProtoForm{
	armature		= null;	// Reference to Armature
	mesh			= null;	// Instanced Mesh
	trans_buffer	= null;	// Copy of World Space Pos / Rot from Armature Bones
	config_buffer	= null;	// Instance Configuration of each capsule

	constructor(){
	}

	use_armature( arm, config=null ){
		let bcnt = arm.bones.length;

		// Create Float buffer to hold our Bone Transform Data
		this.trans_buffer = new InterleavedFloatArray([
			{ name:"rot",	size:4 },
			{ name:"pos",	size:3 },
			{ name:"scl",	size:3 },
		], bcnt, 0, true );
		
		/*
		this.config_buffer = new InterleavedFloatArray([
			{ name:"top",	size:4 },
			{ name:"bot",	size:4 },
			{ name:"rot",	size:4 },
			{ name:"pos",	size:3 },
		], bcnt, 0 );
		*/

		this.config_buffer = new InterleavedFloatArray([
			{ name:"scl_top",	size:3 },
			{ name:"scl_mid",	size:3 },
			{ name:"scl_bot",	size:3 },
			{ name:"pos_top",	size:3 },
			{ name:"pos_mid",	size:3 },
			{ name:"pos_bot",	size:3 },
			{ name:"base_rot",	size:4 },
			{ name:"base_pos",	size:3 },
			{ name:"base_opt",	size:1 },
		], bcnt, 0, true );


		this.armature = arm;

		//if( config ) this.from_config( config );

		this.init();

		return this;
	}

	init(){
		let i, cfg = this.config_buffer;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Fill with Default Data
		for( i=0; i < cfg.len; i++ ){
			cfg.set( i,
				// Default for Linear Mode
				//[1,1,1], [1,1,1], [1,1,1],	// Scl
				//[0,1,0], [0,0,0], [0,1,0],	// Pos
				//[0,0,0,1], [0,0,0], 0,		// Rot, Offset, Mode
				
				// Default for Linear Mode as Small Spheres
				[0.02,0.02,0.02], [1,1,1], [0.02,0.02,0.02],	// Scl
				[0,0.02,0], [0,0,0], [0,0.02,0],	// Pos
				[0,0,0,1], [0,0,0], 0,		// Rot, Offset, Mode
			);
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let geo			= capsule_geo(); //lathe_cnt=6, arc_div=6, radius=1, side_step=5

		// Static Buffers
		let vert_buf	= App.buffer.new_array( geo.vert, 4 );
		let norm_buf	= App.buffer.new_array( geo.norm );
		let idx_buf		= App.buffer.new_element( geo.idx );
		
		// Instanced Buffers, Both set as Dynamic
		let cfg_buf		= App.buffer.new_array( this.config_buffer.buffer, this.config_buffer.stride_len, false );
		let tran_buf	= App.buffer.new_array( this.trans_buffer.buffer, this.trans_buffer.stride_len, false );

		let bconfig		= [
			// Static
			{ name:"indices",	buffer:idx_buf },
			{ name:"vertices",	buffer:vert_buf, attrib_loc:App.shader.POS_LOC, instanced:false, },
			{ name:"normal",	buffer:norm_buf, attrib_loc:App.shader.NORM_LOC, instanced:false, },
			// Instances
			{ name:"cfg",		buffer:cfg_buf, instanced:true, interleaved: this.config_buffer.generate_config( 6 ) },
			{ name:"tran",		buffer:tran_buf, instanced:true, interleaved: this.trans_buffer.generate_config( 3 ) },
		];

		this.mesh = App.mesh.from_buffer_config( bconfig, "PRMesh", geo.idx.length, cfg.len );

		return this;
	}

	set_bone_cfg( idx, cfg ){
		if( typeof( idx ) == "string" ){
			if( this.armature.names[ idx ] == undefined ){
				console.error( "Bone Name not found for setting bone config: ", idx );
				return this;
			}else idx = this.armature.names[ idx ];
		}

		this.config_buffer.set( idx,
			cfg.scl_top, cfg.scl_mid, cfg.scl_bot,
			cfg.pos_top, cfg.pos_mid, cfg.pos_bot,
			cfg.base_rot, cfg.base_pos, cfg.mode
		);

		return this;
	}

	get_bone_config( idx, cfg ){
		if( typeof( idx ) == "string" ){
			if( this.armature.names[ idx ] == undefined ){
				console.error( "Bone Name not found for setting bone config: ", idx );
				return this;
			}else idx = this.armature.names[ idx ];
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let c = this.config_buffer;
		let b = c.buffer;
		let v = c.var_config;

		idx *= c.stride_len;

		cfg.scl_top.from_buf( b, idx + v[0].offset );
		cfg.scl_mid.from_buf( b, idx + v[1].offset );
		cfg.scl_bot.from_buf( b, idx + v[2].offset );
		cfg.pos_top.from_buf( b, idx + v[3].offset );
		cfg.pos_mid.from_buf( b, idx + v[4].offset );
		cfg.pos_bot.from_buf( b, idx + v[5].offset );
		cfg.base_rot.from_buf( b, idx + v[6].offset );
		cfg.base_pos.from_buf( b, idx + v[7].offset );
		cfg.mode = b[ idx + v[8].offset ];

		return cfg;
	}

	update_config_buffer(){
		App.buffer.update_data( this.mesh.buffers.get( "cfg" ), this.config_buffer.buffer );
		return this;
	}

	// OLD
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
			{ name:"cfg", buffer:cfg_buf, instanced:true, interleaved: this.config_buffer.generate_config( 6 ) },
			{ name:"tran", buffer:tran_buf, instanced:true, interleaved: this.trans_buffer.generate_config( 3 ) },
		];

		this.mesh = App.mesh.from_buffer_config( bconfig, "PRMesh", geo.idx.length, cfg.len );

		//console.log( bconfig );
		//console.log( this.mesh );

		/**/

		return this;
	}

	get_draw_item(){ 
		let mat = App.shader.new_material( "ProtoForm" );
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
			this.trans_buffer.set( i, n.world.rot, n.world.pos, n.world.scl );
		}
	
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Update GPU Buffers
		App.buffer.update_data( buf.get( "tran" ), this.trans_buffer.buffer );
		//App.buffer.update_data( buf.get( "cfg" ), this.config_buffer.buffer );
	}
}

//#################################################################

function ProtoFormSys( ecs ){
	let a, ary = ecs.query_comp( "ProtoForm" );
	if( !ary ) return; // No Componets, skip.

	for( a of ary ){
		if( a.armature.updated ) a.update_buffers();
	}
}

//#################################################################

function capsule_geo( lathe_cnt=6, arc_div=6, radius=1, side_step=5 ){
	let i;
	let t = new Vec3();
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// BASE SHAPE FOR LATHE

	// Top Arc
	let base = FlatGeo.arc( Math.PI * 0.5, 0, arc_div, radius, 1 );
	base = base.slice( 3 );					// Remove First Vert

	let nbase = new Array();				// Create Normal Direction of Top Arc
	for( i=0; i < base.length; i+=3 ){
		t.from_buf( base, i ).norm();
		nbase.push( t[0], t[1], t[2] );
	}

	FlatGeo.vert_offset( base, 0, 1, 0 );	// Move Arc Into Position

	// Line Between Arcs
	let len			= base.length;		// How Many Verts in Arc
	let y			= 0.7;				// Copy the last point in Arc
	let x			= base[ len-3 ];
	let z			= base[ len-1 ];
	FlatGeo.line_lerp( [x,y,z], [x,-y,z], side_step, base );

	for( i=0; i <= side_step; i++ ) nbase.push( 1, 0, 0 ); // Norm Direction of side.

	// Flip the order of the arc verts and do Y Mirror
	for( i=(arc_div-1) * 3 - 1; i > 0; i -= 3){	
		base.push( base[ i-2 ], -base[ i-1 ], base[ i ] );

		t.set( base[ i-2 ], -base[ i-1 ] + 1, base[ i ] ).norm(); // Compute Normal
		nbase.push( t[0], t[1], t[2] );
	}

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// CREATE ALL VERTICES

	let verts	= FlatGeo.lathe( base, lathe_cnt, "y" );
	let norms	= FlatGeo.lathe( nbase, lathe_cnt, "y" );
	let tip_idx	= verts.length / 3; 

	// Add Top & Bottom Tip
	verts.push(
		0, radius + 1, 0,
		0, -(radius + 1), 0
	);

	norms.push( 0,1,0, 0,-1,0 ); // final points, UP / DOWN.

	/*
	for( i=0; i < verts.length / 3; i++ ){
		t.from_buf( verts, i*3 );
		tt.from_buf( norms, i*3 );

		App.Debug.ln( t, tt.add( t ) );
		//App.Debug.pnt( t, "red", 0.1 );
	}
	*/

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// CREATE INDICES

	let row_size	= base.length / 3; // How many points in each row of the lathe.
	let indices		= FlatGeo.grid_indices( row_size, lathe_cnt, 0, false, false );
	let edge_top	= new Array();
	let edge_bot	= new Array();

	// Create Array of Indexes to of the first and last edge in the shape
	for( i=0; i < lathe_cnt; i++ ){
		edge_top.push( i * row_size );
		edge_bot.push( i * row_size + row_size - 1 );
	}

	FlatGeo.fan_indices( tip_idx, edge_top, false, indices );
	FlatGeo.fan_indices( tip_idx+1, edge_bot, true, indices );

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// ASSIGN VERTEX GROUP IDS

	let fvert	= FlatGeo.to_vec4( verts );		// Convert Vec3 buffer to Vec4, for Vertex Group Indexing
	let step_h	= Math.round( side_step / 2 );	// How many points between arcs, In half
	let arc_len	= arc_div - 1;					// How Many Points in the Arc
	
	let j, idx;
	for( i=0; i < lathe_cnt; i++ ){
		// Top Dome
		idx = i * row_size;
		for( j=0; j < arc_len; j++ )	fvert[ (idx + j) * 4 + 3 ]	= 1.0;

		// Upper Cylinder
		idx += arc_len;
		for( j=0; j < step_h; j++ )		fvert[ (idx + j ) * 4 + 3 ]	= 2.0;

		// Lower Cylinder
		idx += step_h;
		for( j=0; j < step_h; j++ )		fvert[ (idx + j ) * 4 + 3 ]	= 3.0;

		// Bottom Dome
		idx += step_h;
		for( j=0; j < arc_len; j++ )	fvert[ (idx + j) * 4 + 3 ]	= 4.0;
	}

	fvert[ tip_idx * 4 + 3 ]		= 1.0;	// Top Point
	fvert[ (tip_idx+1) * 4 + 3 ]	= 4.0;	// Bot Point

	return{ vert:fvert, idx:new Uint16Array( indices ), norm:new Float32Array( norms ) };
}

//#################################################################

export default ProtoForm;
export { ProtoFormSys, BoneConfig };