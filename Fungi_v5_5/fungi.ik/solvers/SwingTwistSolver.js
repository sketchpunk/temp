import { Quat, Vec3, Transform } from "../../fungi/maths/Maths.js"; // Transform,
// import App from "../../fungi/App.js";

class SwingTwistSolver{
	
	// #region REGULAR CHAIN IMPLEMENTATION
	static apply_chain( ik, chain, tpose, pose, p_wt ){
		let rot = new Quat();
		this.get_world_rot( ik, chain, tpose, p_wt, rot );		// Compute IK
		rot.pmul_invert( p_wt.rot );							// To Local Space
		pose.set_local_rot( chain.first(), rot );			// Save to Pose
	}

	static get_world_rot( ik, chain, tpose, p_wt, rot ){
		let	q	= new Quat(),
			dir	= new Vec3();

		rot.from_mul( p_wt.rot, tpose.get_local_rot( chain.first() ) ); // Get WS Rotation of First Bone

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Swing
		dir.from_quat( rot, chain.effector_dir );	// Get WS Effector Direction of the Chain
		q.from_unit_vecs( dir, ik.axis.z );			// Rotation TO IK Effector Direction
		rot.pmul( q ); 								// Apply to Bone WS Rot

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Twist
		dir.from_quat( rot, chain.pole_dir );		// Get WS Pole Direction of Chain
		q.from_unit_vecs( dir, ik.axis.y );			// Rotation to IK Pole Direction
		rot.pmul( q );								// Apply to Bone WS Rot + Swing
	}
	// #endregion /////////////////////////////////////////////////////////////////////

	// #region OTHER IMPLEMENTATION
	static apply_bone( ik, b_info, tpose, pose, p_wt ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let rot 	= Quat.mul( p_wt.rot, tpose.get_local_rot( b_info.idx ) ),
			dir		= new Vec3(),
			q 		= new Quat();

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Swing
		dir.from_quat( rot, b_info.effector_dir );		// Get WS Effector Direction of the Chain
		q.from_unit_vecs( dir, ik.axis.z );				// Rotation TO IK Effector Direction
		rot.pmul( q );									// Apply to Bone WS Rot

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Twist
		dir.from_quat( rot, b_info.pole_dir );			// Get WS Pole Direction of Chain
		q.from_unit_vecs( dir, ik.axis.y );				// Rotation to IK Pole Direction
		rot.pmul( q );									// Apply to Bone WS Rot + Swing

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Finish
		rot.pmul_invert( p_wt.rot );					// To Local Space
		pose.set_local_rot( b_info.idx, rot );			// Save to Pose		
	}

	static apply_chain_ends( chain, tpose, pose, p_wt, start_effe, start_pole, end_effe, end_pole ){
		// For the spline, we have the start and end IK directions. Since spines can have various
		// amount of bones, the simplest solution is to lerp from start to finish. The first
		// spine bone is important to control offsets from the hips, and the final one usually
		// controls the chest which dictates where the arms and head are going to be located.
		// Anything between is how the spine would kind of react.

		// Since we are building up the Skeleton, We look at the pose object to know where the Hips
		// currently exist in World Space.

		let c_rot 	= new Quat();
		let rot 	= new Quat();
		let q 		= new Quat();
		let end_idx = chain.count-1;

		let ik_effe = new Vec3();
		let ik_pole = new Vec3();

		let dir	= new Vec3();

		let i, t,
			effe_dir,
			pole_dir,
			bind, 
			b_idx;

		for( i=0; i <= end_idx; i++ ){
			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Prepare for the Iteration
			b_idx	= chain.bones[ i ].idx;
			bind	= tpose.bones[ b_idx ];		// Bind Values of the Bone
			t		= ( i / end_idx ); // ** 2	// The Lerp Time, be 0 on first bone, 1 at final bone, Can use curves to distribute the lerp differently

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Lerp our Target IK Directions for this bone
			ik_effe.from_lerp( start_effe,	end_effe, t );
			ik_pole.from_lerp( start_pole,	end_pole, t );

			// Get refernce to bones Alt Directions
			effe_dir	= chain.dirs[ i ].effector;
			pole_dir	= chain.dirs[ i ].pole;

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			c_rot.from_mul( p_wt.rot, bind.local.rot );	// Get bone in WS that has yet to have any rotation applied
			dir.from_quat( c_rot, effe_dir );			// What is the WS Effector Direction
			rot
				.from_unit_vecs( dir, ik_effe )			// Create our Swing Rotation
				.mul( c_rot );							// Then Apply to our Bone, so its now swong to match the ik effector dir.

			//-----------------------
			dir.from_quat( rot, pole_dir );				// Get our Current Pole Direction from Our Effector Rotation
			q.from_unit_vecs( dir, ik_pole  );			// Create our twist rotation
			rot.pmul( q );								// Apply Twist so now it matches our IK Pole direction

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			rot.pmul_invert( p_wt.rot );				// To Local Space
			pose.set_local_rot( b_idx, rot );			// Save back to pose
			if( t != 1 ) p_wt.add( rot, bind.local.pos, bind.local.scl ); // Set WS Transform for Next Bone.
		}
	}
	// #endregion /////////////////////////////////////////////////////////////////////

}

/*
function apply_look_twist( rig, b_info, ik ){
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	let bind 	= rig.tpose.bones[ b_info.idx ],
		pose 	= rig.pose.bones[ b_info.idx ];

	// Get the bone's parent World Space Rotation.
	// Then compute the Bone's WS rotation as if its local rot
	// has not change from the initial rotation of the tpose.
	let p_rot 	= rig.pose.get_parent_rot( b_info.idx );
	let c_rot 	= Quat.mul( p_rot, bind.local.rot );
	
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Using Bone's WS Rotation, compute its Alt Forward Direction
	let now_look_dir = Vec3.transform_quat( b_info.alt_fwd, c_rot );

	// Now compute the swing rotation and apply
	// it to our bone's current WS rotation
	let rot = Quat
		.unit_vecs( now_look_dir, ik.look_dir )	// Create our Swing Rotation
		.mul( c_rot );							// Then Apply to our foot
	
	// Next we compute the current Alt Up direction from the bones
	// swing modified WS rotation. Use this direction with the IK
	// direction to create a Twist Rotation that we then apply to our bones rotation.
	let now_twist_dir	= Vec3.transform_quat( b_info.alt_up, rot );
	let twist 			= Quat.unit_vecs( now_twist_dir, ik.twist_dir  );
	rot.pmul( twist );	// Apply Twist

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	rot.pmul_invert( p_rot );					// To Local Space
	rig.pose.set_local_rot( b_info.idx, rot );	// Save to pose.		
}


function aim( chain, tpose, pose, p_wt ){
	let rot = new Quat();
	this._aim_bone2( chain, tpose, p_wt, rot );

	rot.pmul_invert( p_wt.rot ); // Convert to Bone's Local Space by mul invert of parent bone rotation
	pose.set_bone( chain.bones[ 0 ].idx, rot );
}

function _aim_bone( chain, tpose, p_wt, out ){
	let alt_fwd	= chain.alt_dir[ 0 ].fwd,
		alt_up	= chain.alt_dir[ 0 ].up,
		rot		= Quat.mul( p_wt.rot, tpose.get_local_rot( chain.first() ) ),	// Get World Space Rotation for Bone
		dir		= Vec3.transform_quat( alt_fwd, rot );					// Get Bone's WS Forward Dir

	//let ct = new Transform();
	//let b = tpose.bones[ chain.first() ];
	//ct.from_add( p_wt, b.local );
	//App.Debug.pnt( ct.pos, "white", 0.03 );
	//App.Debug.ln( ct.pos, Vec3.add( ct.pos, f_dir), "orange" );

	//Swing
	let q = Quat.unit_vecs( dir, this.axis.z );
	out.from_mul( q, rot );

	// Twist 
	//let u_dir	= Vec3.transform_quat( chain.alt_up, out );
	//let twist 	= Vec3.angle( u_dir, this.axis.y );
	//App.Debug.ln( ct.pos, Vec3.add( ct.pos, u_dir), "white" );

	dir.from_quat( out, alt_up );					// After Swing, Whats the UP Direction
	let twist 	= Vec3.angle( dir, this.axis.y );	// Get difference between Swing Up and Target Up

	if( twist <= 0.00017453292 ) twist = 0;
	else{
		//let l_dir  	= Vec3.cross( dir, this.axis.z );
		dir.from_cross( dir, this.axis.z );	// Get Swing LEFT, used to test if twist is on the negative side.
		//App.Debug.ln( ct.pos, Vec3.add( ct.pos, l_dir), "black" );

		if( Vec3.dot( dir, this.axis.y ) >= 0 ) twist = -twist; 
	}

	out.pmul_axis_angle( this.axis.z, twist );	// Apply Twist

	//if( Quat.dot( out, rot ) < 0 ) out.negate();	

	//console.log( Quat.dot( rot, out ) );
}
*/

export default SwingTwistSolver;