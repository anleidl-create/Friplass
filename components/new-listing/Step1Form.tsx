"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import styles from "@/styles/ny-annonse.module.css";
import {
  step1Schema,
  type Step1Values,
  type Category,
} from "@/lib/new-listing/step1.schema";

import { loadMvpDraft, saveMvpDraft } from "@/lib/new-listing/mvpStorage";
import { useDraftAutosave } from "@/lib/new-listing/useDraftAutosave";

type MvpDraft = {
  title?: string;
  category?: Category;
  locationText?: string;
  [key: string]: any;
};

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: "batplass", label: "Båtplass" },
  { value: "bobilplass", label: "Bobilplass" },
  { value: "campingplass", label: "Campingplass" },
];

export default function Step1Form() {
  const router = useRouter();
  const mvp = (loadMvpDraft() ?? {}) as MvpDraft;

  const form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema) as unknown as Resolver<Step1Values>,
    defaultValues: {
      title: (mvp.title ?? "") as any,
      category: (mvp.category as any) ?? undefined,
      locationText: (mvp.locationText ?? "") as any,
    },
    mode: "onBlur",
  });

  // autosave (merger via useDraftAutosave)
  const watchValues = form.watch();
  useDraftAutosave(watchValues as any);

  useEffect(() => {
    form.reset({
      title: (mvp.title ?? "") as any,
      category: (mvp.category as any) ?? undefined,
      locationText: (mvp.locationText ?? "") as any,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

function onSubmit(values: Step1Values) {
  const prev = (loadMvpDraft() ?? {}) as any;

  const address = String(values.locationText ?? "").trim();

  const next = {
    ...prev,
    ...values,

    // alltid synk disse
    locationText: address,
    address, // bakoverkompatibilitet

    // standard-feltet resten av appen bør lese
    location: {
      ...(prev.location ?? {}),
      address,
    },
  };

  saveMvpDraft(next as any);
  router.push("/ny-annonse/steg-2");
}






  const selected = form.watch("category");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label}>Tittel</label>
        <input
          className={styles.input}
          placeholder="F.eks. Bobilplass ved sjøen"
          {...form.register("title")}
        />
        {form.formState.errors.title && (
          <p className={styles.error}>{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Kategori</label>

        <div
          style={{
            display: "grid",
            gap: 8,
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          }}
        >
          {CATEGORY_OPTIONS.map((opt) => {
            const active = selected === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  form.setValue("category", opt.value as any, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                style={{
                  padding: "12px",
                  borderRadius: 12,
                  border: active ? "2px solid #111827" : "1px solid #e5e7eb",
                  background: active ? "#f9fafb" : "#fff",
                  fontWeight: 900,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {form.formState.errors.category && (
          <p className={styles.error}>
            {form.formState.errors.category.message as any}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Sted</label>
        <input
          className={styles.input}
          placeholder="F.eks. Egersund"
          {...form.register("locationText")}
        />
        {form.formState.errors.locationText && (
          <p className={styles.error}>
            {form.formState.errors.locationText.message}
          </p>
        )}
      </div>

      <div className={styles.actions}>
        <button type="submit" className={styles.primary}>
          Neste
        </button>
      </div>
    </form>
  );
}
