import App, { Vec3 }        from "../../fungi/App.js";
import GltfUtil, { Gltf }   from "../../fungi/lib/GltfUtil.js";
import PhongGen	            from "../../fungi/shaders/PhongGen.js";

import ZSolver              from "../../fungi.ik/solvers/ZSolver.js";

const MOD_PATH    = import.meta.url.substring( 0, import.meta.url.lastIndexOf("/") + 1 );
const ENTITY_NAME = "TRex";

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
        if( url == null ) url = MOD_PATH + "../../files/models/trex/";
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~   
        // Download Model
        let pAry = [
            fetch( url + ENTITY_NAME + ".gltf" ).then( r=>r.json() ),
            fetch( url + ENTITY_NAME + ".bin" ).then( r=>r.arrayBuffer() ),
        ];

        if( config.use_tex ){
            pAry.push( 
                fetch( url + "ch_Trex_BaseColor.jpg" )
                .then( r=>r.blob() )
                .then( b=>ImgBlobPromise( b ) )
            );
        }

        let [ json, bin, img ] = await Promise.all( pAry );

        let mat = "LowPolySkin";
        if( config.use_tex && img ){
            let albedo_tex = App.texture.new( "trex_base_tex", img );
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

        this.arm.get_bone( "tail.04" ).len = 0.65; // Can't compute final tail bone len, need larger one to make springs work better

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
            spr.add_rot( "tail", [ "tail.01", "tail.02", "tail.03", "tail.04" ], 1.5, 0.5 );
            spr.add_rot( "arm_r", [ "upperarm.R", "forearm.R" ], 2.0, 0.9 );
            spr.add_rot( "arm_l", [ "upperarm.L", "forearm.L" ], 2.0, 0.9 );
            spr.add_rot( "jaw", [ "jawdown" ], 70.0, 1.0 );
        }
    }
}

function manual_rig( rig ){
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    rig.add_point( "hip", "hips" );
    rig.add_point( "head", "head" );
    rig.add_point( "foot_l", "toe.L" );
    rig.add_point( "foot_r", "toe.R" );

    rig.add_chain_ends( "spine", [ "spine01", "spine02", "spine03" ] );

    //rig.add_chain( "arm_l", [ "upperarm.L", "forearm.L", ], "hand.L" );
    //rig.add_chain( "arm_r", [ "upperarm.R", "forearm.R", ], "hand.R" );

    rig.add_chain( "leg_l", [ "thigh.L", "shin.L", "foot.L" ], "toe.L" );
    rig.add_chain( "leg_r", [ "thigh.R", "shin.R", "foot.R" ], "toe.R" );

    rig.set_solver( "leg_l", ZSolver );
    rig.set_solver( "leg_r", ZSolver );
    rig.set_chain_max( "leg_l", 1.8 );
    rig.set_chain_max( "leg_r", 1.8 );

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Setup ALT-Directions
    rig.get( "spine" ).set_directions( Vec3.UP, Vec3.FORWARD, rig.tpose );

    rig.get( "leg_l" ).set_directions( Vec3.DOWN, Vec3.FORWARD, rig.tpose );
    rig.get( "leg_r" ).set_directions( Vec3.DOWN, Vec3.FORWARD, rig.tpose );
    //rig.get( "arm_r" ).set_directions( Vec3.RIGHT, Vec3.BACK, rig.tpose );
    //rig.get( "arm_l" ).set_directions( Vec3.LEFT, Vec3.BACK, rig.tpose );
    
    rig.get( "foot_l" ).set_directions( Vec3.FORWARD, Vec3.UP, rig.tpose );
    rig.get( "foot_r" ).set_directions( Vec3.FORWARD, Vec3.UP, rig.tpose );
    rig.get( "hip" ).set_directions( Vec3.FORWARD, Vec3.UP, rig.tpose );
    rig.get( "head" ).set_directions( Vec3.FORWARD, Vec3.UP, rig.tpose );
}

export default RigLoader;