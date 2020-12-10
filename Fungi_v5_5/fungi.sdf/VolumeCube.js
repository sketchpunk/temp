import App, { Vec3 } from "../fungi/App.js";

let MESH;

function VolumeCube( name = "VolumeCube", mat ){
	if( !MESH ){
		let geo = VolumeCube.geo();
		MESH    = App.mesh.from_data( "VolCube", geo.vert, 3, geo.idx );
	
		set_bound( geo );	
	}

    return App.mesh_entity( name, MESH, mat, App.mesh.TRI );
}

VolumeCube.from_origin = function( name = "VolumeCube", mat ){
	if( !MESH ){
		let geo = VolumeCube.geo( 1, 1, 1, true );
		MESH    = App.mesh.from_data( "VolCube", geo.vert, 3, geo.idx );
		set_bound( geo );	
	}
	return App.mesh_entity( name, MESH, mat, App.mesh.TRI );
}


VolumeCube.debug = function( tran ){
    let min = Vec3.mul( VolumeCube.bound_min, tran.scl ).add( tran.pos );
    let max = Vec3.mul( VolumeCube.bound_max, tran.scl ).add( tran.pos );
    App.Debug.box( min, max, "yellow", true );
}

VolumeCube.geo = function( ww=1, hh=1, dd=1, center_origin=false ){
	let x = 0, y = 0.501, z = 0;
	if( center_origin ) y = 0;

	let w = ww*0.5, h = hh*0.5, d = dd*0.5;
	let x0 = x-w, 
		x1 = x+w, 
		y0 = y-h, 
		y1 = y+h, 
		z0 = z-d, 
		z1 = z+d;

	let vert = [
		x0, y1, z0, // Top
		x0, y1, z1,
		x1, y1, z1, 
		x1, y1, z0,

		x0, y0, z0,	// Bot
		x0, y0, z1,
		x1, y0, z1,
		x1, y0, z0,
	];

	let idx = [				// CCW
		0, 1, 2, 2, 3, 0,	// Top
		6, 5, 4, 4, 7, 6,	// Bot
		1, 5, 6, 6, 2, 1,	// Fnt
		2, 6, 7, 7, 3, 2,	// Lft
		3, 7, 4, 4, 0, 3,	// Bak
		0, 4, 5, 5, 1, 0,	// Rit
	];

	// Reverse Triangle Winding
	/*
	let t;
	for( let i=0; i < idx.length; i+=3 ){
		t			= idx[ i ];
		idx[ i ]	= idx[ i+2 ];
		idx[ i+2 ]	= t;
	}
	*/

	return { vert: new Float32Array( vert ), idx: new Uint16Array( idx ) };
}

function set_bound( geo ){
	//let  v = new Vec3();
	let bmin = [ Infinity, Infinity, Infinity ];
	let bmax = [ -Infinity, -Infinity, -Infinity ];
    let x, y, z;

	for( let i=0; i < geo.vert.length; i+=3 ){
        //v.from_buf( geo.vert, i );
        x = geo.vert[ i ];
        y = geo.vert[ i+1 ];
        z = geo.vert[ i+2 ];

		bmin[ 0 ] = Math.min( bmin[ 0 ], x );
		bmin[ 1 ] = Math.min( bmin[ 1 ], y );
		bmin[ 2 ] = Math.min( bmin[ 2 ], z );

		bmax[ 0 ] = Math.max( bmax[ 0 ], x );
		bmax[ 1 ] = Math.max( bmax[ 1 ], y );
		bmax[ 2 ] = Math.max( bmax[ 2 ], z );

		//App.Debug.pnt( v, "yellow" );
	}

    VolumeCube.bound_min = bmin;
    VolumeCube.bound_max = bmax;

	//App.Debug.box( bmin, bmax, "yellow", true );
}

export default VolumeCube;