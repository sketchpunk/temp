import ProtoForm, { ProtoFormSys } from "./ProtoForm.js";

//#####################################################################

export default async( App, config )=>{
	App.ecs.components.reg( ProtoForm );
	App.ecs.systems.reg( ProtoFormSys, 810 );
	
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

	switch( config.mat ){
		default:
			let pr = await import( "./ShadeDiffuse.js" );
			pr.default(); // Initializes the Shader
			break;

	}

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	console.log( "[ Protoform Package Ready ]" );
};