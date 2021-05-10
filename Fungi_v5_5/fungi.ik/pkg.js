import Rig from "./Rig.js";
import BoneSpring, { BoneSpringSys } from "./BoneSpring.js";

//#####################################################################

//#####################################################################

/*
{
	spring:false,
}
*/
export default async( App, config )=>{
	App.ecs.components.reg( Rig );

	let type_id = App.ecs.components.get_type_id( "Rig" );
	console.log( "[ Rig Ready - TypeID : %s ]", type_id );

	if( config && config.spring ){
		App.ecs.components.reg( BoneSpring );
		App.ecs.systems.reg( BoneSpringSys, 700 ); // Node 800, Arm 801

		type_id = App.ecs.components.get_type_id( "BoneSpring" );
		console.log( "[ BoneSpring Ready - TypeID : %s ]", type_id );
	}
};