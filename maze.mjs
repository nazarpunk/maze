// noinspection ES6MissingAwait

import {delay, sleep} from "./utils.mjs";
import {InitHashtable, LoadInteger, SaveInteger} from "./jass/hashtable.mjs";
import {BitwiseGetBit, BitwiseSetBit} from "./jass/math.mjs";
import {
    HandleListAddHandle, HandleListClear,
    HandleListContainsHandle,
    HandleListCreate, HandleListGetCount, HandleListGetHandleByIndex,
    HandleListRemoveHandle
} from "./jass/handlelist.mjs";

const htOffset = 100n;
const ht = InitHashtable();
const widthKey = 1n;
const heightKey = 2n;

/** @type {BigInt[]} */ let randomCellList = [];

const sideList = HandleListCreate();

let seedC, seedM, seedX;

/**
 * @param {BigInt} min
 * @param {BigInt} max
 * @return {BigInt}
 */
function random(min, max) {
    const mi = Number(min);
    const ma = Number(max);

    const t = 1103515245 * seedX + seedC;
    seedX = t % seedM;
    seedC = Math.floor(t / seedM);
    return BigInt(Math.floor(seedX / 0x10000 * (ma - mi + 1)) + mi);
}

const wL = 0n;
const wT = 1n;
const wR = 2n;
const wB = 3n;

const wrap = document.querySelector('.maze');
/** @type {HTMLDivElement[]} */ const domlist = [];

/**
 * @param {BigInt} maze
 * @param {BigInt} index
 */
const cellRedraw = (maze, index) => {
    const c = domlist[index].classList;
    const b = LoadInteger(ht, maze, htOffset + index);

    c.toggle('wl', BitwiseGetBit(b, wL) !== 0n);
    c.toggle('wt', BitwiseGetBit(b, wT) !== 0n);
    c.toggle('wr', BitwiseGetBit(b, wR) !== 0n);
    c.toggle('wb', BitwiseGetBit(b, wB) !== 0n);

    c.toggle('side', HandleListContainsHandle(sideList, index));
}

/**
 * @param {BigInt} maze
 * @return {BigInt}
 */
function MazeWidth(maze) {
    return LoadInteger(ht, maze, widthKey);
}

/**
 * @param {BigInt} maze
 * @return {BigInt}
 */
function MazeHeight(maze) {
    return LoadInteger(ht, maze, heightKey);
}

/**
 * @param {BigInt} maze
 * @param {BigInt} index
 * @return {BigInt}
 */
function MazeCellY(maze, index) {
    return BigInt(Math.trunc(Number(index / MazeWidth(maze))));
}

/**
 * @param {BigInt} maze
 * @param {BigInt} index
 * @return {BigInt}
 */
function MazeCellX(maze, index) {
    return index % MazeWidth(maze);
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
    c = LoadInteger(ht, maze, htOffset + index);
    if (value === 0n) {
        x = MazeCellX(maze, index);
        y = MazeCellY(maze, index);
        if (direction === wL && x === 0n) return;
        if (direction === wT && y === 0n) return;
        if (direction === wR && x === MazeWidth(maze) - 1n) return;
        if (direction === wB && y === MazeHeight(maze) - 1n) return;
    }

    c = BitwiseSetBit(c, direction, value);
    SaveInteger(ht, maze, htOffset + index, c);
}

/**
 * @param {BigInt} maze
 * @param {BigInt} index
 * @return {number}
 */
function cellGetWallCount(maze, index) {
    const c = LoadInteger(ht, maze, htOffset + index);
    let count = 0;

    if (BitwiseGetBit(c, wL) !== 0n) count += 1;
    if (BitwiseGetBit(c, wT) !== 0n) count += 1;
    if (BitwiseGetBit(c, wR) !== 0n) count += 1;
    if (BitwiseGetBit(c, wB) !== 0n) count += 1;

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
 * @param {BigInt} x
 * @param {BigInt} y
 * @return {BigInt}
 */
const MazeCellGetByXY = (maze, x, y) => {
    return x + MazeWidth(maze) * y;
}

/**
 * @param {BigInt} maze
 * @param {BigInt} side
 * @param {BigInt} a
 * @param {BigInt} x
 * @param {BigInt} y
 */
function cellNextRandomAdd(maze, side, a, x, y) {
    const b = MazeCellGetByXY(maze, x, y);
    const av = LoadInteger(ht, maze, htOffset + a);
    const bv = LoadInteger(ht, maze, htOffset + b);

    sideListSet(maze, b, cellGetWallCount(maze, b) === 4);

    if (side === wL && (BitwiseGetBit(av, wL) === 0n || BitwiseGetBit(bv, wR) === 0n)) return;
    if (side === wT && (BitwiseGetBit(av, wT) === 0n || BitwiseGetBit(bv, wB) === 0n)) return;
    if (side === wR && (BitwiseGetBit(av, wR) === 0n || BitwiseGetBit(bv, wL) === 0n)) return;
    if (side === wB && (BitwiseGetBit(av, wB) === 0n || BitwiseGetBit(bv, wT) === 0n)) return;

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

    if (x > 0n) cellNextRandomAdd(maze, wL, index, x - 1n, y);
    if (y > 0n) cellNextRandomAdd(maze, wT, index, x, y - 1n);
    if (x < MazeWidth(maze) - 1n) cellNextRandomAdd(maze, wR, index, x + 1n, y);
    if (y < MazeHeight(maze) - 1n) cellNextRandomAdd(maze, wB, index, x, y + 1n);

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

    return randomCellList[Number(random(7n, randomCellList[6]))];
}

/**
 * @param {BigInt} maze
 * @param {BigInt} ai
 * @param {BigInt} direction
 * @param {BigInt} bi
 * @param {boolean} bigOnly
 */
function cellMergeWall(maze, ai, direction, bi, bigOnly) {
    const av = LoadInteger(ht, maze, htOffset + ai);
    const ax = MazeCellX(maze, ai);
    const ay = MazeCellY(maze, ai);
    const w = MazeWidth(maze);
    const h = MazeHeight(maze);
    let bv;

    if (direction === wL || direction === wR) {
        if (bigOnly) {
            if (ay > 0n) {
                bv = LoadInteger(ht, maze, (ax + w * (ay - 1n)) + htOffset);
                if (BitwiseGetBit(av, wT) === 1n && BitwiseGetBit(bv, wB) === 1n) cellSetWall(maze, ai, wT, 0n);
            }
            if (ay < h - 1n) {
                bv = LoadInteger(ht, maze, (ax + w * (ay + 1n)) + htOffset);
                if (BitwiseGetBit(av, wB) === 1n && BitwiseGetBit(bv, wT) === 1n) cellSetWall(maze, ai, wB, 0n);
            }
        } else {
            cellSetWall(maze, ai, wT, 0n);
            cellSetWall(maze, ai, wB, 0n);
        }
        if (direction === wL) {
            cellSetWall(maze, ai, wL, 0n);
            cellSetWall(maze, bi, wR, 0n);
        }
        if (direction === wR) {
            cellSetWall(maze, ai, wR, 0n);
            cellSetWall(maze, bi, wL, 0n);
        }
    }

    if (direction === wT || direction === wB) {
        if (bigOnly) {
            if (ax > 0n) {
                bv = LoadInteger(ht, maze, (ax - 1n + w * ay) + htOffset);
                if (BitwiseGetBit(av, wL) === 1n && BitwiseGetBit(bv, wR) === 1n) cellSetWall(maze, ai, wL, 0n);
            }
            if (ax < w - 1n) {
                bv = LoadInteger(ht, maze, (ax + 1n + w * ay) + htOffset);
                if (BitwiseGetBit(av, wR) === 1n && BitwiseGetBit(bv, wL) === 1n) cellSetWall(maze, ai, wR, 0n);
            }
        } else {
            cellSetWall(maze, ai, wL, 0n);
            cellSetWall(maze, ai, wR, 0n);
        }
        if (direction === wT) {
            cellSetWall(maze, ai, wT, 0n);
            cellSetWall(maze, bi, wB, 0n);
        }
        if (direction === wB) {
            cellSetWall(maze, ai, wB, 0n);
            cellSetWall(maze, bi, wT, 0n);
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
    const b = MazeCellGetByXY(maze, x, y);
    const wc = cellGetWallCount(maze, b);

    if (wc === 4) return false;
    cellMergeWall(maze, a, direction, b, false);
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
    seedC = 12345;
    seedM = 0x10000;
    seedX = seed;

    const count = width * height;
    if (iterations <= 0) iterations = count + 1n;

    let breakWall, wallJumped;

    SaveInteger(ht, maze, widthKey, width);
    SaveInteger(ht, maze, heightKey, height);

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
                const index = MazeCellGetByXY(maze, x, x % 2n === 0n ? height - y - 1n : y);
                SaveInteger(ht, maze, htOffset + index, 15n);
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
        breakWall = true;
        if (a < 0) {
            ax = random(0n, width - 1n);
            ay = random(0n, height - 1n);
            a = MazeCellGetByXY(maze, ax, ay);
        } else {
            ax = MazeCellX(maze, a);
            ay = MazeCellY(maze, a);
        }
        domlist[a].classList.add('active');

        b = await cellNextRandom(maze, a);
        if (b < 0) {
            breakWall = false;

            domlist[a].classList.remove('active');
            let sideListCount = HandleListGetCount(sideList);
            if (sideListCount === 0) break;

            for (let i = 0; i < sideListCount; i++) {
                b = HandleListGetHandleByIndex(sideList, i);
                domlist[b].classList.add('random');
            }

            a = HandleListGetHandleByIndex(sideList, Number(random(0n, BigInt(sideListCount - 1))));
            ax = MazeCellX(maze, a);
            ay = MazeCellY(maze, a);

            domlist[a].classList.add('active');

            await delay(100);

            for (let i = 0; i < sideListCount; i++) {
                b = HandleListGetHandleByIndex(sideList, i);
                domlist[b].classList.remove('random');
            }

            wallJumped = false;
            if (!wallJumped && ax > 0n) wallJumped = jumpCellSetWall(maze, a, wL, ax - 1n, ay);
            if (!wallJumped && ay > 0n) wallJumped = jumpCellSetWall(maze, a, wT, ax, ay - 1n);
            if (!wallJumped && ax < MazeWidth(maze) - 1n) wallJumped = jumpCellSetWall(maze, a, wR, ax + 1n, ay);
            if (!wallJumped && ay < MazeHeight(maze) - 1n) wallJumped = jumpCellSetWall(maze, a, wB, ax, ay + 1n);
            iterations--;
        }

        if (breakWall) {
            bx = MazeCellX(maze, b);
            by = MazeCellY(maze, b);
            if (cellGetWallCount(maze, b) === 4) iterations--;

            if (ax > bx && ay === by) cellMergeWall(maze, a, wL, b, true);
            if (ax === bx && ay > by) cellMergeWall(maze, a, wT, b, true);
            if (ax < bx && ay === by) cellMergeWall(maze, a, wR, b, true);
            if (ax === bx && ay < by) cellMergeWall(maze, a, wB, b, true);

            domlist[a].classList.remove('active');
            a = b;
        }

        await sleep();
        domlist[a].classList.remove('active');
        if (iterations === 1n) break;
    }
}