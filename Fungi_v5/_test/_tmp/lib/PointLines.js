import * as THREE from "./three.module.js";

class PointLines{
	constructor( maxLen = 100, scale=1 ){
		/**
 		* How many vertices to draw.
 		* @private @type {number}
 		*/
		this.pntCnt = 0;
		this.lineCnt = 0;

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// SETUP BUFFERS

		// Vertext Position AND Point size will be saved in the W component of the Vec4. 
		// This will save on creating another buffer to hold that information. Custom Shader is
		// Needed to handle this setup.
		this.aPntPos = new THREE.BufferAttribute( new Float32Array( maxLen * 4 ), 4 );
		this.aPntPos.setDynamic( true );

		// Containts a custom color for each vertex
		this.aPntColor = new THREE.BufferAttribute( new Float32Array( maxLen * 3), 3 );
		this.aPntColor.setDynamic( true );


		this.aLinePos = new THREE.BufferAttribute( new Float32Array( maxLen * 4 * 2 ), 4 );
		this.aLinePos.setDynamic( true );

		// Containts a custom color for each vertex
		this.aLineColor = new THREE.BufferAttribute( new Float32Array( maxLen * 3 * 2 ), 3 );
		this.aLineColor.setDynamic( true );


		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// GEOMETRY
		this.geoPnt = new THREE.BufferGeometry();
		this.geoPnt.addAttribute( "position",	this.aPntPos );
		this.geoPnt.addAttribute( "color", 		this.aPntColor );
		this.geoPnt.setDrawRange( 0, 0 );

		this.geoLine = new THREE.BufferGeometry();
		this.geoLine.addAttribute( "position",	this.aLinePos );
		this.geoLine.addAttribute( "color", 	this.aLineColor );
		this.geoLine.setDrawRange( 0, 0 );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		this.meshPnt	= new THREE.Points( this.geoPnt, PointLines._getMaterial( scale ) );
		this.meshLine	= new THREE.LineSegments( this.geoLine, new THREE.LineBasicMaterial( { vertexColors: THREE.VertexColors } ) ); 
		
		this.obj3D = new THREE.Group();
		this.obj3D.add( this.meshPnt );
		this.obj3D.add( this.meshLine );
	}

	//////////////////////////////////////////////////////////////////////
	// METHODS
	//////////////////////////////////////////////////////////////////////

		/**
		* Add new points
		* @param {number} x - X Position
		* @param {number} y - Y Position
		* @param {number} z - Z Position
		* @param {number} [size=40] - Size of the point
		* @param {number} [hex=0xff0000] - Color of the point in hex number form (0xffffff)
		* @public @return {DynamicPoints}
		*/
		point( x, y, z, size=40, hex=0xff0000 ){
			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// VERTEX POSITION
			this.aPntPos.setXYZW( this.pntCnt, x, y, z, size );
			this.aPntPos.needsUpdate = true;

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// VERTEX COLOR
			let c = PointLines._glColor( hex );
			this.aPntColor.setXYZ( this.pntCnt, c[0], c[1], c[2] );
			this.aPntColor.needsUpdate = true;

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// INCREMENT AND UPDATE DRAW RANGE
			this.pntCnt++;
			this.geoPnt.setDrawRange( 0, this.pntCnt );

			return this;
		}
		pointVec( v, size=40, hex=0xff0000 ){ return this.point(v.x, v.y, v.z, size, hex ); }


		lineVec( v0, v1 , hex0 = 0xff0000, hex1 = null ){ return this.line( v0.x, v0.y, v0.z, v1.x, v1.y, v1.z, hex0, hex1 ); }
		line( x0, y0, z0, x1, y1, z1, hex0 = 0xff0000, hex1 = null ){
			if( hex1 == null ) hex1 = hex0;
			let idx = this.lineCnt * 2;

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// VERTEX POSITION
			this.aLinePos.setXYZW( idx, x0, y0, z0, 0 );
			this.aLinePos.setXYZW( idx+1, x1, y1, z1, 0 );
			this.aLinePos.needsUpdate = true;

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// VERTEX COLOR
			let c = [0,0,0];
			PointLines._glColor( hex0, c );
			this.aLineColor.setXYZ( idx, c[0], c[1], c[2] );
			
			PointLines._glColor( hex1, c );
			this.aLineColor.setXYZ( idx+1, c[0], c[1], c[2] );
			this.aLineColor.needsUpdate = true;

			//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// INCREMENT AND UPDATE DRAW RANGE
			this.lineCnt++;
			this.geoLine.setDrawRange( 0, this.lineCnt * 2 );

			return this;
		}

		reset(){
			this.pntCnt = 0;
			this.lineCnt = 0;

			this.geoPnt.setDrawRange( 0, 0 );
			this.geoLine.setDrawRange( 0, 0 );
			return this;
		}

	//////////////////////////////////////////////////////////////////////
	// PRIVATE STATIC FUNCS
	//////////////////////////////////////////////////////////////////////
		/**
		* Create a custom Shader Material that will render the dynamic points
		* @private @return {THREE.RawShaderMaterial}
		*/
		static _getMaterial( s ){
			const sVertex = `
				attribute	vec4	position;
				attribute	vec3	color;

				uniform 	mat4	modelViewMatrix;
				uniform 	mat4	projectionMatrix;
				uniform 	float	u_scale;

				varying 	vec3	v_color;

				void main(){
					vec4 ws_position 	= modelViewMatrix * vec4( position.xyz, 1.0 );
					v_color				= color;
					gl_PointSize		= position.w * ( u_scale / -ws_position.z );
					gl_Position			= projectionMatrix * ws_position;
				}`;

			const sFragment = `precision mediump float;
				const	vec2 	UV_CENTER = vec2( 0.5 );
				varying	vec3	v_color;
				void main(){
					vec2 coord = gl_PointCoord - UV_CENTER;
					//if( length(coord) > 0.5 ) discard;
					gl_FragColor = vec4( v_color, smoothstep( 0.5, 0.45, length(coord) ) );
					//gl_FragColor = vec4( v_color, 1 );
				}`;
			return new THREE.RawShaderMaterial( { 
				fragmentShader	: sFragment, 
				vertexShader	: sVertex, 
				transparent 	: true, 
				uniforms 		: { u_scale:{ value : s } } 
			} );
		}

		static _glColor( hex, out = null ){
			const NORMALIZE_RGB = 1 / 255;
			out = out || [0,0,0];

			out[0] = ( hex >> 16 & 255 ) * NORMALIZE_RGB;
			out[1] = ( hex >> 8 & 255 ) * NORMALIZE_RGB;
			out[2] = ( hex & 255 ) * NORMALIZE_RGB;

			return out;
		}
}


export default PointLines;