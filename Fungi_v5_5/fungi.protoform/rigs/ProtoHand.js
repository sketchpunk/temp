import App from "../../fungi/App.js";

const MAXIMO_BONES = [
	{ "name":"RightHand","len":0.15,"idx":0,"p_idx":null,"pos":[0,0,0],"rot":[0,0,0,1]},

	{ "name":"RightHandThumb1","len":0.041,"idx":1,"p_idx":0,"pos":[-0.015,0.024,0.026],"rot":[0.22176654636859894,0.05947277694940567,0.25208544731140137,0.9400720596313477]},
	{ "name":"RightHandThumb2","len":0.034,"idx":2,"p_idx":1,"pos":[0,0.041,0],"rot":[0.00034027191577479243,-0.00019238849927205592,-0.0003856124822050333,0.9999998211860657]},
	{ "name":"RightHandThumb3","len":0.03,"idx":3,"p_idx":2,"pos":[0,0.034,0],"rot":[-0.011897333897650242,0.00195137073751539,0.004018437582999468,0.9999192357063293]},

	{ "name":"RightHandIndex1","len":0.036,"idx":4,"p_idx":0,"pos":[-0.0051,0.087,0.035],"rot":[-0.0000033692147098918213,0.0000033974647521972656,-1.1446789696667459e-11,1]},
	{ "name":"RightHandIndex2","len":0.028,"idx":5,"p_idx":4,"pos":[0,0.036,0],"rot":[0.000005616404450847767,-0.000005643691110890359,-0.0000020674101506301668,1]},
	{ "name":"RightHandIndex3","len":0.02,"idx":6,"p_idx":5,"pos":[0,0.0288,0],"rot":[0.000002786867753457045,-0.000002750003659457434,0.000012031735423079226,1]},

	{ "name":"RightHandMiddle1","len":0.036,"idx":7,"p_idx":0,"pos":[0,0.094,0.011],"rot":[-0.000003373543677298585,0.0000033974647521972656,1.1594199558762064e-11,1]},
	{ "name":"RightHandMiddle2","len":0.029,"idx":8,"p_idx":7,"pos":[0,0.036,0],"rot":[-0.000003787220066442387,0.0000038214084270293824,-0.000002019868361458066,1]},
	{ "name":"RightHandMiddle3","len":0.02,"idx":9,"p_idx":8,"pos":[0,0.029,0],"rot":[0.000003721492703334661,-0.0000037618035548803164,0.0000020198690435790922,1]},

	{ "name":"RightHandRing1","len":0.031,"idx":10,"p_idx":0,"pos":[-0.0004,0.091,-0.0137],"rot":[-0.000003366203372934251,0.000003397464979570941,-1.1436558297606148e-11,1]},
	{ "name":"RightHandRing2","len":0.029,"idx":11,"p_idx":10,"pos":[0,0.031,0],"rot":[0.000008235279892687686,-0.000008292319762404077,-0.000006086941539251711,1]},
	{ "name":"RightHandRing3","len":0.02,"idx":12,"p_idx":11,"pos":[0,0.029,0],"rot":[-0.000015700450603617355,0.00001574820271343924,0.000015092553439899348,1]},
	
	{ "name":"RightHandPinky1","len":0.036,"idx":13,"p_idx":0,"pos":[-0.0048,0.0807,-0.0373],"rot":[-0.0000033630744837864768,0.0000033974647521972656,-1.1425927912145362e-11,1]},
	{ "name":"RightHandPinky2","len":0.021,"idx":14,"p_idx":13,"pos":[0,0.036,0],"rot":[0.000011971213098149747,-0.000011956633898080327,-0.0000056385929383395705,1]},
	{ "name":"RightHandPinky3","len":0.02,"idx":15,"p_idx":14,"pos":[0,0.021,0],"rot":[-0.00000802205249783583,0.000008068487659329548,-3.9523754935544275e-7,1]},
];

const MAXIMO_CONFIG = [
	{ "name":"RightHand","top":[0.04,0.03,0.09,0.073], "bot":[0.05,0.03,0.07,-0.015] },

	{ "name":"RightHandThumb1", "top":[0.03,0.025], "bot":[0.04,0] },
	{ "name":"RightHandThumb2", "top":[0.025,0.018], "bot":[0.025,0] },
	{ "name":"RightHandThumb3", "top":[0.020,0.025], "bot":[0.025,0] },
	
	{ "name":"RightHandIndex1", "top":[0.024,0.0210], "bot":[0.024,0] },
	{ "name":"RightHandIndex2", "top":[0.024,0.016], "bot":[0.024,0] },
	{ "name":"RightHandIndex3", "top":[0.020,0.023], "bot":[0.024,0] },

	{ "name":"RightHandMiddle1", "top":[0.024,0.022], "bot":[0.024,0] },
	{ "name":"RightHandMiddle2", "top":[0.024,0.017], "bot":[0.024,0] },
	{ "name":"RightHandMiddle3", "top":[0.020,0.023], "bot":[0.024,0] },
	
	{ "name":"RightHandRing1", "top":[0.024,0.021], "bot":[0.024,0] },
	{ "name":"RightHandRing2", "top":[0.024,0.016], "bot":[0.024,0] },
	{ "name":"RightHandRing3", "top":[0.020,0.023], "bot":[0.024,0] },
	
	{ "name":"RightHandPinky1", "top":[0.020,0.023], "bot":[0.020,0] },
	{ "name":"RightHandPinky2", "top":[0.02,0.016], "bot":[0.02,0] },
	{ "name":"RightHandPinky3", "top":[0.016,0.023], "bot":[0.02,0.005] },
];

function ProtoHand( name="ProtoHand", use_preview=false ){
	let e = App.mesh_entity( name );

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// CREATE ARMATURE
	let arm = App.ecs.add_com( e.id, "Armature" );
	arm	.load_config( MAXIMO_BONES )
		.anchor_root_bones( e.node );
	
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// BONE PREVIEW
	if( use_preview ){
		let bview = App.ecs.add_com( e.id, "BoneView" );
		let mat = App.shader.new_material( "BoneView" ).set_depth_test( true );
		bview.use_armature( arm );
		e.draw.add( bview.mesh, mat, App.mesh.LINE );
	}

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// PROTOFORM
	let pro = App.ecs.add_com( e.id, "ProtoForm" );
	pro.use_armature( arm, MAXIMO_CONFIG );
	e.draw.items.push( pro.get_draw_item() );

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	e.proto	= pro;
	e.arm	= arm;
	return e;
}

export default ProtoHand;