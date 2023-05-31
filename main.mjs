// noinspection JSCheckFunctionSignatures

import {MazeGenerate} from "./maze.mjs";

const form = document.querySelector('form');
const fieldset = form.querySelector('fieldset');

const getV = (name) => {
    let v = parseInt(form.elements[name].value);
    return (isNaN(v) || v < 0) ? 0 : v;
}

const setV = (name, value) => {
    const input = form.elements[name];
    if (!input) return;
    input.value = value;
}

for (let p of new URLSearchParams(location.hash.slice(1))) {
    setV(p[0], p[1]);
}

form.addEventListener('submit', async e => {
    e.preventDefault();
    if (document.activeElement.dataset.seed) {
        console.log('111');
        setV('seed', Date.now());
    }

    let w = Math.max(1, getV('width'));
    let h = Math.max(1, getV('height'));
    let s = getV('seed');
    let c = getV('iterations');
    const mc = w * h;
    if (c > 0 && c > mc) c = mc;

    setV('width', w);
    setV('height', h);
    setV('seed', s);
    setV('iterations', c);

    location.hash = new URLSearchParams(new FormData(form)).toString();

    fieldset.disabled = true;
    await MazeGenerate(11n, BigInt(w), BigInt(h), BigInt(s), BigInt(c));
    fieldset.disabled = false;
})