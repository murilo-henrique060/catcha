"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaCoins, FaCog } from "react-icons/fa";
import { HiChevronDoubleRight, HiDotsVertical } from "react-icons/hi";
import { TbCardsFilled } from "react-icons/tb";
import { IoMdExit } from "react-icons/io";

import { logout } from "@/lib/controllers/AuthController";
import { useUser } from "@/lib/contexts/UserContext";

type NavbarWidgetProps = {
  username?: string;
  coins?: number;
  className?: string;
};

const navigationItems = [
  { label: "INICIO", href: "/home" },
  { label: "ÁLBUM", href: "/home/album" },
  { label: "LOJA", href: "/home/shop" },
  { label: "PÚBLICO", href: "/home/public" },
  { label: "AMIGOS", href: "/home/friends" },
];

export function NavbarWidget({ username = "Username", coins = 0, className = "" }: NavbarWidgetProps) {
  const { profile, isLoading, items } = useUser();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const displayUsername = (!isLoading && profile) ? profile.username : username;
  const displayCoins = (!isLoading && profile) ? profile.money : coins;
  const displayCardsDrawn = (!isLoading && profile) ? profile.cards_drawn : 0;

  const displaySkipItemCount = (!isLoading && items)
    ? (items.find((i) => i.item.type === 'skip' || i.item.name === 'Acelerar')?.quantity ?? 0)
    : 0;

  const [animatedCoins, setAnimatedCoins] = useState(displayCoins);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  const animatedCoinsRef = useRef(animatedCoins);
  useEffect(() => {
    animatedCoinsRef.current = animatedCoins;
  }, [animatedCoins]);

  // Sync initial state when displayCoins is first resolved from isLoading = true to false
  useEffect(() => {
    if (!isLoading && profile && !hasInitialized) {
      Promise.resolve().then(() => {
        setAnimatedCoins(profile.money);
        setHasInitialized(true);
      });
    }
  }, [isLoading, profile, hasInitialized]);

  // Handle animate increment/decrement
  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 800; // 800ms
    const startVal = animatedCoinsRef.current;
    const endVal = displayCoins;

    if (startVal === endVal) return;

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      const easeProgress = progress * (2 - progress); // easeOutQuad
      const currentVal = Math.floor(startVal + (endVal - startVal) * easeProgress);
      setAnimatedCoins(currentVal);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setIsUpdating(false);
      }
    };

    Promise.resolve().then(() => {
      setIsUpdating(true);
      animationFrameId = window.requestAnimationFrame(step);
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      setIsUpdating(false);
    };
  }, [displayCoins]);


  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const updateIndicator = () => {
      const activeTabEl = tabsContainerRef.current?.querySelector('[data-active="true"]') as HTMLElement | null;
      if (activeTabEl) {
        setIndicatorStyle({
          left: activeTabEl.offsetLeft,
          width: activeTabEl.offsetWidth,
        });
      } else {
        setIndicatorStyle({
          left: 0,
          width: 0,
        });
      }
    };

    // Run layout update
    updateIndicator();

    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [pathname]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <nav className={`w-full border-b-2 border-[#FF99D7] bg-[linear-gradient(90deg,#C40873_2.02%,#B01070_78.46%,#8C1D6B_99.58%)] shadow-[0_4px_6px_0_rgba(0,0,0,0.25)] ${className}`}>
      <div className="mx-auto flex h-14 w-full max-w-[1366px] items-stretch justify-between pe-2 sm:pe-4">
        <div ref={tabsContainerRef} className="relative flex h-full items-stretch gap-1 overflow-x-auto">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                data-active={isActive}
                className={[
                  "flex items-center px-3 text-[15px] font-bold italic uppercase tracking-wide transition-colors duration-200 sm:px-4",
                  isActive
                    ? "text-white"
                    : "text-white/95 hover:text-white/80 hover:text-white",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Animated Indicator Bar */}
          <div
            className={[
              "absolute bottom-0 h-[3px] bg-[#FF99D7] transition-all duration-300 ease-out shadow-[0_-1px_6px_rgba(255,153,215,0.4)]",
              indicatorStyle.width === 0 ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"
            ].join(" ")}
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`
            }}
          />
        </div>

        <div className="relative flex items-center gap-2 sm:gap-3" ref={dropdownRef}>
          <div className={[
            "flex items-center gap-1.5 rounded-full bg-[#7A0A4B]/90 px-3 py-1.5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-300",
            isUpdating ? "scale-105 bg-[#BD2C85]/90 border border-[#FF99D7]/30" : ""
          ].join(" ")}>
            <FaCoins className={[
              "text-[18px] text-[#FFD54A] drop-shadow-sm",
              isUpdating ? "animate-bounce" : ""
            ].join(" ")} />
            <span className="text-[14px] font-bold leading-none">{animatedCoins.toLocaleString("pt-BR")}</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-[#7A0A4B]/90 px-3 py-1.5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <HiChevronDoubleRight className="text-[18px] text-[#8CC7FF]" />
            <span className="text-[14px] font-bold leading-none">{displaySkipItemCount}</span>
          </div>

          <button
            type="button"
            aria-label="Mais opções"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((currentValue) => !currentValue)}
            className="grid h-8 w-8 place-items-center rounded-full text-white transition-colors hover:bg-white/10 hover:text-white/80"
          >
            <HiDotsVertical className="text-[22px]" />
          </button>

          {menuOpen ? (
            <div className="absolute right-0 top-full z-20 mt-3 w-64 rounded-[20px] bg-white px-4 py-4 text-[#B01070] shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
              <div className="text-center">
                <p className="text-[18px] font-bold leading-none italic uppercase">{displayUsername}</p>

                <div className="mt-3 flex items-center justify-center gap-6">
                  <div className={[
                    "flex items-center gap-1.5 transition-all duration-300",
                    isUpdating ? "scale-105 text-[#FF99D7] font-bold" : ""
                  ].join(" ")}>
                    <FaCoins className="text-[16px] text-[#E10B83]" />
                    <span className="text-[15px] font-normal leading-none">{animatedCoins.toLocaleString("pt-BR")}</span>
                  </div>


                  <div className="flex items-center gap-1.5">
                    <TbCardsFilled className="text-[16px] text-[#E10B83]" />
                    <span className="text-[15px] font-normal leading-none">{displayCardsDrawn.toLocaleString("pt-BR")}</span>
                  </div>
                </div>
              </div>


              <div className="my-4 h-px bg-[#E8E1E7]" />

              <Link
                href="/home/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-2 py-2 text-[16px] font-normal transition-colors hover:bg-[#FCE8F4]"
              >
                <FaCog className="text-[20px] leading-none" />
                <span>Perfil</span>
              </Link>

              <form action={logout} className="mt-1.5">
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-[16px] font-normal transition-colors hover:bg-[#FCE8F4]"
                >
                  <IoMdExit className="text-[20px] leading-none" />
                  <span>Sair</span>
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
