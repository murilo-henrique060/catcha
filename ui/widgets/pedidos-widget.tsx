'use client';

import { useState } from "react";
import Link from "next/link";
import { FaArrowLeft, FaCheck, FaTimes } from "react-icons/fa";
import { TbCardsFilled } from "react-icons/tb";
import { CardWidget } from "./card";
import { CardFace, CardRarity } from "./card-types";
import { getCatImageUrl } from "@/lib/utils";
import { approveCard, rejectCard } from "@/lib/controllers/CardActions";
import { useEffect } from "react";

type PedidosWidgetProps = {
  cards: {
    id: number;
    name: string;
    rarity: string;
    image_path: string;
    status: string;
    profiles?: { username: string } | { username: string }[] | null;
  }[];
};

const mapRarity = (rarity: string): CardRarity => {
  switch (rarity) {
    case 'S': return CardRarity.S;
    case 'A': return CardRarity.A;
    case 'B': return CardRarity.B;
    default: return CardRarity.C;
  }
};

export function PedidosWidget({ cards }: PedidosWidgetProps) {
  const [localCards, setLocalCards] = useState(cards);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectMessage, setRejectMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setLocalCards(cards);
  }, [cards]);

  const handleApprove = async (id: number) => {
    setIsLoading(true);
    await approveCard(id);
    setLocalCards(prev => prev.map(c => c.id === id ? { ...c, status: 'approved' } : c));
    setIsLoading(false);
  };

  const handleRejectSubmit = async (id: number) => {
    if (!rejectMessage.trim()) return;
    setIsLoading(true);
    await rejectCard(id, rejectMessage);
    setLocalCards(prev => prev.map(c => c.id === id ? { ...c, status: 'rejected' } : c));
    setRejectingId(null);
    setRejectMessage("");
    setIsLoading(false);
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#FFFAFD]">
      <div className="flex items-center justify-between bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/home" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FCE8F4] text-[#E10B83] transition-colors hover:bg-[#F9D6EB]">
            <FaArrowLeft className="text-[18px]" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-[24px] font-bold leading-none text-[#1A1A1A]">Pedidos de Carta</h1>
            <p className="text-[14px] text-[#666666]">Gerencie aprovações de cartas criadas por usuários</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm w-fit pr-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FCE8F4]">
            <TbCardsFilled className="text-[24px] text-[#E10B83]" />
          </div>
          <div>
            <p className="text-[14px] font-medium text-[#666666]">Cartas Pendentes</p>
            <p className="text-[24px] font-bold leading-none text-[#1A1A1A]">{cards.length}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {localCards.length === 0 ? (
            <div className="flex h-[40vh] flex-col items-center justify-center text-center">
              <TbCardsFilled className="mb-4 text-[64px] text-[#E8E1E7]" />
              <h2 className="mb-2 text-[20px] font-bold text-[#1A1A1A]">Nenhuma carta pendente</h2>
              <p className="max-w-[260px] text-[15px] text-[#666666]">
                Tudo certo por aqui! Não há cartas aguardando aprovação.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-1 pb-8">
              {localCards.map((cat) => {
                const watermark = Array.isArray(cat.profiles) ? cat.profiles[0]?.username : cat.profiles?.username;

                return (
                  <div key={cat.id} className="relative flex flex-col bg-white rounded-3xl p-4 shadow-sm border border-gray-100 items-center gap-4">
                    <CardWidget
                      className="w-full aspect-[0.714]"
                      title={cat.name}
                      rarity={mapRarity(cat.rarity)}
                      start_face={CardFace.FRONT}
                      image_url={getCatImageUrl(cat.image_path)}
                      watermark={watermark}
                    />

                    {cat.status === 'approved' ? (
                      <div className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-50 py-2.5 text-sm font-bold text-green-600">
                        <FaCheck /> Aprovada
                      </div>
                    ) : cat.status === 'rejected' ? (
                      <div className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-50 py-2.5 text-sm font-bold text-red-600">
                        <FaTimes /> Rejeitada
                      </div>
                    ) : rejectingId === cat.id ? (
                      <div className="w-full flex flex-col gap-2">
                        <textarea
                          placeholder="Motivo da rejeição..."
                          className="w-full rounded-xl bg-gray-50 border border-gray-200 p-2 text-sm outline-none resize-none h-20"
                          value={rejectMessage}
                          onChange={(e) => setRejectMessage(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button
                            disabled={isLoading}
                            onClick={() => { setRejectingId(null); setRejectMessage(""); }}
                            className="flex-1 rounded-xl bg-gray-100 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200"
                          >
                            Cancelar
                          </button>
                          <button
                            disabled={isLoading || !rejectMessage.trim()}
                            onClick={() => handleRejectSubmit(cat.id)}
                            className="flex-1 rounded-xl bg-red-500 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                          >
                            Rejeitar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full flex gap-2">
                        <button
                          disabled={isLoading}
                          onClick={() => setRejectingId(cat.id)}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-50 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <FaTimes /> Recusar
                        </button>
                        <button
                          disabled={isLoading}
                          onClick={() => handleApprove(cat.id)}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-500 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
                        >
                          <FaCheck /> Aprovar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
