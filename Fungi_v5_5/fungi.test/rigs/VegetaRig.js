import App from "../../fungi/App.js";
import GltfUtil, { Gltf }	from "../../fungi/lib/GltfUtil.js";

const ENTITY_NAME = "Vegeta";

class RigLoader{
    entity = null;
    arm    = null;
    node   = null;
    rig    = null;

    constructor(){}

    async load( url="../files/models/" ){     
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~   
        // Download Model
        let [ json, bin ] = await Promise.all([
            fetch( url + "vegeta.gltf" ).then( r=>r.json() ),
            fetch( url + "vegeta.bin" ).then( r=>r.arrayBuffer() ),
        ]);
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Create Armature Entity
		this.entity = GltfUtil.get_skin_view_entity( ENTITY_NAME, json, bin, "LowPolySkin" );
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

        // Hack, Bad Skinning between Neck+Head
        this.rig.get( "head" ).idx = this.rig.get( "neck" ).idx; 
    }
}



export default RigLoader;