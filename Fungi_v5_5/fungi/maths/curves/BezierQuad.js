import Vec3 from "../Vec3.js";

class BezierQuad{
	static at( a, b, c, t, out=null ){
		// https://en.wikipedia.org/wiki/B%C3%A9zier_curve
		// (1-t) * ((1-t) * a + t * b) + t((1-t) * b + t * c)
		out = out || new Vec3();

		let s = 1 - t;
		out[ 0 ] = s * ( s * a[0] + t * b[0] ) + t * ( s * b[0] + t * c[0] );
		out[ 1 ] = s * ( s * a[1] + t * b[1] ) + t * ( s * b[1] + t * c[1] );
		out[ 2 ] = s * ( s * a[2] + t * b[2] ) + t * ( s * b[2] + t * c[2] );
		return out;
	}

	static dxdy( a, b, c, t, out=null ){
		// 2 * (1-t) * (b-a) + 2 * t * ( c - b );
		out = out || new Vec3();

		let s2 = 2 * ( 1-t );
		let t2 = 2 * t;

		out[ 0 ] = s2 * ( b[0] - a[0] ) + t2 * ( c[0] - b[0] );
		out[ 1 ] = s2 * ( b[1] - a[1] ) + t2 * ( c[1] - b[1] );
		out[ 2 ] = s2 * ( b[2] - a[2] ) + t2 * ( c[2] - b[2] );
		return out;
	}

	static dxdy2( a, b, c, t, out=null ){
        // 2 * ( c - 2 * b + a )
        // -4b + 2a + 2c [ Simplifed Version ]
        		
		out = out || new Vec3();
		out[ 0 ] = -4 * b[0] + 2 * a[0] + 2 * c[0];
		out[ 1 ] = -4 * b[1] + 2 * a[1] + 2 * c[1];
		out[ 2 ] = -4 * b[2] + 2 * a[2] + 2 * c[2];

		return out;
    }
    
    static debug( draw, a, b, c, steps=10, inc_dxdy=false, inc_dxdy2=false ){
        let prev = new Vec3();
        let pos  = new Vec3();
        let dev  = new Vec3();
        let t;

        // Draw First Point
        this.at( a, b, c, 0, prev );
        draw.pnt( prev, "yellow", 0.05, 1 );

        for( let i=1; i <= steps; i++ ){
            t = i / steps;

            //------------------------------------
            // Draw Step
            this.at( a, b, c, t, pos );
            draw
                .ln( prev, pos, "yellow" )
                .pnt( pos, "yellow", 0.05, 1 );

            //------------------------------------
            // Draw Forward Direction
            if( inc_dxdy ){
                this.dxdy( a, b, c, t, dev );
                draw.ln( pos, dev.norm().scale( 0.4 ).add( pos ), "white" );
            }

            //------------------------------------
            // Draw Normal Direction
            if( inc_dxdy2 ){
                this.dxdy2( a, b, c, t, dev );
                draw.ln( pos, dev.norm().scale( 0.2 ).add( pos ), "green" );
            }

            //------------------------------------
            prev.copy( pos );
        }
    }
}

function draw_curves( cls, a, b, c, steps=10 ){
	let prev	= new Vec3();
	let pos		= new Vec3();
	let dev		= new Vec3();
	let dev2	= new Vec3();
	let t;

	cls.at( a, b, c, 0, prev );
	for( let i=1; i <= steps; i++ ){
		t = i / steps;
		
		cls.at( a, b, c, t, pos );
		cls.dxdy( a, b, c, t, dev );
		cls.dxdy2( a, b, c, t, dev2 );

		App.Debug
			.ln( prev, pos, "yellow" )
			.ln( pos, dev.norm().scale( 0.3 ).add( pos ), "cyan" )
			.ln( pos, dev2.norm().scale( 0.2 ).add( pos ), "green" );

		prev.copy( pos );
	}
}


export default BezierQuad;