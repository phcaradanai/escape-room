(() => {
    const focusableSelector = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    let activeDialog = null;
    let previousFocus = null;
    let restoreTarget = null;
    let focusFallback = null;
    let onEscape = null;
    let inertedSiblings = [];

    function isVisible(element) {
        return !!element && element.isConnected && !element.disabled && !element.closest('[inert]') && element.getClientRects().length > 0;
    }

    function resolveTarget(target) {
        if (typeof target === 'function') return target();
        if (typeof target === 'string') return document.querySelector(target);
        return target;
    }

    function getFocusable(dialog) {
        return [...dialog.querySelectorAll(focusableSelector)].filter(isVisible);
    }

    function restoreInert() {
        inertedSiblings.forEach(([element, wasInert]) => {
            element.inert = wasInert;
        });
        inertedSiblings = [];
    }

    function openDialog(dialog, options = {}) {
        if (!dialog) return;
        if (activeDialog === dialog) return;
        if (activeDialog && activeDialog !== dialog) closeDialog(activeDialog, { restoreFocus: false });

        previousFocus = document.activeElement;
        restoreTarget = options.restoreTarget || null;
        focusFallback = options.focusFallback || null;
        onEscape = options.onEscape || null;
        activeDialog = dialog;

        if (!dialog.hasAttribute('role')) dialog.setAttribute('role', 'dialog');
        if (!dialog.hasAttribute('tabindex')) dialog.tabIndex = -1;
        dialog.setAttribute('aria-modal', 'true');
        dialog.classList.remove('hidden');

        const boundary = options.inertBoundary || dialog.parentElement;
        if (boundary) {
            [...boundary.children].forEach(sibling => {
                if (sibling === dialog) return;
                inertedSiblings.push([sibling, sibling.inert]);
                sibling.inert = true;
            });
        }

        const preferred = resolveTarget(options.initialFocus);
        const target = isVisible(preferred) ? preferred : getFocusable(dialog)[0] || dialog;
        target.focus({ preventScroll: true });
    }

    function closeDialog(dialog, options = {}) {
        if (!dialog) return;
        dialog.classList.add('hidden');
        dialog.removeAttribute('aria-modal');
        if (activeDialog !== dialog) return;

        const shouldRestore = options.restoreFocus !== false;
        const oldFocus = previousFocus;
        const preferred = resolveTarget(restoreTarget);
        const fallback = resolveTarget(focusFallback);

        activeDialog = null;
        previousFocus = null;
        restoreTarget = null;
        focusFallback = null;
        onEscape = null;
        restoreInert();

        if (shouldRestore) {
            const target = isVisible(preferred) ? preferred : isVisible(oldFocus) ? oldFocus : isVisible(fallback) ? fallback : null;
            if (target) target.focus({ preventScroll: true });
        }
    }

    document.addEventListener('keydown', event => {
        if (!activeDialog) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopImmediatePropagation();
            if (onEscape) onEscape();
            return;
        }

        if (event.key !== 'Tab') return;
        const focusable = getFocusable(activeDialog);
        if (focusable.length === 0) {
            event.preventDefault();
            activeDialog.focus({ preventScroll: true });
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const index = focusable.indexOf(document.activeElement);
        if (index === -1) {
            event.preventDefault();
            (event.shiftKey ? last : first).focus({ preventScroll: true });
        } else if (event.shiftKey && index === 0) {
            event.preventDefault();
            last.focus({ preventScroll: true });
        } else if (!event.shiftKey && index === focusable.length - 1) {
            event.preventDefault();
            first.focus({ preventScroll: true });
        }
    }, true);

    function initializeHudOverflowMenu() {
        const menu = document.querySelector('[data-hud-overflow-menu]');
        const trigger = menu?.querySelector('summary');
        if (!menu || !trigger || typeof window.matchMedia !== 'function') return;

        const compact = window.matchMedia('(max-width: 900px)');
        const syncLayout = () => {
            const shouldBeOpen = !compact.matches;
            if (menu.open === shouldBeOpen) return;

            const focusWasInMenu = menu.contains(document.activeElement);
            const focusWasOnTrigger = document.activeElement === trigger;
            menu.open = shouldBeOpen;

            if (!shouldBeOpen && focusWasInMenu) {
                trigger.focus({ preventScroll: true });
            } else if (shouldBeOpen && focusWasOnTrigger) {
                menu.querySelector('.hud-overflow-items button')?.focus({ preventScroll: true });
            }
        };

        syncLayout();
        if (typeof compact.addEventListener === 'function') {
            compact.addEventListener('change', syncLayout);
        } else {
            compact.addListener(syncLayout);
        }

        document.addEventListener('pointerdown', event => {
            if (!compact.matches || !menu.open || menu.contains(event.target) || activeDialog) return;
            const focusWasInMenu = menu.contains(document.activeElement);
            menu.open = false;
            if (focusWasInMenu) trigger.focus({ preventScroll: true });
        });

        document.addEventListener('focusin', event => {
            if (!compact.matches || !menu.open || menu.contains(event.target) || activeDialog) return;
            menu.open = false;
        });

        document.addEventListener('keydown', event => {
            if (!compact.matches || !menu.open || activeDialog || event.key !== 'Escape') return;
            event.preventDefault();
            menu.open = false;
            trigger.focus({ preventScroll: true });
        });
    }

    initializeHudOverflowMenu();

    window.Room25UI = { openDialog, closeDialog };
})();
