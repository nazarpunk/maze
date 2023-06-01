// noinspection ES6MissingAwait

import {delay, sleep} from "./utils.mjs";
import {InitHashtable, LoadInteger, SaveInteger} from "./jass/hashtable.mjs";
import {BitwiseAND, BitwiseShiftLeft} from "./jass/math.mjs";
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

const wallKeyL = BitwiseShiftLeft(1n, 0n);
const wallKeyT = BitwiseShiftLeft(1n, 1n);
const wallKeyR = BitwiseShiftLeft(1n, 2n);
const wallKeyB = BitwiseShiftLeft(1n, 3n);

const wrap = document.querySelector('.maze');
/** @type {HTMLDivElement[]} */ const domlist = [];

let seedC, seedM, seedX;

/**
 * @param {BigInt} maze
 * @param {BigInt} index
 */
const cellRedraw = (maze, index) => {
    const c = domlist[index].classList;
    const b = LoadInteger(ht, maze, htOffset + index);

    c.toggle('wl', BitwiseAND(b, wallKeyL) > 0n);
    c.toggle('wt', BitwiseAND(b, wallKeyT) > 0n);
    c.toggle('wr', BitwiseAND(b, wallKeyR) > 0n);
    c.toggle('wb', BitwiseAND(b, wallKeyB) > 0n);

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
 * @param {BigInt} index
 * @return {BigInt}
 */
function MazeCellY(maze, index) {
    return BigInt(Math.trunc(Number(index / MazeWidth(maze))));
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
function MazeCellX(maze, index) {
    return index % MazeWidth(maze);
}

/**
 * @param {BigInt} maze
 * @param {BigInt} index
 * @param {BigInt} l
 * @param {BigInt} t
 * @param {BigInt} r
 * @param {BigInt} b
 */
function cellSetWallLTRB(maze, index, l, t, r, b) {
    const x = MazeCellX(maze, index);
    const y = MazeCellY(maze, index);
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

    cellRedraw(maze, index);
}

/**
 * @param {BigInt} maze
 * @param {BigInt} index
 * @return {number}
 */
function cellGetWallCount(maze, index) {
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

    if (x > 0n) cellNextRandomAdd(maze, wallKeyL, index, x - 1n, y);
    if (y > 0n) cellNextRandomAdd(maze, wallKeyT, index, x, y - 1n);
    if (x < MazeWidth(maze) - 1n) cellNextRandomAdd(maze, wallKeyR, index, x + 1n, y);
    if (y < MazeHeight(maze) - 1n) cellNextRandomAdd(maze, wallKeyB, index, x, y + 1n);

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
 * @param {BigInt} a
 * @param {BigInt} direction
 * @param {BigInt} w
 * @param {BigInt} h
 * @param {BigInt} x
 * @param {BigInt} y
 * @return {BigInt}
 */
function cellMergeWallBig(maze, a, direction, w, h, x, y) {
    let b;

    if (direction === wallKeyL) {
        if (x === 0n) return -1n;
        b = LoadInteger(ht, maze, (x - 1n + w * y) + htOffset);
        if (BitwiseAND(a, wallKeyL) > 0n && BitwiseAND(b, wallKeyR) > 0n) return 0n;
        return -1n;
    }
    if (direction === wallKeyT) {
        if (y === 0n) return -1n;
        b = LoadInteger(ht, maze, (x + w * (y - 1n)) + htOffset);
        if (BitwiseAND(a, wallKeyT) > 0n && BitwiseAND(b, wallKeyB) > 0n) return 0n;
        return -1n;
    }
    if (direction === wallKeyR) {
        if (x === w - 1n) return -1n;
        b = LoadInteger(ht, maze, (x + 1n + w * y) + htOffset);
        if (BitwiseAND(a, wallKeyR) > 0n && BitwiseAND(b, wallKeyL) > 0n) return 0n;
        return -1n;
    }
    if (direction === wallKeyB) {
        if (y === h - 1n) return -1n;
        b = LoadInteger(ht, maze, (x + w * (y + 1n)) + htOffset);
        if (BitwiseAND(a, wallKeyB) > 0n && BitwiseAND(b, wallKeyT) > 0n) return 0n;
        return -1n;
    }
}

/**
 * @param {BigInt} maze
 * @param {BigInt} a
 * @param {BigInt} direction
 * @param {BigInt} b
 * @param {boolean} bigOnly
 */
function cellMergeWall(maze, a, direction, b, bigOnly) {
    const ca = LoadInteger(ht, maze, htOffset + a);
    const ax = MazeCellX(maze, a);
    const ay = MazeCellY(maze, a);
    const w = MazeWidth(maze);
    const h = MazeHeight(maze);

    let al = -1n, at = -1n, ar = -1n, ab = -1n;
    let bl = -1n, bt = -1n, br = -1n, bb = -1n;

    if (direction === wallKeyL || direction === wallKeyR) {
        if (bigOnly) {
            at = cellMergeWallBig(maze, ca, wallKeyT, w, h, ax, ay);
            ab = cellMergeWallBig(maze, ca, wallKeyB, w, h, ax, ay);
        } else {
            at = 0n;
            ab = 0n;
        }
        if (direction === wallKeyL) {
            al = 0n;
            br = 0n;
        }
        if (direction === wallKeyR) {
            ar = 0n;
            bl = 0n;
        }
    }

    if (direction === wallKeyT || direction === wallKeyB) {
        if (bigOnly) {
            al = cellMergeWallBig(maze, ca, wallKeyL, w, h, ax, ay);
            ar = cellMergeWallBig(maze, ca, wallKeyR, w, h, ax, ay);
        } else {
            al = 0n;
            ar = 0n;
        }
        if (direction === wallKeyT) {
            at = 0n;
            bb = 0n;
        }
        if (direction === wallKeyB) {
            ab = 0n;
            bt = 0n;
        }
    }

    cellSetWallLTRB(maze, a, al, at, ar, ab);
    cellSetWallLTRB(maze, b, bl, bt, br, bb);
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
    if (iterations <= 0) iterations = count;

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
                cellSetWallLTRB(maze, MazeCellGetByXY(maze, x, x % 2n === 0n ? height - y - 1n : y), 1n, 1n, 1n, 1n);
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
            if (!wallJumped && ax > 0n) wallJumped = jumpCellSetWall(maze, a, wallKeyL, ax - 1n, ay);
            if (!wallJumped && ay > 0n) wallJumped = jumpCellSetWall(maze, a, wallKeyT, ax, ay - 1n);
            if (!wallJumped && ax < MazeWidth(maze) - 1n) wallJumped = jumpCellSetWall(maze, a, wallKeyR, ax + 1n, ay);
            if (!wallJumped && ay < MazeHeight(maze) - 1n) wallJumped = jumpCellSetWall(maze, a, wallKeyB, ax, ay + 1n);
            iterations--;
        }

        if (breakWall) {
            bx = MazeCellX(maze, b);
            by = MazeCellY(maze, b);
            if (cellGetWallCount(maze, b) === 4) iterations--;

            const bb = true;

            if (ax > bx && ay === by) cellMergeWall(maze, a, wallKeyL, b, bb);
            if (ax === bx && ay > by) cellMergeWall(maze, a, wallKeyT, b, bb);
            if (ax < bx && ay === by) cellMergeWall(maze, a, wallKeyR, b, bb);
            if (ax === bx && ay < by) cellMergeWall(maze, a, wallKeyB, b, bb);

            domlist[a].classList.remove('active');
            a = b;
        }

        await sleep();
        domlist[a].classList.remove('active');
        if (iterations === 1n) break;
    }
}