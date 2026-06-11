export function parseApiError(err: unknown, fallback = "Ошибка запроса"): string {
  if (!err || typeof err !== "object") return fallback;
  const e = err as Record<string, unknown>;

  if (typeof e.error === "string") return e.error;

  if (e.error && typeof e.error === "object") {
    const flat = e.error as {
      fieldErrors?: Record<string, string[]>;
      formErrors?: string[];
    };
    if (flat.fieldErrors?.name?.length) {
      return "Название темы: минимум 2 символа";
    }
    for (const msgs of Object.values(flat.fieldErrors || {})) {
      if (msgs?.[0]) return msgs[0];
    }
    if (flat.formErrors?.[0]) return flat.formErrors[0];
  }

  if (typeof e.message === "string") {
    try {
      const inner = JSON.parse(e.message) as Record<string, unknown>;
      const nested = parseApiError(inner, e.message);
      if (nested !== e.message) return nested;
    } catch {
      /* not JSON */
    }
    if (e.message !== "Bad Request") return e.message;
  }

  return fallback;
}
