// Visual drag enhancement for the existing Match-3 controller.
// The original game logic remains responsible for the real swap and matches.
const install = () => {
  const board = document.querySelector<HTMLElement>("#board");
  if (!board) return false;

  const original = {
    down: board.onpointerdown,
    up: board.onpointerup,
    cancel: board.onpointercancel,
    lost: board.onlostpointercapture,
  };

  let drag: {
    x: number; y: number; i: number; target: number;
    axis: "x" | "y"; dir: number; step: number;
    selected: HTMLElement; neighbor: HTMLElement | null; pending: boolean;
  } | null = null;

  const cleanup = () => {
    board.classList.remove("tracking");
    board.querySelectorAll<HTMLElement>(".dragging,.drag-target,.touching").forEach((el) => {
      el.classList.remove("dragging", "drag-target", "touching");
      el.style.transform = "";
      el.style.transition = "";
    });
  };

  board.onpointerdown = (e: PointerEvent) => {
    original.down?.(e);
    const tile = (e.target as HTMLElement).closest<HTMLElement>(".tile");
    if (!tile) return;
    drag = {
      x: e.clientX,
      y: e.clientY,
      i: Number(tile.dataset.i),
      target: -1,
      axis: "x",
      dir: 0,
      step: board.clientWidth / 8,
      selected: tile,
      neighbor: null,
      pending: false,
    };
    tile.classList.add("touching");
  };

  board.onpointermove = (e: PointerEvent) => {
    if (!drag || drag.pending) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (Math.hypot(dx, dy) < 5) return;

    if (drag.dir === 0) {
      drag.axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      drag.dir = (drag.axis === "x" ? dx : dy) >= 0 ? 1 : -1;
      drag.target = drag.i + (drag.axis === "x" ? drag.dir : drag.dir * 8);
      const invalid = drag.target < 0 || drag.target >= 64 ||
        (drag.axis === "x" && ((drag.dir > 0 && drag.i % 8 === 7) || (drag.dir < 0 && drag.i % 8 === 0)));
      if (invalid) { drag.dir = 0; return; }
      drag.neighbor = board.querySelector<HTMLElement>(`.tile[data-i="${drag.target}"]`);
      drag.selected.classList.add("dragging");
      drag.neighbor?.classList.add("drag-target");
      board.classList.add("tracking");
    }

    if (drag.dir === 0) return;
    const delta = Math.max(-drag.step, Math.min(drag.step, drag.axis === "x" ? dx : dy));
    const d = drag.dir;
    drag.selected.style.transition = "none";
    drag.selected.style.transform = drag.axis === "x"
      ? `translate3d(${delta}px,0,0) scale(.96)`
      : `translate3d(0,${delta}px,0) scale(.96)`;
    if (drag.neighbor) {
      const other = delta - d * drag.step;
      drag.neighbor.style.transition = "none";
      drag.neighbor.style.transform = drag.axis === "x"
        ? `translate3d(${other}px,0,0) scale(.98)`
        : `translate3d(0,${other}px,0) scale(.98)`;
    }
  };

  board.onpointerup = (e: PointerEvent) => {
    if (!drag) return;
    const d = drag;
    const delta = d.axis === "x" ? e.clientX - d.x : e.clientY - d.y;
    const commit = d.dir !== 0 && Math.abs(delta) >= Math.max(20, d.step * 0.30);

    if (!commit) {
      cleanup();
      drag = null;
      original.up?.(e);
      return;
    }

    d.pending = true;
    const full = d.dir * d.step;
    d.selected.style.transition = "transform .18s cubic-bezier(.2,.9,.2,1)";
    d.selected.style.transform = d.axis === "x"
      ? `translate3d(${full}px,0,0) scale(.98)`
      : `translate3d(0,${full}px,0) scale(.98)`;
    if (d.neighbor) {
      d.neighbor.style.transition = "transform .18s cubic-bezier(.2,.9,.2,1)";
      d.neighbor.style.transform = d.axis === "x"
        ? `translate3d(${-full}px,0,0) scale(.98)`
        : `translate3d(0,${-full}px,0) scale(.98)`;
    }

    setTimeout(() => {
      if (drag !== d) return;
      original.up?.(e);
      cleanup();
      drag = null;
    }, 190);
  };

  board.onpointercancel = (e: PointerEvent) => {
    if (drag) { cleanup(); drag = null; }
    original.cancel?.(e);
  };

  board.onlostpointercapture = (e: Event) => {
    if (drag?.pending) return;
    if (drag) { cleanup(); drag = null; }
    original.lost?.(e);
  };

  return true;
};

let tries = 0;
const timer = setInterval(() => {
  if (install() || ++tries > 100) clearInterval(timer);
}, 50);
install();
