import SplineMap from "../fungi/maths/curves/SplineMap.js";
import Vec3      from "../fungi/maths/Vec3.js";

class SplineAnimator{

    constructor( spline ){
        this.spline = spline;
        this.map    = new SplineMap( spline );
        this.offset = new Vec3();
        this.pos    = new Vec3();
        this.dir    = new Vec3();
    }

    at( t, pos=null, dir=null ){
        let tt  = this.map.at( t );
        if( !pos ) pos = this.pos;
        if( !dir ) dir = this.dir;

        this.spline.at( tt, pos, dir );
        pos.add( this.offset );
        return pos;
    }

    at_curve( idx, t, pos=null, dir=null ){
        let tt  = this.map.at_curve( idx, t );
        if( !pos ) pos = this.pos;
        if( !dir ) dir = this.dir;

        this.spline.at( tt, pos, dir );
        pos.add( this.offset );
        return pos;
    }

    at_idx_range( t, idx_a, idx_b, pos=null, dir=null ){
        let tt  = this.map.at_idx_range( t, idx_a, idx_b );
        if( !pos ) pos = this.pos;
        if( !dir ) dir = this.dir;

        this.spline.at( tt, pos, dir );
        pos.add( this.offset );
        return pos;
    }

    debug( d, see_pnts=false ){
        let prev = new Vec3();
        let pos  = new Vec3();
        let dev  = new Vec3();
        let t, steps = 30;
    
        // Draw First Point
        this.spline.at( 0, prev );
        prev.add( this.offset );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Draw Curve
        for( let i=1; i <= steps; i++ ){
            t = i / steps;

            //------------------------------------
            // Draw Step
            this.spline.at( t, pos );
            pos.add( this.offset );
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
                pos.add( this.offset );
                d.pnt( pos, "yellow", 0.06 );
            }
        }
    }
}

export default SplineAnimator;