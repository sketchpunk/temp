import { Vec3, Quat } from "../../fungi/App.js";

class Chain{
	// #region MAIN
	bones		= new Array();	// Index to a bone in an armature / pose
	len			= 0;			// Chain Length
	len_sqr		= 0;			// Chain Length Squared, Cached for Checks without SQRT
	len_limit	= 0;			// Limit the Length of the chain.
	bone_cnt	= 0;			// How many Bones in the chain
	end_idx 	= null;			// Joint that Marks the true end of the chain
	
	// Alternate Direction and IK Stuff
	alt_fwd 	= Vec3.FORWARD.clone();
	alt_up		= Vec3.UP.clone();
	ik_solver 	= null;
	// #endregion ////////////////////////////////////////////////

	// #region GETTERS / SETTERS
	add_bone( idx, len ){
		let o = { idx, len };

		this.bones.push( o );
		this.bone_cnt++;
		this.len		+= len;
		this.len_sqr	= this.len * this.len;
		return this;
	}

	// Get Skeleton Index of Bones
	first(){ return this.bones[0].idx; }
	last(){ return this.bones[ this.bone_cnt-1 ].idx; }
	idx( i ){ return this.bones[ i ].idx; }

	set_alt( fwd, up, tpose=null ){
		if( tpose ){
			let b = tpose.bones[ this.bones[ 0 ].idx ],
				q = Quat.invert( b.world.rot );	// Invert World Space Rotation 

			this.alt_fwd.from_quat( q, fwd );	// Use invert to get direction that will Recreate the real direction
			this.alt_up.from_quat( q, up );	
		}else{
			this.alt_fwd.copy( fwd );
			this.alt_up.copy( up );
		}
		return this;
	}
	// #endregion ////////////////////////////////////////////////
}

class Point{
	// #region MAIN
	idx		= null;
	len		= 0;

	// Alternate Direction and IK Stuff
	alt_fwd = Vec3.FORWARD.clone();
	alt_up	= Vec3.UP.clone();

	constructor( idx, len ){
		this.idx = idx;
		this.len = len;
	}
	// #endregion ////////////////////////////////////////////////

	// #region GETTERS / SETTERS
	set_alt( fwd, up, tpose=null ){
		if( tpose ){
			let b = tpose.bones[ this.idx ],
				q = Quat.invert( b.world.rot );	// Invert World Space Rotation 

			this.alt_fwd.from_quat( q, fwd );	// Use invert to get direction that will Recreate the real direction
			this.alt_up.from_quat( q, up );	
		}else{
			this.alt_fwd.copy( fwd );
			this.alt_up.copy( up );
		}
		return this;
	}
	// #endregion ////////////////////////////////////////////////
}

class IKRig{
	arm 	= null;		// Reference back to Armature Component
	tpose	= null;		// TPose or Bind Pose, TPose is better for IK
	pose	= null;		// Pose object to manipulate before applying to bone entities
	chains	= {};		// Bone Chains, Usually Limbs / Spine / Hair / Tail
	points	= {};		// Main Single Bones of the Rig, like Head / Hip / Chest

	use_armature( arm, tpose=null ){
		this.arm	= arm;
		this.pose	= arm.new_pose( "ikrig_pose" );
		this.tpose	= ( tpose )? tpose : arm.new_pose();

		//-----------------------------------------
		// If TPose was self created, it does not have its world space Computed.
		if( !tpose ) this.tpose.update_world();

		return this;
	}

	use_maximo(){
		this
		.add_point( "hip", "Hips" )
		.add_point( "head", "Head" )
		.add_point( "neck", "Neck" )
		.add_point( "chest", "Spine2" )
		.add_point( "foot_l", "LeftFoot" )
		.add_point( "foot_r", "RightFoot" )
		.add_chain( "arm_r", [ "RightArm", "RightForeArm" ],  "RightHand" )
		.add_chain( "arm_l", [ "LeftArm", "LeftForeArm" ], "LeftHand" )
		.add_chain( "leg_r", [ "RightUpLeg", "RightLeg" ], "RightFoot" )
		.add_chain( "leg_l", [ "LeftUpLeg", "LeftLeg" ], "LeftFoot" ) 
		.add_chain( "spine", [ "Spine", "Spine1", "Spine2" ] );

		// Set Direction of Joints on th Limbs
		this.chains.leg_l.set_alt( Vec3.DOWN, Vec3.FORWARD, this.tpose );
		this.chains.leg_r.set_alt( Vec3.DOWN, Vec3.FORWARD, this.tpose );
		this.chains.arm_r.set_alt( Vec3.RIGHT, Vec3.BACK, this.tpose );
		this.chains.arm_l.set_alt( Vec3.LEFT, Vec3.BACK, this.tpose );

		this.points.hip.set_alt( Vec3.FORWARD, Vec3.UP, this.tpose );
		return this;
	}

	// #region MANAGE POINTS AND CHAINS
	add_point( name, b_name ){
		let b = this.tpose.get_bone( b_name );
		this.points[ name ] = new Point( b.idx, b.len );
		return this;
	}
	
	add_chain( name, name_ary, end_name=null, ik_solver=null ){
		let i, b, ch = new Chain(); // axis
		for( i of name_ary ){
			b = this.tpose.get_bone( i );
			ch.add_bone( b.idx, b.len );
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		if( end_name ){
			ch.end_idx = this.tpose.get_bone( end_name ).idx;
		}

		ch.ik_solver = ik_solver;

		this.chains[ name ] = ch;
		return this;
	}
	// #endregion /////////////////////////////////////////////////////////
}

export default IKRig;
export { Chain };