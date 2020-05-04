import RaySystem	from "../fungi.ray/RaySystem.js";
import MovePoints	from "../fungi.misc/MovePoints.js";
import GizmoMove	from "../fungi.misc/GizmoMove.js";

//####################################################################

let eGiz = null;
let ePnt = null;
let Gizmo_Move_Handler = null;


// #region EVENT HANDLERS

function on_ray( ray ){
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// If gizmo is currently active, then its the first to do a hit test.
	if( eGiz.info.active ){
		if( eGiz.GizmoMove.is_hit( ray ) )	return;						// Exit, Component will continue to handle following Mouse events
		else 								eGiz.GizmoMove.hide();
	}

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Check if any points gets intersected by the ray.
	if( ePnt.MovePoints.is_hit( ray ) ){
		let pos = ePnt.MovePoints.get_pos();	// Get the Position of the selected point
		eGiz.GizmoMove.show( pos );				// Move Gizmo to that position
	}	
}

function on_gizmo_move( pos ){
	ePnt.MovePoints.move( pos );
	if( Gizmo_Move_Handler ) Gizmo_Move_Handler( pos );
}

// #endregion ////////////////////////////////////////////////////

//####################################################################

export default {
	init : function(){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// SETUP SYSTEMS
		MovePoints.init();
		RaySystem.init( 0, on_ray );
		GizmoMove.init( 0, on_gizmo_move );
	
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// CREATE ENTITIES
		eGiz = GizmoMove.$( "Grizmo", false, false );
		ePnt = MovePoints.$( "DragPoints" );

		return this;
	},

	get_pnts	: ()=>{ return ePnt.MovePoints.points; },
	get_pnt 	: ( idx=null )=>{ return ePnt.MovePoints.get_pnt( idx ); },
	pnt			: ( p, data=null, )=>{ ePnt.MovePoints.add( p, data ); },
	
	set_move_handler : function( fn ){ Gizmo_Move_Handler = fn; return this; },
};
