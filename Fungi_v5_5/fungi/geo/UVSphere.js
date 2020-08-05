import App, { Vec3 } from "../App.js";

function Sphere( name, mat, y_len=18, x_len=25, radius = 0.5, close_loop=true, pole_fwd=false ){
	let mesh = Sphere.mesh(  name, y_len, x_len, radius, close_loop, pole_fwd );
	//let geo 	= Sphere.geo( y_len, x_len, radius, close_loop, pole_fwd );
	//let mesh	= App.mesh.from_data( name, geo.vert, 3, geo.idx, geo.norm, geo.uv );
	return App.mesh_entity( "Sphere", mesh, mat, App.mesh.TRI_STRIP ); //TRI_STRIP
}

Sphere.mesh = function( name, y_len=18, x_len=25, radius = 0.5, close_loop=true, pole_fwd=false ){
	let geo = Sphere.geo( y_len, x_len, radius, close_loop, pole_fwd );
	return  App.mesh.from_data( name, geo.vert, 3, geo.idx, geo.norm, geo.uv );
}

Sphere.geo = function( y_len=18, x_len=25, radius = 0.5, close_loop=true, pole_fwd=false ){
	let o = verts( y_len, x_len, radius, close_loop, pole_fwd );
	o.idx = tri_strip_idx( y_len, x_len, radius, close_loop );
	return o;
}

function verts( y_len=18, x_len=25, radius = 0.5, close_loop=true, pole_fwd=false ){
	const y_ini_rad = Math.PI / 2;

	let x_axis_i	= [ 1, 0, 0 ],			// initial X axis
		x_axis		= [ 1, 0, 0 ],			// Working X Axis, will spin around Y
        y_axis		= [ 0, 1, 0 ],			// Y Axis for TOP to Bottom Points of Half Circle
		x_rad		= Math.PI * 2,			// Starting Angle for drawing the Arcs
		y_inc		= Math.PI / y_len,		// How many steps to spin around X Axis	
		x_inc		= Math.PI * 2 / x_len,	// How much the XAxis rotates around Y.
		x_stop		= ( close_loop )? x_len : x_len - 1, // Create one less row
		x_uv		= 1 / x_stop,			// UV Increment
		y_uv		= 1 / y_len,

        pnt_cnt		= ( y_len + 1 ) * ( x_stop + 1 ),	// How many point to create a sphere
		vert		= new Float32Array( pnt_cnt * 3 ),	// Vert float buffer
		norm		= new Float32Array( pnt_cnt * 3 ),
		uv			= new Float32Array( pnt_cnt * 2 ),
		vi       	= 0,
		ni			= 0,
		ui 			= 0,
		x, y, len, sin, cos, y_rad, xx, yy, zz;

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Switch Y to Z Direction so the north pole is drawn forward instead of up.
	if( pole_fwd ){
		y_axis[ 1 ] = 0;
		y_axis[ 2 ] = 1; 
	}

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Loop Around the Y Axis, 360 degrees
	for( x=0; x <= x_stop; x++ ){
		y_rad = y_ini_rad;	// Reset Starting Y Angle

		// Rotate the X Axis Around the Y Axis
		rot_axis_angle( y_axis, x_rad, x_axis_i, x_axis );

		// Loop 180 degrees to raw out Half a Circle
		for( y=0; y <= y_len; y++ ){
			//-----------------------------------
			// Compute Angle
			cos		= Math.cos( y_rad );
			sin		= Math.sin( y_rad );
			y_rad	-= y_inc;

			//-----------------------------------
			// Compute 3D Point from angle and two Axis Directions
			xx = radius * cos * x_axis[0] + radius * sin * y_axis[0];
			yy = radius * cos * x_axis[1] + radius * sin * y_axis[1];
            zz = radius * cos * x_axis[2] + radius * sin * y_axis[2];
			
			//-----------------------------------
			// Save Vert Position
			vert[ vi++ ] = xx;
			vert[ vi++ ] = yy;
			vert[ vi++ ] = zz;

			//-----------------------------------
			// Save Normal
			len = 1 / Math.sqrt( xx*xx + yy*yy + zz*zz );
			norm[ ni++ ] = xx * len;
			norm[ ni++ ] = yy * len;
			norm[ ni++ ] = zz * len;

			//-----------------------------------
			// Save UV
			uv[ ui++ ] = x * x_uv;
			uv[ ui++ ] = y * y_uv;
			//if( y == 4 ) break;
		}
		x_rad -= x_inc;

		//if( x == 9 ) break;
	}

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	return { vert, norm, uv };
}

function rot_axis_angle( axis, rad, v, out ){
	// Rodrigues Rotation formula:
	// v_rot = v * cos(theta) + cross( axis, v ) * sin(theta) + axis * dot( axis, v) * (1-cos(theta))
	let cp	= Vec3.cross( axis, v ),
		dot	= Vec3.dot( axis, v ),
		s	= Math.sin( rad ),
		c	= Math.cos( rad ),
		ci	= 1 - c;

	out[ 0 ] = v[0] * c + cp[0] * s + axis[0] * dot * ci;
	out[ 1 ] = v[1] * c + cp[1] * s + axis[1] * dot * ci;
	out[ 2 ] = v[2] * c + cp[2] * s + axis[2] * dot * ci;
	return out;
}

function tri_strip_idx( y_len=18, x_len=25, close_loop=true ){
    //...........................................
    // Triangulate all the vertices for Triangle Strip
    let vert_cnt 	= (close_loop)? ( x_len ) * ( y_len + 1 ) : ( x_len-1 ) * ( y_len + 1 ),
        idx_cnt		= ((y_len+1) * 2) * x_len + (x_len-1) * 2,	// Y = col, X is Rows, TODO fix to take into account no closed_loop
        out 		= new Uint16Array( idx_cnt ), // out = [],
        ii			= 0,
        x, y; 

    for(var i=0; i < vert_cnt; i++){
        x = Math.floor( i / ( y_len + 1 ) );	// Current longitude
        y = i % ( y_len + 1 );					// Current latitude

        //Column index of row R and R+1
        //out.push( x * ( y_len + 1 ) + y,  ( x + 1 ) * ( y_len + 1 ) + y );
        out[ii++] = x * ( y_len + 1 ) + y;
        out[ii++] = ( x + 1 ) * ( y_len + 1 ) + y;

        //Create Degenerate Triangle, Last AND first index of the R+1 (next row that becomes the top row )
        if( y == y_len && i < vert_cnt-1 ){
            //out.push( (x+1) * (y_len+1) + y, (x+1) * (y_len+1) );
            out[ii++] = (x+1) * (y_len+1) + y;
            out[ii++] = (x+1) * (y_len+1);
        }
    }

    return out;
}

function vertsOLD( y_len=18, x_len=25, radius = 0.5, close_loop=true ){
    let y_rad	= Math.PI,				// Look Angles
        x_rad	= Math.PI * 2,
        y_inc	= Math.PI / y_len,		// Loop Increment
        x_inc	= Math.PI * 2 / x_len,
        x_stop  = (close_loop)? x_len : x_len - 1,
        pnt_cnt = ( y_len + 1 ) * ( x_stop + 1 ),
        out 	= new Float32Array( pnt_cnt * 3 ),
        i		= 0,
        x, y, x_cos, x_sin, y_sin;

    for( x=0; x <= x_stop; x++ ){
        y_rad = Math.PI;
        x_cos = Math.cos( x_rad ) * radius;
        x_sin = Math.sin( x_rad ) * radius;

        for(y=0; y <= y_len; y++){
            y_sin = Math.sin( y_rad );

            //Calculate the vertex position based on the polar coord
            out[i++] = y_sin * x_cos;
            out[i++] = radius * Math.cos( y_rad );					
            out[i++] = y_sin * x_sin; // Y & Z are flipped.

            y_rad -= y_inc;
        }
        x_rad -= x_inc;	//Move onto the next Longitude

        if( x== 2 ) break;
    }
    return out;
}

export default Sphere;