'use client';

import { useEffect, useState } from "react";
import { FaClock, FaForward } from "react-icons/fa6";
import { GiUpCard } from "react-icons/gi";

type DrawCooldownWidgetProps = {
  nextDraw: string;
  drawIntervalMs: number;
};

export function DrawCooldownWidget({ nextDraw, drawIntervalMs }: DrawCooldownWidgetProps) {
  const [remainingTime, setRemainingTime] = useState<number>(0);

  useEffect(() => {
    const calculateRemaining = () => {
      const nextDrawTime = new Date(nextDraw).getTime();
      const now = new Date().getTime();
      const diff = nextDrawTime - now;
      return Math.max(0, Math.min(drawIntervalMs, diff));
    };

    Promise.resolve().then(() => {
      setRemainingTime(calculateRemaining());
    });

    // Update once a minute (every 60 seconds)
    const interval = setInterval(() => {
      setRemainingTime(calculateRemaining());
    }, 60000);

    return () => clearInterval(interval);
  }, [nextDraw, drawIntervalMs]);

  // Format time as hh:mm
  const hours = Math.floor(remainingTime / (1000 * 60 * 60));
  const minutes = Math.ceil((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
  
  // Handle standard hour overflow/rounding (e.g. if minutes round up to 60)
  let displayHours = hours;
  let displayMinutes = minutes;
  if (displayMinutes === 60) {
    displayMinutes = 0;
    displayHours += 1;
  }

  const formattedTime = `${String(displayHours).padStart(2, "0")}:${String(displayMinutes).padStart(2, "0")}`;
  
  // Cooldown progress: 0% when 1 hour remaining, 100% when 0 remaining
  const loadPercentage = (1 - remainingTime / drawIntervalMs) * 100;
  const isReady = remainingTime === 0;

  return (
    <>
      <div className="bg-[#EAEAEA] flex items-center shadow-[0_4px_6px_0_rgba(0,0,0,0.25)] rounded-lg p-3 w-full max-w-[42.857vh] text-[#BD2C85] font-bold gap-2">
        <FaClock className="text-[20px]" />
        <span>{formattedTime}</span>

        <div className="flex-grow flex rounded-full bg-[#FFFFFF] h-[5px]">
          <div
            className="rounded-full animate-gradient bg-gradient-to-r from-[#FA6DBD] via-[#9F267B] via-[#E10B83] to-[#FA6DBD] h-full transition-all duration-1000 ease-linear"
            style={{ width: `${loadPercentage}%` }}
          />
          <div className="flex-grow" />
        </div>
      </div>

      <div className="flex gap-2.5 w-full max-w-[42.857vh]">
        <button
          type="button"
          disabled={!isReady}
          className={[
            "flex-grow italic flex items-center justify-center gap-1 rounded-[6px] bg-[#D30076] px-3 py-1.5 text-[15px] font-bold text-white shadow-[0_3px_8px_rgba(211,0,118,0.35)] transition-all",
            !isReady ? "opacity-50 cursor-not-allowed shadow-none" : "hover:bg-[#B90067]"
          ].join(" ")}
        >
          <GiUpCard className="text-[16px]" />
          SORTEAR
        </button>

        <button
          type="button"
          className="flex-grow italic flex items-center justify-center gap-2 rounded-[6px] bg-[#D30076] px-3 py-1.5 text-[15px] font-bold text-white shadow-[0_3px_8px_rgba(211,0,118,0.35)] transition-colors hover:bg-[#B90067]"
        >
          <FaForward className="text-[16px]" />
          ACELERAR
        </button>
      </div>
    </>
  );
}

