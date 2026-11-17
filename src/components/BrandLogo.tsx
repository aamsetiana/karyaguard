export default function BrandLogo({
  className = "w-8 h-8",
  showGlow = true,
}: {
  className?: string;
  showGlow?: boolean;
}) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      {/* Dynamic Ambient Glow Pulse */}
      {showGlow && (
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/35 via-teal-400/25 to-cyan-500/20 rounded-2xl blur-md scale-110 pointer-events-none transition-transform duration-500 group-hover:scale-125" />
      )}

      {/* Modern Fluid Cyber-Biometric Emblem */}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-md"
      >
        <defs>
          {/* Outer Flow Gradient */}
          <linearGradient id="fluidFlow" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="45%" stopColor="#10B981" />
            <stop offset="80%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>

          {/* Core Energy Gradient */}
          <linearGradient id="innerEnergy" x1="16" y1="14" x2="32" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#A7F3D0" />
            <stop offset="50%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#0D9488" />
          </linearGradient>

          {/* Radial Backlight */}
          <radialGradient id="centerGlow" cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Backlight inside emblem */}
        <circle cx="24" cy="24" r="18" fill="url(#centerGlow)" />

        {/* Outer Aerodynamic Shield Fluid Ribbon */}
        <path
          d="M 24 5 
             C 32.5 5 40 10.5 41 19.5 
             C 42 28.5 35 37 24 43 
             C 13 37 6 28.5 7 19.5 
             C 8 10.5 15.5 5 24 5 Z"
          fill="url(#fluidFlow)"
          fillOpacity="0.14"
          stroke="url(#fluidFlow)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dynamic Sweeping Biometric Wings (Fluid Ribbon) */}
        <path
          d="M 14 18 
             C 14 13 18.5 9.5 24 9.5 
             C 29.5 9.5 34 13 34 18 
             C 34 25 27 31 24 35 
             C 21 31 14 25 14 18 Z"
          stroke="url(#innerEnergy)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="2 0.5"
        />

        {/* Interlocking Orbital Node (Modern Guardian Iris) */}
        <path
          d="M 18 24.5 
             C 18 20.5 20.5 17.5 24 17.5 
             C 27.5 17.5 30 20.5 30 24.5 
             C 30 28 27.5 30.5 24 30.5 
             C 20.5 30.5 18 28 18 24.5 Z"
          fill="#090D16"
          stroke="url(#fluidFlow)"
          strokeWidth="1.8"
        />

        {/* Center Sparkling Biometric Pulse Core */}
        <circle cx="24" cy="24.5" r="3.2" fill="url(#innerEnergy)" />
        <circle cx="24" cy="24.5" r="1.4" fill="#FFFFFF" />

        {/* Fluid Apex Satellite Node (Radar Pulse) */}
        <circle cx="24" cy="9.5" r="2" fill="#34D399" />
        <circle cx="41" cy="19.5" r="1.5" fill="#06B6D4" opacity="0.8" />
        <circle cx="7" cy="19.5" r="1.5" fill="#10B981" opacity="0.8" />
      </svg>
    </div>
  );
}
