import styles from "@/styles/ny-annonse.module.css";

export default function StepProgress({
  step,
  total,
}: {
  step: number;
  total: number;
}) {
  return (
    <div className={styles.progressRow}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`${styles.pill} ${i < step ? styles.pillActive : ""}`}
        />
      ))}
    </div>
  );
}
