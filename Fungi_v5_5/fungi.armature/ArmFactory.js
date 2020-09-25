import App from "../fungi/App.js";

class ArmFactory{
	static chain( len_ary ){
		let e	= App.mesh_entity( "Chain" );
		let arm	= App.ecs.add_com( e.id, "Armature" );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Create Armature with a Chain of Bones
		let i, b, n=0, len=0, idx=null;
		for( i of len_ary ){
			b	= arm.add_bone( "b"+n, i, idx, [0,len,0] );
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