import App, { }  from "../../../fungi/App.js";

class GeoAttrib{
    constructor( name, compLen=3, type=Geo.FLOAT ){
        this.name    = name;
        this.compLen = compLen;
        this.type    = type;
        this.data    = null;
    }

    useData( d ){ this.data = d; return this; }
    init( s=0 ){
        this.data = ( s > 0 )? new Array( s ).fill( 0 ) : [];
        return this;
    }

    elementCount(){ return this.data.length / this.compLen; }

    toTArray(){
        switch( this.type ){
            case Geo.FLOAT  : return new Float32Array( this.data );
            case Geo.UINT16 : return new Uint16Array( this.data );
            default : console.error( "GeoAttrib - Unknown type : ", this.type );
        }
        return null;
    }

    finalize(){
        let d = this.toTArray();
        if( d ){
            this.data.length = 0;   // Clear out array
            this.data = d;          // Replace Array with TypeArray
        }
    }
}

class Geo{
    // #region MAIN
    static FLOAT    = 0;
    static UINT16   = 1;

    vertices    = null;
    indices     = null;
    uvs         = null;
    normals     = null;
    attribs     = new Map();

    constructor(){}
    // #endregion ////////////////////////////////////////////////////////

    // #region ATTRIBUTES
    addAttrib( name, compLen=2, size=0, type=Geo.FLOAT ){
        let attr = new GeoAttrib( name, compLen, type );
        if( size != null ) attr.init( size );
        this.attribs.set( name, attr );
        return attr;
    }

    getAttrib( name ){
        let rtn = this.attribs.get( name );
        if( !rtn ){
            console.error( "Geo : Attribute does not exist - ", name );
            return null;
        }

        return rtn;
    }

    addIndices( size=0, type=Geo.UINT16 ){
        this.indices = new GeoAttrib( "indices", 1, type );
        if( size != null ) this.indices.init( size );
        return this.indices;
    }

    addVertices( size=0, compLen=3 ){
        this.vertices = new GeoAttrib( "vertices", compLen );
        if( size != null ) this.vertices.init( size * compLen );
        return this.vertices;
    }

    addNormals( size=0, compLen=3 ){
        this.normals = new GeoAttrib( "normals", compLen );
        if( size != null ) this.normals.init( size * compLen );
        return this.normals;
    }

    addUV( size=0, compLen=2 ){
        this.uvs = new GeoAttrib( "uvs", compLen );
        if( size != null ) this.uvs.init( size * compLen );
        return this.uvs;
    }
    // #endregion ////////////////////////////////////////////////////////

    // #region METHODS
    toMesh( name="NoNameGeo" ){
        const vert  = this.vertices.toTArray();
        const idx   = ( this.indices )? this.indices.toTArray() : null;
        const norm  = ( this.normals )? this.normals.toTArray() : null;
        const uv    = ( this.uvs )? this.uvs.toTArray() : null;
        return App.mesh.from_data( name, vert, this.vertices.compLen, idx, norm, uv  );
    }

    finalizeType(){
        if( this.vertices ) this.vertices.finalize();
        if( this.indices )  this.indices.finalize();
        if( this.normals )  this.normals.finalize();
        if( this.uvs )      this.uvs.finalize();
    }
    // #endregion ////////////////////////////////////////////////////////

    // #region VERTEX SETTERS / GETTERS
    pushTriIndices( a, b, c ){ this.indices.data.push( a, b, c ); }
    pushQuadIndices( a, b, c, d ){ this.indices.data.push( a, d, c, c, b, a ); }
    pushVertex( pos, uv=null, norm=null ){
        let idx = null;
        
        if( pos && this.vertices ){
            idx = this.vertices.elementCount();
            this.vertices.data.push( ...pos );
        }

        if( uv && this.uvs )        this.uvs.data.push( ...uv );
        if( norm && this.normals )  this.normals.data.push( ...norm );

        return idx;
    }

    getVertex( i, out=null ){
        if( !this.vertices ) return null;
        out = out || [];
        
        let clen = this.vertices.compLen;
        i *= clen;

        for( let j=0; j < clen; j++ ) out[ j ] = this.vertices.data[ i+j ];

        return out;
    }
    // #endregion ////////////////////////////////////////////////////////

    // #region DEBUGGING
    debugVertices(){
        let eCnt    = this.vertices.elementCount();
        let v       = [0,0,0];

        for( let i=0; i < eCnt; i++ ){
            this.getVertex( i, v );
            App.Debug.pnt( v, "cyan", 0.1 );
        }
    }

    debugAttribCount(){
        if( this.vertices ) console.log( "Vertices ", this.vertices.elementCount() );
        if( this.indices ) console.log( "indices ", this.indices.elementCount() );
        if( this.uvs ) console.log( "uvs ", this.uvs.elementCount() );
        if( this.normals ) console.log( "indices ", this.normals.elementCount() );

        let k,v;
        for( [k,v] of this.attribs ) console.log( k, v.elementCount() );
    }
    // #endregion ////////////////////////////////////////////////////////

    // #region STATIC METHODS
    static new(){ 
        let geo = new Geo();
        geo.addVertices();
        geo.addIndices();
        geo.addNormals()
        geo.addUV();
        return geo;
    }
    // #endregion ////////////////////////////////////////////////////////

}

export default Geo;