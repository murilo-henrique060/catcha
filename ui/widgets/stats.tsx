'use client';

import Image from "next/image";
import { useUser } from "@/lib/contexts/UserContext";

type StatsWidgetProps = {
  rarityTotals: {
    S: number;
    A: number;
    B: number;
    C: number;
  };
};

const RARITY_CHANCES = {
  S: 0.05,
  A: 0.15,
  B: 0.30,
  C: 0.50,
};

export function StatsWidget({ rarityTotals }: StatsWidgetProps) {
  const { cards } = useUser();

  const ownedCounts = { S: 0, A: 0, B: 0, C: 0 };
  cards.forEach((userCard) => {
    const rarity = userCard.cat.rarity as 'S' | 'A' | 'B' | 'C';
    if (userCard.quantity > 0 && rarity in ownedCounts) {
      ownedCounts[rarity]++;
    }
  });

  const rarities: ('S' | 'A' | 'B' | 'C')[] = ['S', 'A', 'B', 'C'];

  const formatChance = (val: number) => {
    if (val === 0) return "0%";
    return val % 1 === 0 ? `${val}%` : `${val.toFixed(1)}%`;
  };

  return (
    <div className="w-full bg-white rounded-l-lg text-center shadow-[0_4px_6px_0_rgba(0,0,0,0.25)] overflow-hidden">
      {/* Header Container */}
      <div className="bg-[linear-gradient(90deg,#C40873_2.02%,#B01070_78.46%,#8C1D6B_99.58%)] px-4 py-4 text-left">
        <h2 className="text-[20px] font-bold italic uppercase tracking-wider text-white">
          Estatísticas
        </h2>
      </div>

      {/* Rarity List */}
      <div className="p-6 flex flex-col gap-6">
        {rarities.map((rarity) => {
          const total = rarityTotals[rarity] || 0;
          const owned = ownedCounts[rarity] || 0;
          
          // Chance of drawing a new card of this rarity
          const chance = total > 0 
            ? RARITY_CHANCES[rarity] * ((total - owned) / total) * 100 
            : 0;

          return (
            <div key={rarity} className="flex items-center justify-between w-full">
              {/* Left Side: Rarity Icon + Fraction */}
              <div className="flex items-center gap-2">
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <Image 
                    src={`/rarity/${rarity}.webp`} 
                    alt={rarity} 
                    width={30} 
                    height={30}
                    className="object-contain"
                  />
                </div>
                <span>
                  <span className="text-[18px] font-bold text-[#B01070]">
                    {owned}
                  </span>
                  <span className="text-[12px] text-[#B01070]"> 
                    /{total}
                  </span>
                </span>
              </div>

              {/* Middle: Dotted Line */}
              <div className="flex-grow mx-4 border-b border-dotted border-[#B01070] h-[1px]" />

              {/* Right Side: Percentage */}
              <span className="text-[16px] font-bold text-[#B01070]">
                {formatChance(chance)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
