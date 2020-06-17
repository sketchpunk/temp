class RenderLoop{
	active		= false;
	call_back	= null;

	start_time	= 0;
	last_frame	= 0;
	run_bind	= this.run.bind( this );

	fps			= 0;
	last_fps	= 0;
	frame_cnt	= 0;

	constructor( fn=null ){
		this.call_back = fn;
	}

	stop(){ this.active = false; }
	start(){
		this.active = true;
		this.start_time = 
			this.last_frame = 
			this.last_fps = 
			performance.now();

		window.requestAnimationFrame( this.run_bind );
	}

	run(){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let ms_current		= performance.now();
		let delta_time		= ( ms_current - this.last_frame ) * 0.001;
		let since_start		= ( ms_current - this.start_time ) * 0.001;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.frame_cnt++;
		if( (ms_current - this.last_fps) >= 1000 ){
			this.fps		= this.frame_cnt;
			this.frame_cnt	= 0;
			this.last_fps	= ms_current;
		}
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.last_frame = ms_current;
		this.call_back( delta_time, since_start );
		if( this.active ) window.requestAnimationFrame( this.run_bind );
	}
}

export default RenderLoop;