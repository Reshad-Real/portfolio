/**
 * Shown instead of the canvas when WebGL is unavailable. It is a real
 * cross-section of the device the 3D scene builds, not an error state.
 */
export function ChamberFallback() {
  return (
    <div className="absolute inset-0 grid place-items-center overflow-hidden bg-[#08090b]">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(120,170,220,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(120,170,220,0.14) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <svg
        viewBox="0 0 520 300"
        className="relative w-[min(88vw,680px)]"
        role="img"
        aria-label="Cross-section of a 5 nm AlGaN/GaN asymmetric-spacer tri-gate FinFET, showing substrate, buffer, fin, barrier, wrapped gate, spacers, source and drain."
      >
        <defs>
          <linearGradient id="mf-gate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e0c56a" />
            <stop offset="100%" stopColor="#8a7530" />
          </linearGradient>
        </defs>

        <g stroke="#5f7f9e" strokeWidth="1" opacity="0.5">
          <line x1="30" y1="250" x2="490" y2="250" />
          <line x1="30" y1="40" x2="30" y2="250" />
        </g>

        <rect x="60" y="214" width="400" height="30" fill="#22252c" stroke="#3b4049" />
        <rect x="76" y="196" width="368" height="20" fill="#2b3540" stroke="#44515e" />
        <rect x="140" y="150" width="240" height="48" fill="#1d4d4a" stroke="#2f8d84" />
        <rect x="140" y="140" width="240" height="12" fill="#2f5c7a" stroke="#4a86ab" />
        <rect x="228" y="112" width="60" height="62" fill="url(#mf-gate)" stroke="#f0dd9a" />
        <rect x="196" y="140" width="32" height="36" fill="#3a3448" stroke="#57506b" />
        <rect x="288" y="140" width="46" height="36" fill="#3a3448" stroke="#57506b" />
        <rect x="120" y="132" width="60" height="44" fill="#9aa0a8" stroke="#cfd4da" />
        <rect x="346" y="132" width="60" height="44" fill="#9aa0a8" stroke="#cfd4da" />

        <g fill="#4ee8c6">
          {[160, 190, 220, 250, 280, 310, 340].map((x) => (
            <circle key={x} cx={x} cy={172} r="2.6" opacity="0.85" />
          ))}
        </g>

        <g
          fill="rgba(255,255,255,0.6)"
          fontSize="9.5"
          letterSpacing="1.4"
          style={{ fontFamily: 'var(--font-tech)' }}
        >
          <text x="258" y="104" textAnchor="middle">GATE</text>
          <text x="150" y="124" textAnchor="middle">SOURCE</text>
          <text x="376" y="124" textAnchor="middle">DRAIN</text>
          <text x="392" y="168">AlGaN / 2DEG</text>
          <text x="392" y="186">GaN fin</text>
          <text x="392" y="210">buffer</text>
          <text x="392" y="236">Si substrate</text>
        </g>
      </svg>
    </div>
  )
}
