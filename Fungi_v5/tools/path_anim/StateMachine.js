class StateMachine{
	// #region MAIN
	initial		= null;
	state		= null;
	map			= new Map();
	transitions	= new Map();
	// #endregion ///////////////////////////////////////////////////////////

	// #region ADDING STATES / TRANSITIONS
	add( state, is_initial=false ){
		if( this.map.has( state.name ) ){
			console.error( "State by the name: %s already exists", state.name );
			return this;
		}

		if( is_initial ) this.initial = state.name;

		state.on_init( this );
		this.map.set( state.name, state );
		return this;
	}

	add_transition( from, to, fn ){
		let t = this.transitions.get( from );
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// If no Transition exists for FROM, Create it.
		if( t == null ){
			t = new Map();
			this.transitions.set( from, t );
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		t.set( to, fn );
		return this;
	}
	// #endregion ///////////////////////////////////////////////////////////

	// #region OTHER METHODS
	// Check current state;
	is( s_name ){ return !( this.state == null || this.state.name != s_name ); }

	// Switch to a different state
	switch( s_name, data ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Check if the current state is the same as our switch to state
		if( this.state != null && this.state.name == s_name ){
			console.log( "Machine already in that state" );
			return this;
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		let s = this.map.get( s_name );
		if( s == null ){
			console.error( "State not found when switching : %s", s_name );
			return this;
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Handle Transition
		if( this.state != null ){
			let from = this.transitions.get( this.state.name );
			if( from != null ){
				let fn = from.get( s.name );
				if( fn != null ){
					console.log( "-- Transition from [ %s ] to [ %s ]", this.state.name, s.name );
					fn( this.state, s, data );
				}
			}
		}

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		if( this.state != null ) this.state.on_exit( data );
		s.on_enter( data );

		this.state = s;
		return this;
	}

	begin( data ){
		if( this.initial == null )	console.log( "No state was set as initial" );
		else						this.switch( this.initial, data );
		return this;
	}
	// #endregion ///////////////////////////////////////////////////////////
}

class IState{
	name		= "BASE";
	machine		= null;

	on_init( m ){ this.machine = m; }
	on_enter(){ console.log( "ON_ENTER %s", this.name ); }
	on_exit(){ console.log("ON EXIT %s", this.name ); }
}

export { StateMachine, IState };