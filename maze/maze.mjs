// noinspection ES6MissingAwait

import {GetRandomInt, InitHashtable, LoadInteger, SaveInteger} from "../jass.mjs";
import {delay, sleep} from "../utils.mjs";
import {MazeCellIndexRandomNeighbor} from "./random.mjs";
import {domlist} from "../main.mjs";

const offset = 100;

const ht = InitHashtable();
const cellCountKey = 0;
const widthKey = 1;
const heightKey = 2;

export const MazeGenerate = async (name, width, height) => {
    const cellCount = width * height;
    SaveInteger(ht, name, cellCountKey, cellCount);
    SaveInteger(ht, name, widthKey, width);
    SaveInteger(ht, name, heightKey, height);

    const count = MazeCellCount(name);

    const maze = document.createElement('div');
    maze.classList.add('maze');
    document.body.appendChild(maze);

    maze.style.gridTemplateColumns = `repeat(${MazeWidth(name)}, 1fr)`;

    for (let i = 0; i < count; i++) {
        const cell = document.createElement('div');
        domlist.push(cell);
        cell.classList.add('cell');
        cell.innerHTML = `<div>${i}</div><div><b>${MazeCellIndexX(name, i)}</b>:<b>${MazeCellIndexY(name, i)}</b></div>`;
        maze.appendChild(cell);
    }

    // add wall
    await delay(200);
    let p = [];
    for (let x = 0; x < width; x++) {
        p.push((async () => {
            for (let y = 0; y < height; y++) {
                const i = MazeCellIndex(name, x, x % 2 === 0 ? height - y - 1 : y);
                domlist[i].classList.add('wt', 'wr', 'wb', 'wl');
                await sleep();
            }
        })());
    }

    await Promise.all(p);

    await delay(200);

    // unvisited
    p = [];
    for (let y = 0; y < height; y++) {
        p.push((async () => {
            for (let x = 0; x < width; x++) {
                const i = MazeCellIndex(name, y % 2 === 0 ? width - x - 1 : x, y);
                domlist[i].classList.add('unvisited');
                await sleep()
            }
        })());
    }

    await Promise.all(p);
    await delay(200);

    const x = GetRandomInt(0, width - 1);
    const y = GetRandomInt(0, height - 1);
    let i = MazeCellIndex(name, x, y);
    domlist[i].classList.remove('unvisited', 'wt', 'wr', 'wb', 'wl');
    domlist[i].classList.add('active');
    await delay(200);

    while (true) {
        domlist[i].classList.remove('active');
        i = await MazeCellIndexRandomNeighbor(name, i);
        if (i < 0) {
            console.log('end');
            break;
        }
        domlist[i].classList.add('active');
        domlist[i].classList.remove('unvisited', 'wt', 'wr', 'wb', 'wl');
        await sleep();
    }
}

/**
 * @param {number} name
 * @param {number} index
 * @return {boolean}
 */
export const MazeCellIndexUnvisited = (name, index) => {
    return domlist[index].classList.contains('unvisited');
}

/**
 * @param {number} name
 * @param {number} x
 * @param {number} y
 * @return {number}
 */
export const MazeCellIndex = (name, x, y) => {
    return x + MazeWidth(name) * y;
}

/**
 * @param {number} name
 * @param {number} index
 * @return {number}
 */
export const MazeCellIndexX = (name, index) => {
    return index % MazeWidth(name);
}

/**
 * @param {number} name
 * @param {number} index
 * @return {number}
 */
export const MazeCellIndexY = (name, index) => {
    return Math.trunc(index / MazeWidth(name));
}

/**
 * @param {number} name
 * @return {number}
 */
export const MazeCellCount = (name) => {
    return LoadInteger(ht, name, cellCountKey);
}

/**
 * @param {number} name
 * @return {number}
 */
export const MazeWidth = (name) => {
    return LoadInteger(ht, name, widthKey);
}

/**
 * @param {number} name
 * @return {number}
 */
export const MazeHeight = (name) => {
    return LoadInteger(ht, name, heightKey);
}