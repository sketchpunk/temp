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
class ArcSolver{

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
		// Use the IK Length Scale to get the Arc angle out of 360 Degrees
		// The Angle isn't perfect, but adding a curved offset fixes things up.
		let arc_ang = Maths.PI_2 * (1 - len_scl) + get_offset( len_scl );
		
		// Divide the Arc Angle how many bones on the chain.
		let arc_inc	= arc_ang / chain.count;

		// Use IK X Axis and Negative Arc Angle Increment as our Rotation
		// to apply to each bone/
		let q_inc	= Quat.axis_angle( ik.axis.x, -arc_inc );
		let ws		= p_wt.clone();
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Handle the First Bone in the chain, Need to Store
		// The local rotation to use later in the alignment
		let b, i;
		b = tpose.bones[ chain.bones[ 0 ].idx ];
		q	.pmul( q_inc )
			.pmul_invert( ws.rot );				// Apply Inc to WS Root

		pose.set_local_rot( b.idx, q );			// Save to Pose
		ws.add( q, b.local.pos, b.local.scl );	// Set as new Parent Transform

		let root_ls = q.clone();				// Root LS Rot, Save for Alignment

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		for( i=1; i < chain.count; i++ ){
			b	= tpose.bones[ chain.bones[ i ].idx ];	// Get TPose Reference to Bone
			q
				.from_mul( ws.rot, b.local.rot )		// Convert Local to World Space
				.pmul( q_inc )							// Add Increment
				.pmul_invert( ws.rot );					// To Local Space

			pose.set_local_rot( b.idx, q );
			ws.add( q, b.local.pos, b.local.scl );
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Align the Arc so that its end point it in the same
		// direction as the end effector.
		let end_pos	= new Vec3( 0, b.len, 0 );				// Tail Local Position.
		let end_dir = new Vec3();							// Direction from IK Start to Current End of Chain

		ws.transform_vec( end_pos );						// WS of Last Bone's Tail Position
		end_dir.from_sub( end_pos, ik.start_pos ).norm();	// Direction from Start to end of arc

		q	.from_unit_vecs( end_dir, ik.axis.z )			// Rotation For Alignment
			.pmul_invert( p_wt.rot )						// Move it to Root's Local Space
			.mul( root_ls );								// Apply to LS Root Rotation

		pose.set_local_rot( chain.bones[ 0 ].idx, q );		// Save to Pose
	}

/*
	static bsearch_offset( ik, chain, tpose, pose, p_wt ){
		let a = 0;
		let b = Math.PI;
		let m;
		let pos, len;

		let len_scl = ik.len / chain.len;

		// if scale is <= 0.03 there is no need for an offset.

		console.log( "---------------------" );
		for( let i=0; i < 30; i++ ){
			m	= (b - a) * 0.5 + a;

			if( len_scl <= 0.03 ) m = 0;

			m = 0;
			pos	= this.apply_chain( ik, chain, tpose, pose, p_wt, m );
			len = pos[ 1 ] - ik.end_pos[ 1 ];

			console.log( i, m, len, "Range", a, b, "SCALE", len_scl );

			if( Math.abs( len ) < 0.0001 ){
				console.log( "OFFSET", i, m, "SCALE", len_scl );
				return;
			}

			if( len < 0 )	b = m;
			else			a = m;

			console.log( "OFFSET", i, m, "SCALE", len_scl );
			break;
		}

		console.log( "OVER" );
	}

	static apply_chain_BSearch( ik, chain, tpose, pose, p_wt, ang_offset ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// SWING & TWIST the Root Bone Toward the End Effector.
		let q = new Quat();
		//SwingTwistSolver.get_world_rot( ik, chain, tpose, p_wt, q );
		App.Debug.reset();
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let len_scl = ik.len / chain.len;
		let arc_ang = Maths.PI_2 * -(1 - len_scl);

		arc_ang -= ang_offset;

		let arc_inc	= arc_ang / chain.count;
		let q_inc	= Quat.axis_angle( ik.axis.x, arc_inc );
		let ws		= p_wt.clone();
		let b, i;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Handle the First Bone in the chain, Need to Store
		// The local rotation to use later in the alignment
		b = tpose.bones[ chain.bones[ 0 ].idx ];
		q.pmul( q_inc ).pmul_invert( ws.rot );		// Apply Inc to WS Root
		pose.set_local_rot( b.idx, q );				// Save to Pose
		ws.add( q, b.local.pos, b.local.scl );		// Set as new Parent Transform

		let root_ls = q.clone();					// Root LS Rot, Save for Alignment

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		for( i=1; i < chain.count; i++ ){
			b	= tpose.bones[ chain.bones[ i ].idx ];	// Get TPose Reference to Bone
			q
				.from_mul( ws.rot, b.local.rot )		// Convert Local to World Space
				.pmul( q_inc )							// Add Increment
				.pmul_invert( ws.rot );					// To Local Space

			pose.set_local_rot( b.idx, q );
			ws.add( q, b.local.pos, b.local.scl );
			//App.Debug.pnt( ws.pos );
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Align the Arc so that its end point it in the same
		// direction as the end effector.
		let end_pos	= new Vec3( 0, b.len, 0 );
		let end_dir = new Vec3();

		ws.transform_vec( end_pos );	// WS Off Last Bone's Tail Position
		end_dir.from_sub( end_pos, ik.start_pos ).norm();	// Direction from Start to end of arc

		q	.from_unit_vecs( end_dir, ik.axis.z )	// Rotation For Alignment
			.pmul_invert( p_wt.rot )				// Move it to Root's Local Space
			.mul( root_ls );						// Apply to LS Root Rotation

		pose.set_local_rot( chain.bones[ 0 ].idx, q );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		ws.copy( p_wt );
		for( b of chain.bones ){
			ws.add( pose.bones[ b.idx ].local );
			//App.Debug.pnt( ws.pos, "red" );
		}
		ws.transform_vec( end_pos.set( 0, b.len, 0 ) );

		//App.Debug.pnt( end_pos, "green" );
		//App.Debug.pnt( ik.start_pos, "green" );

		return end_pos;
	}
*/
}

export default ArcSolver;