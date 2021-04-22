class BoneInfo{
    static re_left  = new RegExp( "\\.l|left", "i" );
    static re_right = new RegExp( "\\.r|right", "i" );

    constructor( name, lr, find_re, ex_re=null, multi=false ){
        this.name       = name;
        this.find_re    = new RegExp( find_re, "i" );
        this.exclude_re = ( ex_re )? new RegExp( ex_re, "i" ) : null;
        this.l          = (lr & 1)? true : false;
        this.r          = (lr & 2)? true : false;
        this.multi      = multi;
    }
    
    test( bname ){ 
        if( !this.find_re.test( bname ) ) return null;
        if( this.exclude_re && this.exclude_re.test( bname ) ) return null;

        if( this.l && BoneInfo.re_left.test( bname ) ) return this.name + "_l";
        if( this.r && BoneInfo.re_right.test( bname ) ) return this.name + "_r";

        return this.name;
    }
}

class BoneMap{
    static of_armature( arm, get_idx=true ){
        let bi, b, i, n, save, rtn = {};
        for( bi of this.bones ){
            for( i=0; i < arm.bones.length; i++ ){
                b = arm.bones[ i ];
                if( (n = bi.test( b.name )) ){
                    save = ( get_idx )? i : b.name;
                    //console.log( n, b.name, i );
            
                    if( !rtn[n] )       rtn[ n ] = ( bi.multi )? [save] : save;
                    else if( bi.multi ) rtn[ n ].push( save );
                    else continue; // Dont continue if not a multi
                }
            }
        }
        return rtn;
    }

    static bones = [
        new BoneInfo( "thigh", 3, "thigh|upleg" ),
        new BoneInfo( "shin", 3, "shin|leg", "up" ),
        new BoneInfo( "foot", 3, "foot" ),
        new BoneInfo( "forearm", 3, "forearm" ),
        new BoneInfo( "upperarm", 3, "(upper.*arm|arm)", "fore" ),
        new BoneInfo( "hand", 3, "hand", "thumb|index|middle|ring|pinky" ),
        new BoneInfo( "head", 0, "head" ),
        new BoneInfo( "neck", 0, "neck" ),
        new BoneInfo( "hip", 0, "hips*" ),
        new BoneInfo( "spine", 0, "spine.*\d?", null, true ),
    ];
}

export default BoneMap;