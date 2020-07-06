class Texture{
    constructor( name, id ){
        this.name   = name;
        this.id     = id;
    }
}

class TextureFactory{
    constructor( gl ){
		this.gl		= gl;
		this.cache	= new Map();
    }

	get( n ){ return this.cache.get( n ); }

    new( name, img, do_yflip=false, use_mips=false, wrap_mode=0, filter_mode=0 ){
        let tex = new Texture( name, this.gl.ctx.createTexture() );
        this.cache.set( name, tex );
        return this.update( tex, img, do_yflip, use_mips, wrap_mode, filter_mode );
    }

    update( tex, img, do_yflip=false, use_mips=false, wrap_mode=0, filter_mode=0 ){
        let ctx = this.gl.ctx;

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Flip the texture by the Y Position, So 0,0 is bottom left corner.
        if( do_yflip ) ctx.pixelStorei( ctx.UNPACK_FLIP_Y_WEBGL, true );

        // Bind texture, then Push image to GPU.
        ctx.bindTexture( ctx.TEXTURE_2D, tex.id ); 
        ctx.texImage2D( ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, img );
        
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        if(use_mips){
            ctx.texParameteri( ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR );				// Setup up scaling
            ctx.texParameteri( ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR_MIPMAP_NEAREST );	// Setup down scaling
            ctx.generateMipmap( ctx.TEXTURE_2D );	//Precalc different sizes of texture for better quality rendering.
        }else{
            let filter	= ( filter_mode == 0 )? ctx.LINEAR : ctx.NEAREST,
                wrap	= ( wrap_mode == 0 )?	ctx.REPEAT : ctx.CLAMP_TO_EDGE;

            ctx.texParameteri( ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER,	filter );
            ctx.texParameteri( ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER,	filter );
            ctx.texParameteri( ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S,		wrap ); 
            ctx.texParameteri( ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T,		wrap );
        }

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Cleanup
        ctx.bindTexture( ctx.TEXTURE_2D, null ); 							// Unbind
        if( do_yflip ) ctx.pixelStorei( ctx.UNPACK_FLIP_Y_WEBGL, false );	// Stop flipping textures
		
		return tex;	
    }
}


    /*

		// Creates a texture on the GPU. then calls another function to push the image the gpu
		static load_texture( name, img, doYFlip = false, useMips = false, wrapMode = 0, filterMode = 0 ){ 
			let tex	= gl.ctx.createTexture();
			Cache.set_tex( name, tex );
			tex._name_ = name;	// Get Debug if name is known
			return gl.update_texture( tex, img, doYFlip, useMips );
		}

		// Updates the GPU with an image as a texture.
		static update_texture( tex, img, doYFlip = false, useMips = false, wrapMode = 0, filterMode = 0 ){ //can be used to pass video frames to gpu texture.
			if(doYFlip) gl.ctx.pixelStorei(gl.ctx.UNPACK_FLIP_Y_WEBGL, true);	//Flip the texture by the Y Position, So 0,0 is bottom left corner.

			gl.ctx.bindTexture(gl.ctx.TEXTURE_2D, tex); //bind texture so we can start configuring it.
			gl.ctx.texImage2D(gl.ctx.TEXTURE_2D, 0, gl.ctx.RGBA, gl.ctx.RGBA, gl.ctx.UNSIGNED_BYTE, img);	//Push image to GPU.
			
			if(useMips){
				gl.ctx.texParameteri(gl.ctx.TEXTURE_2D, gl.ctx.TEXTURE_MAG_FILTER, gl.ctx.LINEAR);					//Setup up scaling
				gl.ctx.texParameteri(gl.ctx.TEXTURE_2D, gl.ctx.TEXTURE_MIN_FILTER, gl.ctx.LINEAR_MIPMAP_NEAREST);	//Setup down scaling
				gl.ctx.generateMipmap(gl.ctx.TEXTURE_2D);	//Precalc different sizes of texture for better quality rendering.
			}else{
				let filter	= (filterMode == 0)?	gl.ctx.LINEAR : gl.ctx.NEAREST,
					wrap	= (wrapMode == 0)?		gl.ctx.REPEAT : gl.ctx.CLAMP_TO_EDGE;

				gl.ctx.texParameteri(gl.ctx.TEXTURE_2D, gl.ctx.TEXTURE_MAG_FILTER,	filter);
				gl.ctx.texParameteri(gl.ctx.TEXTURE_2D, gl.ctx.TEXTURE_MIN_FILTER,	filter);
				gl.ctx.texParameteri(gl.ctx.TEXTURE_2D, gl.ctx.TEXTURE_WRAP_S,		wrap); 
				gl.ctx.texParameteri(gl.ctx.TEXTURE_2D, gl.ctx.TEXTURE_WRAP_T,		wrap);
			}

			gl.ctx.bindTexture(gl.ctx.TEXTURE_2D,null); //Unbind
			
			if(doYFlip) gl.ctx.pixelStorei(gl.ctx.UNPACK_FLIP_Y_WEBGL, false);	//Stop flipping textures
			return tex;	
		}

		static load_texture_array( img, imgW, imgH, imgCnt, doYFlip=false, useMips=false, wrapMode=0, filterMode=0 ){
			let tex = gl.ctx.createTexture();

			gl.ctx.bindTexture(gl.ctx.TEXTURE_2D_ARRAY, tex);

			if(doYFlip) gl.ctx.pixelStorei(gl.ctx.UNPACK_FLIP_Y_WEBGL, true);	//Flip the texture by the Y Position, So 0,0 is bottom left corner.

			if(useMips){
				gl.ctx.texParameteri(gl.ctx.TEXTURE_2D_ARRAY, gl.ctx.TEXTURE_MAG_FILTER, gl.ctx.LINEAR);					//Setup up scaling
				gl.ctx.texParameteri(gl.ctx.TEXTURE_2D_ARRAY, gl.ctx.TEXTURE_MIN_FILTER, gl.ctx.LINEAR_MIPMAP_NEAREST);	//Setup down scaling
				gl.ctx.generateMipmap(gl.ctx.TEXTURE_2D);	//Precalc different sizes of texture for better quality rendering.
			}else{
				var filter	= (filterMode == 0)?	gl.ctx.LINEAR : gl.ctx.NEAREST,
					wrap	= (wrapMode == 0)?		gl.ctx.REPEAT : gl.ctx.CLAMP_TO_EDGE;

				gl.ctx.texParameteri(gl.ctx.TEXTURE_2D_ARRAY, gl.ctx.TEXTURE_MAG_FILTER,	filter);
				gl.ctx.texParameteri(gl.ctx.TEXTURE_2D_ARRAY, gl.ctx.TEXTURE_MIN_FILTER,	filter);
				gl.ctx.texParameteri(gl.ctx.TEXTURE_2D_ARRAY, gl.ctx.TEXTURE_WRAP_S,		wrap); 
				gl.ctx.texParameteri(gl.ctx.TEXTURE_2D_ARRAY, gl.ctx.TEXTURE_WRAP_T,		wrap);
			}

			gl.ctx.texImage3D(gl.ctx.TEXTURE_2D_ARRAY, 0, gl.ctx.RGBA, imgW, imgH, imgCnt,
				0, gl.ctx.RGBA, gl.ctx.UNSIGNED_BYTE, img );

			gl.ctx.bindTexture(gl.ctx.TEXTURE_2D_ARRAY,null); //Unbind
			
			if(doYFlip) gl.ctx.pixelStorei(gl.ctx.UNPACK_FLIP_Y_WEBGL, false);	//Stop flipping textures
			return tex;	
		}

		// imgAry must be 6 elements long and images placed in the right order
		// RIGHT +X, LEFT -X,TOP +Y, BOTTOM -Z, BACK +Z, FRONT -Z
		// pos_x.jpg, neg_x.jpg, pos_y.jpg, neg_y.jpg, pos_z.jpg, neg_z.jpg
		static load_cube_texture( name, img_ary, use_mips=false ){
			if( img_ary.length != 6 ) return null;

			// Cube Constants values increment, so easy to start with right and just add 1 in a loop
			// To make the code easier costs by making the imgAry coming into the function to have
			// the images sorted in the same way the constants are set.
			//	TEXTURE_CUBE_MAP_POSITIVE_X - Right	:: TEXTURE_CUBE_MAP_NEGATIVE_X - Left
			//	TEXTURE_CUBE_MAP_POSITIVE_Y - Top 	:: TEXTURE_CUBE_MAP_NEGATIVE_Y - Bottom
			//	TEXTURE_CUBE_MAP_POSITIVE_Z - Back	:: TEXTURE_CUBE_MAP_NEGATIVE_Z - Front

			let tex	= gl.ctx.createTexture();
			gl.ctx.bindTexture( gl.ctx.TEXTURE_CUBE_MAP, tex );

			// push image to specific spot in the cube map.
			for( let i=0; i < 6; i++){
				gl.ctx.texImage2D( gl.ctx.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.ctx.RGBA, gl.ctx.RGBA, gl.ctx.UNSIGNED_BYTE, img_ary[ i ] );
			}

			gl.ctx.texParameteri( gl.ctx.TEXTURE_CUBE_MAP, gl.ctx.TEXTURE_MAG_FILTER, gl.ctx.LINEAR );		// Setup up scaling
			gl.ctx.texParameteri( gl.ctx.TEXTURE_CUBE_MAP, gl.ctx.TEXTURE_MIN_FILTER, gl.ctx.LINEAR );		// Setup down scaling
			gl.ctx.texParameteri( gl.ctx.TEXTURE_CUBE_MAP, gl.ctx.TEXTURE_WRAP_S, gl.ctx.CLAMP_TO_EDGE );	// Stretch image to X position
			gl.ctx.texParameteri( gl.ctx.TEXTURE_CUBE_MAP, gl.ctx.TEXTURE_WRAP_T, gl.ctx.CLAMP_TO_EDGE );	// Stretch image to Y position
			gl.ctx.texParameteri( gl.ctx.TEXTURE_CUBE_MAP, gl.ctx.TEXTURE_WRAP_R, gl.ctx.CLAMP_TO_EDGE );	// Stretch image to Z position
			if( use_mips ) gl.ctx.generateMipmap( gl.ctx.TEXTURE_CUBE_MAP );

			gl.ctx.bindTexture( gl.ctx.TEXTURE_CUBE_MAP, null );
			Cache.set_tex( name, tex );
			return tex;
        }
        
    */
export default TextureFactory;
export { Texture };