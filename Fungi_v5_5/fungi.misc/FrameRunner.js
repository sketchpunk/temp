
class FrameCount{
    constructor( lmt, fn ){
        this.current = 0;
        this.limit   = lmt;
        this.fn      = fn;
    }

    update( fr ){
        this.current++;
        if( this.current >= this.limit ){
            this.current = 0;
            this.fn();
        }
    }
}

class FrameTime{
    constructor( lmt, fn ){
        this.current = 0;
        this.limit   = lmt;
        this.fn      = fn;
    }

    update( fr ){
        this.current += fr.deltaTime;
        if( this.current >= this.limit ){
            this.current = 0;
            this.fn();
        }
    }
}

class FrameRunner{
    constructor(){
        this.deltaTime  = 0;
        this.items      = new Map();
    }

    onFrame( name, cnt, fn ){ this.items.set( name, new FrameCount( cnt, fn ) ); return this; }
    onTime( name, sec, fn ){ this.items.set( name, new FrameTime( sec, fn ) ); return this; }

    update( dt ){
        this.deltaTime = dt;
        let k, v;
        for ( [k,v] of this.items ) v.update( this );
    }
}

export default FrameRunner;