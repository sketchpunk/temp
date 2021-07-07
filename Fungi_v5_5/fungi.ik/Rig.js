import Chain, { ChainEnds }	from "./Chain.js";
import Point	from "./Point.js";
import Vec3		from "../fungi/maths/Vec3.js";
import BoneMap	from "../fungi.armature/BoneMap.js";
import App from "../fungi/App.js";

//=========================================================================

class RigItem{
	value	= null;
	solver	= null;
	//end_idx	= null;

	constructor( item ){
		this.value = item;
	}
}

//=========================================================================

class Rig{
	// #region MAIN
	arm 	= null;		// Reference back to Armature Component
	tpose	= null;		// TPose or Bind Pose, TPose is better for IK
	pose	= null;		// Pose object to manipulate before applying to bone entities
	items	= {};		// Point and Chains

	use_armature( arm, tpose=null ){
		this.arm	= arm;
		this.pose	= arm.new_pose( "rig_pose" );
		this.tpose	= ( tpose )? tpose : arm.new_pose( "rig_tpose" );

		//-----------------------------------------
		// If TPose was self created, it does not have its world space Computed.
		if( !tpose ) this.tpose.update_world();

		return this;
	}

	auto_rig(){
		let bMap = BoneMap.of_armature( this.arm, false );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// POINTS
		let i, pAry = [ "hip", "head", "neck", "foot_l", "foot_r" ];
		for( i of pAry ){
			if( bMap[i] ) this.add_point( i, bMap[i] );
			else		  console.log( `-- AutoRig : ${i} is Missing` );
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// ARMS
		if( bMap.upperarm_l && bMap.forearm_l && bMap.hand_l ){
			this.add_chain( "arm_l", [ bMap.upperarm_l, bMap.forearm_l ], bMap.hand_l );
		}else console.log( `-- AutoRig : Left Arm is Missing` );

		if( bMap.upperarm_r && bMap.forearm_r && bMap.hand_r ){
			this.add_chain( "arm_r", [ bMap.upperarm_r, bMap.forearm_r ], bMap.hand_r );
		}else console.log( `-- AutoRig : Right Arm is Missing` );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// LEGS
		if( bMap.thigh_l && bMap.shin_l ){  //&& bMap.foot_l
			this.add_chain( "leg_l", [ bMap.thigh_l, bMap.shin_l ], bMap.foot_l );
		}else console.log( `-- AutoRig : Left Leg is Missing` );

		if( bMap.thigh_r && bMap.shin_r ){ //&& bMap.foot_r
			this.add_chain( "leg_r", [ bMap.thigh_r, bMap.shin_r ], bMap.foot_r );
		}else console.log( `-- AutoRig : Right Leg is Missing` );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// SPINE
		if( bMap.spine && bMap.spine.length >= 2 ){
			this.add_chain_ends( "spine", bMap.spine );
			this.add_point( "chest", bMap.spine[ bMap.spine.length-1 ] );
		}else console.log( `-- AutoRig : Spine is Missing` );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Setup ALT-Directions
		this.get( "leg_l" ).set_directions( Vec3.DOWN, Vec3.FORWARD, this.tpose );
		this.get( "leg_r" ).set_directions( Vec3.DOWN, Vec3.FORWARD, this.tpose );
		this.get( "arm_r" ).set_directions( Vec3.RIGHT, Vec3.BACK, this.tpose );
		this.get( "arm_l" ).set_directions( Vec3.LEFT, Vec3.BACK, this.tpose );

		this.get( "spine" ).set_directions( Vec3.UP, Vec3.FORWARD, this.tpose, true );

		this.get( "hip" ).set_directions( Vec3.FORWARD, Vec3.UP, this.tpose );
		if( bMap.foot_l ) this.get( "foot_l" )?.set_directions( Vec3.FORWARD, Vec3.UP, this.tpose );
		if( bMap.foot_r ) this.get( "foot_r" )?.set_directions( Vec3.FORWARD, Vec3.UP, this.tpose );

		this.get( "neck" ).set_directions( Vec3.FORWARD, Vec3.UP, this.tpose );
		this.get( "head" ).set_directions( Vec3.FORWARD, Vec3.UP, this.tpose );

		return this;
	}
	// #endregion ////////////////////////////////////////////////////

	// #region METHODS
	add_point( name, b_name ){
		let b = this.tpose.get_bone( b_name );
		this.items[ name ] = new RigItem( new Point( b.idx, b.len ) );
		return this;
	}
	
	add_chain( name, name_ary, leaf_name=null ){
		let i, b, ch = new Chain(); // axis

		for( i of name_ary ){
			b = this.tpose.get_bone( i );
			ch.add_bone( b.idx, b.len );
		}

		// Get Leaf Bone Index if the chain requires it.
		if( leaf_name ) ch.leaf_idx = this.tpose.get_bone( leaf_name ).idx;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.items[ name ] = new RigItem( ch );
		return this;
	}

	add_chain_ends( name, name_ary ){
		let i, b, ch = new ChainEnds(); // axis

		for( i of name_ary ){
			b = this.tpose.get_bone( i );
			ch.add_bone( b.idx, b.len );
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.items[ name ] = new RigItem( ch );
		return this;
	}

	get( name ){ return this.items[ name ].value; }
	get_solver( name, default_solver=null ){ return this.items[ name ].solver || default_solver; }
	set_solver( name, solver ){ this.items[ name ].solver = solver; return this; }
	set_chain_max( name, len ){ this.items[ name ].value.len_max = len; return this; }
	
	set_tpose_offset( tr ){	this.tpose.root_offset.copy( tr );	return this; }
	set_pose_offset( tr ){	this.pose.root_offset.copy( tr );	return this; }

	apply_pose(){ this.pose.apply(); return this; }
	// #endregion ////////////////////////////////////////////////////
	
	// #region SETUP
	use_maximo(){
		this
		.add_point( "hip", "Hips" )
		.add_point( "head", "Head" )
		.add_point( "neck", "Neck" )
		.add_point( "chest", "Spine2" )
		.add_point( "foot_l", "LeftFoot" )
		.add_point( "foot_r", "RightFoot" )
		.add_chain( "arm_r", [ "RightArm", "RightForeArm" ], "RightHand" )
		.add_chain( "arm_l", [ "LeftArm", "LeftForeArm" ], "LeftHand" )
		.add_chain( "leg_r", [ "RightUpLeg", "RightLeg" ], "RightFoot" )
		.add_chain( "leg_l", [ "LeftUpLeg", "LeftLeg" ], "LeftFoot" ) 
		.add_chain_ends( "spine", [ "Spine", "Spine1", "Spine2" ] );

		// Set Direction of Joints on th Limbs
		this.get( "leg_l" ).set_directions( Vec3.DOWN, Vec3.FORWARD, this.tpose );
		this.get( "leg_r" ).set_directions( Vec3.DOWN, Vec3.FORWARD, this.tpose );
		this.get( "arm_r" ).set_directions( Vec3.RIGHT, Vec3.BACK, this.tpose );
		this.get( "arm_l" ).set_directions( Vec3.LEFT, Vec3.BACK, this.tpose );

		this.get( "spine" ).set_directions( Vec3.UP, Vec3.FORWARD, this.tpose, true );

		this.get( "hip" ).set_directions( Vec3.FORWARD, Vec3.UP, this.tpose );
		this.get( "foot_l" ).set_directions( Vec3.FORWARD, Vec3.UP, this.tpose );
		this.get( "foot_r" ).set_directions( Vec3.FORWARD, Vec3.UP, this.tpose );

		this.get( "neck" ).set_directions( Vec3.FORWARD, Vec3.UP, this.tpose );
		this.get( "head" ).set_directions( Vec3.FORWARD, Vec3.UP, this.tpose );
		
		return this;
	}
	// #endregion ////////////////////////////////////////////////////
}

//=========================================================================
export default Rig;