import {GetRandomInt} from "../jass.mjs";
import {MazeCellIndex, MazeCellIndexUnvisited, MazeCellIndexX, MazeCellIndexY, MazeHeight, MazeWidth} from "./maze.mjs";
import {sleep} from "../utils.mjs";
import {domlist} from "../main.mjs";

const l = [];
let li;

const add = (name, x, y) => {
    const i = MazeCellIndex(name, x, y);
    if (!MazeCellIndexUnvisited(name, i)) return;

    li += 1;
    l[li] = i;
}

export const MazeCellIndexRandomNeighbor = async (name, index) => {
    const x = MazeCellIndexX(name, index);
    const y = MazeCellIndexY(name, index);
    li = -1;

    if (x > 0) add(name, x - 1, y);
    if (x < MazeWidth(name) - 1) add(name, x + 1, y);
    if (y > 0) add(name, x, y - 1);
    if (y < MazeHeight(name) - 1) add(name, x, y + 1);


    for (let i = 0; i <= li; i++) {
        domlist[l[i]].classList.add('random');
        await sleep();
    }
    await sleep();

    for (let i = 0; i <= li; i++) {
        domlist[l[i]].classList.remove('random');
    }

    if (li < 0) return -1;
    return l[GetRandomInt(0, li)];
}
