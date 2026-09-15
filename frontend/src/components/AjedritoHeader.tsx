'use client';

export default function AjedritoHeader() {

  return (
    <header className="w-full flex items-center justify-between pt-4 sm:pt-5 pb-1 px-6 sm:px-12 md:px-16 max-w-[1440px] mx-auto flex-shrink-0 z-10">
      {/* Lado izquierdo: Logo Ajedrito (incluye ícono y nombre integrados) */}
      <div className="flex items-center">
        <img
          src="/logo.png"
          alt="Ajedrito"
          className="h-16 sm:h-20 md:h-24 w-auto object-contain drop-shadow-xs"
        />
      </div>

      {/* Lado derecho: Universidad Nacional de Villa Mercedes */}
      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
        {/* Escudo oficial UNVIME con presencia equivalente al logo principal */}
        <img
          src="/logo_unvime.png"
          alt="UNVIME - Universidad Nacional de Villa Mercedes"
          className="h-16 sm:h-20 md:h-24 w-auto object-contain drop-shadow-xs"
        />

        {/* Texto UNVIME con efecto sutil y elegante de transparencia */}
        <div className="flex flex-col text-left opacity-70 hover:opacity-90 transition-opacity select-none">
          <span className="text-[11px] sm:text-xs md:text-[13px] font-semibold text-[#1C3026] tracking-widest leading-tight uppercase">
            Universidad Nacional
          </span>
          <span className="text-[10px] sm:text-[11px] md:text-xs font-medium text-[#2D3748] tracking-widest leading-tight uppercase">
            de Villa Mercedes
          </span>
        </div>
      </div>
    </header>
  );
}
