'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import { CardFace, CardRarity } from "./card-types";

type CardProps = {
  title: string;
  rarity?: CardRarity;
  start_face: CardFace;
  className?: string;
};

const rarityColors: Record<CardRarity, [string, string, string]> = {
  [CardRarity.S]: [
    "#e2c524",
    "linear-gradient(135deg, #f8e764 0%, #ECAC35 50%, #E8D548 100%)",
    "linear-gradient(90deg, #f8e764 -30%, #ECAC35 120%)",
  ],
  [CardRarity.A]: [
    "#36a2e0",
    "linear-gradient(135deg, #8FBBF5 0%, #096AD8 50%, #7BAEE8 100%)",
    "linear-gradient(135deg, #8FBBF5 -30%, #096AD8 120%)",
  ],
  [CardRarity.B]: [
    "#16A34A",
    "linear-gradient(135deg, #6FCF97 0%, #059669 50%, #4CAF8C 100%)",
    "linear-gradient(135deg, #6FCF97 -30%, #059669 120%)",
  ],
  [CardRarity.C]: [
    "#6B7280",
    "linear-gradient(135deg, #D1D5DB 0%, #4B5563 50%, #9CA3AF 100%)",
    "linear-gradient(135deg, #D1D5DB -30%, #4B5563 120%)",
  ],
};

export function CardWidget({ title, rarity = CardRarity.C, start_face: initial_face = CardFace.FRONT, className }: CardProps) {
  const [face, setFace] = useState(initial_face);

  useEffect(() => {
    setFace(initial_face);
  }, [initial_face]);

  return (
    <div className={['outline-none [perspective:100rem]', className].filter(Boolean).join(' ')}>
      <div className={[
          'relative size-full transition duration-500 [transform-style:preserve-3d]',
          'rounded-2xl shadow-[0_4px_6px_0_rgba(0,0,0,0.25)]',
        ].filter(Boolean).join(' ')} style={{ transform: face === CardFace.FRONT ? 'rotateY(0deg)' : 'rotateY(180deg)' }}>
        <div className="absolute inset-0 size-full [backface-visibility:hidden] rounded-2xl p-[10px]" style={{ background: rarityColors[rarity][1] }}>
          <div className={`flex flex-col h-full rounded-lg p-2 bg-blend-hard-light bg-[url('/cats/front_background.jpg')] bg-contain`} style={{ backgroundColor: rarityColors[rarity][0] }}>
            <div className="flex justify-between p-1 rounded-lg shadow-[0_2px_4px_0_rgba(0,0,0,0.25)]" style={{ "background": rarityColors[rarity][2] }}>
              <h2 className="text-[15px] font-bold text-white text-shadow-md">{title}</h2>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 size-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <Image
            src="/cats/back_cover.png"
            alt="Card Back Cover"
            fill
            className="object-cover rounded-2xl"
          />
        </div>
      </div>
    </div>
  );
};