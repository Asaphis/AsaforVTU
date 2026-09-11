import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { currentUser } from "../lib/liveApi";

const INSTALL_SEEN_KEY = "asafor-pwa-install-seen";
const INSTALL_CONFIRMED_KEY = "asafor-pwa-install-confirmed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function isStandalonePwa() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function hasConfirmedInstall() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(INSTALL_CONFIRMED_KEY) === "true";
}

export function PwaRuntime() {
  const [, setLocation] = useLocation();
  const [standalone, setStandalone] = useState(false);
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    const installed = isStandalonePwa();
    setStandalone(installed);
    if (!installed) return;

    setLaunching(true);
    let active = true;
    void currentUser().then((user) => {
      if (!active) return;
      setLocation(user ? "/dashboard" : "/login");
    }).catch(() => {
      if (active) setLocation("/login");
    }).finally(() => {
      if (active) window.setTimeout(() => setLaunching(false), 650);
    });
    return () => { active = false; };
  }, [setLocation]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const registerServiceWorker = async () => {
      if ("serviceWorker" in navigator && window.isSecureContext) {
        try { await navigator.serviceWorker.register("/sw.js", { scope: "/" }); } catch { /* PWA enhancement only */ }
      }
    };
    void registerServiceWorker();
  }, []);

  if (launching && standalone) return <PwaSplash />;
  return null;
}

export function PwaInstallPrompt() {
  const [location] = useLocation();
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const installed = isStandalonePwa();
    setStandalone(installed);
    if (installed || hasConfirmedInstall()) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      window.localStorage.setItem(INSTALL_CONFIRMED_KEY, "true");
      setPromptEvent(null);
      setVisible(false);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // On browsers that do not expose the native prompt, show helpful install guidance.
    const timer = window.setTimeout(() => setVisible(true), 1400);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (standalone || location !== "/" || !visible) return null;

  const install = async () => {
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") {
        window.localStorage.setItem(INSTALL_CONFIRMED_KEY, "true");
        setVisible(false);
      }
      setPromptEvent(null);
      return;
    }
    window.localStorage.setItem(INSTALL_SEEN_KEY, "true");
    setVisible(false);
  };

  return <aside className="pwa-install-prompt" role="dialog" aria-label="Install Asafor VTU">
    <div className="pwa-install-mark"><img src="/pwa-icon-192.png" alt="" /></div>
    <div className="pwa-install-copy">
      <strong>Install Asafor VTU</strong>
      <span>Keep quick access to your account on your phone.</span>
    </div>
    <button className="pwa-install-action" onClick={() => void install()}>Install</button>
    <button className="pwa-install-dismiss" onClick={() => setVisible(false)} aria-label="Dismiss install message">×</button>
  </aside>;
}

function PwaSplash() {
  return <main className="pwa-splash" aria-label="Loading Asafor VTU">
    <div className="pwa-splash-card">
      <img src="/pwa-icon-512.png" alt="Asafor VTU" />
      <strong>Asafor VTU</strong>
      <span>Loading your account</span>
      <i aria-hidden="true" />
    </div>
  </main>;
}
