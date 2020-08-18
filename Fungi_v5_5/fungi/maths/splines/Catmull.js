// http://paulbourke.net/miscellaneous/interpolation/
static catmull( t, a, b, c, d ){
	let t2 = t*t;
	let a0 = -0.5*a + 1.5*b - 1.5*c + 0.5*d;
	let a1 = a - 2.5*b + 2*c - 0.5*d;
	let a2 = -0.5*a + 0.5*c;
	let a3 = b;

	return a0*t*t2 + a1*t2 + a2*t + a3;
}

static catmull_quat( t, a, b, c, d, out ){
	let t2 = t * t,
		t3 = t * t2;

	out[0] = ( -0.5*a[0] + 1.5*b[0] - 1.5*c[0] + 0.5*d[0] )*t3 + ( a[0] - 2.5*b[0] + 2*c[0] - 0.5*d[0] )*t2 + ( -0.5*a[0] + 0.5*c[0] )*t + b[0];
	out[1] = ( -0.5*a[1] + 1.5*b[1] - 1.5*c[1] + 0.5*d[1] )*t3 + ( a[1] - 2.5*b[1] + 2*c[1] - 0.5*d[1] )*t2 + ( -0.5*a[1] + 0.5*c[1] )*t + b[1];
	out[2] = ( -0.5*a[2] + 1.5*b[2] - 1.5*c[2] + 0.5*d[2] )*t3 + ( a[2] - 2.5*b[2] + 2*c[2] - 0.5*d[2] )*t2 + ( -0.5*a[2] + 0.5*c[2] )*t + b[2];
	out[3] = ( -0.5*a[3] + 1.5*b[3] - 1.5*c[3] + 0.5*d[3] )*t3 + ( a[3] - 2.5*b[3] + 2*c[3] - 0.5*d[3] )*t2 + ( -0.5*a[3] + 0.5*c[3] )*t + b[3];			
	return out.normalize();
}

// http://archive.gamedev.net/archive/reference/articles/article1497.html
// ta > td is the time value of the specific key frames the values belong to.
static catmull_irregular_frames( t, a, b, c, d, ta, tb, tc, td ){
	//let bb = ((b-a) / (tb-ta)) * 0.5 + ((c-b) / (tb-ta)) * 0.5;	// Original but the second denom seems wrong.
	//let cc = ((c-a) / (tc-tb)) * 0.5 + ((d-c) / (tc-tb)) * 0.5;
	let t2 = t * t;
	let t3 = t * t2;
	let bb = ((b-a) / (tb-ta)) * 0.5 + ((c-b) / (tc-tb)) * 0.5;	// Tangent at b
	let cc = ((c-a) / (tc-tb)) * 0.5 + ((d-c) / (td-tc)) * 0.5;	// Tangent at c
	let ti = 1.0; //tc - tb;	// This hurts the animation with the BB, CC change
	return	b * (2 * t3 - 3 * t2 + 1) +
			c * (3 * t2 - 2* t3) +
			bb * ti * (t3 - 2 * t2 + t) +
			cc * ti * (t3 - t2);
}


function CatmullRom( p0, p1, p2, p3, t, out){
    let tt = t * t, ttt = tt * t;

    //https://www.mvps.org/directx/articles/catmull/
    //q(t) = 0.5 * ( (2 * P1) + (-P0 + P2) * t + (2*P0 - 5*P1 + 4*P2 - P3) * t^2 + (-P0 + 3*P1- 3*P2 + P3) * t^3)

    out = out || new THREE.Vector3();
    out.x = 0.5 * ( (2 * p1.x) + (-p0.x + p2.x) * t + ( 2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * tt + ( -p0.x + 3 * p1.x - 3 * p2.x + p3.x ) * ttt );
    out.y = 0.5 * ( (2 * p1.y) + (-p0.y + p2.y) * t + ( 2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * tt + ( -p0.y + 3 * p1.y - 3 * p2.y + p3.y ) * ttt );
    out.z = 0.5 * ( (2 * p1.z) + (-p0.z + p2.z) * t + ( 2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * tt + ( -p0.z + 3 * p1.z - 3 * p2.z + p3.z ) * ttt );
    return out;
}


// Is hermite but the end points are used as tangents
// different types (b) uniform, (c) chordal and (d) centripetal parameterization.
// uniform (alpha = 0), blue to centripetal (alpha = 0.5) and red to chordal (alpha = 1) parametrization.
//  this might be cardinal
static uniform_catmull_rom( p0, p1, p2, p3, t, tension = 0.5, out = null ){
    let xt0	= tension * ( p2.x - p0.x ),
        xt1	= tension * ( p3.x - p1.x ),
        yt0	= tension * ( p2.y - p0.y ),
        yt1	= tension * ( p3.y - p1.y ),
        zt0	= tension * ( p2.z - p0.z ),
        zt1	= tension * ( p3.z - p1.z ),
        tt 	= t * t,
        ttt	= tt * t;

    out = out || new THREE.Vector3();
    out.x = p1.x + xt0 * t + (-3 * p1.x + 3 * p2.x - 2 * xt0 - xt1) * tt + (2 * p1.x - 2 * p2.x + xt0 + xt1) * ttt;
    out.y = p1.y + yt0 * t + (-3 * p1.y + 3 * p2.y - 2 * yt0 - yt1) * tt + (2 * p1.y - 2 * p2.y + yt0 + yt1) * ttt;
    out.z = p1.z + zt0 * t + (-3 * p1.z + 3 * p2.z - 2 * zt0 - zt1) * tt + (2 * p1.z - 2 * p2.z + zt0 + zt1) * ttt;

    return 0;
}

function nonuniform_catmull_rom( p0, p1, p2, p3, t, out = null ){
    let curveType = 'chordal';

    // init Centripetal / Chordal Catmull-Rom
    var tt = t * t;
    var ttt = tt * t;
    var pow = (curveType === 'chordal') ? 0.5 : 0.25; //centripetal
    var dt0 = ( ( p1.x-p0.x ) ** 2 + ( p1.y-p0.y ) ** 2 + ( p1.z-p0.z ) ** 2 ) ** pow;
    var dt1 = ( ( p2.x-p1.x ) ** 2 + ( p2.y-p1.y ) ** 2 + ( p2.z-p1.z ) ** 2 ) ** pow;
    var dt2 = ( ( p3.x-p2.x ) ** 2 + ( p3.y-p2.y ) ** 2 + ( p3.z-p2.z ) ** 2 ) ** pow;

    // safety check for repeated points
    if ( dt1 < 1e-4 ) dt1 = 1.0;
    if ( dt0 < 1e-4 ) dt0 = dt1;
    if ( dt2 < 1e-4 ) dt2 = dt1;

    dt0 *= 0.1;
    dt1 *= 0.1;
    dt2 *= 0.1;

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // compute tangents when parameterized in [t1,t2]
    var xt1 = ( p1.x - p0.x ) / dt0 - ( p2.x - p0.x ) / ( dt0 + dt1 ) + ( p2.x - p1.x ) / dt1;
    var xt2 = ( p2.x - p1.x ) / dt1 - ( p3.x - p1.x ) / ( dt1 + dt2 ) + ( p3.x - p2.x ) / dt2;
    var yt1 = ( p1.y - p0.y ) / dt0 - ( p2.y - p0.y ) / ( dt0 + dt1 ) + ( p2.y - p1.y ) / dt1;
    var yt2 = ( p2.y - p1.y ) / dt1 - ( p3.y - p1.y ) / ( dt1 + dt2 ) + ( p3.y - p2.y ) / dt2;
    var zt1 = ( p1.z - p0.z ) / dt0 - ( p2.z - p0.z ) / ( dt0 + dt1 ) + ( p2.z - p1.z ) / dt1;
    var zt2 = ( p2.z - p1.z ) / dt1 - ( p3.z - p1.z ) / ( dt1 + dt2 ) + ( p3.z - p2.z ) / dt2;
    // rescale tangents for parametrization in [0,1]
    xt1 *= dt1;
    xt2 *= dt1;
    yt1 *= dt1;
    yt2 *= dt1;
    zt1 *= dt1;
    zt2 *= dt1;

    out = out || new THREE.Vector3();
    out.x = p1.x + xt1 * t + (- 3 * p1.x + 3 * p2.x - 2 * xt1 - xt2) * tt + ( 2 * p1.x - 2 * p2.x + xt1 + xt2) * ttt;
    out.y = p1.y + yt1 * t + (- 3 * p1.y + 3 * p2.y - 2 * yt1 - yt2) * tt + ( 2 * p1.y - 2 * p2.y + yt1 + yt2) * ttt;
    out.z = p1.z + zt1 * t + (- 3 * p1.z + 3 * p2.z - 2 * zt1 - zt2) * tt + ( 2 * p1.z - 2 * p2.z + zt1 + zt2) * ttt;

    return out;
}