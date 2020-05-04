import App, { Maths, Vec3 } from "../App.js";
import Points	from "../geo/Points.js";
import Lines	from "../geo/Lines.js"

class Debug{
	static init(){
		this.ePnt	= Points.$( "debug_pnt" );
		this.eLn	= Lines.$( "debug_ln" );

		this.ePnt.Draw.priority	= 1001;
		//this.ePnt.Draw.items[0].material.options.depthTest = false;
		this.eLn.Draw.priority	= 1000;
		//this.eLn.Draw.items[0].material.options.depthTest = false;

		this.Pnt 	= this.ePnt.Points;
		this.Ln 	= this.eLn.Lines;

		this.Pnt.use_size	= 0.04;
		this.Pnt.use_shape	= 1;
	}

		static set_pnt_size( s ){ this.Pnt.use_size = s; return this; }
		static set_depth_test( s ){
			this.ePnt.Draw.items[0].material.options.depthTest	= s;
			this.eLn.Draw.items[0].material.options.depthTest	= s;
			return this;
		}

	////////////////////////////////////////////////////////////////////
	// POINTS
	////////////////////////////////////////////////////////////////////
		
		static pnt( pos, col="red", size=null, shape=null ){ this.Pnt.add( pos, col, size, shape ); return this; }
		static pnt_raw( x, y, z, col="red", size=null, shape=null ){ this.Pnt.add( [x,y,z], col, size, shape ); return this; }

	////////////////////////////////////////////////////////////////////
	// LINES
	////////////////////////////////////////////////////////////////////
		
		static ln( v0, v1, col_a="red", col_b=null, is_dash=false ){ this.Ln.add( v0, v1, col_a, col_b, is_dash ); return this; }

		static box( v0, v1, col="red", is_dash=false ){
			let x1 = v0[0], y1 = v0[1], z1 = v0[2], 
				x2 = v1[0], y2 = v1[1], z2 = v1[2],
				o = this.Ln;

			o.add( [x1,y1,z1], [x1,y1,z2], col, null, is_dash ); // Bottom
			o.add( [x1,y1,z2], [x2,y1,z2], col, null, is_dash );
			o.add( [x2,y1,z2], [x2,y1,z1], col, null, is_dash );
			o.add( [x2,y1,z1], [x1,y1,z1], col, null, is_dash );
			o.add( [x1,y2,z1], [x1,y2,z2], col, null, is_dash ); // Top
			o.add( [x1,y2,z2], [x2,y2,z2], col, null, is_dash );
			o.add( [x2,y2,z2], [x2,y2,z1], col, null, is_dash );
			o.add( [x2,y2,z1], [x1,y2,z1], col, null, is_dash );
			o.add( [x1,y1,z1], [x1,y2,z1], col, null, is_dash ); // Sides
			o.add( [x1,y1,z2], [x1,y2,z2], col, null, is_dash );
			o.add( [x2,y1,z2], [x2,y2,z2], col, null, is_dash );
			o.add( [x2,y1,z1], [x2,y2,z1], col, null, is_dash );
			return this;
		}

		static box_at( pos, x=1, y=1, z=1, col="red", is_dash=false ){
			return this.box( pos, [ pos[0] + x, pos[1] + y, pos[2] + z ], col, is_dash )
		}

	////////////////////////////////////////////////////////////////////
	// MISC
	////////////////////////////////////////////////////////////////////
		
		static transform( t, scl=1 ){ this.quat( t.rot, t.pos, scl ); return this; }

		static quat( q, offset=null, scl=1, color=null ){
			let v = new App.Vec3();
			offset = offset || App.Vec3.ZERO;
			this
				.ln( offset, v.from_scale( App.Vec3.FORWARD, scl ).transform_quat( q ).add( offset ), (color || "green") )
				.ln( offset, v.from_scale( App.Vec3.UP, scl ).transform_quat( q ).add( offset ), (color || "blue") )
				.ln( offset, v.from_scale( App.Vec3.LEFT, scl ).transform_quat( q ).add( offset ), (color || "red") );
			return this;
		}

		static axis( a, offset=null, scl=1, color=null ){
			let v = new App.Vec3();
			offset = offset || App.Vec3.ZERO;
			this
				.ln( offset, v.from_scale( a.z, scl ).add( offset ), (color || "green") )
				.ln( offset, v.from_scale( a.y, scl ).add( offset ), (color || "blue") )
				.ln( offset, v.from_scale( a.x, scl ).add( offset ), (color || "red") );
			return this;
		}

		static plane_quat( q, pos, size=0.5, NORM=Vec3.FORWARD, UP=Vec3.UP, LFT=Vec3.LEFT ){
			let norm	= Vec3.transform_quat( NORM, q ),
				y		= Vec3.transform_quat( UP, q ),
				x 		= Vec3.transform_quat( LFT, q ),
				up 		= new Vec3(),
				dn 		= new Vec3(),
				a 		= new Vec3(),
				b 		= new Vec3(),
				c 		= new Vec3(),
				d 		= new Vec3();

			up.from_scale( y, size ).add( pos );
			dn.from_scale( y, -size ).add( pos );
			a.from_scale( x, -size ).add( up );
			b.from_scale( x, size ).add( up );
			c.from_scale( x, size ).add( dn );
			d.from_scale( x, -size ).add( dn );

			this
				.ln( a, b, "orange" )
				.ln( b, c, "orange" )
				.ln( c, d, "orange" )
				.ln( d, a, "orange" )
				.ln( pos, a.from_scale( norm, size ).add( pos ), "green" )
				.ln( pos, a.from_scale( y, size ).add( pos ), "blue" )
				.ln( pos, a.from_scale( x, size ).add( pos ), "red" );

			return this;
		}

		static circle_quat( q, pos, radius=0.5, color="orange", seg=8, FWD=Vec3.FORWARD, UP=Vec3.UP, LFT=Vec3.LEFT ){
			let fwd	= Vec3.transform_quat( FWD, q ),
				up	= Vec3.transform_quat( UP, q ),
				lft = Vec3.transform_quat( LFT, q ),
				a 		= new Vec3(),
				b 		= new Vec3();

			Maths.plane_circle( pos, lft, fwd, 0, radius, a );
			for( let i=1; i <= seg; i++ ){
				Maths.plane_circle( pos, lft, fwd, 6.283185307179586 * (i / seg), radius, b );
				this.ln( a, b, color );
				a.copy( b );
			}

			this
				.ln( pos, a.from_scale( fwd, radius ).add( pos ), "green" )
				.ln( pos, a.from_scale( up, radius ).add( pos ), "blue" )
				.ln( pos, a.from_scale( lft, radius ).add( pos ), "red" );

			return this;
		}
		
		static reset( flag = 3 ){
			if( (flag & 1) != 0 ) this.Pnt.reset();
			if( (flag & 2) != 0 ) this.Ln.reset();
			return this;
		}
}

Debug.ePnt	= null;
Debug.Pnt 	= null;
Debug.eLn	= null;
Debug.Ln	= null;

App.Debug	= Debug;

export default Debug;