import { useUIStore } from "../stores/useUIStore";
import { useProjectStore } from "../stores/useProjectStore";
import { Z_INDEX } from "../constants";
import type { Theme } from "../types";

export default function Onboarding({ theme: t }: { theme: Theme }) {
  const { showOnboarding, setShowOnboarding, onboardingStep, setOnboardingStep } = useUIStore();
  const meta = useProjectStore((s) => s.meta);
  const updateMeta = useProjectStore((s) => s.updateMeta);

  if (!showOnboarding) return null;

  const steps = [
    { title: "Welcome to Rebulb Studio", body: "Your creative worldbuilding workspace. Track characters, locations, magic systems, plot outlines, and more \u2014 all in one place." },
    { title: "Name Your Project", body: "Give your project a name to get started.", hasInput: true },
    { title: "You're All Set!", body: "Start creating entries, explore the workspace views, or press Ctrl+K for the command palette." },
  ];
  const step = steps[Math.min(onboardingStep, steps.length - 1)];

  const inputStyle = {
    width: "100%", background: t.input, border: `1px solid ${t.inputBorder}`,
    borderRadius: "6px", padding: "0.55rem 0.7rem", color: t.text, fontSize: "0.88rem",
    fontFamily: "'DM Sans',sans-serif",
  };

  const pillBtn = (color: string) => ({
    background: color + "18", border: `1px solid ${color}40`, color,
    padding: "0.35rem 0.9rem", borderRadius: "20px", cursor: "pointer" as const,
    fontSize: "0.78rem", fontWeight: 600, fontFamily: "'DM Sans',sans-serif",
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: Z_INDEX.onboarding, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "2rem", maxWidth: "440px", width: "90%" }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", color: t.textBright, marginBottom: "0.75rem" }}>{step.title}</h2>
        <p style={{ color: t.textMuted, lineHeight: 1.6, marginBottom: "1rem" }}>{step.body}</p>
        {step.hasInput && (
          <input placeholder="My Epic Story" value={meta.projectName}
            onChange={(e) => updateMeta({ projectName: e.target.value })}
            style={{ ...inputStyle, marginBottom: "1rem" }} autoFocus />
        )}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {onboardingStep > 0 && <button onClick={() => setOnboardingStep(onboardingStep - 1)} style={pillBtn(t.textDim)}>Back</button>}
          <div style={{ flex: 1 }} />
          {onboardingStep < steps.length - 1
            ? <button onClick={() => setOnboardingStep(onboardingStep + 1)} style={pillBtn(t.accent)}>Next</button>
            : <button onClick={() => { setShowOnboarding(false); localStorage.setItem("sa_onboarding_done", "1"); }} style={pillBtn(t.accent)}>Get Started</button>
          }
        </div>
      </div>
    </div>
  );
}
