import App from "../App.js";

/*  EXAMPLE
    -------------------------------------------

    ShaderGen.build({
        name     : "ShaderX",
        vert     : VERT_TMPL,
        frag     : FRAG_TMPL,
        ubos     : [ "Global", "Model" ],
        blend    : true,
        uniforms : [
            { name:"base_color", type:"rgba", value:"#ff7f7fff" },
            { name:"bones", type:"mat2x4", value:null }
        ],
    });
*/

class ShaderGen{
    // #region LIBRARY
    static libs = new Array();
    static append_lib( o ){ this.libs.push( o ) };
    static find_by_key( k ){
        let i, rtn;
        for( i of this.libs ){
            if( ( rtn = i[k] ) ) return rtn;
        }

        return null;
    }
    // #endregion ////////////////////////////////////////////////////////

    // #region PARSING AND CREATING
    static build( o, debug=0 ){
        if( !o.vert || !o.frag ){
            console.log( "ERROR: ShaderBuilder - vert & frag is required input" )
            return null;
        }

        let vert    = this.process_template( o.vert, o.placeHolder );
        let frag    = this.process_template( o.frag, o.placeHolder );
        let ubo_ary = ( o.ubos )? App.ubo.get_array( o.ubos ) : null;
        let sh      = App.shader.new( o.name, vert, frag, o.uniforms, ubo_ary );

        if( debug == 1 ) console.log( vert );
        if( debug == 2 ) console.log( frag );

        if( o.blend ) sh.set_blend( true );

        return sh;
    }

    static process_template( tmpl, pHolder ){
        const X = 2;
        let i, txt, itm,
            rtn  = "",
            idx  = 0,
            iter = tmpl.matchAll( /\#(include|placeholder) ([A-Za-z0-9_]+)/g );

        for( itm of iter ){
            i = itm.index;  // String Index of Import

            // Copy Text before Import
            if( i != idx ) rtn += tmpl.substring( idx, i );
            
            // Depending on the command, Search for code snippets
            switch( itm[1] ){
                case "include":
                    if( (txt = this.find_by_key(itm[X])) ) rtn += txt;
                    else console.log( "Shader Library Include Not Found - ", itm[ X ] );
                break;

                case "placeholder": 
                    if( pHolder && (txt = pHolder[itm[X]]) != undefined ) rtn += txt;
                    else console.log( "Shader Library PlaceHolder Not Found - ", itm[ X ] );
                break; 
            }
            
            // Index of next chunk of text after import string.
            idx = i + itm[ 0 ].length;
        }

        // Append final bit of text
        rtn += tmpl.substr( idx );
        return rtn;
    }

    // #endregion ////////////////////////////////////////////////////////
}

// Fungi Basic Lib
ShaderGen.append_lib({
    // #region UBOs
    "ubo_global" : 
`uniform Global{ 
    mediump mat4 proj_view; 
    mediump mat4 camera_matrix;
    mediump vec3 camera_pos;
    mediump float delta_time;
    mediump vec2 screen_size;
    mediump float clock;
} global;`,
    
    "ubo_model" :
`uniform Model{ 
    mat4 view_matrix;
} model;`,
    // #endregion ///////////////////////////////////////////////////////

    // #region CONSTANTS
    "const_pi" : 
`const float PI          = 3.1415926535897932;
const float PI_H		= 1.5707963267948966;
const float PI_2 		= 6.283185307179586;
const float PI_2_INV 	= 1.0 / 6.283185307179586;
const float PI_Q		= 0.7853981633974483;
const float PI_270		= PI + PI_H;`,
    
    "const_mat3_rot" :
`const mat3 ROT_X_90     = mat3( 1.0, 0.0, 0.0, 0.0, 0.0, -1.0, 0.0, 1.0, 0.0 );
const mat3 ROT_Y_90     = mat3( 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, -1.0, 0.0, 0.0 );`,
    // #endregion ///////////////////////////////////////////////////////

    // #region QUATERNIONS
        "math_quaternion" :
`vec3 quat_mul_vec3( vec4 q, vec3 v ){ return v + (2.0 * cross(q.xyz, cross(q.xyz, v) + (q.w * v))); }

// If quat is normalized, can use conjugate in place of invert
vec4 quat_conjugate( vec4 q ){ return vec4( -q.xyz, q.w ); }`,
    // #endregion ///////////////////////////////////////////////////////
});

export default ShaderGen;