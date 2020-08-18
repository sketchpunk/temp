function kochanek_bartels( p0, p1, p2, p3, tension, continuity, bias, t, out ){
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // OPTIMIZATION NOTES :
    // If interpolating a curve, TCB and Tangents shouldn't be calc for each point.
    // Precalc then reuse values for each t of the curve.
    // FOR splines, d0a, d0b, d1a, d1b Can be calced for all curves, then just do the tangents per curve.
    let d0a = ((1 - tension) * ( 1 + bias ) * ( 1 + continuity)) * 0.5,
      d0b = ((1 - tension) * ( 1 - bias ) * ( 1 - continuity)) * 0.5,
      d1a = ((1 - tension) * ( 1 + bias ) * ( 1 - continuity)) * 0.5,
      d1b = ((1 - tension) * ( 1 - bias ) * ( 1 + continuity)) * 0.5,

      d0x = d0a * ( p1.x - p0.x ) + d0b * ( p2.x - p1.x ),	// Incoming Tangent
      d0y = d0a * ( p1.y - p0.y ) + d0b * ( p2.y - p1.y ),
      d0z = d0a * ( p1.z - p0.z ) + d0b * ( p2.z - p1.z ),

      d1x = d1a * ( p2.x - p1.x ) + d1b * ( p3.x - p2.x ),	// Outgoing Tangent
      d1y = d1a * ( p2.y - p1.y ) + d1b * ( p3.y - p2.y ),
      d1z = d1a * ( p2.z - p1.z ) + d1b * ( p3.z - p2.z );

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Interpolate a point on the curve
    let tt 	= t * t,
        ttt = tt * t;

    out = out || new THREE.Vector3();
    out.x = p1.x + d0x * t + (- 3 * p1.x + 3 * p2.x - 2 * d0x - d1x) * tt + ( 2 * p1.x - 2 * p2.x + d0x + d1x) * ttt;
    out.y = p1.y + d0y * t + (- 3 * p1.y + 3 * p2.y - 2 * d0y - d1y) * tt + ( 2 * p1.y - 2 * p2.y + d0y + d1y) * ttt;
    out.z = p1.z + d0z * t + (- 3 * p1.z + 3 * p2.z - 2 * d0z - d1z) * tt + ( 2 * p1.z - 2 * p2.z + d0z + d1z) * ttt;
    return out;
}

function kochanek_bartels_dxdy( p0, p1, p2, p3, tension, continuity, bias, t, out ){
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // OPTIMIZATION NOTES :
    // If interpolating a curve, TCB and Tangents shouldn't be calc for each point.
    // Precalc then reuse values for each t of the curve.
    // FOR splines, d0a, d0b, d1a, d1b Can be calced for all curves, then just do the tangents per curve.
    let d0a = ((1 - tension) * ( 1 + bias ) * ( 1 + continuity)) * 0.5,
        d0b = ((1 - tension) * ( 1 - bias ) * ( 1 - continuity)) * 0.5,
        d1a = ((1 - tension) * ( 1 + bias ) * ( 1 - continuity)) * 0.5,
        d1b = ((1 - tension) * ( 1 - bias ) * ( 1 + continuity)) * 0.5,

        d0x = d0a * ( p1.x - p0.x ) + d0b * ( p2.x - p1.x ),	// Incoming Tangent
        d0y = d0a * ( p1.y - p0.y ) + d0b * ( p2.y - p1.y ),
        d0z = d0a * ( p1.z - p0.z ) + d0b * ( p2.z - p1.z ),

        d1x = d1a * ( p2.x - p1.x ) + d1b * ( p3.x - p2.x ),	// Outgoing Tangent
        d1y = d1a * ( p2.y - p1.y ) + d1b * ( p3.y - p2.y ),
        d1z = d1a * ( p2.z - p1.z ) + d1b * ( p3.z - p2.z );

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Interpolate a point on the curve
    let tt 	= t * t,
        ttt = tt * t;

    out = out || new THREE.Vector3();
    out.x = d0x + (- 3 * p1.x + 3 * p2.x - 2 * d0x - d1x) * 2 * t + ( 2 * p1.x - 2 * p2.x + d0x + d1x) * 3 * tt;
    out.y = d0y + (- 3 * p1.y + 3 * p2.y - 2 * d0y - d1y) * 2 * t + ( 2 * p1.y - 2 * p2.y + d0y + d1y) * 3 * tt;
    out.z = d0z + (- 3 * p1.z + 3 * p2.z - 2 * d0z - d1z) * 2 * t + ( 2 * p1.z - 2 * p2.z + d0z + d1z) * 3 * tt;
    return out;
}