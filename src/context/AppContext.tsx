import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CommunicationEntry = { id: string; time: string; message: string };
export type TextSize = "small" | "default" | "large";

type Preferences = {
  textSize: TextSize;
  highContrast: boolean;
  reducedMotion: boolean;
  speechEnabled: boolean;
  volume: number;
  lightMode: boolean;
};

type AppContextValue = {
  message: string;
  setMessage: (message: string) => void;
  history: CommunicationEntry[];
  commitMessage: (message: string) => void;
  preferences: Preferences;
  updatePreferences: (update: Partial<Preferences>) => void;
  speak: (text: string) => void;
};

const defaults: Preferences = {
  textSize: "default",
  highContrast: false,
  reducedMotion: false,
  speechEnabled: true,
  volume: 0.85,
  lightMode: false,
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<CommunicationEntry[]>([]);
  const [preferences, setPreferences] = useState<Preferences>(defaults);

  useEffect(() => {
    const saved = window.localStorage.getItem("silent-talk-preferences");
    if (!saved) return;
    try {
      setPreferences({ ...defaults, ...(JSON.parse(saved) as Partial<Preferences>) });
    } catch {
      window.localStorage.removeItem("silent-talk-preferences");
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.textSize = preferences.textSize;
    root.classList.toggle("high-contrast", preferences.highContrast);
    root.classList.toggle("reduce-motion", preferences.reducedMotion);
    root.classList.toggle("light", preferences.lightMode);
    window.localStorage.setItem("silent-talk-preferences", JSON.stringify(preferences));
  }, [preferences]);

  const value = useMemo<AppContextValue>(
    () => ({
      message,
      setMessage,
      history,
      commitMessage(next) {
        const cleaned = next.trim();
        setMessage(cleaned);
        if (!cleaned) return;
        setHistory((current) => [
          { id: crypto.randomUUID(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), message: cleaned },
          ...current,
        ].slice(0, 8));
      },
      preferences,
      updatePreferences(update) {
        setPreferences((current) => ({ ...current, ...update }));
      },
      speak(text) {
        if (!preferences.speechEnabled || !text.trim() || typeof window === "undefined" || !("speechSynthesis" in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = preferences.volume;
        utterance.rate = 0.92;
        window.speechSynthesis.speak(utterance);
      },
    }),
    [history, message, preferences],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}