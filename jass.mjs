/**
 * native GetRandomInt takes integer lowBound, integer highBound returns integer
 * @param {number} lowBound
 * @param {number} highBound
 * @return {number}
 */
export const GetRandomInt = (lowBound, highBound) => {
    lowBound = Math.ceil(lowBound);
    highBound = Math.floor(highBound);
    return Math.floor(Math.random() * (highBound - lowBound + 1) + lowBound)
}

class HashTable {
    /** @type {Map<number, Map<number, number>>} */ int = new Map();
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
 * @param {number} parentKey
 * @param {number} childKey
 * @param {number} integer
 * @constructor
 */
export const SaveInteger = (table, parentKey, childKey, integer) => {
    const map = table.int;
    if (!map.has(parentKey)) map.set(parentKey, new Map());
    map.get(parentKey).set(childKey, integer);
}

/**
 * native LoadInteger takes hashtable table, integer parentKey, integer childKey returns integer
 * @param {HashTable} table
 * @param {number} parentKey
 * @param {number} childKey
 * @return {number}
 */
export const LoadInteger = (table, parentKey, childKey) => {
    const map = table.int;
    if (!map.has(parentKey)) return 0;
    return map.get(parentKey).get(childKey);
}

/**
 * native HaveSavedInteger takes hashtable table, integer parentKey, integer childKey returns boolean
 * @param {HashTable} table
 * @param {number} parentKey
 * @param {number} childKey
 * @return {boolean}
 */
export const HaveSavedInteger = (table, parentKey, childKey) => {
    const map = table.int;
    if (!map.has(parentKey)) return false;
    return map.get(parentKey).has(childKey);
}