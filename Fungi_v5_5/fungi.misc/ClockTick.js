/*
let tick = new ClockTick( "01/01/2000 00:00:00 GMT" )
	.set_interval( 2 )
	.set_tick_min( 5 )
	.set_fn( ( dt, tick )=>{ console.log( tick.to_string() ); } )
	.start();
*/

class ClockTick{
	// #region MAIN
	initial			= 0;				// Starting MS, for resetting.
	now				= 0;				// Current MS 
	timer			= null;				// SetInterval ID
	tick_sec		= 1 * 60 * 1000;	// How much time passes per tick
	interval_sec	= 2 * 1000;			// How many real seconds to execute a tick
	tick_fn			= null;				// Callback to call on tick

	constructor( dt_str="01/01/2000 00:00:00 GMT" ){
		if( dt_str ) this.set_now( dt_str );
	}
	// #endregion ////////////////////////////////////////////////////

	// #region SETTERS / GETTERS
	set_now( dt_str ){ this.initial = this.now = Date.parse( dt_str ); return this; }
	set_tick_min( v ){ this.tick_sec = v * 60 * 1000; return this; }
	set_interval( v ){ this.interval_sec = v * 1000; return this; }
	set_fn( fn ){ this.tick_fn = fn; return this; }
	// #endregion ////////////////////////////////////////////////////

	// #region METHODS
	start(){
		if( this.timer != null ) clearInterval( this.timer );
		this.timer = setInterval( ()=>{ 
			this.update();
			if( this.tick_fn ) this.tick_fn( this.now, this );
		}, this.interval_sec );

		if( this.tick_fn ) this.tick_fn( this.now, this );
		return this;
	}

	stop(){
		if( this.timer ) clearInterval( this.timer );
		this.timer = null;
		return this;
	}

	reset(){ this.now = this.initial; return this; }

	update(){ this.now += this.tick_sec; return this; }
	// #endregion ////////////////////////////////////////////////////

	// #region MISC
	to_string(){
		let dt	= new Date( this.now ),
			txt	= dt.toUTCString();
		return txt.slice( txt.indexOf(" ")+1, txt.length - 4 );
	}
	// #endregion ////////////////////////////////////////////////////
}

export default ClockTick;