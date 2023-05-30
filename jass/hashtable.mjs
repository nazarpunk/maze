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