import App from "../fungi/App.js";

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
}

export default ArmFactory;