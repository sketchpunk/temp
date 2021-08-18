import App from "../../fungi/App.js";
import GltfUtil, { Gltf } from "../../fungi/lib/GltfUtil.js";
import PhongGen	          from "../../fungi/shaders/PhongGen.js";

const MOD_PATH    = import.meta.url.substring( 0, import.meta.url.lastIndexOf("/") + 1 );
const ENTITY_NAME = "CherubBotPM1";

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
        if( url == null ) url = MOD_PATH + "../../files/models/CherubBotPM1/";

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~   
        // Download Model
        let pAry = [
            fetch( url + ENTITY_NAME + ".gltf" ).then( r=>r.json() ),
            fetch( url + ENTITY_NAME + ".bin" ).then( r=>r.arrayBuffer() ),
        ];

        if( config.use_tex ){
            pAry.push( 
                fetch( url + "cherubBotPM1_simple.jpg" )
                .then( r=>r.blob() )
                .then( b=>ImgBlobPromise( b ) )
            );
        }

        let [ json, bin, img ] = await Promise.all( pAry );

        let mat = "LowPolySkin";
        if( config.use_tex && img ){
            let albedo_tex = App.texture.new( "cherubBot_tex", img );
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

        // Armatures with many children bones make it hard to compute
        // the proper length of a bone, so fix them here with the
        // correct child bone to use for computation.
        this.arm
            .fix_bone_length( "RightLeg", "wheelGlowR" )
            .fix_bone_length( "LeftLeg", "wheelGlowL" );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Load Rig
        this.rig = App.ecs.add_com( this.entity.id, "Rig" );
        this.rig.use_armature( this.arm, null ).auto_rig();

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Springs
        if( config.use_spring ){
            console.log( "-----Me");
            // Apply Spring
            let spr = App.ecs.add_com( this.entity.id, "BoneSpring" );
            spr.add_rot( "coord", [ "pt0", "pt1", "pt2", "pt3", "pt4", "pt5" ], 1.0, 0.5 );
            spr.add_rot( "ear_l", [ "LeftEar" ], 5, 1.0 );
            spr.add_rot( "ear_r", [ "RightEar" ], 5.0, 1.0 );
        }
    }
}

export default RigLoader;