"use client";

import Image from "next/image";
import { useState, useMemo, useEffect } from "react";
import { FaCoins, FaSearch, FaArrowLeft, FaSortAmountUp, FaSortAmountDown, FaArrowDown, FaArrowUp } from "react-icons/fa";
import { HiChevronDoubleRight } from "react-icons/hi";
import { TbCardsFilled } from "react-icons/tb";
import { CardWidget } from "./card";
import { CardFace, CardRarity } from "./card-types";
import { useUser } from "@/lib/contexts/UserContext";
import { buyCat, sellCat } from "@/lib/controllers/CardActions";
import { buyAccelerationItem } from "@/lib/controllers/ShopController";

type ShopWidgetProps = {
  allCats: {
    id: number;
    name: string;
    rarity: string;
    image_path: string;
  }[];
};

const mapRarity = (rarity: string): CardRarity => {
  switch (rarity) {
    case "S": return CardRarity.S;
    case "A": return CardRarity.A;
    case "B": return CardRarity.B;
    default: return CardRarity.C;
  }
};

export function ShopWidget({ allCats }: ShopWidgetProps) {
  const { profile, cards, items, refreshProfile } = useUser();
  
  // Navigation State
  // "menu" | "buy_cats" | "sell_cats"
  const [currentView, setCurrentView] = useState<"menu" | "buy_cats" | "sell_cats">("menu");
  
  // Selected option in the main menu
  // "buy_cats" | "sell_cats" | "buy_items"
  const [selectedMenuOption, setSelectedMenuOption] = useState<"buy_cats" | "sell_cats" | "buy_items">("buy_cats");

  // Grid selection
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);

  // Search & Filter States
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"alpha" | "rarity">("rarity");
  const [sortAsc, setSortAsc] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Modal States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [successCat, setSuccessCat] = useState<{ name: string; rarity: string; image_path: string } | null>(null);
  const [buyItemQuantity, setBuyItemQuantity] = useState(0);

  const maxQuantity = profile ? Math.floor(profile.money / 100) : 0;

  // Reset page-level selection and quantity when switching views or options
  useEffect(() => {
    Promise.resolve().then(() => {
      setSelectedCatId(null);
      setSearch("");
      const initialQty = profile ? (Math.floor(profile.money / 100) >= 1 ? 1 : 0) : 0;
      setBuyItemQuantity(initialQty);
    });
  }, [currentView, selectedMenuOption, profile]);

  // Adjust quantity if user money changes
  useEffect(() => {
    if (profile) {
      const maxQty = Math.floor(profile.money / 100);
      if (buyItemQuantity > maxQty) {
        setBuyItemQuantity(maxQty);
      }
    }
  }, [profile, buyItemQuantity]);

  // Compute quantity of each card owned
  const cardsOwnedMap = useMemo(() => {
    const map = new Map<number, number>();
    cards.forEach((c) => {
      map.set(c.cat.id, c.quantity);
    });
    return map;
  }, [cards]);

  // Price references
  const getCatPrice = (rarity: string) => {
    switch (rarity) {
      case "S": return 1000;
      case "A": return 500;
      case "B": return 200;
      default: return 100;
    }
  };

  // Skip item quantity in inventory
  const accelerationCount = useMemo(() => {
    const itemObj = items.find((i) => i.item.type === "skip" || i.item.name === "Acelerar");
    return itemObj ? itemObj.quantity : 0;
  }, [items]);

  // Handle Menu SELECT button click
  const handleMenuSelect = () => {
    if (selectedMenuOption === "buy_cats") {
      setCurrentView("buy_cats");
    } else if (selectedMenuOption === "sell_cats") {
      setCurrentView("sell_cats");
    } else if (selectedMenuOption === "buy_items") {
      // Direct confirm modal for skip items
      setShowConfirmModal(true);
    }
  };

  // Get selected cat details in Buy/Sell screen
  const selectedCat = useMemo(() => {
    if (selectedCatId === null) return null;
    return allCats.find((c) => c.id === selectedCatId) || null;
  }, [selectedCatId, allCats]);

  // Processed grid items (filtered & sorted)
  const processedCats = useMemo(() => {
    let result = [...allCats];

    // If selling, only show cats owned by the user
    if (currentView === "sell_cats") {
      result = result.filter((c) => (cardsOwnedMap.get(c.id) || 0) > 0);
    }

    // Filter by search
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q));
    }

    // Sort
    const rarityRank: Record<string, number> = { S: 4, A: 3, B: 2, C: 1 };
    result.sort((a, b) => {
      let comp = 0;
      if (sortBy === "alpha") {
        comp = a.name.localeCompare(b.name);
      } else {
        comp = (rarityRank[a.rarity] || 0) - (rarityRank[b.rarity] || 0);
      }
      return sortAsc ? comp : -comp;
    });

    return result;
  }, [currentView, allCats, cardsOwnedMap, search, sortBy, sortAsc]);

  // Select first cat by default when opening Buy/Sell screen
  useEffect(() => {
    if (currentView !== "menu" && processedCats.length > 0 && selectedCatId === null) {
      Promise.resolve().then(() => {
        setSelectedCatId(processedCats[0].id);
      });
    }
  }, [currentView, processedCats, selectedCatId]);

  // Execute buy/sell action
  const handleConfirmAction = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      if (currentView === "buy_cats" && selectedCatId !== null) {
        const res = await buyCat(selectedCatId);
        if (res.error) {
          setErrorMessage(res.error);
        } else {
          setSuccessMessage(`Você obteve ${res.cat?.name}!`);
          setSuccessCat(res.cat || null);
          setShowConfirmModal(false);
          setShowSuccessModal(true);
          await refreshProfile();
        }
      } else if (currentView === "sell_cats" && selectedCatId !== null && selectedCat) {
        const res = await sellCat(selectedCatId);
        if (res.error) {
          setErrorMessage(res.error);
        } else {
          setSuccessMessage(`Você vendeu ${selectedCat.name} por 💰 ${getCatPrice(selectedCat.rarity)}!`);
          setSuccessCat(selectedCat);
          setShowConfirmModal(false);
          setShowSuccessModal(true);
          setSelectedCatId(null); // Reset selection
          await refreshProfile();
        }
      } else if (currentView === "menu" && selectedMenuOption === "buy_items") {
        const res = await buyAccelerationItem(buyItemQuantity);
        if (res.error) {
          setErrorMessage(res.error);
        } else {
          setSuccessMessage(`Você obteve ${buyItemQuantity} ${buyItemQuantity === 1 ? "Aceleração" : "Acelerações"} de Sorteio!`);
          setSuccessCat(null);
          setShowConfirmModal(false);
          setShowSuccessModal(true);
          setBuyItemQuantity(1); // Reset
          await refreshProfile();
        }
      }
    } catch (e) {
      console.error(e);
      setErrorMessage("Erro ao processar a operação");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={["flex-grow flex flex-col select-none", currentView === "menu" ? "mx-auto w-full px-4 pt-3" : ""].filter(Boolean).join(" ")}>
      
      {/* Top Header & Filter Controls Row */}
      {currentView !== "menu" && (
        <div className="w-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-4 px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Left Section: Back link */}
          <div className="flex-grow flex items-center justify-between gap-4 md:pr-6">
            <button
              onClick={() => setCurrentView("menu")}
              className="flex items-center gap-2 text-[#B01070] font-extrabold italic uppercase tracking-wide hover:text-[#FF99D7] transition-colors cursor-pointer text-[16px]"
            >
              <FaArrowLeft />
              {currentView === "buy_cats" ? "Comprar Gato" : "Vender Gato"}
            </button>

            {/* Conditional filter dropdowns inside sub-screens */}
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

              {/* Custom Sort Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSortMenu(prev => !prev)}
                  className="flex h-11 items-center justify-between gap-2 rounded-xl bg-[#B01070] hover:bg-[#FF99D7] text-white px-4 font-bold text-[13px] uppercase tracking-wide shadow-sm transition-colors cursor-pointer select-none"
                >
                  <span>
                    {sortBy === "alpha" ? "Ordem Alfabética" : "Ordem de Raridade"}
                  </span>
                  <svg className={`fill-current h-4 w-4 transition-transform duration-200 ${showSortMenu ? 'rotate-180' : ''}`} viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </button>

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
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Section: Search bar */}
          <div className="hidden md:block w-px h-8 bg-gray-200" />
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
      )}

      {/* Main Content Layout */}
      <div className={[
        "relative w-full flex-grow flex flex-col",
      ].join(" ")}>
        
        {/* Left Column: Menu list OR Cat grids */}
        <div className={["w-full lg:absolute lg:left-0 lg:top-0 lg:bottom-0 h-auto lg:h-full overflow-y-auto custom-scrollbar", currentView === "menu" ? "lg:w-[calc(65%-12px)] p-1 pr-2 lg:pr-4" : "lg:w-[calc(65%-20px)] p-4 pr-2 lg:pr-4"].join(" ")}>
          
          {currentView === "menu" ? (
            /* ================= MENU VIEW ================= */
            <div className="flex flex-col gap-6 pb-6">
              
              {/* GATOS section */}
              <div className="flex flex-col gap-2.5">
                <h3 className="text-[13px] font-extrabold italic uppercase tracking-wider text-[#B01070] px-1">
                  GATOS
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Option Buy Cats */}
                  <div
                    onClick={() => setSelectedMenuOption("buy_cats")}
                    className={[
                      "relative h-32 rounded-2xl bg-white border cursor-pointer flex flex-col items-center justify-center gap-2.5 transition-all hover:scale-102 hover:shadow-md",
                      selectedMenuOption === "buy_cats" 
                        ? "border-2 border-[#B01070] shadow-md scale-102" 
                        : "border-gray-200 shadow-sm"
                    ].join(" ")}
                  >
                    <div className="w-12 h-14 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center text-gray-400 relative">
                      <TbCardsFilled className="text-[24px] text-gray-300" />
                      <FaArrowDown className="absolute -bottom-0.5 -right-0.5 text-red-500 text-[13px]" />
                    </div>
                    <span className="text-[13px] font-bold uppercase text-gray-700 tracking-wider">Comprar</span>
                  </div>

                  {/* Option Sell Cats */}
                  <div
                    onClick={() => setSelectedMenuOption("sell_cats")}
                    className={[
                      "relative h-32 rounded-2xl bg-white border cursor-pointer flex flex-col items-center justify-center gap-2.5 transition-all hover:scale-102 hover:shadow-md",
                      selectedMenuOption === "sell_cats" 
                        ? "border-2 border-[#B01070] shadow-md scale-102" 
                        : "border-gray-200 shadow-sm"
                    ].join(" ")}
                  >
                    <div className="w-12 h-14 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center text-gray-400 relative">
                      <TbCardsFilled className="text-[24px] text-gray-300" />
                      <FaArrowUp className="absolute -bottom-0.5 -right-0.5 text-green-500 text-[13px]" />
                    </div>
                    <span className="text-[13px] font-bold uppercase text-gray-700 tracking-wider">Vender</span>
                  </div>
                </div>
              </div>

              {/* ITENS section */}
              <div className="flex flex-col gap-2.5">
                <h3 className="text-[13px] font-extrabold italic uppercase tracking-wider text-[#B01070] px-1">
                  ITENS
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Option Acceleration Item */}
                  <div
                    onClick={() => setSelectedMenuOption("buy_items")}
                    className={[
                      "relative h-32 rounded-2xl bg-white border cursor-pointer flex flex-col items-center justify-center gap-2.5 transition-all hover:scale-102 hover:shadow-md",
                      selectedMenuOption === "buy_items" 
                        ? "border-2 border-[#B01070] shadow-md scale-102" 
                        : "border-gray-200 shadow-sm"
                    ].join(" ")}
                  >
                    <div className="w-12 h-12 bg-white border border-[#B01070]/20 rounded-xl flex items-center justify-center text-white relative shadow-sm bg-gradient-to-tr from-[#9F267B] to-[#E10B83]">
                      <HiChevronDoubleRight className="text-[24px]" />
                    </div>
                    <span className="text-[13px] font-bold uppercase text-gray-700 tracking-wider text-center px-4 leading-tight">
                      Aceleração de Sorteio
                    </span>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* ================= GRID LIST VIEW ================= */
            processedCats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[40vh] text-gray-400 gap-2">
                <TbCardsFilled className="text-[48px] text-gray-300" />
                <p className="text-[16px] font-bold">Nenhum gato disponível</p>
                <p className="text-[13px]">Ajuste a sua busca ou filtros.</p>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-6 p-1 pb-8">
                {processedCats.map((card) => {
                  const isSelected = selectedCatId === card.id;
                  const owned = cardsOwnedMap.get(card.id) || 0;
                  
                  return (
                    <div
                      key={card.id}
                      onClick={() => setSelectedCatId(card.id)}
                      className={[
                        "relative cursor-pointer transition-all hover:scale-105 duration-200 select-none",
                        isSelected ? "scale-105 drop-shadow-[0_0_8px_rgba(176,16,112,0.45)]" : ""
                      ].join(" ")}
                    >
                      <CardWidget
                        className="w-full aspect-[0.714]"
                        title={card.name}
                        rarity={mapRarity(card.rarity)}
                        start_face={CardFace.FRONT}
                        image_url={card.image_path}
                      />

                      {/* Quantity Badge overlay on bottom center */}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#B01070] px-2 text-[12px] font-bold text-white shadow-md">
                        {owned}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Right Side: Selected Card Panel (Fixed) */}
        <div className={["w-full lg:absolute lg:right-0 lg:top-0 lg:bottom-0 h-auto lg:h-full flex flex-col items-center justify-start p-3 mt-6 lg:mt-0", currentView === "menu" ? "lg:w-[calc(35%-12px)]" : "lg:w-[calc(37%-10px)]"].join(" ")}>
          
          {currentView === "menu" ? (
            /* ================= MENU RIGHT SIDE PREVIEW ================= */
            <div className="w-full h-full rounded-3xl bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex flex-col items-center justify-between gap-4">
              
              <div className="flex-grow flex flex-col items-center justify-center w-full gap-4">
                {selectedMenuOption === "buy_cats" && (
                  <>
                    <div className="w-40 h-56 bg-gray-50 border border-dashed border-gray-300 rounded-3xl flex items-center justify-center relative shadow-[inset_0_2px_8px_rgba(0,0,0,0.03)]">
                      <TbCardsFilled className="text-[64px] text-gray-200 animate-pulse" />
                      <FaArrowDown className="absolute bottom-2 right-2 text-red-500 text-[24px]" />
                    </div>
                    <h3 className="text-[20px] font-extrabold italic uppercase tracking-wide text-gray-800">
                      Comprar Gato
                    </h3>
                    <p className="text-gray-500 text-center text-[13px] px-6">
                      Adquira novos gatos diretamente na loja utilizando suas moedas acumuladas.
                    </p>
                  </>
                )}

                {selectedMenuOption === "sell_cats" && (
                  <>
                    <div className="w-40 h-56 bg-gray-50 border border-dashed border-gray-300 rounded-3xl flex items-center justify-center relative shadow-[inset_0_2px_8px_rgba(0,0,0,0.03)]">
                      <TbCardsFilled className="text-[64px] text-gray-200 animate-pulse" />
                      <FaArrowUp className="absolute bottom-2 right-2 text-green-500 text-[24px]" />
                    </div>
                    <h3 className="text-[20px] font-extrabold italic uppercase tracking-wide text-gray-800">
                      Vender Gato
                    </h3>
                    <p className="text-gray-500 text-center text-[13px] px-6">
                      Venda suas cartas duplicadas de volta para a loja para conseguir moedas extras.
                    </p>
                  </>
                )}

                {selectedMenuOption === "buy_items" && (
                  <>
                    <div className="w-40 h-40 bg-white border border-[#B01070]/20 rounded-[28px] flex items-center justify-center text-white relative shadow-[0_10px_25px_rgba(176,16,112,0.2)] bg-gradient-to-tr from-[#9F267B] to-[#E10B83]">
                      <HiChevronDoubleRight className="text-[64px]" />
                    </div>
                    <h3 className="text-[20px] font-extrabold italic uppercase tracking-wide text-gray-800">
                      Aceleração de Sorteio
                    </h3>
                    <p className="text-gray-500 text-center text-[13px] px-6">
                      Compre itens para pular o tempo de cooldown de sorteio instantaneamente!
                    </p>
                    <div className="flex items-center gap-6 mt-1">
                      <div className="flex items-center gap-1.5" title="Preço unitário">
                        <FaCoins className="text-[18px] text-[#FFD54A] drop-shadow-sm" />
                        <span className="text-[16px] font-bold text-gray-600">100</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Quantidade possuída">
                        <HiChevronDoubleRight className="text-[18px] text-[#B01070]" />
                        <span className="text-[16px] font-bold text-gray-600">{accelerationCount}</span>
                      </div>
                    </div>
                    {/* Quantity selector (tightened layout) */}
                    <div className="flex items-center justify-between gap-4 mt-3 w-full px-4 py-2 bg-gray-50/50 rounded-xl border border-gray-100/60">
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="text-gray-400 text-[10px] font-extrabold uppercase tracking-wider leading-none">Quantidade</span>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[11px] text-gray-450 font-bold uppercase">Total:</span>
                          <div className="flex items-center gap-0.5 font-extrabold text-[13px] text-[#B01070]">
                            <FaCoins className="text-[13px] text-[#FFD54A] drop-shadow-sm" />
                            <span>{(buyItemQuantity * 100).toLocaleString("pt-BR")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 bg-white border border-gray-200/80 rounded-full p-1 shadow-sm w-32">
                        <button
                          type="button"
                          disabled={buyItemQuantity <= 0}
                          onClick={() => setBuyItemQuantity(prev => Math.max(0, prev - 1))}
                          className="w-7 h-7 rounded-full bg-[#B01070] text-white flex items-center justify-center font-black text-[14px] transition-all hover:bg-[#FF99D7] active:scale-95 cursor-pointer select-none disabled:opacity-30 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
                        >
                          -
                        </button>
                        <span className="font-extrabold text-[16px] text-gray-800 select-none min-w-[14px] text-center">{buyItemQuantity}</span>
                        <button
                          type="button"
                          disabled={buyItemQuantity >= maxQuantity}
                          onClick={() => setBuyItemQuantity(prev => prev + 1)}
                          className="w-7 h-7 rounded-full bg-[#B01070] text-white flex items-center justify-center font-black text-[14px] transition-all hover:bg-[#FF99D7] active:scale-95 cursor-pointer select-none disabled:opacity-30 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </>
                )}
                {/* Actions select button */}
                <button
                  onClick={handleMenuSelect}
                  disabled={selectedMenuOption === "buy_items" && buyItemQuantity === 0}
                  className="w-full py-3.5 rounded-2xl bg-[#B01070] hover:bg-[#FF99D7] text-white font-extrabold italic uppercase tracking-wider text-[14px] shadow-md transition-colors cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  SELECIONAR
                </button>
              </div>
            </div>
          ) : (
            /* ================= SUB-GRID RIGHT SIDE PREVIEW ================= */
            selectedCat ? (
              <div className="w-full h-full rounded-3xl bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col items-center justify-between gap-2">
                
                {/* LARGE 3D Card Widget */}
                <div className="flex-grow flex items-center justify-center w-full">
                  <CardWidget
                    className="h-[calc(100vh-360px)] w-[calc((100vh-360px)*0.714)]"
                    title={selectedCat.name}
                    rarity={mapRarity(selectedCat.rarity)}
                    start_face={CardFace.FRONT}
                    image_url={selectedCat.image_path}
                  />
                </div>

                {/* Card Meta Details */}
                <div className="w-full flex flex-col items-center gap-3.5">
                  <h3 className="text-[18px] font-extrabold italic uppercase tracking-wide text-gray-800">
                    {selectedCat.name}
                  </h3>

                  {/* Info row */}
                  <div className="flex items-center justify-center gap-8 w-full px-4">
                    {/* Price Tag */}
                    <div className="flex items-center gap-1.5" title="Valor estimado">
                      <FaCoins className="text-[16px] text-[#FFD54A] drop-shadow-sm" />
                      <span className="text-[14px] font-bold text-gray-600">
                        {getCatPrice(selectedCat.rarity).toLocaleString("pt-BR")}
                      </span>
                    </div>

                    {/* Rarity Image Icon */}
                    <div className="flex items-center" title="Raridade">
                      <Image
                        src={`/rarity/${selectedCat.rarity}.webp`}
                        alt={selectedCat.rarity}
                        width={28}
                        height={28}
                        className="object-contain"
                      />
                    </div>

                    {/* Quantity Owned */}
                    <div className="flex items-center gap-1.5" title="Quantidade possuída">
                      <TbCardsFilled className="text-[16px] text-[#B01070]" />
                      <span className="text-[14px] font-bold text-gray-600">
                        {cardsOwnedMap.get(selectedCat.id) || 0}
                      </span>
                    </div>
                  </div>
                  {/* Sell/Buy Action Trigger */}
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="w-full mt-2.5 py-3 rounded-2xl bg-[#B01070] hover:bg-[#FF99D7] text-white font-extrabold italic uppercase tracking-wider text-[13px] shadow-md transition-colors cursor-pointer select-none"
                  >
                    SELECIONAR
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full h-full rounded-3xl bg-gray-50 border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 gap-2">
                <TbCardsFilled className="text-[48px] text-gray-300 animate-pulse" />
                <p className="text-[16px] font-bold">Nenhum gato selecionado</p>
                <p className="text-[13px] px-8 text-center">Selecione um item no catálogo ao lado para ver os detalhes.</p>
              </div>
            )
          )}
        </div>

      </div>

      {/* ================= CONFIRMATION MODAL ================= */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-[18px] font-extrabold italic uppercase tracking-wider text-[#B01070] border-b border-gray-100 w-full pb-3 mb-4">
              {currentView === "buy_cats" && "COMPRAR GATO"}
              {currentView === "sell_cats" && "VENDER GATO"}
              {currentView === "menu" && selectedMenuOption === "buy_items" && "COMPRAR ITEM"}
            </h2>

            {/* Modal preview image */}
            <div className="mb-4">
              {currentView === "menu" && selectedMenuOption === "buy_items" ? (
                <div className="w-32 h-32 bg-white border border-[#B01070]/20 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-tr from-[#9F267B] to-[#E10B83]">
                  <HiChevronDoubleRight className="text-[52px]" />
                </div>
              ) : (
                selectedCat && (
                  <CardWidget
                    className="h-52 w-[148px]"
                    title={selectedCat.name}
                    rarity={mapRarity(selectedCat.rarity)}
                    start_face={CardFace.FRONT}
                    image_url={selectedCat.image_path}
                  />
                )
              )}
            </div>

            {/* Modal Question */}
            <p className="text-gray-700 font-bold text-[15px] px-4 leading-relaxed mb-6">
              {currentView === "buy_cats" && selectedCat && (
                <>Deseja comprar <span className="text-[#B01070] italic">{selectedCat.name}</span> por <span className="inline-flex items-center gap-1 font-extrabold text-amber-500 whitespace-nowrap"><FaCoins />{getCatPrice(selectedCat.rarity)}?</span></>
              )}
              {currentView === "sell_cats" && selectedCat && (
                <>Deseja vender <span className="text-[#B01070] italic">{selectedCat.name}</span> por <span className="inline-flex items-center gap-1 font-extrabold text-amber-500 whitespace-nowrap"><FaCoins />{getCatPrice(selectedCat.rarity)}?</span></>
              )}
              {currentView === "menu" && selectedMenuOption === "buy_items" && (
                <>Deseja comprar {buyItemQuantity} <span className="text-[#B01070] italic">{buyItemQuantity === 1 ? "Aceleração de Sorteio" : "Acelerações de Sorteio"}</span> por <span className="inline-flex items-center gap-1 font-extrabold text-amber-500 whitespace-nowrap"><FaCoins />{buyItemQuantity * 100}?</span></>
              )}
            </p>

            {/* Error Message if failed */}
            {errorMessage && (
              <p className="text-red-500 text-[13px] font-bold mb-4 bg-red-50 px-4 py-2 rounded-lg w-full">
                {errorMessage}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex gap-4 w-full">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmAction}
                className="flex-grow py-3 rounded-xl bg-[#B01070] hover:bg-[#FF99D7] text-white font-extrabold italic uppercase tracking-wider text-[13px] shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? "PROCESSANDO..." : "SIM"}
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => {
                  setShowConfirmModal(false);
                  setErrorMessage(null);
                }}
                className="flex-grow py-3 rounded-xl bg-gray-500 hover:bg-gray-400 text-white font-extrabold italic uppercase tracking-wider text-[13px] shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                NÃO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUCCESS MODAL ================= */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-[18px] font-extrabold italic uppercase tracking-wider text-green-600 border-b border-gray-100 w-full pb-3 mb-4">
              {currentView === "buy_cats" && "COMPRA REALIZADA COM SUCESSO!"}
              {currentView === "sell_cats" && "VENDA REALIZADA COM SUCESSO!"}
              {currentView === "menu" && selectedMenuOption === "buy_items" && "COMPRA REALIZADA COM SUCESSO!"}
            </h2>

            {/* Modal preview image */}
            <div className="mb-4">
              {currentView === "menu" && selectedMenuOption === "buy_items" ? (
                <div className="w-32 h-32 bg-white border border-green-200 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-tr from-green-500 to-emerald-600">
                  <HiChevronDoubleRight className="text-[52px]" />
                </div>
              ) : (
                successCat && (
                  <CardWidget
                    className="h-52 w-[148px]"
                    title={successCat.name}
                    rarity={mapRarity(successCat.rarity)}
                    start_face={CardFace.FRONT}
                    image_url={successCat.image_path}
                  />
                )
              )}
            </div>

            {/* Modal Message */}
            <p className="text-gray-700 font-bold text-[15px] px-4 leading-relaxed mb-6">
              {successMessage}
            </p>

            {/* Continue button */}
            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                setSuccessCat(null);
                setSuccessMessage("");
              }}
              className="w-full py-3.5 rounded-xl bg-[#B01070] hover:bg-[#FF99D7] text-white font-extrabold italic uppercase tracking-wider text-[13px] shadow-md transition-colors cursor-pointer"
            >
              CONTINUAR
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
