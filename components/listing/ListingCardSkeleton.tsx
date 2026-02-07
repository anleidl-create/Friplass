// components/listing/ListingCardSkeleton.tsx
export default function ListingCardSkeleton() {
  return (
    <div className="card" aria-hidden="true">
      <div className="img shimmer" />

      <div className="body">
        <div className="row">
          <div className="line shimmer w-60" />
          <div className="line shimmer w-25" />
        </div>

        <div className="row">
          <div className="line shimmer w-45" />
          <div className="line shimmer w-30" />
        </div>

        <div className="badges">
          <span className="pill shimmer" />
          <span className="pill shimmer" />
          <span className="pill shimmer" />
        </div>
      </div>

      <style jsx>{`
        .card {
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 10px 30px -25px rgba(0, 0, 0, 0.2);
        }

        .img {
          height: 170px;
          background: #f1f5f9;
        }

        .body {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
        }

        .line {
          height: 12px;
          border-radius: 999px;
          background: #f1f5f9;
        }

        .w-60 {
          width: 60%;
        }
        .w-45 {
          width: 45%;
        }
        .w-30 {
          width: 30%;
        }
        .w-25 {
          width: 25%;
        }

        .badges {
          display: flex;
          gap: 8px;
          margin-top: 2px;
        }

        .pill {
          width: 58px;
          height: 18px;
          border-radius: 999px;
          background: #f1f5f9;
          display: inline-block;
        }

        .shimmer {
          position: relative;
          overflow: hidden;
        }
        .shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.65) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: shimmer 1.2s infinite;
        }

        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }

        @media (max-width: 520px) {
          .img {
            height: 150px;
          }
        }
      `}</style>
    </div>
  );
}
