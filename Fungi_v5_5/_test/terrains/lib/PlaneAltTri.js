import App, { Vec3 }  from "../../../fungi/App.js";
import { LightSystem } from "../../../fungi/ecs/Lights.js";

class PlaneAltTri{

    static mk( geo, w=1, h=1, x_cells=2, y_cells=2, center_offset=false ){
        this.mkVerts( geo, w, h, x_cells, y_cells, center_offset );
        this.mkIndices( geo, x_cells, y_cells );
        this.mkUv( geo, x_cells, y_cells );
        return geo;
    }

    static mkWithEdge( geo, w=1, h=1, x_cells=2, y_cells=2, center_offset=false ){
        this.mkVerts( geo, w, h, x_cells, y_cells, center_offset );
        this.mkIndices( geo, x_cells, y_cells );
        this.mkUv( geo, x_cells, y_cells );
        return this.mkEdge( geo, x_cells, y_cells );
    }
    
    static mkEdge( geo, x_cells=2, y_cells=2 ){
        const   clen  = x_cells + 1,
                rlen  = y_cells + 1,
                len   = clen * rlen,
                rtn   = new Array();
        let i;

        // Top - Left To Right
        for( i=0; i < clen; i++ ) rtn.push( i );

        // Right - Top To Bottom
        for( i=1; i < rlen; i++ ) rtn.push( rlen * i + x_cells );

        // Bottom - Right to Left
        for( i=1; i < clen; i++ ) rtn.push( len - i - 1 );

        // Left - Top To Bottom
        for( i=y_cells-1; i > 0; i-- ) rtn.push( rlen * i );
        
        /* DEBUG 
        let v     = new Vec3();
        let verts = geo.getArray( "vertices" );
        for( i of rtn ){
            v.from_buf( verts, i*3 );
            console.log( i );
            App.Debug.pnt( v, "cyan", 0.05 );
        }
        */
        
        return rtn;
    }

    static mkVerts( geo, w=1, h=1, x_cells=2, y_cells=2, center_offset=false ){
        let vert	= geo.getVertices(),
            x_inc   = w / x_cells,
            y_inc   = h / y_cells,
            v       = new Vec3(),
            vv      = new Vec3(),
            offset  = [0,0,0],
            xx, yy;
    
        if( center_offset ){
            offset[ 0 ] = -w * 0.5;
            offset[ 2 ] = -h * 0.5;
        }
    
        for( yy=0; yy <= y_cells; yy++ ){
            v.z = yy * y_inc;
    
            for( xx=0; xx <= x_cells; xx++ ){
                v.x = xx * x_inc;  //App.Debug.pnt( v );
                vv.from_add( v, offset ).push_to( vert );
            }
        }
    }
    
    static mkIndices( geo, x_cells, y_cells ){
        let ary     = geo.getIndices(),
            col_cnt = x_cells + 1,
            x, y, a, b, c, d, bit;
    
        for( y=0; y < y_cells; y++ ){
            bit = y & 1; // Alternate the starting Quad Layout for every row 
    
            for( x=0; x < x_cells; x++ ){
                a   = y * col_cnt + x;
                b   = a + col_cnt;
                c   = b + 1
                d   = a + 1;
                // Alternate the Quad Layout for each cell
                if( ( x & 1 ) == bit )	ary.push( d, a, b, b, c, d ); // Front Slash
                else					ary.push( a, b, c, c, d, a ); // Back Slash
            }
        }
    }

    static mkUv( geo, x_cells, y_cells ){
        const ary = geo.getUvs();
        let x, y, u, v;
        for( y=0; y <= y_cells; y++ ){
            v = y / y_cells;
            for( x=0; x <= x_cells; x++ ){
                u = x / x_cells;
                ary.push( u, v );
            }
        }
    }
}

export default PlaneAltTri;