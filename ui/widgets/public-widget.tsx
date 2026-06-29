"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { FaSearch, FaUserPlus, FaUserClock, FaUserFriends, FaBookOpen } from "react-icons/fa";
import { sendFriendRequest } from "@/lib/controllers/FriendController";

type PublicPlayer = {
  id: string;
  username: string;
  uniqueCards: number;
  friendshipStatus: string; // 'none' | 'pending' | 'accepted'
  isOutgoingRequest: boolean;
};

type PublicWidgetProps = {
  players: PublicPlayer[];
  totalCatsCount: number;
};

export function PublicWidget({ players: initialPlayers, totalCatsCount }: PublicWidgetProps) {
  const [players, setPlayers] = useState<PublicPlayer[]>(initialPlayers);
  const [search, setSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter players by search input
  const filteredPlayers = useMemo(() => {
    if (search.trim() === "") return players;
    const q = search.toLowerCase();
    return players.filter((p) => p.username.toLowerCase().includes(q));
  }, [players, search]);

  const handleSendInvite = async (playerId: string, username: string) => {
    setIsProcessing(playerId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await sendFriendRequest(playerId);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage(`Solicitação de amizade enviada para ${username}!`);
        // Update local state status to pending outgoing
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === playerId
              ? { ...p, friendshipStatus: "pending", isOutgoingRequest: true }
              : p
          )
        );
      }
    } catch (e) {
      console.error(e);
      setErrorMessage("Erro ao processar a operação");
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-8 flex flex-col gap-6 select-none">
      
      {/* Header & Search Bar Row */}
      <div className="w-full bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-4 px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-extrabold italic uppercase tracking-wider text-[#B01070]">
            JOGADORES PÚBLICOS
          </h2>
          <p className="text-gray-500 text-[12px] leading-tight mt-0.5">
            Explore coleções de outros jogadores e faça novas amizades!
          </p>
        </div>

        {/* Search bar */}
        <div className="relative md:w-[35%] flex-shrink-0">
          <span className="absolute inset-y-0 left-3.5 flex items-center text-gray-400">
            <FaSearch className="text-[14px]" />
          </span>
          <input
            type="text"
            placeholder="Buscar Jogador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#EAEAEA] border border-transparent focus:border-[#B01070]/30 focus:bg-white outline-none text-[14px] font-medium transition-all"
          />
        </div>
      </div>

      {/* Success/Error Alerts */}
      {successMessage && (
        <div className="w-full p-4 bg-green-50 text-green-700 font-bold rounded-xl border border-green-200 text-[14px] animate-in fade-in duration-200">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="w-full p-4 bg-red-50 text-red-700 font-bold rounded-xl border border-red-200 text-[14px] animate-in fade-in duration-200">
          {errorMessage}
        </div>
      )}

      {/* Players Card Grid */}
      {filteredPlayers.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white border border-gray-150 rounded-2xl p-8 text-gray-400 gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
          <FaUserFriends className="text-[48px] text-gray-300 animate-pulse" />
          <p className="text-[16px] font-bold">Nenhum jogador encontrado</p>
          <p className="text-[13px]">Digite outro nome de usuário para buscar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlayers.map((player) => (
            <div
              key={player.id}
              className="bg-white border border-gray-100 rounded-3xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow flex flex-col justify-between gap-5 relative overflow-hidden group"
            >
              {/* Card visual elements decoration */}
              <div className="absolute top-0 left-0 w-2 h-full bg-[#B01070]/10 group-hover:bg-[#B01070]/30 transition-colors" />

              {/* Player Metadata */}
              <div className="pl-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FCE8F4] border border-[#B01070]/20 flex items-center justify-center text-[#B01070] font-extrabold uppercase text-[15px] italic">
                    {player.username.substring(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-[16px] font-extrabold italic uppercase tracking-wide text-gray-800 leading-tight">
                      {player.username}
                    </h4>
                    <p className="text-gray-400 text-[11px] font-medium leading-none mt-1">
                      Jogador Registrado
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-600">Álbum:</span>
                  <span className="text-[13px] font-extrabold text-[#B01070] bg-[#FCE8F4]/60 px-2 py-0.5 rounded-md leading-none">
                    {player.uniqueCards} / {totalCatsCount} cartas
                  </span>
                </div>
              </div>

              {/* Actions row */}
              <div className="w-full grid grid-cols-2 gap-3 pl-2">
                {/* View Album Link */}
                <Link
                  href={`/home/public/${player.username}`}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-gray-200 hover:border-[#B01070] hover:text-[#B01070] text-gray-600 font-bold uppercase text-[11px] tracking-wider transition-colors shadow-sm select-none cursor-pointer"
                >
                  <FaBookOpen />
                  Ver Álbum
                </Link>

                {/* Friend Invitation Controls */}
                {player.friendshipStatus === "none" && (
                  <button
                    onClick={() => handleSendInvite(player.id, player.username)}
                    disabled={isProcessing !== null}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#B01070] hover:bg-[#FF99D7] text-white font-bold uppercase text-[11px] tracking-wider transition-colors shadow-sm cursor-pointer disabled:opacity-50 select-none"
                  >
                    <FaUserPlus />
                    {isProcessing === player.id ? "Enviando..." : "Add Amigo"}
                  </button>
                )}

                {player.friendshipStatus === "pending" && player.isOutgoingRequest && (
                  <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 font-bold uppercase text-[11px] tracking-wider select-none">
                    <FaUserClock />
                    Pendente
                  </div>
                )}

                {player.friendshipStatus === "pending" && !player.isOutgoingRequest && (
                  <Link
                    href="/home/friends"
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-pink-50 border border-pink-200 text-[#B01070] font-bold uppercase text-[11px] tracking-wider transition-colors hover:bg-pink-100/50 select-none cursor-pointer text-center"
                  >
                    <FaUserPlus />
                    Responder
                  </Link>
                )}

                {player.friendshipStatus === "accepted" && (
                  <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-green-50 border border-green-200 text-green-600 font-bold uppercase text-[11px] tracking-wider select-none">
                    <FaUserFriends />
                    Amigos
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
