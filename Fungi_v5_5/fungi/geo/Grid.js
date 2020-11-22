import App, { Vec3 } from "../App.js";
//import Draw from "../ecs/Draw.js";

import FlatGeo from "./flatGeo.js";

class Grid{

    static geo( w=1, h=1, x_cells=2, y_cells=2, center_offset=false ){
        let vert    = new Float32Array( (y_cells+1) * (x_cells+1) * 3 ),
            x_inc   = w / x_cells,
            y_inc   = h / y_cells,
            v       = new Vec3(),
            vv      = new Vec3(),
            offset  = [0,0,0],
            i       = 0,
            xx, yy;

        if( center_offset ){
            offset[ 0 ] = -w * 0.5;
            offset[ 2 ] = -h * 0.5;
        }

        for( yy=0; yy <= y_cells; yy++ ){
            v.z = yy * y_inc;
            for( xx=0; xx <= x_cells; xx++ ){
                v.x = xx * x_inc;  //App.Debug.pnt( v );
                
                vv.from_add( v, offset ).to_buf( vert, i*3 );
                i++;
            }
        }

        //let idx = FlatGeo.grid_indices( x_cells+1, y_cells+1 );

        return { vert: new Float32Array( vert ), idx: this.grid_idx( x_cells, y_cells ) };
    }

    static grid_idx( x_cells, y_cells ){
        let ary     = new Array(),
            col_cnt = x_cells + 1,
            x, y, a, b, c, d;

        for( y=0; y < y_cells; y++ ){
            for( x=0; x < x_cells; x++ ){
                a   = y * col_cnt + x;
                b   = a + col_cnt;
                c   = b + 1
                d   = a + 1;
                ary.push( a, b, c, c, d, a );
            }
        }

        return new Uint16Array( ary );
    }

    static debug_verts( verts, color="green" ){
        let v = new Vec3();
        for( let i=0; i < verts.length; i+=3 ){
            App.Debug.pnt( v.from_buf( verts, i ), color );
        }
    }

}

export default Grid;