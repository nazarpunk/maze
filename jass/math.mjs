/**
 * native GetRandomInt takes integer lowBound, integer highBound returns integer
 * @param {BigInt} lowBound
 * @param {BigInt} highBound
 * @return {BigInt}
 */
export const GetRandomInt = (lowBound, highBound) => {
    const min = Number(lowBound);
    const max = Number(highBound);
    return BigInt(Math.floor(Math.random() * (max - min + 1) + min))
}

/**
 * native BitwiseShiftLeft takes integer bit, integer bitsToShift returns integer
 * @param {BigInt} bit
 * @param {BigInt} bitsToShift
 * @return {BigInt}
 */
export const BitwiseShiftLeft = (bit, bitsToShift) => bit << bitsToShift;

/**
 * native BitwiseAND takes integer bit1, integer bit2 returns integer
 * @param {BigInt} bit1
 * @param {BigInt} bit2
 * @return {BigInt}
 */
export const BitwiseAND = (bit1, bit2) => bit1 & bit2