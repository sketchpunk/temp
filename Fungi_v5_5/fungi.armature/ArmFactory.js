import App, { Vec3, Quat } from "../fungi/App.js";

class ArmFactory{
	static chain( len_ary, name_ary=null, anchor_root=true ){
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
		arm.ready();
		if( anchor_root ) arm.anchor_root_bones( e.node );
		e.arm = arm;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Generate Preview Mesh
		e.bview = App.ecs
			.add_com( e.id, "BoneView" )
			.use_armature( arm )
			.apply_draw_item( true );
		
		return e;
	}

	static append_chain( arm, p_name, b_name, len_ary, name_ary=null ){
		let b		= arm.get_bone( p_name );
		let pos 	= new Vec3();
		let n 		= 0;
		let i;

		for( i of len_ary ){
			pos.set( 0, b.len, 0 );							// Set Position away from Parent Bone origins
			name	= b_name + n;								// Create Bone name
			b		= arm.add_bone( name, i, b.idx, pos );	// Create Bone
			n++;

			if( name_ary ) name_ary.push( name );
		}

		return this;
	}


	static append_chain_json( arm, json, name_ary ){
		//parent	: "hips",
		//name	: "leg.l",
		//lengths	: [ 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1 ],
		//pos		: [ 0.5, 0, 0 ],

		let b		= arm.get_bone( json.parent );
		let pos 	= new Vec3();
		let n 		= 0;
		let i;

		for( i of json.lengths ){
			pos.set( 0, b.len, 0 );							// Set Position away from Parent Bone origins
			name	= json.name + n;								// Create Bone name
			b		= arm.add_bone( name, i, b.idx, pos );	// Create Bone
			n++;

			//------------------------------------
			if( name_ary ) name_ary.push( name );
			if( n == 1 ){
				if( json.pos ) b.node.set_pos( json.pos );
				if( json.rot ) b.node.set_rot( json.rot );
			}
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
}

export default ArmFactory;