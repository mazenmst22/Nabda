export type PulseState =
  "idle" | "listening" | "thinking" | "speaking" | "acting" | "done" | "handoff";

export function PulseAvatar({
  size = "medium",
  state = "idle",
  label,
}: {
  size?: "small" | "medium" | "large";
  state?: PulseState;
  label?: string;
}) {
  return (
    <span
      className={`pulse-orb pulse-orb-${size} pulse-state-${state}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-pulse-state={state}
    >
      <span className="pulse-core" />
      <span className="pulse-idle-ring" />
      <span className="pulse-listening-rings">
        <i />
        <i />
        <i />
      </span>
      <span className="pulse-thinking-arc" />
      <span className="pulse-speaking-bars">
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="pulse-acting-line" />
    </span>
  );
}

export const PulseOrb = PulseAvatar;
