
//#########################################################

class IKRig{
	constructor(){
		this.arm 	= null;		// Reference back to Armature Component
		this.tpose	= null;		// TPose or Bind Pose, TPose is better for IK
		this.pose	= null;		// Pose object to manipulate before applying to bone entities
		this.chains = {};		// Bone Chains, Usually Limbs / Spine / Hair / Tail
		this.points = {};		// Main Single Bones of the Rig, like Head / Hip / Chest
	}

	/////////////////////////////////////////////////
	// METHODS
	/////////////////////////////////////////////////
		
		apply_pose(){ this.pose.apply(); }
		update_world(){ this.pose.update_world(); }

	/////////////////////////////////////////////////
	// MANAGE RIG DATA
	/////////////////////////////////////////////////
		
		init( tpose=null, use_node_offset=false, arm_type=1 ){
			let e = App.get_e( this.entity_id );

			this.arm	= e.Armature;
			this.pose	= this.arm.new_pose();
			this.tpose	= tpose || this.arm.new_pose(); // If Passing a TPose, it must have its world space computed.

			//-----------------------------------------
			// Auto Setup the Points and Chains based on
			// Known Skeleton Structures.
			switch( arm_type ){
				case IKRig.ARM_MIXAMO : init_mixamo_rig( this.arm, this ); break;
			}

			//-----------------------------------------
			// Apply Node's Starting Transform as an offset for poses.
			// This is only important when computing World Space Transforms when
			// dealing with specific skeletons, like Mixamo stuff.
			// Need to do this to render things correctly
			if( use_node_offset ){
				let l = ( e.Obj )? e.Obj.get_transform() : e.Node.local; // Obj is a ThreeJS Component

				this.pose.set_offset( l.rot, l.pos, l.scl );
				if( !tpose ) this.tpose.set_offset( l.rot, l.pos, l.scl );
			}

			//-----------------------------------------
			// If TPose Was Created by Rig, it does not have its world
			// Space Computed. Must do this after setting offset to work right.
			if( !tpose ) this.tpose.update_world();

			return this;
		}

		add_point( name, idx ){ this.points[ name ] = { idx }; return this; }
		
		add_chain( name, name_ary, axis="z" ){
			let i, b, ch = new Chain( axis );
			for( i of name_ary ){
				b = this.pose.get_bone( i );
				ch.add_bone( b.idx, b.len );
			}
			this.chains[ name ] = ch;
			return this;
		}
} App.Components.reg( IKRig ); //This will not work well for 3JS, need to Reg Comp Differently.


//#########################################################


// CONSTANTS
IKRig.ARM_MIXAMO = 1;


//#########################################################


class Chain{
	constructor( axis="z" ){
		this.bones		= new Array();	// Index to a bone in an armature / pose
		this.len		= 0;			// Chain Length
		this.len_sqr	= 0;			// Chain Length Squared, Cached for Checks without SQRT
		this.cnt		= 0;			// How many Bones in the chain
		this.align_axis	= axis;			// Chain is aligned to which axis
	}

	add_bone( idx, len ){
		this.bones.push({ idx, len });
		this.cnt++;
		this.len		+= len;
		this.len_sqr	= this.len * this.len;
		return this;
	}
}

//#########################################################

function init_mixamo_rig( arm, rig ){
	rig
		.add_point( "hip", arm.name_map["Hips"] )
		.add_point( "head", arm.name_map["Head"] )
		.add_point( "neck", arm.name_map["Neck"] )
		.add_point( "chest", arm.name_map["Spine2"] )
		.add_point( "foot_l", arm.name_map["LeftFoot"] )
		.add_point( "foot_r", arm.name_map["RightFoot"] )

		.add_chain( "arm_r", [ "RightArm", "RightForeArm" ], "x" )
		.add_chain( "arm_l", [ "LeftArm", "LeftForeArm" ], "x" )

		.add_chain( "leg_r", [ "RightUpLeg", "RightLeg" ], "z" )
		.add_chain( "leg_l", [ "LeftUpLeg", "LeftLeg" ], "z" )

		.add_chain( "spine", [ "Spine", "Spine1", "Spine2" ], "y" )
	;
}

//#########################################################

export default IKRig;
export { Chain };