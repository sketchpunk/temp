import Vec3 from "../Vec3.js";

class KochanekBartels{

    static at ( t, p0, p1, p2, p3, tension, continuity, bias, out ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // OPTIMIZATION NOTES :
        // If interpolating a curve, TCB and Tangents shouldn't be calc for each point.
        // Precalc then reuse values for each t of the curve.
        // FOR splines, d0a, d0b, d1a, d1b Can be calced for all curves, then just do the tangents per curve.
        let d0a = ((1 - tension) * ( 1 + bias ) * ( 1 + continuity)) * 0.5,
            d0b = ((1 - tension) * ( 1 - bias ) * ( 1 - continuity)) * 0.5,
            d1a = ((1 - tension) * ( 1 + bias ) * ( 1 - continuity)) * 0.5,
            d1b = ((1 - tension) * ( 1 - bias ) * ( 1 + continuity)) * 0.5,

            d0x = d0a * ( p1[0] - p0[0] ) + d0b * ( p2[0] - p1[0] ),	// Incoming Tangent
            d0y = d0a * ( p1[1] - p0[1] ) + d0b * ( p2[1] - p1[1] ),
            d0z = d0a * ( p1[2] - p0[2] ) + d0b * ( p2[2] - p1[2] ),

            d1x = d1a * ( p2[0] - p1[0] ) + d1b * ( p3[0] - p2[0] ),	// Outgoing Tangent
            d1y = d1a * ( p2[1] - p1[1] ) + d1b * ( p3[1] - p2[1] ),
            d1z = d1a * ( p2[2] - p1[2] ) + d1b * ( p3[2] - p2[2] );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Interpolate a point on the curve
        let tt 	= t * t,
            ttt = tt * t;

        out = out || new Vec3();
        out.x = p1[0] + d0x * t + (- 3 * p1[0] + 3 * p2[0] - 2 * d0x - d1x) * tt + ( 2 * p1[0] - 2 * p2[0] + d0x + d1x) * ttt;
        out.y = p1[1] + d0y * t + (- 3 * p1[1] + 3 * p2[1] - 2 * d0y - d1y) * tt + ( 2 * p1[1] - 2 * p2[1] + d0y + d1y) * ttt;
        out.z = p1[2] + d0z * t + (- 3 * p1[2] + 3 * p2[2] - 2 * d0z - d1z) * tt + ( 2 * p1[2] - 2 * p2[2] + d0z + d1z) * ttt;
        return out;
    }

    static dxdy( t, p0, p1, p2, p3, tension, continuity, bias, out ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // OPTIMIZATION NOTES :
        // If interpolating a curve, TCB and Tangents shouldn't be calc for each point.
        // Precalc then reuse values for each t of the curve.
        // FOR splines, d0a, d0b, d1a, d1b Can be calced for all curves, then just do the tangents per curve.
        let d0a = ((1 - tension) * ( 1 + bias ) * ( 1 + continuity)) * 0.5,
            d0b = ((1 - tension) * ( 1 - bias ) * ( 1 - continuity)) * 0.5,
            d1a = ((1 - tension) * ( 1 + bias ) * ( 1 - continuity)) * 0.5,
            d1b = ((1 - tension) * ( 1 - bias ) * ( 1 + continuity)) * 0.5,

            d0x = d0a * ( p1[0] - p0[0] ) + d0b * ( p2[0] - p1[0]),	// Incoming Tangent
            d0y = d0a * ( p1.y - p0.y ) + d0b * ( p2.y - p1.y ),
            d0z = d0a * ( p1.z - p0.z ) + d0b * ( p2.z - p1.z ),

            d1x = d1a * ( p2[0] - p1[0] ) + d1b * ( p3[0] - p2[0] ),	// Outgoing Tangent
            d1y = d1a * ( p2[1] - p1[1] ) + d1b * ( p3[1] - p2[1] ),
            d1z = d1a * ( p2[2] - p1[2] ) + d1b * ( p3[2] - p2[2] );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Interpolate a point on the curve
        let tt 	= t * t,
            ttt = tt * t;

        out = out || new Vec3();
        out.x = d0x + (- 3 * p1[0] + 3 * p2[0] - 2 * d0x - d1x) * 2 * t + ( 2 * p1[0] - 2 * p2[0] + d0x + d1x) * 3 * tt;
        out.y = d0y + (- 3 * p1[1] + 3 * p2[1] - 2 * d0y - d1y) * 2 * t + ( 2 * p1[1] - 2 * p2[1] + d0y + d1y) * 3 * tt;
        out.z = d0z + (- 3 * p1[2] + 3 * p2[2] - 2 * d0z - d1z) * 2 * t + ( 2 * p1[2] - 2 * p2[2] + d0z + d1z) * 3 * tt;
        return out;
    }

	static debug( draw, a, b, c, d, tension=0, continuity=0, bias=0, steps=10, inc_dxdy=false ){
        let prev = new Vec3();
        let pos  = new Vec3();
        let dev  = new Vec3();
        let t;

        // Draw First Point
        this.at( 0, a, b, c, d, tension, continuity, bias, prev );
        draw.pnt( prev, "yellow", 0.05, 1 );

        for( let i=1; i <= steps; i++ ){
            t = i / steps;

            //------------------------------------
            // Draw Step
            this.at( t, a, b, c, d, tension, continuity, bias, pos );
            draw
                .ln( prev, pos, "yellow" )
                .pnt( pos, "yellow", 0.05, 1 );

            //------------------------------------
            // Draw Forward Direction
            if( inc_dxdy ){
                this.dxdy( t, a, b, c, d, tension, continuity, bias, dev );
                draw.ln( pos, dev.norm().scale( 0.4 ).add( pos ), "white" );
            }

            //------------------------------------
            prev.copy( pos );
        }
    }

}

export default KochanekBartels;