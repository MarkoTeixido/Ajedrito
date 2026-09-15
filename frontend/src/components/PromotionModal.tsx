'use client';

interface PromotionModalProps {
  color: 'white' | 'black';
  onSelect: (piece: 'q' | 'r' | 'b' | 'n') => void;
  onCancel?: () => void;
}

export default function PromotionModal({ color, onSelect }: PromotionModalProps) {
  const pieces: Array<{ key: 'q' | 'r' | 'b' | 'n'; label: string; symbol: string }> = [
    { key: 'q', label: 'Dama', symbol: color === 'white' ? '♕' : '♛' },
    { key: 'r', label: 'Torre', symbol: color === 'white' ? '♖' : '♜' },
    { key: 'b', label: 'Alfil', symbol: color === 'white' ? '♗' : '♝' },
    { key: 'n', label: 'Caballo', symbol: color === 'white' ? '♘' : '♞' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-3xl border border-[#E5E7EB] bg-white p-6 sm:p-7 shadow-2xl flex flex-col items-center gap-5 text-center">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
            Coronación
          </span>
          <h3 className="font-serif-title text-xl font-bold text-[#1C3026]">
            Elegí una pieza
          </h3>
        </div>

        <div className="grid grid-cols-4 gap-2.5 w-full">
          {pieces.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => onSelect(p.key)}
              className="flex flex-col items-center justify-center py-3 px-1 rounded-2xl border border-[#E2E8F0] bg-[#FAF9F5] hover:bg-[#F0EEE6] hover:border-[#233E31] transition-all cursor-pointer active:scale-95 group shadow-2xs"
            >
              <span
                className="text-4xl sm:text-5xl leading-none select-none my-1 transition-transform group-hover:scale-110"
                style={{
                  fontFamily: "'Noto Serif', 'Georgia', serif",
                  color: color === 'white' ? '#233E31' : '#1A202C',
                }}
              >
                {p.symbol}
              </span>
              <span className="text-xs font-bold text-[#233E31] mt-1">
                {p.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
