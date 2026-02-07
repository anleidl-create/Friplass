"use client";

import { useEffect, useRef } from "react";
import { loadMvpDraft, saveMvpDraft } from "./mvpStorage"

/**
 * Autosave som IKKE overskriver andre felter i draftet.
 * Den merger alltid inn nye verdier oppå eksisterende draft.
 */
export function useDraftAutosave(values: any, delayMs = 300) {
  const lastJson = useRef<string>("");

  useEffect(() => {
    // ikke autosave hvis values er tomt/undefined
    if (!values) return;

    const t = setTimeout(() => {
      try {
        // Unngå å trigge hvis ingenting har endret seg
        const json = JSON.stringify(values ?? {});
        if (json === lastJson.current) return;
        lastJson.current = json;

        const prev = loadMvpDraft() ?? {};

        // MERGE: behold alt fra tidligere steg (images, price, location osv)
        const merged = { ...prev, ...values };

        saveMvpDraft(merged as any);
      } catch {
        // ignore
      }
    }, delayMs);

    return () => clearTimeout(t);
  }, [values, delayMs]);
}
