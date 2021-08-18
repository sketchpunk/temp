import App from "../../fungi/App.js";
import GltfUtil, { Gltf } from "../../fungi/lib/GltfUtil.js";

const MOD_PATH    = import.meta.url.substring( 0, import.meta.url.lastIndexOf("/") + 1 );
const ENTITY_NAME = "Nabba";

class RigLoader{
    entity = null;
    arm    = null;
    node   = null;
    rig    = null;

    constructor(){}
    async load( url=null, config ){
        if( url == null ) url = MOD_PATH + "../../files/models/Nabba/";

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~   
        // Download Model
        let pAry = [
            fetch( url + ENTITY_NAME + ".gltf" ).then( r=>r.json() ),
            fetch( url + ENTITY_NAME + ".bin" ).then( r=>r.arrayBuffer() ),
        ];

        let [ json, bin ] = await Promise.all( pAry );
        let mat           = "LowPolySkin";

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Create Armature Entity
        this.entity = ( config.see_bones )? 
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
    }
}

export default RigLoader;