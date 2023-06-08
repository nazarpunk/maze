// noinspection ES6MissingAwait

import {delay, sleep} from "../utils.mjs";
import {LoadInteger, SaveInteger} from "../jass/hashtable.mjs";
import {BitwiseGetBit, BitwiseSetBit} from "../jass/math.mjs";
import {
    HandleListAddHandle, HandleListClear,
    HandleListContainsHandle,
    HandleListCreate, HandleListGetCount, HandleListGetHandleByIndex,
    HandleListRemoveHandle
} from "../jass/handlelist.mjs";
import {
    MazeCellIndexXY,
    MazeCellX,
    MazeCellY,
    MazeHeight,
    MazeHeightKey,
    MazeHt,
    MazeHtOffset, MazeWallB, MazeWallL, MazeWallR, MazeWallT,
    MazeWidth,
    MazeWidthKey
} from "./maze.mjs";
import {MazeRandom, MazeRandomSeed} from "./random.mjs";


/** @type {BigInt[]} */ let randomCellList = [];

const sideList = HandleListCreate();

const wrap = document.querySelector('.maze');
/** @type {HTMLDivElement[]} */ const domlist = [];

const iterationDiv = document.querySelector('.iteration');

/**
 * @param {BigInt} maze
 * @param {BigInt} index
 */
const cellRedraw = (maze, index) => {
    const c = domlist[index].classList;
    const b = LoadInteger(MazeHt, maze, MazeHtOffset + index);

    c.toggle('wl', BitwiseGetBit(b, MazeWallL) !== 0n);
    c.toggle('wt', BitwiseGetBit(b, MazeWallT) !== 0n);
    c.toggle('wr', BitwiseGetBit(b, MazeWallR) !== 0n);
    c.toggle('wb', BitwiseGetBit(b, MazeWallB) !== 0n);

    c.toggle('side', HandleListContainsHandle(sideList, index));
}

/**
 * @param {BigInt} maze
 * @param {BigInt} index
 * @param {BigInt} direction
 * @param {BigInt} value
 */
function cellSetWall(maze, index, direction, value) {
    let x, y, c;
    if (value < 0n) return;
    c = LoadInteger(MazeHt, maze, MazeHtOffset + index);
    if (value === 0n) {
        x = MazeCellX(maze, index);
        y = MazeCellY(maze, index);
        if (direction === MazeWallL && x === 0n) return;
        if (direction === MazeWallT && y === 0n) return;
        if (direction === MazeWallR && x === MazeWidth(maze) - 1n) return;
        if (direction === MazeWallB && y === MazeHeight(maze) - 1n) return;
    }

    c = BitwiseSetBit(c, direction, value);
    SaveInteger(MazeHt, maze, MazeHtOffset + index, c);
}

/**
 * @param {BigInt} maze
 * @param {BigInt} index
 * @return {number}
 */
function cellGetWallCount(maze, index) {
    const c = LoadInteger(MazeHt, maze, MazeHtOffset + index);
    let count = 0;

    if (BitwiseGetBit(c, MazeWallL) !== 0n) count += 1;
    if (BitwiseGetBit(c, MazeWallT) !== 0n) count += 1;
    if (BitwiseGetBit(c, MazeWallR) !== 0n) count += 1;
    if (BitwiseGetBit(c, MazeWallB) !== 0n) count += 1;

    return count;
}

/**
 * @param {BigInt} maze
 * @param {BigInt} index
 * @param {boolean} isAdd
 */
function sideListSet(maze, index, isAdd) {
    if (isAdd) {
        if (!HandleListContainsHandle(sideList, index)) HandleListAddHandle(sideList, index);
    } else {
        HandleListRemoveHandle(sideList, index);
    }
    cellRedraw(maze, index);
}

/**
 * @param {BigInt} maze
 * @param {BigInt} side
 * @param {BigInt} a
 * @param {BigInt} x
 * @param {BigInt} y
 */
function cellNextRandomAdd(maze, side, a, x, y) {
    const b = MazeCellIndexXY(maze, x, y);
    const av = LoadInteger(MazeHt, maze, MazeHtOffset + a);
    const bv = LoadInteger(MazeHt, maze, MazeHtOffset + b);

    sideListSet(maze, b, cellGetWallCount(maze, b) === 4);

    if (side === MazeWallL && (BitwiseGetBit(av, MazeWallL) === 0n || BitwiseGetBit(bv, MazeWallR) === 0n)) return;
    if (side === MazeWallT && (BitwiseGetBit(av, MazeWallT) === 0n || BitwiseGetBit(bv, MazeWallB) === 0n)) return;
    if (side === MazeWallR && (BitwiseGetBit(av, MazeWallR) === 0n || BitwiseGetBit(bv, MazeWallL) === 0n)) return;
    if (side === MazeWallB && (BitwiseGetBit(av, MazeWallB) === 0n || BitwiseGetBit(bv, MazeWallT) === 0n)) return;

    randomCellList[0] += 1n;
    randomCellList[randomCellList[0]] = b;
}

/**
 * @param {BigInt} maze
 * @param {BigInt} index
 * @return {Promise<BigInt>}
 */
async function cellNextRandom(maze, index) {
    let wc;
    const x = MazeCellX(maze, index);
    const y = MazeCellY(maze, index);
    randomCellList = [0n];

    sideListSet(maze, index, false);

    // 0 : cell count
    // 1-4 : cells
    // 5 : max wall counter
    // 6 : filter cell count
    // 7-10 : filter cells

    if (x > 0n) cellNextRandomAdd(maze, MazeWallL, index, x - 1n, y);
    if (y > 0n) cellNextRandomAdd(maze, MazeWallT, index, x, y - 1n);
    if (x < MazeWidth(maze) - 1n) cellNextRandomAdd(maze, MazeWallR, index, x + 1n, y);
    if (y < MazeHeight(maze) - 1n) cellNextRandomAdd(maze, MazeWallB, index, x, y + 1n);

    if (randomCellList[0] < 1n) return -1n;

    // max wall count
    randomCellList[5] = 0n;
    for (let i = 1n; i <= randomCellList[0]; i++) {
        wc = cellGetWallCount(maze, randomCellList[i]);
        if (wc > randomCellList[5]) randomCellList[5] = wc;
    }

    // filter
    randomCellList[6] = 6n;
    for (let i = 1n; i <= randomCellList[0]; i++) {
        wc = cellGetWallCount(maze, randomCellList[i]);
        if (wc >= randomCellList[5]) {
            randomCellList[6] += 1n;
            randomCellList[randomCellList[6]] = randomCellList[i];
        }
    }
    await sleep();
    for (let i = 7n; i <= randomCellList[6]; i++) domlist[randomCellList[i]].classList.add('random');
    await delay(100);
    for (let i = 7n; i <= randomCellList[6]; i++) domlist[randomCellList[i]].classList.remove('random');

    return randomCellList[Number(MazeRandom(7n, randomCellList[6]))];
}

/**
 * @param {BigInt} maze
 * @param {BigInt} ai
 * @param {BigInt} direction
 * @param {BigInt} bi
 */
function cellMergeWall(maze, ai, direction, bi) {
    const av = LoadInteger(MazeHt, maze, MazeHtOffset + ai);
    const ax = MazeCellX(maze, ai);
    const ay = MazeCellY(maze, ai);
    const w = MazeWidth(maze);
    const h = MazeHeight(maze);
    let bv;

    if (direction === MazeWallL || direction === MazeWallR) {
        if (ay > 0n) {
            bv = LoadInteger(MazeHt, maze, (ax + w * (ay - 1n)) + MazeHtOffset);
            if (BitwiseGetBit(av, MazeWallT) === 1n && BitwiseGetBit(bv, MazeWallB) === 1n) cellSetWall(maze, ai, MazeWallT, 0n);
        }
        if (ay < h - 1n) {
            bv = LoadInteger(MazeHt, maze, (ax + w * (ay + 1n)) + MazeHtOffset);
            if (BitwiseGetBit(av, MazeWallB) === 1n && BitwiseGetBit(bv, MazeWallT) === 1n) cellSetWall(maze, ai, MazeWallB, 0n);
        }

        if (direction === MazeWallL) {
            cellSetWall(maze, ai, MazeWallL, 0n);
            cellSetWall(maze, bi, MazeWallR, 0n);
        }
        if (direction === MazeWallR) {
            cellSetWall(maze, ai, MazeWallR, 0n);
            cellSetWall(maze, bi, MazeWallL, 0n);
        }
    }

    if (direction === MazeWallT || direction === MazeWallB) {
        if (ax > 0n) {
            bv = LoadInteger(MazeHt, maze, (ax - 1n + w * ay) + MazeHtOffset);
            if (BitwiseGetBit(av, MazeWallL) === 1n && BitwiseGetBit(bv, MazeWallR) === 1n) cellSetWall(maze, ai, MazeWallL, 0n);
        }
        if (ax < w - 1n) {
            bv = LoadInteger(MazeHt, maze, (ax + 1n + w * ay) + MazeHtOffset);
            if (BitwiseGetBit(av, MazeWallR) === 1n && BitwiseGetBit(bv, MazeWallL) === 1n) cellSetWall(maze, ai, MazeWallR, 0n);
        }
        if (direction === MazeWallT) {
            cellSetWall(maze, ai, MazeWallT, 0n);
            cellSetWall(maze, bi, MazeWallB, 0n);
        }
        if (direction === MazeWallB) {
            cellSetWall(maze, ai, MazeWallB, 0n);
            cellSetWall(maze, bi, MazeWallT, 0n);
        }
    }
}

/**
 * @param {BigInt} maze
 * @param {BigInt} a
 * @param {BigInt} direction
 * @param {BigInt} x
 * @param {BigInt} y
 */
function jumpCellSetWall(maze, a, direction, x, y) {
    const b = MazeCellIndexXY(maze, x, y);
    const wc = cellGetWallCount(maze, b);


    if (wc === 4) return false;
    cellMergeWall(maze, a, direction, b);
    return true;
}

/**
 * @param {BigInt} maze
 * @param {BigInt} width
 * @param {BigInt} height
 * @param {number} seed
 * @param {BigInt} iterations
 * @return {Promise<void>}
 */
export async function MazeGenerate(maze, width, height, seed, iterations) {
    MazeRandomSeed(seed);

    const count = width * height;
    if (iterations <= 0) iterations = count;

    iterationDiv.textContent = `${iterations} / ${count}`;

    let wallJumped;

    SaveInteger(MazeHt, maze, MazeWidthKey, width);
    SaveInteger(MazeHt, maze, MazeHeightKey, height);

    HandleListClear(sideList);

    wrap.textContent = '';
    domlist.length = 0;

    const px = '40px';
    wrap.style.gridTemplateColumns = `repeat(${MazeWidth(maze)}, ${px})`;
    wrap.style.gridTemplateRows = `repeat(${MazeHeight(maze)}, ${px})`;

    for (let i = 0n; i < count; i++) {
        const cell = document.createElement('div');
        domlist.push(cell);
        cell.classList.add('cell');
        cell.innerHTML = `<div class="inner"><div>${i}</div><div><b>${MazeCellX(maze, i)}</b>:<b>${MazeCellY(maze, i)}</b></div></div>`;
        wrap.appendChild(cell);
    }

    // add wall
    await delay(200);
    let p = [];
    for (let x = 0n; x < width; x++) {
        p.push((async () => {
            for (let y = 0n; y < height; y++) {
                const index = MazeCellIndexXY(maze, x, x % 2n === 0n ? height - y - 1n : y);
                SaveInteger(MazeHt, maze, MazeHtOffset + index, 15n);
                cellRedraw(maze, index);
                await sleep();
            }
        })());
    }

    await Promise.all(p);
    await delay(200);
    let a = -1n, b, ax, ay, bx, by;

    await delay(200);

    while (true) {
        iterationDiv.textContent = `${iterations} / ${count}`;
        if (a < 0) {
            ax = MazeRandom(0n, width - 1n);
            ay = MazeRandom(0n, height - 1n);
            a = MazeCellIndexXY(maze, ax, ay);
        } else {
            ax = MazeCellX(maze, a);
            ay = MazeCellY(maze, a);
        }

        b = await cellNextRandom(maze, a);
        if (b < 0) {
            let sideListCount = HandleListGetCount(sideList);
            if (sideListCount === 0) break;

            for (let i = 0; i < sideListCount; i++) {
                b = HandleListGetHandleByIndex(sideList, i);
                domlist[b].classList.add('random');
            }

            a = HandleListGetHandleByIndex(sideList, Number(MazeRandom(0n, BigInt(sideListCount - 1))));
            ax = MazeCellX(maze, a);
            ay = MazeCellY(maze, a);

            //domlist[a].classList.add('active');

            await delay(200);

            for (let i = 0; i < sideListCount; i++) {
                b = HandleListGetHandleByIndex(sideList, i);
                domlist[b].classList.remove('random');
            }

            wallJumped = false;
            if (!wallJumped && ax > 0n) wallJumped = jumpCellSetWall(maze, a, MazeWallL, ax - 1n, ay);
            if (!wallJumped && ay > 0n) wallJumped = jumpCellSetWall(maze, a, MazeWallT, ax, ay - 1n);
            if (!wallJumped && ax < MazeWidth(maze) - 1n) wallJumped = jumpCellSetWall(maze, a, MazeWallR, ax + 1n, ay);
            if (!wallJumped && ay < MazeHeight(maze) - 1n) wallJumped = jumpCellSetWall(maze, a, MazeWallB, ax, ay + 1n);
            iterations--;
        } else {
            bx = MazeCellX(maze, b);
            by = MazeCellY(maze, b);
            if (cellGetWallCount(maze, b) === 4) iterations--;

            if (ax > bx && ay === by) cellMergeWall(maze, a, MazeWallL, b);
            if (ax === bx && ay > by) cellMergeWall(maze, a, MazeWallT, b);
            if (ax < bx && ay === by) cellMergeWall(maze, a, MazeWallR, b);
            if (ax === bx && ay < by) cellMergeWall(maze, a, MazeWallB, b);

            a = b;
        }
        if (iterations === 0n) break;
        await sleep();
    }
}