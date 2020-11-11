import App, { Quat, Vec3 }	from "../../fungi/App.js";
import ArmFactory       from "../../fungi.armature/ArmFactory.js";
import ProtoFactory     from "../../fungi.protoform2/ProtoFactory.js";

const q_x_180 = Quat.axis_angle( Vec3.FORWARD, Math.PI );


const PROTO_BONES   = [
	{ "name":"hips",	"len":0.1, "idx":0,"p_idx":null,"pos":[0,0.8,0], "rot":[0,0,0,1] },
	{ "name":"spine",	"len":0.1, "idx":1,"p_idx":0,"pos":[0,0.1,0], "rot":[0,0,0,1]},
	{ "name":"spine1",	"len":0.1, "idx":2,"p_idx":1,"pos":[0,0.1,0], "rot":[0,0,0,1]},
	{ "name":"spine2",	"len":0.17, "idx":3,"p_idx":2,"pos":[0,0.1,0], "rot":[0,0,0,1]},

	{ "name":"neck",	"len":0.1, "idx":4, "p_idx":3,"pos":[0,0.15,0.06],"rot":[0.3826834261417389,0,0,0.923879504237964]},
	{ "name":"head",	"len":0.1, "idx":5, "p_idx":4,"pos":[0,0.1,0],"rot":[0.3826834261417389,0,0,0.923879504237964]},
	
	{ "name":"shoulder.l","len":0.1,"idx":6,"p_idx":3, "pos":[0.07,0.15,0],"rot":[0.7071067690849304,0.7071067690849304,5.338507236274381e-8,-5.338507236274381e-8]},
	{ "name":"shoulder.r","len":0.1,"idx":7,"p_idx":3, "pos":[-0.07,0.15,0],"rot":[1.0185958743136325e-8,-1.0185956966779486e-8,0.7071067690849304,0.7071067690849304]},
];

const PROTO_CONFIG = [
	{"bone":"hips", "base_opt":[0,0,1], "scl_top":[0.09,0.09,0.09], "scl_mid":[1,1,1], "scl_bot":[0.09,0.09,0.09], "pos_top":[0,0.01,0], "pos_mid":[0,0,0], "pos_bot":[0,0.01,0], "base_pos":[0,0.01,0], "base_rot":[0,0,0.707106769084934,0.707106769084934]},
	{"bone":"spine", "base_opt":[0,0,1], "scl_top":[0.07,0.04,0.07], "scl_mid":[1,1,1], "scl_bot":[0.07,0.05,0.07], "pos_top":[0,0.03,0], "pos_mid":[0,0,0], "pos_bot":[0,0.02,0], "base_pos":[0,0.04,0], "base_rot":[0,0,0,1]},
	{"bone":"spine1", "base_opt":[0,0,1], "scl_top":[0.09,0.09,0.09], "scl_mid":[1,1,1], "scl_bot":[0.07,0.03,0.07], "pos_top":[0,0.02,0], "pos_mid":[0,0,0], "pos_bot":[0,0.04,0], "base_pos":[0,0.05,0], "base_rot":[0,0,0,1]},
	{"bone":"spine2", "base_opt":[1,0.41,0.4000], "scl_top":[0.09,0.1000,0.12], "scl_mid":[0.08,0,0.13], "scl_bot":[0.09,0.1000,0.12], "pos_top":[0,0.1000,0], "pos_mid":[0.04,0,0], "pos_bot":[0,-0.1000,0], "base_pos":[0,0.065,0], "base_rot":[0,0,0.707106769084934,0.707106769084934]},
	{"bone":"neck", "base_opt":[1,0,1], "scl_top":[0.04,0.04,0.03], "scl_mid":[0.05,0,0.04], "scl_bot":[0.06,0.06,0.05], "pos_top":[0,0.04,0], "pos_mid":[0,0,-0.01], "pos_bot":[0,-0.05,0], "base_pos":[0,0.05,0], "base_rot":[0,0,0,1]},
	{"bone":"head", "base_opt":[0,0,1], "scl_top":[0.065,0.06,0.07], "scl_mid":[1,1,1], "scl_bot":[0.06,0.05,0.06], "pos_top":[0,0.03,-0.01], "pos_mid":[0,0,0], "pos_bot":[0,0.02,0], "base_pos":[0,0.04,0.02], "base_rot":[0.6427876353263855,0,0,0.766444378852844]},
	{"bone":"shoulder.l", "base_opt":[1,0,1], "scl_top":[0.06,0.06,0.08], "scl_mid":[0.05,0,0.06], "scl_bot":[0.05,0.06,0.06], "pos_top":[-0.03,0.06,0], "pos_mid":[0,0,0], "pos_bot":[0,-0.02,0], "base_pos":[-0.02,0.03,0], "base_rot":[0,0,0,1]},
	{"bone":"shoulder.r", "base_opt":[1,0,1], "scl_top":[0.06,0.06,0.08], "scl_mid":[0.05,0,0.06], "scl_bot":[0.05,0.06,0.06], "pos_top":[-0.03,0.06,0], "pos_mid":[0,0,0], "pos_bot":[0,-0.02,0], "base_pos":[-0.02,0.03,0], "base_rot":[0,0,0,1]},
];


function ProtoEntity( name="ProtoHuman", inc_eye=false, use_preview=false ){
	let e = App.mesh_entity( name );

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// CREATE ARMATURE
	let arm = App.ecs.add_com( e.id, "Armature" );
	arm
		.load_config( BONES )
		.anchor_root_bones( e.node );

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// PROTOFORM
	let pro = App.ecs.add_com( e.id, "ProtoForm" );
	pro.use_armature( arm, CONFIG ); // pro.use_config( CONFIG );
	e.draw.add( pro.get_draw_item() );

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// BONE PREVIEW
	if( use_preview ){
		e.bview = App.ecs.add_com( e.id, "BoneView" );
		e.bview.use_armature( e.arm );
		e.draw.add( e.bview.get_draw_item() );
	}

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// EYEBALL
	if( inc_eye ){
		let eye = EyeBall();
		//eye.node.set_scl( 0.21 ).set_pos( 0, 0.082, 0.02 );
		arm.attach_to_bone( "Head", eye.node );
		e.eye = eye;
	}

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	e.proto	= pro;
	e.arm	= arm;
	return e;
}

const LIMBS = {
    "arm.l" : { p:"shoulder.l", pos:[ -0.05, 0.15, 0 ] },
    "arm.r" : { p:"shoulder.r", pos:[ -0.05, 0.15, 0 ] },
    "leg.l" : { p:"hips", pos:[ 0.11, -0.05, 0 ] },
    "leg.r" : { p:"hips", pos:[ -0.11, 0, 0  ], rot:q_x_180  },
}

class ProtoBuilder{
    constructor( name, use_rig=false, use_preview=false  ){
        let e = App.mesh_entity( name );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // SETUP ARMATURE
        e.arm = App.ecs.add_com( e.id, "Armature" );
        e.arm.updated = false;
        ArmFactory.initial_config( e.arm, PROTO_BONES );

        // SETUP PROTOFORM
        e.proto	= App.ecs.add_com( e.id, "ProtoForm" );
        
        // SETUP BONEVIEW
        if( use_preview )   e.bview = App.ecs.add_com( e.id, "BoneView" );
        if( use_rig )       e.rig   = App.ecs.add_com( e.id, "Rig" );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.e      = e;
        this.chains = {};
    }

    build(){
        let e = this.e;

        // Finalize Armature
        e.arm.ready().anchor_root_bones( e.node );
        e.arm.updated = true;

        // Finalize Protoform
        e.proto.use_armature( e.arm, null );
        e.proto.use_config( PROTO_CONFIG );
        e.draw.add( e.proto.get_draw_item() );

        // Finalize BoneView
        if( e.bview ){
            e.bview.use_armature( e.arm );
            e.draw.add( e.bview.get_draw_item() );
        }

        // Finalize Rig
        if( e.rig ){
            let rig = e.rig;
            rig.use_armature( e.arm )
                .add_chain_ends( "spine", [ "spine", "spine1", "spine2" ] )
                .add_point( "hip", "hips" )
                .add_point( "head", "head" )
                .add_point( "neck", "neck" );
            rig.get( "hip" ).set_directions( Vec3.FORWARD, Vec3.UP, rig.tpose );
            rig.get( "neck" ).set_directions( Vec3.FORWARD, Vec3.UP, rig.tpose );
            rig.get( "head" ).set_directions( Vec3.FORWARD, Vec3.UP, rig.tpose );
            rig.get( "spine" ).set_directions( Vec3.UP, Vec3.FORWARD, rig.tpose, true );

            if( this.chains["arm.r"] ){
               rig.add_chain( "arm_r", this.chains["arm.r"] );
               rig.get( "arm_r" ).set_directions( Vec3.RIGHT, Vec3.BACK, rig.tpose );
            }

            if( this.chains["arm.l"] ){
                rig.add_chain( "arm_l", this.chains["arm.l"] );
                rig.get( "arm_l" ).set_directions( Vec3.LEFT, Vec3.BACK, rig.tpose );
            }

            if( this.chains["leg.l"] ){
                rig.add_chain( "leg_l", this.chains["leg.l"] );
                rig.get( "leg_l" ).set_directions( Vec3.DOWN, Vec3.FORWARD, rig.tpose );
            }

            if( this.chains["leg.r"] ){
                rig.add_chain( "leg_r", this.chains["leg.r"] );
                rig.get( "leg_r" ).set_directions( Vec3.DOWN, Vec3.FORWARD, rig.tpose );
            }
        }

        // Cleanup
        delete this.e;
        return e;
    }

    sphere_chain( lname, lens=[ 0.15, 0.15, 0.15, 0.15, 0.15 ] ){
        let arm     = this.e.arm;
        let limb    = LIMBS[ lname ];
        let names   = [];

        ArmFactory.append_chain_json( arm, {
            parent	: limb.p,
            name	: lname + ".",
            lengths	: lens,
            pos		: limb.pos,
        }, names );
        ProtoFactory.append_sphere_chain( arm, PROTO_CONFIG, names, true, 1.1 );

        this.chains[ lname ] = names;
        return this;
    }

    capsule_chain( lname, lens=[  0.6, 0.6  ] ){
        let arm     = this.e.arm;
        let limb    = LIMBS[ lname ];
        let names   = [];

        ArmFactory.append_chain_json( arm, {
            parent	: limb.p,
            name	: lname + ".",
            lengths	: lens,
            pos		: limb.pos,
        }, names );
        ProtoFactory.append_capsule_chain( arm, PROTO_CONFIG, names, 0.07, 0.03 );

        this.chains[ lname ] = names;
        return this;
    }
    
    cap_chain( lname, lens=[ 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1 ] ){
        let arm     = this.e.arm;
        let limb    = LIMBS[ lname ];
        let names   = [];

        ArmFactory.append_chain_json( arm, {
            parent	: limb.p,
            name	: lname + ".",
            lengths	: lens,
            pos		: limb.pos,
            rot		: q_x_180,
        }, names );
        ProtoFactory.append_cap_chain( arm, PROTO_CONFIG, names, 0.09, 0.08, 0.02, 0.005 );

        this.chains[ lname ] = names;
        return this;
    }

    capsule_chain2( lname, lens=[ 0.4, 0.4, 0.4 ] ){
        let arm     = this.e.arm;
        let limb    = LIMBS[ lname ];
        let names   = [];

        let config  =  {
            parent	: limb.p,
            name	: lname + ".",
            lengths	: lens,
            pos		: limb.pos,
        };

        if( limb.rot ) config.rot = limb.rot;

        ArmFactory.append_chain_json( arm, config, names );
        ProtoFactory.append_capsule_chain( arm, PROTO_CONFIG, names, 0.09, 0.03 );

        this.chains[ lname ] = names;
        return this;
    }
}

export default ProtoBuilder;