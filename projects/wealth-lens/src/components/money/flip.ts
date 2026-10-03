/**
 * FLIP (First, Last, Invert, Play): a change of layout that glides instead
 * of jumping. Each element's box is measured before the change (First) and
 * after it (Last); it is then drawn at its old place and size (Invert) and
 * moved to its new one (Play), with transforms only, so nothing else on the
 * page moves and no layout shift is counted. An element that changes size
 * shrinks or grows as a box while its content keeps its final size, so text
 * is never stretched (the content is scaled back at every frame).
 *
 * The boxes are measured before the change (`measure`) and the move is
 * played once React has drawn it, before the browser paints (`play`, from
 * a layout effect), whenever React commits it. Nothing moves for those who
 * ask for less motion, or where the browser cannot animate.
 */

export interface FlipTarget {
  element: Element | null;
  /** Its content, kept at its final size while the box changes size; without it, the element only moves. */
  content?: Element | null;
  /** An ancestor that scrolls (and so clips), left unclipped while the element glides in from outside it. */
  unclip?: Element | null;
}

/** The whole move, in the 300–400 ms the result arrives in. */
export const FLIP_MS = 350;
/** Frames worked out ahead: enough for the content's counter-scale to track the box. */
const FRAMES = 20;

/** Ease-out: fast at first, settling at the end (a cubic, close to cubic-bezier(0.33, 1, 0.68, 1)). */
const easeOut = (t: number) => 1 - (1 - t) ** 3;

const wantsLessMotion = () => typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Where the targets were: taken before the change (First). */
export interface FlipSnapshot {
  targets: (FlipTarget & { element: Element })[];
  first: DOMRect[];
}

export function measure(targets: readonly FlipTarget[]): FlipSnapshot {
  const present = targets.filter((target): target is FlipTarget & { element: Element } => target.element !== null);
  return { targets: present, first: present.map((target) => target.element.getBoundingClientRect()) };
}

/**
 * After the change, before the browser paints it (a layout effect): each
 * target is drawn where it was and glides to where it is (Last, Invert,
 * Play).
 */
export function play({ targets, first }: FlipSnapshot): void {
  if (wantsLessMotion()) return;
  targets.forEach((target, index) => {
    const { element, content } = target;
    if (!element.isConnected || typeof (element as HTMLElement).animate !== "function") return;
    const from = first[index];
    const to = element.getBoundingClientRect();
    // Hidden before or after (the steps go into the sheet on a phone): nothing to glide.
    if (from.width === 0 || to.width === 0 || from.height === 0 || to.height === 0) return;
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    const sx = content ? from.width / to.width : 1;
    const sy = content ? from.height / to.height : 1;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(sx - 1) < 0.005 && Math.abs(sy - 1) < 0.005) return;
    const box: Keyframe[] = [];
    const inner: Keyframe[] = [];
    for (let frame = 0; frame <= FRAMES; frame++) {
      const p = easeOut(frame / FRAMES);
      const scaleX = sx + (1 - sx) * p;
      const scaleY = sy + (1 - sy) * p;
      box.push({ transformOrigin: "0 0", transform: `translate(${dx * (1 - p)}px, ${dy * (1 - p)}px) scale(${scaleX}, ${scaleY})` });
      inner.push({ transformOrigin: "0 0", transform: `scale(${1 / scaleX}, ${1 / scaleY})` });
    }
    const options: KeyframeAnimationOptions = { duration: FLIP_MS, easing: "linear" };
    const htmlElement = element as HTMLElement;
    const ancestor = target.unclip as HTMLElement | null | undefined;
    if (ancestor) {
      const overflow = ancestor.style.overflow;
      ancestor.style.overflow = "visible";
      setTimeout(() => (ancestor.style.overflow = overflow), FLIP_MS + 50);
    }
    if (content && content.isConnected) {
      // While the box is smaller than its content, the content does not spill out of it.
      const overflow = htmlElement.style.overflow;
      htmlElement.style.overflow = "clip";
      const animation = htmlElement.animate(box, options);
      (content as HTMLElement).animate(inner, options);
      const restore = () => (htmlElement.style.overflow = overflow);
      animation.finished.then(restore, restore);
    } else {
      htmlElement.animate(box, options);
    }
  });
}
