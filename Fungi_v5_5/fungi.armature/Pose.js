import { Quat, Transform } from "../fungi/App.js";

class PoseBone{
	constructor( bone ){
		this.name		= bone.name;
		this.idx		= bone.idx;
		this.p_idx		= bone.p_idx;
		this.len 		= bone.len;
		this.local 		= new Transform( bone.local );
		this.world		= new Transform( bone.world );
		this.chg_state	= 0;
	}
}

class Pose{
	// #region MAIN
	static ROT = 1;
	static POS = 2;
	static SCL = 4;

	constructor( arm, name="UntitledPose" ){
		this.name			= name;
		this.arm			= arm;								// Reference Back to Armature, Make Apply work Easily
		this.bones			= new Array( arm.bones.length );	// Recreation of Bone Hierarchy
		this.root_offset	= new Transform();

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Create Bone Transform Hierarchy to do transformations
		// without changing the actual armature.
		for( let i=0; i < arm.bones.length; i++ ){
			this.bones[ i ] = new PoseBone( arm.bones[ i ] );
		}
	}
	// #endregion /////////////////////////////////////////////////////////

	// #region METHODS
	// Clears out root movement. XZ is customizable because of Maximo.
	clear_root_motion( x=0, z=2 ){
		let b = this.bones[ 0 ];
		if( b.chg_state & Pose.POS ){
			b.local.pos[ x ] = 0;
			b.local.pos[ z ] = 0;
		}
		return this;
	}
	
	// Copies modified Local Transforms of the Pose to the Bone Entity Node Component.
	apply(){
		let i,
			cnt = 0,
			pb, // Pose Bone
			n;	// Bone Entity Node

		for( i=0; i < this.bones.length; i++ ){
			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Check if bone has been modified in the pose
			pb = this.bones[ i ];
			if( pb.chg_state == 0 ) continue;

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Copy changes to Bone Entity
			n = this.arm.nodes[ i ];

			if( pb.chg_state & Pose.ROT ) n.local.rot.copy( pb.local.rot );
			if( pb.chg_state & Pose.POS ) n.local.pos.copy( pb.local.pos );
			if( pb.chg_state & Pose.SCL ) n.local.scl.copy( pb.local.scl );

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Update States
			n.updated		= true;
			pb.chg_state	= 0;
			cnt++;
		}

		if( cnt != 0 ) this.arm.updated = true;
		return this;
	}

	update_world(){
		for( let b of this.bones ){
			if( b.p_idx != null )	b.world.from_add( this.bones[ b.p_idx ].world, b.local ); // Parent.World + Child.Local
			else					b.world.from_add( this.root_offset, b.local );
		}
		return this;
	}
	// #endregion /////////////////////////////////////////////////////////

	// #region SETTING / GETTING
	set_local_pos( idx, v ){
		let b = this.bones[ idx ];
		b.local.pos.copy( v );
		b.chg_state |= Pose.POS;
		return this;
	}

	set_local_rot( idx, q ){
		let b = this.bones[ idx ];
		b.local.rot.copy( q );
		b.chg_state |= Pose.ROT;
		return this;
	}

	get_local_rot( idx, q=null ){
		let b = this.bones[ idx ];
		q = q || new Quat();
		q.copy( b.local.rot );
		return q;
	}

	get_bone( bname ){
		let idx = this.arm.names[ bname ];
		if( idx == null ){ console.error( "Pose.get_bone - Bone name not found : %s", bname ); return null; }
		return this.bones[ idx ];
	}

	get_node( bname ){
		let idx = this.arm.names[ bname ];
		if( idx == null ){ console.error( "Armature.get_node - Bone name not found : %s", bname ); return null; }
		return this.arm.nodes[ idx ];
	}
	// #endregion /////////////////////////////////////////////////////////
}

/*
		get_parent_world( b_idx, pt=null, ct=null, t_offset=null ){
			let cbone = this.bones[ b_idx ];
			pt = pt || new Transform();

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

			// Child is a Root Bone, just reset since there is no parent.
			if( cbone.p_idx == null ){ 
				pt.clear();
			}else{
				// Parents Exist, loop till reaching the root
				let b = this.bones[ cbone.p_idx ];
				pt.copy( b.local );

				while( b.p_idx != null ){
					b = this.bones[ b.p_idx ];
					pt.add_rev( b.local );
				}
			}

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			
			pt.add_rev( this.root_offset );				// Add Starting Offset
			if( t_offset ) pt.add_rev( t_offset );		// Add Additional Starting Offset

			if( ct ) ct.from_add( pt, cbone.local );	// Requesting Child WS Info Too

			return pt;
		}

		get_parent_rot( b_idx, q=null ){
			let cbone = this.bones[ b_idx ];
			q = q || new Quat();

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Child is a Root Bone, just reset since there is no parent.
			if( cbone.p_idx == null ) q.reset();
			else{
				// Parents Exist, loop till reaching the root
				let b = this.bones[ cbone.p_idx ];
				q.copy( b.local.rot );

				while( b.p_idx != null ){
					b = this.bones[ b.p_idx ];
					q.pmul( b.local.rot );
				}
			}

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			q.pmul( this.root_offset.rot ); // Add Starting Offset
			return q;
		}

*/


export default Pose;