import Maths, { Quat }		from "../../fungi/maths/Maths.js"; // Vec3, Transform,
import SwingTwistSolver		from "./SwingTwistSolver.js";
//import App from "../../fungi/App.js";

class TrapezoidSolver{

	static apply_chain( ik, chain, tpose, pose, p_wt ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// SWING & TWIST the Root Bone Toward the End Effector.
		let rot = new Quat();
		SwingTwistSolver.get_world_rot( ik, chain, tpose, p_wt, rot );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        //       Short Side
        //    b  /---------\ c
        //      /           \
        //   a /_____________\ d
        //        Long Side

        let b0      = chain.bones[ 0 ],
            b1      = chain.bones[ 1 ],
            b2      = chain.bones[ 2 ],
            lft_len = b0.len,
            top_len = b1.len,
            rit_len = b2.len,
            bot_len = ik.len,
            qprev   = new Quat( p_wt.rot ),
            qnext   = new Quat(),
            ang;
        
        // NOTE : If bot + top are = calc fails, But if they're qual,
        // then it makes a rect with all angles being 90 Degrees
        // so if it becomes an issue thats a way to fix it. Might also have to
        // check that bone 0 and 2 are equal lengths for the 90 degree fix. 
        // But things do work if legs are not the same length. The shortest bone will 
        // determine how fast the trapezoid collapses not sure how to compute that 
        // yet other then letting the calculator give back null when the dimensions aren't possible.
        if( bot_len >= top_len ){
            ang = trapezoid_calculator( bot_len, top_len, lft_len, rit_len ); // IK distance longer then middle bone
            if( !ang ) return;
        }else{
            ang = trapezoid_calculator( top_len, bot_len, rit_len, lft_len ); // Middle bone is longer then ik distance
            if( !ang ) return;

            // Since we need to do the computation in reverse to make sure the shortest base it top, longest is bottom
            // Changing the top/bottom changes the order that the rotation values come back.
            // Easy to fix by reordering the array to match what it would be if the IK line is the longer one
            ang = [ ang[ 2 ], ang[ 3 ], ang[ 0 ], ang[ 1 ] ]; // abcd -> cdab
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // FIRST BONE
        rot .pmul_axis_angle( ik.axis.x, -ang[ 0 ] )
            .copy_to( qnext )
            .pmul_invert( qprev );

        pose.set_local_rot( b0.idx, rot );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // SECOND BONE
        tpose.get_local_rot( b1.idx, rot )
            .pmul( qprev.copy( qnext ) )						// Move tpose local rot to World Space
            .pmul_axis_angle( ik.axis.x, -(Math.PI + ang[ 1 ]) )	// Rotation that needs to be applied to bone.
            .copy_to( qnext )
            .pmul_invert( qprev );						        // Convert to Local Space

        pose.set_local_rot( b1.idx, rot );				        // Save to Pose

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // THIRD BONE
        tpose.get_local_rot( b2.idx, rot )
            .pmul( qnext )								        // Move tpose local rot to World Space
            .pmul_axis_angle( ik.axis.x, -(Math.PI + ang[ 2 ]) )	// Rotation that needs to be applied to bone.
            .pmul_invert( qnext );						        // Convert to Local Space

        pose.set_local_rot( b2.idx, rot );				        // Save to Pose
	}

}

// http://www.1728.org/quadtrap.htm
function trapezoid_calculator( lbase, sbase, lleg, rleg ){
    if( lbase < sbase ){ console.log( "Long Base Must Be Greater Than Short Base"); return null; };

    // h2= (a+b-c+d)(-a+b+c+d)(a-b-c+d)(a+b-c-d)/(4(a-c))^2
	let h2 = ( lbase + lleg + sbase + rleg ) * 
             ( lbase * -1 + lleg + sbase + rleg ) * 
             ( lbase - lleg - sbase + rleg ) *
             ( lbase + lleg - sbase - rleg ) / 
             ( 4 * ( (lbase-sbase) * (lbase-sbase) ) );

    if( h2 < 0 ){ console.log("A Trapezoid With These Dimensions Cannot Exist"); return null; };

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //let perim   = lbase + sbase + lleg + rleg;
	let median  = ( lbase + sbase ) * 0.5;
	let diff    = lbase - sbase;
	let xval    = ( lleg**2 + diff**2 - rleg**2 ) / ( 2 * diff );
	let height  = Math.sqrt( lleg**2 - xval**2 );
    //let area    = height * median;
	let adj     = diff - xval;
    
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    let angA = Math.atan( height / xval );  // Angle of LBase + LLeg
    if( angA < 0 ) angA = angA + Math.PI;

    let angB = Math.PI - angA ;             // Angle of SBase + LLeg
    
    let angD = Math.atan( height / adj );   // Angle of LBase + RLeg
    if( angD < 0 ) angD = angD + Math.PI;
    
    let angC = Math.PI - angD;              // Angle of SBase + RLeg
    
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	//let diag1 = ( lbase-xval ) * ( lbase-xval ) + ( height*height ); // bottom left to top right length
    //diag1 = Math.sqrt( diag1 );    
	//let diag2 = ( sbase + xval ) * ( sbase + xval ) + (height*height); // bottom right to top left length
    //diag2 = Math.sqrt( diag2 );

    return [ angA, angB, angC, angD ];
}

export default TrapezoidSolver;