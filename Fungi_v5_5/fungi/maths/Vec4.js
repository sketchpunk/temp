
class Vec4 extends Float32Array{
    constructor(ini){
        super(4);

        if( ini instanceof Vec4 || ini instanceof Float32Array || (ini && ini.length == 4)){
            this[0] = ini[0]; this[1] = ini[1]; this[2] = ini[2]; this[3] = ini[3]
        }else if(arguments.length == 4){
            this[0] = arguments[0]; this[1] = arguments[1]; this[2] = arguments[2]; this[3] = arguments[3];
        }else{
            this[0] = this[1] = this[2] = this[3] = ini || 0;
        }
    }

    ////////////////////////////////////////////////////////////////////
    // GETTER - SETTERS
    ////////////////////////////////////////////////////////////////////

        get x(){ return this[0]; }	set x( v ){ this[0] = v; }
        get y(){ return this[1]; }	set y( v ){ this[1] = v; }
        get z(){ return this[2]; }	set z( v ){ this[2] = v; }
        get w(){ return this[3]; }	set w( v ){ this[3] = v; }

        set_x( v ){ this[0] = v; return this; }
        set_y( v ){ this[1] = v; return this; }
        set_z( v ){ this[2] = v; return this; }
        set_w( v ){ this[3] = v; return this; }
        set( x=null, y=null, z=null, w=null ){ 
            if( x != null ) this[0] = x;
            if( y != null ) this[1] = y; 
            if( z != null ) this[2] = z;
            if( w != null ) this[3] = w;
            return this;
        }


        copy( v ){ this[0] = v[0]; this[1] = v[1]; this[2] = v[2]; this[3] = v[3]; return this; }
        
        clone(){ return new Vec4( this ); }

        reset(){ this[0] = 0; this[1] = 0; this[2] = 0; this[3] = 0; return this; }

        //-------------------------------------------

        set_len( len ){ return this.norm().scale(len); }

        len( v ){
            //Only get the magnitude of this vector
            if( !v ) return Math.sqrt( this[0]**2 + this[1]**2 + this[2]**2 + this[3]**2 );

            //Get magnitude based on another vector
            let x = this[0] - v[0],
                y = this[1] - v[1],
                z = this[2] - v[2],
                w = this[3] - v[3];

            return Math.sqrt( x*x + y*y + z*z + w*w );
        }
        
        len_sqr( v ){
            //Only get the squared magnitude of this vector
            if(v === undefined) return this[0]**2 + this[1]**2 + this[2]**2 + this[3]**2;

            //Get squared magnitude based on another vector
            let x = this[0] - v[0],
                y = this[1] - v[1],
                z = this[2] - v[2],
                w = this[3] - v[3];

            return x*x + y*y + z*z + w*w;
        }

    ////////////////////////////////////////////////////////////////////
    // FROM SETTERS
    ////////////////////////////////////////////////////////////////////

        from_add( a, b ){
            this[0] = a[0] + b[0];
            this[1] = a[1] + b[1];
            this[2] = a[2] + b[2];
            this[3] = a[3] + b[3];
            return this;
        }

        from_sub( a, b ){
            this[0] = a[0] - b[0];
            this[1] = a[1] - b[1];
            this[2] = a[2] - b[2];
            this[3] = a[3] - b[3];
            return this;
        }

        from_mul( a, b ){
            this[0] = a[0] * b[0];
            this[1] = a[1] * b[1];
            this[2] = a[2] * b[2];
            this[3] = a[3] * b[3];
            return this;
        }

        from_div( a, b ){
            this[0] = ( b[0] != 0 )? a[0] / b[0] : 0;
            this[1] = ( b[1] != 0 )? a[1] / b[1] : 0;
            this[2] = ( b[2] != 0 )? a[2] / b[2] : 0;
            this[3] = ( b[3] != 0 )? a[3] / b[3] : 0;
            return this;
        }

        from_scale( a, s ){
            this[0] = a[0] * s;
            this[1] = a[1] * s;
            this[2] = a[2] * s;
            this[3] = a[3] * s;
            return this;
        }

        from_div_scale( a, s ){
            this[0] = a[0] / s;
            this[1] = a[1] / s;
            this[2] = a[2] / s;
            this[3] = a[3] / s;
            return this;
        }

        //-------------------------------------------

        from_norm( v ){
            let mag = Math.sqrt( v[0]**2 + v[1]**2 + v[2]**2 + v[3]**2 );
            if( mag == 0 ) return this;

            mag = 1 / mag;
            this[0] = v[0] * mag;
            this[1] = v[1] * mag;
            this[2] = v[2] * mag;
            this[3] = v[3] * mag;
            return this;
        }


    ////////////////////////////////////////////////////////////////////
    // INSTANCE OPERATORS
    ////////////////////////////////////////////////////////////////////
        
        add( v ){
            this[0] = this[0] + v[0];
            this[1] = this[1] + v[1];
            this[2] = this[2] + v[2];
            this[3] = this[3] + v[3];
            return this;
        }

        sub( v ){
            this[0] = this[0] - v[0];
            this[1] = this[1] - v[1];
            this[2] = this[2] - v[2];
            this[3] = this[3] - v[3];
            return this;
        }

        mul( v ){
            this[0] = this[0] * v[0];
            this[1] = this[1] * v[1];
            this[2] = this[2] * v[2];
            this[3] = this[3] * v[3];
            return this;
        }

        div( v ){
            this[0] = (v[0] != 0)? this[0] / v[0] : 0;
            this[1] = (v[1] != 0)? this[1] / v[1] : 0;
            this[2] = (v[2] != 0)? this[2] / v[2] : 0;
            this[3] = (v[3] != 0)? this[3] / v[3] : 0;
            return this;
        }

        div_scale( v ){
            this[0] = this[0] / v;
            this[1] = this[1] / v;
            this[2] = this[2] / v;
            this[3] = this[3] / v;
            return this;
        }

        div_inv_scale( v=1 ){
            this[0] = (this[0] != 0)? v / this[0] : 0;
            this[1] = (this[1] != 0)? v / this[1] : 0;
            this[2] = (this[2] != 0)? v / this[2] : 0;
            this[3] = (this[3] != 0)? v / this[3] : 0;
            return this;
        }	

        scale( v ){
            this[0] = this[0] * v;
            this[1] = this[1] * v;
            this[2] = this[2] * v;
            this[3] = this[3] * v;
            return this;
        }

        //-------------------------------------------

        norm(){
            let mag = Math.sqrt( this[0]**2 + this[1]**2 + this[2]**2 + this[3]**2 );
            if(mag == 0) return this;

            mag = 1 / mag;
            this[0] = this[0] * mag;
            this[1] = this[1] * mag;
            this[2] = this[2] * mag;
            this[3] = this[3] * mag;

            return this;
        }
}


//########################################################################
export default Vec4;
