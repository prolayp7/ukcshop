import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap" style={{ minHeight: "70dvh", display: "grid", placeItems: "center", textAlign: "center" }}>
      <div>
        <p style={{ color: "var(--blue)", fontWeight: 800 }}>404</p>
        <h1>We couldn’t find that page</h1>
        <p>The product or page may have moved, or the address may be incorrect.</p>
        <Link className="btn btn-p" href="/">Return to the storefront</Link>
      </div>
    </div>
  );
}
