import App, { Vec3, Transform } from "../fungi/App.js";
import Target from "./Target.js";
import SwingTwistSolver	from "./solvers/SwingTwistSolver.js";
import LimbSolver		from "./solvers/LimbSolver.js";

// Hold the IK Information, then apply it to a Rig
class IKPose_Human{
    // #region DATA
    target = new Target();			// IK Solvers

    hip = {
        bind_height	: 0,			// Use to help Scale movement.
        movement	: new Vec3(),	// How Much Movement the Hip did in world space
        effe_dir	: new Vec3(),
        pole_dir	: new Vec3(),
    };

    foot_l = { effe_dir:new Vec3(), pole_dir:new Vec3() };
    foot_r = { effe_dir:new Vec3(), pole_dir:new Vec3() };

    // IK Data for limbs is first the Direction toward the End Effector,
    // The scaled length to the end effector, plus the direction that
    // the KNEE or ELBOW is pointing. For IK Targeting, Dir is FORWARD and
    // joint dir is UP
    leg_l = { len_scale:0,	effe_dir:new Vec3(), pole_dir:new Vec3() };
    leg_r = { len_scale:0,	effe_dir:new Vec3(), pole_dir:new Vec3() };
    arm_l = { len_scale:0,	effe_dir:new Vec3(), pole_dir:new Vec3() };
    arm_r = { len_scale:0,	effe_dir:new Vec3(), pole_dir:new Vec3() };
    
    spine = [
        { effe_dir: new Vec3(), pole_dir: new Vec3() },
        { effe_dir: new Vec3(), pole_dir: new Vec3() },
    ];

    head = { effe_dir: new Vec3(), pole_dir: new Vec3() };
    // #endregion ///////////////////////////////////////////////////////////////////////

    // #region APPLY METHODS
    apply_rig( rig ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Lower Body
        this.apply_hip( rig );

        if( rig.items[ "leg_l" ] ) this.apply_limb( rig, "leg_l", this.leg_l );
        if( rig.items[ "leg_r" ] ) this.apply_limb( rig, "leg_r", this.leg_r );

        if( rig.items[ "foot_l" ] ) this.apply_swing_twist( rig, rig.get( "foot_l" ), this.foot_l );
        if( rig.items[ "foot_r" ] ) this.apply_swing_twist( rig, rig.get( "foot_r" ), this.foot_r );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Upper Body
        this.apply_chain_ends( rig, rig.get( "spine" ) , this.spine );
        if( rig.items[ "arm_l" ] ) this.apply_limb( rig, "arm_l", this.arm_l );
        if( rig.items[ "arm_r" ] ) this.apply_limb( rig, "arm_r", this.arm_r );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.apply_swing_twist( rig, rig.get( "head" ), this.head );
    }

    apply_hip( rig ){
        let b_info	= rig.get( "hip" ),					// Get Ring POINT Object of Bone
            bind 	= rig.tpose.bones[ b_info.idx ],	// TPose which is our Bind Pose
            pose 	= rig.pose.bones[ b_info.idx ];		// Our Working Pose.

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Handle Rotation first, it uses Look & Twist
        this.apply_swing_twist( rig, b_info, this.hip );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Translation
        let h_scl	= bind.world.pos.y / this.hip.bind_height;	// Create Scale value from Src's Hip Height and Target's Hip Height
        let pos		= Vec3
            .scale( this.hip.movement, h_scl )		// Scale the Translation Differnce to Match this Models Scale
            .add( bind.world.pos );					// Then Add that change to the TPose Position

        rig.pose.set_local_pos( b_info.idx, pos );	// Save Position to Pose
    }

    apply_limb( rig, chain_name, ik_info, grounding=false ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Get the chain's parent world space transform plus the first bone of the chain.
        let p_tran	= new Transform(),	
            c_tran	= new Transform(),
            chain	= rig.get( chain_name );

        rig.pose.get_parent_world( chain.first(), p_tran, c_tran );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // How much of the Chain length to use to calc End Effector
        //let len = ( rig.leg_len_lmt || chain.len ) * limb.len_scale;
        let len = chain.get_len() * ik_info.len_scale;

        // Next we pass our info to the Target which does a some pre computations that solvers may need.
        this.target.from_pos_dir( c_tran.pos, ik_info.effe_dir, ik_info.pole_dir, len );	// Setup IK Target

        if( grounding ) this.apply_grounding( grounding );

        // Each Chain is assigned a IK Solver that will bend the bones to the right places
        let solver = rig.get_solver( chain_name, LimbSolver );

        // The IK Solver will update the pose with the results of the operation. We pass in the
        // parent for it to use it to return things back into local space.
        solver.apply_chain( this.target, chain, rig.tpose, rig.pose, p_tran );
    }
    
    apply_swing_twist( rig, b_info, ik ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Get the chain's parent world space transform plus the first bone of the chain.
        let p_tran = rig.pose.get_parent_world( b_info.idx );

        this.target.from_dir( ik.effe_dir, ik.pole_dir );	// Setup IK Target

        SwingTwistSolver.apply_bone( this.target, b_info, rig.tpose, rig.pose, p_tran );
    }

    apply_grounding( y_lmt ){
        // Once we have out IK Target setup, We can use its data to test various things
        // First we can test if the end effector is below the height limit. Each foot
        // may need a different off the ground offset since the bones rarely touch the floor
        // perfectly.
        if( this.target.end_pos.y >= y_lmt ) return;

        /* DEBUG IK TARGET */
        let tar		= this.target,
            posA	= Vec3.add( tar.start_pos, [-1,0,0] ),
            posB	= Vec3.add( tar.end_pos, [-1,0,0] );
        App.Debug
            .pnt( posA , "yellow", 0.05, 6 )
            .pnt( posB , "white", 0.05, 6 )
            .ln( posA, posB , "yellow", "white", true );

        // Where on the line between the Start and end Points would work for our
        // Y Limit. An easy solution is to find the SCALE based on doing a 1D Scale
        //operation on the Y Values only. Whatever scale value we get with Y we can use on X and Z
        
        let a = this.target.start_pos,
            b = this.target.end_pos,
            s = (y_lmt - a.y) / (b.y - a.y); // Normalize Limit Value in the Max/Min Range of Y.

        // Change the end effector of our target
        this.target.end_pos.set( 
            (b.x-a.x) * s + a.x, // We scale the 1D Range then apply it to the start
            y_lmt, 
            (b.z-a.z) * s + a.z
        );

        /* DEBUG NEW END EFFECTOR */
        App.Debug.pnt( Vec3.add(this.target.end_pos,[-1,0,0]) , "orange", 0.05, 6 );

        // Since we changed the end effector, lets update the Sqr Length and Length of our target
        // This is normally computed by our IK Target when we set it, but since I didn't bother
        // to create a method to update the end effector, we need to do these extra updates.
        // IDEALLY i should make that function to prevent bugs :)
        this.target.len_sqr		= Vec3.len_sqr( this.target.start_pos, this.target.end_pos );
        this.target.len			= Math.sqrt( this.target.len_sqr );
    }
    
    apply_chain_ends( rig, chain, ik_ends ){
        let p_wt = rig.pose.get_parent_world( chain.first() );

        SwingTwistSolver.apply_chain_ends( chain, rig.tpose, rig.pose, p_wt,
            ik_ends[ 0 ].effe_dir, ik_ends[ 0 ].pole_dir,	// Start
            ik_ends[ 1 ].effe_dir, ik_ends[ 1 ].pole_dir	// End
        );
    }
    // #endregion ///////////////////////////////////////////////////////////////////////
}

// Read the current pose of a Rig then compute data to be saved to IK Pose.
class IKCompute_Human{
    static from_rig( rig, ikpose ){
        this.hip( rig, ikpose );

        this.limb( rig.pose, rig.get( "leg_l" ), ikpose.leg_l );
        this.limb( rig.pose, rig.get( "leg_r" ), ikpose.leg_r );
        this.limb( rig.pose, rig.get( "arm_l" ), ikpose.arm_l );
        this.limb( rig.pose, rig.get( "arm_r" ), ikpose.arm_r );

        this.look_twist( rig, rig.get( "foot_l" ), ikpose.foot_l );
        this.look_twist( rig, rig.get( "foot_r" ), ikpose.foot_r );
        this.look_twist( rig, rig.get( "head" ), ikpose.head );

        this.chain_ends( rig, rig.get( "spine" ), ikpose.spine );
    }

    static run( rig, ik_pose ){
        rig.pose.update_world();	// First thing, We need to compute WS Transforms for all the bones.
        App.Debug.reset();			// For this example, Lets reset visual debug for every compute.

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.hip( rig, ik_pose );

        this.limb( rig.pose, rig.chains.leg_l, ik_pose.leg_l );
        this.limb( rig.pose, rig.chains.leg_r, ik_pose.leg_r );
        
        this.look_twist( rig, rig.points.foot_l, ik_pose.foot_l );
        this.look_twist( rig, rig.points.foot_r, ik_pose.foot_r );

        this.chain_ends( rig, rig.chains.spine, ik_pose );

        this.limb( rig.pose, rig.chains.arm_l, ik_pose.arm_l );
        this.limb( rig.pose, rig.chains.arm_r, ik_pose.arm_r );
        
        this.look_twist( rig, rig.points.head, ik_pose.head );
    }

    static hip( rig, ikpose ){
        let b_info	= rig.get( "hip" ),
            pose	= rig.pose.bones[ b_info.idx ],
            bind	= rig.tpose.bones[ b_info.idx ];

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Directions
        this.look_twist( rig, b_info, ikpose.hip );
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Position
        ikpose.hip.bind_height = bind.world.pos.y;	// The Bind Pose Height of the Hip, Helps with scaling.
        ikpose.hip.movement.from_sub( pose.world.pos, bind.world.pos );	// Difference of position between TPose and Pose.
    }

    static limb( pose, chain, ik_limb  ){
        let boneA	= pose.bones[ chain.first() ],	// First Bone
            boneB	= pose.bones[ chain.leaf_idx ],	// END Bone, which is not part of the chain (Hand,Foot)
            ab_dir	= Vec3.sub( boneB.world.pos, boneA.world.pos ),	// Direction from First Bone to Final Bone ( IK Direction )
            ab_len	= ab_dir.len();									// Distance from First Bone to Final Bone 

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Compute the final IK Information needed for the Limb
        ik_limb.len_scale = ab_len / chain.len;	// Normalize the distance base on the length of the Chain.
        ik_limb.effe_dir.copy( ab_dir.norm() );	// We also normalize the direction to the end effector.

        // We use the first bone of the chain plus the Pre computed pole dir to easily get the direction of the joint
        let j_dir	= Vec3.transform_quat( chain.effector_dir, boneA.world.rot );
        let lft_dir	= Vec3.cross( j_dir, ab_dir );				// We need left to realign up
        ik_limb.pole_dir.from_cross( ab_dir, lft_dir ).norm(); 	// Recalc Up, make it orthogonal to LEFT and FWD
    }

    static look_twist( rig, b_info, ik ){
        let pose = rig.pose.bones[ b_info.idx ];	// Animated Pose Bone
            //bind = rig.tpose.bones[ b_info.idx ];	// TPose Bone

        // Compute the Alternate Directions of the bone.
        ik.effe_dir.from_quat( pose.world.rot, b_info.effector_dir );
        ik.pole_dir.from_quat( pose.world.rot, b_info.pole_dir );
    }

    static chain_ends( rig, chain, ik_ary ){
        let pose, ik, dir;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        pose	= rig.pose.bones[ chain.first() ];
        ik		= ik_ary[ 0 ];
        dir		= chain.dirs[ 0 ];

        ik.effe_dir.from_quat( pose.world.rot, dir.effector );
        ik.pole_dir.from_quat( pose.world.rot, dir.pole );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        pose	= rig.pose.bones[ chain.last() ];
        ik		= ik_ary[ 1 ];
        dir		= chain.dirs[ chain.count-1 ];

        ik.effe_dir.from_quat( pose.world.rot, dir.effector );
        ik.pole_dir.from_quat( pose.world.rot, dir.pole );
    }
}

// How to visualize the IK Pose Informaation to get an Idea of what we're looking at.
class IKPose_Human_Debug{
    static from_rig( rig, ikpose, debug_reset=true ){
        if( debug_reset ) App.Debug.reset();

        this.hip( rig, ikpose );

        this.limb( rig.pose, rig.get( "leg_l" ), ikpose.leg_l );
        this.limb( rig.pose, rig.get( "leg_r" ), ikpose.leg_r );
        this.limb( rig.pose, rig.get( "arm_l" ), ikpose.arm_l );
        this.limb( rig.pose, rig.get( "arm_r" ), ikpose.arm_r );
        
        this.look_twist( rig, rig.get( "foot_l" ), ikpose.foot_l );
        this.look_twist( rig, rig.get( "foot_r" ), ikpose.foot_r );
        this.look_twist( rig, rig.get( "head" ), ikpose.head );

            this.chain_ends( rig, rig.get( "spine" ), ikpose.spine );
    }

    static hip( rig, ik ){
        let b_info	= rig.get( "hip" ),
            ws		= rig.pose.bones[ b_info.idx ].world;
        
        App.Debug.pnt( ws.pos, "orange", 0.09, 6 );
        
        this.look_twist( rig, b_info, ik.hip, Vec3.FORWARD, Vec3.UP );
    }

    static limb( pose, chain, ik ){
        let len		= chain.len * ik.len_scale,
            posA	= pose.bones[ chain.first() ].world.pos,		// Starting Point in Limb
            posB	= Vec3.scale( ik.effe_dir, len ).add( posA ),	// Direction + Length to End Effector
            posC	= Vec3.scale( ik.pole_dir, 0.2 ).add( posA );	// Direction of Joint

        App.Debug
            .pnt( posA, "yellow", 0.05, 6 )
            .pnt( posB, "orange", 0.05, 6 )
            .ln( posA, posB, "yellow", "orange", true )
            .ln( posA, posC, "yellow", null, true );
    }
    
    static look_twist( rig, b_info, ik ){
        let pos = rig.pose.bones[ b_info.idx ].world.pos;
        App.Debug
            .pnt( pos, "cyan", 0.03, 1 )											    // Foot Position
            .ln( pos, Vec3.scale( ik.effe_dir, 0.2 ).add( pos ), "cyan", null, true )	// IK.DIR
            .ln( pos, Vec3.scale( ik.pole_dir, 0.2 ).add( pos ), "cyan", null, true );	// RESULT OF IK.TWIST
    }
    
    static chain_ends( rig, chain, ik_ary ){
        let ws, ik;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        ws = rig.pose.bones[ chain.first() ].world;
        ik = ik_ary[ 0 ];
        App.Debug
                .pnt( ws.pos, "cyan", 0.025, 1 )
                .ln( ws.pos, Vec3.scale( ik.effe_dir, 0.2 ).add(ws.pos), "yellow", null )
                .ln( ws.pos, Vec3.scale( ik.pole_dir, 0.2 ).add(ws.pos), "yellow", null );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        ws = rig.pose.bones[ chain.last() ].world;
        ik = ik_ary[ 1 ];
        App.Debug
                .pnt( ws.pos, "cyan", 0.025, 1 )
                .ln( ws.pos, Vec3.scale( ik.effe_dir, 0.2 ).add(ws.pos), "yellow", null )
                .ln( ws.pos, Vec3.scale( ik.pole_dir, 0.2 ).add(ws.pos), "yellow", null );
    }
}

export {
    IKPose_Human,
    IKCompute_Human,
    IKPose_Human_Debug,
};