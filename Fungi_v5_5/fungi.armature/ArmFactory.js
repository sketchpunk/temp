import App, { Vec3 } from "../fungi/App.js";

class ArmFactory{
	static chain( len_ary, name_ary=null ){
		let e	= App.mesh_entity( "Chain" );
		let arm	= App.ecs.add_com( e.id, "Armature" );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Create Armature with a Chain of Bones
		let i, b, n=0, len=0, idx=null, name = "";;
		for( i of len_ary ){
			name = "b" + n;
			if( name_ary ) name_ary.push( name );

			b	= arm.add_bone( name, i, idx, [0,len,0] );
			idx	= b.idx;
			len	= i;
			n++;
		}
		arm.ready().anchor_root_bones( e.node );
		e.arm = arm;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Generate Preview Mesh
		e.bview = App.ecs
			.add_com( e.id, "BoneView" )
			.use_armature( arm )
			.apply_draw_item( true );
		
		return e;
	}

	static append_chain( arm, bname, len_ary ){
		let b		= arm.get_bone( bname );

		let pos 	= new Vec3();
		let n 		= 0;
		let i;

		for( i of len_ary ){
			pos.set( 0, b.len, 0 );							// Set Position away from Parent Bone origins
			name	= "b" + n;								// Create Bone name
			b		= arm.add_bone( name, i, b.idx, pos );	// Create Bone
			n++;
		}

		return this;
	}

	static initial_config( arm, config ){
		let i;
		for( i of config ){
			arm.add_bone( i.name, i.len, i.p_idx, i.pos, i.rot );
		}
		return this;
	}

	/*
		load_config( config ){
		// [ { "name":"Hips", "len":0.105, "idx":0,"p_idx":null,"pos":[0,1.039,0.020], "rot":[2.4268916831715615e-7,0,0,1]  }, ]
		let i;
		for( i of config ) this.add_bone( i.name, i.len, i.p_idx, i.pos, i.rot );
		this.ready();
		return this;
	}

	*/
}

export default ArmFactory;