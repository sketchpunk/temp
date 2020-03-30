import App		from "../fungi/App.js";
import Vec3		from "../fungi/maths/Vec3.js";
import Points	from "../fungi/geo/Points.js";

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

    // #region PROPERTIES AND CONTRUCTOR
	points		= new Array();
	updated		= true;
	sel_idx 	= null;
	ray_bind	= this.on_ray.bind( this );

	constructor(){}
    // #endregion //////////////////////////////////////////////////////////

    on_ray( e ){ this.is_hit( e.detail ); }

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
    
    // #region Manage Points
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

    get_sel_pos(){ return ( this.sel_idx == null )? null : this.points[ this.sel_idx ].pos; }
    set_sel_pos( pos ){ 
        if( this.sel_idx != null ){
            this.points[ this.sel_idx ].pos.copy( pos );
            this.updated = true;
        }
    }
    // #endregion //////////////////////////////////////////////////////////c

	update(){
		let e 		= App.ecs.entities[ this.entity_id ];
		let pnts	= e.Points;

		pnts.reset();
		for( let p of this.points ){
			pnts.add( p.pos, p.color );
		}
		this.updated = false;
	}
} 


function DragPointSys( ecs ){
	let c, ary = ecs.query_comp( "DragPoints" );
	if( !ary ) return;
	for( c of ary ) if( c.updated ) c.update();
}


export default DragPoints;