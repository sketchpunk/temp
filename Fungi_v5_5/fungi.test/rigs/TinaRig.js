import App from "../../fungi/App.js";
import GltfUtil, { Gltf } from "../../fungi/lib/GltfUtil.js";
import PhongGen	          from "../../fungi/shaders/PhongGen.js";

const ENTITY_NAME = "tina";

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

    async load( url="../files/models/tina/", use_tex=false, see_bones=true, use_spring=false ){     
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~   
        // Download Model
        let pAry = [
            fetch( url + ENTITY_NAME + ".gltf" ).then( r=>r.json() ),
            fetch( url + ENTITY_NAME + ".bin" ).then( r=>r.arrayBuffer() ),
        ];

        if( use_tex ){
            pAry.push( 
                fetch( url + "initialShadingGroup_albedo.jpg" )
                .then( r=>r.blob() )
                .then( b=>ImgBlobPromise( b ) )
            );
        }

        let [ json, bin, img ] = await Promise.all( pAry );

        let mat = "LowPolySkin";
        if( use_tex && img ){
            let albedo_tex = App.texture.new( "tina_base_tex", img );
            let sh         = PhongGen.build({
                base_tex : albedo_tex,
                gamma    : 0.7272,
                skinning : true,
            });
            mat = App.shader.new_material( sh.name );
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Create Armature Entity
        this.entity = ( see_bones )? 
            GltfUtil.get_skin_view_entity( ENTITY_NAME, json, bin, mat ) :
            GltfUtil.get_skin_entity( ENTITY_NAME, json, bin, mat );
		this.arm	= this.entity.arm;
        this.node	= this.entity.node;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Load TPose
        let tpose = this.arm.new_pose( "tpose" );
        GltfUtil.load_pose( tpose, json, "tpose", false );
        tpose.update_world().apply();

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Load Rig
        this.rig = App.ecs.add_com( this.entity.id, "Rig" );
        this.rig.use_armature( this.arm, tpose ).auto_rig();
 
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Springs
        if( use_spring ){
            console.log( "-----Me");
            // Apply Spring
            let spr = App.ecs.add_com( this.entity.id, "BoneSpring" );

            spr.add_rot( "hair_l", [ "hair.L.002", "hair.L.004", "hair.L.003", "hair.L.005" ], 1.5, 0.5 );
            spr.add_rot( "hair_r", [ "hair.R.002", "hair.R.004", "hair.R.003", "hair.R.005" ], 1.5, 0.5 );
            spr.add_rot( "breast_l", [ "breast.L" ], 2.2, 0.5 );
            spr.add_rot( "breast_r", [ "breast.R" ], 2.2, 0.5 );
            //spr.add_pos( "breast_l", [ "breast.L" ], 3.5, 0.1 );
            //spr.add_pos( "breast_r", [ "breast.R" ], 3.5, 0.1 );
        }
    }
}

export default RigLoader;