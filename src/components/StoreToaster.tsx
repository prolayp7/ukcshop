"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Toaster } from "sonner";
import "./store-toasts.css";

export default function StoreToaster() {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    // Native dialogs occupy the top layer; a body-level z-index cannot cover them.
    const updateHost = () => {
      const dialogs = document.querySelectorAll<HTMLDialogElement>("dialog[open]");
      setHost(dialogs.item(dialogs.length - 1) || document.body);
    };
    const observer = new MutationObserver(updateHost);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["open"] });
    updateHost();
    return () => observer.disconnect();
  }, []);
  return host ? createPortal(<Toaster position="top-right" closeButton richColors duration={6000} visibleToasts={3} gap={12} offset={24} mobileOffset={12} toastOptions={{ className: "store-toast" }} />, host) : null;
}
