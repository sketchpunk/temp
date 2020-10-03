import App, { Mat4, Transform } from "../fungi/App.js";
import Pose from "./Pose.js";

//###################################################################################

class Bone{
	constructor( name, idx, len=1, pos=null, rot=null ){
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

	constructor(){}
    // #endregion /////////////////////////////////////////////////////////////

    // #region METHODS
	add_bone( name, len=1, p_idx=null, pos=null, rot=null ){
		let idx		= this.bones.length,
			bone	= new Bone( name, idx, len, pos, rot ),
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
		return this;
	}
	
	load_config( config ){
		// [ { "name":"Hips", "len":0.105, "idx":0,"p_idx":null,"pos":[0,1.039,0.020], "rot":[2.4268916831715615e-7,0,0,1]  }, ]
		let i;
		for( i of config ) this.add_bone( i.name, i.len, i.p_idx, i.pos, i.rot );
		this.ready();
		return this;
	}

	attach_to_bone( bname, node ){
		let n = this.get_node( bname );
		if( n ) n.add_child( node );
		return this;
	}

	anchor_root_bones( node ){
		let i=0;
		for( i; i < this.bones.length; i++ ){
			if( this.bones[ i ].p_idx == null ) node.add_child( this.nodes[ i ] );
		}
		return this;
	}
    // #endregion /////////////////////////////////////////////////////////////

	// #region GETTERS/SETTERS
	get_node( bname ){
		let idx = this.names[ bname ];
		if( idx == null ){ console.error( "Armature.get_node - Bone name not found : %s", bname ); return null; }
		return this.nodes[ idx ];
	}

	get_bone( bname ){
		let idx = this.names[ bname ];
		if( idx == null ){ console.error( "Armature.get_bone - Bone name not found : %s", bname ); return null; }
		return this.bones[ idx ];
	}

	new_pose( name="undefined_pose" ){ return new Pose( this, name ); }

	// Serialize the Bone Data
	serialize_bones( inc_scale = false, rtn_str=true ){
		let out	= new Array( this.bones.length ),
			i 	= 0,
			b;

		for( b of this.bones ){
			out[ i ] = {
				name	: b.name,
				len		: b.len,
				idx		: b.idx,
				p_idx 	: b.p_idx,
				pos		: Array.from( b.local.pos ),
				rot		: Array.from( b.local.rot ),
			};
			if( inc_scale ) out[ i ].scl = Array.from( b.local.scl );		
			i++;
		}

		if( rtn_str ){
			let buf = "[\n";
			for( let i=0; i < out.length; i++ ){
				if( i != 0 ) buf += ",\n";
				buf += JSON.stringify( out[ i ] );
			}
			buf += "\n]";
			return buf;
		}

		return out;
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
export { ArmatureSys, ArmatureCleanupSys };