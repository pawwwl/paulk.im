"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface LazySectionProps {
  children: ReactNode;
  /** Height to reserve before the section loads (keeps layout stable) */
  placeholderHeight?: string;
  /** How much of the element must be visible before loading. Default: 0.1 */
  threshold?: number;
}

export function LazySection({
  children,
  placeholderHeight = "520px",
  threshold = 0.1,
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
      },
      // rootMargin keeps the section mounted 200px before/after viewport
      // so it doesn't unmount while partially visible during scrolling
      { threshold, rootMargin: "200px 0px 200px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={ref} style={visible ? undefined : { minHeight: placeholderHeight }}>
      {visible ? children : null}
    </div>
  );
}
