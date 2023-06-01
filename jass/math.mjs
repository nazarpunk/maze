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



/*
native MathRound takes real r returns integer

native MathRealRound takes real r returns real
native MathRealFloor takes real r returns real
native MathRealCeil takes real r returns real
native MathRealAbs takes real r returns real
native MathRealLog takes real r returns real
native MathRealLn takes real r returns real
native MathRealMin takes real a, real b returns real
native MathRealMax takes real a, real b returns real
native MathRealSign takes real r returns integer

native MathIntegerAbs takes integer i returns integer
native MathIntegerLog takes integer i returns real
native MathIntegerLn takes integer i returns real
native MathIntegerMin takes integer a, integer b returns integer
native MathIntegerMax takes integer a, integer b returns integer
native MathIntegerSign takes integer i returns integer
*/