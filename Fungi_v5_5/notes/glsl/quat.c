vec3 quat_mul_vec3( vec4 q, vec3 v ){ return v + (2.0 * cross(q.xyz, cross(q.xyz, v) + (q.w * v))); }

vec4 quat_mul(vec4 q1, vec4 q2){
    return vec4(q2.xyz * q1.w + q1.xyz * q2.w + cross(q1.xyz, q2.xyz), q1.w * q2.w - dot(q1.xyz, q2.xyz) );
}

vec4 quat_axis_angle( vec3 axis, float angle ){ return vec4( axis * sin( angle * 0.5 ), cos( angle * 0.5 ) ); }

vec4 quat_unit_vecs( vec3 a, vec3 b ){
    // Using unit vectors, Shortest rotation from Direction A to Direction B
    // http://glmatrix.net/docs/quat.js.html#line548
    // http://physicsforgames.blogspot.com/2010/03/Quat-tricks.html
    float dot = dot( a, b );

    if( dot < -0.999999 ){
        vec3 v = cross( vec3( 1.0, 0.0, 0.0 ), a );
        if( length( v ) < 0.000001 ) v = cross( vec3( 0.0, 1.0, 0.0 ), a );
        return quat_axis_angle( normalize( v ), PI );
    }else if( dot > 0.999999 ){
        return vec4( 0.0, 0.0, 0.0, 1.0 );
    }

    return normalize( vec4( cross( a, b ), 1.0 + dot ) );
}

// If quat is normalized, can use conjugate in place of invert
vec4 quat_conjugate( vec4 q ){ return vec4( -q.xyz, q.w ); }