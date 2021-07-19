import App, { Vec3 }  from "../../../fungi/App.js";

class PlaneAltTri{

    static mkWithEdgeLoop( geo, w=1, h=1, xCells=2, yCells=2, centerOffset=false ){
        this.mkVertUvNorm( geo, w, h, xCells, yCells, centerOffset );
        this.mkIndices( geo, xCells, yCells );
        return this.mkEdgeLoop( geo, xCells, yCells );
    }

    static mkWithEdges( geo, w=1, h=1, xCells=2, yCells=2, centerOffset=false ){
        this.mkVertUvNorm( geo, w, h, xCells, yCells, centerOffset );
        this.mkIndices( geo, xCells, yCells );
        return this.mkEdges( geo, xCells, yCells );
    }

    static mkEdgeLoop( geo, xCells=2, yCells=2 ){
        const   clen  = xCells + 1,
                rlen  = yCells + 1,
                len   = clen * rlen,
                rtn   = new Array();
        let i;

        // Top - Left To Right
        for( i=0; i < clen; i++ )       rtn.push( i );

        // Right - Top To Bottom
        for( i=1; i < rlen; i++ )       rtn.push( rlen * i + xCells );

        // Bottom - Right to Left
        for( i=1; i < clen; i++ )       rtn.push( len - i - 1 );

        // Left - Top To Bottom
        for( i=yCells-1; i > 0; i-- )   rtn.push( rlen * i );
        
        /* DEBUG 
        let v     = new Vec3();
        let verts = geo.vertices.data;
        for( i of rtn ){
            v.from_buf( verts, i*3 );
            App.Debug.pnt( v, "cyan", 0.05 );
        }*/
        return rtn;
    }

    static mkEdges( geo, xCells=2, yCells=2 ){
        const   clen  = xCells + 1,
                rlen  = yCells + 1,
                len   = clen * rlen,
                a     = new Array(),
                b     = new Array(),
                c     = new Array(),
                d     = new Array();
        let i;

        // Top - Left To Right
        for( i=0; i < clen; i++ )    a.push( i );

        // Right - Top To Bottom
        for( i=0; i < rlen; i++ )    b.push( rlen * i + xCells );

        // Bottom - Right to Left
        for( i=0; i < clen; i++ )    c.push( len - i - 1 );

        // Left - Top To Bottom
        for( i=yCells; i >= 0; i-- ) d.push( rlen * i );
        
        /* DEBUG
        let v     = new Vec3();
        let verts = geo.vertices.data;
        for( i of d ){
            v.from_buf( verts, i*3 );
            App.Debug.pnt( v, "cyan", 0.05 );
        }
        */

        return [ a, b, c, d ];
    }

    static mkVertUvNorm( geo, w=1, h=1, xCells=2, yCells=2, centerOffset=false ){
        let vert    = [ 0, 0, 0 ],
            uv      = [ 0, 0 ],
            norm    = [ 0, 1, 0 ],
            xInc    = w / xCells,
            yInc    = h / yCells,
            xOffset = 0,
            yOffset = 0,
            x, y, yPos;

        if( centerOffset ){
            xOffset = -w * 0.5;
            yOffset = -h * 0.5;
        }

        for( y=0; y <= yCells; y++ ){
            yPos    = y * yInc;
            uv[ 1 ] = 1 - ( y / yCells );

            for( x=0; x <= xCells; x++ ){
                vert[ 0 ]   = x * xInc + xOffset;
                vert[ 2 ]   = yPos + yOffset;
                uv[ 0 ]     = x / xCells;

                geo.pushVertex( vert, uv, norm );
            }
        }
    }

    static mkIndices( geo, xCells, yCells ){
        let ary     = geo.indices.data,
            col_cnt = xCells + 1,
            x, y, a, b, c, d, bit;

        for( y=0; y < yCells; y++ ){
            bit = y & 1; // Alternate the starting Quad Layout for every row 

            for( x=0; x < xCells; x++ ){
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

}

export default PlaneAltTri;