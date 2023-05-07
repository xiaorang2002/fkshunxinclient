

export default class URandomHelper {

    static _seed: number = 0;
    static math_floor = Math.floor;
    static a = 7;
    static m = 2147483647;
    static floatNum = 1/65535;

    static n = 0

    /**
     *  获取0-1
     */
    static random(): number {
        return Math.random();
    }
    /**
     * 
     * @param min  最小
     * @param max 最大
     */
    // static randomBetween(min: number, max: number): number {
    //     let rd = URandomHelper.random();
    //     let sd = max - min;
    //     return min + Math.floor(sd * rd);
    // }


    static randomFloat(min:number,max:number):number{
        this.GetNextSeed();
        return this.math_floor(this._seed % 65536) * this.floatNum*(max-min)+min
    }



    static seededRandom(s) {  // 伪随机
        this.n = 0;
        this._seed = s
    };


    static randomInt(min: number, max: number) {
        this.GetNextSeed();
        return this._seed % (max - min + 1)+ min
        
    }

    static GetNextSeed()
    {
        this.n++
        this._seed = this.a*this._seed%this.m
    }

}
