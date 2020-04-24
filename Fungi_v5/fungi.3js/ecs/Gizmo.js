import App, {THREE, Vec3} from "../../fungi.3js/App.js";
import { TransformControls, TransformControlsGizmo, TransformControlsPlane } from "../TransformControls.js";

//https://threejs.org/docs/#examples/en/controls/TransformControls

class Gizmo{
	// #region Static
	static $( name="Gizmo" ){
		let e = App.$( name );
		e.add_com( "Gizmo" );
        return e;
    }
    
    static init(){
        App.events
		    .reg( "gizmo_drag_state", 0, true )
		    .reg( "gizmo_drag_move", 0, true )
    }
	// #endregion ////////////////////////////////////////////////////

	// #region FIELDS / CONSTRUCTOR
	#ctrl		= null;
	#grp 		= null;
	#dragging	= false;
	#pos 		= new Vec3();
	#drag_bind	= this.on_drag_change.bind( this );
	#move_bind	= this.on_drag_move.bind( this );
    
    constructor(){
		this.#grp	= new THREE.Group();
		
		this.#ctrl	= new TransformControls( App.camera, App.renderer.domElement );
		this.#ctrl.addEventListener( 'dragging-changed', this.#drag_bind );
		this.#ctrl.addEventListener( "objectChange", this.#move_bind );

		App.scene.add( this.#grp );
		App.scene.add( this.#ctrl );		
	}
	// #endregion ////////////////////////////////////////////////////

	// #region Getters / Methods
	get is_dragging(){ return this.#dragging; }
	get is_visible(){ return ( this.#ctrl.object ); }

	hide(){ if( this.#ctrl.object ) this.#ctrl.detach(); return this; }
	show( pos=null ){ 
		if( pos ) this.#grp.position.fromArray( pos );
		if( !this.#ctrl.object ) this.#ctrl.attach( this.#grp ); 
		return this;
	}
	// #endregion ////////////////////////////////////////////////////

	// #region Event Handlers
	on_drag_change( e ){ 
		this.#dragging = e.value;
		App.events.emit( "gizmo_drag_state", this.#dragging );
	}

	on_drag_move( e ){
		this.#pos.from_struct( this.#grp.position );
		App.events.emit( "gizmo_drag_move", this.#pos );
	}
	// #endregion ////////////////////////////////////////////////////
} App.Components.reg( Gizmo );

export default Gizmo;