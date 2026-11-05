import { useEffect, useRef, useState, type ReactNode } from 'react';

const narrowQuery = '(max-width: 1023px)';

export function ImportReviewPanel({
  children,
  onRequestClose,
}: {
  children: ReactNode;
  onRequestClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const resumeFocus = useRef<HTMLElement | null>(null);
  const [narrow, setNarrow] = useState(
    () => window.matchMedia(narrowQuery).matches,
  );

  useEffect(() => {
    const query = window.matchMedia(narrowQuery);
    const update = () => setNarrow(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const previousOverflow = document.body.style.overflow;
    let scrollLocked = false;
    let observer: MutationObserver | undefined;

    function openPanel() {
      if (!element || element.open) return;
      // A route-leave confirmation must remain above the editor during resize.
      if (document.querySelector('dialog:modal')) return;
      observer?.disconnect();
      if (narrow) {
        element.showModal();
        document.body.style.overflow = 'hidden';
        scrollLocked = true;
      } else {
        element.show();
      }
      if (resumeFocus.current && element.contains(resumeFocus.current))
        resumeFocus.current.focus({ preventScroll: true });
      resumeFocus.current = null;
    }

    openPanel();
    if (!element.open) {
      observer = new MutationObserver(openPanel);
      observer.observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['open'],
      });
    }

    return () => {
      observer?.disconnect();
      if (
        document.activeElement instanceof HTMLElement &&
        element.contains(document.activeElement)
      )
        resumeFocus.current = document.activeElement;
      element.close();
      if (scrollLocked) document.body.style.overflow = previousOverflow;
    };
  }, [narrow]);

  return (
    <dialog
      className="import-review-panel"
      ref={dialog}
      aria-labelledby="import-review-editor-title"
      aria-modal={narrow || undefined}
      onCancel={(event) => {
        event.preventDefault();
        onRequestClose();
      }}
      onKeyDown={(event) => {
        if (!narrow && event.key === 'Escape' && !event.defaultPrevented) {
          event.preventDefault();
          onRequestClose();
        }
      }}
    >
      {children}
    </dialog>
  );
}
