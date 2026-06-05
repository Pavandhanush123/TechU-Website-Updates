import { useEffect, useRef, useState } from "react";
import { getPublicSection, type CmsSectionKey } from "@/lib/api";

// Caches in-flight + resolved CMS section payloads so multiple components
// hitting the same key don't trigger duplicate network calls.
const cache = new Map<CmsSectionKey, unknown>();
const inflight = new Map<CmsSectionKey, Promise<unknown>>();

const CMS_BUST_STORAGE_KEY = "techu.cms.invalidate";

function refetchSection<T>(key: CmsSectionKey, apply: (value: T) => void) {
  inflight.delete(key);
  void getPublicSection<T>(key).then((res) => {
    if (!res.ok) return;
    cache.set(key, res.section.data);
    apply(res.section.data as T);
  });
}

/** Call after a successful admin save so public pages refresh the same section. */
export function invalidateCmsSectionCache(key: CmsSectionKey) {
  cache.delete(key);
  inflight.delete(key);
  try {
    localStorage.setItem(CMS_BUST_STORAGE_KEY, `${key}:${Date.now()}`);
  } catch {
    /* private mode */
  }
  window.dispatchEvent(
    new CustomEvent("techu-cms-invalidate", { detail: { key } }),
  );
}

export function useCmsSection<T>(key: CmsSectionKey, fallback: T): T {
  const [data, setData] = useState<T>(() => {
    const cached = cache.get(key);
    return cached !== undefined ? (cached as T) : fallback;
  });
  const visWasHidden = useRef(false);

  useEffect(() => {
    visWasHidden.current = false;
  }, [key]);

  useEffect(() => {
    let cancelled = false;
    const cached = cache.get(key);
    if (cached !== undefined) {
      setData(cached as T);
      return;
    }
    let p = inflight.get(key);
    if (!p) {
      p = getPublicSection<T>(key).then((res) => {
        if (res.ok) {
          cache.set(key, res.section.data);
          return res.section.data;
        }
        return undefined;
      });
      inflight.set(key, p);
    }
    void p.then((value) => {
      inflight.delete(key);
      if (cancelled) return;
      if (value !== undefined) setData(value as T);
      else setData(fallback);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    const onInv = (e: Event) => {
      const k = (e as CustomEvent<{ key: CmsSectionKey }>).detail?.key;
      if (k !== key) return;
      refetchSection<T>(key, setData);
    };
    window.addEventListener("techu-cms-invalidate", onInv);
    return () => window.removeEventListener("techu-cms-invalidate", onInv);
  }, [key]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== CMS_BUST_STORAGE_KEY || !e.newValue) return;
      const bustKey = e.newValue.split(":")[0] as CmsSectionKey;
      if (bustKey !== key) return;
      refetchSection<T>(key, setData);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        visWasHidden.current = true;
        return;
      }
      if (document.visibilityState === "visible" && visWasHidden.current) {
        visWasHidden.current = false;
        refetchSection<T>(key, setData);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [key]);

  return data;
}
