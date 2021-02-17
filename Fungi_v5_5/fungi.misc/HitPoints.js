import App, {Vec3}	from "../fungi/App.js";
import Points		from "../fungi/geo/Points.js";

class HitPoints{
    // #region STATIC METHODS
    static init( priority=800 ){
		App.ecs.components.reg( HitPoints );
		App.ecs.systems.reg( HitPointSys, priority );
	}
	
	static new_entity( name="HitPoints" ){
		let e = Points.new_entity( name );
		e.hitpoints = App.ecs.add_com( e.id, "HitPoints" ).init();
		return e;
	}
    // #endregion //////////////////////////////////////////////////////////

    // #region PROPERTIES & CONTRUCTOR
	points			= new Array();
	updated			= true;
	sel_idx			= null;
	pnts			= null;
	pnt_size		= 0.07;
	pnt_shape		= 1;
	hit_range		= 0.07;
	sel_color		= "green";
	on_state_chg	= null;

	constructor(){}
	init(){
		this.pnts				= App.ecs.get_com( this._entity_id, "Points" );
		this.pnts.default_size 	= this.pnt_size;
		this.pnts.default_shape	= 1;
		return this;
	}
    // #endregion //////////////////////////////////////////////////////////

    // #region MANAGE POINTS
	is_hit( ray ){
		let i, p, t,
			range		= this.hit_range,
			idx	    	= null,
			t_min	    = Infinity;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Find A Point that the ray touches
		for( i=0; i < this.points.length; i++ ){
			p = this.points[ i ];
			t = ray.near_point( p.pos, range );

			if( t != null && t < t_min ){
				t_min	= t;
				idx		= i;
			}
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Deselect Previous Item
        this.deselect();
        
        // Select Point
		if( idx != null ){
			p				= this.points[ idx ];
			p.color			= this.sel_color;
            this.sel_idx	= idx;
			this.updated	= true;

			if( this.on_state_chg ) this.on_state_chg( true, idx, p.pos );
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        return ( idx != null );
    }
	
	add( pos, data=null, color="red", shape=this.pnt_shape, size=this.pnt_size ){
		let o = {
			pos			: new Vec3( pos ),
			color		: color,
			data		: data,
			shape		: shape,
			size		: size,
			base_color	: color,
		};

        this.points.push( o );
        this.updated = true;
		return o;
    }

    rm_last(){ 
        this.points.pop(); 
        this.updated = true;
        this.deselect();
        return this;
	}
	
    rm_idx( idx ){
        if( idx < this.points.length ){
            this.points.splice( idx, 1 );
            this.updated = true;
            this.deselect();
        }
        return this;
    }

    deselect(){
        if( this.sel_idx != null ){
			let p = this.points[ this.sel_idx ];
			p.color = p.base_color;

			let i = this.sel_idx;
            this.sel_idx = null;
			this.updated = true;
			
			if( this.on_state_chg ) this.on_state_chg( false, i, p.pos );
        }
        return this;
    }

	get_pnt( idx=null ){
		if( idx == null ){
			if( this.sel_idx == null ){ console.error("No Index or Selected Index to get position"); return null; }
			idx = this.sel_idx;
		}
		return this.points[ idx ];		
	}

    get_pos( idx=null, out=null ){ 
		if( idx == null ){
			if( this.sel_idx == null ){ console.error("No Index or Selected Index to get position"); return null; }
			idx = this.sel_idx;
		}
		return ( out )? 
			out.copy( this.points[ idx ].pos ) :
			this.points[ idx ].pos;
	}

	get_pos_array(){
		let i, ary = new Array( this.points.length );
		for( i in this.points ) ary[ i ] = this.points[ i ].pos;
		return ary;
	}
	
	move( pos, idx=null ){
		if( idx == null ){
			if( this.sel_idx == null ){ console.error("No Index or Selected Index to move drag point"); return this; }
			idx = this.sel_idx;
		}
		this.points[ idx ].pos.copy( pos );
		this.updated = true;
		return this;
	}

	clear(){ this.deselect(); this.pnts.length = 0; this.updated = true; return this; }
    // #endregion //////////////////////////////////////////////////////////

	// #region MISC
	update(){
		let p;
		this.pnts.reset();
		for( p of this.points ) this.pnts.add( p.pos, p.color, p.size, p.shape );
		this.updated = false;
	}
	// #endregion //////////////////////////////////////////////////////////
} 

function HitPointSys( ecs ){
	let c, ary = ecs.query_comp( "HitPoints" );
	if( !ary ) return;
	for( c of ary ) if( c.updated ) c.update();
}

export default HitPoints;