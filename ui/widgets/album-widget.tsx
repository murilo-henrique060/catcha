'use client';

import { useState, useMemo } from "react";
import Image from "next/image";
import { FaSearch, FaCoins, FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";
import { TbCardsFilled } from "react-icons/tb";
import { CardWidget } from "./card";
import { CardFace, CardRarity } from "./card-types";

type AlbumWidgetProps = {
  username: string;
  initialCards: {
    quantity: number;
    cat: {
      id: number;
      name: string;
      rarity: string;
      image_path: string;
    };
  }[];
};

// Map card rarity string from database ('S' | 'A' | 'B' | 'C') to CardRarity enum
const mapRarity = (rarity: string): CardRarity => {
  switch (rarity) {
    case 'S': return CardRarity.S;
    case 'A': return CardRarity.A;
    case 'B': return CardRarity.B;
    default: return CardRarity.C;
  }
};

// Get mock value based on rarity
const getRarityValue = (rarity: string): number => {
  switch (rarity) {
    case 'S': return 1000;
    case 'A': return 500;
    case 'B': return 200;
    default: return 100;
  }
};

const rarityRank = { S: 4, A: 3, B: 2, C: 1 };

export function AlbumWidget({ username, initialCards }: AlbumWidgetProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"alpha" | "rarity" | "quantity">("rarity");
  const [sortAsc, setSortAsc] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(
    initialCards.length > 0 ? initialCards[0].cat.id : null
  );

  // Filter and Sort Cards
  const processedCards = useMemo(() => {
    let result = [...initialCards];

    // Filter by search query
    if (search.trim() !== "") {
      const query = search.toLowerCase();
      result = result.filter(c => c.cat.name.toLowerCase().includes(query));
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "alpha") {
        comparison = a.cat.name.localeCompare(b.cat.name);
      } else if (sortBy === "rarity") {
        const rankA = rarityRank[a.cat.rarity as keyof typeof rarityRank] || 0;
        const rankB = rarityRank[b.cat.rarity as keyof typeof rarityRank] || 0;
        comparison = rankA - rankB;
      } else if (sortBy === "quantity") {
        comparison = a.quantity - b.quantity;
      }

      return sortAsc ? comparison : -comparison;
    });

    return result;
  }, [initialCards, search, sortBy, sortAsc]);

  // Find currently selected card details
  const selectedCard = useMemo(() => {
    if (selectedCardId === null) return null;
    return initialCards.find(c => c.cat.id === selectedCardId) || null;
  }, [initialCards, selectedCardId]);

  // Handle selecting another card
  const handleSelectCard = (catId: number) => {
    setSelectedCardId(catId);
  };

  return (
    <div className="flex-grow flex flex-col">
      
      {/* Top Header & Filter Controls Row */}
      <div className="w-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-4 px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left Section: Title & Dropdown Filter Controls */}
        <div className="flex-grow flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:pr-6">
          <h2 className="text-[18px] font-extrabold italic uppercase tracking-wider text-[#B01070]">
            <span className="font-normal text-[15px] text-gray-500">Álbum de</span> {username}
          </h2>
          
          <div className="flex items-center gap-3">
            {/* Sort Direction Toggle */}
            <button
              type="button"
              onClick={() => setSortAsc(prev => !prev)}
              title={sortAsc ? "Ordem Crescente" : "Ordem Decrescente"}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#B01070] hover:bg-[#FF99D7] text-white shadow-sm transition-colors cursor-pointer"
            >
              {sortAsc ? <FaSortAmountUp className="text-[16px]" /> : <FaSortAmountDown className="text-[16px]" />}
            </button>

            {/* Sort Category Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSortMenu(prev => !prev)}
                className="flex h-11 items-center justify-between gap-2 rounded-xl bg-[#B01070] hover:bg-[#FF99D7] text-white px-4 font-bold text-[13px] uppercase tracking-wide shadow-sm transition-colors cursor-pointer select-none"
              >
                <span>
                  {sortBy === "alpha" && "Ordem Alfabética"}
                  {sortBy === "rarity" && "Ordem de Raridade"}
                  {sortBy === "quantity" && "Ordem de Quantidade"}
                </span>
                <svg className={`fill-current h-4 w-4 transition-transform duration-200 ${showSortMenu ? 'rotate-180' : ''}`} viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </button>

              {/* Custom Dropdown Menu Options */}
              {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                  <div className="absolute left-0 mt-2 z-20 w-52 bg-white rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.12)] border border-gray-100 py-2 flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy("alpha");
                        setShowSortMenu(false);
                      }}
                      className={[
                        "w-full text-left px-4 py-2.5 font-bold text-[12px] uppercase tracking-wide transition-colors cursor-pointer",
                        sortBy === "alpha" ? "text-[#B01070] bg-[#FCE8F4]/50" : "text-gray-700 hover:bg-gray-50 hover:text-[#B01070]"
                      ].join(" ")}
                    >
                      Ordem Alfabética
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy("rarity");
                        setShowSortMenu(false);
                      }}
                      className={[
                        "w-full text-left px-4 py-2.5 font-bold text-[12px] uppercase tracking-wide transition-colors cursor-pointer",
                        sortBy === "rarity" ? "text-[#B01070] bg-[#FCE8F4]/50" : "text-gray-700 hover:bg-gray-50 hover:text-[#B01070]"
                      ].join(" ")}
                    >
                      Ordem de Raridade
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy("quantity");
                        setShowSortMenu(false);
                      }}
                      className={[
                        "w-full text-left px-4 py-2.5 font-bold text-[12px] uppercase tracking-wide transition-colors cursor-pointer",
                        sortBy === "quantity" ? "text-[#B01070] bg-[#FCE8F4]/50" : "text-gray-700 hover:bg-gray-50 hover:text-[#B01070]"
                      ].join(" ")}
                    >
                      Ordem de Quantidade
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Vertical Separator */}
        <div className="hidden md:block w-px h-8 bg-gray-200" />

        {/* Right Section: Search bar */}
        <div className="relative md:w-[35%] flex-shrink-0">
          <span className="absolute inset-y-0 left-3.5 flex items-center text-gray-400">
            <FaSearch className="text-[14px]" />
          </span>
          <input
            type="text"
            placeholder="Buscar Carta"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#EAEAEA] border border-transparent focus:border-[#B01070]/30 focus:bg-white outline-none text-[14px] font-medium transition-all"
          />
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="relative w-full flex-grow flex flex-col">

        {/* Left Side: Cards Grid (Scrollable) */}
        <div className="w-full lg:absolute lg:left-0 lg:top-0 lg:bottom-0 lg:w-[calc(65%-20px)] h-auto lg:h-full overflow-y-auto custom-scrollbar p-4 pr-2 lg:pr-4">
          {processedCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[40vh] text-gray-400 gap-2">
              <TbCardsFilled className="text-[48px] text-gray-300" />
              <p className="text-[16px] font-bold">Nenhuma carta encontrada</p>
              <p className="text-[13px]">Tente ajustar a sua busca ou filtros.</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-6 p-1 pb-8">
              {processedCards.map((card) => {
                const isSelected = selectedCardId === card.cat.id;
                
                return (
                  <div
                    key={card.cat.id}
                    onClick={() => handleSelectCard(card.cat.id)}
                    className={[
                      "relative cursor-pointer transition-all hover:scale-105 duration-200 select-none",
                      isSelected ? "scale-105 drop-shadow-[0_0_8px_rgba(176,16,112,0.45)]" : ""
                    ].join(" ")}
                  >
                    <CardWidget
                      className="w-full aspect-[0.714]"
                      title={card.cat.name}
                      rarity={mapRarity(card.cat.rarity)}
                      start_face={CardFace.FRONT}
                      image_url={card.cat.image_path}
                    />

                    {/* Quantity Badge overlay on bottom center */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#B01070] px-2 text-[12px] font-bold text-white shadow-md">
                      {card.quantity}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Selected Card Panel (Fixed) */}
        <div className="w-full lg:absolute lg:right-0 lg:top-0 lg:bottom-0 lg:w-[calc(37%-10px)] h-auto lg:h-full flex flex-col items-center justify-start p-3 mt-6 lg:mt-0">
          {selectedCard ? (
            <div className="w-full h-full rounded-3xl bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex flex-col items-center justify-between gap-2">
              
              {/* LARGE 3D Card Widget */}
              <div className="flex-grow flex items-center justify-center w-full">
                <CardWidget
                  className="h-[calc(100vh-300px)] w-[calc((100vh-300px)*0.714)]"
                  title={selectedCard.cat.name}
                  rarity={mapRarity(selectedCard.cat.rarity)}
                  start_face={CardFace.FRONT}
                  image_url={selectedCard.cat.image_path}
                />
              </div>

              {/* Card Meta Details */}
              <div className="w-full flex flex-col items-center gap-3.5">
                
                {/* Cat Name */}
                <h3 className="text-[18px] font-extrabold italic uppercase tracking-wide text-gray-800">
                  {selectedCard.cat.name}
                </h3>

                {/* Info row */}
                <div className="flex items-center justify-center gap-8 w-full px-4">
                  
                  {/* Mock Sell Value */}
                  <div className="flex items-center gap-1.5" title="Valor estimado">
                    <FaCoins className="text-[16px] text-[#FFD54A] drop-shadow-sm" />
                    <span className="text-[14px] font-bold text-gray-600">
                      {getRarityValue(selectedCard.cat.rarity).toLocaleString("pt-BR")}
                    </span>
                  </div>

                  {/* Rarity Image Icon */}
                  <div className="flex items-center" title="Raridade">
                    <Image
                      src={`/rarity/${selectedCard.cat.rarity}.webp`}
                      alt={selectedCard.cat.rarity}
                      width={28}
                      height={28}
                      className="object-contain"
                    />
                  </div>

                  {/* Quantity Owned */}
                  <div className="flex items-center gap-1.5" title="Quantidade possuída">
                    <TbCardsFilled className="text-[16px] text-[#B01070]" />
                    <span className="text-[14px] font-bold text-gray-600">{selectedCard.quantity}</span>
                  </div>

                </div>
              </div>

            </div>
          ) : (
            <div className="w-full max-w-[420px] h-[calc(100vh-220px)] rounded-3xl bg-gray-50 border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 gap-2">
              <TbCardsFilled className="text-[48px] text-gray-300 animate-pulse" />
              <p className="text-[16px] font-bold">Nenhuma carta selecionada</p>
              <p className="text-[13px] px-8 text-center">Selecione uma carta no álbum ao lado para ver os detalhes.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
