"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { FaUserPlus, FaUserTimes, FaUserCheck, FaUserClock, FaUserFriends, FaBookOpen, FaGift, FaExchangeAlt, FaBoxOpen } from "react-icons/fa";
import { acceptFriendRequest, declineFriendRequest } from "@/lib/controllers/FriendController";
import { sendGift, receiveGift } from "@/lib/controllers/GiftController";
import { createTradeOffer, counterTradeOffer, acceptTrade, rejectTrade, cancelTrade } from "@/lib/controllers/TradeController";
import { CardSelectorModal } from "@/ui/components/card-selector-modal";
import { useUser } from "@/lib/contexts/UserContext";
import Image from "next/image";

type Friendship = {
  friendId: string;
  username: string;
  status: string; // 'pending' | 'accepted'
  isOutgoing: boolean;
};

type Trade = {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_cat_id: number;
  receiver_cat_id: number | null;
  status: string;
  created_at: string;
  sender?: { username: string };
  receiver?: { username: string };
  sender_cat?: { id: number, name: string, rarity: string, image_path: string };
  receiver_cat?: { id: number, name: string, rarity: string, image_path: string };
};

type Gift = {
  id: string;
  sender_id: string;
  receiver_id: string;
  cat_id: number;
  created_at: string;
  sender?: { username: string };
  receiver?: { username: string };
  cat?: { id: number, name: string, rarity: string, image_path: string };
  status?: string;
};

type AmigosWidgetProps = {
  initialFriendships: Friendship[];
  initialTrades: { incoming: Trade[], outgoing: Trade[] };
  initialGifts: { incoming: Gift[], outgoing: Gift[] };
  currentUserId: string;
};

type ModalState = {
  isOpen: boolean;
  type: 'gift' | 'trade' | 'counter';
  friendId?: string;
  tradeId?: string;
  title: string;
  rarityFilter?: string;
};

export function AmigosWidget({ initialFriendships, initialTrades, initialGifts, currentUserId }: AmigosWidgetProps) {
  const { refreshProfile, notifications } = useUser();
  const [friendships, setFriendships] = useState<Friendship[]>(initialFriendships);
  const [trades, setTrades] = useState(initialTrades);
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "sent" | "trades">("friends");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, type: 'gift', title: '' });

  // Group friendships
  const friends = useMemo(() => friendships.filter((f) => f.status === "accepted"), [friendships]);
  const incomingRequests = useMemo(() => friendships.filter((f) => f.status === "pending" && !f.isOutgoing), [friendships]);
  const outgoingRequests = useMemo(() => friendships.filter((f) => f.status === "pending" && f.isOutgoing), [friendships]);

  const hasActiveTrade = trades.incoming.length > 0 || trades.outgoing.length > 0;

  const handleAction = async (actionFn: () => Promise<{ error?: string, success?: boolean }>, processId: string, successText: string) => {
    setIsProcessing(processId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await actionFn();
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage(successText);
        await refreshProfile(); // Refresh context
      }
      return res.success;
    } catch (e) {
      console.error(e);
      setErrorMessage("Erro ao processar a operação");
      return false;
    } finally {
      setIsProcessing(null);
    }
  };

  const handleAccept = async (friendId: string, username: string) => {
    const success = await handleAction(() => acceptFriendRequest(friendId), friendId, `Você aceitou a solicitação de amizade de ${username}!`);
    if (success) {
      setFriendships((prev) => prev.map((f) => (f.friendId === friendId ? { ...f, status: "accepted" } : f)));
    }
  };

  const handleDecline = async (friendId: string, username: string) => {
    const success = await handleAction(() => declineFriendRequest(friendId), friendId, `Você recusou a solicitação de amizade de ${username}.`);
    if (success) {
      setFriendships((prev) => prev.filter((f) => f.friendId !== friendId));
    }
  };

  const openModal = (type: ModalState['type'], friendId?: string, tradeId?: string, rarityFilter?: string) => {
    let title = "";
    if (type === 'gift') title = "Escolha um presente";
    else if (type === 'trade') title = "Escolha uma carta para trocar";
    else if (type === 'counter') title = "Escolha uma carta para contra-proposta";
    
    setModalState({ isOpen: true, type, friendId, tradeId, title, rarityFilter });
  };

  const isGiftOnCooldown = (friendId: string) => {
    const lastGift = initialGifts.outgoing
      .filter(g => g.receiver_id === friendId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      
    if (!lastGift) return false;
    const GIFT_COOLDOWN_MS = 5 * 60 * 60 * 1000;
    return (Date.now() - new Date(lastGift.created_at).getTime()) < GIFT_COOLDOWN_MS;
  };

  // Card Selection Modal Handler
  const handleSelectCard = async (catId: number) => {
    if (modalState.type === 'gift' && modalState.friendId) {
      const success = await handleAction(() => sendGift(modalState.friendId!, catId), 'modal', 'Presente enviado com sucesso!');
      setModalState({ ...modalState, isOpen: false });
      if (success) {
        window.location.reload();
      }
    } else if (modalState.type === 'trade' && modalState.friendId) {
      const success = await handleAction(() => createTradeOffer(modalState.friendId!, catId), 'modal', 'Oferta de troca enviada!');
      setModalState({ ...modalState, isOpen: false });
      if (success) {
        window.location.reload(); // Quick refresh to update lists
      }
    } else if (modalState.type === 'counter' && modalState.tradeId) {
      const success = await handleAction(() => counterTradeOffer(modalState.tradeId!, catId), 'modal', 'Contra-proposta enviada com sucesso!');
      setModalState({ ...modalState, isOpen: false });
      if (success) {
        window.location.reload();
      }
    }
  };

  // Trade Actions
  const handleAcceptTrade = async (tradeId: string) => {
    const success = await handleAction(() => acceptTrade(tradeId), tradeId, 'Troca concluída com sucesso!');
    if (success) window.location.reload();
  };

  const handleRejectTrade = async (tradeId: string) => {
    const success = await handleAction(() => rejectTrade(tradeId), tradeId, 'Troca rejeitada.');
    if (success) window.location.reload();
  };

  const handleCancelTrade = async (tradeId: string) => {
    const success = await handleAction(() => cancelTrade(tradeId), tradeId, 'Oferta cancelada.');
    if (success) window.location.reload();
  };

  const handleReceiveGift = async (giftId: string) => {
    const success = await handleAction(() => receiveGift(giftId), giftId, 'Presente recebido com sucesso!');
    if (success) window.location.reload();
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
              Gerencie suas conexões, presentes e trocas com amigos.
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
        <div className="flex border-t border-gray-100 pt-3 gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            type="button"
            onClick={() => setActiveTab("friends")}
            className={[
              "px-4 py-2 rounded-xl text-[12px] font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
              activeTab === "friends" ? "bg-[#B01070] text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
            ].join(" ")}
          >
            Meus Amigos ({friends.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("trades")}
            className={[
              "px-4 py-2 rounded-xl text-[12px] font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap relative",
              activeTab === "trades" ? "bg-[#B01070] text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
            ].join(" ")}
          >
            Presentes & Trocas
            {notifications && (notifications.activeTradesCount > 0 || notifications.pendingGiftsCount > 0) && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white animate-pulse">
                {notifications.activeTradesCount + notifications.pendingGiftsCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            className={[
              "px-4 py-2 rounded-xl text-[12px] font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap relative",
              activeTab === "requests" ? "bg-[#B01070] text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
            ].join(" ")}
          >
            Solicitações ({incomingRequests.length})
            {notifications && notifications.pendingFriendRequests > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white animate-pulse">
                {notifications.pendingFriendRequests}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sent")}
            className={[
              "px-4 py-2 rounded-xl text-[12px] font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
              activeTab === "sent" ? "bg-[#B01070] text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
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
                  className="flex flex-col sm:flex-row sm:items-center justify-between border border-gray-100 rounded-2xl p-4 hover:bg-gray-50/50 transition-colors gap-4"
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

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setModalState({ isOpen: true, type: 'gift', friendId: friend.friendId, title: `Presentear ${friend.username}` })}
                        disabled={isGiftOnCooldown(friend.friendId)}
                        title={isGiftOnCooldown(friend.friendId) ? "Aguarde para enviar outro presente" : ""}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-pink-200 text-[#B01070] hover:bg-pink-50 font-extrabold italic uppercase text-[10px] tracking-wide transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaGift />
                        Presente
                      </button>
                    <button
                      onClick={() => setModalState({ isOpen: true, type: 'trade', friendId: friend.friendId, title: `Ofertar Troca para ${friend.username}` })}
                      disabled={hasActiveTrade}
                      title={hasActiveTrade ? "Você já possui uma troca em andamento" : ""}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-blue-200 text-blue-600 hover:bg-blue-50 font-extrabold italic uppercase text-[10px] tracking-wide transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaExchangeAlt />
                      Trocar
                    </button>
                    <Link
                      href={`/home/public/${friend.username}`}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#B01070] text-white hover:bg-[#FF99D7] font-extrabold italic uppercase text-[10px] tracking-wide transition-all shadow-sm"
                    >
                      <FaBookOpen />
                      Ver Álbum
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ================= TAB 2: PRESENTES & TROCAS ================= */}
        {activeTab === "trades" && (
          <div className="flex flex-col gap-8">
            {/* Trades Section */}
            <div>
              <h3 className="text-[15px] font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2 flex items-center gap-2">
                <FaExchangeAlt className="text-blue-500" />
                Ofertas de Troca Pendentes
              </h3>
              {trades.incoming.length === 0 && trades.outgoing.length === 0 ? (
                <p className="text-[13px] text-gray-400">Nenhuma troca em andamento.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* Incoming Trades */}
                  {trades.incoming.map((t) => (
                    <div key={t.id} className="border border-blue-100 bg-blue-50/30 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-blue-600 uppercase">Proposta Recebida de {t.sender?.username}</span>
                        {t.status === 'pending' && (
                          <p className="text-[13px] text-gray-600 mt-1">
                            Ofereceu: <strong>{t.sender_cat?.name} ({t.sender_cat?.rarity})</strong>.
                          </p>
                        )}
                        {t.status === 'countered' && (
                          <p className="text-[13px] text-gray-600 mt-1">
                            Você contra-ofertou com: <strong>{t.receiver_cat?.name}</strong>. Aguardando resposta.
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {t.status === 'pending' && (
                          <>
                            <button
                              onClick={() => setModalState({ isOpen: true, type: 'counter', tradeId: t.id, title: `Responder Troca de ${t.sender?.username}`, rarityFilter: t.sender_cat?.rarity })}
                              disabled={isProcessing !== null}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] uppercase"
                            >
                              Oferecer Carta
                            </button>
                            <button
                              onClick={() => handleRejectTrade(t.id)}
                              disabled={isProcessing !== null}
                              className="px-3 py-1.5 rounded-lg bg-gray-500 hover:bg-gray-400 text-white font-bold text-[11px] uppercase"
                            >
                              Recusar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Outgoing Trades */}
                  {trades.outgoing.map((t) => (
                    <div key={t.id} className="border border-purple-100 bg-purple-50/30 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-purple-600 uppercase">Proposta Enviada para {t.receiver?.username}</span>
                        {t.status === 'pending' && (
                          <p className="text-[13px] text-gray-600 mt-1">
                            Aguardando ele responder sua oferta de: <strong>{t.sender_cat?.name}</strong>.
                          </p>
                        )}
                        {t.status === 'countered' && (
                          <p className="text-[13px] text-gray-600 mt-1">
                            Ele ofereceu <strong>{t.receiver_cat?.name}</strong> em troca do seu <strong>{t.sender_cat?.name}</strong>.
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {t.status === 'countered' && (
                          <>
                            <button
                              onClick={() => handleAcceptTrade(t.id)}
                              disabled={isProcessing !== null}
                              className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold text-[11px] uppercase"
                            >
                              Aceitar
                            </button>
                            <button
                              onClick={() => handleRejectTrade(t.id)}
                              disabled={isProcessing !== null}
                              className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-white font-bold text-[11px] uppercase"
                            >
                              Recusar
                            </button>
                          </>
                        )}
                        {t.status === 'pending' && (
                           <button
                             onClick={() => handleCancelTrade(t.id)}
                             disabled={isProcessing !== null}
                             className="px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-600 font-bold text-[11px] uppercase"
                           >
                             Cancelar
                           </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Gifts Section */}
            <div>
              <h3 className="text-[15px] font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2 flex items-center gap-2">
                <FaBoxOpen className="text-pink-500" />
                Histórico de Presentes
              </h3>
              {initialGifts.incoming.length === 0 && initialGifts.outgoing.length === 0 ? (
                <p className="text-[13px] text-gray-400">Nenhum presente enviado ou recebido recentemente.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {initialGifts.incoming.map((g) => (
                    <div key={g.id} className="text-[13px] text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center justify-between">
                      <div>
                        <span>Você recebeu <strong>{g.cat?.name}</strong> de <strong>{g.sender?.username}</strong>.</span>
                        {g.status === 'pending' && (
                          <span className="ml-2 text-[10px] bg-pink-100 text-pink-700 font-bold px-1.5 py-0.5 rounded uppercase">Pendente</span>
                        )}
                      </div>
                      {g.status === 'pending' && (
                        <button
                          onClick={() => handleReceiveGift(g.id)}
                          disabled={isProcessing !== null}
                          className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold text-[10px] uppercase shadow-sm cursor-pointer"
                        >
                          Receber
                        </button>
                      )}
                    </div>
                  ))}
                  {initialGifts.outgoing.map((g) => (
                    <div key={g.id} className="text-[13px] text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      Você enviou <strong>{g.cat?.name}</strong> para <strong>{g.receiver?.username}</strong>.
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: SOLICITAÇÕES RECEBIDAS ================= */}
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

        {/* ================= TAB 4: CONVITES ENVIADOS ================= */}
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

      <CardSelectorModal 
        isOpen={modalState.isOpen} 
        onClose={() => setModalState({ ...modalState, isOpen: false })} 
        onSelect={handleSelectCard}
        title={modalState.title}
        rarityFilter={modalState.rarityFilter}
      />
      {isProcessing === 'modal' && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
            <div className="bg-white px-6 py-4 rounded-xl shadow-lg font-bold text-[#B01070]">
               Processando...
            </div>
         </div>
      )}
    </div>
  );
}
