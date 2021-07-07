class BoneInfo{
    static re_left  = new RegExp( "\\.l|left|_l", "i" );
    static re_right = new RegExp( "\\.r|right|_r", "i" );

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
        for( i=0; i < arm.bones.length; i++ ){
            b = arm.bones[ i ];
            //console.log( "--", i, b.name );
            for( bi of this.bones ){
                if( (n = bi.test( b.name )) ){
                    //console.log( "----TEST", b.name , " is ", n, "Index", i );
                    save = ( get_idx )? i : b.name;

                    if( !rtn[n] )       rtn[ n ] = ( bi.multi )? [save] : save;     // Save First Instance
                    else if( bi.multi ) rtn[ n ].push( save );                      // If Multiple, Add to array
                    
                    break;
                }
            }
        }
        return rtn;
    }

    static bones = [
        new BoneInfo( "thigh", 3, "thigh|up.*leg", "twist" ), //upleg | upperleg
        new BoneInfo( "shin", 3, "shin|leg|calf", "up|twist" ),
        new BoneInfo( "foot", 3, "foot" ),
        new BoneInfo( "upperarm", 3, "(upper.*arm|arm)", "fore|twist|lower" ),
        new BoneInfo( "forearm", 3, "forearm|arm", "up|twist" ),
        new BoneInfo( "hand", 3, "hand", "thumb|index|middle|ring|pinky" ),
        new BoneInfo( "head", 0, "head" ),
        new BoneInfo( "neck", 0, "neck" ),
        new BoneInfo( "hip", 0, "hips*|pelvis" ),
        new BoneInfo( "spine", 0, "spine.*\d*|chest", null, true ),
    ];
}

export default BoneMap;