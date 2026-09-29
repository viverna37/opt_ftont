import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocation, useOutlet } from "react-router-dom";

// Drives every screen-to-screen transition inside a layout (ClientLayout,
// AdminLayout) without touching individual screens: siblings at the same
// route depth (tab switches) crossfade in place, a deeper route (push, e.g.
// list -> detail) slides in from the right with the old screen sliding left,
// and a shallower one (back) does the reverse — the same "which way did we
// move in the stack" cue native apps give for free.
function depth(pathname: string): number {
    return pathname.split("/").filter(Boolean).length;
}

const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * 24 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -24 }),
};

export function AnimatedOutlet() {
    const location = useLocation();
    const outlet = useOutlet();
    const reducedMotion = useReducedMotion();

    // React's documented pattern for "derive state from a prop change during
    // render" (https://react.dev/learn/you-might-not-need-an-effect) — a ref
    // would need mutating mid-render, which isn't safe under concurrent
    // rendering; this setState-during-render form is.
    const [prevPathname, setPrevPathname] = useState(location.pathname);
    const [direction, setDirection] = useState(0);

    if (location.pathname !== prevPathname) {
        const nextDepth = depth(location.pathname);
        const lastDepth = depth(prevPathname);
        setDirection(nextDepth === lastDepth ? 0 : nextDepth > lastDepth ? 1 : -1);
        setPrevPathname(location.pathname);
    }

    if (reducedMotion) {
        return outlet;
    }

    return (
        <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
                key={location.pathname}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                style={{ width: "100%" }}
            >
                {outlet}
            </motion.div>
        </AnimatePresence>
    );
}
