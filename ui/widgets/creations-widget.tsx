'use client';

import { useState, useMemo } from "react";
import Link from "next/link";
import { FaSearch, FaArrowLeft, FaCheckCircle, FaClock, FaTrash } from "react-icons/fa";
import { TbCardsFilled } from "react-icons/tb";
import { CardWidget } from "./card";
import { CardFace, CardRarity } from "./card-types";
import { getCatImageUrl } from "@/lib/utils";
import { deleteRejectedCard } from "@/lib/actions/CardActions";

type CreationsWidgetProps = {
  createdCats: {
    id: number;
    name: string;
    rarity: string;
    image_path: string;
    status: string;
    reject_message?: string;
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

export function CreationsWidget({ createdCats }: CreationsWidgetProps) {
  const [search, setSearch] = useState("");
  const [localCats, setLocalCats] = useState(createdCats);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const processedCats = useMemo(() => {
    let result = [...localCats];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q));
    }
    return result;
  }, [localCats, search]);

  const handleDelete = async (id: number) => {
    setIsDeleting(id);
    const result = await deleteRejectedCard(id);
    if (result.success) {
      setLocalCats(prev => prev.filter(c => c.id !== id));
    }
    setIsDeleting(null);
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#FFFAFD]">
      {/* Header */}
      <div className="flex items-center justify-between bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/home" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FCE8F4] text-[#E10B83] transition-colors hover:bg-[#F9D6EB]">
            <FaArrowLeft className="text-[18px]" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-[24px] font-bold leading-none text-[#1A1A1A]">Minhas Cartas</h1>
            <p className="text-[14px] text-[#666666]">Cartas criadas por você</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FCE8F4]">
              <TbCardsFilled className="text-[24px] text-[#E10B83]" />
            </div>
            <div>
              <p className="text-[14px] font-medium text-[#666666]">Total Criadas</p>
              <p className="text-[24px] font-bold leading-none text-[#1A1A1A]">{localCats.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-[#F5F5F5] px-4 py-2">
            <FaSearch className="text-[#999999]" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-32 bg-transparent text-[14px] outline-none placeholder:text-[#999999]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {processedCats.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <TbCardsFilled className="mb-4 text-[64px] text-[#E8E1E7]" />
              <h2 className="mb-2 text-[20px] font-bold text-[#1A1A1A]">Nenhuma carta encontrada</h2>
              <p className="max-w-[260px] text-[15px] text-[#666666]">
                {search ? "Tente buscar com outro nome." : "Você ainda não criou nenhuma carta."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-6 p-1 pb-8">
              {processedCats.map((cat) => {
                const watermark = Array.isArray(cat.profiles) ? cat.profiles[0]?.username : cat.profiles?.username;

                return (
                  <div key={cat.id} className="relative cursor-pointer select-none transition-all duration-200 hover:scale-105">
                    <CardWidget
                      className="w-full aspect-[0.714]"
                      title={cat.name}
                      rarity={mapRarity(cat.rarity)}
                      start_face={CardFace.FRONT}
                      image_url={getCatImageUrl(cat.image_path)}
                      watermark={watermark}
                    />
                    
                    <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1 rounded-full bg-black/75 px-2.5 py-1 shadow-md backdrop-blur-md">
                      {cat.status === 'approved' ? (
                        <>
                          <FaCheckCircle className="text-[12px] text-green-400" />
                          <span className="text-[10px] font-bold text-white uppercase">Aprovada</span>
                        </>
                      ) : cat.status === 'rejected' ? (
                        <>
                          <div className="flex items-center gap-1 group relative">
                            <FaClock className="text-[12px] text-red-400" />
                            <span className="text-[10px] font-bold text-white uppercase cursor-help">Rejeitada</span>
                            {cat.reject_message && (
                              <div className="absolute bottom-full left-0 mb-2 hidden w-48 rounded-lg bg-black/90 p-2 text-xs text-white shadow-lg group-hover:block">
                                {cat.reject_message}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <FaClock className="text-[12px] text-yellow-400" />
                          <span className="text-[10px] font-bold text-white uppercase">Pendente</span>
                        </>
                      )}
                    </div>

                    {cat.status === 'rejected' && (
                      <button
                        disabled={isDeleting === cat.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(cat.id);
                        }}
                        className="absolute top-2.5 right-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition-transform hover:scale-110 disabled:opacity-50"
                        title="Excluir carta rejeitada"
                      >
                        <FaTrash className="text-[12px]" />
                      </button>
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
