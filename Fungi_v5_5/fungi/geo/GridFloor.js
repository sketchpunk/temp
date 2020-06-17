import App	from "../App.js";

function GridFloor( mat, name="GridFloor" ){
	let mesh	= App.mesh.from_data( "GridFloorMesh", new Float32Array( GridFloor.vert() ) );
	let eid		= App.ecs.new_entity( name, "Node" );
	let draw	= App.ecs.add_com( eid, "Draw" );

	draw.add( mesh, mat, App.mesh.LINE );
	draw.priority = 100;

	return eid;
}

GridFloor.vert = function(){
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	let grid_size	= 0.2,				// Distance between lines
		len			= 70,				// How many lines to generate
		t			= len * grid_size,	// Total Size of grid
		p			= 0,				// Position
		v			= [ ];				// Vertex Array

	for(let i=1; i <= len; i++){		// build grid
		p = i * grid_size;
		v.push(	p,0,t, p,0,-t,
				-p,0,t, -p,0,-t,
				-t,0,p, t,0,p,
				-t,0,-p, t,0,-p,
		);
	}

	v.push(-t,0.007,0, t,0.007,0, 0,0.007,t, 0,0.007,-t ); //origin x,z lines
	return v;
}

export default GridFloor;