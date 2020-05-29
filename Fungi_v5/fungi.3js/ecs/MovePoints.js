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

class MovePoints{
	// #region STATIC
	static DESELECTED		= 0;
	static NEW_SELECTION	= 1;
    static SELECTION		= 2;

    static init( priority=800 ){
		App.ecs.sys_add( MovePointSys, priority );
		App.events.reg( "movepoint_selection", 0, true );
    }

	static $( name, e=null ){
		e = Points.$( name  );
		e.add_com( "MovePoints" );
		e.Points.use_size 	= 8;
		e.Points.use_shape 	= 1;
		return e;
	}
    // #endregion //////////////////////////////////////////////

	// #region FIELDS
	points		= new Array();
	updated		= true;
	sel_idx 	= null;
	ray_range	= 0.06;
	dot_color	= 0xff0000;
	sel_color	= 0x00ff00;
	// #endregion //////////////////////////////////////////////
	
	// #region GETTERS / SETTERS
	get count(){ return this.points.length; }
	
	get last_index(){ return this.points.length-1; }
	
	get_pos( idx, out=null ){ return ( out || new Vec3() ).copy( this.points[ idx ].pos ); }
	// #endregion //////////////////////////////////////////////

	// #region METHODS
	ray_hit( ray ){
		let i, p, len,
			idx		= null,
			pos 	= null,
			len_min	= Infinity;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Find A Point that the ray touches
		for( i=0; i < this.points.length; i++ ){
			p = this.points[ i ];
			len = line_near_point( ray, p.pos, this.ray_range );

			if( len != null && len < len_min ){
				len_min	= len;
				idx		= i;
				pos 	= p.pos;
			}
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let was_selected = ( this.sel_idx != null ); // Deselect Previous Item
		
		this.set_index( idx );
		this.updated = ( idx != null || was_selected ); // Only update if there is a reason too.
	}

	set_index( idx=null ){
		let pos = null;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Deselect Previous Item
		let was_selected = false;
		if( this.sel_idx != null ){
			this.points[ this.sel_idx ].color = this.dot_color;
			this.sel_idx = null;
			was_selected = true;
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Select Point
		if( idx != null ){
			let p	= this.points[ idx ];
			p.color	= this.sel_color;
			pos		= p.pos;
			this.sel_idx = idx;
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Event Handling
		let evt = null;
		if( idx == null && was_selected )		evt = MovePoints.DESELECTED;
		else if( idx != null && was_selected )	evt = MovePoints.SELECTION;
		else if( idx != null && !was_selected )	evt = MovePoints.NEW_SELECTION;

		App.events.emit( "movepoint_selection", { state:evt, index:idx, pos:pos } );

		return this;
	}

	add( pos, idx=null ){
		let o = {
			pos		: new Vec3( pos ),
			color 	: 0xff0000,
			data	: null,
		};

		if( idx != null )	this.points.splice( idx, 0, o );
		else				this.points.push( o );

		this.updated = true;
		return this;
	}

	remove( idx ){
		if( idx == this.sel_idx ) this.set_index( null );

		this.points.splice( idx, 1 );
		this.updated = true;
		return this;
	}

	move( pos, idx=null ){
		if( idx == null ){
			if( this.sel_idx == null ){ console.error( "Can not move point, no index or selection." ); return this; }
			idx = this.sel_idx;
		}

		this.points[ idx ].pos.copy( pos );
		this.updated = true;
		return this;
	}

	clear(){
		if( this.sel_idx != null ) this.set_index( null );
		this.points.length	= 0;
		this.updated		= true;
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

	serialize(){
		let p, ii = 0,
			len = this.points.length,
			ary = new Array( len * 3 );

		for( let i=0; i < len; i++ ){
			p = this.points[ i ].pos;
			ary[ ii++ ] = p[ 0 ];
			ary[ ii++ ] = p[ 1 ];
			ary[ ii++ ] = p[ 2 ];
		}
		return JSON.stringify( ary );
	}

	deserialize( txt ){
		let ary = JSON.parse( txt );
		if( !Array.isArray( ary ) ){ console.error( "Deserialize MovePoints not an array."); return this; }

		this.clear();
		let pos = new Vec3();
		for( let i=0; i < ary.length; i+= 3 ){
			this.add( pos.from_buf( ary, i ) );
		}
		return this;
	}
	// #endregion //////////////////////////////////////////////
} App.Components.reg( MovePoints );


function MovePointSys( ecs ){
	let c, ary = ecs.query_comp( "MovePoints" );
	if( !ary ) return;
	for( c of ary ) if( c.updated ) c.update();
}

//###########################################################################################
export default MovePoints;