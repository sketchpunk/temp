
import Vec3 from "../Vec3.js";

/*
// http://paulbourke.net/miscellaneous/interpolation/
fucntion catmull( t, a, b, c, d ){
	let t2 = t*t;
	let a0 = -0.5*a + 1.5*b - 1.5*c + 0.5*d;
	let a1 = a - 2.5*b + 2*c - 0.5*d;
	let a2 = -0.5*a + 0.5*c;
	let a3 = b;

	return a0*t*t2 + a1*t2 + a2*t + a3;
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
*/

class Catmull{

    static at( t, a, b, c, d, out ){
		let t2 = t*t;
		let t3 = t * t2;

		out[0] = (-0.5*a[0] + 1.5*b[0] - 1.5*c[0] + 0.5*d[0]) * t3 + (a[0] - 2.5*b[0] + 2*c[0] - 0.5*d[0]) * t2 + (-0.5*a[0] + 0.5*c[0]) * t + b[0];
		out[1] = (-0.5*a[1] + 1.5*b[1] - 1.5*c[1] + 0.5*d[1]) * t3 + (a[1] - 2.5*b[1] + 2*c[1] - 0.5*d[1]) * t2 + (-0.5*a[1] + 0.5*c[1]) * t + b[1];
		out[2] = (-0.5*a[2] + 1.5*b[2] - 1.5*c[2] + 0.5*d[2]) * t3 + (a[2] - 2.5*b[2] + 2*c[2] - 0.5*d[2]) * t2 + (-0.5*a[2] + 0.5*c[2]) * t + b[2];

        return out;
    }

	static debug( draw, a, b, c, d, steps=10, inc_dxdy=false ){
        let prev = new Vec3();
        let pos  = new Vec3();
        let t;

        // Draw First Point
        this.at( 0, a, b, c, d, prev );
        draw.pnt( prev, "yellow", 0.05, 1 );

        for( let i=1; i <= steps; i++ ){
            t = i / steps;

            //------------------------------------
            // Draw Step
            this.at( t, a, b, c, d, pos );
            draw
                .ln( prev, pos, "yellow" )
                .pnt( pos, "yellow", 0.05, 1 );

            //------------------------------------
            prev.copy( pos );
        }
    }

}


export default Catmull;