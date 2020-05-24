function simple_rng(){
	// https://www.codeproject.com/script/Articles/ViewDownloads.aspx?aid=25172
	let m_w		= 521288629;
	let m_z		= 362436069;
	let uint	= new Uint32Array(1);
	return{
		next : function(){
			m_z			= 36969 * (m_z & 65535) + (m_z >> 16);
			m_w			= 18000 * (m_w & 65535) + (m_w >> 16);
			uint[ 0 ]	= (m_z << 16) + m_w;
			return (uint[ 0 ] + 1) * 2.328306435454494e-10;
		},
		seed : function( w=null, z=null ){
			m_w = w;
			m_z = z ?? 362436069;
			return this;
		}
	};
}