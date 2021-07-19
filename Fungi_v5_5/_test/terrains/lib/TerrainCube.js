import App, {  } 	from "../../../fungi/App.js";
import Geo          from "./Geo.js";
import PlaneAltTri  from "./PlaneAltTri.js";

// config : Vec4( xGrid, yGrid, faceIndex, layerIndex )
class TerrainCube{
    constructor(){
        this.geo            = Geo.new();
 
        this.minHeight      = 0;
        this.yCells         = 0;
        this.xCells         = 0;

        this.edgeIndices    = null;

        this.grid           = { vertCount: 0 }
        this.sideBack       = { top:[], bot:[], face:1, norm:[0,0,-1] };
        this.sideRight      = { top:[], bot:[], face:2, norm:[1,0,0] };
        this.sideFwd        = { top:[], bot:[], face:3, norm:[0,0,1] };
        this.sideLeft       = { top:[], bot:[], face:4, norm:[-1,0,0] };
        this.base           = { loop:null, center:0 };
    }

    // #region Generate Mesh
    init( minH=1, w=1, h=1, xCells=2, yCells=2, centerOffset=false ){
        this.xCells         = xCells;
        this.yCells         = yCells;
        this.minHeight      = minH;
        this.edgeIndices    = PlaneAltTri.mkWithEdges( this.geo, w, h, xCells, yCells, centerOffset );
        this.grid.vertCount = this.geo.vertices.elementCount();

        this.initConfig();


        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Move Top Face to Actual Height
        let verts = this.geo.vertices.data;
        for( let i=1; i < verts.length; i +=3 ) verts[ i ] = this.minHeight;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Create the 4 Surrounding Walls and Base
        this.createEdgeWall( this.edgeIndices[ 0 ], this.sideBack );
        this.createEdgeWall( this.edgeIndices[ 1 ], this.sideRight );
        this.createEdgeWall( this.edgeIndices[ 2 ], this.sideFwd );
        this.createEdgeWall( this.edgeIndices[ 3 ], this.sideLeft );
        this.createBase();

        //this.geo.debugAttribCount();
    }

    initConfig(){
        let attr    = this.geo.addAttrib( "config", 4 ),
            data    = [ 0, 0, 0, 0 ],
            x, y;

        for( y=0; y <= this.yCells; y++ ){
            data[ 1 ] = y;
            for( x=0; x <= this.xCells; x++ ){
                data[ 0 ] = x;
                attr.data.push( ...data );
            }
        }
    }

    createEdgeWall( idx, side ){
        let i, ii, j, ic;
        let vert    = [ 0, 0, 0 ];
        let uv      = [ 0, 0 ];
        let buf     = this.geo.vertices.data;
        let len     = idx.length - 1;
        let aConfig = this.geo.getAttrib( "config" );
        let config  = [ 0, 0, 0, 0 ];

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Duplicate Edge for Top
        config[ 2 ] = side.face;
        config[ 3 ] = 1;    // Level Index
        uv[ 1 ]     = 1;
        j           = 0;
        for( i of idx ){
            ii          = i * 3;                // Buf Index
            ic          = i * 4;
            vert[ 0 ]   = buf[ ii ];            // Vert
            vert[ 1 ]   = buf[ ii+1 ];
            vert[ 2 ]   = buf[ ii+2 ];
            uv[ 0 ]     = j++ / len;            // Uv
            config[ 0 ] = aConfig.data[ ic ];   // Grid XY
            config[ 1 ] = aConfig.data[ ic+1 ];

            side.top.push( this.geo.pushVertex( vert, uv, side.norm ) );
            aConfig.data.push( ...config );
            ///App.Debug.pnt( vert, "cyan" );
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Duplicate Edge for Bottom ( set y = 0 )
        config[ 3 ] = 2;    // Level Index
        vert[ 1 ]   = 0;
        uv[ 1 ]     = 0;
        j           = 0;
        for( i of idx ){
            ii          = i * 3;                // Buf Index
            ic          = i * 4;
            vert[ 0 ]   = buf[ ii ];            // Vert
            vert[ 2 ]   = buf[ ii+2 ];
            uv[ 0 ]     = j++ / len;            // Uv
            config[ 0 ] = aConfig.data[ ic ];   // Grid XY
            config[ 1 ] = aConfig.data[ ic+1 ];

            side.bot.push( this.geo.pushVertex( vert, uv, side.norm ) );
            aConfig.data.push( ...config );
            //App.Debug.pnt( vert, "cyan" );
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Create Indices
        for( i=0; i < len; i++ ){
            this.geo.pushQuadIndices(
                side.top[ i ],
                side.bot[ i ],
                side.bot[ i+1 ],
                side.top[ i+1 ],
            );
        }
    }

    createBase(){
        let i, ii, cnt;
        let aConfig = this.geo.getAttrib( "config" );
        let vbuf    = this.geo.vertices.data;
        let loop    = [];
        let end     = this.edgeIndices[ 0 ].length - 1;
        let vert    = [ 0, 0, 0 ];
        let cIndex  = 0;

        let fn = ( edge )=>{
            cnt = 0;
            for( i of edge ){
                ii          = i * 3;        // Buf Index
                vert[ 0 ]   = vbuf[ ii ];   // Vert
                vert[ 2 ]   = vbuf[ ii+2 ];

                loop.push( this.geo.pushVertex( vert, [ 0, 0 ], [ 0, -1, 0 ] ) );
                aConfig.data.push( -1, -1, 5, 3 );

                //App.Debug.pnt( vert, "cyan", 0.1 );
                if( ++cnt >= end ) break;
            }
        };

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Create Loop Edge of Bottom
        fn( this.sideBack.bot );
        fn( this.sideRight.bot );
        fn( this.sideFwd.bot );
        fn( this.sideLeft.bot );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Base Center Pont
        cIndex = this.geo.pushVertex( [0,0,0], [ 0, 0 ], [ 0, -1, 0 ] );
        aConfig.data.push( -1, -1, 5, 3 );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Create Fan Indices
        let len = loop.length;
        for( i=0; i < len; i++ ){
            ii = ( i + 1 ) % len;
            this.geo.pushTriIndices( loop[ i ], loop[ ii ], cIndex );
        }  

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        this.base.loop      = loop;
        this.base.center    = cIndex;
    }

    toMesh( name="TerrainCube" ){
        let buf_idx     = App.buffer.new_element( this.geo.indices.toTArray() );
        let buf_vert    = App.buffer.new_array( this.geo.vertices.toTArray(), 3 );
        let buf_norm    = App.buffer.new_array( this.geo.normals.toTArray(), 3 );
        let buf_uv      = App.buffer.new_array( this.geo.uvs.toTArray(), 2 );
        let buf_config  = App.buffer.new_array( this.geo.getAttrib( "config" ).toTArray(), 4 );
        let config      = [
            { name: "indices",  buffer: buf_idx },
            { name: "vertices", buffer: buf_vert,   attrib_loc:0, size:3, },
            { name: "normal",   buffer: buf_norm,   attrib_loc:1, size:3, },
            { name: "uv",       buffer: buf_uv,     attrib_loc:2, size:2, },
            { name: "config",   buffer: buf_config, attrib_loc:3, size:4, },
        ];

        return App.mesh.from_buffer_config( config, name, this.geo.indices.elementCount() );
    }
    // #endregion ////////////////////////////////////////////////////////////////////
}

export default TerrainCube;