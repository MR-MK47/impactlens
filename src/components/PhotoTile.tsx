type Props = {
  seed: string;
  className?: string;
  label?: string;
};

const PALETTES: Record<string, string[]> = {
  green: ["#0D6E55", "#10b981", "#a7f3d0"],
  amber: ["#92400E", "#F59E0B", "#FDE68A"],
  sky:   ["#0c4a6e", "#0ea5e9", "#bae6fd"],
  rose:  ["#9f1239", "#fb7185", "#fecdd3"],
  violet:["#4c1d95", "#8b5cf6", "#ddd6fe"],
  teal:  ["#134e4a", "#14b8a6", "#99f6e4"],
};

function pick(seed: string) {
  const keys = Object.keys(PALETTES);
  const h = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
  return PALETTES[keys[h % keys.length]];
}

export function PhotoTile({ seed, className = "aspect-[4/5]", label }: Props) {
  const [c1, c2, c3] = pick(seed);
  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg ${className}`}
      style={{ background: `linear-gradient(135deg, ${c1} 0%, ${c2} 55%, ${c3} 100%)` }}
    >
      <div className="absolute inset-0 opacity-20 mix-blend-overlay"
           style={{ backgroundImage: "radial-gradient(circle at 30% 30%, white 0, transparent 40%), radial-gradient(circle at 70% 70%, white 0, transparent 35%)" }} />
      {label && (
        <div className="absolute bottom-2 left-2 text-[10px] font-medium text-white/90 bg-black/25 px-2 py-0.5 rounded-full backdrop-blur-sm">
          {label}
        </div>
      )}
    </div>
  );
}
