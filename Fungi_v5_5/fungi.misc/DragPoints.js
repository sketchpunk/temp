import App			from "../fungi/App.js";
import RaySystem	from "../fungi.ray/RaySystem.js";
import HitPoints	from "./HitPoints.js";
import GizmoMove	from "./GizmoMove.js";

//####################################################################

let eGiz = null;
let ePnt = null;
let Gizmo_Move_Handler = null;

// #region EVENT HANDLERS
function on_ray( ray ){
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// If gizmo is currently active, then its the first to do a hit test.
	if( App.ecs.is_entity_active( eGiz.id ) ){
		if( eGiz.gizmo.is_hit( ray ) )	return;
		else 							eGiz.gizmo.hide();
	}

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Check if any points gets intersected by the ray.
	if( ePnt.hitpoints.is_hit( ray ) ){
		let pos = ePnt.hitpoints.get_pos();	// Get the Position of the selected point
		eGiz.gizmo.show( pos );				// Move Gizmo to that position
	}	
}

function on_gizmo_move( pos ){
	ePnt.hitpoints.move( pos );
	if( Gizmo_Move_Handler ) Gizmo_Move_Handler( ePnt.hitpoints.sel_idx, pos );
}

// #endregion ////////////////////////////////////////////////////

//####################################################################

export default {
	init : function(){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// SETUP SYSTEMS
		HitPoints.init();
		RaySystem.init( 0, on_ray );
		GizmoMove.init( 0, on_gizmo_move );
	
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// CREATE ENTITIES
		ePnt = HitPoints.new_entity( "DragPoints" );
		eGiz = GizmoMove.new_entity( "GrizmoMove" );
		eGiz.gizmo.hide();
		return this;
	},

	//pnt					: function( p, data=null, color="red" ){ ePnt.hitpoints.add( p, data, color ); return this; },
	pnt					: function(){ ePnt.hitpoints.add.apply( ePnt.hitpoints, arguments ); return this; },
	move				: function( pos, idx=null ){ ePnt.hitpoints.move( pos, idx ); return this; },
	
	set_move_handler	: function( fn ){ Gizmo_Move_Handler = fn; return this; },
	set_state_handler	: function( fn ){ ePnt.hitpoints.on_state_chg = fn; return this; },

	set_select_color	: function( c ){ ePnt.hitpoints.sel_color = c; return this; },

	get_pos				: function(){ ePnt.hitpoints.get_pos.apply( ePnt.hitpoints, arguments ); return this; },

	get_points			: function(){ return ePnt.hitpoints.points; },

	set_priority		: function( i ){ ePnt.draw.priority = i; return this; },
	set_depth_test		: function( s ){ ePnt.draw.items[0].material.options.depthTest = s; return this; },
};

//get_pos_array 		: function(){ return ePnt.hitpoints.get_pos_array(); },
//get_pnts			: function(){ return ePnt.hitpoints.points; },
//get_pnt 			: function( idx=null ){ return ePnt.hitpoints.get_pnt( idx ); },