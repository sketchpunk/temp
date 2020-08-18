import Vec3 from "../Vec3.js";

class CBezier{

	static at( a, b, c, d, t, out=null ){
		let i		= 1 - t,
			ii		= i * i,
			iii		= ii * i,
			tt 		= t * t,
			ttt 	= tt * t,
			iit3 	= 3 * ii * t,
			itt3 	= 3 * i * tt;
		out = out || new Vec3();
		out[ 0 ] = iii * a[0] + iit3 * b[0] + itt3 * c[0] + ttt * d[0];
		out[ 1 ] = iii * a[1] + iit3 * b[1] + itt3 * c[1] + ttt * d[1];
		out[ 2 ] = iii * a[2] + iit3 * b[2] + itt3 * c[2] + ttt * d[2];
		return out;
	}

	static dxdy( a, b, c, d, t, out=null ){
		if(t > 1)		t = 1;
		else if(t < 0)	t = 0;

		let i	= 1 - t,
			ii3	= 3 * i * i,
			it6	= 6 * i * t,
			tt3	= 3 * t * t;

		out = out || new Vec3();
		out[ 0 ] = ii3 * ( b[0] - a[0] ) + it6 * ( c[0] - b[0] ) + tt3 * ( d[0] - c[0] );
		out[ 1 ] = ii3 * ( b[1] - a[1] ) + it6 * ( c[1] - b[1] ) + tt3 * ( d[1] - c[1] );
		out[ 2 ] = ii3 * ( b[2] - a[2] ) + it6 * ( c[2] - b[2] ) + tt3 * ( d[2] - c[2] );
		return out;
	}

	static dxdy2( a, b, c, d, t, out=null ){
		// https://stackoverflow.com/questions/35901079/calculating-the-inflection-point-of-a-cubic-bezier-curve
		if(t > 1)		t = 1;
		else if(t < 0)	t = 0;

		let t6 = 6 * t;
		out = out || new Vec3();
		out[ 0 ] = t6 * ( d[0] + 3 * ( b[0] - c[0] ) - a[0] ) + 6 * ( a[0] - 2 * b[0] + c[0] );
		out[ 1 ] = t6 * ( d[1] + 3 * ( b[1] - c[1] ) - a[1] ) + 6 * ( a[1] - 2 * b[1] + c[1] );
		out[ 2 ] = t6 * ( d[2] + 3 * ( b[2] - c[2] ) - a[2] ) + 6 * ( a[2] - 2 * b[2] + c[2] );
		return out;
	}
}


//Get the 3 axis directions for a specific spot
static axis(p0, p1, p2, p3, t, out = null){
	if(! out) out = { x:new Vec3(), y:new Vec3(), z:new Vec3() };
	Bezier.derivative(p0, p1, p2, p3, t, out.z).normalize();

	let	d2 = Bezier.derivative_2(p0, p1, p2, p3, t).normalize();
	
	Vec3.cross(d2, out.z, out.x).normalize();						

	let cp = out.x,	//Short cuts
		d1 = out.z;
	out.y[0] = (cp.x * cp.x)		* d1.x + (cp.x * cp.y - cp.z)	* d1.y + (cp.x * cp.z + cp.y)	* d1.z;
	out.y[1] = (cp.x * cp.y + cp.z)	* d1.x + (cp.y * cp.y)			* d1.y + (cp.y * cp.z - cp.x)	* d1.z;
	out.y[2] = (cp.x * cp.z - cp.y)	* d1.x + (cp.y * cp.z + cp.x)	* d1.y + (cp.z * cp.z)			* d1.z;
	out.y.normalize();

	return out;
}

static applySplineMidControl(ary, a, b, c, scale){
	//http://scaledinnovation.com/analytics/splines/aboutSplines.html
	let lenBA	= ary[a].length( ary[b] ),	// Length of M to A
		lenBC	= ary[c].length( ary[b] ),	// Length of M to B
		lenACi	= 1 / (lenBA + lenBC),		// Total Length of MA+MB inverted
		scaleA	= scale * lenBA * lenACi,	// Using the lengths, normalize it
		scaleB	= scale * lenBC * lenACi,
		deltaAC	= Vec3.sub( ary[c], ary[a] );	// Slope of A and B, used as the line for the mid control pnts

	ary[b].sub( Vec3.scale(deltaAC, scaleA), ary[b-1] );
	ary[b].add( Vec3.scale(deltaAC, scaleB), ary[b+1] );
}

export default CBezier;