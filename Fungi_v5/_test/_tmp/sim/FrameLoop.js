class FrameLoop{
	constructor( cb ){
		this.is_active		= false;

		this._callback 		= cb;
		this._start_time	= 0;
		this._last_frame	= 0;
		this._tick_bind 	= this.tick.bind( this );
	}

	stop(){ this.is_active = false; return this; };
	start(){
		this.is_active = true;
		this._start_time = this._last_frame = performance.now();
		window.requestAnimationFrame( this._tick_bind );
		return this;
	}

	tick(){
		let curr_time 	= performance.now(),
			delta_time 	= (curr_time - this._last_frame) * 0.001,	// Time is Millisconds, convert to seconds.
			since_start = (curr_time - this._start_time) * 0.001;

		this._last_frame = curr_time;
		this._callback( delta_time, since_start );
		if(this.is_active)	window.requestAnimationFrame( this._tick_bind );
	}
}