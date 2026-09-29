"use client";

import { useState } from "react";
import { subscribeNewsletter } from "@/lib/storefront-client";

/** Email signup used by the footer and the homepage Newsletter section; subscribes via the API. */
export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    try {
      await subscribeNewsletter(email);
      setEmail("");
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <>
      {state === "done" ? (
        <p style={{ margin: 0, fontWeight: 600 }}>Thanks for subscribing!</p>
      ) : (
        <form className="newsform" onSubmit={handleSubmit}>
          <input
            type="email"
            required
            placeholder="Email address for deals"
            aria-label="Email address for deals"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="btn btn-p" disabled={state === "submitting"}>
            {state === "submitting" ? "Subscribing…" : "Subscribe"}
          </button>
        </form>
      )}
      {state === "error" ? <p style={{ margin: "6px 0 0", color: "#c0392b", fontSize: 13 }}>Couldn&rsquo;t subscribe right now — please try again.</p> : null}
    </>
  );
}
