'use client';

import { useState, useEffect } from "react";
import { FaClock, FaForward } from "react-icons/fa6";
import { GiUpCard } from "react-icons/gi";
import { HiChevronDoubleRight } from "react-icons/hi";
import { CardWidget } from "./card";
import { CardFace, CardRarity } from "./card-types";
import { useUser } from "@/lib/contexts/UserContext";
import { getCatImageUrl } from "@/lib/utils";
import { drawCard, accelerateDraw } from "@/lib/controllers/CardActions";

type DrawAreaProps = {
  drawIntervalMs: number;
  serverTime?: string;
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

export function DrawArea({ drawIntervalMs, serverTime }: DrawAreaProps) {
  const { profile, isLoading, items, refreshProfile, setProfileData } = useUser();
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [timeOffset, setTimeOffset] = useState<number>(0);

  useEffect(() => {
    if (serverTime) {
      const clientNow = Date.now();
      const serverNow = new Date(serverTime).getTime();
      setTimeOffset(serverNow - clientNow);
    }
  }, [serverTime]);
  const [cardWidgetProps, setCardWidgetProps] = useState<{
    title: string;
    rarity: CardRarity;
    image_url: string;
    face: CardFace;
    watermark?: string;
  }>({
    title: "Sorteio de Carta",
    rarity: CardRarity.C,
    image_url: "/cats/cat001.webp",
    face: CardFace.BACK,
  });
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [drawnCat, setDrawnCat] = useState<{ name: string; rarity: string; image_path: string } | null>(null);

  // Cooldown calculation
  const nextDraw = profile?.next_draw || new Date().toISOString();

  // Parse skip/accelerate item quantity from user inventory
  const displaySkipItemCount = (!isLoading && items)
    ? (items.find((i) => i.item.type === 'skip' || i.item.name === 'Acelerar')?.quantity ?? 0)
    : 0;

  useEffect(() => {
    Promise.resolve().then(() => {
      setHasLoadedInitial(false);
    });
  }, [nextDraw]);

  useEffect(() => {
    if (isFastForwarding) return;

    const calculateRemaining = () => {
      const nextDrawTime = new Date(nextDraw).getTime();
      const now = Date.now() + timeOffset;
      const diff = nextDrawTime - now;
      return Math.max(0, Math.min(drawIntervalMs, diff));
    };

    Promise.resolve().then(() => {
      setRemainingTime(calculateRemaining());
      setTimeout(() => {
        setHasLoadedInitial(true);
      }, 150);
    });

    const interval = setInterval(() => {
      setRemainingTime(calculateRemaining());
    }, 60000);

    return () => clearInterval(interval);
  }, [nextDraw, drawIntervalMs, isFastForwarding]);

  // Format time as hh:mm
  const hours = Math.floor(remainingTime / (1000 * 60 * 60));
  const minutes = Math.ceil((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
  let displayHours = hours;
  let displayMinutes = minutes;
  if (displayMinutes === 60) {
    displayMinutes = 0;
    displayHours += 1;
  }
  const formattedTime = `${String(displayHours).padStart(2, "0")}:${String(displayMinutes).padStart(2, "0")}`;
  const loadPercentage = (1 - remainingTime / drawIntervalMs) * 100;
  
  const isReady = remainingTime === 0 && !isLoading && !!profile;
  const canAccelerate = remainingTime > 0 && displaySkipItemCount >= 1 && !isLoading && !!profile;

  const handleDraw = async () => {
    if (!isReady || isDrawing) return;

    setIsDrawing(true);
    const result = await drawCard();

    if (result.error) {
      alert(result.error);
      setIsDrawing(false);
      return;
    }

    if (result.success && result.card) {
      const newCard = result.card;
      setDrawnCat(newCard);

      // Preload image before starting the card flip
      const img = new window.Image();
      img.src = getCatImageUrl(newCard.image_path);
      img.onload = () => {
        setCardWidgetProps({
          title: newCard.name,
          rarity: mapRarity(newCard.rarity),
          image_url: getCatImageUrl(newCard.image_path),
          face: CardFace.BACK,
          watermark: (newCard as any).profiles?.username,
        });

        setTimeout(() => {
          setCardWidgetProps((prev) => ({ ...prev, face: CardFace.FRONT }));
        }, 100);

        setTimeout(() => {
          setShowModal(true);
        }, 3500);
      };
      
      img.onerror = () => {
        alert("Erro ao carregar a imagem do gato sorteado.");
        setIsDrawing(false);
      };
    }
  };

  const handleAccelerateClick = () => {
    if (!canAccelerate || isDrawing) return;
    setShowConfirmModal(true);
  };

  const handleConfirmAccelerate = async () => {
    setShowConfirmModal(false);
    setIsDrawing(true);
    setIsFastForwarding(true);

    // Optimistically deduct 1 skip item immediately so the navbar updates instantly
    setProfileData((prev) => {
      const updatedItems = prev.items.map((i) => {
        if (i.item.type === 'skip') {
          return { ...i, quantity: Math.max(0, i.quantity - 1) };
        }
        return i;
      }).filter((i) => i.quantity > 0);

      return {
        ...prev,
        items: updatedItems,
      };
    });

    const startVal = remainingTime;
    const animationDuration = 1200; // Fast-forward animation duration: 1.2s
    let animStart: number | null = null;

    // Fast-forward animation counting clock to 0 and filling progress loader to 100%
    const animateSkip = (timestamp: number) => {
      if (!animStart) animStart = timestamp;
      const progress = Math.min((timestamp - animStart) / animationDuration, 1);
      
      const currentRemaining = startVal * (1 - progress);
      setRemainingTime(currentRemaining);

      if (progress < 1) {
        window.requestAnimationFrame(animateSkip);
      } else {
        // Once count reaches 0, trigger the backend accelerate draw method
        runServerAccelerate();
      }
    };

    window.requestAnimationFrame(animateSkip);
  };

  const runServerAccelerate = async () => {
    const result = await accelerateDraw();

    if (result.error) {
      alert(result.error);
      setIsDrawing(false);
      setIsFastForwarding(false);
      
      // Sync back original state from database on error
      refreshProfile();
      
      // Reset clock to actual state
      const nextDrawTime = new Date(nextDraw).getTime();
      const now = Date.now() + timeOffset;
      setRemainingTime(Math.max(0, Math.min(drawIntervalMs, nextDrawTime - now)));
      return;
    }

    if (result.success && result.card) {
      const newCard = result.card;
      setDrawnCat(newCard);

      // Preload image before starting the card flip
      const img = new window.Image();
      img.src = getCatImageUrl(newCard.image_path);
      img.onload = () => {
        setCardWidgetProps({
          title: newCard.name,
          rarity: mapRarity(newCard.rarity),
          image_url: getCatImageUrl(newCard.image_path),
          face: CardFace.BACK,
          watermark: (newCard as any).profiles?.username,
        });

        setTimeout(() => {
          setCardWidgetProps((prev) => ({ ...prev, face: CardFace.FRONT }));
        }, 100);

        setTimeout(() => {
          setShowModal(true);
          setIsFastForwarding(false);
        }, 3500);
      };
      
      img.onerror = () => {
        alert("Erro ao carregar a imagem do gato sorteado.");
        setIsDrawing(false);
        setIsFastForwarding(false);
      };
    }
  };

  const handleContinue = async () => {
    setShowModal(false);
    
    // 1. Optimistically update user context cards and profile counters instantly
    if (drawnCat) {
      setProfileData((prev) => {
        if (!prev.profile) return prev;
        
        const updatedCards = [...prev.cards];
        const existingCardIndex = updatedCards.findIndex(
          (c) => c.cat.name === drawnCat.name
        );

        if (existingCardIndex > -1) {
          updatedCards[existingCardIndex] = {
            ...updatedCards[existingCardIndex],
            quantity: updatedCards[existingCardIndex].quantity + 1,
          };
        } else {
          updatedCards.push({
            quantity: 1,
            cat: {
              id: Math.random(),
              name: drawnCat.name,
              rarity: drawnCat.rarity,
              image_path: drawnCat.image_path,
            },
          });
        }

        return {
          ...prev,
          profile: {
            ...prev.profile,
            cards_drawn: prev.profile.cards_drawn + 1,
          },
          cards: updatedCards,
        };
      });
    }

    // 2. Trigger async database sync refresh in the background
    refreshProfile();

    // 3. Flip card back to BACK first (keeping drawn card content active so it doesn't pop/glitch during rotation)
    setCardWidgetProps((prev) => ({ ...prev, face: CardFace.BACK }));

    // 4. Wait 500ms for the flip-back transition to complete before resetting properties
    setTimeout(() => {
      setCardWidgetProps({
        title: "Sorteio de Carta",
        rarity: CardRarity.C,
        image_url: "/cats/cat001.webp",
        face: CardFace.BACK,
        watermark: undefined,
      });
      setDrawnCat(null);

      // Finally, disable drawing mode/full-screen blocker overlay
      setIsDrawing(false);
    }, 500);
  };

  return (
    <>
      {/* Full-screen Input Blocker overlay to intercept all pointer interactions during drawing flow */}
      {isDrawing && !showModal && !showConfirmModal && (
        <div className="fixed inset-0 z-50 cursor-wait bg-black/5" />
      )}

      {/* 3D Card Widget */}
      <CardWidget
        className="h-[60vh] w-[42.857vh]"
        title={cardWidgetProps.title}
        rarity={cardWidgetProps.rarity}
        start_face={cardWidgetProps.face}
        image_url={cardWidgetProps.image_url}
        watermark={cardWidgetProps.watermark}
      />

      {/* Timer Cooldown Pill */}
      <div 
        className={[
          "bg-[#EAEAEA] flex items-center rounded-lg p-3 w-full max-w-[42.857vh] text-[#BD2C85] font-bold gap-2 transition-all duration-300",
          loadPercentage >= 100
            ? "shadow-[0_0_15px_rgba(225,11,131,0.5)] border border-[#E10B83]/30"
            : "shadow-[0_4px_6px_0_rgba(0,0,0,0.25)] border border-transparent"
        ].join(" ")}
      >
        <FaClock className="text-[20px]" />
        <span>{formattedTime}</span>

        <div className="flex-grow flex rounded-full bg-[#FFFFFF] h-[5px]">
          <div
            className={[
              "rounded-full animate-gradient bg-gradient-to-r from-[#FA6DBD] via-[#9F267B] via-[#E10B83] to-[#FA6DBD] h-full",
              isFastForwarding || !hasLoadedInitial ? "" : "transition-all duration-1000 ease-linear",
              loadPercentage >= 100 ? "shadow-[0_0_10px_#FA6DBD,0_0_20px_#E10B83] animate-pulse" : ""
            ].join(" ")}
            style={{ width: `${loadPercentage}%` }}
          />
          <div className="flex-grow" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2.5 w-full max-w-[42.857vh]">
        <button
          type="button"
          disabled={!isReady || isDrawing}
          onClick={handleDraw}
          className={[
            "flex-grow italic flex items-center justify-center gap-1 rounded-[6px] bg-[#D30076] px-3 py-1.5 text-[15px] font-bold text-white shadow-[0_3px_8px_rgba(211,0,118,0.35)] transition-all",
            (!isReady || isDrawing) ? "opacity-50 cursor-not-allowed shadow-none" : "hover:bg-[#B90067]"
          ].join(" ")}
        >
          {isDrawing && !showModal && !isFastForwarding ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></div>
          ) : (
            <>
              <GiUpCard className="text-[16px]" />
              SORTEAR
            </>
          )}
        </button>

        <button
          type="button"
          disabled={!canAccelerate || isDrawing}
          onClick={handleAccelerateClick}
          className={[
            "flex-grow italic flex items-center justify-center gap-2 rounded-[6px] bg-[#D30076] px-3 py-1.5 text-[15px] font-bold text-white shadow-[0_3px_8px_rgba(211,0,118,0.35)] transition-all",
            (!canAccelerate || isDrawing) ? "opacity-50 cursor-not-allowed shadow-none" : "hover:bg-[#B90067]"
          ].join(" ")}
        >
          <FaForward className="text-[16px]" />
          ACELERAR
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[480px] rounded-[32px] bg-white border border-[#FF99D7]/20 p-8 text-center shadow-[0_12px_40px_rgba(0,0,0,0.3)] flex flex-col items-center gap-6">
            
            {/* Modal Title */}
            <h3 className="text-[22px] font-bold italic uppercase tracking-wider text-[#B01070]">
              Aceleração de Sorteio
            </h3>

            {/* Render Cost Icon & Cost Count */}
            <div className="flex flex-col items-center justify-center border-4 border-[#B01070]/20 rounded-2xl p-4 w-24 h-24 bg-gray-50 shadow-inner">
              <HiChevronDoubleRight className="text-[36px] text-[#B01070]" />
              <span className="text-[16px] font-bold text-gray-700 mt-1">1</span>
            </div>

            {/* Confirm text */}
            <p className="text-[18px] text-gray-700 font-medium px-4">
              Deseja antecipar o próximo sorteio?
            </p>

            {/* Sim/Não Action Buttons */}
            <div className="flex gap-4 w-full justify-center">
              <button
                type="button"
                onClick={handleConfirmAccelerate}
                className="w-full max-w-[140px] rounded-full bg-[#B01070] hover:bg-[#FF99D7] px-6 py-2.5 text-[16px] font-bold uppercase text-white shadow-[0_4px_12px_rgba(176,16,112,0.3)] transition-colors duration-200"
              >
                Sim
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-full max-w-[140px] rounded-full bg-gray-600 hover:bg-gray-500 px-6 py-2.5 text-[16px] font-bold uppercase text-white shadow-[0_4px_12px_rgba(0,0,0,0.25)] transition-colors duration-200"
              >
                Não
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draw Success Modal */}
      {showModal && drawnCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[480px] rounded-[32px] bg-white border border-[#FF99D7]/20 p-8 text-center shadow-[0_12px_40px_rgba(0,0,0,0.3)] flex flex-col items-center gap-6">
            
            {/* Modal Title */}
            <h3 className="text-[22px] font-bold italic uppercase tracking-wider text-[#B01070]">
              Sorteio de Carta
            </h3>

            {/* Render drawn card using CardWidget faced FRONT from the start */}
            <CardWidget
              className="h-[280px] w-[200px] shadow-lg"
              title={drawnCat.name}
              rarity={mapRarity(drawnCat.rarity)}
              start_face={CardFace.FRONT}
              image_url={getCatImageUrl(drawnCat.image_path)}
              watermark={(drawnCat as any).profiles?.username}
            />

            {/* Modal Body Text */}
            <p className="text-[18px] text-gray-700 font-medium">
              Você tirou <span className="text-[#B01070] font-bold">{drawnCat.name}</span>!
            </p>

            {/* Continuar Action Button */}
            <button
              type="button"
              onClick={handleContinue}
              className="mt-2 w-full max-w-[220px] rounded-full bg-[#B01070] hover:bg-[#FF99D7] px-6 py-3 text-[16px] font-bold uppercase text-white shadow-[0_4px_12px_rgba(176,16,112,0.3)] transition-colors duration-200"
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
