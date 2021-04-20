float sdf_sphere( vec3 p, float radius ){ return length( p ) - radius; }

float sdf_ellipsoid( vec3 p, vec3 radii ){
    float k0 = length( p / radii ); // Distort P, then later subtract unit length of 1.
    float k1 = length( p / radii / radii ); // Used to help fix distortion
    return k0 * ( k0 - 1.0  ) / k1;
}

float sdf_ellipsoid2( vec3 p, vec3 r ){
    return (length( p/r ) - 1.0) * min(min(r.x,r.y),r.z);
}

float sdf_roundcone( vec3 p, float r1, float r2, float h ){
    vec2 q  = vec2( length( p.xz ), p.y );
    float b = ( r1 - r2 ) / h;
    float a = sqrt( 1.0 - b * b );
    float k = dot( q, vec2( -b, a) );

    if( k < 0.0 ) return length( q ) - r1;
    if( k > a*h ) return length( q - vec2( 0.0, h ) ) - r2;
        
    return dot( q, vec2( a, b ) ) - r1;
}

float sdf_segment_parapola( vec3 p, vec3 a, vec3 b, float fa, float fb, float factor ){ // factor 0.4
    vec3 ba = b - a;
    vec3 pa = p - a;
    float h = clamp( dot( pa, ba ) / dot( ba, ba ), 0.0, 1.0 );
    float r = mix( fa, fb, factor * h * ( 1.0 - h ) );     // Parabola
    return length( pa - h * ba ) - r;
}

float sdf_segment_scurve( vec3 p, vec3 a, vec3 b, float fa, float fb ){
    vec3 ba = b - a;
    vec3 pa = p - a;
    float h = clamp( dot( pa, ba ) / dot( ba, ba ), 0.0, 1.0 );
    float r = mix( fa, fb, h*h*( 3.0 - 2.0 * h ) ); // S Curved
    return length( pa - h * ba ) - r;
}


float sdf_segment_scurve3( vec3 p, vec3 a, vec3 b, float fa, float fb, float fc ){
    vec3 ba = b - a;
    vec3 pa = p - a;
    float h = clamp( dot( pa, ba ) / dot( ba, ba ), 0.0, 1.0 );
    

    //float t = parapola_pow( h, 1.0 );// * 2.0 - 1.0; // easeInOutExpo( h ) * 2.0 - 1.0;
    //float t = easeOutExpo( h );// * 2.0 - 1.0; // easeInOutExpo( h ) * 2.0 - 1.0;
    //float t = easeInOutSine( h );
    float t = h;

    //float r = ( t < 0.5 )? 
    //    mix( fb, fc, t * 2.0 ):           // 0 > .5
    //    mix( fa, fb, (t - 0.5) * 2.0 );   // .5 > 1

    //float r = mix( fb, fc, t );
    //float r = step_ramp( t, step_val, step_pos, 0.1, 3 );
    float r = lerp_ramp( t, step_val, step_pos, 2 );

    return length( pa - h * ba ) - r;
}

float sdf_segment( vec3 p, vec3 a, vec3 b, float fa, float fb ){
    vec3 ba = b - a;
    vec3 pa = p - a;
    float h = clamp( dot( pa, ba ) / dot( ba, ba ), 0.0, 1.0 ); // Projection
    float r = mix( fa, fb, h ); // Linear
    return length( pa - h * ba ) - r;
}

float sdf_box_2d( vec2 p, vec2 size ){
    return length( max( abs( p ) - size*0.5, 0.0 ) );
}

float sdf_vert_semicapsule( vec3 p, float h, float r ){
    p.y = max( p.y-h, 0.0 );
    return length( p ) - r;
}

float sdf_capsule_y( vec3 p, float h, float r ){
  p.y -= clamp( p.y, 0.0, h );
  return length( p ) - r;
}

float sdf_capsule_z( vec3 p, float h, float r ){
  p.z -= clamp( p.z, 0.0, h );
  return length( p ) - r;
}

float sdf_capsule_x( vec3 p, float h, float r ){
  p.x -= clamp( p.x, 0.0, h );
  return length( p ) - r;
}


float det( vec2 a, vec2 b ){ return a.x*b.y-b.x*a.y; }
vec3 getClosest( vec2 b0, vec2 b1, vec2 b2 ) {
    float a =     det(b0,b2);
    float b = 2.0*det(b1,b0);
    float d = 2.0*det(b2,b1);
    float f = b*d - a*a;
    vec2  d21 = b2-b1;
    vec2  d10 = b1-b0;
    vec2  d20 = b2-b0;
    vec2  gf = 2.0*(b*d21+d*d10+a*d20); gf = vec2(gf.y,-gf.x);
    vec2  pp = -f*gf/dot(gf,gf);
    vec2  d0p = b0-pp;
    float ap = det(d0p,d20);
    float bp = 2.0*det(d10,d0p);
    float t = clamp( (ap+bp)/(2.0*a+b+d), 0.0 ,1.0 );
    return vec3( mix(mix(b0,b1,t), mix(b1,b2,t),t), t );
}

vec2 sdf_bezier( vec3 a, vec3 b, vec3 c, vec3 p ){
	vec3 w = normalize( cross( c-b, a-b ) );
	vec3 u = normalize( c-b );
	vec3 v = normalize( cross( w, u ) );

	vec2 a2 = vec2( dot(a-b,u), dot(a-b,v) );
	vec2 b2 = vec2( 0.0 );
	vec2 c2 = vec2( dot(c-b,u), dot(c-b,v) );
	vec3 p3 = vec3( dot(p-b,u), dot(p-b,v), dot(p-b,w) );

	vec3 cp = getClosest( a2-p3.xy, b2-p3.xy, c2-p3.xy );

	return vec2( sqrt(dot(cp.xy,cp.xy)+p3.z*p3.z), cp.z );
}

vec2 sdf_line( vec3 p, vec3 a, vec3 b ){
	vec3 pa = p-a, ba = b-a;
	float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
	return vec2( length( pa - ba*h ), h );
}