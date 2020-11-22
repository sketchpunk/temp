import App, { Colour } from "../App.js";
import Draw from "../ecs/Draw.js";

let MESH		= null;

function Cube( name = "Cube", mat ){
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	if( !MESH ){
		let g = Cube.geo();
		MESH = App.mesh.from_data( "FaceCubeMesh", g.vert, 3, g.idx, g.norm, g.uv );
	}

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	//let draw = new Draw().add( MESH, mat, App.mesh.TRI );
    //return App.ecs.new_entity( name, "Node", draw );
    return App.mesh_entity( name, MESH, mat, App.mesh.TRI );
}

Cube.geo = function( ww=1, hh=1, dd=1 ){
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	let width = ww, height = hh, depth = dd, x = 0, y = 0, z = 0;
	let w = width*0.5, h = height*0.5, d = depth*0.5;
	let x0 = x-w, x1 = x+w, y0 = y-h, y1 = y+h, z0 = z-d, z1 = z+d;

	//Starting bottom left corner, then working counter clockwise to create the front face.
	//Backface is the first face but in reverse (3,2,1,0)
	//keep each quad face built the same way to make index and uv easier to assign
	let vert = [
		x0, y1, z1, 	//0 Front
		x0, y0, z1, 	//1
		x1, y0, z1, 	//2
		x1, y1, z1, 	//3 

		x1, y1, z0, 	//4 Back
		x1, y0, z0, 	//5
		x0, y0, z0, 	//6
		x0, y1, z0, 	//7 

		x1, y1, z1, 	//3 Right
		x1, y0, z1, 	//2 
		x1, y0, z0, 	//5
		x1, y1, z0, 	//4

		x0, y0, z1, 	//1 Bottom
		x0, y0, z0, 	//6
		x1, y0, z0, 	//5
		x1, y0, z1, 	//2

		x0, y1, z0, 	//7 Left
		x0, y0, z0, 	//6
		x0, y0, z1, 	//1
		x0, y1, z1, 	//0

		x0, y1, z0, 	//7 Top
		x0, y1, z1, 	//0
		x1, y1, z1, 	//3
		x1, y1, z0, 	//4
	];

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	//Build the index of each quad [0,1,2, 2,3,0]
	let i, idx = [];
	for( i=0; i < vert.length / 3; i+=2) idx.push(i, i+1, (Math.floor(i/4)*4)+((i+2)%4));

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	//Build UV data for each vertex
	let uv = [];
	for( i=0; i < 6; i++) uv.push( 0,0,	0,1, 1,1,  1,0 );

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	//Build Normal data for each vertex
	let norm = [
		 0, 0, 1,	 0, 0, 1,	 0, 0, 1,	 0, 0, 1,		//Front
		 0, 0,-1,	 0, 0,-1,	 0, 0,-1,	 0, 0,-1,		//Back
		-1, 0, 0,	-1, 0, 0,	-1, 0, 0,	-1, 0, 0,		//Left
		 0,-1, 0,	 0,-1, 0,	 0,-1, 0,	 0,-1, 0,		//Bottom
		 1, 0, 0,	 1, 0, 0,	 1, 0, 0,	 1, 0, 0,		//Right
		 0, 1, 0,	 0, 1, 0,	 0, 1, 0,	 0, 1, 0		//Top
	];

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

	return { vert:new Float32Array(vert), idx:new Uint16Array(idx), uv:new Float32Array(uv), norm:new Float32Array(norm) };
}



export default Cube;