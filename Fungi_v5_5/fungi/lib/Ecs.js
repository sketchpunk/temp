import Bitset	from "./Bitset.js";

// #region COMPONENTS
class Components{
	items	= new Array();	// Collection of Components
	names	= new Map();	// Map Component Name to Component Type ID ( Items Index )
	
	// Register Component
	reg( com ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Validate that component does not exists
		if( this.names.has( com.name ) ){
			console.error( "Component Name Already Exists : %s", com.name);
			return this;
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Modify Component Prototype with some meta data
		let ct_id							= this.items.length;
		com.prototype._active				= true;
		com.prototype._entity_id			= null;
		com.prototype._component_id 		= null;
		com.prototype._component_type_id	= ct_id;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.names.set( com.name, ct_id );
		this.items.push( {
			object		: com,
			instances	: new Array(),
			recycle		: new Array(),
		});

		return this;
	}

	// Deactivate com to be recycled later
	retire( ct_id, c_id ){
		let reg = this.items[ ct_id ],
			com = reg.instances[ c_id ];

		com._entity_id	= null;
		com._active		= false;
		reg.recycle.push( c_id );
		return this;
	}

	// Recycle Component or Create a new One.
	new( name ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let idx = this.names.get( name );
		if( idx == undefined ){ console.error( "Component name unknown : %s", name ); return null; }

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let c, com = this.items[ idx ];

		if( com.recycle.length > 0 ){
			c			= com.instances[ com.recycle.pop() ];
			c._active	= true;
		}else{
			c = new com.object();
			c._component_id = com.instances.length;
			com.instances.push( c );
		}

		return c;
	}

	// Add a User Created Component Instances to Com Storage
	// If Com doesn't exist, it will auto register it.
	push( com ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// User Created Component Instance, Check if its registered
		let cname	= com.constructor.name,
			idx		= this.names.get( cname );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// If registered already, just add it as a new instance
		if( idx != null ){
			let storage = this.items[ idx ];
			com._component_id = storage.instances.length;
			storage.instances.push( com );

			return com;
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Not registered
		this.reg( com.constructor );
		idx = this.names.get( cname );

		if( idx != null ){
			let storage = this.items[ idx ];

			// This instance was created before the prototype was modified
			// So need to add the missing pieces from registering the component
			com._active				= true;
			com._entity_id			= null;
			com._component_id 		= storage.instances.length;
			com._component_type_id	= idx;

			storage.instances.push( com );
			return com;
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		console.error( "Problem doing realtime component registration", com );
		return null;
	}

	// Get a Component
	get( com_type_id, com_id ){
		return this.items[ com_type_id ].instances[ com_id ];
	}

	// Get the Type ID by name
	get_type_id( name ){ return this.names.get( name ); }

	// Get Registration Object by com name
	get_reg( name ){ return this.items[ this.names.get( name ) ]; }

	create_bit_mask( name_ary, bs = null ){
		let n, i;

		bs = bs || new Bitset();
		for( n of name_ary ){
			i = this.names.get( n );
			if( i == undefined ){ console.error( "Component.create_bit_mask name unknown : %s", n ); return null; }
			bs.on( i );
		}

		return bs;
	}
}
// #endregion ////////////////////////////////////////////////////////////////////////////

// #region ENTITY
class Entity{
	id				= null;
	name 			= null;
	active			= true;
	component_ids	= new Map(); // Key Component Type ID, Value Component ID
	component_mask	= new Bitset();
	tag_mask		= new Bitset();

	constructor( name, id ){
		this.id		= id;
		this.name	= name;
	}

	reset( name ){
		this.name	= name;
		this.active	= true;
		return this;
	}
}

class Entities{
	instances	= new Array();
	recycle		= new Array();

	new( name="NewEntity" ){
		if( this.recycle.length > 0 ){
			let id = this.recycle.pop();
			this.instances[ id ].reset( name );
			return id;
		}
		
		let e = new Entity( name, this.instances.length );
		this.instances.push( e );
		return e.id;
	}

	retire( id ){
		let e = this.instances[ id ];
		e.name		= "unknown";
		e.active	= false

		e.component_ids.clear();
		e.component_mask.reset();
		e.tag_mask.reset();

		this.recycle.push( id );
		return this;
	}
}
// #endregion ////////////////////////////////////////////////////////////////////////////

// #region SYSTEM
let SYSTEM_COUNT = 0; // Used to create an Order ID for Systems when added to an ECS Object

class System{
	cls			= null;				// System Class Instance if it s a Class
	fn			= null;				// System function or Pointer to Class RUN
	order		= ++SYSTEM_COUNT;
	name		= null;
	priority	= 0;
	active 		= true;

	constructor( sys, priority, active ){
		if( sys.constructor.name == "Function" ){
			this.fn		= sys;
			this.name	= sys.name;
		}else{
			this.cls	= sys;
			this.name	= sys.constructor.name;
			this.fn		= sys.run.bind( sys );
		}

		this.priority	= priority;
		this.active		= active;
	}
}

class Systems{
	items = new SortedArray( sys_idx );

	reg( sys, priority = 50, active = true ){
		this.items.add( new System( sys, priority, active ) );
		return this;
	}

	run( ecs ){
		let s;
		for( s of this.items ){
			if( s.active ) s.fn( ecs );
		}
		return this;
	}

	rm( sName ){
		let i;
		for( i=0; i < this.items.length; i++ ){
			if( this.items[ i ].name == sName ){
				let ss = this.items.splice( i, 1 );
				ss.cls	= null;
				ss.fn	= null;
				break;
			}
		}
		return this;
	}

	set_active( sName, state = true ){
		let i;
		for( i of this.items ) if( i.name == sName ){ i.active = state; break; }
		return this;	
	}

	debug(){
		let s;
		for( s of this.items ) console.log( "- SYSTEM %s - %s", s.name, s.priority );
		return this;
	}
}

// Sorts On Insert Array
class SortedArray extends Array{
	constructor( sFunc, size = 0 ){
		super( size );
		this._sort_index = sFunc
	}

	add( itm ){
		let saveIdx	= this._sort_index( this, itm );

		if( saveIdx == -1 ) this.push( itm );
		else{
			this.push( null );								// Add blank space to the array

			let x;
			for(x = this.length-1; x > saveIdx; x-- ){		// Shift the array contents one index up
				this[ x ] = this[ x-1 ];
			}

			this[ saveIdx ] = itm;							// Save new Item in its sorted location
		}

		return this;
	}
}

// Sorting Function
function sys_idx( ary, itm ){
	let s, i=-1, saveIdx = -1;
	for( s of ary ){
		i++;
		if(s.priority < itm.priority) continue;							// Order by Priority First
		if(s.priority == itm.priority && s.order < itm.order) continue;	// Then by Order of Insertion
		
		saveIdx = i;
		break;
	}
	return saveIdx;
}
// #endregion ////////////////////////////////////////////////////////////////////////////

class QueryCache{
	cache = new Map();

	get_query_comp( name, sort_fn=null ){
		let key = "query_comp_" + name;
		if( sort_fn ) key += "_" + sort_fn.name;
		return this.cache.get( key );
	}
	set_query_comp( data, name, sort_fn=null ){
		let key = "query_comp_" + name;
		if( sort_fn ) key += "_" + sort_fn.name;
		this.cache.set( key, data );
	}

	get_query_entities( com_list, sort_fn=null ){
		let key = "qent_" + com_list.join( "_" );
		if( sort_fn ) key += "_" + sort_fn.name;
		return this.cache.get( key );
	}

	set_query_entities( data, com_list, sort_fn=null ){
		let key = "qent_" + com_list.join( "_" );
		if( sort_fn ) key += "_" + sort_fn.name;
		return this.cache.set( key, data );
	}

	clear(){
		let k,v;
		for( [k,v] of this.cache ) v.length = 0;	// Cleanup Arrays
		this.cache.clear();							// Clears Map
	}
}

class Ecs{
	components	= new Components();
	entities	= new Entities();
	systems		= new Systems();
	queries		= new QueryCache();

	do_clear	= false;

	run(){
		if( this.do_clear ){
			this.queries.clear();
			this.do_clear = false;
		}

		this.systems.run( this );
		return this;
	}

	// #region ENTITIES
	new_entity( name, ...com ){ 
		let eid = this.entities.new( name );
		
		if( com.length > 0 ){
			let c;
			for( c of com ) this.add_com( eid, c );
		}

		this.do_clear = true;
		return eid;
	}

	get_entity( id ){ return this.entities.instances[ id ]; }

	rm_entity( id ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Check if Entity Exists
		let e = this.entities.instances[ id ]; 
		if( !e ){ console.error("Entity not found %s", id ); return this; }

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Recycle all the Components Assigned to Entity.
		let ct_id, c_id;
		for( [ct_id, c_id] of e.component_ids ) this.components.retire( ct_id, c_id );

		this.entities.retire( id );	// Recycle Entity
		this.do_clear = true;
		return this;
	}

	is_entity_active( id ){ return this.entities.instances[ id ].active; }
	set_entity_active( id, b ){ this.entities.instances[ id ].active = b; return this; }

	debug_entity( id ){
		let e = this.entities.instances[ id ];
		console.log( e );
		console.log( "------------------------------------" );
		console.log( "Entity ID: %s, Name: %s, Active: %s", e.id, e.name, e.active );
		console.log( "Iterate ComMask:");
		let cid;
		for( let ctid of e.component_mask ){
			cid = e.component_ids.get( ctid )
			console.log("-- Bit Idx: %s - Com ID: %s", ctid, cid );
			console.log("---- Component : ", this.components.get( ctid, cid ) );
		}
		return this;
	}
	// #endregion ////////////////////////////////////////////////////////////////////////////////////// 

	// #region COMPONENTS
	add_com( e_id, com ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let e = this.entities.instances[ e_id ];
		if( !e ){ console.error( "Can Not Found Entity ", e_id ); return null; }

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		if( typeof com == "string" ){
			com = this.components.new( com );
			if( !com ) return null;
		}else if( this.components.push( com ) == null ) return null;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		com._entity_id = e_id;
		e.component_mask.on( com._component_type_id );
		e.component_ids.set( com._component_type_id, com._component_id );

		this.do_clear = true;
		return com;
	}

	get_com( e_id, com ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let e = this.entities.instances[ e_id ];
		if( !e ){ console.error( "Can Not Found Entity ", e_id ); return null; }

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let ct_id = this.components.get_type_id( com );
		if( ct_id == null || ct_id == undefined ){ console.error("No Component Type found %s", com ); return null; }

		let c_id = e.component_ids.get( ct_id );
		if( c_id == null || c_id == undefined ){ console.error("Entity : %s, does not have component : %s", e_id, com ) }
		
		return this.components.get( ct_id, c_id );
	}

	rm_com( e_id, com ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let e = this.entities.instances[ e_id ];
		if( !e ){ console.error( "Can Not Found Entity ", e_id ); return null; }

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let ct_id = this.components.get_type_id( com );
		if( ct_id == null || ct_id == undefined ){ console.error("No Component Type found %s", com ); return null; }

		let c_id = e.component_ids.get( ct_id );
		if( c_id == null || c_id == undefined ){ console.error("Entity : %s, does not have component : %s", e_id, com ) }

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.components.retire( ct_id, c_id );	// Recycle Object
		e.component_mask.off( ct_id );			// Remove from mask
		e.component_ids.delete( ct_id );		// Remove ID

		this.do_clear = true;
		return this;
	}
	// #endregion ////////////////////////////////////////////////////////////////////////////////////// 

	// #region QUERY
	query_entities( com_list, sort_fn=null ){
		let cache = this.queries.get_query_entities( com_list, sort_fn );
		if( cache ) return cache;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let bit_mask = this.components.create_bit_mask( com_list );
		if( bit_mask == null ) return null;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let i, com_ids = [];
		for( let i=0; i < com_list.length; i++ ){
			com_ids.push( this.components.get_type_id( com_list[ i ] ) );
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let e, o, c_id, ct_id, rtn = new Array();
		for( e of this.entities.instances ){
			if( !e.active || !e.component_mask.test_mask( bit_mask ) ) continue;

			o = {};

			for( i in com_ids ){
				ct_id	= com_ids[i];
				c_id	= e.component_ids.get( ct_id );
				o[ com_list[i] ] = this.components.get( ct_id, c_id ); 
			}

			rtn.push( o );
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		if( rtn.length > 0 ) this.queries.set_query_entities( rtn, com_list, sort_fn );

		return rtn;

		/*
		let bit_mask 	= Components.create_bit_mask( com_list ),
			bit_hash 	= bit_mask.hash(),
			query_name	= "bitmask_" + bit_hash;

		// Check if query is cached.
		if( this.query_cache.has( query_name ) ) return this.query_cache.get( query_name );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let e, out = new Array();
		for( e of this.entities ){
			if( !e.info.components.is_mask( bit_mask ) ) continue;
			out.push( e );
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Save Results for later reuse
		if(out.length > 0){
			this.query_cache.set( query_name, out );
			if( sort_fn ) out.sort( sort_fn );
		}
		*/
		//return out;
	}

	query_comp( name, sort_fn=null ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		if( sort_fn ){
			let cache = this.queries.get_query_comp( name, sort_fn );
			if( cache ) return cache;
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let reg = this.components.get_reg( name );
		if( !reg ){ console.log( "ECS.query_comp - Component has no registration : %s", name );  return null; }
		if( reg.instances.length == 0 ) return null;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		if( sort_fn ){
			let rtn = [ ...reg.instances ];
			rtn.sort( sort_fn );
			this.queries.set_query_comp( rtn, name, sort_fn );
			return rtn;
		}else return reg.instances;
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Check Cache for Sorted Components
		//if( sort_fn ){
		//	let out = this.query_cache.get( "comp_" + name + "_" + sort_fn.name );
		//	if( out ) return out;
		//}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~	
		//let com_cache = Components.get_cache( name );
		//if( !com_cache ) return null;
		
		//if( sort_fn ){
		//	let out = [ ...com_cache ];
		//	out.sort( sort_fn );
		//	this.query_cache.set( "comp_" + name + "_" + sort_fn.name, out );
		//	return out;
		//}

		//return com_cache; // No Sort, Just pass cache array
	}
	// #endregion ////////////////////////////////////////////////////////////////////////////////////// 
}

export default Ecs;