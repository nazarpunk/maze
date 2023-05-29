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

//
//     native BitwiseOR takes integer bit1, integer bit2 returns integer

class HashTable {
    /** @type {Map<BigInt, Map<BigInt, BigInt>>} */ int = new Map();
}

/**
 * native InitHashtable takes nothing returns hashtable
 * @return {HashTable}
 */
export const InitHashtable = () => {
    return new HashTable();
}

/**
 * native SaveInteger takes hashtable table, integer parentKey, integer childKey, integer value returns nothing
 * @param {HashTable} table
 * @param {BigInt} parentKey
 * @param {BigInt} childKey
 * @param {BigInt} integer
 */
export const SaveInteger = (table, parentKey, childKey, integer) => {
    const map = table.int;
    if (!map.has(parentKey)) map.set(parentKey, new Map());
    map.get(parentKey).set(childKey, integer);
}

/**
 * native LoadInteger takes hashtable table, integer parentKey, integer childKey returns integer
 * @param {HashTable} table
 * @param {BigInt} parentKey
 * @param {BigInt} childKey
 * @return {BigInt}
 */
export const LoadInteger = (table, parentKey, childKey) => {
    const map = table.int;
    if (!map.has(parentKey)) return 0n;
    return map.get(parentKey).get(childKey);
}