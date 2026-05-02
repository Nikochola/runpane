import type { CSSProperties } from "react";

const SIZE = 5;
const CENTER = Math.floor(SIZE / 2);
const MAX_TRBL = (SIZE - 1) * 2;

function trBlPathNorm(row: number, col: number): number {
  return (row + (SIZE - 1 - col)) / MAX_TRBL;
}

export function NeonDrift({
  size = 32,
  dotSize = 4,
  color = "currentColor",
  speed = 1.1,
}: {
  size?: number;
  dotSize?: number;
  color?: string;
  speed?: number;
}) {
  const gap = (size - dotSize * SIZE) / (SIZE - 1);
  const cells = Array.from({ length: SIZE * SIZE }, (_, i) => {
    const row = Math.floor(i / SIZE);
    const col = i % SIZE;
    const path = trBlPathNorm(row, col);
    const slice = row + (4 - col);
    const parity = slice % 2;
    return { row, col, path, parity };
  });

  return (
    <div
      className="dmx-root"
      style={{ color, width: size, height: size, "--dmx-speed": `${1 / speed}` } as CSSProperties}
    >
      <div className="dmx-grid" style={{ width: size, height: size, gap }}>
        {cells.map(({ row, col, path, parity }) => (
          <span
            key={row * SIZE + col}
            className="dmx-dot dmx-diagonal-alt-sweep"
            style={{
              width: dotSize,
              height: dotSize,
              "--dmx-path": path,
              "--dmx-diagonal-parity": parity,
            } as CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}
