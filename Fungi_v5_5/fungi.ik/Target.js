import Maths, { Quat, Vec3 }	from "../fungi/maths/Maths.js";
import Axis						from "../fungi/maths/Axis.js";

class Target{
	// #region MAIN
	axis		= new Axis();
	start_pos	= new Vec3();
	end_pos		= new Vec3();
	len			= 0;
	len_sqr		= 0;
	// #endregion ///////////////////////////////////////////////////////////

	// #region GETTER / SETTERS
	
	// Define the target based on a Start and End Position along with
	// Up direction or the direction of the bend.
	from_pos( pA, pB, up_dir ){
		this.start_pos.copy( pA );
		this.end_pos.copy( pB );

		this.len_sqr	= this.axis.z.from_sub( pB, pA ).len_sqr();
		this.len		= Math.sqrt( this.len_sqr );

		this.axis.from_dir( this.axis.z, up_dir );
		return this;
	}

	from_pos_dir( pos, dir, up_dir, len_scl ){
		this.start_pos.copy( pos );
		this.end_pos
			.from_scale( dir, len_scl )	// Compute End Effector
			.add( pos );

		this.len_sqr	= Vec3.len_sqr( pos, this.end_pos );
		this.len		= Math.sqrt( this.len_sqr );

		this.axis.from_dir( dir, up_dir ); // Target Axis
		return this;
	}
	// #endregion ///////////////////////////////////////////////////////////

	debug( d, scl=1.0 ){ 
		let v = new Vec3(),
			p = this.start_pos,
			a = this.axis;
		d	.ln( p, v.from_scale( a.z , scl ).add( p ), "green" )
			.ln( p, v.from_scale( a.x , scl ).add( p ), "red" )
			.ln( p, v.from_scale( a.y , scl ).add( p ), "blue" )
			.pnt( p, "green", 0.05, 1 )
			.pnt( this.end_pos, "red", 0.05, 1 );
		return this;
	}

}

export default Target;