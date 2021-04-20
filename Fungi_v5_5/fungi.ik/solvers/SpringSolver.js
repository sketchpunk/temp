import Maths, { Quat }		from "../../fungi/maths/Maths.js"; // Vec3, Transform,
import SwingTwistSolver		from "./SwingTwistSolver.js";
//import App from "../../fungi/App.js";

class SpringSolver{

	static apply_chain( ik, chain, tpose, pose, p_wt ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// SWING & TWIST the Root Bone Toward the End Effector.
		let rot = new Quat();
		SwingTwistSolver.get_world_rot( ik, chain, tpose, p_wt, rot );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Going to treat the chain as if each bone is the same length to simplify the solver.
        // The basic Idea is that the line that forms the IK direction will be subdivided by
        // the number of pair bones to form a chain of triangles. So Each A, B is a bone and C
        // will be the sub divided IK line segment.
        //     / \     / \
        //  A /   \ B /   \
        //   /_____\ /_____\      
        //    C ( Base )
        let qprev       = new Quat( p_wt.rot ), // Previous Parent WS Rotation
            qnext       = new Quat();           // Save Child WS Rotation to be the next parent

        let b           = chain.bones[ 0 ];     // First bone of the triangle
        let bone_len    = b.len;                // Treat each bone as the same length
        let base_len    = ik.len / ( chain.count / 2 );  // Length of the sub divided IK segment, will be triangle's base len
        
        let rad_a       = Maths.lawcos_sss( bone_len, base_len, bone_len );           // Angle of AC
        let rad_b       = Math.PI - Maths.lawcos_sss( bone_len, bone_len, base_len ); // Angle 0f AB

        let r_axis_an   = Quat.axis_angle( ik.axis.x, -rad_a ); // First Bone Rotation
        let r_axis_b    = Quat.axis_angle( ik.axis.x, rad_b );  // Second Bone Rotation

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // The first bone of the Chain starts off with the rotation from the SwingTwistSolver.
        // So from here, just need to apply the first axis rotation, save the WS for next bone's parent
        // then conver it back to local space to be saved back to the pose.
        rot .pmul( r_axis_an )			
		    .copy_to( qnext )
            .pmul_invert( qprev );
        
        pose.set_local_rot( b.idx, rot );
        qprev.copy( qnext );

        // The last thing we do is fix the first bone rotation. The first bone starts off
        // aligned with the IK line, so we rotate N degrees to the left of the line for it.
        // When we start the loop, every first bone will now be looking down across the IK line
        // at about N amount of the line on the right side. To get it to where we need to go, we 
        // move it N degrees to the left which should align it again to the IK line, THEN we add
        // N degrees more to the left which should have it pointing to the same direction as the
        // first bone of the chain. So we just fix it by going N*-2 degrees on the same rotation axis
        r_axis_an.from_axis_angle( ik.axis.x, rad_a*-2 );
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let r_axis;
        for( let i=1; i < chain.count; i++ ){
            b      = chain.bones[ i ];
            r_axis  = (( i&1 ) == 0)? r_axis_an : r_axis_b; // Use A for Even Numbers, B for Odd
            
            tpose.get_local_rot( b.idx, rot )   // The remaining bones will always get the TPose Local rotation...
                .pmul( qprev )                  // Then add it to the parent's bone world space...
                .pmul( r_axis )                 // Then apply the AB rotation to get it to point toward the IK Line
                .copy_to( qnext )               // Save WS rotation for next bone
                .pmul_invert( qprev );		    // Conver to local space...
            
            pose.set_local_rot( b.idx, rot );  // to save back to the bone's local transform.
            qprev.copy( qnext );                // Move WS to qprev to act as the starting point
        }
	}

}

export default SpringSolver;