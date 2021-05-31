import App, { Vec3 }    from "../../../fungi/App.js";
import MarchingCubes    from "./MarchingCubes.js";

class Point{
    constructor( p, idx ){
        this.idx     = idx;
        this.pos     = new Vec3( p );
        this.enabled = false;
        this.cells   = new Array();
    }

    add_cell( i ){ this.cells.push( i ); }
}

class Cell{
    constructor( x,y,z, idx ){
        this.idx     = idx;
        this.enabled = false;   // Is sell active
        this.corners = null;    // Array of Index to Points grid
        this.data    = null;    // Random Data
        this.coord   = [x,y,z];
    }
}

class MarchingCubesGrid{
    // #region MAIN
    constructor( cellCnt=[3,3,3], cellSize=2 ){
        this.cell_cnt   = new Vec3( cellCnt );

        this.cell_size  = cellSize;
        this.points     = null;
        this.cells      = null;
        this.offset_pos = new Vec3();

        this.x_pnt_cnt  = 0;
        this.y_pnt_cnt  = 0;
        this.z_pnt_cnt  = 0;
        this.l_pnt_cnt  = 0;    // Level Point Count ( X*Z )

        this.gen_grid();
    }
    // #endregion ///////////////////////////////////////////////

    // #region CORE
    gen_grid(){
        let x,y,z,v = new Vec3();
        let i = 0;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.x_pnt_cnt  = this.cell_cnt.x + 1;
        this.y_pnt_cnt  = this.cell_cnt.y + 1;
        this.z_pnt_cnt  = this.cell_cnt.z + 1;
        this.l_pnt_cnt  = this.x_pnt_cnt * this.z_pnt_cnt;
        this.points     = new Array( this.x_pnt_cnt * this.y_pnt_cnt * this.z_pnt_cnt );
        this.cells      = new Array( this.cell_cnt.x * this.cell_cnt.y * this.cell_cnt.z );

        for( y=0; y <= this.cell_cnt.y; y++ ){          v.y = y * this.cell_size;
            for( z=0; z <= this.cell_cnt.z; z++ ){      v.z = z * this.cell_size;
                for( x=0; x <= this.cell_cnt.x; x++ ){  v.x = x * this.cell_size;
                    this.points[ i ] = new Point( v, i );
                    i++;
                }
            }
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let p1, p2, p3, p4, c;
        for( y=0; y < this.cell_cnt.y; y++ ){      
            for( z=0; z < this.cell_cnt.z; z++ ){  
                for( x=0; x < this.cell_cnt.x; x++ ){
                    //------------------------------
                    // Compute Cell Index
                    i  = x + z * this.cell_cnt.x + y * ( this.cell_cnt.x * this.cell_cnt.z );
                    
                    //------------------------------
                    // Compute bottom 4 points, Top left Corner, then work Clock Wise around the square.
                    p1 = x + z * this.x_pnt_cnt + y * this.l_pnt_cnt;   // Top Left
                    p2 = p1 + 1;                                        // Top Right
                    p4 = p1 + this.x_pnt_cnt;                           // Bottom Left
                    p3 = p4 + 1;                                        // Bottom Right
                    
                    //------------------------------
                    // Create Cell and Save the points as cornerss
                    // Doing this to save time from computing the corners when 
                    // dealing ith operations
                    c         = new Cell( x, y, z, i );
                    c.corners = [ p1, p2, p3, p4,
                        p1 + this.l_pnt_cnt,
                        p2 + this.l_pnt_cnt,
                        p3 + this.l_pnt_cnt,
                        p4 + this.l_pnt_cnt,
                    ];

                    // Save Cell Reference to each point.
                    c.corners.forEach( e=>this.points[ e ].add_cell( i ) );
                    this.cells[ i ] = c;
                }
            }
        }
    }

    // Setup offset so grid's center is at origin.
    use_center_offset(){
        this.offset_pos[ 0 ] = this.cell_cnt[ 0 ] * this.cell_size * -0.5;
        this.offset_pos[ 2 ] = this.cell_cnt[ 2 ] * this.cell_size * -0.5;
        this.offset_pos[ 1 ] = 0;
        return this
    }
    // #endregion ///////////////////////////////////////////////

    // #region CELL METHODS
    // Get Cell Object by Coordnates
    get_cell( x, y, z ){
        if( x instanceof Float32Array || Array.isArray( x ) ){ y = x[1]; z = x[2]; x = x[0]; }

        let i = this._coord_to_idx( x, y, z );
        if( i == null || i >= this.cells.length ) return null;

        return this.cells[ i ];
    }

    // Get the position of the lower top-left corner
    get_cell_pos( x, y, z ){
        let c = this.get_cell( x, y, z );
        if( !c ) return null;

        return new Vec3( x, y, z ).scale( this.cell_size ).add( this.offset_pos );
    }

    // Enable Cell and all its Points
    enable_cell( x, y, z ){
        let c = this.get_cell( x, y, z );
        if( c == null ) return false;

        let i;
        for( i of c.corners ) this.points[ i ].enabled = true;
        c.enabled = true;
        
        return this;
    }

    // Test if a cell is set to enabled
    is_cell_enabled( x, y, z ){
        let c = this.get_cell( x, y, z );
        if( c == null ) return false;
        return c.enabled;
    }

    get_cell_bound( x, y, z, out=null ){
        let i = this._coord_to_idx( x, y, z );
        let c = this.cells[ i ];
        let a = this.points[ c.corners[0] ].pos;
        let b = this.points[ c.corners[6] ].pos;

        if( out ){
            out[0].from_add( a, this.offset_pos );
            out[1].from_add( b, this.offset_pos );
            return out;
        }

        return [ 
            Vec3.add( a, this.offset_pos ), 
            Vec3.add( b, this.offset_pos ), 
        ];
    }

    // Get the bit value of all the corners
    get_cell_value( c ){
        let cp, bit = 0;
        for( let i=0; i < 8; i++ ){
            cp = this.points[ c.corners[ i ] ];                    // Corner Position    
            if( cp.enabled ) bit += MarchingCubes.corner_bit[ i ]; // If on, Add its Bit Value
        }
        return bit;
    }
    // #endregion ///////////////////////////////////////////////
    
    // #region POINTS
    get_point( x, y, z ){
        if( x instanceof Float32Array || Array.isArray( x ) ){ y = x[1]; z = x[2]; x = x[0]; }

        let i = this._coord_to_point_idx( x, y, z );
        if( i == null || i >= this.points.length ) return null;

        return this.points[ i ];
    }
    
    get_point_cells( x, y, z ){
        let p = this.get_point( x, y, z );
        if( !p || p.cells.length == 0 ) return null;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let i,out = new Array();
        for( i of p.cells ) out.push( this.cells[ i ] );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        return out;
    }

    point_state( b, x, y, z ){
        let p = this.get_point( x, y, z );
        if( !p ) return this;
        p.enabled = b;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Set the connected cells as Enabled/Disabled.
        let i, c;
        for( i of p.cells ){
            c = this.cells[ i ];
            c.enabled = ( this.get_cell_value( c ) != 0 );
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        return this;
    }
    // #endregion ///////////////////////////////////////////////

    // #region COORDNATES
    is_coord_valid( x,y,z ){
        if( x instanceof Float32Array || Array.isArray( x ) ){ y = x[1]; z = x[2]; x = x[0]; }
        return (this._coord_to_idx( x,y,z ) != null);
    }

    _coord_to_idx( x, y, z ){
        if( x < 0 || y < 0 || z < 0 ||
            x >= this.cell_cnt.x ||
            y >= this.cell_cnt.y ||
            z >= this.cell_cnt.z ) return null;

        return x + z * this.cell_cnt.x + y * ( this.cell_cnt.x * this.cell_cnt.z );
    }

    _coord_to_point_idx( x, y, z ){
        if( x < 0 || y < 0 || z < 0 ||
            x >= this.x_pnt_cnt ||
            y >= this.y_pnt_cnt  ||
            z >= this.z_pnt_cnt ) return null;

        return x + z * this.x_pnt_cnt + y * this.l_pnt_cnt;
    }

    idx_to_cell_coord( idx, out=null ){
        let xz  = ( this.cell_cnt.x * this.cell_cnt.z );
        let y   = Math.floor( idx / xz );
        let x   = idx - ( xz * y );
        let z   = Math.floor( x / this.cell_cnt.z );
        x       -= z * this.cell_cnt.x;

        if( !out ) return[ x, y, z ];
        out[ 0 ] = x;
        out[ 1 ] = y;
        out[ 1 ] = z;
        return out;
    }

    idx_to_point_coord( idx, out=null ){
        let y   = Math.floor( idx / this.l_pnt_cnt );
        let x   = idx - ( this.l_pnt_cnt * y );
        let z   = Math.floor( x / this.z_pnt_cnt );
        x       -= z * this.x_pnt_cnt;

        if( !out ) return[ x, y, z ];
        out[ 0 ] = x;
        out[ 1 ] = y;
        out[ 1 ] = z;
        return out;
    }
    // #endregion ///////////////////////////////////////////////
    
    // #region GETTERS / SETTERS
    get_bounds(){ 
        return [ 
            Vec3.add( this.points[0].pos, this.offset_pos ), 
            Vec3.add( this.points[this.points.length-1].pos, this.offset_pos ), 
        ]; 
    }
    // #endregion ///////////////////////////////////////////////

    // #region MISC
    debug( inc_cell=true ){
        let o, col, a = new Vec3();
        let opos = this.offset_pos;

        for( o of this.points ){
            col = ( o.enabled )? "green" : "gray";
            App.Debug.pnt( a.from_add( o.pos, opos ), col, 0.2 );
        }

        if( inc_cell ){
            let min, max, b = new Vec3();
            for( o of this.cells ){
                if( !o.enabled ) continue;
                //console.log( o );
                min = this.points[ o.corners[ 0 ] ].pos;
                max = this.points[ o.corners[ 6 ] ].pos;
                App.Debug.box( a.from_add( min, opos ), b.from_add( max, opos ), "cyan", true );
            }
        }
    }
    // #endregion ///////////////////////////////////////////////
}


export default MarchingCubesGrid;