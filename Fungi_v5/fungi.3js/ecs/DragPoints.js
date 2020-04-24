import App, { Vec3 }	from "../App.js";
import Points			from "./Points.js";

//###########################################################################################

function line_near_point( info, p, rng=0.1 ){
	/* closest_point_to_line3D
	let dx	= bx - ax,
		dy	= by - ay,
		dz	= bz - az,
		t	= ( (px-ax)*dx + (py-ay)*dy + (pz-az)*dz ) / ( dx*dx + dy*dy + dz*dz ) ; */
	let dist	= Vec3.sub( p, info.ray_origin ).mul( info.ray_len ),
		t		= ( dist[0] + dist[1] + dist[2] ) / info.len_sqr;

	if( t < 0 || t > 1 ) return null; 	// Over / Under shoots the Ray Segment

	// Get Position on Ray, Subtract from P, get length.
	let len_sqr = dist.from_lerp( info.ray_origin, info.ray_end, t ).sub( p ).len_sqr(); // Distance from point to nearest point on ray.
	return ( len_sqr <= (rng*rng) )? len_sqr : null;
}

//###########################################################################################

class DragPoints{
	// #region STATIC
	static DESELECTED		= 0;
	static NEW_SELECTION	= 1;
    static SELECTION		= 2;

    static init( priority=800 ){
		App.ecs.sys_add( DragPointSys, priority );
		App.events.reg( "dragpoint_selection", 0, true );
    }

	static $( name, e=null ){
		e = Points.$( name  );
		e.add_com( "DragPoints" );
		e.Points.use_size 	= 8;
		e.Points.use_shape 	= 1;
		return e;
	}
    // #endregion //////////////////////////////////////////////

	// #region FIELDS
	points		= new Array();
	updated		= true;
	sel_idx 	= null;
     // #endregion //////////////////////////////////////////////

	// #region METHODS
	ray_hit( ray ){
		const range = 0.06;
		let i, p, len,
			idx		= null,
			pos 	= null,
			len_min	= Infinity;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Find A Point that the ray touches
		for( i=0; i < this.points.length; i++ ){
			p = this.points[ i ];
			len = line_near_point( ray, p.pos, range );

			if( len != null && len < len_min ){
				len_min	= len;
				idx		= i;
				pos 	= p.pos;
			}
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Deselect Previous Item
		let was_selected = false;
		if( this.sel_idx != null ){
			this.points[ this.sel_idx ].color = 0xff0000;
			this.sel_idx = null;
			was_selected = true;
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Select Point
		if( idx != null ){
			p = this.points[ idx ];
			p.color = 0x00ff00;
			this.sel_idx = idx;
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Event Handling
		let evt = null;
		if( idx == null && was_selected )		evt = DragPoints.DESELECTED;
		else if( idx != null && was_selected )	evt = DragPoints.SELECTION;
		else if( idx != null && !was_selected )	evt = DragPoints.NEW_SELECTION;

		App.events.emit( "dragpoint_selection", { state:evt, index:idx, pos:pos } );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.updated = ( idx != null || was_selected ); // Only update if there is a reason too.
	}

	add( pos ){
		let o = {
			pos		: new Vec3( pos ),
			color 	: 0xff0000,
			data	: null,
		};
		this.points.push( o );
		return this;
	}

	move( pos, idx=null ){
		if( idx == null ){
			if( this.sel_idx == null ){ console.error( "Can not move drag point, no index or selection." ); return this; }
			idx = this.sel_idx;
		}

		this.points[ idx ].pos.copy( pos );
		this.updated = true;
		return this;
	}

	update(){
		let e 		= App.ecs.entities[ this.entity_id ];
		let pnts	= e.Points;

		pnts.reset();
		for( let p of this.points ){
			pnts.add( p.pos, p.color );
		}

		this.updated = false;
	}
	// #endregion //////////////////////////////////////////////
} App.Components.reg( DragPoints );


function DragPointSys( ecs ){
	let c, ary = ecs.query_comp( "DragPoints" );
	if( !ary ) return;
	for( c of ary ) if( c.updated ) c.update();
}

//###########################################################################################

export default DragPoints;