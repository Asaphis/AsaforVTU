import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { currentUser } from "../lib/liveApi";

const INSTALL_CONFIRMED_KEY = "asafor-pwa-install-confirmed-v2";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};
type InstallStatus = "ready" | "installing" | "success" | "instructions";

export function isStandalonePwa() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function hasConfirmedInstall() {
  return typeof window !== "undefined" && window.localStorage.getItem(INSTALL_CONFIRMED_KEY) === "true";
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
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !window.isSecureContext) return;
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
  }, []);

  if (launching && standalone) return <PwaSplash />;
  return null;
}

export function PwaInstallPrompt() {
  const [location] = useLocation();
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [status, setStatus] = useState<InstallStatus>("ready");

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
      setStatus("success");
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    const timer = window.setTimeout(() => setVisible(true), 1400);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (standalone || location !== "/" || !visible) return null;

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const install = async () => {
    if (!promptEvent) {
      setStatus("instructions");
      return;
    }
    setStatus("installing");
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      setPromptEvent(null);
      if (choice.outcome === "accepted") {
        // Keep the message visible until the browser confirms appinstalled.
        window.setTimeout(() => setStatus((current) => current === "installing" ? "instructions" : current), 10000);
      } else {
        setStatus("ready");
      }
    } catch {
      setStatus("instructions");
    }
  };

  const close = () => setVisible(false);
  const title = status === "success" ? "Asafor VTU installed" : status === "installing" ? "Installing Asafor VTU…" : "Install Asafor VTU";
  const message = status === "success"
    ? "Installation complete. Open Asafor VTU from your phone to go to Login."
    : status === "installing"
      ? "Please complete the installation window. We are waiting for confirmation."
      : status === "instructions"
        ? isIos
          ? "Tap Share, then Add to Home Screen to place Asafor VTU on your phone."
          : "Open your browser menu, choose Install app or Add to Home screen, then confirm."
        : "Keep quick access to your account on your phone.";

  return <aside className={`pwa-install-prompt pwa-install-prompt--${status}`} role="dialog" aria-live="polite" aria-label="Install Asafor VTU">
    <div className="pwa-install-mark"><img src="/pwa-icon-192.png" alt="" /></div>
    <div className="pwa-install-copy">
      <strong>{title}</strong>
      <span>{message}</span>
    </div>
    {status === "ready" && <button className="pwa-install-action" onClick={() => void install()}>Install</button>}
    {status === "installing" && <span className="pwa-install-spinner" aria-label="Installation in progress" />}
    {status === "instructions" && <button className="pwa-install-action" onClick={close}>Got it</button>}
    {status === "success" && <button className="pwa-install-action" onClick={close}>Done</button>}
    {status !== "installing" && <button className="pwa-install-dismiss" onClick={close} aria-label="Dismiss install message">×</button>}
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
