import App, { Maths, Vec3 }	from "../fungi/App.js";
import Ray					from "../fungi.ray/Ray.js";
import Lines 				from "../fungi/geo/Lines.js";

let SHADER;
const CAMERA_SCALE	= 8;		// Scale Factor from Camera Distance
const MIN_ADJUST	= -0.02;	// Dot Angle minimum to flip Gizmo
const AXIS_MIN_RNG	= 0.01;	// Range away from axis line to count as clicked.
const UNIT_AXIS		= [ Vec3.FORWARD.clone(), Vec3.LEFT.clone(), Vec3.UP.clone() ];	// Array of Axis for Ray Intersection Checking

//################################################################################

class GizmoMove{
	// #region Static Methods
    static init( size=null, init_func=null, priority=700 ){
		if( !SHADER ){
			SHADER = App.Shader.from_src( "GizmoMove", v_src, f_src )
				.add_uniform_blocks( [ "Global", "Model" ] )
				.add_uniform( "color_ary", "rgb", [ "#ff0000", "#00ff00", "#0000ff" ] )
				.opt_cullface( false );
		}
		
		App.ecs.sys_add( GizmoMoveSys, priority );
		if( size != null) App.events.reg( "gizmo_move", size, true, init_func );
	}

	static $( name, inc_plane=false, init_state=true ){
		let e = App.$Draw( "GizmoMove" );
		e.add_com( "GizmoMove" ).init( inc_plane );
		
		e.info.active		= init_state;
		e.GizmoMove.line	= Lines.$( "GizmoMoveLine" );
		return e;
	}
	// #endregion /////////////////////////////////////////////////

	constructor(){
		this.ent 			= null;	// Reference to the Entity
		this.line 			= null;	// Reference to a seperate line entity to display the drag line.

		// Handle Hit Tests
		this.bound			= [ new Vec3(), new Vec3() ];
		this.ray 			= new Ray();

		// Handle Movement
		this.drag_pnt_a		= new Vec3();
		this.drag_pnt_b		= new Vec3();
		this.drag_offset	= new Vec3();
		this.is_drag		= false;

		// Function Binding
		this.move_bind		= this.drag_move.bind( this );
		this.end_bind		= this.drag_end.bind( this );
	}

	init( inc_plane=false ){
		let mat		= SHADER.new_material(),
			info	= geo_lines();

		this.ent = App.get_e( this.entity_id ),
		this.ent.Draw.add( info.mesh, mat, info.draw_mode );
		
		if( inc_plane ){
			info = geo_planes();
			this.ent.Draw.add( info.mesh, mat, info.draw_mode );
		}
		return this;
	}

	is_hit( ray ){
		let e = App.get_e( this.entity_id );
		if( ray_to_bound( ray, e.Node.local, this.bound ) ){
			let info = {};
			if( ray_to_axis( ray, e.Node.local, info ) ){
				//console.log( info );
				this.drag_begin( e.Node.local.pos, info.axis, info.hit_point );
				return true;
			}
		}
		return false;
	}

	hide(){ this.ent.info.active = false; return this; }
	show( pos ){
		this.ent.Node.set_pos( pos );	// Move Gizmo to starting position.
		this.ent.info.active = true;	// Enable it
		return this;
	}

	// #region Drag Handling
	drag_begin( pos, axis, pnt ){
		// Define the Dragging Line
		this.drag_pnt_a.copy( axis ).scale( 100 ).add( pos );
		this.drag_pnt_b.copy( axis ).scale( 100 ).invert().add( pos );
		this.drag_offset.from_sub( pos, pnt );
		this.is_drag = true;

		this.line.Lines.add( this.drag_pnt_a, this.drag_pnt_b, "#505050" );

		// Write up events to handle dragging
		App.gl.canvas.addEventListener( "mousemove",	this.move_bind );
		App.gl.canvas.addEventListener( "mouseup",		this.end_bind );
	}

	drag_move( e ){
		// Compute Screen to 3D World Vector
		let pos = App.input.toCoord( e );
		this.ray.set_screen_mouse( pos[0], pos[1] );
		
		// Find Closest point on the drag line, apply offset and save back to node.
		let pnts = Maths.closest_points_from_lines( this.ray.origin, this.ray.end, this.drag_pnt_a, this.drag_pnt_b );
		this.ent.Node.set_pos( pnts[ 1 ].add( this.drag_offset ) );

		// Pass Drag Value
		App.events.emit( "gizmo_move", pnts[1] );
	}

	drag_end( e ){
		this.drag_move( e ); // Execute one final drag event on mouse up event.

		this.is_drag = false;
		App.gl.canvas.removeEventListener( "mousemove",	this.move_bind );
		App.gl.canvas.removeEventListener( "mouseup",	this.end_bind );
		this.line.Lines.reset();
	}
	// #endregion //////////////////////////////////////////////////////////////
} App.Components.reg( GizmoMove );


function GizmoMoveSys( ecs ){
	let n, e, scl,
		eye_dir	= new Vec3(),
		eye_len	= 0,
		cam 	= App.camera,
		ary 	= ecs.query_comp( "GizmoMove" );

	for( n of ary ){
		e = App.ecs.entities[ n.entity_id ];
		
		// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Scale Gizmo based on distance from camera. Try to keep it the same size no matter the camera distance.
		if( cam.Node.updated || n.is_drag ){
			eye_dir.from_sub( cam.Node.local.pos, e.Node.local.pos );
			eye_len	= eye_dir.len();
			scl 	= e.Node.local.scl;

			eye_dir.norm();
			scl.set( 1, 1, 1 ).scale( eye_len / CAMERA_SCALE );

			// Flip Viewing to the opposite side
			if( Vec3.dot( eye_dir, Vec3.LEFT )		< MIN_ADJUST )	scl.x *= -1;
			if( Vec3.dot( eye_dir, Vec3.FORWARD )	< MIN_ADJUST )	scl.z *= -1;
			if( Vec3.dot( eye_dir, Vec3.UP )		< MIN_ADJUST )	scl.y *= -1;
	
			e.Node.updated = true;
		}

		// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	}
}

//################################################################################

// #region RAY TESTING
// Test the AABB  of the Gizmo
function ray_to_bound( ray, wt, bound ){
	let x1 = wt.pos[0],
		y1 = wt.pos[1],
		z1 = wt.pos[2],
		x2 = x1 + wt.scl[0],	// Use Scale value as a direction vector to be added to world position.
		y2 = y1 + wt.scl[1],
		z2 = z1 + wt.scl[2],
		t;
	
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Test to make sure to define Low and Upper Bounds
	if( x1 > x2 ){ t=x1; x1=x2; x2=t; }
	if( y1 > y2 ){ t=y1; y1=y2; y2=t; }
	if( z1 > z2 ){ t=z1; z1=z2; z2=t; }
	bound[ 0 ].set( x1, y1, z1 ); // Lower Bound
	bound[ 1 ].set( x2, y2, z2 ); // Upper Bound

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Run Test
	return ray.in_bound( bound );
	/*
	App.Debug.reset().box( bound[ 0 ], bound[ 1 ] );
	
	let info = {};
	if( ray.in_bound( bound, info ) ){
		//App.Debug
		//	.pnt( gRay.get_pos( info.min ), "green", 0.05, 1 )
		//	.pnt( gRay.get_pos( info.max ), "red", 0.05, 1 );
		return true;
	}
	return false;
	*/	
}

function ray_to_axis( ray, wt, info=null ){
	let p			= new Vec3(),
		min_len		= Infinity,
		len, pnt, i;

	for( i=0; i < 3; i++ ){
		// Scale the Axis, then add position
		p.from_mul( UNIT_AXIS[ i ], wt.scl ).add( wt.pos );

		// Check if ray is near any of the axis lines.
		pnt = ray.near_segment( wt.pos, p );
		if( pnt ){
			len = Vec3.len_sqr( pnt[0], pnt[1] );

			if( len <= AXIS_MIN_RNG && len < min_len ){
				if( info ){
					info.len		= len;
					info.axis_idx	= i;
					info.axis 		= UNIT_AXIS[ i ];
					info.hit_point 	= pnt[ 0 ];
				}
				/*
				App.Debug
					.pnt( pnt[0], "green" )
					.pnt( pnt[1], "red" );
				//console.log( len, i, UNIT_AXIS[ i ] );
				*/
				return true;
			}
			
		}
	}

	return false;
}
// #endregion ///////////////////////////////////////////////////////////

// #region GEOMETRY
function geo_lines(){
	let w       = 1,
	    vert    = [
			0, 0, 0, 1,
			0, 0, w, 1,

			0, 0, 0, 0,
			w, 0, 0, 0,
			
			0, 0, 0, 2,
			0, w, 0, 2,
		];
	return {
		draw_mode	: App.Mesh.LINE, 
		mesh 		: App.Mesh.from_data_vert4( "gizmo_tranLine", vert )
	};
}

function geo_planes(){
	let w		= 0.3,
		u 		= 0.1,
		vert	= [
			0,0,0,0,
			w,0,0,0,
			w,w,0,0,
			0,w,0,0,

			0,0,0,1,
			0,0,w,1,
			0,w,w,1,
			0,w,0,1,

			0,0,0,2,
			0,0,w,2,
			w,0,w,2,
			w,0,0,2,

			0,0,u,3,
			u,0,u,3,
			u,u,u,3,
			0,u,u,3,

			u,0,u,3,
			u,0,0,3,
			u,u,0,3,
			u,u,u,3,

			0,u,u,3,
			u,u,u,3,
			u,u,0,3,
			0,u,0,3,
		],
		idx		= [ 
			0,1,2, 2,3,0,
			4,5,6, 6,7,4,
			8,9,10, 10,11,8,
			12,13,14, 14,15,12,
			16,17,18, 18,19,16,
			20,21,22, 22,23,20,
		];

	return { 
		draw_mode	: App.Mesh.TRI, 
		mesh 		: App.Mesh.from_data_vert4( "gizmo_tranQuad", vert, idx )
	};
}
// #endregion ///////////////////////////////////////////////////////////

// #region SHADER CODE
let v_src = `#version 300 es
layout(location=0) in vec4 a_pos;

uniform vec3 color_ary[ 20 ];

uniform Global{ 
	mat4 proj_view; 
	mat4 camera_matrix;
	vec3 camera_pos;
	float delta_time;
	vec2 screen_size;
	float clock;
} global;

uniform Model{ mat4 view_matrix; } model;

out vec3 frag_color;

const vec3 FWD		= vec3( 0.0, 0.0, 1.0 );
const vec3 LFT		= vec3( 1.0, 0.0, 0.0 );
const vec3 UP		= vec3( 0.0, 1.0, 0.0 );
const float LMT		= -0.2;
const float CAM_SCL	= 1.0 / 8.0;

void main(void){
	/*
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Based on angle of view, mirror flip the gizmo
	vec3 m_pos		= vec3( model.view_matrix[0][3], model.view_matrix[1][3], model.view_matrix[2][3] );
	vec3 eye_dir	= global.camera_pos - m_pos;
	vec3 scl 		= vec3( 1.0 );

	if( dot( eye_dir, LFT ) < LMT )	scl.x = -scl.x;
	if( dot( eye_dir, UP ) < LMT )	scl.y = -scl.y;
	if( dot( eye_dir, FWD ) < LMT )	scl.z = -scl.z;

	// Keep gizmo same size regardless of camera distance
	float eye_len	= length( eye_dir );
	scl				*= eye_len * CAM_SCL;

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

	vec4 w_pos	= vec4( a_pos.xyz * scl, 1.0 );
	*/

	vec4 w_pos	= vec4( a_pos.xyz, 1.0 );
	frag_color 	= color_ary[ int(a_pos.w) ];

	gl_Position	= global.proj_view * model.view_matrix * w_pos;
}`;

let f_src = `#version 300 es
precision mediump float;

in vec3 frag_color;
out vec4 out_color;

void main(void){ 
	out_color = vec4( frag_color, 1.0);
}`;
// #endregion ///////////////////////////////////////////////////////////

//################################################################################

export default GizmoMove;