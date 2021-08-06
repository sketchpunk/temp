import App			from "../App.js";
import Vec3 from "../maths/Vec3.js";

class Cylinder{
    static meshEntity( name, mat, len = 1.5, radius = 0.5, steps = 12, axis = "y" ){
        let mesh = this.mesh( name, len, radius, steps, axis );
        return App.mesh_entity( name, mesh, mat, App.mesh.TRI );
    }

    static mesh( name, len = 1.5, radius = 0.5, steps = 12, axis = "y" ){
        let geo = this.get( len, radius, steps, axis );
        let mesh = App.mesh.from_data( name, new Float32Array(geo.vertices), 3, new Uint16Array(geo.indices), new Float32Array(geo.normals) );
        return mesh;
    }

    static get(len = 1.5, radius = 0.5, steps = 12, axis = "y") {
        const dir = new Vec3();
        const v = new Vec3();
        const d = new Vec3();
        const n = new Vec3();

        const h = len / 2;
        let i, ang;
        let aa, bb, cc, dd, ii;
        let a = 0, b = 0, c = 0;

        switch( axis ){
            case "y":   a = 2;  b = 1;  c = 0; dir.copy( Vec3.UP ); break;
            case "x":   a = 1;  b = 0;  c = 2; dir.copy( Vec3.LEFT ); break;
            case "z":   a = 0;  b = 2;  c = 1; dir.copy( Vec3.FORWARD ); break;
        }
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // SETUP
        const rtn = {
            vertices    : [],
            indices     : [],
            texcoord    : [],
            normals     : [],
        };

        // Duplicate and Move Loop Indices
        const dupLoop = (loop, dir) => {
            const out = [];
            let idx = rtn.vertices.length / 3;
            let i;
            for (i of loop) {
                v.from_buf(rtn.vertices, i * 3).add(dir).push_to(rtn.vertices);
                out.push(idx++);
            }
            return out;
        };
        // Create Fan Indices from Index Loop and Center Points
        const fanInd = (loop, cIdx, rev = false) => {
            let i = 0, ii = 0;
            len = loop.length - 1;
            for (i; i < len; i++) {
                ii = (i + 1) % len;
                if (!rev)
                    rtn.indices.push(loop[i], cIdx, loop[ii]);
                else
                    rtn.indices.push(loop[ii], cIdx, loop[i]);
            }
        };
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const topLoop = []; // Top Side
        d.from_scale(dir, h); // How much to Move the Top Verts

        n[ a ] = radius;
        n[ b ] = 1;
        n[ c ] = radius;

        for (i = 0; i <= steps; i++) {
            ang     = (i / steps) * Math.PI * 2;
            v[a]    = Math.cos(ang);
            v[b]    = 0;
            v[c]    = Math.sin(ang);

            v   .push_to( rtn.normals )      // Save as Normal
                .mul( n )                   // Set the Right Radius
                .add( d )                   // Move it Away from Origin
                .push_to( rtn.vertices );    // Save as Vert

            topLoop.push(i);
        }

        const botLoop   = dupLoop(topLoop, d.from_scale(dir, -len)); // Bottom Side
        const topCap    = dupLoop(topLoop, [0, 0, 0]); // Top Cap
        const botCap    = dupLoop(botLoop, [0, 0, 0]); // Bottom Cap
        const topCenter = rtn.vertices.length / 3;
        const botCenter = topCenter + 1;
        
        d   .from_scale(dir, h).push_to(rtn.vertices) // Center Verts in Caps
            .from_scale(dir, -h).push_to(rtn.vertices);
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        for (i = 0; i < steps; i++) {                   // Wall Indices
            ii = (i + 1) % steps;
            aa = topLoop[i];
            bb = botLoop[i];
            cc = botLoop[ii];
            dd = topLoop[ii];
            rtn.indices.push(aa, bb, cc, cc, dd, aa);
        }

        fanInd( topCap, topCenter, true );              // Cap indices
        fanInd( botCap, botCenter, false );
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Duplicate Normals since Top+Bottom are the same
        rtn.normals.push( ...rtn.normals );    
        
        // Normals For Top Cap
        for( i=0; i <= steps; i++ ) rtn.normals.push( dir[0], dir[1], dir[2] );

        // Normals For the bottom Cap
        for( i=0; i <= steps; i++ ) rtn.normals.push( -dir[0], -dir[1], -dir[2] );

        rtn.normals.push( dir[0], dir[1], dir[2] );     // Top Cap Center
        rtn.normals.push( -dir[0], -dir[1], -dir[2] );  // Bot Cap Center
        
        return rtn;
    }
}

export default Cylinder;