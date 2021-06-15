import Maths, { Vec3, Quat, Transform }	from "../../fungi/maths/Maths.js"; // Vec3, Transform,
import App                              from "../../fungi/App.js";

// Based on Research Paper - Triangulation: A new algorithm for Inverse Kinematics
// https://ir.canterbury.ac.nz/bitstream/handle/10092/743/12607089_ivcnz07.pdf?sequence=1

class TriangulationSolver{

    static apply_chain( ik, chain, tpose, pose, p_wt ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        /*
            |\
            | \
            |  \ B
          C |   \
            |   /
            | /  A

            ----0----0----0----0---- Bone Chain
         C = Length of Bone's Head to End Effector
         A = Length of Bone
         B = Length of Chain Remaining

        The Idea behind the paper is that you do a singe pass of all the bones.
        At each bone, you try to compute a Triangle and to do so you need to
        have 3 lengths, the length to the end effector, the length of the bone
        plus the total length of the remaining bones in the chain.

        So knowing the WorldSpace position of the bone's Head, Compute the Direction
        and Length to the End Effector. Next Compute the Direction the bone is pointing at.
        Since bone tail is in the UP direction, just need to transform UP by the bone's WS
        rotation. We know the length of the bone, so that leaves one more length. The Final
        Length (B) is how much distance is left in the chain. That means, For every bone you
        process, you have to subtract its length from the chain's total length. So B will get
        smaller the further down the chain you work.

        Thats pretty much it. There is only two conditions that needs to be worked on, If the
        end effector distance is greater then the current chain length your working with in relation
        to which bone your on. The second is if the effector distance is much smaller then the
        two lengths subtracted. When in that happy middle, you use the law of cosines to compute
        the angle and rotation axis to make the bone rotate toward the direction of the end effector.
        */
        let i, dot_ac, bot, rad;
        let cb,                         // Chain Bone
            tb,                         // TPose Bone
            a_len,                      // Length of the Bone Being Worked on
            b_len,                      // Length of the remaining Bones
            c_len,                      // Distance to End Effector in relation to bone.
            a_dir    = new Vec3(),      // Direction Of Bone
            c_dir    = new Vec3(),      // Direction to End Effector
            axis     = new Vec3(),      // Axis of Rotation
            ct       = new Transform(), // Child Transform ( Current Bones World Transform )
            q        = new Quat(),      // Working Rotation
            v        = new Vec3(),      // Temp Vector
            availLen = chain.len;       // Same as b_len, but this one is used as the counter

        for( i=0; i < chain.count; i++ ){
            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            cb        = chain.bones[ i ];           // Get Bone Reference from Chain
            tb        = tpose.bones[ cb.idx ];      // Get Bone's Local Space Transform of TPose.
            availLen -= cb.len;                     // Remove Bone's length from total remaining chain length

            ct.from_add( p_wt, tb.local );          // Compute Bone's World Space Transform

            a_dir.from_quat( ct.rot, Vec3.UP );     // Get Bone's World Space Direction
            c_dir.from_sub( ik.end_pos, ct.pos );   // Get End Effectors Direction

            b_len = availLen;                       // 3 Lengths for Law of Cosines
            a_len = cb.len;
            c_len = c_dir.len();

            a_dir.norm();                           // All calculations need directions to be unit vectors
            c_dir.norm();

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Final Bone, Just aim it toward the end effector & exit.
            if( i == chain.count-1 ){
                q   .from_unit_vecs( a_dir, c_dir )  // Bla bla, I repeat this part 3 times in this function
                    .mul( ct.rot )
                    .pmul_invert( p_wt.rot );

                pose.set_local_rot( cb.idx, q ); 
                break;
            }

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Distance to End Effector is further then remaining chain length
            if( c_len >= ( a_len + b_len ) ){
                // Point bone directly at end effector
                q   .from_unit_vecs( a_dir, c_dir ) // Rotate a to c
                    .mul( ct.rot )                  // Apply to WS Rotation
                    .pmul_invert( p_wt.rot );       // To Local Space

            }else if( c_len < Math.abs( a_len - b_len ) ){ // Target to close, 
                /* Original, With the idea of Going 180 degrees in opposite direction of the
                end effector. This tends to cause things to flip quickly and sometimes not reach certain
                positions. Testing with 90 and 135 degrees shows to give much better results.
                q   .from_unit_vecs( a_dir.norm(), c_dir.norm().invert() )
                    .mul( ct.rot )
                    .pmul_invert( p_wt.rot );

                if( a_len > b_len ) console.log( "-- No Solution" );
                */

                axis.from_cross( a_dir, c_dir ).norm();         // Get the Rotation access from Bone Direction to Effector Direction

                rad = Maths.PI_Q3 - Vec3.angle( a_dir, c_dir ); // Want to be 135degrees away from Effector Direction, Not 180, improves stability
                q.from_axis_angle( axis, -rad );                // Create Rotation to Move Bone Away                
                v.from_quat( q, a_dir ).norm();                 // Apply to get Final Direction for bone to point
                
                q   .from_unit_vecs( a_dir, v )                 // Create Rotation from TPose to Final
                    .mul( ct.rot )                              // Apply Rotation to Bone
                    .pmul_invert( p_wt.rot );                   // To Local Space
            }else{
                //-----------------------------------
                // Reworked Low of Cosines to find the angle of AC
                // Compute the angle of the currently of AC.
                // Then Compute the Angle That the bone needs to be in
                // Subtract the two, which gives you the rotation offset from Current A to Final A
                // Must clamp values used in ACOS, beyond -1:1 causes NaN errors
                dot_ac  = Maths.clamp( Vec3.dot( a_dir, c_dir ), -1, 1 );
                bot     = Maths.clamp( (-( b_len**2 -a_len**2 - c_len**2 )) / ( 2*a_len*c_len ), -1, 1 );
                rad     = Math.acos( dot_ac ) - Math.acos( bot );

                //-----------------------------------
                // If the current angle is 0 or 180 degrees of eachother,
                // The paper mentions to use any axis of rotation Or the
                // rotation axis used in previous bone. But in Testing,
                // using the cross product at the extremes still creates
                // working rotation axis, leaving as is till there's a reason
                // to change it.
                if( dot_ac == 1 || dot_ac == -1 ){
                    axis.copy( Vec3.UP );
                }else{
                    axis.from_cross( a_dir, c_dir ).norm();
                }

                //-----------------------------------
                q   .from_axis_angle( axis, rad )      // Create Rotation
                    .mul( ct.rot )                     // Apply to WorldSapce
                    .pmul_invert( p_wt.rot );          // Convert to Local Space
            }

            //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            pose.set_local_rot( cb.idx, q );           // Save Rotation result to pose
            p_wt.add( q, tb.local.pos, tb.local.scl ); // Compute the next bone's Parent World Space transform.
        }
	}
}

export default TriangulationSolver;