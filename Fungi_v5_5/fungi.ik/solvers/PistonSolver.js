import { Vec3 }			from "../../fungi/maths/Maths.js"; // Transform, , Quat, Maths, 
import SwingTwistSolver	from "./SwingTwistSolver.js";
//import App from "../../fungi/App.js";

class PistonSolver{
	static apply_chain( ik, chain, tpose, pose, p_wt ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// SWING & TWIST the Root Bone Toward the End Effector.
		SwingTwistSolver.apply_chain( ik, chain, tpose, pose, p_wt );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Check if target length is less then any bone, then compress 
		// all bones down to zero
		let b, i;
		for( b of chain.bones ){
			if( b.len >= ik.len ){
				for( i=1; i < chain.count; i++ )
					pose.set_local_pos( chain.bones[ i ].idx, Vec3.ZERO );
				return;
			}
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Bones can only shift into their parent bone. So the final bone's length in the chain isn't needed.
		// So we get the acount of space we need to retract, then divide it evenly based on the ratio of bone
		// lengths. So if Bone0 = 2 and Bone1 = 8, that means Bone0 only needs to travel 20% of the total retraction 
		// length where bone1 does 80%. 
		// Keep in mind, we travel based on parent length BUT apply change to child.

		let end_idx		= chain.count - 1,
			delta_len	= chain.len - ik.len, // How Much distance needing to move
			inc_inv		= 1 / ( chain.len - chain.bones[ end_idx ].len ), // Get Total Available Space of Movement, Inverted to remove division later
			v 			= new Vec3();

		for( i=0; i < end_idx; i++ ){
			b		= chain.bones[ i ];

			// Normalize Bone Length In relation to Total, Use that as a scale of total delta movement
			// then subtract from the bone's length, apply that length to the next bone's Position.
			v[ 1 ]	= b.len - delta_len * ( b.len * inc_inv ); 

			pose.set_local_pos( chain.bones[ i+1 ].idx, v );
		}
	}
}

export default PistonSolver;