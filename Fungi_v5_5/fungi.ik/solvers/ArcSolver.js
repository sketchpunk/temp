import Maths, { Vec3, Quat }	from "../../fungi/maths/Maths.js"; // Transform, , Quat, 
import SwingTwistSolver	from "./SwingTwistSolver.js";
//import App from "../../fungi/App.js";

class ArcSolver{
	static apply_chain( ik, chain, tpose, pose, p_wt ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// SWING & TWIST the Root Bone Toward the End Effector.
		let rot = new Quat();
		SwingTwistSolver.get_world_rot( ik, chain, tpose, p_wt, rot );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let len_scl = ik.len / chain.len;
		let arc_ang = Maths.PI_2 * (1 - len_scl);
		let arc_inc	= arc_ang / chain.count;
		let q_inc	= Quat().setAxisAngle( ik.axis.x, arc_inc );
		let ws		= p_wt.clone();
		let q		= new Quat();
		let cb, b;
		for( cb of chain.bones ){
			b = tpose.bones[ cb.idx ];			// Get TPose Reference to Bone
			q.from_mul( ws.rot, b.local.rot );	// Convert Local to World Space
		}

		console.log( len_scl, arc_ang );
	}
}

export default ArcSolver;


	function circleArc(chain, target, pose){
		const BX1 = 0.42;	// Predefined Bezier curve control points
		const BY1 = 0.175;	// .. Point 0 and Point 3 is 0,0 and 1,0
		const BX2 = 0.98;
		const BY2 = 2.208;

		//------------------------------------
		// If over the length of the chain, straighten chain.		
		if(target.scale > 0.9999){
			IKChainSolver.fullDirection(chain, target, pose);
			return;
		}

		//------------------------------------
		// Figure out what angle the arc of a circle, then based on its normalized value
		// use a predefined bezier curve to get the proper offset on the angle which
		// helps align the arc to the target position.

		let chainPosition 	= TNode.getWorldPosition( chain.links[0] ),
			scale			= target.scale;

		if(!scale){
			scale = chainPosition.length( target.position ) / chain.length;

			//Check scale, if over length of chain, then straighten it out.
			if(scale > 0.9999){
				IKChainSolver.fullDirection(chain, target, pose);
				return;
			}
		}

		let arcAngle = Maths.PI_2 * -(1 - scale);
		arcAngle -= Maths.CBezierEase( scale, 0,0, BX1, BY1, BX2, BY2, 1,0 );

		
		//------------------------------------
		// Get starting world transform for joint chain and keep track as we traverse.
		let cnt 		= Math.min(pose.count, chain.count),
			angleInc	= -arcAngle / cnt, //Divide angle per bone for rotation increment;
			qInc 		= new Quat().setAxisAngle(target.x, angleInc);


		pose.links[0].rotation.copy( target.rotation );	// Start off By Setting the forward rotation of the bone toward the target.
		//pose.links[0].rotation.pmul( qInc );			// Then apply the first increment on it using target's X Axis Rotation
		pose.links[0].useRotation = true;

		qInc.setAxisAngle(Vec3.LEFT, angleInc); 		// With the root facing in the right direction, reset Inc with world X Axis
		for(let i = 1; i < cnt; i++){
			// Save rotation to the ik state to apply to bones later.
			pose.links[i].rotation.copy( qInc );
			pose.links[i].useRotation = true;
		}


		//------------------------------------
		//The end position usually doesn't line up with the target, so try to align it
		let endPosition = IKChainSolver.chainEndPosition( chain, pose, chainPosition );	// world position of end of chain

		IKChainSolver.alignFwdRotation(chain, target, pose, endPosition.sub(chainPosition).normalize());
	}