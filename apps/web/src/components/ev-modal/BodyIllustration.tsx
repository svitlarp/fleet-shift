const PROFILE_PATHS = {
  city: "M8 62 L14 45 Q17 40 24 38 L46 25 Q50 23 56 23 H96 Q104 23 110 29 L124 42 L142 46 Q150 48 151 56 L152 62 Z",
  suv: "M6 62 L9 42 Q11 37 18 35 L38 19 Q42 16 48 16 H108 Q116 16 121 22 L133 37 L146 41 Q153 44 154 52 L154 62 Z",
  van: "M6 62 L8 34 Q9 28 15 26 L30 12 Q33 9 39 9 H138 Q148 9 150 19 L154 46 V62 Z",
} as const;

function profileFor(bodyType: string): keyof typeof PROFILE_PATHS {
  if (bodyType === "MINIBUS" || bodyType === "COMBISPACE") return "van";
  if (bodyType.startsWith("TS") || bodyType === "MINISPACE") return "suv";
  return "city";
}

export function BodyIllustration({ bodyType }: { bodyType: string }) {
  return (
    <svg viewBox="0 0 160 80" width="62%" role="img" aria-label={bodyType}>
      <path
        d={PROFILE_PATHS[profileFor(bodyType)]}
        fill="var(--border-strong)"
      />
      <circle
        cx="40"
        cy="62"
        r="12"
        fill="var(--text-secondary)"
        stroke="var(--surface-muted)"
        strokeWidth="3"
      />
      <circle
        cx="122"
        cy="62"
        r="12"
        fill="var(--text-secondary)"
        stroke="var(--surface-muted)"
        strokeWidth="3"
      />
    </svg>
  );
}
