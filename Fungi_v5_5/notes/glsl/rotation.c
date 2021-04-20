
const float PI          = 3.1415926535897932;
const float PI_H		= 1.5707963267948966;
const float PI_2 		= 6.283185307179586;
const float PI_2_INV 	= 1.0 / 6.283185307179586;
const float PI_Q		= 0.7853981633974483;
const float PI_270		= PI + PI_H;
const float DEG2RAD		= 0.01745329251; // PI / 180
const float RAD2DEG		= 57.2957795131; // 180 / PI

const mat3 ROT_X_90     = mat3( 1.0, 0.0, 0.0, 0.0, 0.0, -1.0, 0.0, 1.0, 0.0 );
const mat3 ROT_Y_90     = mat3( 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, -1.0, 0.0, 0.0 );

mat3 rot_x( float theta ){ float c = cos(theta); float s = sin(theta); return mat3( 1, 0, 0, 0, c, -s, 0, s, c ); }
mat3 rot_y( float theta ){ float c = cos(theta); float s = sin(theta); return mat3( c, 0, s, 0, 1, 0, -s, 0, c ); }
mat3 rot_z( float theta ){ float c = cos(theta); float s = sin(theta); return mat3( c, -s, 0, s, c, 0, 0, 0, 1 ); }

mat3 base( in vec3 ww ){
    vec3  vv  = vec3(0.0,0.0,1.0);
    vec3  uu  = normalize( cross( vv, ww ) );
    return mat3(uu.x,ww.x,vv.x,
                uu.y,ww.y,vv.y,
                uu.z,ww.z,vv.z);
}