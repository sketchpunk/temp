import App, { }  from "../../../fungi/App.js";

class Attrib{
    constructor( name, compLen=3, size=null, type=null, data=null ){
        this.name       = name;
        this.compLen    = compLen;
        this.type       = ( type != null )? type : Geo.TAttrib.float;
        this.data       = ( data )? data :
            ( size != null )? new Array( size ).fill( 0 ) : new Array();
    }

    static fromData( name, data, compLen=3, type = Geo.TAttrib.float ){ return new Attrib( name, compLen, null, type, data ); }
}

class Geo{
    static TAttrib = {
        "float"     : 0,
        "uint16"    : 1,
    };

    // #region MAIN
    attrib = new Map();
    // #endregion ////////////////////////////////////////////////////////////

    // #region GETTER/SETTERS
    addAttrib( name, compLen=3, type=Geo.TAttrib.float, size=null ){ this.attrib.set( name, new Attrib( name, compLen, size, type ) ); return this; }
    addAttribData( name, compLen=3, type, rawData ){ this.attrib.set( name, Attrib.fromData( name, rawData, compLen, type ) ); return this; }
    
    useUv( size=0 ){ this.addAttrib( "uvs", 2, Geo.TAttrib.float, size * 2 ); return this; }
    useNormal( size=0 ){ this.addAttrib( "normals", 3, Geo.TAttrib.float, size * 3 ); return this; }

    getVertices(){ return this.getArray( "vertices" ); }
    getIndices(){ return this.getArray( "indices" ); }
    getNormals(){ return this.getArray( "normals" ); }
    getUvs(){ return this.getArray( "uvs" ); }

    getArray( name ){
        let i = this.attrib.get( name );

        if( !i ){ console.error( "Geo Attrib not found :", name ); return null; }
        if( !i.data ){ console.error( "Geo Attrib has no data : ", name ); return null; }

        return i.data;
    }

    toType( name ){
        let a = this.attrib.get( name );
        if( !a ) return null;

        switch( a.type ){
            case Geo.TAttrib.float	: return new Float32Array( a.data );
            case Geo.TAttrib.uint16	: return new Uint16Array( a.data );
            default			        : console.log( "Unknown Type", a.type );
        }

        return null;
    }

    toMesh( name="NoNameGeo" ){
        const vert  = this.toType( "vertices" );
        const idx   = this.toType( "indices" );
        const norm  = this.toType( "normals" );
        return App.mesh.from_data( name, vert, vert.compLen, idx, norm );
    }

    // #endregion ////////////////////////////////////////////////////////////

    // #region SPECIALTY
    attribIter( name ){
        return { [Symbol.iterator]:()=>{ 
            let j, i	= 0;
            let atb = this.attrib.get( name );
            let ary = atb.data;
            let out	= { value:new Array( atb.compLen ), done:false };
            let len = ary.length;
            return {
                next: function(){
                    for( j=0; j < atb.compLen; j++ ) out.value[ j ] = ary[ i++ ];
                    
                    if( i > len ) out.done = true;
                    return out;
                }
            } 
        } };
    }
    // #endregion ////////////////////////////////////////////////////////////

    // #region STATIC BUILDERS
    static withVert(){ return new Geo().addAttrib( "vertices", 3 ); }
    static withVertIndice(){ return new Geo().addAttrib( "vertices", 3 ).addAttrib( "indices", 1, Geo.TAttrib.uint16 ); }
    static fullMesh( vertCompLen=3 ){
        return new Geo()
            .addAttrib( "vertices", vertCompLen )
            .addAttrib( "normals", 3 )
            .addAttrib( "uvs", 2 )
            .addAttrib( "indices", 1, Geo.TAttrib.uint16 );
    }
    // #endregion ////////////////////////////////////////////////////////////

    // #region GETTER/SETTERS
    debugAttribCount(){
        let k,v;
        for( [k,v] of this.attrib ){
            console.log( k, v.data.length / v.compLen );
        }
    }
    // #endregion ////////////////////////////////////////////////////////////
}

export default Geo;