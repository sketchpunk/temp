import App, { Draw }			from "../fungi/App.js";
import InterleavedFloatArray	from "../fungi/lib/InterleavedFloatArray.js";
import Capsule					from "../fungi/geo/Capsule.js";

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

function ProtoFormSys( ecs ){
	let a, ary = ecs.query_comp( "ProtoForm" );
	if( !ary ) return; // No Componets, skip.

	for( a of ary ){
		if( a.armature.updated ) a.update_buffers();
	}
}

//#################################################################

export default ProtoForm;
export { ProtoFormSys };