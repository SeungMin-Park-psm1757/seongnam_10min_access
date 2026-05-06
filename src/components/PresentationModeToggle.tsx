"use client";

import { useEffect, useState } from "react";

export function PresentationModeToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("presentation-mode", enabled);
    return () => document.body.classList.remove("presentation-mode");
  }, [enabled]);

  return (
    <button
      type="button"
      className={enabled ? "presentationToggle active" : "presentationToggle"}
      aria-pressed={enabled}
      onClick={() => setEnabled((value) => !value)}
    >
      발표 모드
    </button>
  );
}
