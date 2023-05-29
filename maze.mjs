// noinspection ES6MissingAwait

import {BitwiseAND, BitwiseShiftLeft, GetRandomInt, InitHashtable, LoadInteger, SaveInteger} from "./jass.mjs";
import {delay, sleep} from "./utils.mjs";
import {domlist} from "./main.mjs";

const htOffset = 100n;
const ht = InitHashtable();
const cellCountKey = 0n;
const widthKey = 1n;
const heightKey = 2n;

/** @type {BigInt[]} */ let randomCellList = [];

const wallKeyL = BitwiseShiftLeft(1n, 0n);
const wallKeyT = BitwiseShiftLeft(1n, 1n);
const wallKeyR = BitwiseShiftLeft(1n, 2n);
const wallKeyB = BitwiseShiftLeft(1n, 3n);

/**
 * @param {BigInt} maze
 * @param {BigInt} index
 */
export const MazeWallUpdate = (maze, index) => {
    const c = domlist[index].classList;
    const b = LoadInteger(ht, maze, htOffset + index);

    if (BitwiseAND(b, wallKeyL) > 0n) c.add('wl'); else c.remove('wl');
    if (BitwiseAND(b, wallKeyT) > 0n) c.add('wt'); else c.remove('wt');
    if (BitwiseAND(b, wallKeyR) > 0n) c.add('wr'); else c.remove('wr');
    if (BitwiseAND(b, wallKeyB) > 0n) c.add('wb'); else c.remove('wb');
}

/**
 * @param {BigInt} maze
 * @param {BigInt} index
 * @param {BigInt} l
 * @param {BigInt} t
 * @param {BigInt} r
 * @param {BigInt} b
 */
export const MazeIndexWallLTRB = (maze, index, l, t, r, b) => {
    const x = MazeCellIndexX(maze, index);
    const y = MazeCellIndexY(maze, index);
    const c = LoadInteger(ht, maze, htOffset + index);

    if (l < 0) l = BitwiseAND(c, wallKeyL);
    if (t < 0) t = BitwiseAND(c, wallKeyT);
    if (r < 0) r = BitwiseAND(c, wallKeyR);
    if (b < 0) b = BitwiseAND(c, wallKeyB);

    if (l === 0n && x === 0n) l = 1n;
    if (t === 0n && y === 0n) t = 1n;
    if (r === 0n && x === MazeWidth(maze) - 1n) r = 1n;
    if (b === 0n && y === MazeHeight(maze) - 1n) b = 1n;

    let out = 0n;
    if (l > 0n) out += wallKeyL;
    if (t > 0n) out += wallKeyT;
    if (r > 0n) out += wallKeyR;
    if (b > 0n) out += wallKeyB;

    SaveInteger(ht, maze, htOffset + index, out);

    MazeWallUpdate(maze, index);
};

/**
 * @param {BigInt} maze
 * @param {BigInt} index
 * @return {number}
 */
export const MazeIndexWallCount = (maze, index) => {
    const c = LoadInteger(ht, maze, htOffset + index);
    let count = 0;

    if (BitwiseAND(c, wallKeyL) > 0n) count += 1;
    if (BitwiseAND(c, wallKeyT) > 0n) count += 1;
    if (BitwiseAND(c, wallKeyR) > 0n) count += 1;
    if (BitwiseAND(c, wallKeyB) > 0n) count += 1;

    return count;
}

/**
 * @param {BigInt} maze
 * @param {BigInt} side
 * @param {BigInt} a
 * @param {BigInt} x
 * @param {BigInt} y
 */
const randomCellAdd = (maze, side, a, x, y) => {
    const b = MazeCellIndex(maze, x, y);
    const av = LoadInteger(ht, maze, htOffset + a);
    const bv = LoadInteger(ht, maze, htOffset + b);

    if (side === wallKeyL && (BitwiseAND(av, wallKeyL) === 0n || BitwiseAND(bv, wallKeyR) === 0n)) return;
    if (side === wallKeyT && (BitwiseAND(av, wallKeyT) === 0n || BitwiseAND(bv, wallKeyB) === 0n)) return;
    if (side === wallKeyR && (BitwiseAND(av, wallKeyR) === 0n || BitwiseAND(bv, wallKeyL) === 0n)) return;
    if (side === wallKeyB && (BitwiseAND(av, wallKeyB) === 0n || BitwiseAND(bv, wallKeyT) === 0n)) return;

    randomCellList[0] += 1n;
    randomCellList[randomCellList[0]] = b;
}

/**
 * @param {BigInt} maze
 * @param {BigInt} index
 * @return {Promise<BigInt>}
 */
const randomCell = async (maze, index) => {
    let wc;
    const x = MazeCellIndexX(maze, index);
    const y = MazeCellIndexY(maze, index);
    randomCellList = [0n];

    // 0 : cell count
    // 1-4 : cells
    // 5 : max wall counter
    // 6 : filter cell count
    // 7-10 : filter cells

    if (x > 0n) /*                   */ randomCellAdd(maze, wallKeyL, index, x - 1n, y);
    if (x < MazeWidth(maze) - 1n) /* */ randomCellAdd(maze, wallKeyR, index, x + 1n, y);
    if (y > 0n) /*                   */ randomCellAdd(maze, wallKeyT, index, x, y - 1n);
    if (y < MazeHeight(maze) - 1n) /**/ randomCellAdd(maze, wallKeyB, index, x, y + 1n);

    if (randomCellList[0] < 1n) return -1n;

    // max wall count
    randomCellList[5] = 0n;
    for (let i = 1n; i <= randomCellList[0]; i++) {
        wc = MazeIndexWallCount(maze, randomCellList[i]);
        if (wc > randomCellList[5]) randomCellList[5] = wc;
    }

    // filter
    randomCellList[6] = 6n;
    for (let i = 1n; i <= randomCellList[0]; i++) {
        wc = MazeIndexWallCount(maze, randomCellList[i]);
        if (wc >= randomCellList[5]) {
            randomCellList[6] += 1n;
            randomCellList[randomCellList[6]] = randomCellList[i];
        }
    }

    for (let i = 7n; i <= randomCellList[6]; i++) domlist[randomCellList[i]].classList.add('random');
    //await delay(700);
    await delay(500);
    await sleep();
    for (let i = 7n; i <= randomCellList[6]; i++) domlist[randomCellList[i]].classList.remove('random');

    return randomCellList[Number(GetRandomInt(7n, randomCellList[6]))];
}

/**
 * @param {BigInt} maze
 * @param {BigInt} width
 * @param {BigInt} height
 * @return {Promise<void>}
 */
export const MazeGenerate = async (maze, width, height) => {
    const cellCount = width * height;
    SaveInteger(ht, maze, cellCountKey, BigInt(cellCount));
    SaveInteger(ht, maze, widthKey, width);
    SaveInteger(ht, maze, heightKey, height);

    const count = MazeCellCount(maze);

    const div = document.createElement('div');
    div.classList.add('maze');
    document.body.appendChild(div);

    div.style.gridTemplateColumns = `repeat(${MazeWidth(maze)}, 1fr)`;

    for (let i = 0n; i < count; i++) {
        const cell = document.createElement('div');
        domlist.push(cell);
        cell.classList.add('cell');
        cell.innerHTML = `<div>${i}</div><div><b>${MazeCellIndexX(maze, i)}</b>:<b>${MazeCellIndexY(maze, i)}</b></div>`;
        div.appendChild(cell);
    }

    // add wall
    await delay(200);
    let p = [];
    for (let x = 0n; x < width; x++) {
        p.push((async () => {
            for (let y = 0n; y < height; y++) {
                MazeIndexWallLTRB(maze, MazeCellIndex(maze, x, x % 2n === 0n ? height - y - 1n : y), 1n, 1n, 1n, 1n);
                await sleep();
            }
        })());
    }

    await Promise.all(p);
    await delay(200);
    let a = -1n, b, xa, ya, xb, yb;

    await delay(200);

    //for (let j = 0; j < 5; j++) {
    while (true) {
        if (a < 0) {
            xa = GetRandomInt(0n, width - 1n);
            ya = GetRandomInt(0n, height - 1n);
            a = MazeCellIndex(maze, xa, ya);
        } else {
            xa = MazeCellIndexX(maze, a);
            ya = MazeCellIndexY(maze, a);
        }
        domlist[a].classList.add('active');

        b = await randomCell(maze, a);
        if (b < 0) {
            console.log('end');
            break;
        }

        xb = MazeCellIndexX(maze, b);
        yb = MazeCellIndexY(maze, b);

        //let wl, wt, wr, wb;

        if (xa > xb && ya === yb) {
            // left
            MazeIndexWallLTRB(maze, a, 0n, 0n, -1n, 0n);
            MazeIndexWallLTRB(maze, b, -1n, -1n, 0n, -1n);
        }
        if (xa === xb && ya > yb) {
            // top
            MazeIndexWallLTRB(maze, a, 0n, 0n, 0n, -1n);
            MazeIndexWallLTRB(maze, b, -1n, -1n, -1n, 0n);
        }
        if (xa < xb && ya === yb) {
            // right
            MazeIndexWallLTRB(maze, a, -1n, 0n, 0n, 0n);
            MazeIndexWallLTRB(maze, b, 0n, -1n, -1n, -1n);
        }
        if (xa === xb && ya < yb) {
            // bottom
            MazeIndexWallLTRB(maze, a, 0n, -1n, 0n, 0n);
            MazeIndexWallLTRB(maze, b, -1n, 0n, -1n, -1n);
        }

        domlist[a].classList.remove('active');

        a = b;
        await sleep();
    }
}

/**
 * @param {BigInt} maze
 * @param {BigInt} x
 * @param {BigInt} y
 * @return {BigInt}
 */
export const MazeCellIndex = (maze, x, y) => {
    return x + MazeWidth(maze) * y;
}

/**
 * @param {BigInt} maze
 * @param {BigInt} index
 * @return {BigInt}
 */
export const MazeCellIndexX = (maze, index) => {
    return index % MazeWidth(maze);
}

/**
 * @param {BigInt} maze
 * @param {BigInt} index
 * @return {BigInt}
 */
export const MazeCellIndexY = (maze, index) => {
    return BigInt(Math.trunc(Number(index / MazeWidth(maze))));
}

/**
 * @param {BigInt} maze
 * @return {BigInt}
 */
export const MazeCellCount = (maze) => {
    return LoadInteger(ht, maze, cellCountKey);
}

/**
 * @param {BigInt} maze
 * @return {BigInt}
 */
export const MazeWidth = (maze) => {
    return LoadInteger(ht, maze, widthKey);
}

/**
 * @param {BigInt} maze
 * @return {BigInt}
 */
export const MazeHeight = (maze) => {
    return LoadInteger(ht, maze, heightKey);
}