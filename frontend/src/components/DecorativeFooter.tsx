'use client';

export default function DecorativeFooter() {
  return (
    <footer className="w-full pointer-events-none select-none overflow-hidden" aria-hidden="true">
      {/* Extremo inferior izquierdo (Olas institucionales fluidas a color completo y con presencia) */}
      <img
        src="https://i.imgur.com/OkXiCty.png"
        alt=""
        className="fixed bottom-0 left-0 w-[260px] sm:w-[380px] md:w-[480px] lg:w-[600px] max-w-[55vw] sm:max-w-[45vw] h-auto object-contain object-left-bottom pointer-events-none z-0"
      />

      {/* Extremo inferior derecho (Olas y silueta de ajedrez a color completo y con presencia) */}
      <img
        src="https://i.imgur.com/kSDVcZn.png"
        alt=""
        className="fixed bottom-0 right-0 w-[220px] sm:w-[320px] md:w-[420px] lg:w-[500px] max-w-[50vw] sm:max-w-[40vw] h-auto object-contain object-right-bottom pointer-events-none z-0"
      />
    </footer>
  );
}
