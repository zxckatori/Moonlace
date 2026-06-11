"use client";

import { useCallback, useRef, useState } from "react";

/** Блокирует повторную отправку формы на cooldownMs миллисекунд */
export function useSubmitLock(cooldownMs = 1200) {
  const [locked, setLocked] = useState(false);
  const untilRef = useRef(0);

  const run = useCallback(
    async (fn: () => Promise<void>) => {
      const now = Date.now();
      if (locked || now < untilRef.current) return;
      setLocked(true);
      untilRef.current = now + cooldownMs;
      try {
        await fn();
      } finally {
        setTimeout(() => setLocked(false), cooldownMs);
      }
    },
    [locked, cooldownMs]
  );

  return { locked, run };
}
