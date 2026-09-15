'use client';

export default function DecorativeFooter() {
  return (
    <footer className="w-full pointer-events-none select-none">
      {/* Extremo inferior izquierdo (Olas institucionales fluidas grandes) */}
      <img
        src="/footer_left.png"
        alt=""
        className="fixed bottom-0 left-0 w-[300px] sm:w-[420px] md:w-[500px] lg:w-[580px] max-w-[45vw] h-auto object-contain object-left-bottom pointer-events-none z-0"
      />

      {/* Extremo inferior derecho (Olas y silueta de ajedrez grande) */}
      <img
        src="/footer_right.png"
        alt=""
        className="fixed bottom-0 right-0 w-[240px] sm:w-[340px] md:w-[420px] lg:w-[480px] max-w-[40vw] h-auto object-contain object-right-bottom pointer-events-none z-0"
      />
    </footer>
  );
}
