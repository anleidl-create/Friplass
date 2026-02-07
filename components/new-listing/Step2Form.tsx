"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import styles from "@/styles/ny-annonse.module.css";
import { step2Schema, type Step2Values } from "@/lib/new-listing/step2.schema";
import { loadMvpDraft, saveMvpDraft } from "@/lib/new-listing/mvpStorage";
import { useDraftAutosave } from "@/lib/new-listing/useDraftAutosave";
import { BADGES, type BadgeKey } from "@/lib/new-listing/badges";

type Availability = "hverdag" | "helg" | "begge";

type MvpDraft = {
  description?: string;
  suitability?: string[]; // badge keys
  availability?: Availability;
  availableFrom?: string;
  availableTo?: string;

  [key: string]: any;
};

// Mapper gamle "suitability" verdier til nye badge keys
function normalizeSuitability(arr: any): string[] {
  const raw = Array.isArray(arr) ? arr : [];
  const out: string[] = [];

  for (const item of raw) {
    const s = String(item ?? "").toLowerCase().trim();
    if (!s) continue;

    // gamle -> nye
    if (s === "familie") out.push("familievennlig");
    else if (s === "hund") out.push("hund_tillatt");
    else if (s === "stille") out.push("rolig");
    else if (s === "strom") out.push("strom");
    else out.push(s); // behold ukjente (f.eks. "naer_sentrum" hvis det finnes i gamle data)
  }

  // fjerne duplikater
  return Array.from(new Set(out));
}

export default function Step2Form() {
  const router = useRouter();
  const mvp = (loadMvpDraft() ?? {}) as MvpDraft;

  const form = useForm<Step2Values>({
    resolver: zodResolver(step2Schema) as unknown as Resolver<Step2Values>,
    defaultValues: {
      description: (mvp.description ?? "") as any,
      suitability: (normalizeSuitability(mvp.suitability) as any) ?? [],
      availability: (mvp.availability as any) ?? undefined,
      availableFrom: (mvp.availableFrom ?? "") as any,
      availableTo: (mvp.availableTo ?? "") as any,
    },
    mode: "onBlur",
  });

  const watchValues = form.watch();
  useDraftAutosave(watchValues as any);

  useEffect(() => {
    const latest = (loadMvpDraft() ?? {}) as MvpDraft;

    form.reset({
      description: (latest.description ?? "") as any,
      suitability: (normalizeSuitability(latest.suitability) as any) ?? [],
      availability: (latest.availability as any) ?? undefined,
      availableFrom: (latest.availableFrom ?? "") as any,
      availableTo: (latest.availableTo ?? "") as any,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(values: Step2Values) {
    const prev = (loadMvpDraft() ?? {}) as MvpDraft;

    // Sørg for at vi lagrer normalisert suitability
    const nextSuitability = normalizeSuitability((values as any).suitability);

    saveMvpDraft({ ...prev, ...values, suitability: nextSuitability } as any);
    router.push("/ny-annonse/steg-3");
  }

  const selected = (form.watch("suitability") as string[]) ?? [];

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label}>Beskrivelse</label>
        <textarea
          className={styles.textarea}
          rows={7}
          {...form.register("description")}
        />
        {form.formState.errors.description && (
          <p className={styles.error}>
            {form.formState.errors.description.message}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Egenskaper</label>

        <div
          style={{
            display: "grid",
            gap: 8,
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          }}
        >
          {BADGES.map((opt) => {
            const key = opt.key as BadgeKey;
            const checked = selected.includes(key);

            return (
              <label
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: "10px 12px",
                  background: checked ? "#f9fafb" : "#fff",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const current = (form.getValues("suitability") as any) ?? [];
                    const next = e.target.checked
                      ? Array.from(new Set([...current, key]))
                      : current.filter((x: any) => x !== key);

                    form.setValue("suitability", next as any, {
                      shouldDirty: true,
                      shouldValidate: false,
                    });
                  }}
                />
                <span style={{ fontWeight: 800 }}>{opt.label}</span>
              </label>
            );
          })}
        </div>

        <div style={{ opacity: 0.75, fontSize: 13, marginTop: 8 }}>
          Velg det som stemmer — dette vises som badges på annonsen.
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Tilgjengelighet</label>

        <div style={{ display: "grid", gap: 8 }}>
          {(["hverdag", "helg", "begge"] as const).map((v) => (
            <label
              key={v}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: "10px 12px",
                cursor: "pointer",
              }}
            >
              <input type="radio" value={v} {...form.register("availability")} />
              <span style={{ fontWeight: 800 }}>
                {v === "hverdag" ? "Hverdager" : v === "helg" ? "Helg" : "Begge"}
              </span>
            </label>
          ))}
        </div>

        {form.formState.errors.availability && (
          <p className={styles.error}>
            {form.formState.errors.availability.message as any}
          </p>
        )}
      </div>

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label className={styles.label}>Tilgjengelig fra</label>
          <input
            className={styles.input}
            type="date"
            {...form.register("availableFrom")}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Tilgjengelig til</label>
          <input
            className={styles.input}
            type="date"
            {...form.register("availableTo")}
          />
          {form.formState.errors.availableTo && (
            <p className={styles.error}>
              {form.formState.errors.availableTo.message as any}
            </p>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => router.back()}
        >
          Tilbake
        </button>
        <button type="submit" className={styles.primary}>
          Neste
        </button>
      </div>
    </form>
  );
}
