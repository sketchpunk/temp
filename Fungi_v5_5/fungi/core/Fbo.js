
class Fbo{ 
    constructor( id, w, h ){ 
        this.id         = id;
        this.width      = w;
        this.height     = h;
        this.buffers    = {};
    }
}

class FboFactory{
    constructor( gl ){ this.gl = gl; }

    new( config ){
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Create Frame Buffer Object
        let ctx = this.gl.ctx;
        let fbo = new Fbo( ctx.createFramebuffer(), config.width, config.height );

        ctx.bindFramebuffer(ctx.FRAMEBUFFER, fbo.id );

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Create Textures / Render Buffers
        let i;
        for( i of config.buffers ){
            switch( i.type ){
                case "color": this.create_color( fbo, i ); break;
                case "depth": this.create_depth( fbo, i ); break;
            }
        }

        // Need to get a list of Attachment Points for the Buffers in the FBO
        let b, attach_ary = new Array();
        for( i in fbo.buffers ){
            if( i == "depth" ) continue;
            
            b = fbo.buffers[ i ];
            if( b.attach == undefined ) console.error( "FBO Color Buffer with no attach number", b );

            attach_ary.push( b.attach );
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        //Assign which buffers are going to be written too
		ctx.drawBuffers( attach_ary );

		//Check if the Frame has been setup Correctly.
		switch( ctx.checkFramebufferStatus( ctx.FRAMEBUFFER ) ){
			case ctx.FRAMEBUFFER_COMPLETE: break;
			case ctx.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:         console.log( "FRAMEBUFFER_INCOMPLETE_ATTACHMENT" ); break;
			case ctx.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: console.log( "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT" ); break;
			case ctx.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:         console.log( "FRAMEBUFFER_INCOMPLETE_DIMENSIONS" ); break;
			case ctx.FRAMEBUFFER_UNSUPPORTED:                   console.log( "FRAMEBUFFER_UNSUPPORTED" ); break;
			case ctx.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE:        console.log( "FRAMEBUFFER_INCOMPLETE_MULTISAMPLE" ); break;
			case ctx.RENDERBUFFER_SAMPLES:                      console.log( "RENDERBUFFER_SAMPLES" ); break;
		}
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Cleanup
		ctx.bindFramebuffer( ctx.FRAMEBUFFER, null );
		ctx.bindRenderbuffer( ctx.RENDERBUFFER, null );
        ctx.bindTexture( ctx.TEXTURE_2D, null );
        return fbo;
    }

    // #region MISC
	bind( o ){ this.gl.ctx.bindFramebuffer( this.gl.ctx.FRAMEBUFFER, o.id ); return this; }
    unbind(){ this.gl.ctx.bindFramebuffer( this.gl.ctx.FRAMEBUFFER, null ); return this; }
    clear(){
        let ctx = this.gl.ctx;
		//ctx.bindFramebuffer( ctx.FRAMEBUFFER, fbo.id );
		ctx.clear( ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT ); 
		return this;
    }

	blit( fboRead, fboWrite ){
        let ctx = this.gl.ctx;

		//bind the two Frame Buffers
		ctx.bindFramebuffer( ctx.READ_FRAMEBUFFER, fboRead.id );
		ctx.bindFramebuffer( ctx.DRAW_FRAMEBUFFER, fboWrite.id );

		//Clear Frame buffer being copied to.
		ctx.clearBufferfv( ctx.COLOR, 0, [0.0, 0.0, 0.0, 1.0] ); 

		//Transfer Pixels from one FrameBuffer to the Next
		ctx.blitFramebuffer(
			0, 0, fboRead.width,    fboRead.height,
			0, 0, fboWrite.width,   fboWrite.height,
			ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT, ctx.NEAREST );

		//Unbind
		ctx.bindFramebuffer( ctx.READ_FRAMEBUFFER, null );
        ctx.bindFramebuffer( ctx.DRAW_FRAMEBUFFER, null );
        
        return this;
	}
    // #endregion ////////////////////////////////////////////////////////////////////////////////////// 
    
    // #region COLOR
    create_color( fbo, ci ){
        let buf;

        switch( ci.mode ){
            case "multi":   buf = this.mk_color_multisample( fbo.width, fbo.height, ci.attach ); break;
            case "tex":     buf = this.mk_color_tex( fbo.width, fbo.height, ci.attach ); break;
        }

        if( buf ) fbo.buffers[ ci.name ] = buf;
    }

    mk_color_multisample( w, h, cAttachNum, sample_size=4 ){ //NOTE, Only sampleSize of 4 works, any other value crashes.
        let ctx = this.gl.ctx;
        let buf = { id: ctx.createRenderbuffer(), attach: ctx.COLOR_ATTACHMENT0 + cAttachNum, type:"multi" };

		ctx.bindRenderbuffer( ctx.RENDERBUFFER, buf.id );                                       // Bind Buffer
		ctx.renderbufferStorageMultisample(ctx.RENDERBUFFER, sample_size, ctx.RGBA8, w, h );    // Set Data Size
        ctx.framebufferRenderbuffer( ctx.FRAMEBUFFER, buf.attach, ctx.RENDERBUFFER, buf.id );   // Bind buf to color attachment
    
		return buf;
    }
    
    mk_color_tex( w, h, cAttachNum ){
		//Up to 16 texture attachments 0 to 15
        let ctx = this.gl.ctx;
		let buf = { id: ctx.createTexture(), attach: ctx.COLOR_ATTACHMENT0 + cAttachNum, type:"tex" };
		
		ctx.bindTexture( ctx.TEXTURE_2D, buf.id );
		ctx.texImage2D( ctx.TEXTURE_2D, 0, ctx.RGBA, w, h, 0, ctx.RGBA, ctx.UNSIGNED_BYTE, null );
		ctx.texParameteri( ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR ); //NEAREST
		ctx.texParameteri( ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR ); //NEAREST

		//ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
		//ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
		//ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);	//Stretch image to X position
		//ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);	//Stretch image to Y position

		ctx.framebufferTexture2D( ctx.FRAMEBUFFER, buf.attach, ctx.TEXTURE_2D, buf.id, 0 );

        return buf;
	}
    // #endregion //////////////////////////////////////////////////////////////////////////////////////

    // #region DEPTH
    create_depth( fbo, ci ){
        let buf;

        switch( ci.mode ){
            case "multi":   buf = this.mk_depth_multisample( fbo.width, fbo.height ); break;
            case "tex":     buf = this.mk_depth_tex( fbo.width, fbo.height ); break;
            case "render":  buf = this.mk_depth_render( fbo.width, fbo.height ); break;
        }

        if( buf ) fbo.buffers[ "depth" ] = buf;
    }

    // Create a basic render buffer
    mk_depth_render( w, h ){
        let ctx = this.gl.ctx;
		let buf = { id: ctx.createRenderbuffer(), type:"render" };

        ctx.bindRenderbuffer( ctx.RENDERBUFFER, buf.id );
        ctx.renderbufferStorage( ctx.RENDERBUFFER, ctx.DEPTH_COMPONENT16, w, h );
		ctx.framebufferRenderbuffer( ctx.FRAMEBUFFER, ctx.DEPTH_ATTACHMENT, ctx.RENDERBUFFER, buf.id ); 	//Attach buffer to frame
        
        return buf;
	}

    // Create a MutiSampled Render Buffer
    mk_depth_multisample( w, h ){
        let ctx = this.gl.ctx;
		let buf = { id: ctx.createRenderbuffer(), type:"multi" };

        ctx.bindRenderbuffer( ctx.RENDERBUFFER, buf.id );
        ctx.renderbufferStorageMultisample( ctx.RENDERBUFFER, 4, ctx.DEPTH_COMPONENT16, w, h ); //DEPTH_COMPONENT24
		ctx.framebufferRenderbuffer( ctx.FRAMEBUFFER, ctx.DEPTH_ATTACHMENT, ctx.RENDERBUFFER, buf.id ); 	//Attach buffer to frame
        
        return buf;
	}

    // Create a Depth Texture Buffer
	mk_depth_tex( w, h ){
        //Up to 16 texture attachments 0 to 15
        let ctx = this.gl.ctx;
		let buf = { id: ctx.createTexture(), type:"tex" };
		
		ctx.bindTexture( ctx.TEXTURE_2D, buf.id );
		//ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, false);
		ctx.texParameteri( ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST );
		ctx.texParameteri( ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST );
		ctx.texParameteri( ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE );
		ctx.texParameteri( ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE );
		ctx.texStorage2D( ctx.TEXTURE_2D, 1, ctx.DEPTH_COMPONENT16, w, h );

		ctx.framebufferTexture2D( ctx.FRAMEBUFFER, ctx.DEPTH_ATTACHMENT, ctx.TEXTURE_2D, buf.id, 0);
		return buf;
	}
    // #endregion //////////////////////////////////////////////////////////////////////////////////////
}

class FBOx{
	constructor(){
		this.fbo = null;
		this.aryDrawBuf = [];
	}

	//-------------------------------------------------
	// START AND COMPLETE CREATING FRAME BUFFER
	//-------------------------------------------------
	create(w=null, h=null){
		if(w == null) w = mod.width;
		if(h == null) h = mod.height;

		this.fbo = { frameWidth:w, frameHeight:h, ptr:ctx.createFramebuffer() };
		this.aryDrawBuf.length = 0;

		ctx.bindFramebuffer(ctx.FRAMEBUFFER, this.fbo.ptr);
		return this;
	}

	finalize(name){
		//Assign which buffers are going to be written too
		ctx.drawBuffers(this.aryDrawBuf);

		//Check if the Frame has been setup Correctly.
		switch(ctx.checkFramebufferStatus(ctx.FRAMEBUFFER)){
			case ctx.FRAMEBUFFER_COMPLETE: break;
			case ctx.FRAMEBUFFER_INCOMPLETE_ATTACHMENT: console.log("FRAMEBUFFER_INCOMPLETE_ATTACHMENT"); break;
			case ctx.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: console.log("FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT"); break;
			case ctx.FRAMEBUFFER_INCOMPLETE_DIMENSIONS: console.log("FRAMEBUFFER_INCOMPLETE_DIMENSIONS"); break;
			case ctx.FRAMEBUFFER_UNSUPPORTED: console.log("FRAMEBUFFER_UNSUPPORTED"); break;
			case ctx.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE: console.log("FRAMEBUFFER_INCOMPLETE_MULTISAMPLE"); break;
			case ctx.RENDERBUFFER_SAMPLES: console.log("RENDERBUFFER_SAMPLES"); break;
		}
		
		//Cleanup
		ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
		ctx.bindRenderbuffer(ctx.RENDERBUFFER, null);
		ctx.bindTexture(ctx.TEXTURE_2D, null);

		mod.res.fbo[name] = this.fbo;

		//Return final struct
		return this.fbo;
	}


	//-------------------------------------------------
	// COLOR BUFFERS
	//-------------------------------------------------
	texColorBuffer(name,cAttachNum){
		//Up to 16 texture attachments 0 to 15
		var buf = { texture:ctx.createTexture() };
		
		ctx.bindTexture(ctx.TEXTURE_2D, buf.texture);
		ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, this.fbo.frameWidth, this.fbo.frameHeight, 0, ctx.RGBA, ctx.UNSIGNED_BYTE, null);
		ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR); //NEAREST
		ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR); //NEAREST

		//ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
		//ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
		//ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);	//Stretch image to X position
		//ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);	//Stretch image to Y position

		ctx.framebufferTexture2D(ctx.FRAMEBUFFER, ctx.COLOR_ATTACHMENT0 + cAttachNum, ctx.TEXTURE_2D, buf.texture, 0);

		//Save Attachment to enable on finalize
		this.aryDrawBuf.push(ctx.COLOR_ATTACHMENT0 + cAttachNum);
		this.fbo[name] = buf;
		return this;
	}

	multiSampleColorBuffer(name, cAttachNum, sampleSize=4){ //NOTE, Only sampleSize of 4 works, any other value crashes.
		var buf = { ptr: ctx.createRenderbuffer() };

		ctx.bindRenderbuffer(ctx.RENDERBUFFER, buf.ptr); //Bind Buffer

		//Set Data Size
		ctx.renderbufferStorageMultisample(ctx.RENDERBUFFER, sampleSize, ctx.RGBA8, this.fbo.frameWidth, this.fbo.frameHeight); 
		
		//Bind buf to color attachment
		ctx.framebufferRenderbuffer(ctx.FRAMEBUFFER, ctx.COLOR_ATTACHMENT0 + cAttachNum, ctx.RENDERBUFFER, buf.ptr);

		//Save Attachment to enable on finalize
		this.aryDrawBuf.push(ctx.COLOR_ATTACHMENT0 + cAttachNum);
		this.fbo[name] = buf;
		return this;
	}


	//-------------------------------------------------
	// DEPTH BUFFERS
	//-------------------------------------------------
	depthBuffer(isMultiSample = false){
		this.fbo.bDepth = ctx.createRenderbuffer();
		ctx.bindRenderbuffer(ctx.RENDERBUFFER, this.fbo.bDepth);
		
		//Regular render Buffer
		if(!isMultiSample){
			ctx.renderbufferStorage(ctx.RENDERBUFFER, ctx.DEPTH_COMPONENT16,
				this.fbo.frameWidth, this.fbo.frameHeight);
		
		//Set render buffer to do multi samples
		}else{
			ctx.renderbufferStorageMultisample(ctx.RENDERBUFFER, 4,
				ctx.DEPTH_COMPONENT16, 
				this.fbo.frameWidth, this.fbo.frameHeight ); //DEPTH_COMPONENT24
		}

		//Attach buffer to frame
		ctx.framebufferRenderbuffer(ctx.FRAMEBUFFER, ctx.DEPTH_ATTACHMENT, ctx.RENDERBUFFER, this.fbo.bDepth);
		return this;
	}

	texDepthBuffer(){
		//Up to 16 texture attachments 0 to 15
		var buf = { texture:ctx.createTexture() };
		
		ctx.bindTexture(ctx.TEXTURE_2D, buf.texture);
		//ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, false);
		ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
		ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
		ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
		ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
		ctx.texStorage2D(ctx.TEXTURE_2D, 1, ctx.DEPTH_COMPONENT16, this.fbo.frameWidth, this.fbo.frameHeight);

		ctx.framebufferTexture2D(ctx.FRAMEBUFFER, ctx.DEPTH_ATTACHMENT, ctx.TEXTURE_2D, buf.texture, 0);

		this.fbo.bDepth = buf
		return this;
	}


	//-------------------------------------------------
	// STATIC FUNCTIONS
	//-------------------------------------------------
	static readPixel(fbo,x,y,cAttachNum){
		var p = new Uint8Array(4);
		ctx.bindFramebuffer(ctx.READ_FRAMEBUFFER, fbo.ptr);
		ctx.readBuffer(ctx.COLOR_ATTACHMENT0 + cAttachNum);
		ctx.readPixels(x, y, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, p);
		ctx.bindFramebuffer(ctx.READ_FRAMEBUFFER, null);
		return p;
	}

	static activate(fbo){ ctx.bindFramebuffer(ctx.FRAMEBUFFER,fbo.ptr); return this; }
	static deactivate(){ ctx.bindFramebuffer(ctx.FRAMEBUFFER,null); return this; }
	static clear(fbo, unbind = true){
		ctx.bindFramebuffer(ctx.FRAMEBUFFER,fbo.ptr);
		ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT); 
		if(unbind) ctx.bindFramebuffer(ctx.FRAMEBUFFER,null);
	}


	static blit(fboRead,fboWrite){
		//bind the two Frame Buffers
		ctx.bindFramebuffer(ctx.READ_FRAMEBUFFER, fboRead.ptr);
		ctx.bindFramebuffer(ctx.DRAW_FRAMEBUFFER, fboWrite.ptr);

		//Clear Frame buffer being copied to.
		ctx.clearBufferfv(ctx.COLOR, 0, [0.0, 0.0, 0.0, 1.0]); 

		//Transfer Pixels from one FrameBuffer to the Next
		ctx.blitFramebuffer(
			0, 0, fboRead.frameWidth, fboRead.frameHeight,
			0, 0, fboWrite.frameWidth, fboWrite.frameHeight,
			ctx.COLOR_BUFFER_BIT, ctx.NEAREST);

		//Unbind
		ctx.bindFramebuffer(ctx.READ_FRAMEBUFFER, null);
		ctx.bindFramebuffer(ctx.DRAW_FRAMEBUFFER, null);
	}



	/*
	static multiSampleDepthBuffer(out,sampleSize=4){
		out.bDepth = ctx.createRenderbuffer();
		ctx.bindRenderbuffer(ctx.RENDERBUFFER, out.bDepth);
		//ctx.renderbufferStorage(ctx.RENDERBUFFER, ctx.DEPTH_COMPONENT16, out.wSize, out.hSize);
		ctx.renderbufferStorageMultisample(ctx.RENDERBUFFER, sampleSize,  ctx.DEPTH_COMPONENT16, out.wSize, out.hSize); //DEPTH_COMPONENT24
		ctx.framebufferRenderbuffer(ctx.FRAMEBUFFER, ctx.DEPTH_ATTACHMENT, ctx.RENDERBUFFER, out.bDepth);
		return this;
	}
	static build(name,colorCnt,useDepth = true,wSize = null,hSize = null){
		if(wSize == null) wSize = mod.width;
		if(hSize == null) hSize = mod.height;
		var rtn = { wSize:wSize, hSize:hSize };
		//..................................
		//Create and Set Depth
		FBO.create(rtn);
		if(useDepth == true) FBO.depthBuffer(rtn,wSize,hSize);
		//..................................
		//Build color buffers
		var cBufAry = [];
		for(var i=0; i < colorCnt; i++){
			cBufAry.push( ctx.COLOR_ATTACHMENT0 + i );
			FBO.texColorBuffer(rtn,i,wSize,hSize);
		}
		if(cBufAry.length > 1) ctx.drawBuffers(cBufAry);
		
		//..................................
		//All Done.
		FBO.finalize(rtn,name);
		return rtn;
	}
	static create(wSize=null,hSize=null){
		if(wSize == null) wSize = mod.width;
		if(hSize == null) hSize = mod.height;
		var rtn = { wSize:wSize, hSize:hSize, ptr:ctx.createFramebuffer() };
		//out.colorBuf = [];
		
		ctx.bindFramebuffer(ctx.FRAMEBUFFER, rtn.ptr);
		return rtn;
	}
	static texColorBuffer(out,name,cAttachNum){
		//Up to 16 texture attachments 0 to 15
		var buf = { texture:ctx.createTexture() };
		
		ctx.bindTexture(ctx.TEXTURE_2D, buf.texture);
		ctx.texImage2D(ctx.TEXTURE_2D,0, ctx.RGBA, out.wSize, out.hSize, 0, ctx.RGBA, ctx.UNSIGNED_BYTE, null);
		ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR); //NEAREST
		ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR); //NEAREST
		//ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
		//ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
		//ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);	//Stretch image to X position
		//ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);	//Stretch image to Y position
		ctx.framebufferTexture2D(ctx.FRAMEBUFFER, ctx.COLOR_ATTACHMENT0 + cAttachNum, ctx.TEXTURE_2D, buf.texture, 0);
		out[name] = buf;
		return this;
	}
	//http://webglsamples.org/WebGL2Samples/#fbo_multisample
	//https://github.com/WebGLSamples/WebGL2Samples/blob/master/samples/fbo_multisample.html#L183-L245
	//https://github.com/tsherif/webgl2examples/blob/master/deferred.html
	//https://github.com/tiansijie/Tile_Based_WebGL_DeferredShader/blob/master/src/deferred.js
	//https://www.khronos.org/opengl/wiki/Framebuffer_Object_Extension_Examples#MSAA
	static multiSampleColorBuffer(out, name, cAttachNum, sampleSize=4){
		var buf = { ptr: ctx.createRenderbuffer() };
		ctx.bindRenderbuffer(ctx.RENDERBUFFER, buf.ptr); //Bind Buffer
		//Set Data Size
		ctx.renderbufferStorageMultisample(ctx.RENDERBUFFER, sampleSize, ctx.RGBA8, out.wSize, out.hSize); 
		
		//Bind buf to color attachment
		ctx.framebufferRenderbuffer(ctx.FRAMEBUFFER, ctx.COLOR_ATTACHMENT0 + cAttachNum, ctx.RENDERBUFFER, buf.ptr);
 		//ctx.drawBuffers([
        //    ctx.COLOR_ATTACHMENT0
            //gl.COLOR_ATTACHMENT1,
            //gl.COLOR_ATTACHMENT2
        //]);
		out[name] = buf;
		return this;
	}
	static multiSampleColorBufferx(out,name,cAttachNum){
		//Main FrameBuffer.
		//When All Done, 
		//Render to Texture Frame Buffer.
		
		var cAttach = gl.COLOR_ATTACHMENT0 + cAttachNum;
		var buf = { texture			:ctx.createTexture(),
					samples			:ctx.createRenderbuffer(),
					renderSamples	:ctx.createRenderbuffer(),
					renderTexture	:ctx.createRenderbuffer()
				};
		ctx.texImage2D(ctx.TEXTURE_2D,0, ctx.RGBA, out.wSize, out.hSize, 0, ctx.RGBA, ctx.UNSIGNED_BYTE, null);
		ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
		ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
		//Create a buffer to hold all the sample data.
		ctx.bindRenderbuffer(ctx.RENDERBUFFER, buf.samples);
        ctx.renderbufferStorageMultisample(ctx.RENDERBUFFER, 4, ctx.RGBA8, out.wSize, out.hSize);
        //Create Main Render Buffer pointing to the sample buffer data.
        ctx.bindFramebuffer(ctx.FRAMEBUFFER, buf.renderSamples);
        ctx.framebufferRenderbuffer(ctx.FRAMEBUFFER, cAttach, ctx.RENDERBUFFER, buf.samples);
 
        //Create another render buffer that points to the texture for storage.
		ctx.bindFramebuffer(ctx.FRAMEBUFFER, buf.renderTexture);
		ctx.framebufferTexture2D(ctx.FRAMEBUFFER, cAttach, ctx.TEXTURE_2D, buf.texture, 0);
		
		//var FRAMEBUFFER_SIZE = {
         //   x: canvas.width,
         //   y: canvas.height
        //};
        //var texture = gl.createTexture();
        //gl.bindTexture(gl.TEXTURE_2D, texture);
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, FRAMEBUFFER_SIZE.x, FRAMEBUFFER_SIZE.y, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        //gl.bindTexture(gl.TEXTURE_2D, null);
		// -- Init Frame Buffers
        var FRAMEBUFFER = {
            RENDERBUFFER: 0,
            COLORBUFFER: 1
        };
        var framebuffers = [
            gl.createFramebuffer(),
            gl.createFramebuffer()
        ];
 		var colorRenderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, colorRenderbuffer);
        gl.renderbufferStorageMultisample(gl.RENDERBUFFER, 4, gl.RGBA8, FRAMEBUFFER_SIZE.x, FRAMEBUFFER_SIZE.y);
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[FRAMEBUFFER.RENDERBUFFER]);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, colorRenderbuffer);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[FRAMEBUFFER.COLORBUFFER]);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        // Pass 1
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[FRAMEBUFFER.RENDERBUFFER]);
        gl.clearBufferfv(gl.COLOR, 0, [0.0, 0.0, 0.0, 1.0]);
        
	        gl.useProgram(programs[PROGRAM.TEXTURE]);
	        gl.bindVertexArray(vertexArrays[PROGRAM.TEXTURE]);
	        var IDENTITY = mat4.create();
	        gl.uniformMatrix4fv(mvpLocationTexture, false, IDENTITY);
	        gl.drawArrays(gl.LINE_LOOP, 0, vertexCount);
        
        // Blit framebuffers, no Multisample texture 2d in WebGL 2
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, framebuffers[FRAMEBUFFER.RENDERBUFFER]);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffers[FRAMEBUFFER.COLORBUFFER]);
        gl.clearBufferfv(gl.COLOR, 0, [0.0, 0.0, 0.0, 1.0]);
        gl.blitFramebuffer(
            0, 0, FRAMEBUFFER_SIZE.x, FRAMEBUFFER_SIZE.y,
            0, 0, FRAMEBUFFER_SIZE.x, FRAMEBUFFER_SIZE.y,
            gl.COLOR_BUFFER_BIT, gl.NEAREST
        );
	}
	static multiSampleDepthBuffer(out,sampleSize=4){
		out.bDepth = ctx.createRenderbuffer();
		ctx.bindRenderbuffer(ctx.RENDERBUFFER, out.bDepth);
		//ctx.renderbufferStorage(ctx.RENDERBUFFER, ctx.DEPTH_COMPONENT16, out.wSize, out.hSize);
		ctx.renderbufferStorageMultisample(ctx.RENDERBUFFER, sampleSize,  ctx.DEPTH_COMPONENT16, out.wSize, out.hSize); //DEPTH_COMPONENT24
		ctx.framebufferRenderbuffer(ctx.FRAMEBUFFER, ctx.DEPTH_ATTACHMENT, ctx.RENDERBUFFER, out.bDepth);
		return this;
	}
	static depthBuffer(out){
		out.bDepth = ctx.createRenderbuffer();
		ctx.bindRenderbuffer(ctx.RENDERBUFFER, out.bDepth);
		ctx.renderbufferStorage(ctx.RENDERBUFFER, ctx.DEPTH_COMPONENT16, out.wSize, out.hSize);
		ctx.framebufferRenderbuffer(ctx.FRAMEBUFFER, ctx.DEPTH_ATTACHMENT, ctx.RENDERBUFFER, out.bDepth);
		return this;
	}
	static finalize(out,name){
		ctx.drawBuffers([
            ctx.COLOR_ATTACHMENT0
            //gl.COLOR_ATTACHMENT1,
            //gl.COLOR_ATTACHMENT2
        ]);
		switch(ctx.checkFramebufferStatus(ctx.FRAMEBUFFER)){
			case ctx.FRAMEBUFFER_COMPLETE: break;
			case ctx.FRAMEBUFFER_INCOMPLETE_ATTACHMENT: console.log("FRAMEBUFFER_INCOMPLETE_ATTACHMENT"); break;
			case ctx.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: console.log("FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT"); break;
			case ctx.FRAMEBUFFER_INCOMPLETE_DIMENSIONS: console.log("FRAMEBUFFER_INCOMPLETE_DIMENSIONS"); break;
			case ctx.FRAMEBUFFER_UNSUPPORTED: console.log("FRAMEBUFFER_UNSUPPORTED"); break;
			case ctx.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE: console.log("FRAMEBUFFER_INCOMPLETE_MULTISAMPLE"); break;
			case ctx.RENDERBUFFER_SAMPLES: console.log("RENDERBUFFER_SAMPLES"); break;
		}
		
		ctx.bindTexture(ctx.TEXTURE_2D, null);
		ctx.bindRenderbuffer(ctx.RENDERBUFFER, null);
		ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
		mod.res.fbo[name] = out;
		return out;
	}
	static colorDepthFBO(name){
		var rtn = {};
		return FBO.create(rtn)
			.texColorBuffer(rtn,0)
			.depthBuffer(rtn)
			.finalize(rtn,name);
	}
	static delete(fbo){
		//TODO, Delete using the Cache name, then remove it from cache.
		ctx.deleteRenderbuffer(fbo.depth);
		ctx.deleteTexture(fbo.texColor);
		ctx.deleteFramebuffer(fbo.ptr);
	}
	*/
}


export default FboFactory;