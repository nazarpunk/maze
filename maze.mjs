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
import {RandomSeed} from "./RandomSeed.mjs";

const htOffset = 100n;
const ht = InitHashtable();
const cellCountKey = 0n;
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

/** @type {RandomSeed} */ let random;

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
 * @param {BigInt} index
 * @param {BigInt} l
 * @param {BigInt} t
 * @param {BigInt} r
 * @param {BigInt} b
 */
export const MazeCellSetWallLTRB = (maze, index, l, t, r, b) => {
    const x = MazeCellX(maze, index);
    const y = MazeCellY(maze, index);
    const c = LoadInteger(ht, maze, htOffset + index);

    if (l < 0) l = BitwiseAND(c, wallKeyL);
    if (t < 0) t = BitwiseAND(c, wallKeyT);
    if (r < 0) r = BitwiseAND(c, wallKeyR);
    if (b < 0) b = BitwiseAND(c, wallKeyB);

    if (l === 0n && x === 0n) l = 1n;
    if (t === 0n && y === 0n) t = 1n;
    if (r === 0n && x === MazeGetWidth(maze) - 1n) r = 1n;
    if (b === 0n && y === MazeGetHeight(maze) - 1n) b = 1n;

    let out = 0n;
    if (l > 0n) out += wallKeyL;
    if (t > 0n) out += wallKeyT;
    if (r > 0n) out += wallKeyR;
    if (b > 0n) out += wallKeyB;

    SaveInteger(ht, maze, htOffset + index, out);

    cellRedraw(maze, index);
};

/**
 * @param {BigInt} maze
 * @param {BigInt} index
 * @return {number}
 */
export const MazeCellWallCount = (maze, index) => {
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
 * @param {boolean} contain
 */
const sideListSet = (maze, index, contain) => {
    if (contain) {
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
const randomCellAdd = (maze, side, a, x, y) => {
    const b = MazeGetCellByXY(maze, x, y);
    const av = LoadInteger(ht, maze, htOffset + a);
    const bv = LoadInteger(ht, maze, htOffset + b);

    sideListSet(maze, b, MazeCellWallCount(maze, b) === 4);

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
    const x = MazeCellX(maze, index);
    const y = MazeCellY(maze, index);
    randomCellList = [0n];

    sideListSet(maze, index, false);

    // 0 : cell count
    // 1-4 : cells
    // 5 : max wall counter
    // 6 : filter cell count
    // 7-10 : filter cells

    if (x > 0n) /*                   */ randomCellAdd(maze, wallKeyL, index, x - 1n, y);
    if (x < MazeGetWidth(maze) - 1n) /* */ randomCellAdd(maze, wallKeyR, index, x + 1n, y);
    if (y > 0n) /*                   */ randomCellAdd(maze, wallKeyT, index, x, y - 1n);
    if (y < MazeGetHeight(maze) - 1n) /**/ randomCellAdd(maze, wallKeyB, index, x, y + 1n);

    if (randomCellList[0] < 1n) return -1n;

    // max wall count
    randomCellList[5] = 0n;
    for (let i = 1n; i <= randomCellList[0]; i++) {
        wc = MazeCellWallCount(maze, randomCellList[i]);
        if (wc > randomCellList[5]) randomCellList[5] = wc;
    }

    // filter
    randomCellList[6] = 6n;
    for (let i = 1n; i <= randomCellList[0]; i++) {
        wc = MazeCellWallCount(maze, randomCellList[i]);
        if (wc >= randomCellList[5]) {
            randomCellList[6] += 1n;
            randomCellList[randomCellList[6]] = randomCellList[i];
        }
    }

    for (let i = 7n; i <= randomCellList[6]; i++) domlist[randomCellList[i]].classList.add('random');
    //await delay(700);
    //await delay(500);
    await sleep();
    for (let i = 7n; i <= randomCellList[6]; i++) domlist[randomCellList[i]].classList.remove('random');

    return randomCellList[Number(random.uniformInt(7n, randomCellList[6]))];
}

/**
 * @param {BigInt} maze
 * @param {BigInt} a
 * @param {BigInt} direction
 * @param {BigInt} b
 */
const cellMergeWall = (maze, a, direction, b) => {
    if (direction === wallKeyL) {
        MazeCellSetWallLTRB(maze, a, 0n, 0n, -1n, 0n);
        MazeCellSetWallLTRB(maze, b, -1n, -1n, 0n, -1n);
    }
    if (direction === wallKeyT) {
        MazeCellSetWallLTRB(maze, a, 0n, 0n, 0n, -1n);
        MazeCellSetWallLTRB(maze, b, -1n, -1n, -1n, 0n);
    }
    if (direction === wallKeyR) {
        MazeCellSetWallLTRB(maze, a, -1n, 0n, 0n, 0n);
        MazeCellSetWallLTRB(maze, b, 0n, -1n, -1n, -1n);
    }
    if (direction === wallKeyB) {
        MazeCellSetWallLTRB(maze, a, 0n, -1n, 0n, 0n);
        MazeCellSetWallLTRB(maze, b, -1n, 0n, -1n, -1n);
    }
}

/**
 * @param {BigInt} maze
 * @param {BigInt} a
 * @param {BigInt} direction
 * @param {BigInt} x
 * @param {BigInt} y
 */
const jumpCellSetWall = (maze, a, direction, x, y) => {
    const b = MazeGetCellByXY(maze, x, y);
    const wc = MazeCellWallCount(maze, b);

    if (wc === 4) return false;
    cellMergeWall(maze, a, direction, b);
    return true;
}

/**
 * @param {BigInt} maze
 * @param {BigInt} width
 * @param {BigInt} height
 * @param {BigInt} seed
 * @param {BigInt} iterations
 * @return {Promise<void>}
 */
export const MazeGenerate = async (maze, width, height, seed, iterations) => {
    random = new RandomSeed(Number(seed));

    if (iterations <= 0) iterations = width * height;

    const cellCount = width * height;
    let breakWall, wallJumped;

    SaveInteger(ht, maze, cellCountKey, BigInt(cellCount));
    SaveInteger(ht, maze, widthKey, width);
    SaveInteger(ht, maze, heightKey, height);

    const count = MazeGetCellCount(maze);

    HandleListClear(sideList);

    wrap.textContent = '';
    domlist.length = 0;

    const px = '40px';
    wrap.style.gridTemplateColumns = `repeat(${MazeGetWidth(maze)}, ${px})`;
    wrap.style.gridTemplateRows = `repeat(${MazeGetHeight(maze)}, ${px})`;

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
                MazeCellSetWallLTRB(maze, MazeGetCellByXY(maze, x, x % 2n === 0n ? height - y - 1n : y), 1n, 1n, 1n, 1n);
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
            ax = random.uniformInt(0n, width - 1n);
            ay = random.uniformInt(0n, height - 1n);
            a = MazeGetCellByXY(maze, ax, ay);
        } else {
            ax = MazeCellX(maze, a);
            ay = MazeCellY(maze, a);
        }
        domlist[a].classList.add('active');

        b = await randomCell(maze, a);
        if (b < 0) {
            breakWall = false;

            domlist[a].classList.remove('active');
            let sideListCount = HandleListGetCount(sideList);
            if (sideListCount === 0) break;

            for (let i = 0; i < sideListCount; i++) {
                b = HandleListGetHandleByIndex(sideList, i);
                domlist[b].classList.add('random');
            }
            await delay(200);

            a = HandleListGetHandleByIndex(sideList, Number(random.uniformInt(0n, BigInt(sideListCount - 1))));
            ax = MazeCellX(maze, a);
            ay = MazeCellY(maze, a);

            domlist[a].classList.add('active');

            await delay(200);

            for (let i = 0; i < sideListCount; i++) {
                b = HandleListGetHandleByIndex(sideList, i);
                domlist[b].classList.remove('random');
            }

            wallJumped = false;
            if (!wallJumped && ax > 0n) wallJumped = jumpCellSetWall(maze, a, wallKeyL, ax - 1n, ay);
            if (!wallJumped && ay > 0n) wallJumped = jumpCellSetWall(maze, a, wallKeyT, ax, ay - 1n);
            if (!wallJumped && ax < MazeGetWidth(maze) - 1n) wallJumped = jumpCellSetWall(maze, a, wallKeyR, ax + 1n, ay);
            if (!wallJumped && ay < MazeGetHeight(maze) - 1n) wallJumped = jumpCellSetWall(maze, a, wallKeyB, ax, ay + 1n);
            iterations--;
        }

        if (breakWall) {
            bx = MazeCellX(maze, b);
            by = MazeCellY(maze, b);
            if (MazeCellWallCount(maze, b) === 4) iterations--;

            if (ax > bx && ay === by) cellMergeWall(maze, a, wallKeyL, b);
            if (ax === bx && ay > by) cellMergeWall(maze, a, wallKeyT, b);
            if (ax < bx && ay === by) cellMergeWall(maze, a, wallKeyR, b);
            if (ax === bx && ay < by) cellMergeWall(maze, a, wallKeyB, b);

            domlist[a].classList.remove('active');
            a = b;
        }

        await sleep();
        domlist[a].classList.remove('active');
        if (iterations === 1n) break;
    }
}


/**
 * @param {BigInt} maze
 * @param {BigInt} x
 * @param {BigInt} y
 * @return {BigInt}
 */
export const MazeGetCellByXY = (maze, x, y) => {
    return x + MazeGetWidth(maze) * y;
}

/**
 * @param {BigInt} maze
 * @param {BigInt} index
 * @return {BigInt}
 */
export const MazeCellX = (maze, index) => {
    return index % MazeGetWidth(maze);
}

/**
 * @param {BigInt} maze
 * @param {BigInt} index
 * @return {BigInt}
 */
export const MazeCellY = (maze, index) => {
    return BigInt(Math.trunc(Number(index / MazeGetWidth(maze))));
}

/**
 * @param {BigInt} maze
 * @return {BigInt}
 */
export const MazeGetCellCount = (maze) => {
    return LoadInteger(ht, maze, cellCountKey);
}

/**
 * @param {BigInt} maze
 * @return {BigInt}
 */
export const MazeGetWidth = (maze) => {
    return LoadInteger(ht, maze, widthKey);
}

/**
 * @param {BigInt} maze
 * @return {BigInt}
 */
export const MazeGetHeight = (maze) => {
    return LoadInteger(ht, maze, heightKey);
}