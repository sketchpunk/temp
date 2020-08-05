import ProtoForm, { ProtoFormSys } from "./ProtoForm.js";

//#####################################################################

export default async( App, config )=>{
	App.ecs.components.reg( ProtoForm );
	App.ecs.systems.reg( ProtoFormSys, 810 );
	
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	let sh;
	switch( config.mat ){
		//-------------------------------
		case "Halftone":
			sh = await import( "./ShadeHalftone.js" );
			sh.default();
		break;

		//-------------------------------
		default:
			sh = await import( "./ShadeDiffuse.js" );
			sh.default(); // Initializes the Shader
		break;
	}

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	let type_id = App.ecs.components.get_type_id( "ProtoForm" );
	console.log( "[ Protoform Package Ready - TypeID : "+type_id+" ]" );
};