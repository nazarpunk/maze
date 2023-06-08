import {InitHashtable, LoadInteger} from "../jass/hashtable.mjs";

export const MazeHt = InitHashtable();
export const MazeHtOffset = 100n;
export const MazeWidthKey = 1n;
export const MazeHeightKey = 2n;
export const MazeWallL = 0n;
export const MazeWallT = 1n;
export const MazeWallR = 2n;
export const MazeWallB = 3n;

/**
 * @param {BigInt} maze
 * @return {BigInt}
 */
export function MazeWidth(maze) {
    return LoadInteger(MazeHt, maze, MazeWidthKey);
}

/**
 * @param {BigInt} maze
 * @return {BigInt}
 */
export function MazeHeight(maze) {
    return LoadInteger(MazeHt, maze, MazeHeightKey);
}

/**
 * @param {BigInt} maze
 * @param {BigInt} index
 * @return {BigInt}
 */
export function MazeCellY(maze, index) {
    return index / MazeWidth(maze)
}

/**
 * @param {BigInt} maze
 * @param {BigInt} index
 * @return {BigInt}
 */
export function MazeCellX(maze, index) {
    return index % MazeWidth(maze);
}

/**
 * @param {BigInt} maze
 * @param {BigInt} x
 * @param {BigInt} y
 * @return {BigInt}
 */
export const MazeCellIndexXY = (maze, x, y) => {
    return x + MazeWidth(maze) * y;
}
