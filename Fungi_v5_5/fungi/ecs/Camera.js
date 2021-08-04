import { Mat4 } from "../maths/Maths.js";
import App from "../App.js";

//#########################################################################

class Camera{
	view		= new Mat4();	// View Matrix ( Camera Model Matrix Inverted )
	proj		= new Mat4();	// Projection Matrix
	proj_inv	= new Mat4();	// Projection Matrix Inverted ( For RayCasting )
	proj_view	= new Mat4();	// Projection * View Matrix ( Less Matrix Mul to do in Shader )

	fov			= 0;
	near		= 0;
	far			= 0;
	ratio		= 0;

	// #region SETTERS / GETTERS
	set_perspective( fov=45, near=0.1, far=100.0, w=null, h=null ){
		let ratio	= ( !w || !h )? App.gl.width / App.gl.height : w / h;
		fov			= fov * Math.PI / 180;
		
		this.proj.from_perspective( fov, ratio, near, far );
		this.proj_inv.from_invert( this.proj );

		this.fov	= fov;
		this.near	= near;
		this.far 	= far;
		this.ratio	= ratio;
		return this;
	}

	update_proj(){
		this.proj.from_perspective( this.fov, this.ratio, this.near, this.far );
		this.proj_inv.from_invert( this.proj );
	}
	// #endregion ///////////////////////////////////////////////////////////////////////
}

function CameraSys( ecs ){
	let i, ary = ecs.query_entities( [ "Camera", "Node" ] );
	for( i of ary ){
		if( !i.Node.updated ) continue;
		i.Camera.view.from_invert( i.Node.model_matrix );
		i.Camera.proj_view.from_mul( i.Camera.proj, i.Camera.view );
	}
}

/*
set_ortho( left, right, bottom, top, near, far ){
	this.proj.from_ortho( this.proj, left, right, bottom, top, near, far );
	//Mat4.invert( com.invertedProjectionMatrix, com.projectionMatrix ); //Save Inverted version for Ray Casting.
	return this;
}

update(){
	this.view.from_invert( App.get_e( this.entity_id ).Node.model_matrix );
	this.proj_view.from_mul( this.proj, this.view  )
}

Space Conversions
static screen_to_world( eCam, ix, iy, out=null ){
	// http://antongerdelan.net/opengl/raycasting.html
	// Normalize Device Coordinate
	var nx = ix / gl.width * 2 - 1,
		ny = 1 - iy / gl.height * 2;

	// inverseWorldMatrix = invert(ProjectionMatrix * ViewMatrix);  // OR
	// inverseWorldMatrix = localMatrix * invert(ProjectionMatrix); // can cache invert projection matrix.
	var matWorld = new Mat4();
	Mat4.mul( eCam.Node.modelMatrix, eCam.Camera.projMatrixInv, matWorld );

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// https://stackoverflow.com/questions/20140711/picking-in-3d-with-ray-tracing-using-ninevehgl-or-opengl-i-phone/20143963#20143963
	// Clip Cords would be [nx,ny,-1,1] - using 4d Homogeneous Clip Coordinates
	var vec4Near	= [ nx, ny, -1, 1.0 ];		
	Mat4.transform_vec4( matWorld, vec4Near );

	for(var i=0; i < 3; i++) vec4Near[i] /= vec4Near[3]; //Normalize by using W component

	out = out || new Vec3();
	return out.copy( vec4Near );
}

static world_to_screen( eCam, pos, out=null ){
	var mat	= new Float32Array(16), // Matrix4 Holder
		p	= [ 0, 0, 0, 0 ],		// Vec4
		rtn	= [];					// List of vec2 results

	//Move Points from WorldSpace to -> View Space (View Matrix) -> ClipSpace (ProjMatrix)
	Mat4.mul( eCam.Camera.projMatrix, eCam.Camera.viewMatrix, mat );

	Mat4.transform_vec3( mat, pos, p );

	//Move from Clip Space to NDC Space (Normalized Device Coordinate Space) (-1 to 1 opengl viewport)
	if(p[3] != 0){ //only if W is not zero,
		p[0] = p[0] / p[3];
		p[1] = p[1] / p[3];
	}
	
	// Then finally move the points to Screen Space
	// Map points from -1 to 1 range into  0 to 1 range, Then multiple by canvas size
	out		= out || [ 0, 0 ];
	out[0]	= ( p[0] + 1) * 0.5 * gl.width;
	out[1]	= (-p[1] + 1) * 0.5 * gl.height

	return out;
}

static world_to_screen_ary( eCam, vAry ){
	var mat	= new Float32Array(16), // Matrix4 Holder
		p	= [ 0, 0, 0, 0 ],		// Vec4
		rtn	= [];					// List of vec2 results

	//Move Points from WorldSpace to -> View Space (View Matrix) -> ClipSpace (ProjMatrix)
	Mat4.mul( eCam.Camera.projMatrix, eCam.Camera.viewMatrix, mat );

	let out = new Array( vAry.length );
	for( let i=0; i < vAry.length; i++ ){
		Mat4.transformVec3( mat, vAry[ i ], p );

		// Move from Clip Space to NDC Space (Normalized Device Coordinate Space) (-1 to 1 opengl viewport)
		if(p[3] != 0){ //only if W is not zero,
			p[0] = p[0] / p[3];
			p[1] = p[1] / p[3];
		}

		// Then finally move the points to Screen Space
		// Map points from -1 to 1 range into  0 to 1 range, Then multiple by canvas size
		out[ i ] = [
			( p[0] + 1) * 0.5 * gl.width,
			(-p[1] + 1) * 0.5 * gl.height
		];
	}

	return out;
}
*/

//#########################################################################
export default Camera;
export { CameraSys };