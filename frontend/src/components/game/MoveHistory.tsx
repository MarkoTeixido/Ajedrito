'use client';

import { useEffect, useRef } from 'react';
import { type MoveRecord } from '@/lib/api';

interface MoveHistoryProps {
  moves: MoveRecord[];
}

export default function MoveHistory({ moves }: MoveHistoryProps) {
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [moves]);

  return (
    <div className="flex flex-col gap-2 flex-1 min-h-0">
      <span className="text-xs font-bold text-[#4A5568] uppercase tracking-wider">
        Historial de jugadas
      </span>
      <div className="h-48 sm:h-56 w-full rounded-2xl border border-[#E2E8F0] bg-[#FAF9F5] shadow-inner overflow-hidden flex flex-col p-1">
        <div className="flex-1 overflow-y-auto pr-1.5 pl-1.5 py-1 font-mono text-xs ajedrito-scroll">
          {moves.length === 0 ? (
            <p className="text-[#94A3B8] text-center italic py-6 text-xs font-sans">
              Aún no hay jugadas
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {Array.from({ length: Math.ceil(moves.length / 2) }, (_, i) => {
                const white = moves[i * 2];
                const black = moves[i * 2 + 1];
                return (
                  <div
                    key={i + 1}
                    className="flex items-center justify-between px-2 py-1 rounded-md hover:bg-white transition text-xs"
                  >
                    <span className="text-[#94A3B8] w-6">{i + 1}.</span>
                    <span className="text-[#1E293B] font-semibold flex-1">
                      {white?.san ?? ''}
                    </span>
                    <span className="text-[#64748B] flex-1">
                      {black?.san ?? ''}
                    </span>
                  </div>
                );
              })}
              <div ref={historyEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
