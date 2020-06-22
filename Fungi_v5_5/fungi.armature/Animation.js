
class Animation{
	frame_cnt	= 0;
	time_max	= 0;
	time_ary	= new Array();
	tracks		= new Array();

	static from_gltf( o ){
		let t, i, a = new Animation();

		a.frame_cnt	= o.frame_cnt;
		a.time_max	= o.time;

		for( i of o.times ) a.time_ary.push( i.slice( 0 ) );
		
		for( i of o.tracks ){
			t		= BoneTrack.from_gltf( i );
			t.time	= a.time_ary[ i.time_idx ]; // TODO, Maybe not do this?
			a.tracks.push( t );
		}

		return a;
	}
}

class BoneTrack{
	prop			= "pos";
	skin_idx		= 0;
	interpolation	= "LINEAR"
	data			= null;
	time			= null;

	static from_gltf( o ){
		let t = new BoneTrack();
		t.prop			= o.type;
		t.skin_idx		= o.joint_idx;
		t.interpolation	= o.interp;
		t.data			= o.data.slice( 0 );
		return t;
	}
}

export default Animation;