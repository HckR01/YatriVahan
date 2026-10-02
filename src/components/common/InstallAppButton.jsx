import { useState, useEffect } from "react";

const InstallAppButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsVisible(false);
    }
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={handleInstallClick}
      className="fixed bottom-6 right-6 z-50 flex h-14 items-center justify-center gap-2 rounded-full bg-[#E53935] px-6 text-sm font-bold text-white shadow-[0_8px_30px_rgb(229,57,53,0.3)] transition-transform hover:scale-105 hover:bg-[#D32F2F] sm:bottom-8 sm:right-8"
      aria-label="Install App"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" x2="12" y1="15" y2="3" />
      </svg>
      Install App
    </button>
  );
};

export default InstallAppButton;
