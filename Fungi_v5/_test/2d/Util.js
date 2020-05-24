function render_loop( fps, tick_lmt, callback ){
	let last		= performance.now(),
		tick 		= 0,
		frame_ms	= 1000 / fps; //Calc how many milliseconds per frame in one second of time.

	let func = ()=>{
		let current = performance.now(),
			delta_ms = current - last,
			dt 		= delta_ms * 0.001;
		
		if( delta_ms >= frame_ms ){
			last = current;
			tick++;
			callback();

			$.clear();
			draw_points();
			draw_faces();
		}

		if( tick < tick_lmt ) window.requestAnimationFrame( func );
	};
	
	window.requestAnimationFrame( func );
}


function rnd_lcg( seed=null ){
	function lcg( a ){ return ( a * 48271 ) % 2147483647; }
	seed = seed ? lcg( seed ) : lcg( Math.random() );
	return function(){ return ( seed = lcg(seed) ) / 2147483648; }
}
