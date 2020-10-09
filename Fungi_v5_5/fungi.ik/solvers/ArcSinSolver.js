import Maths, { Vec3, Quat }	from "../../fungi/maths/Maths.js"; // Transform, , Quat, 
import SwingTwistSolver	from "./SwingTwistSolver.js";
//import App from "../../fungi/App.js";

//##############################################################################
// if Scale <= 0.3 or >= 1, Offset is zero
// 20 Samples between 0 to 1 of PI*2.
const OFFSETS = [ 0, 0.025, 0.07, 0.12808739578845105, 0.19558255045541925, 0.2707476090618156, 0.35128160042581186,
0.43488355336557927, 0.5192524966992895, 0.6051554208208854, 0.6887573737606529, 0.7692913651246491, 0.8444564237310455,
0.9119515783980137, 0.9694758579437253, 1.0124273200045233, 1.034670041428865, 1.026233147095494, 0.966407896367954,
0.8053399136399616, 0 ];

function get_offset( t ){
	if( t <= 0.03 || t >= 1 ) return 0;

	let i		= 20 * t;		
	let idx		= Math.floor( i );
	let fract	= i - idx;

	let a		= OFFSETS[ idx ];
	let b		= OFFSETS[ idx+1 ];
	return a * (1-fract) + b * fract;
}

//##############################################################################
class ArcSinSolver{
	static apply_slice( ik, ia, ib, chain, start_pos, end_pos, tpose, pose, p_wt, dir, initial_rot=null ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Compute the Length of the Chain Slice
		let slice_cnt = ib-ia+1,
			slice_len = 0,
			i;

		for( i=ia; i <= ib; i++ ) slice_len += chain.bones[ i ].len;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let len_scl = Vec3.len( start_pos, end_pos ) / slice_len;			// Normalize Distance
		let arc_ang = Maths.PI_2 * (1 - len_scl) + get_offset( len_scl );	// Total Arc Angle
		let arc_inc	= arc_ang / slice_cnt;									// Angle Per Bone
		let q_inc	= Quat.axis_angle( ik.axis.x, arc_inc * dir );			// Quat Rotation on IK X Axis
		let ws		= p_wt.clone();											// Build WS Transform

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let b, q	= new Quat();
		let root_ws	= new Quat();	// Save WS Rotation of the First Bone for Alignment use 

		for( i=ia; i <= ib; i++ ){
			b	= tpose.bones[ chain.bones[ i ].idx ];	// Get TPose Reference to Bone

			// Convert Local to World Space, Or load in initial root bone rotation
			if( i != ia || !initial_rot )		q.from_mul( ws.rot, b.local.rot );
			else if( i == ia && initial_rot )	q.copy( initial_rot );
			
			q.pmul( q_inc )								// Add Increment
			
			if( i == ia ) root_ws.copy( q );			// Save Initial WS Rotation of Initial Bone
			
			q.pmul_invert( ws.rot );					// To Local Space
			pose.set_local_rot( b.idx, q );				// Save Rotation to Pose
			ws.add( q, b.local.pos, b.local.scl );		// Save WS transform for next iteration			
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Align the Arc so that its end point it in the same
		// direction as the end effector.
		let tail_pos	= new Vec3( 0, b.len, 0 );			// Tail Local Position.
		let tail_dir	= new Vec3();						// Direction from IK Start to Current End of Chain

		ws.transform_vec( tail_pos );						// WS of Last Bone's Tail Position
		tail_dir.from_sub( tail_pos, start_pos ).norm();	// Direction from Start to end of arc

		q	.from_unit_vecs( tail_dir, ik.axis.z )			// Rotation For Alignment
			.mul( root_ws )									// Apply alignment to Root bone WS Rotation
			.pmul_invert( p_wt.rot )						// To Local Space

		pose.set_local_rot( chain.bones[ ia ].idx, q );		// Save to Pose
	}

	static apply_chain( ik, chain, tpose, pose, p_wt ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// SWING & TWIST the Root Bone Toward the End Effector.
		let q = new Quat();
		SwingTwistSolver.get_world_rot( ik, chain, tpose, p_wt, q );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// If IK Target is at or over the chain length,
		// Just Apply SwingTwist to Root Bone.
		let len_scl = ik.len / chain.len;	// Normalize IK Length from Chain Length
		if( len_scl >= 0.999 ){
			pose.set_local_rot(
				chain.bones[ 0 ].idx,
				q.pmul_invert( p_wt.rot )
			);
			return;
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Split the IK target into Two.
		// The idea is place the first half of the bones to the mid point of our IK Target
		// Then do the same thing for the second half but invert the angle of rotation.
		let mid_pos = Vec3.lerp( ik.start_pos, ik.end_pos, 0.5 );
		let mid_idx = Math.floor( chain.count / 2 ) - 1;	// The end bone index of First Arc

		// First Arc
		this.apply_slice( ik, 0, mid_idx, chain, ik.start_pos, mid_pos, tpose, pose, p_wt, -1, q );

		// Compute the new Parent WS Transform as a starting point for the second Arc
		for( let i=0; i <= 3; i++ ){
			p_wt.add( pose.bones[ chain.bones[i].idx ].local );
		}

		// Second Arc
		this.apply_slice( ik, mid_idx+1, chain.count-1, chain, mid_pos, ik.end_pos, tpose, pose, p_wt, 1 );
	}
}

export default ArcSinSolver;