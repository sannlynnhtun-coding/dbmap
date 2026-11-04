const dialogs = [];
const cleanups = new WeakMap();
const controls =
  'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';
const visibleControls = (el) =>
  [...el.querySelectorAll(controls)].filter(
    (control) => control.getClientRects().length && control.tabIndex >= 0,
  );

export default {
  mounted(el) {
    const previousFocus = document.activeElement;
    el.tabIndex = -1;
    dialogs.push(el);
    const onKeydown = (event) => {
      if (dialogs.at(-1) !== el || event.isComposing) return;
      if (event.key === "Escape") {
        const close = [...el.querySelectorAll("button")].find(
          (button) =>
            button.closest('[role="dialog"]') === el &&
            (button.getAttribute("aria-label") === "Close dialog" ||
              button.title.startsWith("Close") ||
              button.textContent.trim() === "Cancel"),
        );
        if (close && !close.disabled) {
          event.preventDefault();
          event.stopImmediatePropagation();
          close.click();
        }
      } else if (event.key === "Tab") {
        const items = visibleControls(el);
        const first = items[0] || el;
        const last = items.at(-1) || el;
        if (
          !el.contains(document.activeElement) ||
          !items.length ||
          (event.shiftKey
            ? document.activeElement === first
            : document.activeElement === last)
        ) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }
    };
    document.addEventListener("keydown", onKeydown, true);
    requestAnimationFrame(() => {
      if (dialogs.at(-1) === el && !el.contains(document.activeElement)) {
        (
          visibleControls(el).find((control) =>
            control.matches(
              'input:not([type="checkbox"], [type="radio"], [type="hidden"])',
            ),
          ) ||
          visibleControls(el)[0] ||
          el
        ).focus();
      }
    });
    cleanups.set(el, () => {
      document.removeEventListener("keydown", onKeydown, true);
      dialogs.splice(dialogs.indexOf(el), 1);
      if (
        previousFocus?.isConnected &&
        (!dialogs.length || dialogs.at(-1).contains(previousFocus))
      )
        previousFocus.focus();
    });
  },
  unmounted(el) {
    cleanups.get(el)?.();
    cleanups.delete(el);
  },
};
