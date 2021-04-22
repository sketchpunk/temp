/*
    FetchProgress( url + "vegeta.bin", "arybuf", (a,b,c)=>console.log( "p", a,b,c) )
        .then( (v)=>console.log( "val", v) )
        .catch( (e)=>console.log(e) )
        .finally( (e)=>console.log("done") );
*/

function FetchProgress( url, type=null, prog_fn=null ){
    if( type == "arybuf" ) type = "arraybuffer";

    let resolve_fn, reject_fn, xhr = new XMLHttpRequest();
    
    let on_promise = ( resolve, reject )=>{
        xhr.open( "GET", url, true );
        xhr.responseType = type || "text";
        resolve_fn       = resolve;
        reject_fn        = reject;

		try{ xhr.send();
		}catch( err ){ console.error("xhr err",err); reject( err ); }
    };

    xhr.addEventListener("error",	(e)=>reject_fn(e), false);
    xhr.addEventListener("abort",	(e)=>reject_fn(e), false);
    xhr.addEventListener("timeout",	(e)=>reject_fn(e), false);
    xhr.addEventListener("load",	(e)=>resolve_fn( xhr.response ), false );

    if( prog_fn ) xhr.addEventListener( "progress", (e)=>prog_fn( e.loaded, e.total, url ), false );

    return new Promise( on_promise );
}

export default FetchProgress;