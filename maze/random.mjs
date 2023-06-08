let seedC, seedM, seedX;

/**
 * @param {BigInt} min
 * @param {BigInt} max
 * @return {BigInt}
 */
export function MazeRandom(min, max) {
    const mi = Number(min);
    const ma = Number(max);

    const t = 1103515245 * seedX + seedC;
    seedX = t % seedM;
    seedC = Math.floor(t / seedM);
    return BigInt(Math.floor(seedX / 0x10000 * (ma - mi + 1)) + mi);
}

/**
 * @param {number} seed
 */
export function MazeRandomSeed(seed) {
    seedC = 12345;
    seedM = 0x10000;
    seedX = seed;
}

