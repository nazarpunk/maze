/**
 * native HandleListCreate takes nothing returns handlelist
 * @return {Set<BigInt>}
 */
export const HandleListCreate = () => new Set();

/**
 * native HandleListContainsHandle takes handlelist whichHandleList, handle whichHandle returns boolean
 * @param {Set<BigInt>} whichHandleList
 * @param {BigInt} whichHandle
 * @return {boolean}
 */
export const HandleListContainsHandle = (whichHandleList, whichHandle) => whichHandleList.has(whichHandle)

/**
 * native HandleListAddHandle takes handlelist whichHandleList, handle whichHandle returns nothing
 * @param {Set<BigInt>} whichHandleList
 * @param {BigInt} whichHandle
 */
export const HandleListAddHandle = (whichHandleList, whichHandle) => whichHandleList.add(whichHandle);

/**
 * native HandleListRemoveHandle takes handlelist whichHandleList, handle whichHandle returns nothing
 * @param {Set<BigInt>} whichHandleList
 * @param {BigInt} whichHandle
 */
export const HandleListRemoveHandle = (whichHandleList, whichHandle) => whichHandleList.delete(whichHandle);

/**
 * native HandleListGetCount takes handlelist whichHandleList returns integer
 * @param {Set<BigInt>} whichHandleList
 * @return {number}
 */
export const HandleListGetCount = (whichHandleList) => whichHandleList.size

/**
 * native HandleListGetHandleByIndex takes handlelist whichHandleList, integer index returns handle
 * @param {Set<BigInt>} whichHandleList
 * @param {number} index
 * @return {BigInt}
 */
export const HandleListGetHandleByIndex = (whichHandleList, index) => [...whichHandleList][index];

/**
 * native HandleListClear takes handlelist whichHandleList returns nothing
 * @param {Set<BigInt>} handlelist
 */
export const HandleListClear = (handlelist) => handlelist.clear();

/*
native HandleListDestroy takes handlelist whichHandleList returns nothing
native HandleListAddList takes handlelist destHandleList, handlelist sourceHandleList returns integer
native HandleListRemoveList takes handlelist destHandleList, handlelist sourceHandleList returns integer

native HandleListGetCountEx takes handlelist whichHandleList, integer handleTypeId returns integer
 */