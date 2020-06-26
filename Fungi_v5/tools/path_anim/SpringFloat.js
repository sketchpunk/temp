class SpringFloat{
	vel					= 0;	// Velocity
	value				= 0;	// Current Value
	target				= 0;	// Target Value
	osc_ps				= 0;	// Oscillation Per Second ( Math.PI * 2 * i ) : 0 < i < 10
	damping				= 0;	// Damping Ratio ( 0 to 1 )
	cache_osc_ps_sqr	= 0;	// Cached Values for : osc_ps * osc_ps
	cache_damp			= 0;	// Cached Values for : -2.0 * damp_ratio * osc_ps

	constructor( osc=1, damp=1, damp_time=0 ){		
		// http://allenchou.net/2015/04/game-math-more-on-numeric-springing/
		// Damp_ratio = Log(damp) / ( -osc_ps * damp_time ) 
		// Damp Time, in seconds to damp. So damp 0.5 for every 2 seconds.
		// Damp needs to be a value between 0 and 1, if 1, creates critical damping.
		// Oscillation per second, can do fractions of pi to slow down the speed of spring
		// OSC no higher then 10 
		this.set_osc( osc );
		this.set_damping( damp, damp_time );
	}

	set_velocity( v ){ this.vel = v; return this; }
	set_target( v ){ this.target = v; return this; }
	set_value( v ){ this.value = v; return this; }
	set_osc( v ){
		this.osc_ps				= Math.PI * 2 * v;
		this.cache_osc_ps_sqr	= this.osc_ps * this.osc_ps;
		this.cache_damp			= this.damping * this.osc_ps * -2.0;
		return this;
	}
	set_damping( damp=1, damp_time=0 ){
		this.damping 	= ( !damp_time )? damp : Math.log( damp ) / ( -this.osc_ps * damp_time );
		this.cache_damp	= this.damping * this.osc_ps * -2.0;
		return this;
	}

	update( dt ){
		let damp	= dt * this.cache_damp,			// -2.0 * dt * damp_ratio * osc_ps
			osc		= dt * this.cache_osc_ps_sqr;	// dt * osc_ps * osc_ps

		this.vel	+= damp * this.vel + osc * ( this.target - this.value );
		this.value	+= dt * this.vel;

		return this.value
	}

	get is_running(){ return !( Math.abs( this.vel ) < 0.01 && Math.abs( this.value-this.target ) < 0.01 ); }
}

export default SpringFloat;