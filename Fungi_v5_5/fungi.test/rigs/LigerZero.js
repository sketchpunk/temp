import App, { Vec3 }        from "../../fungi/App.js";
import GltfUtil, { Gltf }   from "../../fungi/lib/GltfUtil.js";
import PhongGen	            from "../../fungi/shaders/PhongGen.js";

import ZSolver              from "../../fungi.ik/solvers/ZSolver.js";
import { LimbSolverRev }    from "../../fungi.ik/solvers/LimbSolver.js";

const MOD_PATH    = import.meta.url.substring( 0, import.meta.url.lastIndexOf("/") + 1 );
const ENTITY_NAME = "ligerZero";

function ImgBlobPromise( blob ){
    let img 		= new Image();
    img.crossOrigin	= "anonymous";
    img.src 		= window.URL.createObjectURL( blob );
    return new Promise((resolve, reject)=>{ 
        img.onload	= ()=>resolve( img );
        img.onerror = reject;
    });    
}

class RigLoader{
    entity = null;
    arm    = null;
    node   = null;
    rig    = null;

    constructor(){}

    async load( url=null, config ){   
        if( url == null ) url = MOD_PATH + "../../files/models/ligerZero/";
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~   
        // Download Model
        let pAry = [
            fetch( url + ENTITY_NAME + ".gltf" ).then( r=>r.json() ),
            fetch( url + ENTITY_NAME + ".bin" ).then( r=>r.arrayBuffer() ),
        ];

        if( config.use_tex ){
            pAry.push( 
                fetch( url + "body_d.jpg" )
                .then( r=>r.blob() )
                .then( b=>ImgBlobPromise( b ) )
            );
        }

        let [ json, bin, img ] = await Promise.all( pAry );

        let mat = "LowPolySkin";
        if( config.use_tex && img ){
            let albedo_tex = App.texture.new( "ligerZero_base_tex", img );
            let sh         = PhongGen.build({
                base_tex : albedo_tex,
                gamma    : 0.7272,
                skinning : true,
            });
            mat = App.shader.new_material( sh.name );
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Create Armature Entity
        this.entity = ( config.see_bones )? 
            GltfUtil.get_skin_view_entity( ENTITY_NAME, json, bin, mat ) :
            GltfUtil.get_skin_entity( ENTITY_NAME, json, bin, mat );
		this.arm	= this.entity.arm;
        this.node	= this.entity.node;

        this.arm.get_bone( "tail05" ).len = 0.3; // Can't compute final tail bone len, need larger one to make springs work better

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Load TPose
        let tpose = this.arm.new_pose( "tpose" );
        GltfUtil.load_pose( tpose, json, "tpose", false );
        tpose.update_world().apply();

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Load Rig
        this.rig = App.ecs.add_com( this.entity.id, "Rig" );
        this.rig.use_armature( this.arm, tpose ); //.auto_rig();
        manual_rig( this.rig );
 
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Springs
        if( config.use_spring ){
            // Apply Spring
            let spr = App.ecs.add_com( this.entity.id, "BoneSpring" );
            spr.add_rot( "tail", [ "tail01", "tail02", "tail03", "tail04", "tail05" ], 1.5, 0.8 );
            spr.add_rot( "booster_l", [ "booster_l" ], 4.0, 0.3 );
            spr.add_rot( "booster_r", [ "booster_r" ], 4.0, 0.3 );
        }
    }
}

function manual_rig( rig ){
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    rig.add_point( "hip", "root" );
    rig.add_point( "head", "head" );
    rig.add_point( "foot_l", "foot_l" );
    rig.add_point( "foot_r", "foot_r" );
    rig.add_point( "hand_l", "hand_l" );
    rig.add_point( "hand_r", "hand_r" );

    rig.add_chain_ends( "spine", [ "spine01", "spine02" ] );

    rig.add_chain( "arm_l", [ "upperarm_l", "forearm_l", ], "hand_l" );
    rig.add_chain( "arm_r", [ "upperarm_r", "forearm_r", ], "hand_r" );

    rig.add_chain( "leg_l", [ "thigh_l", "shin_l", "meta_l" ], "foot_l" );
    rig.add_chain( "leg_r", [ "thigh_r", "shin_r", "meta_r" ], "foot_r" );

    rig.set_solver( "leg_l", ZSolver );
    rig.set_solver( "leg_r", ZSolver );

    rig.set_solver( "arm_l", LimbSolverRev );
    rig.set_solver( "arm_r", LimbSolverRev );

    rig.set_chain_max( "leg_l", 0.65 );
    rig.set_chain_max( "leg_r", 0.65 );

    rig.set_chain_max( "arm_l", 0.52 );
    rig.set_chain_max( "arm_r", 0.52 );

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Setup ALT-Directions
    rig.get( "spine" ).set_directions( Vec3.UP, Vec3.FORWARD, rig.tpose );

    rig.get( "leg_l" ).set_directions( Vec3.DOWN, Vec3.FORWARD, rig.tpose );
    rig.get( "leg_r" ).set_directions( Vec3.DOWN, Vec3.FORWARD, rig.tpose );

    rig.get( "arm_r" ).set_directions( Vec3.DOWN, Vec3.FORWARD, rig.tpose );
    rig.get( "arm_l" ).set_directions( Vec3.DOWN, Vec3.FORWARD, rig.tpose );
    
    rig.get( "foot_l" ).set_directions( Vec3.FORWARD, Vec3.UP, rig.tpose );
    rig.get( "foot_r" ).set_directions( Vec3.FORWARD, Vec3.UP, rig.tpose );

    rig.get( "hand_l" ).set_directions( Vec3.FORWARD, Vec3.UP, rig.tpose );
    rig.get( "hand_r" ).set_directions( Vec3.FORWARD, Vec3.UP, rig.tpose );

    rig.get( "hip" ).set_directions( Vec3.FORWARD, Vec3.UP, rig.tpose );
    rig.get( "head" ).set_directions( Vec3.FORWARD, Vec3.UP, rig.tpose );
}

export default RigLoader;