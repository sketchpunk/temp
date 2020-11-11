import Vec3	from "../fungi/maths/Vec3.js";
import Quat	from "../fungi/maths/Quat.js";

class Point{
	// #region MAIN
	idx				= null;
	len				= 0;
	effector_dir	= Vec3.UP.clone();
	pole_dir		= Vec3.FORWARD.clone();
	
	constructor( idx, len ){
		this.idx = idx;
		this.len = len;
	}
	// #endregion ////////////////////////////////////////////////

	first(){ return this.idx; }

	set_directions( fwd, up, pose=null ){
		if( pose ){
			let b = pose.bones[ this.idx ];
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
}

export default Point;