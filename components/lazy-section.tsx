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
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
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
