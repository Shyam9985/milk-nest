import { useCallback, useState } from 'react';

/*
 * State for a ProfileDrawer: what is open, plus the trail of profiles opened from inside
 * one another so Back works. A screen calls open(type, id) and spreads props onto the
 * drawer; it never deals with the stack itself.
 */
export default function useProfileDrawer() {

    const [stack, setStack] = useState([]);      // [{ type, id }], last item is showing
    const [isOpen, setIsOpen] = useState(false);

    const open = useCallback((type, id) => {
        setStack([{ type, id }]);
        setIsOpen(true);
    }, []);

    // a link inside a profile pushes onto the trail instead of replacing it
    const navigate = useCallback((type, id) => {
        setStack((prev) => [...prev, { type, id }]);
    }, []);

    const back = useCallback(() => {
        setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
        // the drawer animates out over 300ms; clearing after keeps the content in place while it slides
        setTimeout(() => setStack([]), 300);
    }, []);

    const target = stack[stack.length - 1] || null;

    return {
        open,
        close,
        props: { isOpen, target, onClose: close, onNavigate: navigate, onBack: back, canGoBack: stack.length > 1 },
    };
}
