import Maths, { Quat }	from "../../fungi/maths/Maths.js"; // Transform, , Vec3
import SwingTwistSolver	from "./SwingTwistSolver.js";
//import App from "../../fungi/App.js";

// Get the length of the bones, the calculate the ratio length for the bones based on the chain length
// The 3 bones when placed in a zig-zag pattern creates a Parallelogram shape. We can break the shape down into two triangles
// By using the ratio of the Target length divided between the 2 triangles, then using the first bone + half of the second bound
// to solve for the top 2 joiints, then using the half of the second bone + 3rd bone to solve for the bottom joint.
// If all bones are equal length,  then we only need to use half of the target length and only test one triangle and use that for
// both triangles, but if bones are uneven, then we need to solve an angle for each triangle which this function does.	

class ZSolver{

	static apply_chain( ik, chain, tpose, pose, p_wt ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// SWING & TWIST the Root Bone Toward the End Effector.
		let rot = new Quat();
		SwingTwistSolver.get_world_rot( ik, chain, tpose, p_wt, rot );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let b0		= chain.bones[ 0 ],
			b1		= chain.bones[ 1 ],
			b2		= chain.bones[ 2 ],
			a_len	= b0.len,				// Length of First 3 Bones of Chain
			b_len	= b1.len,
			c_len	= b2.len,
			mh_len	= b1.len * 0.5,			// Half the length of the middle bone.

			// How much to subdivide the Target length between the two triangles
			t_ratio	= ( a_len + mh_len ) / ( a_len + b_len + c_len ),	
			ta_len	= ik.len * t_ratio,	// Long Side Length for First Triangle : 0 & 1
			tb_len	= ik.len - ta_len,	// Long Side Length for Second Triangle : 1 & 2

			prot	= new Quat(),
			prot2	= new Quat(),
			rad;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// FIRST BONE  a_len, ta_len, bh_len
		rad	= Maths.lawcos_sss( a_len, ta_len, mh_len );	// Get the Angle between First Bone and Target.
		rot.pmul_axis_angle( ik.axis.x, -rad );				// Use the Axis X to rotate by Radian Angle
		prot.copy( rot );									// Save For Next Bone as Starting Point.

		rot.pmul_invert( p_wt.rot );						// To Local
		pose.set_local_rot( b0.idx, rot );					// Save to Pose

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// SECOND BONE
		rad	= Math.PI - Maths.lawcos_sss( a_len, mh_len, ta_len );
		tpose.get_local_rot( b1.idx, rot )
			.pmul( prot )								// Move tpose local rot to World Space
			.pmul_axis_angle( ik.axis.x, rad );			// Rotation that needs to be applied to bone.
		
		prot2.copy( rot );								// Save for next bone
		rot.pmul_invert( prot );						// Convert to Local Space

		pose.set_local_rot( b1.idx, rot );				// Save to Pose
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// THIRD BONE
		rad	= Math.PI - Maths.lawcos_sss( c_len, mh_len, tb_len );
		tpose.get_local_rot( b2.idx, rot )
			.pmul( prot2 )								// Move tpose local rot to World Space
			.pmul_axis_angle( ik.axis.x, -rad )			// Rotation that needs to be applied to bone.
			.pmul_invert( prot2 );						// Convert to Local Space

		pose.set_local_rot( b2.idx, rot );				// Save to Pose
	}

}

export default ZSolver;