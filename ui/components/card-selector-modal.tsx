'use client';

import { FaTimes, FaSearch, FaExclamationCircle } from "react-icons/fa";
import { useUser } from "@/lib/contexts/UserContext";
import { useState, useMemo } from "react";
import { CardWidget } from "@/ui/widgets/card";
import { CardFace, CardRarity } from "@/ui/widgets/card-types";

type CardSelectorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (catId: number) => void;
  title: string;
  rarityFilter?: string; // If provided, only allows selecting cards of this rarity
};

const mapRarity = (rarity: string): CardRarity => {
  switch (rarity) {
    case 'S': return CardRarity.S;
    case 'A': return CardRarity.A;
    case 'B': return CardRarity.B;
    default: return CardRarity.C;
  }
};

export function CardSelectorModal({ isOpen, onClose, onSelect, title, rarityFilter }: CardSelectorModalProps) {
  const { cards } = useUser();
  const [search, setSearch] = useState("");

  const filteredCards = useMemo(() => {
    return cards.filter(c => {
      // Must have quantity > 0
      if (c.quantity < 1) return false;
      // Must match rarity if filter is applied
      if (rarityFilter && c.cat.rarity !== rarityFilter) return false;
      // Must match search
      if (search.trim() !== "" && !c.cat.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [cards, search, rarityFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-[800px] bg-white rounded-3xl shadow-2xl flex flex-col h-[80vh] max-h-[800px] animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-[20px] font-extrabold italic uppercase tracking-wider text-[#B01070]">
              {title}
            </h2>
            {rarityFilter && (
              <p className="text-[13px] text-gray-500 font-medium mt-1">
                Atenção: Você deve selecionar uma carta de raridade <strong className="text-[#B01070]">{rarityFilter}</strong>.
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="text-[20px]" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-sm mx-auto">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-gray-400">
              <FaSearch className="text-[14px]" />
            </span>
            <input
              type="text"
              placeholder="Buscar pelo nome da carta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-gray-200 focus:border-[#B01070] outline-none text-[14px] font-medium transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Grid Area */}
        <div className="flex-grow overflow-y-auto p-6 bg-gray-50/30">
          {filteredCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <FaExclamationCircle className="text-[48px] text-gray-300" />
              <p className="text-[16px] font-bold text-center">
                {rarityFilter 
                  ? `Você não possui cartas repetidas da raridade ${rarityFilter}.` 
                  : "Nenhuma carta encontrada em seu inventário."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-6 p-1 pb-8">
              {filteredCards.map((c) => (
                <div 
                  key={c.cat.id}
                  onClick={() => onSelect(c.cat.id)}
                  className="relative cursor-pointer transition-all hover:scale-105 hover:drop-shadow-[0_0_8px_rgba(176,16,112,0.45)] duration-200 select-none group"
                >
                  <CardWidget
                    className="w-full aspect-[0.714]"
                    title={c.cat.name}
                    rarity={mapRarity(c.cat.rarity)}
                    start_face={CardFace.FRONT}
                    image_url={c.cat.image_path}
                  />
                  {/* Quantity Badge overlay on bottom center */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#B01070] px-2 text-[12px] font-bold text-white shadow-md">
                    {c.quantity}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
