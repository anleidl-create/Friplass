import type { ReactNode } from "react";
import StepProgress from "./StepProgress";
import styles from "@/styles/ny-annonse.module.css";

export default function NewListingShell({
  step,
  title,
  subtitle,
  children,
}: {
  step: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.kicker}>Ny annonse · Steg {step} av 4</div>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <div className={styles.kicker}>{subtitle}</div>}
        <StepProgress step={step} total={4} />
      </div>

      {children}
    </div>
  );
}
