import PoseAnimator 	from "./PoseAnimator.js";
import Animation 		from "../fungi/lib/Animation.js";
import { Quat, Vec3 } 	from "../fungi/maths/Maths.js";


class RetargetAnimation{

	constructor(){
		this.src_e 		= null;					// Source Entity
		this.tgt_e 		= null;					// Target Entity

		this.src_rig	= null;					// Source Rig Component
		this.tgt_rig	= null;					// Target Rig Component

		this.src_anim	= null;					// Source Animation
		this.animator	= new PoseAnimator();	// Animator generate pose data
		this.bone_map	= new Array();			// Maping Bones between Source & Target

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// retarget cached math objects, Since we're retargeting one bone at
		// a time, Save time & memory by reusing a few math objects.
		this.convert	= new Quat();
		this.rot 		= new Quat();
		this.pos 		= new Vec3();
		this.scale 		= new Vec3();
		this.a			= new Vec3();
		this.b			= new Vec3();
	}

	/////////////////////////////////////////////////////////
	// SETTERS & GETTERS
	/////////////////////////////////////////////////////////
	
		set_rigs( src, tgt, same_bones=false ){
			this.src_e		= src;
			this.tgt_e 		= tgt;
			this.src_rig	= src.IKRig;
			this.tgt_rig	= tgt.IKRig;

			if( same_bones ) this._auto_map_same_bones();
			return this;
		}

		set_animation( anim ){
			this.src_anim = anim;
			return this;
		}

	/////////////////////////////////////////////////////////
	// REALTIME RETARGETING FOR TESTING
	/////////////////////////////////////////////////////////

		// Realtime Retargeting
		play_realtime( dt ){
			this.animator
				.tick( dt )
				.update( this.src_anim, this.src_rig.pose );

			this.src_rig.apply_pose();		// Apply Pose to Armature
			this.src_rig.update_world();	// Update World Space Of Pose

			// Run Retarget on Each Bone.
			let b;
			for( b of this.bone_map ){
				this._retarget_bone( b.src_name, b.tgt_name, ( b.src_name == "Hips" ) ); // TODO, THIS IS A HACK FOR THE HIPS
			}

			this.tgt_rig.apply_pose();
			return this;
		}

	/////////////////////////////////////////////////////////
	// SINGLE TIME RETARGETING TO CREATE NEW ANIMATION OBJECT
	/////////////////////////////////////////////////////////

		// Run Retargeting and save the result to the target animation object
		build(){
			let anim = this._shallow_clone_animation();
			let b, i, frame_cnt = this.src_anim.frame_cnt;

			for( i=0; i < frame_cnt; i++ ){
				this.animator.key_frame( i, this.src_anim, this.src_rig.pose ); // Generate Pose
				//this.src_rig.apply_pose();
				this.src_rig.update_world();	// Update World Space 

				// Run Retarget on Each Bone.
				for( b of this.bone_map ){
					this._retarget_bone( b.src_name, b.tgt_name, ( b.src_name == "Hips" ) );
				}

				this._save_target_frame( i, anim );
			}

			return anim;
		}

		// Save the current animated pose into a frame in the animation object.
		_save_target_frame( i, anim ){
			let tk, b,
				ri = i * 4,	// Start Index of Frame for Rotation
				pi = i * 3;	// Start Index of frame for Position

			// For every track, update the frame[i]
			for( tk of anim.tracks ){
				b = this.tgt_rig.pose.bones[ tk.joint_idx ]; // Target Bone

				// Save Local Position/Rotation to the specific frame
				switch( tk.type ){
					case "pos":
						tk.data[ pi ]	= b.local.pos[ 0 ];
						tk.data[ pi+1 ]	= b.local.pos[ 1 ];
						tk.data[ pi+2 ]	= b.local.pos[ 2 ];
						break;
					case "rot":
						tk.data[ ri ]	= b.local.rot[ 0 ];
						tk.data[ ri+1 ]	= b.local.rot[ 1 ];
						tk.data[ ri+2 ]	= b.local.rot[ 2 ];
						tk.data[ ri+3 ]	= b.local.rot[ 3 ];
						break;
				}
			}
		}


		_shallow_clone_animation(){
			let anim		= new Animation(),
				src_tracks	= this.src_anim.tracks,
				src_tpose 	= this.src_rig.tpose,
				ary;

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Set Time Arrays - TODO, make sure slice is creating its own array_buffer
			
			for( ary of this.src_anim.times ) anim.add_time_array( ary.slice( 0 ) );

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Recreate Tracks with Empty Sized Arrays
			
			let track, src_bone, b_map;
			for( track of src_tracks ){
				src_bone	= src_tpose.bones[ track.joint_idx ];	// Get Bone Info
				b_map		= this._find_bone_map( src_bone.idx );	// Find Mapped Target Bone

				//console.log( st.type, st.time_idx, st.joint_idx, src_bone.idx, src_bone.name, b_map, st );

				anim.add_joint_track(
					track.type, 		// Track Data Time
					track.time_idx, 	// Which Time Array to use
					b_map.tgt_idx,		// Target Bone's Index
					track.interp, 		// Interpolate Mode
					new Float32Array( track.data.length )
				);
			}

			return anim;
		}

		// Find Bone Map by using the Bone Index of the Source Armature
		_find_bone_map( src_idx ){
			let b;
			for( b of this.bone_map ){
				if( b.src_idx == src_idx ) return b;
			}
			return null;
		}

	/////////////////////////////////////////////////////////
	// 
	/////////////////////////////////////////////////////////
	
		// Simple auto mapping, just matches mixamo bone names
		_auto_map_same_bones(){
			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Get a list of Bones from the Source Animation Rig
			let b, m, map = {};
			for( b of this.src_rig.tpose.bones ){
				map[ b.name ] = {
					src_idx		: b.idx,
					src_name	: b.name,
					tgt_idx		: -1,
					tgt_name	: "",
				};
			}

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Loop through Target Rig and find common name with the src rig
			for( b of this.tgt_rig.tpose.bones ){
				m = map[ b.name ];

				if( !m ){ console.log("Target bone has no source equivalent : ", b.name ); continue; }
				if( m.tgt_idx != -1 ){ console.log("Target bone name is duplicated : ", b.name ); continue; }
				
				m.tgt_idx	= b.idx;
				m.tgt_name	= b.name;
			}

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Only save map data that has a successful link between
			// the two animation rigs

			this.bone_map.length = 0;
			for( b in map ){
				if( map[b].tgt_idx == -1 ){ 
					//console.log("Source Bone has no target equivalent : ", b);
					continue;
				}

				this.bone_map.push( map[b] ) ;
				delete map[b];
			}
		}

		_retarget_bone( from_name, to_name, inc_pos=false, y_only=true ){
			// Pseudo code to retarget Rotations
			//   shift = from_t.bone.ws.rot.invert * to_t.bone.ws.rot
			//   dif   = from_t.parent_bone.ws.rot * src_pose.bone.ls.rot
			//   dif   *= dot( dif, from_t.bone.ws.rot  ) >= 0 ? shift : -shift;
			//   final_pose.bone.ls.rot = to_t.parent_bone.ws.rot.invert * Dif

			// Pseudo code to retarget hip position
			//   scale 	 = to_t.ws.pos / from_t.ws.pos;
			//   pos_dif = ( src.ws.pos - from_t.ws.pos ) * scale;
			//   final 	 = to_t.ls.pos + pos_dif;

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Get the Main Bones Needed.
			let a_rig_bind = this.src_rig.tpose,			// TPOSE Reference
				b_rig_bind = this.tgt_rig.tpose,
				a_rig_pose = this.src_rig.pose,				// POSE Reference
				b_rig_pose = this.tgt_rig.pose,

				a_bind = a_rig_bind.get_bone( from_name ),	// Src TPose Bone
				a_pose = a_rig_pose.get_bone( from_name ),	// Src Pose Bone
				b_bind = b_rig_bind.get_bone( to_name ),	// Tgt TPose Bone
				b_pose = b_rig_pose.get_bone( to_name ),	// Tgt Pose Bone

				ap_bind_rot = ( a_bind.p_idx != null )?		// use offset for parent rotation for Root Bones
					a_rig_bind.bones[ a_bind.p_idx ].world.rot :
					a_rig_bind.root_offset.rot,

				bp_bind_rot = ( b_bind.p_idx != null )?
					b_rig_bind.bones[ b_bind.p_idx ].world.rot :
					b_rig_bind.root_offset.rot;


			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// Create Bind Rotation Difference from FROM -> TO
			// Basicly, How do we translate Src TPose into Target TPose
			this.convert
				.from_invert( a_bind.world.rot )
				.mul( b_bind.world.rot );

			// Isolate bone by using parent's world bind rotation + animated local space rot
			this.rot.from_mul( ap_bind_rot, a_pose.local.rot );

			// Check the Bone's SRC WS rotation based on Src WS Bind Rotation.
			// Incase the rotation in backward, negate it to fix any artifacts when using it.
			if( Quat.dot( this.rot, a_bind.world.rot ) < 0 ) this.convert.negate();

			this.rot
				.mul( this.convert )			// Move src rotation to target bones world space
				.pmul_invert( bp_bind_rot );	// Convert down to local space by using Target Parent WS Bone

			b_rig_pose.set_bone( b_pose.idx, this.rot ); // Save Rotation


			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			if( inc_pos ){
				// Get Scale   s = to / from
				this.a.copy( a_bind.world.pos ).near_zero();
				this.b.copy( b_bind.world.pos ).near_zero();
				this.scale.from_div( this.b, this.a );				// TODO, may need to use only Y for scalar, to apply to xyz.

				this.pos
					.from_sub( a_pose.world.pos, a_bind.world.pos )	// Get the Animation Difference from Bind Pose
					.mul( this.scale )								// Scale it to fit in TO
					.add( b_bind.world.pos );						// Add Scaled Difference to TO's Bind Position

				if( y_only ){										// Only Move Up and Down
					this.pos[ 0 ] = b_bind.world.pos[ 0 ];			
					this.pos[ 2 ] = b_bind.world.pos[ 2 ]; 
				}

				b_rig_pose.set_bone( b_pose.idx, null, this.pos );	// Save Position
			}

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			return this;
		}
}

export default RetargetAnimation;