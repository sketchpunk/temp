import Maths from "../fungi/maths/Maths.js";

// Modulas that handles Negatives, so (-1, 5) = 4
function mod( a, b ){ let v = a % b; return ( v < 0 )? b+v : v; }

class Cycle{
	constructor( sec=1 ){
		this.value			= 0;	// Current Cycle Value
		this.cycle_inc		= 0;	// How much to move per millisecond
		this.speed_scale    = 1.0;	// Scale the rate of the cycle
        this.set_by_seconds( sec ); 
        this.on_update      = null;
	}

	set_by_seconds( s ){ this.cycle_inc = Maths.PI_2 / ( s * 1000 ); return this; }

	backwards(){ if( this.speed_scale > 0 ) this.speed_scale *= -1; return this;}
	forwards(){  if( this.speed_scale < 0 ) this.speed_scale *= -1; return this;}

	get( offset=0 ){ return mod( this.value + offset, Maths.PI_2 ); }
    as_sin( offset=0 ){ return Math.sin( this.get( offset ) ); }
    as_sin01( offset=0 ){ return Math.sin( this.get( offset ) ) * 0.5 + 0.5; }
    as_sin_abs( offset=0 ){ return Math.abs( Math.sin( this.get( offset ) ) ); }
    as_cycle01( offset=0 ){ return this.get( offset ) * Maths.PI_2_INV; }
    as_cyclen11( offset=0 ){ return this.get( offset ) * Maths.PI_2_INV * 2.0 - 1.0; } // -1 : 1
    as_cycle010( offset=0 ){ 
        var n = this.get( offset ) * Maths.PI_2_INV * 2;
        return ( n > 1 )? 1 - (n - 1) : n;
    }

    as_sigmoid_half( k=0, offset=0 ){ // Over 0, Eases in, under eases out
        // https://dhemery.github.io/DHE-Modules/technical/sigmoid/
        // https://www.desmos.com/calculator/q6ukniiqwn
        let t = this.as_cycle01( offset );
        let v = ( t - k*t ) / ( k - 2*k*Math.abs(t) + 1 );
        return v;
    }

    as_sigmoid01( k=0, offset=0 ){ // Over 0, Eases in the middle, under eases in-out
        // this uses the -1 to 1 value of sigmoid which allows to create
        // easing at start and finish.
        // https://dhemery.github.io/DHE-Modules/technical/sigmoid/
        // https://www.desmos.com/calculator/q6ukniiqwn
        let t = this.as_cyclen11( offset );
        let v = ( t - k*t ) / ( k - 2*k*Math.abs(t) + 1 );
        return v * 0.5 + 0.5;
    }

    as_sigmoid010( k=0, offset=0 ){ // Over 0, Eases in the middle, under eases in-out
        let t = this.as_sigmoid01( k, offset ) * 2;
        return ( t > 1 )? 1 - (t - 1) : t;
    }

	update( dt ){
        this.value = ( this.value + ( dt * 1000 * this.speed_scale ) * this.cycle_inc ) % Maths.PI_2;
        if( this.on_update ) this.on_update( this );
		return this;
	}
}

export default Cycle;