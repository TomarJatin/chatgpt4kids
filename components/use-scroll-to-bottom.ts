import { useEffect, useRef, type RefObject } from "react";

export function useScrollToBottom<T extends HTMLElement>(): [
  RefObject<T>,
  RefObject<T>,
] {
  const containerRef = useRef<T>(null);
  const endRef = useRef<T>(null);

  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (container && end) {
      const observer = new MutationObserver((mutations) => {
        if (mutationsShouldScrollToBottom(mutations)) {
          end.scrollIntoView({ behavior: "instant", block: "end" });
        }
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });

      return () => observer.disconnect();
    }
  }, []);

  return [containerRef, endRef];
}

function mutationShouldScrollToBottom(m: MutationRecord) {
  return (
    m.target instanceof HTMLElement &&
    (m.target.dataset.testid === "message-assistant" ||
      m.target.dataset.testid === "message-user")
  );
}
function mutationsShouldScrollToBottom(mutations: MutationRecord[]) {
  return mutations.some(mutationShouldScrollToBottom);
}
