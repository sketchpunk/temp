export default {
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    download : ()=>{
        return Promise.all([
            fetch( "./wfc_mm_tiles.gltf" ).then( r=>r.json() ),
            fetch( "./wfc_mm_tiles.bin" ).then( r=>r.arrayBuffer() ),
        ]);
    }, 

    /*
    Symmetrical Sockets  - s# - Identical connectors no matter the rotation 
    Asymmetrical Sockets - # then f# - Can only connect to a Mirror version of itself. L Shapes are an example
    Vertical Sockets     - v#_[0,1,2,3] - Top and Bottom, Can only connect if sharing the same rotation
    */

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //  sockets are FWD, LEFT, BACK, RIGHT, TOP, BOTTOM
    data     : [
        { "name":"Roof", "bits":15, "rot":0, "weight":5, "sockets":[ "s1","s1","s1","s1","0","0" ] },
        { "name":"Roof_Pillar", "bits":15, "rot":0, "weight":5, "sockets":[ "s1","s1","s1","s1","0","0"] },
        { "name":"WallTop", "bits":6, "rot":7, "weight":5, "sockets":[ "1","s1","f1","0","0","0" ] },
        { "name":"WallTop_Pillar", "bits":6, "rot":7, "weight":5, "sockets":[ "1","s1","f1","0","0","0" ] },
        { "name":"InnerCornerTop", "bits":14, "rot":7, "weight":5, "sockets":[ "1","s1","s1","f1","0","0" ] },
        { "name":"InnerCornerTop_Pillar", "bits":14, "rot":7, "weight":5, "sockets":[ "1","s1","s1","f1","0","0" ] },
        { "name":"CornerTop", "bits":4, "rot":7, "weight":5, "sockets":[ "0","1","f1","0","0","0" ] },
        { "name":"CornerTop_Pillar", "bits":4, "rot":7, "weight":5, "sockets":[ "0","1","f1","0","0","0" ] },
        { "name":"DoubleCornerTop", "bits":5, "rot":1, "weight":5, "sockets":[ "f1","1","f1","1","0","0" ] },
        { "name":"DoubleCornerTop_Pillar", "bits":5, "rot":1, "weight":5, "sockets":[ "f1","1","f1","1","0","0" ] },

        //------------------

        /*
        { "name":"PillarTowerCorner", "bits":108, "rot":7, "weight":5, "sockets":[] },
        { "name":"PillarWall", "bits":100, "rot":7, "weight":5, "sockets":[] },        
        { "name":"PillarCorner", "bits":228, "rot":7, "weight":5, "sockets":[] },
        { "name":"CornerTop_Slopy", "bits":4, "rot":7, "weight":5, "sockets":[] },
        { "name":"WallTop_Slopy", "bits":6, "rot":7, "weight":5, "sockets":[] },

        { "name":"Wall", "bits":102, "rot":7, "weight":5, "sockets":[] },
        { "name":"Corner", "bits":68, "rot":7, "weight":5, "sockets":[] },        
        { "name":"InnerCorner", "bits":238, "rot":7, "weight":5, "sockets":[] },
        
        { "name":"RoofWall", "bits":111, "rot":7, "weight":5, "sockets":[] },
        { "name":"RoofCorner", "bits":79, "rot":7, "weight":5, "sockets":[] },
        { "name":"RoofInnerCorner", "bits":239, "rot":7, "weight":5, "sockets":[] },
        { "name":"TowerCorner", "bits":78, "rot":7, "weight":5, "sockets":[] },
        { "name":"TowerWall", "bits":70, "rot":7, "weight":5, "sockets":[] },
        { "name":"WingInnerCorner", "bits":110, "rot":7, "weight":5, "sockets":[] },
        { "name":"WingTerrasse", "bits":71, "rot":7, "weight":5, "sockets":[] },

        { "name":"DoubleCorner", "bits":85, "rot":1, "weight":5, "sockets":[] },
        { "name":"TowerDoubleCorner", "bits":69, "rot":7, "weight":5, "sockets":[] },
        { "name":"WingDoubleCorner", "bits":93, "rot":7, "weight":5, "sockets":[] },
        { "name":"RoofDoubleCorner", "bits":95, "rot":1, "weight":5, "sockets":[] },
        { "name":"CornerBottom", "bits":64, "rot":7, "weight":5, "sockets":[] },
        { "name":"WallBottom", "bits":96, "rot":7, "weight":5, "sockets":[] },
        { "name":"InnerCornerBottom", "bits":224, "rot":7, "weight":5, "sockets":[] },
        { "name":"DoubleCornerBottom", "bits":80, "rot":1, "weight":5, "sockets":[] },

        { "name":"CeilInnerCorner", "bits":254, "rot":7, "weight":5, "sockets":[] },
        { "name":"CeilCorner", "bits":244, "rot":7, "weight":5, "sockets":[] },
        { "name":"CeilWall", "bits":246, "rot":7, "weight":5, "sockets":[] },
        */
    ]
};