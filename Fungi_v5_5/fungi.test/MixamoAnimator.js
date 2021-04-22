import App	                        from "../fungi/App.js";
import GltfUtil, { Gltf }	        from "../fungi/lib/GltfUtil.js";
import { Animation, PoseAnimator }  from "../fungi.armature/Animation.js";
import { IKPose_Human, IKCompute_Human, IKPose_Human_Debug } from "../fungi.ik/IKAnimationCompute.js";

class MixamoAnimator{
    animator	= new PoseAnimator();
    entity		= null;
    anim		= null;
    rig			= null;
    speed		= 1.0;

    async load( url ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Download 
        let [ json, bin ] = await Promise.all([
            fetch( url + ".gltf" ).then( r=>r.json() ),
            fetch( url + ".bin" ).then( r=>r.arrayBuffer() ),
        ]);

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Build Entity and Pose
        this.entity = GltfUtil.get_bone_only_entity( "src_bones", json, bin );
        //this.pose	= this.entity.arm.new_pose();

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Prepare Animation
        let data	= Gltf.get_animation( json, bin, null, true );
        this.anim	= Animation.from_gltf( data );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Setup IK Rig
        this.rig = App.ecs.add_com( this.entity.id, "Rig" );
        this.rig
            .use_armature( this.entity.arm )
            .set_tpose_offset( this.entity.node.local )
            .set_pose_offset( this.entity.node.local );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // FOR MIXAMO ANIMATIONS
        // Before setting up rig chains and points,
        // Need to recompute the length of the bones based on 
        // root offset of the animation. Else the bone lengths are
        // not scaled correctly.
        this.rig.tpose.update_world().recompute_bone_len();
        this.rig.auto_rig();

        return this;
    }

    tick( dt, for_ik=false ){
        this.animator.tick( dt * this.speed ).update( this.anim, this.rig.pose );

        if( for_ik ){
            // To Compute World Space Pose, Need to copy entities transform
            this.rig.pose.root_offset.copy( this.entity.node.local );
            this.rig.pose.clear_root_motion( 0, 1 );	// Only Allow Y Position change hips
            this.rig.pose.update_world();				// Compute all the bones World Place Transforms
        }

        return this;
    }

    update_ik_pose( ik_pose, do_debug=false ){
        IKCompute_Human.from_rig( this.rig, ik_pose );
        if( do_debug ) IKPose_Human_Debug.from_rig( this.rig, ik_pose );
        return this;
    }

    apply_pose(){ this.rig.pose.apply(); return this; }
}

export default MixamoAnimator;