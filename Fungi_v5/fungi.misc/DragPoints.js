import App, {Vec3}	from "../fungi/App.js";
import Points		from "../fungi/geo/Points.js";

class DragPoints{
    // #region STATIC METHODS
    static init( priority=800 ){
        App.ecs.sys_add( DragPointSys, priority );
        App.Components.reg( DragPoints );
    }

	static $( name, e=null ){
		e = Points.$( e );
		e.add_com( "DragPoints" );
		e.Points.use_size 	= 0.07;
		e.Points.use_shape 	= 1;
		return e;
    }
    // #endregion //////////////////////////////////////////////////////////

    // #region PROPERTIES & CONTRUCTOR
	points		= new Array();
	updated		= true;
	sel_idx 	= null;
    // #endregion //////////////////////////////////////////////////////////

    // #region MANAGE POINTS
	is_hit( ray ){
		const range = 0.05;
        let i, p, t,
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
			p = this.points[ idx ];
			p.color = "green";
            this.sel_idx = idx;
            this.updated = true;
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        return ( idx != null );
    }
    
	add( pos ){
		let o = {
			pos		: new Vec3( pos ),
			color 	: "red",
		};
        this.points.push( o );
        this.updated = true;
		return this;
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
			this.points[ this.sel_idx ].color = "red";
            this.sel_idx = null;
            this.updated = true;
        }
        return this;
    }

    get_pos( idx=null ){ 
		if( idx == null ){
			if( this.sel_idx == null ){ console.error("No Index or Selected Index to get position"); return null; }
			idx = this.sel_idx;
		}
		return this.points[ idx ].pos;
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
    // #endregion //////////////////////////////////////////////////////////

	// #region MISC
	update(){
		let e 		= App.ecs.entities[ this.entity_id ];
		let pnts	= e.Points;

		pnts.reset();
		for( let p of this.points ){
			pnts.add( p.pos, p.color );
		}
		this.updated = false;
	}
	// #endregion //////////////////////////////////////////////////////////
} 


function DragPointSys( ecs ){
	let c, ary = ecs.query_comp( "DragPoints" );
	if( !ary ) return;
	for( c of ary ) if( c.updated ) c.update();
}


export default DragPoints;