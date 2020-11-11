import Vec3 from "../fungi/maths/Vec3.js";
import Quat from "../fungi/maths/Quat.js";

//=========================================================================

class Link{
	constructor( idx, len ){
		this.idx = idx;
		this.len = len;
	}
}

//=========================================================================

class Chain{
	// #region MAIN
	leaf_idx		= null;					// Some Chains have a Leaf bone thats shouldn't be a link
	bones			= new Array();
	len				= 0;
	len_sqr			= 0;
	len_max			= 0;
	count			= 0;
	leaf_bone		= null;
	effector_dir	= Vec3.UP.clone();
	pole_dir		= Vec3.FORWARD.clone();
	// #endregion ////////////////////////////////////////////////

	// #region GETTERS / SETTERS
	first(){ return this.bones[ 0 ].idx; }
	last(){ return this.bones[ this.count-1 ].idx; }

	get_len(){ return this.len_max || this.len; }

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

//=========================================================================

class ChainEnds{
	// #region MAIN
	bones				= new Array();
	len					= 0;
	len_sqr				= 0;
	count				= 0;
	dirs				= new Array();
	// #endregion ////////////////////////////////////////////////

	// #region GETTERS / SETTERS
	first(){ return this.bones[ 0 ].idx; }
	last(){ return this.bones[ this.count-1 ].idx; }

	add_bone( idx, len ){
		this.bones.push( new Link( idx, len ) );
		this.count++;
		this.len		+= len;
		this.len_sqr	= this.len * this.len;

		this.dirs.push({
			effector	: Vec3.UP.clone(),
			pole		: Vec3.FORWARD.clone(),
		});
		return this;
	}

	set_directions( fwd, up, pose=null ){
		if( pose ){
			let dir, b, q = new Quat();

			for( let i=0; i < this.bones.length; i++ ){
				//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
				b = pose.bones[ this.bones[ i ].idx ];
				q.from_invert( b.world.rot ); // Invert World Space Rotation

				//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
				// Use invert to get direction that will Recreate the real direction
				dir = this.dirs[ i ];
				dir.effector.from_quat( q, fwd );
				dir.pole.from_quat( q, up );
			}
		}else{
			let dir;
			for( i of this.dirs ){
				dir.effector.copy( fwd );
				dir.pole.copy( up );
			}
		}
		return this;
	}
	// #endregion ////////////////////////////////////////////////
}

//=========================================================================
export default Chain;
export { ChainEnds };