import App, { Mat4, Transform } from "../fungi/App.js";

let INITIAL = false;

//###################################################################################

class Bone{
	constructor( name, idx, len=1, rot=null, pos=null ){
		this.name		= name;
		this.idx		= idx;				// Index in Hierachy
		this.p_idx		= null;				// Parent index
		this.len		= len;				// Length Of Bone
		this.entity_id	= null;				// Entity of Bone.										
		this.local 		= new Transform();
		this.world		= new Transform();

		if( rot ) this.local.rot.copy( rot );
		if( pos ) this.local.pos.copy( pos );
	}
}

//###################################################################################

class Armature{
    // #region MAIN
	updated			= true;	// Process Transforms to OffsetBuf
	bones			= [];	// Array<Bone>
	names			= {};	// Map Bone Names to Bone Index, 4 Quick Searching.
	nodes			= [];	// Referene Back Bone Nodes.
	bind_pose		= null;	// Array<Mat4>
	offset_buffer	= null;	// Flat Array of Offset Mat4

	constructor(){
		if( !INITIAL ){
			INITIAL = true;
			App.ecs.systems
				.reg( ArmatureSys, 801 )
				.reg( ArmatureCleanupSys, 1000 );
		}		
	}
    // #endregion /////////////////////////////////////////////////////////////

    // #region METHODS
	add_bone( name, len=1, p_idx=null, pos=null, rot=null ){
		let idx		= this.bones.length,
			bone	= new Bone( name, idx, len, rot, pos ),
			e_id	= App.ecs.new_entity( name ),
			node	= App.ecs.add_com( e_id, "Node" );

		bone.entity_id	= e_id;		// Save eID for the bone
		this.bones.push( bone );	// Save to List
		this.nodes.push( node );	// Save Node Reference for quick access
		this.names[ name ] = idx;	// Save Mapping
		
		// Set some transform information to the Entity Nodes.
		if( rot )	node.set_rot( rot );
		if( pos )	node.set_pos( pos );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Setup Entity Hierarchy
		if( p_idx != null && this.bones[ p_idx ] ){
			let p_bone	= this.bones[ p_idx ],
				p_node	= App.ecs.get_com( p_bone.entity_id, "Node" );

			p_node.add_child( node );
			bone.p_idx = p_idx;
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		return { idx, e_id, node }; // Named Tuple
    }
    
	ready(){
		// Create Flat Data array based on bone count.
		this.offset_buffer = new Float32Array( this.bones.length * 16 );
		
		// Setup the Inverted Bind Pose
		this.compute_bind_pose();
    }
    // #endregion /////////////////////////////////////////////////////////////

    // #region COMPUTE
	compute_bind_pose(){
		let p, b, bn;

		// Create Space for all the bones.
		this.bind_pose = new Array( this.bones.length );

		for( b of this.bones ){
			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Copy current local space transform of the bone
			// TODO: May not need to do this is passing in POS/ROT when creating bones
			bn = this.nodes[ b.idx ];
			b.local.copy( bn.local );

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Compute World Space Transform for Each Bone.
			// Need the Parent's World Transform
			if( b.p_idx != null ){
				p = this.bones[ b.p_idx ];
				b.world.from_add( p.world, b.local );
			}else b.world.copy( b.local );

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Create Bind Pose for the bone ( b.world.invert )
			this.bind_pose[ b.idx ] = new Mat4()
				.from_quat_tran_scale( b.world.rot, b.world.pos, b.world.scl )
				.invert();
		}
	}

	// Should run after ALL Nodes have been process by its System.
	update_offsets(){
		let i, n, mat = new Mat4();

		for( i=0; i < this.bones.length; i++ ){
			n = this.nodes[ i ];
			if( n.updated ){
				mat.from_mul( n.model_matrix, this.bind_pose[ i ] );
				this.offset_buffer.set( mat, i*16 );
			}
		}
    }
    // #endregion /////////////////////////////////////////////////////////////
}

function ArmatureSys( ecs ){
	let ary = ecs.query_comp( "Armature" );
    if( !ary ) return;
    
    let arm, i, n, mat = new Mat4();
	for( arm of ary ){
		if( !arm.updated ) continue;
        
        //arm.update_offsets();
		for( i=0; i < arm.bones.length; i++ ){
			n = arm.nodes[ i ];
			if( n.updated ){
				mat.from_mul( n.model_matrix, arm.bind_pose[ i ] );
				arm.offset_buffer.set( mat, i*16 );
			}
        }
	}	
}

function ArmatureCleanupSys( ecs ){
	let a, ary = ecs.query_comp( "Armature" );
	if( ary == null ) return; // No Bones Loaded
	for( a of ary ) if( a.updated ) a.updated = false;
}

export default Armature;