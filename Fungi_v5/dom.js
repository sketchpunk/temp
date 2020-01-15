let Dom = {
	// #region Events
	on 		: function( e, name, func ){ e.addEventListener( name, func ); return this; },
	off		: function( e, name, func ){ e.removeEventListener( name, func ); return this; },
	stop	: function( e ){ e.preventDefault(); e.stopPropagation(); return this; },
	// #endregion //////////////////////////////////////////////////////////////

	// #region Elements
	$		: function( ename, cls, parent ){
		let elm = document.createElement( ename );
		if( cls ) elm.className = cls;
		if( parent ) parent.appendChild( elm );
		return elm;
	},

	div		: function( cls, parent ){ return this.$( "div", cls, parent ); },
	th		: function( parent, cls ){ return this.$( "th", cls, parent ); },
	a		: function( txt, href, cls, parent ){
		let elm = this.$( "a", cls, parent );
		if( txt ) elm.innerHTML	= txt;
		elm.href = href || "javascript:void(0)";
		return elm;
	},
	span	: function( txt, parent, cls ){
		let elm = this.$( "span", cls, parent );
		if( txt != null && txt != undefined ) elm.innerHTML	= txt;
		return elm; 
	},
	// #endregion //////////////////////////////////////////////////////////////

	// #region Methods
	hide 	: function( e ){ e.style.display = "none"; return e; }
	// #endregion //////////////////////////////////////////////////////////////
};