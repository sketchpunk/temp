
class MotionStack{
    items = [];

	circle( speed, radius, fn ){
		let t = 0;
		this.items.push( ( dt )=>{
			t	 += speed * dt;
			let c = Math.cos( t );
			let s = Math.sin( t );

			fn( radius * c, radius * s );
        });
        return this;
    }

    sin_range( speed, min, max, fn ){
		let t = 0;
		this.items.push(( dt )=>{
            let s = Math.sin( (t += speed * dt) ) * 0.5 + 0.5;
            fn( min * (1.0-s) + max * s );
        });
        
        return this;
    }
    
    rot_by( def=15, axis="y", fn ){
        this.items.push(( dt )=>{ fn( def*dt, axis ); });
        return this
    }
    
    run( dt ){
        let fn;
        for( fn of this.items ) fn( dt );
    }

}

export default MotionStack;