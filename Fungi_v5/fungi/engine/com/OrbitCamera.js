import App from "../../App.js";
import Maths, { Vec3, Quat } from "../../maths/Maths.js";

const ORBIT_SCALE = 0.2;
const WHEEL_SCALE = 0.1;

class OrbitCamera{
	static init( priority=1 ){
		App.cam_ctrl = new OrbitCamera();
		App.ecs.sys_add( App.cam_ctrl, priority );
	}

	constructor(){
		this.target_pos 	= new Vec3();
		this.init_cam_pos	= new Vec3();

		this.is_left_down	= false;
		this.wheel_update	= 0;

		this.last_x			= Infinity;
		this.last_y 		= Infinity;
	}

	run( ecs ){
		let c	= App.input.coord,
			cam	= App.camera.Node;
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Determine Mouse Down / Up States
		if( !this.is_left_down && App.input.leftMouse ){
			this.is_left_down = true;
			this.init_cam_pos.copy( cam.local.pos );
		}else if( this.is_left_down && !App.input.leftMouse ) this.is_left_down = false;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Handle Left Click Dragging
		if( this.is_left_down && (c.x != this.last_x || c.y != this.last_y) ){
			this.run_orbit( c.idx, c.idy );
			this.last_x = c.x;
			this.last_y = c.y;
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Hanle Wheel
		if( App.input.wheelUpdateOn !== this.wheel_update ) this.run_wheel();
	}

	//////////////////////////////////////////////////////
	//
	//////////////////////////////////////////////////////

		set_orbit( x, y, dist=null ){
			y = Maths.clamp( y, -89.999999, 89.999999 );

			let len = dist || Vec3.len( this.init_cam_pos, this.target_pos ),
				pos = Maths.polar_to_cartesian( x, y, len ),
				cam = App.camera.Node;

			cam.local.pos.from_add( pos, this.target_pos );
			cam.local.rot.from_look( pos, Vec3.UP );
			cam.updated = true;
			return this;
		}

		set_target( x, y, z ){
			this.target_pos.set( x, y, z );

			let cam = App.camera.Node,
				pos = Vec3.sub( cam.local.pos, this.target_pos );

			cam.local.rot.from_look( pos, Vec3.UP );
			cam.updated = true;
			return this;
		}

		set_distance( x, add_to=false ){
			let cam 	= App.camera.Node,
				delta	= Vec3.sub( cam.local.pos, this.target_pos ),
				len		= Math.max( 0.01, (add_to)? delta.len() + x : x );

			delta.norm().scale( len ).add( this.target_pos );

			cam.set_pos( delta ); 
			return this;
		}

	//////////////////////////////////////////////////////
	//
	//////////////////////////////////////////////////////
		
		run_orbit( dx, dy ){
			let delta	= Vec3.sub( this.init_cam_pos, this.target_pos ),
				polar	= Maths.cartesian_to_polar( delta );

			if( dx != null ) polar[0] -= dx * ORBIT_SCALE;
			if( dy != null ) polar[1] += dy * ORBIT_SCALE;

			this.set_orbit( polar[0], polar[1] );
		}

		run_wheel(){
			this.wheel_update = App.input.wheelUpdateOn;
			this.set_distance( App.input.wheelValue * WHEEL_SCALE, true );
		}		
}

export default OrbitCamera;