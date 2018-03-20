/*
*
*  @author Oleksiy Al-saadi
*  @desc  Contents and variables in Light Objects
*
*/



class LightObject {
    
    constructor(x, y, z, id, r, g, b) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.id = id;
        this.r = r;
        this.g = g;
        this.b = b;
    }

    get_ID() {
        return this.id;
    }
    
    get_Pos() {
        var pos = [this.x, this.y, this.z];
        return pos;
    }

    get_Color() {
        var color = [this.r, this.g, this.b];
        return color;
    }
}