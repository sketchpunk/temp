import { Components } from "../App.js";

class Obj{
	constructor(){
		this.ref = null;
	}

	dispose(){ this.ref = null; }

	set_pos( p ){
		if( arguments.length == 3 ) this.ref.position.fromArray( arguments );
		else if( p.length == 3 )	this.ref.position.fromArray( p );
		return this;
	}

} Components.reg( Obj );

export default Obj;