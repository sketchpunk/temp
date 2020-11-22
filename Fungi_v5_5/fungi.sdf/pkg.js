//import Armature, { ArmatureSys, ArmatureCleanupSys } from "./Armature.js";
import App			from "../fungi/App.js";
import VolumeCube	from "./VolumeCube.js";
import SDFShader	from "./SDFShader.js";
//#####################################################################


//#####################################################################

export default async( App, config )=>{
	VolumeCube.init();

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	App.sdf = {
		volume	: VolumeCube,
		shader	: SDFShader,
	};

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	console.log( "[ SDF Package Ready ]" );
};