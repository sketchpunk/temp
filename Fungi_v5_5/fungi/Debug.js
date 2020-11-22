import App, { Maths, Vec3, Draw }	from "./App.js";
import Lines	from "./geo/Lines.js";
import Points	from "./geo/Points.js";

let ln			= null;
let ln_draw		= null;
let ln_entity	= null;
let ln_color	= "red";

let pnt			= null;
let pnt_draw	= null;
let pnt_entity	= null;
let pnt_size 	= 0.04;
let pnt_color	= "red";
let pnt_shape	= 1;

class Debug{
	// #region MAIN
	static init(){
		if( ln ) return;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		ln 			= new Lines();
		ln_draw		= new Draw( ln.get_draw_item() );
		ln_entity	= App.ecs.new_entity( "Debug_Lines", "Node", ln_draw, ln );

		ln_draw.priority = 1000;
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		pnt			= new Points();
		pnt_draw	= new Draw( pnt.get_draw_item() );
		pnt_entity	= App.ecs.new_entity( "Debug_Points", "Node", pnt_draw, pnt );

		pnt_draw.priority = 1001;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.set_depth_test( false );
	}

	static set_priority( v ){ 
		ln_draw.priority = v; 
		pnt_draw.priority = v; 
		return this;
	}
	static set_pnt_size( s ){ pnt_size = s; return this; }
	static set_depth_test( s ){
		pnt_draw.items[0].material.options.depthTest	= s;
		ln_draw.items[0].material.options.depthTest		= s;
		return this;
	}
	// #endregion /////////////////////////////////////////////////////////////

	// #region POINTS
	static pnt( pos, col=pnt_color, size=pnt_size, shape=pnt_shape ){ pnt.add( pos, col, size, shape ); return this; }
	static pnt_raw( x, y, z, col=pnt_color, size=pnt_size, shape=pnt_shape ){ pnt.add( [x,y,z], col, size, shape ); return this; }
	// #endregion /////////////////////////////////////////////////////////////
	
	// #region LINES
	static ln( v0, v1, col_a=ln_color, col_b=null, is_dash=false ){ ln.add( v0, v1, col_a, col_b, is_dash ); return this; }

	static box( v0, v1, col=ln_color, is_dash=false ){
		let x1 = v0[0], y1 = v0[1], z1 = v0[2], 
			x2 = v1[0], y2 = v1[1], z2 = v1[2];

		ln.add( [x1,y1,z1], [x1,y1,z2], col, null, is_dash ); // Bottom
		ln.add( [x1,y1,z2], [x2,y1,z2], col, null, is_dash );
		ln.add( [x2,y1,z2], [x2,y1,z1], col, null, is_dash );
		ln.add( [x2,y1,z1], [x1,y1,z1], col, null, is_dash );
		ln.add( [x1,y2,z1], [x1,y2,z2], col, null, is_dash ); // Top
		ln.add( [x1,y2,z2], [x2,y2,z2], col, null, is_dash );
		ln.add( [x2,y2,z2], [x2,y2,z1], col, null, is_dash );
		ln.add( [x2,y2,z1], [x1,y2,z1], col, null, is_dash );
		ln.add( [x1,y1,z1], [x1,y2,z1], col, null, is_dash ); // Sides
		ln.add( [x1,y1,z2], [x1,y2,z2], col, null, is_dash );
		ln.add( [x2,y1,z2], [x2,y2,z2], col, null, is_dash );
		ln.add( [x2,y1,z1], [x2,y2,z1], col, null, is_dash );
		return this;
	}

	static box_at( pos, x=1, y=1, z=1, col="red", is_dash=false ){
		return this.box( pos, [ pos[0] + x, pos[1] + y, pos[2] + z ], col, is_dash )
	}

	static sqr( min, max, dir=Vec3.UP, color=ln_color, is_dash=false ){
		let mid	= Vec3.lerp( min, max, 0.5 );			// Mid point Needed for Left/Right Points
		let fwd	= Vec3.sub( max, min );
		let lft	= Vec3.cross( dir, fwd ).norm();		// Where to draw the other 2 Points from Mid
		let len	= fwd.len() * 0.5;						// Distance of MinMax for the other 2 points
		let pp	= Vec3.scale( lft, len ).add( mid );	
		let pn	= Vec3.scale( lft, -len ).add( mid );

		this.ln( min, pn, color, null, is_dash );
		this.ln( pn, max, color, null, is_dash );
		this.ln( max, pp, color, null, is_dash );
		this.ln( pp, min, color, null, is_dash );
	}
	// #endregion /////////////////////////////////////////////////////////////

	// #region MISC

	static transform( t, scl=1 ){ this.quat( t.rot, t.pos, scl ); return this; }

	static quat( q, offset=null, scl=1, color=null ){
		let v = new Vec3();
		offset = offset || Vec3.ZERO;
		this
			.ln( offset, v.from_scale( Vec3.FORWARD, scl ).transform_quat( q ).add( offset ), (color || "green") )
			.ln( offset, v.from_scale( Vec3.UP, scl ).transform_quat( q ).add( offset ), (color || "blue") )
			.ln( offset, v.from_scale( Vec3.LEFT, scl ).transform_quat( q ).add( offset ), (color || "red") );
		return this;
	}

	static axis( a, offset=null, scl=1, color=null ){
		let v = new Vec3();
		offset = offset || Vec3.ZERO;
		this
			.ln( offset, v.from_scale( a.z, scl ).add( offset ), (color || "green") )
			.ln( offset, v.from_scale( a.y, scl ).add( offset ), (color || "blue") )
			.ln( offset, v.from_scale( a.x, scl ).add( offset ), (color || "red") );
		return this;
	}

	static plane_quat( q, pos, size=0.5, color="orange", NORM=Vec3.FORWARD, UP=Vec3.UP, LFT=Vec3.LEFT ){
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
			.ln( a, b, color )
			.ln( b, c, color )
			.ln( c, d, color )
			.ln( d, a, color )
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
		if( (flag & 1) != 0 ) pnt.reset();
		if( (flag & 2) != 0 ) ln.reset();
		return this;
	}
	// #endregion /////////////////////////////////////////////////////////////
}

export default Debug;