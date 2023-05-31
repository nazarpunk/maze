export class RandomSeed {
    constructor(seed) {
        this.c = 12345;
        this.m = 0x10000;
        this.x = seed;
    }

    /**
     * @return {number}
     */
    uniform() {
        const t = 1103515245 * this.x + this.c;
        this.x = t % this.m;
        this.c = Math.floor(t / this.m);
        return this.x / 0x10000;
    }

    /**
     * @param {BigInt} min
     * @param {BigInt} max
     * @return {BigInt}
     */
    uniformInt(min, max) {
        const mi = Number(min);
        const ma = Number(max);
        const r = Math.floor(this.uniform() * (ma - mi + 1)) + mi;
        return BigInt(r);
    }
}
