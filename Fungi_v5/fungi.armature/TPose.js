import Vec3 			from "../../fungi/maths/Vec3.js";
import Quat 			from "../../fungi/maths/Quat.js";
import Transform 		from "../../fungi/maths/Transform.js";


class TPose{
	static new( e ){
		let p = new TPose();
		p.pose = e.Armature.new_pose();
		return p;
	}

	constructor(){ this.pose = null; }

	align_leg( b_names ){  align_chain( this.pose, Vec3.DOWN, b_names ); return this; }
	align_arm_left( b_names ){ align_chain( this.pose, Vec3.LEFT, b_names ); return this; }
	align_arm_right( b_names ){ align_chain( this.pose, Vec3.RIGHT, b_names ); return this; }
	align_foot( b_name ){ align_foot_forward( this.pose, b_name ); return this; }

	build(){ let p = this.pose; this.pose = null; return p; }
}


function align_chain( pose, dir, b_names ){
	let pt		= new Transform(),				// Parent Transform ( Current Bone's Parent );
		ct		= new Transform(),				// Child Transform ( Current Bone )
		aEnd	= b_names.length - 1,				// End Index
		f		= new Vec3(),					// Forward
		u		= new Vec3( dir ),				// Up
		l		= new Vec3(),					// Left
		r		= new Quat(),					// Final Rotation
		q		= new Quat(),					// Temp Rotation
		b 		= pose.get_bone( b_names[0] );	// Bone Reference
		
	// Parent Bone's Transform
	pose.get_parent_world( b.idx, pt );

	for( let i=0; i <= aEnd; i++ ){
		ct.from_add( pt, b.local );			// Calc current bones world transform

		/*

		console.log( b );
		App.Debug.pnt( pt.pos );
		App.Debug.pnt( ct.pos, "green" );
		App.Debug.quat( ct.rot, ct.pos );

		return;
		*/

		//App.debug
		//	.point( ct.pos, 2 )
		//	.line( ct.pos, Vec3.add( ct.pos, dir), 0 );
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Up direction is where we need the bone to point to.
		// We then get the bone's current forward direction, use it
		// to get its left, then finish it off by recalculating
		// fwd to make it orthogonal. Want to try to keep the orientation
		// while ( fwd, lft ) realigning the up direction.
		f.from_quat( ct.rot, Vec3.FORWARD ); 		// Find Bone's Forward World Direction
		l.from_cross( u, f ).norm();				// Get World Left
		f.from_cross( l, u ).norm();				// Realign Forward
		r.from_axis( l, u, f );						// Create Rotation from 3x3 rot Matrix
		
		if( Quat.dot( r, ct.rot ) < 0 ) r.negate();	// Do a Inverted rotation check, negate it if under zero.
		
		//r.pmul( q.from_invert( pt.rot ) );		// Move rotation to local space
		r.pmul_invert( pt.rot );					// Move rotation to local space
		pose.set_bone( b.idx, r );					// Update Pose with new ls rotation
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// If not the last bone, take then the new rotation to calc the next parents
		// world space transform for the next bone on the list.
		if( i != aEnd){
			pt.add( r, b.local.pos, b.local.scl );
			b = pose.get_bone( b_names[i+1] );
		}
	}
}


function align_foot_forward( pose, foot ){
	let pt	= new Transform(),
		ct	= new Transform(),
		v	= new Vec3(),
		q	= new Quat(),
		b	= pose.get_bone( foot );

	pose.get_parent_world( b.idx, pt, ct );	// Get the Parent and Child Transforms. e.Armature,
	
	ct.transform_vec( [0,b.len,0], v );			// Get the Tails of the Bone
	v.sub( ct.pos );							// Get The direction to the tail
	v[1] = 0;									// Flatten vector to 2D by removing Y Position
	v.norm();									// Make it a unit vector
	q	.from_unit_vecs( v, Vec3.FORWARD )		// Rotation needed to point the foot forward.
		.mul( ct.rot )							// Move WS Foot to point forward
		.pmul_invert( pt.rot );					// To Local Space
	pose.set_bone( b.idx, q );					// Save to Pose
}


export default TPose;