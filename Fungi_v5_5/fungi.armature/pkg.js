import Armature, { ArmatureSys, ArmatureCleanupSys } from "./Armature.js";

//#####################################################################

class RenderLoader{
    constructor( ubo, tid ){
        this.ubo        = ubo;  
        this.type_id    = tid;    
    }

    load( e, App ){
        if( !e.component_mask.has( this.type_id ) ) return;
        let com_id  = e.component_ids.get( this.type_id );
        let arm     = App.ecs.components.get( this.type_id, com_id );
        
        this.ubo.set( "bones", arm.offset_buffer );
        App.ubo.update( this.ubo );
    }
}

//#####################################################################

export default async( App, config )=>{
    App.ecs.components.reg( Armature );
    App.ecs.systems
        .reg( ArmatureSys, 801 )
        .reg( ArmatureCleanupSys, 1000 );

    let type_id = App.ecs.components.get_type_id( "Armature" );
    
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    let ubo = App.ubo.new( "Armature", 2, [
        { name:"bones",	type:"mat4", ary_len:90 },
    ]);

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    if( config.bone_view ){
        let bv = await import( "./BoneView.js" );

        App.ecs.components.reg( bv.default );
        App.ecs.systems.reg( bv.BoneViewSys, 810 );
        bv.LoadShader();
    }

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    if( config.mat ) await import( "./LowPolySkin.js" );

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    App.renderer.add_custom_loader( new RenderLoader( ubo, type_id ) );

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    console.log( "[ Armature Package - TypeID : %s ]", type_id );
};