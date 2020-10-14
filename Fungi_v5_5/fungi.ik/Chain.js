import Vec3 from "../fungi/maths/Vec3.js";

class Link{
	constructor( idx, len ){
		this.idx = idx;
		this.len = len;
	}
}

class Chain{
	// #region MAIN
	bones			= new Array();
	len				= 0;
	len_sqr			= 0;
	count			= 0;
	leaf_bone		= null;
	effector_dir	= Vec3.UP.clone();
	pole_dir		= Vec3.FORWARD.clone();
	// #endregion ////////////////////////////////////////////////

	// #region GETTERS / SETTERS
	first(){ return this.bones[ 0 ].idx; }
	last(){ return this.bones[ this.count-1 ].idx; }

	from_armature( arm, name_ary ){
		let i, b;
		for( i of name_ary ){
			b = arm.get_bone( i );
			this.bones.push( new Link( b.idx, b.len ) );

			this.count++;
			this.len += b.len;
		}

		this.len_sqr = this.len * this.len;
		return this;
	}

	add_bone( idx, len ){
		this.bones.push( new Link( idx, len ) );
		this.count++;
		this.len		+= len;
		this.len_sqr	= this.len * this.len;
		return this;
	}

	set_directions( fwd, up, pose=null ){
		if( pose ){
			let b = pose.bones[ this.first() ];
			let q = Quat.invert( b.world.rot ); // Invert World Space Rotation
			
			// Use invert to get direction that will Recreate the real direction
			this.effector_dir.from_quat( q, fwd );
			this.pole_dir.from_quat( q, up );
		}else{
			this.effector_dir.copy( fwd );
			this.pole_dir.copy( up );
		}

		return this;
	}
	// #endregion ////////////////////////////////////////////////
}

class Chainx{
	// #region MAIN
	bones		= new Array();	// Index to a bone in an armature / pose
	len			= 0;			// Chain Length
	len_sqr		= 0;			// Chain Length Squared, Cached for Checks without SQRT
	len_limit	= 0;			// Limit the Length of the chain.
	bone_cnt	= 0;			// How many Bones in the chain
	end_idx 	= null;			// Joint that Marks the true end of the chain
	
	// Alternate Direction and IK Stuff
	alt_dir		= [ { fwd:Vec3.FORWARD.clone(), up:Vec3.UP.clone() } ];
	ik_solver 	= null;
	// #endregion ////////////////////////////////////////////////

	// #region GETTERS / SETTERS
	from_arm( arm, name_ary ){
		/*
		for( i of name_ary ){
			b = this.tpose.get_bone( i );
			ch.add_bone( b.idx, b.len );
		}
		*/
	}

	add_bone( idx, len ){
		let o = { idx, len };

		this.bones.push( o );
		this.bone_cnt++;
		this.len		+= len;
		this.len_sqr	= this.len * this.len;
		return this;
	}

	// Get Skeleton Index of Bones
	first(){ return this.bones[0].idx; }
	last(){ return this.bones[ this.bone_cnt-1 ].idx; }
	idx( i ){ return this.bones[ i ].idx; }

	set_alt_dir( fwd, up, tpose=null, to_all=false ){
		let i;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Create Extra Elements for alts for all bones
		if( to_all && this.alt_dir.length != this.bone_cnt ){
			for( i=this.alt_dir.length; i < this.bone_cnt; i++ ){
				this.alt_dir.push( { fwd:Vec3.FORWARD.clone(), up:Vec3.UP.clone() } );
			}
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		if( tpose ){
			let b, q = new Quat();
			
			if( to_all ){	// Compute for All Bones
				for( i in this.bones ){
					b = tpose.bones[ this.bones[ i ].idx ],
					q.from_invert( b.world.rot );	// Invert World Space Rotation 
					
					this.alt_dir[ i ].fwd.from_quat( q, fwd );	
					this.alt_dir[ i ].up.from_quat( q, up );
				}
			}else{	// Compute for First Bone
				b = tpose.bones[ this.bones[ 0 ].idx ],
				q.from_invert( b.world.rot );	// Invert World Space Rotation 

				// Use invert to get direction that will Recreate the real direction
				this.alt_dir[ 0 ].fwd.from_quat( q, fwd );	
				this.alt_dir[ 0 ].up.from_quat( q, up );
			}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		}else{
			if( to_all ){ // Save to All Bones
				for( i of this.alt_dir ){
					i.fwd.copy( fwd );
					i.up.copy( fwd );
				}
			}else{	// Save to First Bone
				this.alt_dir[ 0 ].fwd.copy( fwd );
				this.alt_dir[ 0 ].up.copy( up );
			}
		}
		return this;
	}
	// #endregion ////////////////////////////////////////////////
}

export default Chain;