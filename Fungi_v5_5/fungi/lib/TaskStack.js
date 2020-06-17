//new Promise( (r, e)=>window.addEventListener("load", _=>r(true)) )

class TaskStack{
	queue = new Array();

	add( fn ){ this.queue.push( fn ); return this; }

	then( fn ){
		let p = new Promise( (r,e)=>this._run(r,e) );
		if( fn ) p.then( fn );
		p.catch( err=>console.error( "TaskStack Error :", err ) );
		return p;	 
	}

	async _run( r, e ){
		let t, ok;

		for( t of this.queue ){
			if( t instanceof Promise )							ok = await t;
			else if( t.constructor.name == "AsyncFunction" )	ok = await t( this );
			else												ok = t( this );	
			if( !ok ){ e( "Task returned a false or undefined." ); return; }
		}
		r("done");
	}
}

export default TaskStack;