/** @type {HTMLInputElement} */
const skip = document.querySelector('.skip input');
const skipKey = 'skip-animation';

skip.checked = localStorage.getItem(skipKey) != null;
skip.addEventListener('change', () => {
    if (skip.checked) localStorage.setItem(skipKey, '1');
    else localStorage.removeItem(skipKey);
});

export const delay = (time) => {
    if (skip.checked) return;

    return new Promise(resolve => {
        let start = null;
        const loop = timestamp => {
            if (!start) start = timestamp;

            const elapsed = timestamp - start;

            if (elapsed >= time) resolve();
            else requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
    });
};

export const sleep = () => {
    if (skip.checked) return;
    return new Promise(requestAnimationFrame);
};