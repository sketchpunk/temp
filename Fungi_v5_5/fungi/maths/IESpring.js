import Vec3 from "./Vec3.js";
import Quat from "./Quat.js";

// http://allenchou.net/2014/04/game-math-interpolating-quaternions-with-circular-blending/
// https://gafferongames.com/post/spring_physics/
// http://allenchou.net/2015/04/game-math-more-on-numeric-springing/
// http://allenchou.net/2015/04/game-math-precise-control-over-numeric-springing/


// implicit euler base class
class IESpring_Base{
    // #region MAIN
    osc_ps  = Math.PI * 2;  // Oscillation per Second : How many Cycles (Pi*2) per second.	
    damping = 1;            // How much to slow down : Value between 0 and 1. 1 creates critical damping.
    epsilon = 0.01;
    // #endregion ///////////////////////////////////////////////////////////////////

    // #region SETTERS / GETTERS
    set_target( v ){ console.log( "SET_TARGET NOT IMPLEMENTED"); return this; }
    set_osc_ps( sec ){ this.osc_ps = Math.PI * 2 * sec; return this; }
    set_damp( damping ){ this.damping = damping; return this; }
    
    // Damp Time, in seconds to damp. So damp 0.5 for every 2 seconds.
    // With the idea that for every 2 seconds, about 0.5 damping has been applied
    set_damp_ratio( damping, damp_time ){ this.damping = Math.log( damping ) / ( -this.osc_ps * damp_time ); return this; }
    
    // Reduce oscillation by half in X amount of seconds
    set_damp_halflife( damp_time ){
        this.damping = 0.6931472 / ( this.osc_ps * damp_time ); // float zeta = -ln(0.5f) / ( omega * lambda );
        return this;
    }

    // Critical Damping with a speed control of how fast the cycle to run
    set_damp_expo( damp_time ){
        this.osc_ps  = 0.6931472 / damp_time; // -Log(0.5) but in terms of OCS its 39.7 degrees over time
        this.damping = 1;
        return this
    }
    // #endregion ///////////////////////////////////////////////////////////////////

    update( dt ){ console.log( "UPDATE NOT IMPLEMENTED"); return false; }
}

// implicit euler spring
class IESpring_f extends IESpring_Base {
    // #region MAIN
    vel     = 0; // Velocity
    val     = 0; // Currvent Value
    tar     = 0; // Target Value
    // #endregion ///////////////////////////////////////////////////////////////////

    // #region SETTERS / GETTERS
    set_target( v ){ this.tar = v; return this; }
    // #endregion ///////////////////////////////////////////////////////////////////

    update( dt ){
        if( this.vel == 0 && this.tar == this.val ) return false;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if ( Math.abs( this.vel ) < this.epsilon && Math.abs( this.tar - this.val ) < this.epsilon ) {
            this.vel = 0;
            this.val = this.tar;
            return true;
        }
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let friction = 1.0 + 2.0 * dt * this.damping * this.osc_ps,
            dt_osc	 = dt * this.osc_ps**2,
            dt2_osc  = dt * dt_osc,
            det_inv  = 1.0 / ( friction + dt2_osc );

        this.vel = ( this.vel + dt_osc * ( this.tar - this.val ) ) * det_inv;
        this.val = ( friction * this.val + dt * this.vel + dt2_osc * this.tar ) * det_inv;
        
        return true;
    }
}

class IESpring_Vec3 extends IESpring_Base {
    // #region MAIN
    vel     = new Vec3(); // Velocity
    val     = new Vec3(); // Current Value
    tar     = new Vec3(); // Target Value
    epsilon = 0.00001;
    // #endregion ///////////////////////////////////////////////////////////////////

    // #region SETTERS / GETTERS
    set_target( v ){ this.tar.copy( v ); return this; }

    reset( v=null ){
        this.vel.set( 0, 0, 0 );

        if( v ){
            this.val.copy( v );
            this.tar.copy( v );
        }else{
            this.val.set( 0, 0, 0 );
            this.tar.set( 0, 0, 0 );
        }

        return this;
    }
    // #endregion ///////////////////////////////////////////////////////////////////

    update( dt ){
        if( this.vel.is_zero() && Vec3.len_sqr( this.tar, this.val ) == 0 ) return false;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if ( this.vel.len_sqr() < this.epsilon && Vec3.len_sqr( this.tar, this.val ) < this.epsilon ) {
            this.vel.set( 0, 0, 0 );
            this.val.copy( this.tar );
            return true;
        }
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let friction = 1.0 + 2.0 * dt * this.damping * this.osc_ps,
            dt_osc	 = dt * this.osc_ps**2,
            dt2_osc  = dt * dt_osc,
            det_inv  = 1.0 / ( friction + dt2_osc );

        this.vel[0] = ( this.vel[0] + dt_osc * ( this.tar[0] - this.val[0] ) ) * det_inv;
        this.vel[1] = ( this.vel[1] + dt_osc * ( this.tar[1] - this.val[1] ) ) * det_inv;
        this.vel[2] = ( this.vel[2] + dt_osc * ( this.tar[2] - this.val[2] ) ) * det_inv;

        this.val[0] = ( friction * this.val[0] + dt * this.vel[0] + dt2_osc * this.tar[0] ) * det_inv;
        this.val[1] = ( friction * this.val[1] + dt * this.vel[1] + dt2_osc * this.tar[1] ) * det_inv;
        this.val[2] = ( friction * this.val[2] + dt * this.vel[2] + dt2_osc * this.tar[2] ) * det_inv;

        return true;
    }
}

class IESpring_Quat extends IESpring_Base {
    // #region MAIN
    vel     = new Quat(); // Velocity
    val     = new Quat(); // Current Value
    tar     = new Quat(); // Target Value
    epsilon = 0.00001;
    // #endregion ///////////////////////////////////////////////////////////////////

    // #region SETTERS / GETTERS
    set_target( v, do_norm=false ){ this.tar.copy( v ); if( do_norm ){ this.tar.norm(); } return this; }
    // #endregion ///////////////////////////////////////////////////////////////////

    update( dt ){
        if( this.vel.is_zero() && Quat.len_sqr( this.tar, this.val ) == 0 ) return false;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if ( this.vel.len_sqr() < this.epsilon && Quat.len_sqr( this.tar, this.val ) < this.epsilon ) {
            this.vel.set( 0, 0, 0, 0 );
            this.val.copy( this.tar );
            return true;
        }

        if( Quat.dot( this.tar, this.val ) < 0 ) this.tar.negate(); // Can screw up skinning if axis not in same hemisphere
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        let friction = 1.0 + 2.0 * dt * this.damping * this.osc_ps,
            dt_osc	 = dt * this.osc_ps**2,
            dt2_osc  = dt * dt_osc,
            det_inv  = 1.0 / ( friction + dt2_osc );

        this.vel[0] = ( this.vel[0] + dt_osc * ( this.tar[0] - this.val[0] ) ) * det_inv;
        this.vel[1] = ( this.vel[1] + dt_osc * ( this.tar[1] - this.val[1] ) ) * det_inv;
        this.vel[2] = ( this.vel[2] + dt_osc * ( this.tar[2] - this.val[2] ) ) * det_inv;
        this.vel[3] = ( this.vel[3] + dt_osc * ( this.tar[3] - this.val[3] ) ) * det_inv;

        this.val[0] = ( friction * this.val[0] + dt * this.vel[0] + dt2_osc * this.tar[0] ) * det_inv;
        this.val[1] = ( friction * this.val[1] + dt * this.vel[1] + dt2_osc * this.tar[1] ) * det_inv;
        this.val[2] = ( friction * this.val[2] + dt * this.vel[2] + dt2_osc * this.tar[2] ) * det_inv;
        this.val[3] = ( friction * this.val[3] + dt * this.vel[3] + dt2_osc * this.tar[3] ) * det_inv;

        this.val.norm();
        return true;
    }
}

export { IESpring_f, IESpring_Vec3, IESpring_Quat };