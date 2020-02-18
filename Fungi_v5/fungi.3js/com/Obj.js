import App, { Components } from "../App.js";

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

	get_transform(){
		let p = this.ref.position,
			q = this.ref.quaternion,
			s = this.ref.scale;
		return {
			pos: [ p.x, p.y, p.z ],
			rot: [ q.x, q.y, q.z, q.w ],
			scl: [ s.x, s.y, s.z ],
		};
	}

	set_ref( o ){
		this.ref = o; 
		App.scene.add( o );
		return this;
	}

} Components.reg( Obj );

export default Obj;