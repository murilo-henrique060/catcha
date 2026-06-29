"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { FaUserPlus, FaUserTimes, FaUserCheck, FaUserClock, FaUserFriends, FaBookOpen } from "react-icons/fa";
import { acceptFriendRequest, declineFriendRequest } from "@/lib/controllers/FriendController";

type Friendship = {
  friendId: string;
  username: string;
  status: string; // 'pending' | 'accepted'
  isOutgoing: boolean;
};

type AmigosWidgetProps = {
  initialFriendships: Friendship[];
};

export function AmigosWidget({ initialFriendships }: AmigosWidgetProps) {
  const [friendships, setFriendships] = useState<Friendship[]>(initialFriendships);
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "sent">("friends");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Group friendships
  const friends = useMemo(() => friendships.filter((f) => f.status === "accepted"), [friendships]);
  const incomingRequests = useMemo(() => friendships.filter((f) => f.status === "pending" && !f.isOutgoing), [friendships]);
  const outgoingRequests = useMemo(() => friendships.filter((f) => f.status === "pending" && f.isOutgoing), [friendships]);

  const handleAccept = async (friendId: string, username: string) => {
    setIsProcessing(friendId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await acceptFriendRequest(friendId);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage(`Você aceitou a solicitação de amizade de ${username}!`);
        // Move to accepted in local state
        setFriendships((prev) =>
          prev.map((f) => (f.friendId === friendId ? { ...f, status: "accepted" } : f))
        );
      }
    } catch (e) {
      console.error(e);
      setErrorMessage("Erro ao processar a operação");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDecline = async (friendId: string, username: string) => {
    setIsProcessing(friendId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await declineFriendRequest(friendId);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage(`Você recusou a solicitação de amizade de ${username}.`);
        // Remove from local state
        setFriendships((prev) => prev.filter((f) => f.friendId !== friendId));
      }
    } catch (e) {
      console.error(e);
      setErrorMessage("Erro ao processar a operação");
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[900px] px-4 py-8 flex flex-col gap-6 select-none">
      
      {/* Page Title & Navigation Tabs */}
      <div className="w-full bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-4 px-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-extrabold italic uppercase tracking-wider text-[#B01070]">
              AMIZADES E CONVITES
            </h2>
            <p className="text-gray-500 text-[12px] leading-tight mt-0.5">
              Gerencie suas conexões de amizade e responda a convites.
            </p>
          </div>
          
          <Link
            href="/home/public"
            className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[#B01070] hover:bg-[#FF99D7] text-white font-extrabold italic uppercase text-[12px] tracking-wide transition-colors shadow-sm cursor-pointer select-none self-start sm:self-auto"
          >
            <FaUserPlus className="text-[14px]" />
            Buscar Jogadores
          </Link>
        </div>

        {/* Tab switcher buttons row */}
        <div className="flex border-t border-gray-100 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("friends")}
            className={[
              "px-4 py-2 rounded-xl text-[12px] font-extrabold uppercase tracking-wider transition-all cursor-pointer",
              activeTab === "friends"
                ? "bg-[#B01070] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            ].join(" ")}
          >
            Meus Amigos ({friends.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            className={[
              "px-4 py-2 rounded-xl text-[12px] font-extrabold uppercase tracking-wider transition-all cursor-pointer relative",
              activeTab === "requests"
                ? "bg-[#B01070] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            ].join(" ")}
          >
            Solicitações ({incomingRequests.length})
            {incomingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {incomingRequests.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sent")}
            className={[
              "px-4 py-2 rounded-xl text-[12px] font-extrabold uppercase tracking-wider transition-all cursor-pointer",
              activeTab === "sent"
                ? "bg-[#B01070] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            ].join(" ")}
          >
            Enviados ({outgoingRequests.length})
          </button>
        </div>
      </div>

      {/* Success/Error Alerts */}
      {successMessage && (
        <div className="w-full p-4 bg-green-50 text-green-700 font-bold rounded-xl border border-green-200 text-[14px]">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="w-full p-4 bg-red-50 text-red-700 font-bold rounded-xl border border-red-200 text-[14px]">
          {errorMessage}
        </div>
      )}

      {/* Tab Contents list */}
      <div className="w-full bg-white rounded-3xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-gray-100 min-h-[300px] flex flex-col justify-start">
        
        {/* ================= TAB 1: MEUS AMIGOS ================= */}
        {activeTab === "friends" && (
          friends.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-gray-400 gap-2 py-12">
              <FaUserFriends className="text-[48px] text-gray-300" />
              <p className="text-[16px] font-bold">Você ainda não tem amigos adicionados</p>
              <p className="text-[13px] text-center px-6">Envie convites na aba de Jogadores Públicos para começar!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {friends.map((friend) => (
                <div
                  key={friend.friendId}
                  className="flex items-center justify-between border border-gray-100 rounded-2xl p-4 hover:bg-gray-50/50 transition-colors gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FCE8F4] border border-[#B01070]/20 flex items-center justify-center text-[#B01070] font-extrabold uppercase text-[15px] italic">
                      {friend.username.substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-[14px] font-extrabold italic uppercase tracking-wide text-gray-800">
                        {friend.username}
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-600 mt-0.5">
                        <FaUserCheck className="text-[10px]" /> Amigos
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/home/public/${friend.username}`}
                    className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl border border-[#B01070] text-[#B01070] hover:bg-[#B01070] hover:text-white font-extrabold italic uppercase text-[11px] tracking-wide transition-all shadow-sm cursor-pointer select-none"
                  >
                    <FaBookOpen />
                    Ver Álbum
                  </Link>
                </div>
              ))}
            </div>
          )
        )}

        {/* ================= TAB 2: SOLICITAÇÕES RECEBIDAS ================= */}
        {activeTab === "requests" && (
          incomingRequests.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-gray-400 gap-2 py-12">
              <FaUserClock className="text-[48px] text-gray-300" />
              <p className="text-[16px] font-bold">Nenhuma solicitação pendente</p>
              <p className="text-[13px] text-center px-6">Quando alguém te enviar um convite de amizade, ele aparecerá aqui.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {incomingRequests.map((req) => (
                <div
                  key={req.friendId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between border border-gray-100 rounded-2xl p-4 gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-extrabold uppercase text-[15px] italic">
                      {req.username.substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-[14px] font-extrabold italic uppercase tracking-wide text-gray-800">
                        {req.username}
                      </h4>
                      <p className="text-gray-400 text-[11px] mt-0.5">Te enviou uma solicitação de amizade</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(req.friendId, req.username)}
                      disabled={isProcessing !== null}
                      className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-[#B01070] hover:bg-[#FF99D7] text-white font-extrabold italic uppercase text-[11px] tracking-wide transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <FaUserCheck />
                      Aceitar
                    </button>
                    <button
                      onClick={() => handleDecline(req.friendId, req.username)}
                      disabled={isProcessing !== null}
                      className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-gray-500 hover:bg-gray-400 text-white font-extrabold italic uppercase text-[11px] tracking-wide transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <FaUserTimes />
                      Recusar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ================= TAB 3: CONVITES ENVIADOS ================= */}
        {activeTab === "sent" && (
          outgoingRequests.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-gray-400 gap-2 py-12">
              <FaUserClock className="text-[48px] text-gray-300" />
              <p className="text-[16px] font-bold">Nenhuma solicitação enviada</p>
              <p className="text-[13px] text-center px-6">Suas solicitações de amizade enviadas que aguardam resposta aparecerão aqui.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {outgoingRequests.map((req) => (
                <div
                  key={req.friendId}
                  className="flex items-center justify-between border border-gray-100 rounded-2xl p-4 gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 font-extrabold uppercase text-[15px] italic">
                      {req.username.substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-[14px] font-extrabold italic uppercase tracking-wide text-gray-800">
                        {req.username}
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 mt-0.5">
                        <FaUserClock className="text-[10px]" /> Aguardando aprovação
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDecline(req.friendId, req.username)}
                    disabled={isProcessing !== null}
                    className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg border border-gray-250 text-gray-500 hover:text-red-500 hover:border-red-200 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              ))}
            </div>
          )
        )}

      </div>

    </div>
  );
}
