import SplineMap from "../fungi/maths/curves/SplineMap.js";
import Vec3      from "../fungi/maths/Vec3.js";

class SplineAnimator{

    constructor( spline ){
        this.spline = spline;
        this.map    = new SplineMap( spline );
        this.pos    = new Vec3();
        this.dir    = new Vec3();
    }

    at( t ){
        let tt  = this.map.at( t );
        this.spline.at( tt, this.pos, this.dir );
        return this.pos;
    }

    debug( d, see_pnts=false ){
        let prev = new Vec3();
        let pos  = new Vec3();
        let dev  = new Vec3();
        let t, steps = 30;
    
        // Draw First Point
        this.spline.at( 0, prev );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Draw Curve
        for( let i=1; i <= steps; i++ ){
            t = i / steps;

            //------------------------------------
            // Draw Step
            this.spline.at( t, pos );
            d.ln( prev, pos, "yellow" );

            //------------------------------------
            prev.copy( pos );
        }
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Draw Map Points
        if( see_pnts ){
            steps = 20;
            for( let i=0; i <= steps; i++ ){
                t = i / steps;
                t = this.map.at( t );
                this.spline.at( t, pos );
                d.pnt( pos, "yellow", 0.06 );
            }
        }
    }

}

export default SplineAnimator;