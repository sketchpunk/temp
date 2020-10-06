import Maths, { Quat }		from "../../fungi/maths/Maths.js"; // Vec3, Transform,
import SwingTwistSolver		from "./SwingTwistSolver.js";
//import App from "../../fungi/App.js";

class LimbSolver{

	static apply_chain( ik, chain, tpose, pose, p_wt ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// SWING & TWIST the Root Bone Toward the End Effector.
		let rot = new Quat();
		SwingTwistSolver.get_world_rot( ik, chain, tpose, p_wt, rot );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let b0		= chain.bones[ 0 ],
			b1		= chain.bones[ 1 ],
			alen	= b0.len,
			blen	= b1.len,
			clen	= ik.len,
			prot	= new Quat(),
			rad;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// FIRST BONE - X ROTATION
		rad	= Maths.lawcos_sss( alen, clen, blen );		// Get the Angle between First Bone and Target.
		rot.pmul_axis_angle( ik.axis.x, -rad );			// Use the Axis X to rotate by Radian Angle
		prot.copy( rot );								// Save For Next Bone as Starting Point.

		rot.pmul_invert( p_wt.rot );					// To Local
		pose.set_local_rot( b0.idx, rot );				// Save to Pose

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// SECOND BONE - X ROTATION
		// Need to rotate from Right to Left, So take the angle and subtract it from 180 to rotate from 
		// the other direction. Ex. L->R 70 degrees == R->L 110 degrees
		rad	= Math.PI - Maths.lawcos_sss( alen, blen, clen );
		tpose.get_local_rot( b1.idx, rot )
			.pmul( prot )								// Move tpose local rot to World Space
			.pmul_axis_angle( ik.axis.x, rad )			// Rotation that needs to be applied to bone.
			.pmul_invert( prot );						// Convert to Local Space

		pose.set_local_rot( b1.idx, rot );				// Save to Pose
	}

}

export default LimbSolver;