'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import { CardFace, CardRarity } from "./card-types";

type CardProps = {
  title: string;
  rarity?: CardRarity;
  start_face: CardFace;
  image_url?: string;
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

export function CardWidget({ title, rarity = CardRarity.C, start_face: initial_face = CardFace.FRONT, image_url, className }: CardProps) {
  const [face, setFace] = useState(initial_face);

  useEffect(() => {
    Promise.resolve().then(() => {
      setFace(initial_face);
    });
  }, [initial_face]);

  return (
    <div 
      className={['outline-none [perspective:100rem]', className].filter(Boolean).join(' ')}
      style={{ containerType: 'inline-size' }}
    >
      <div 
        className={[
          'relative size-full transition duration-500 [transform-style:preserve-3d]',
          'shadow-[0_4cqw_6cqw_0_rgba(0,0,0,0.25)]',
        ].filter(Boolean).join(' ')} 
        style={{ 
          transform: face === CardFace.FRONT ? 'rotateY(0deg)' : 'rotateY(180deg)',
          borderRadius: '5cqw'
        }}
      >
        {/* FRONT FACE */}
        <div 
          className="absolute inset-0 size-full [backface-visibility:hidden] p-[3.5cqw]" 
          style={{ 
            background: rarityColors[rarity][1],
            borderRadius: '5cqw'
          }}
        >
          <div 
            className="flex flex-col h-full bg-blend-hard-light bg-[url('/cats/front_background.jpg')] bg-contain" 
            style={{ 
              backgroundColor: rarityColors[rarity][0],
              borderRadius: '2.5cqw'
            }}
          >
            <div 
              className="flex flex-col h-full p-[2.5cqw]" 
              style={{ 
                backgroundImage: `url(${image_url ?? '/cats/cat001.webp'})`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center',
                borderRadius: '2.5cqw'
              }}
            >
              <div 
                className="flex justify-between py-[2.5cqw] px-[4cqw] shadow-[0_0.8cqw_1.6cqw_0_rgba(0,0,0,0.25)]" 
                style={{ 
                  background: rarityColors[rarity][2],
                  borderRadius: '2.5cqw'
                }}
              >
                <h2 
                  className="font-bold text-white text-shadow-md leading-none"
                  style={{ fontSize: '7.5cqw' }}
                >
                  {title}
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* BACK FACE */}
        <div 
          className="absolute inset-0 size-full [backface-visibility:hidden] [transform:rotateY(180deg)]"
          style={{ borderRadius: '5cqw' }}
        >
          <Image
            src="/cats/back_cover.webp"
            alt="Card Back Cover"
            fill
            className="object-cover"
            style={{ borderRadius: '5cqw' }}
          />
        </div>
      </div>
    </div>
  );
}