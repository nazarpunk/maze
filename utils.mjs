export const delay = time =>
    new Promise(resolve => {
        let start = null;
        const loop = timestamp => {
            if (!start) start = timestamp;

            const elapsed = timestamp - start;

            if (elapsed >= time) resolve();
            else requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
    });

export const sleep = () => new Promise(requestAnimationFrame);