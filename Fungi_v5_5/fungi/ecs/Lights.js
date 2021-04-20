import App, { Colour } from "../App.js";

/*
let l_sun = Light.new_entity( { name:"sun", type:"dir", color:"yellow", strength:0.7 } );
let l_red = Light.new_entity( { name:"red", type:"pnt", color:"red", pos:[0,1,1], attenuation:0 } );

732-842-8685
732-224-2793 - Monmouth oceans business, 
*/

//#########################################################################

// #region LIGHT SOURCES
class DirectionSrc{
    /*struct{
        int     type;           // 0
        vec3    dir;            // 4, 8, 12
        vec3    color;          // 16, 20, 24
        float   strength;       // 28
        vec3    spec_color;     // 32
    }*/
    buf         = new ArrayBuffer( 16 * 4 );            // Main Buffer : Space of a Mat4x4
    bytes       = new Uint8Array( this.buf );           // Byte Access to Array Buffer, used for Coping to LightBuffer
    dv          = new DataView( this.buf );             // Modifer for ArrayBuffer
    _dir        = new Float32Array( this.buf, 4, 3 );   // Direction of light, its usually direction from origin
    _color      = new Float32Array( this.buf, 16, 3 );  // Color of Light
    _spec_color = new Float32Array( this.buf, 32, 3 );  // Color of Specular Light

    constructor( dir=null, color=null, strength=1.0 ){
        this.dv.setFloat32( 0, 0, true ); // Set Type ID
        this.strength   = strength;
        this.dir        = dir   || [ 0, 1, 0 ];
        this.color      = color || "#ffffff"
        this.spec_color = "#ffffff";
    }

    set strength( v ){ this.dv.setFloat32( 28, v, true ); }             // Weight of light source, can lower for less influense 
    set color( v ){ this._color.set( new Colour( v ).rgb ); }           // Set Light Color
    set spec_color( v ){ this._spec_color.set( new Colour( v ).rgb ); } 
    set dir( v ){ this._dir.set( v ); } // Needs to be NORMALIZED
    
    set pos( v ){ 
        let len = 1 / Math.sqrt( v[0]**2 + v[1]**2 + v[2]**2 ); // Mag
        this._dir[ 0 ] = ( v[ 0 ] * len ); // Normalize
        this._dir[ 1 ] = ( v[ 1 ] * len );
        this._dir[ 2 ] = ( v[ 2 ] * len );
        return this;
    }
}

class PointSrc{
    /*struct{
        int     type;           // 0    
        vec3    pos;            // 4, 8, 12     vec4
        vec3    color;          // 16,20,24,28  vec4
        vec3    spec_color;     // 32,36,40,44  vec4
        float   constant;       // 48
        float   linear;         // 52
        float   quadratic;      // 56           vec3
        float   attenuation;    // 60           vec4
    }*/
    buf         = new ArrayBuffer( 16 * 4 );                    // Main Buffer : Space of a Mat4x4
    bytes       = new Uint8Array( this.buf );                   // Byte Access to Array Buffer, used for Coping to LightBuffer
    dv          = new DataView( this.buf );                     // Modifer for ArrayBuffer
    _pos        = new Float32Array( this.buf, 4, 3 );           // World Space Position of Light
    _color      = new Float32Array( this.buf, 16, 3 );          // Light Color
    _spec_color = new Float32Array( this.buf, 32, 3 );          // Color of Specular Light

    constructor( color=null, pos=null ){
        this.dv.setFloat32( 0, 1, true ); // Set Type ID
        this.constant    = 1.0;
        this.linear      = 0.1;
        this.quadratic   = 1.8;
        this.pos         = pos   || [ 0.0, 1.5, 0 ];
        this.color       = color || "#ffffff";
        this.spec_color  = "#ffffff";
        this.attenuation = 0;
    }

    set attenuation( v ){ this.dv.setFloat32( 60, v, true ); }  // Toggle to enable it
    set constant( v ){ this.dv.setFloat32( 48, v, true ); }     // Part of Atten : Constant 1, but less can make light more intense.
    set linear( v ){ this.dv.setFloat32( 52, v, true ); }       // Part of Atten : Kinda help control distance
    set quadratic( v ){ this.dv.setFloat32( 56, v, true ); }    // Part of Atten : Curve the strength based on distance
    
    set pos( v ){ this._pos.set( v ); }
    set color( v ){ this._color.set( new Colour( v ).rgb ); }
    set spec_color( v ){ this._spec_color.set( new Colour( v ).rgb ); }
}

// A byte buffer that replicated the UBO for Light Data
class LightBuffer{
    /*struct{
        vec3  ambient;          // 0, 4, 8
        float spec_strength;    // 12            Vec4
        float spec_shinness;    // 16
        int   light_cnt;        // 20 ( 24, 28 ) Vec4
        mat4  lights[ 5 ];      // 32, 96, 160
    } 224 bytes total*/

    buf      = new ArrayBuffer( 32 + 64 * 5 );      // Base Byte Buffer
    dv       = new DataView( this.buf );            // Modifer for Array Buffer
    _lights  = new Uint8Array( this.buf, 32 );      // Slice of Array Buffer that Contains the Array of Lights
    _ambient = new Float32Array( this.buf, 0, 3 );  // Slice of AB that holds the ambient light color. 

    constructor(){
        this.light_cnt      = 0;            // How many active lights
        this.spec_strength  = 1;            
        this.spec_shinness  = 32;
        this.ambient_color  = "#101010";    // Starting World Light
    }

    set spec_strength( v ){ this.dv.setFloat32( 12, v, true ); }
    set spec_shinness( v ){ this.dv.setFloat32( 16, v, true ); }
    set light_cnt( v ){ this.dv.setInt32( 20, v, true ); }  
    set ambient_color( v ){ this._ambient.set( new Colour( v ).rgb ); }

    set_light( idx, lit ){ this._lights.set( lit.bytes, idx * 64 ); }
}
// #endregion /////////////////////////////////////////////////////////////

// ECS COMPONENT
class Light{
    src     = null;
    updated = true;

    set_color( c ){ this.src.color = c; this.updated = true; return this; }
    set_spec_color( c ){ this.src.spec_color = c; this.updated = true; return this; }
    set_pos( v ){ this.src.pos = v; this.updated = true; return this; }
    set_strength( v ){ this.src.strength = v; this.updated = true; return this; }

    use_direction(){ this.src = new DirectionSrc(); return this; }
    use_point(){ this.src = new PointSrc(); return this; }

    static new_entity( o ){
        let id		= App.ecs.new_entity( o.name );
        let node	= App.ecs.add_com( id, "Node" ); 
        let light	= App.ecs.add_com( id, "Light" );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        switch( o.type ){
            case "dir": light.use_direction(); break;
            case "pnt": light.use_point(); break;
            default: console.error( "Unknown Light Type : ", o.type );
        }

        node.set_pos( o.pos || [0,1,0] );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if( o.color ) light.set_color( o.color );
        if( o.spec_color ) light.set_spec_color( o.spec_color );
        if( o.strength != undefined ) light.set_strength( o.strength );
        if( o.attenuation != undefined ) light.src.attenuation = o.attenuation;

        return { id, node, light };
    }
}

// ECS SYSTEM
class LightSystem{
    // #region MAIN /////////////////////////////////////////////////////
    ubo     = null;
    buf     = null;
    count   = 0;
    
    set ambient_color( c ){ this.buf.ambient_color = c; }

    init(){
        this.buf = new LightBuffer();
        this.ubo = App.ubo.new( "Lights", 10, [
            { name:"ambient",       type:"vec3" },
            { name:"spec_strength", type:"float" },
            { name:"spec_shinness", type:"float" },
            { name:"light_cnt",     type:"int32" },
            { name:"lights",        type:"mat4",    ary_len:5 },
        ]);
        return this;
    }
    // #end region /////////////////////////////////////////////////////

    run( ecs ){        
        let ary = ecs.query_entities( [ "Light", "Node" ] ),
            cnt = 0,
            i;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // 
        for( i of ary ){
            if( !i.Node.updated && !i.Light.updated ) continue;

            // If Light position has moved, Then set copy its WS to source info
            if( i.Node.updated ) i.Light.set_pos( i.Node.world.pos );

            // Update Raw buffer with Light Information
            this.buf.set_light( cnt, i.Light.src );

            i.Light.updated = false;
            cnt++;
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // If lights have been updated, update UBO
        if( cnt > 0 || cnt != this.count ){
            this.buf.light_cnt = cnt;        
            App.ubo.update( this.ubo.copy( this.buf.buf ) ); 
        }
    }
}

//#########################################################################

// #region Shader Example
/*
#version 300 es
precision mediump float;
out vec4 out_color;

//-------------------------
uniform vec4 base_color;

in vec3 frag_norm;
in vec3 frag_cam_pos;
in vec3 frag_wpos;
in vec3 frag_lpos;

//-------------------------
const int MAX_LIGHTS = 5;

uniform Lights{ 
    vec3  ambient_color;        // 0, 4, 8
    float spec_strength;        // 12            Vec4
    float spec_shininess;       // 16
    int   count;                // 20 ( 24, 28 ) Vec4
    mat4  list[ MAX_LIGHTS ];   // 32, 96, 160
} light;

struct DirLight{
    vec3    dir;            // 4, 8, 12
    vec3    color;          // 16, 20, 24
    float   strength;       // 28
    vec3    spec_color;     // 32
};

struct PntLight{
    vec3    pos;            // 4, 8, 12     vec4
    vec3    color;          // 16,20,24,28  vec4
    vec3    spec_color;     // 32,36,40,44  vec4
    float   constant;       // 48
    float   linear;         // 52
    float   quadratic;      // 56           
    float   attenuation;    // 60           vec4
};

DirLight parse_dir_light( mat4 d ){ return DirLight( d[0].yzw, d[1].xyz, d[1].w, d[2].xyz ); }
PntLight parse_pnt_light( mat4 d ){ return PntLight( d[0].yzw, d[1].xyz, d[2].xyz, d[3].x, d[3].y, d[3].z, d[3].w ); }

vec3 get_dir_light( vec3 pos, vec3 norm, vec3 cam_dir, mat4 LData ){
    DirLight lit = parse_dir_light( LData );

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// DIFFUSE
    float diff   = max( dot( norm, lit.dir ), 0.0 );    // Angle between Frag Normal and Light Direction ( 0 to 1 )
    vec3 diffuse = diff * lit.color;                    // Use the angle to scale the amount of light to use.

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// SPECULAR
	vec3 reflect_lite_n	= reflect( -lit.dir, norm );  // Light to Frag Dir (negated),
	float spec 			= pow( max( dot( cam_dir, reflect_lite_n ), 0.0 ), light.spec_shininess );
	vec3 specular_clr	= light.spec_strength * spec * lit.spec_color;

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    return clamp( ( diffuse + specular_clr ) * lit.strength, 0.0, 1.0 );
}

vec3 get_pnt_light( vec3 pos, vec3 norm, vec3 cam_dir, mat4 LData ){
    PntLight lit     = parse_pnt_light( LData );
    vec3     delta   = lit.pos - pos;
    float    dist    = length( delta );
    vec3     lit_dir = normalize( delta );

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// DIFFUSE
    float diff   = max( dot( norm, lit_dir ), 0.0 );    // Angle between Frag Normal and Light Direction ( 0 to 1 )
    vec3 diffuse = diff * lit.color;                    // Use the angle to scale the amount of light to use.

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// SPECULAR
	vec3 reflect_lite_n	= reflect( -lit_dir, norm );  // Light to Frag Dir (negated),
	float spec 			= pow( max( dot( cam_dir, reflect_lite_n ), 0.0 ), light.spec_shininess );
	vec3 specular	    = light.spec_strength * spec * lit.spec_color;

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // ATTENUATION
    float attenuation = 1.0;
    if( lit.attenuation < 0.9 ) attenuation = 1.0 / ( lit.constant + lit.linear * dist + lit.quadratic * (dist * dist) );
    //attenuation = 0.2 / distance; // Simpler/Linear Attenuation : MaxDistance / Current Distance

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    return clamp( ( diffuse + specular ) * attenuation, 0.0, 1.0 );
}

vec3 phong_multi(){
    vec3 norm       = normalize( frag_norm );	// Must normalized, Since it has been interpolated
    vec3 cam_dir    = normalize( frag_cam_pos - frag_wpos );
    vec3 lit        = light.ambient_color;

    for( int i=0; i < light.count; i++ ){
        // DIRECTION LIGHT
        if( int( light.list[ i ][ 0 ].x ) == 0 )
            lit += get_dir_light( frag_wpos, norm, cam_dir, light.list[ i ] );

        // POINT LIGHT
        else if( int( light.list[ i ][ 0 ].x ) == 1 )
            lit += get_pnt_light( frag_wpos, norm, cam_dir, light.list[ i ] );
    }

    return lit;
}

//-------------------------

void main( void ){
    vec3 lit    = phong_multi();
    out_color   = vec4( base_color.rgb * lit, 1.0 );
}
*/
// #endregion

//#########################################################################
export { Light, LightSystem };
export default function(){
    App.ecs.components.reg( Light );
    App.ecs.systems.reg( new LightSystem().init(), 900 );
    console.log( "[ Multi Lights Enabled ]" );
};