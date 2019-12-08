import App,{THREE} from "../App.js";
import Gltf from "../../fungi/lib/Gltf.js";
import Vec3 from "../../fungi/maths/Vec3.js";

class GltfUtil{
	//////////////////////////////////////////////////////////////
	// GETTERS
	//////////////////////////////////////////////////////////////

		// Loads in Mesh Only
		static get_mesh( m_name, json, bin, mat, m_names=null ){
			let m = this.load_mesh( json, bin, mat, m_names, false );
			m.name = m_name;
			return App.$( m );
		}

		static get_bone_view( m_name, json, bin, arm_name=null ){
			let e = App.ecs.entity( m_name, [ "Armature" ] ),
				o = e.add_com( "Obj" );

			o.ref = new THREE.Group();					
			o.ref.name = m_name;

			this.load_bones_into( e, json, bin, arm_name );

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			let b = e.Armature.get_root();
			o.ref.add( b );
			App.scene.add( new THREE.SkeletonHelper( b ) );

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			App.scene.add( o.ref );
			return e;
		}

		static get_debug_view( m_name, json, bin, mat, m_names=null, arm_name=null ){
			let m = this.load_mesh( json, bin, mat, m_names, true );
			m.name			= m_name;
			mat.skinning	= true;		// Make Sure Skinning is enabled on the material

			let grp = new THREE.Group();
			grp.add( m[0] );
			grp.add( m[1] );

			let e 	= App.$( grp ),
				arm	= e.add_com( "Armature" );

			let n = this.load_bones_into( e, json, bin, arm_name );
			//console.log( n );
		
			grp.updateMatrixWorld( true );			

			m[0].add( arm.get_root() );
			m[0].bind( arm.skeleton );
			m[0].bindMode = "detached";

			m[1].bind( arm.skeleton );
			m[1].bindMode = "detached";


			//App.scene.add( m[1] );

			//console.log( "cc", m[1].matrixWorld );
			//console.log( "cc", grp.matrixWorld );


			////m[1].scale.set( 0.1, 0.1, 0.1 );
			//m[1].scale.copy( grp.scale );
			//m[1].quaternion.copy( grp.quaternion );

			


	
			//console.log( m[1].scale );
			//console.log( m[1].quaternion );

			//grp.add( m[1] );
			//
			//App.scene.add( m[1] );
			
			//m[1].bind( arm.skeleton, grp.matrixWorld );
			//m[1].bindMode = "detached";
			
			

			//App.scene.add( arm.bones[0].ref );
			//m[1].add( arm.bones[0].ref );

			//mesh.normalizeSkinWeights();

			//m[1].skeleton = arm.skeleton;

			//m[1].updateMatrixWorld( true );
			//arm.skeleton.calculateInverses();

			//m[1].add( arm.get_root() );
			//m[1].bind( arm.skeleton );
			//m[1].bind( arm.skeleton, m[1].matrixWorld );


			//m[0].bind( arm.skeleton );
			//m[0].add( m[0] );
			




			return e;
			//##############################

			/*
			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			let e 	= App.$( m ),
				arm	= e.add_com( "Armature" );

			this.load_bones_into( e, json, bin, arm_name );

			App.scene.add( new THREE.SkeletonHelper( arm.get_root() ) ); // Helper must live in world space

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// If Mesh is broken out into seperate parts its returned as a group.
			// Armature will only automaticly bind if the Entity Object is a SkinnedMesh, not group
			// So need to loop all the children, then bind then to the skeleton.
			if( m.type == "Group" ){
				let c;
				for( c of m.children ){
					c.bind( arm.skeleton, m.matrixWorld );
					console.log( c );
				}

				m.add( arm.get_root() );
				//App.scene.add( arm.get_root() );
			}

			console.log( m.position, m.scale );
			*/
			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			return e;
		}

		static get_skin_mesh( m_name, json, bin, mat, m_names=null, arm_name=null ){
			let m = this.load_mesh( json, bin, mat, m_names, true );
			m.name			= m_name;
			mat.skinning	= true;		// Make Sure Skinning is enabled on the material

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			let e 	= App.$( m ),
				arm	= e.add_com( "Armature" );

			this.load_bones_into( e, json, bin, arm_name );
			return e;
		}

	//////////////////////////////////////////////////////////////
	// LOADERS
	//////////////////////////////////////////////////////////////

		// Bin loading of Mesh Data into a Drawing Entity
		static load_mesh( json, bin, mat=null, mesh_names=null, is_skinned=false ){
			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Load all meshes in file
			if( !mesh_names ){
				mesh_names = new Array();
				for( let i=0; i < json.meshes.length; i++ ) mesh_names.push( json.meshes[i].name );
			}

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Mesh can be made up of sub-meshes, So need to loop through em.
			let n, g, geo_ary, list = [];

			//let mm = null;
			
			for( n of mesh_names ){
				geo_ary = Gltf.get_mesh( n, json, bin, false ); // Load Type Arrays
				
				//for( g of geo_ary ){
				//	if( !mm )	mm = this.mk_geo_mesh( g, mat, is_skinned ) ;
				//	//else 		mm.add( this.mk_geo_mesh( g, mat, is_skinned ) );
				//}

				if( geo_ary.length == 1 )
					list.push( this.mk_geo_mesh( geo_ary[0], mat, is_skinned ) );
				else						
					for( g of geo_ary ) 
						list.push( this.mk_geo_mesh( g, mat, is_skinned ) );
				
			}

			//return mm;

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Return mesh Or if multiple, a Group of Meshes.
			if( list.length == 1 ) return list[0];
			
			return list;

			let rtn = new THREE.Group();
			for( g of list ) rtn.add( g );

			return rtn;
		}

		static load_bones_into( e, json, bin, arm_name=null, def_len=0.1 ){
			let n_info	= {}, // Node Info
				arm 	= e.Armature,
				bones 	= Gltf.get_skin( json, bin, arm_name, n_info );
			

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Create Bones
			let len	= bones.length,
				map = {},			// Create a Map of the First Child of Every Parent
				i, b, be;

			for( i=0; i < len; i++ ){
				b	= bones[ i ];
				be	= arm.add_bone( b.name, 1, b.p_idx );

				if( b.rot ) be.quaternion.fromArray( b.rot );
				if( b.pos ) be.position.fromArray( b.pos );
				if( b.scl ) be.scale.fromArray( b.scl );

				// Save First Child to Parent Mapping
				if( b.p_idx != null && !map[ b.p_idx ] ) map[ b.p_idx ] = i;
			}

			arm.finalize();

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Set the Entity Transfrom from Armature's Node Transform if available.
			// Loading Meshes that where originally FBX need this to display correctly.
			if( n_info.scl ) e.Obj.ref.scale.fromArray( n_info.scl );
			if( n_info.rot ) e.Obj.ref.quaternion.fromArray( n_info.rot );

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Calc the Length of Each Bone
			let c;
			for( i=0; i < len; i++ ){
				b = arm.bones[ i ];

				if( !map[ i ] ) b.len = def_len;
				else{
					c = arm.bones[ map[ i ] ]; // First Child's World Space Transform
					b.len = Vec3.len( b.world.pos, c.world.pos ); // Distance from Parent to Child
				}
			}

			//return e;
			return n_info;
		}

	//////////////////////////////////////////////////////////////
	// HELPERS
	//////////////////////////////////////////////////////////////

		// Create a Geo Buffer and Mesh from data from bin file.
		static mk_geo_mesh( g, mat, is_skinned=false ){
			let geo = new THREE.BufferGeometry();
			geo.addAttribute( "position", new THREE.BufferAttribute( g.vertices.data, g.vertices.comp_len ) );

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			if( g.indices )
				geo.setIndex( new THREE.BufferAttribute( g.indices.data, 1 ) );

			if( g.normal )
				geo.addAttribute( "normal", new THREE.BufferAttribute( g.normal.data, g.normal.comp_len ) );

			if( g.uv )
				geo.addAttribute( "uv", new THREE.BufferAttribute( g.uv.data, g.uv.comp_len ) );

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			if( is_skinned && g.joints && g.weights ){
				geo.setAttribute( "skinIndex", new THREE.Uint16BufferAttribute( g.joints.data, g.joints.comp_len ) );
				geo.setAttribute( "skinWeight", new THREE.Float32BufferAttribute( g.weights.data, g.weights.comp_len ) );
			}

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			let m = ( !is_skinned )?
				new THREE.Mesh( geo, mat ) :
				new THREE.SkinnedMesh( geo, mat );

			m.name = g.name;
			return m;
		}

}

export default GltfUtil;
export { Gltf };