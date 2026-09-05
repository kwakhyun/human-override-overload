import { useEffect } from "react";

const FOCUSABLE_SELECTOR = [
  "[data-dialog-initial-focus]",
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const dialogStack = [];
const inertOwners = new WeakMap();

function isolateDialog(dialog) {
  const siblings = [];
  let branch = dialog;
  while (branch.parentElement && branch !== document.body) {
    for (const sibling of branch.parentElement.children) {
      if (sibling === branch || /^(SCRIPT|STYLE|LINK)$/.test(sibling.tagName)) continue;
      // React-owned inert surfaces restore themselves when their modal closes.
      if (sibling.inert && !inertOwners.has(sibling)) continue;
      const owner = inertOwners.get(sibling) || { count: 0, original: sibling.inert };
      owner.count += 1;
      inertOwners.set(sibling, owner);
      sibling.inert = true;
      siblings.push(sibling);
    }
    branch = branch.parentElement;
  }
  return () => {
    for (const sibling of siblings) {
      const owner = inertOwners.get(sibling);
      if (--owner.count === 0) {
        sibling.inert = owner.original;
        inertOwners.delete(sibling);
      }
    }
  };
}

function getFocusableElements(dialog) {
  if (!dialog) return [];
  return Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR)).filter((element) => (
    !element.hasAttribute("disabled")
    && element.getAttribute("aria-hidden") !== "true"
    && element.getClientRects().length > 0
  ));
}

export function useDialogFocusTrap(dialogRef, active = true) {
  useEffect(() => {
    if (!active) return undefined;
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const previouslyFocused = document.activeElement;
    const restoreBackground = isolateDialog(dialog);
    dialogStack.push(dialog);
    const focusFrame = window.requestAnimationFrame(() => {
      const preferred = dialog.querySelector("[data-dialog-initial-focus]");
      const target = preferred || getFocusableElements(dialog)[0] || dialog;
      target.focus?.({ preventScroll: true });
    });
    const trapFocus = (event) => {
      if (event.key !== "Tab" || dialogStack.at(-1) !== dialog) return;
      const focusable = getFocusableElements(dialog);
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trapFocus, true);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", trapFocus, true);
      const index = dialogStack.lastIndexOf(dialog);
      if (index >= 0) dialogStack.splice(index, 1);
      restoreBackground();
      if (previouslyFocused?.isConnected) previouslyFocused.focus?.({ preventScroll: true });
    };
  }, [active, dialogRef]);
}
