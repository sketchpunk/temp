import Cycle  from "./Cycle.js";

class AnimatorStack{

    constructor( sec=2 ){
        this.cycle   = new Cycle( sec );
        this.stack   = new Array();
        this.enabled = true;
    }

    push( fn ){ this.stack.push( fn ); return this; }

    tick( dt ){ 
        if( this.enabled ) this.cycle.update( dt ); 
        return this;
    }

    run(){
        if( this.enabled ){
            let fn;
            for( fn of this.stack ) fn( this.cycle );
        }
        return this;
    }

}

export default AnimatorStack;