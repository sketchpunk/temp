import App	from "../App.js";
import Vec3 from "../maths/Vec3.js";
import Gltf from "./Gltf.js";

class GltfUtil{
	// #region MESH & ARMATURE
	static get_mesh( json, bin, m_name=null ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Grab first mesh name if none is passed to the function
		if( !m_name ){
			if( json.meshes.length == 0 ){ console.error( "No meshes found in gltf" ); return null; }
			m_name = json.meshes[ 0 ].name;
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Get all the primatives of a mesh
		let i,
			ary = Gltf.get_mesh( m_name, json, bin, false ),
			rtn = new Array();
		for( i of ary ){
			rtn.push( App.mesh.from_bin( i.name, i, bin ) );
		}
		
		return rtn;
	}

	static get_entity( e_name, json, bin, mat, m_name=null, load_skin=false ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Grab first mesh name if none is passed to the function
		if( !m_name ){
			if( json.meshes.length == 0 ){ console.error( "No meshes found in gltf" ); return null; }
			m_name = json.meshes[ 0 ].name;
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Get all the primatives of a mesh
		let ary = Gltf.get_mesh( m_name, json, bin, false );
		if( ary.length == 0 ){ console.error( "No mesh found in gltf: %s", m_name ); return null; }

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Create Drawable Entity
		let i, mesh, e = App.mesh_entity( e_name );
		
		// If passing a shader name, generate new material from it.
		if( typeof mat == "string" ) mat = App.shader.new_material( mat );

		for( i of ary ){			
			mesh = App.mesh.from_bin( i.name, i, bin, load_skin );

			e.draw.add( mesh, mat, i.draw_mode );

			if( i.rotation )	e.node.set_rot( i.rotation );
			if( i.position )	e.node.set_pos( i.position );
			if( i.scale )		e.node.set_scl( i.scale );
		}
		
		return e;
	}

	static get_skin_entity( e_name, json, bin, mat, m_name=null, arm_name=null ){
		let e			= this.get_entity( e_name, json, bin, mat, m_name );
		let arm			= App.ecs.add_com( e.id, "Armature" );
		let node_info	= this.load_bones_into( arm, json, bin, arm_name );

		return e;
	}

	static get_skin_view_entity( e_name, json, bin, mat, m_name=null, arm_name=null ){
		let e			= this.get_entity( e_name, json, bin, mat, m_name, true );
		
		let arm			= App.ecs.add_com( e.id, "Armature" );
		let node_info	= this.load_bones_into( arm, json, bin, arm_name );

		let bview		= App.ecs.add_com( e.id, "BoneView" );
		bview.use_armature( arm );
		e.draw.add( bview.mesh, App.shader.new_material( "BoneView" ), App.mesh.LINE );

		e.arm = arm;
		return e;
	}

	static get_bone_only_entity( e_name, json, bin, arm_name=null ){
		let e 			= App.mesh_entity( e_name );
		let arm			= App.ecs.add_com( e.id, "Armature" );
		let node_info	= this.load_bones_into( arm, json, bin, arm_name );
		let bview		= App.ecs.add_com( e.id, "BoneView" );
		bview.use_armature( arm );

		if( node_info.rot ) e.node.set_rot( node_info.rot );
		if( node_info.pos ) e.node.set_pos( node_info.pos );
		if( node_info.scl ) e.node.set_scl( node_info.scl );

		e.draw.add( bview.mesh, App.shader.new_material( "BoneView" ), App.mesh.LINE );
		e.arm = arm;
		return e;
	}
	// #endregion //////////////////////////////////////////////////////////////

	// #region LOADERS
	static load_bones_into( arm, json, bin, arm_name=null, default_len=0.1 ){
		let n_info	= {}, // Armature Node Info Container
			bones 	= Gltf.get_skin_by_nodes( json, arm_name, n_info );
			//bones 	= Gltf.get_skin( json, bin, arm_name, n_info );
	
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Create Bones on Armature
		let len	= bones.length,
			map = {}, // Create a Map of the First Child of Every Parent
			i, b, be;
	
		for( i=0; i < len; i++ ){
			b	= bones[ i ];
			be	= arm.add_bone( b.name, 1, b.p_idx, b.pos, b.rot );
	
			// Save First Child to Parent Mapping
			if( b.p_idx != null && map[ b.p_idx ] == null ) map[ b.p_idx ] = i;
		}
	
		arm.ready(); // Finalize Armature, Compute Worldspace Bind Pose
	
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Calc the Length of Each Bone
		let c;
		for( i=0; i < len; i++ ){
			b = arm.bones[ i ];
	
			if( !map[ i ] ) b.len = default_len;
			else{
				c = arm.bones[ map[ i ] ]; // First Child's World Space Transform
				b.len = Vec3.len( b.world.pos, c.world.pos ); // Distance from Parent to Child
			}
		}
	
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Set the Entity Transfrom from Armature's Node Transform if available.
		// Loading Meshes that where originally FBX need this to display correctly.
		return n_info;
	}
	// #endregion //////////////////////////////////////////////////////////////

	// #region POSES
	/* poses:[  { name:"tpose", skin:0, joints:[ { rot:[], scl:[] } ]}  ] */
	static serialize_pose( name, skin, pose ){
		let json	= pose.bare_serialize(),
			buf		= "";

		for( let i=0; i < json.length; i++ ){
			if( i != 0 ) buf += ",\n";
			buf += "\t" + JSON.stringify( json[ i ] );
		}

		return `{ "name":"${name}", "skin":${skin}, "joints":[\n${buf}\n]}`;
	}

	static load_pose( pose, json, pose_name=null, do_world_calc=false ){
		if( !json.poses || json.poses.length == 0 ){ console.error( "No Poses in gltf file" ); return null; }

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Find Which Pose To Use.
		let p_idx = 0;
		if( pose_name ){
			let i;
			for( i=0; i < json.poses.length; i++ ){
				if( json.poses[ i ].name == pose_name ){ p_idx = i; break; }
			}

			if( i != p_idx ){ console.log("Can not find pose by the name: ", pose_name ); return null; }
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Save pose local space transform
		let i, b, bones = json.poses[ p_idx ].joints;

		for( i=0; i < bones.length; i++ ){
			b = bones[ i ];
			if( b.rot ) pose.set_local_rot( i, b.rot );
			if( b.pos ) pose.set_local_pos( i, b.pos );
		}

		if( do_world_calc ) pose.update_world();
		return pose;
	}
	// #endregion //////////////////////////////////////////////////////////////
}

export default GltfUtil;
export { Gltf };