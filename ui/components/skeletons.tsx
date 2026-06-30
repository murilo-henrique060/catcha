import React from "react";

export function NavbarSkeleton() {
  return (
    <nav className="w-full border-b-2 border-[#FF99D7] bg-[linear-gradient(90deg,#C40873_2.02%,#B01070_78.46%,#8C1D6B_99.58%)] shadow-[0_4px_6px_0_rgba(0,0,0,0.25)] h-14 flex items-center justify-between px-6 select-none">
      {/* Navigation skeleton items */}
      <div className="flex gap-4 animate-pulse">
        <div className="w-16 h-4 bg-white/20 rounded" />
        <div className="w-16 h-4 bg-white/20 rounded" />
        <div className="w-16 h-4 bg-white/20 rounded" />
        <div className="w-16 h-4 bg-white/20 rounded" />
        <div className="w-16 h-4 bg-white/20 rounded" />
      </div>
      {/* Right side skeleton items */}
      <div className="flex gap-3 animate-pulse">
        <div className="w-20 h-7 bg-[#7A0A4B]/40 rounded-full" />
        <div className="w-12 h-7 bg-[#7A0A4B]/40 rounded-full" />
        <div className="w-8 h-8 bg-white/10 rounded-full" />
      </div>
    </nav>
  );
}

export function HomeSkeleton() {
  return (
    <section className="flex-grow flex py-4 w-full">
      <div className="flex-[9] flex flex-col items-center justify-center gap-4 w-full">
        {/* Card skeleton */}
        <div className="h-[60vh] w-[42.857vh] bg-white rounded-[24px] animate-pulse shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-gray-100" />
        {/* Timer pill skeleton */}
        <div className="h-[48px] w-[42.857vh] bg-gray-100 rounded-lg animate-pulse" />
        {/* Buttons skeleton */}
        <div className="flex gap-2.5 w-full max-w-[42.857vh]">
          <div className="flex-grow h-[36px] bg-[#D30076]/40 rounded-[6px] animate-pulse" />
          <div className="flex-grow h-[36px] bg-[#D30076]/40 rounded-[6px] animate-pulse" />
        </div>
      </div>
      <div className="flex-[3] flex items-center justify-center">
        {/* Stats card skeleton */}
        <div className="w-full max-w-[320px] bg-white rounded-l-lg shadow-[0_4px_6px_0_rgba(0,0,0,0.25)] overflow-hidden animate-pulse">
          {/* Header */}
          <div className="h-[60px] bg-[#C40873]/20" />
          {/* List items */}
          <div className="p-6 flex flex-col gap-6">
            <div className="h-6 w-full bg-gray-100 rounded" />
            <div className="h-6 w-full bg-gray-100 rounded" />
            <div className="h-6 w-full bg-gray-100 rounded" />
            <div className="h-6 w-full bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function AlbumSkeleton() {
  return (
    <div className="flex-grow flex flex-col">
      {/* Top Header & Filter Controls Row */}
      <div className="w-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-4 px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-grow flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:pr-6">
          <div className="flex items-center gap-3">
            <div className="w-40 h-6 bg-gray-200/60 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-3 animate-pulse">
            <div className="h-11 w-11 bg-gray-200/60 rounded-xl" />
            <div className="h-11 w-40 bg-gray-200/60 rounded-xl" />
          </div>
        </div>
        <div className="hidden md:block w-px h-8 bg-gray-200" />
        <div className="relative md:w-[35%] flex-shrink-0 animate-pulse">
          <div className="w-full h-11 bg-gray-200/60 rounded-xl" />
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="relative w-full flex-grow flex flex-col">
        {/* Left Side: Cards Grid */}
        <div className="w-full lg:absolute lg:left-0 lg:top-0 lg:bottom-0 lg:w-[calc(65%-20px)] h-auto lg:h-full p-4 pr-2 lg:pr-4">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-6 p-1 pb-8 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-full aspect-[0.714] bg-gray-200/40 rounded-[20px] shadow-sm" />
            ))}
          </div>
        </div>

        {/* Right Side: Selected Card Panel */}
        <div className="w-full lg:absolute lg:right-0 lg:top-0 lg:bottom-0 lg:w-[calc(37%-10px)] h-auto lg:h-full flex flex-col items-center justify-start p-3 mt-6 lg:mt-0">
          <div className="w-full h-full min-h-[400px] rounded-3xl bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex flex-col items-center justify-between gap-2 animate-pulse">
            <div className="flex-grow flex items-center justify-center w-full">
              <div className="h-[calc(100vh-300px)] w-[calc((100vh-300px)*0.714)] bg-gray-100 rounded-[24px]" />
            </div>
            <div className="w-full flex flex-col items-center gap-3.5 mt-4">
              <div className="w-32 h-6 bg-gray-100 rounded" />
              <div className="w-48 h-6 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ShopSkeleton() {
  return (
    <div className="flex-grow flex flex-col select-none mx-auto w-full px-4 pt-3">
      <div className="relative w-full flex-grow flex flex-col">
        {/* Left Column */}
        <div className="w-full lg:absolute lg:left-0 lg:top-0 lg:bottom-0 h-auto lg:h-full lg:w-[calc(65%-12px)] p-1 pr-2 lg:pr-4">
          <div className="flex flex-col gap-6 pb-6 animate-pulse">
            <div className="flex flex-col gap-2.5">
              <div className="w-16 h-4 bg-[#B01070]/20 rounded ml-1" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-32 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-2.5">
                  <div className="w-12 h-14 bg-gray-100 rounded-lg" />
                  <div className="w-16 h-3 bg-gray-100 rounded" />
                </div>
                <div className="h-32 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-2.5">
                  <div className="w-12 h-14 bg-gray-100 rounded-lg" />
                  <div className="w-16 h-3 bg-gray-100 rounded" />
                </div>
                <div className="h-32 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-2.5 col-span-2">
                  <div className="w-12 h-12 bg-gray-100 rounded-full" />
                  <div className="w-20 h-3 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="w-16 h-4 bg-[#B01070]/20 rounded ml-1" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-32 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-2.5">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl" />
                  <div className="w-32 h-3 bg-gray-100 rounded mt-1" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-full lg:absolute lg:right-0 lg:top-0 lg:bottom-0 h-auto lg:h-full flex flex-col items-center justify-start p-3 mt-6 lg:mt-0 lg:w-[calc(35%-12px)]">
          <div className="w-full h-full min-h-[400px] rounded-3xl bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex flex-col items-center justify-between gap-4 animate-pulse">
            <div className="flex-grow flex flex-col items-center justify-center w-full gap-4">
              <div className="w-40 h-56 bg-gray-100 rounded-[24px]" />
              <div className="w-32 h-6 bg-gray-100 rounded" />
              <div className="w-48 h-8 bg-gray-100 rounded mt-2" />
            </div>
            <div className="w-full h-12 bg-[#B01070]/20 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PublicSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-8 flex flex-col gap-6 select-none">
      <div className="w-full bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-4 px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
        <div>
          <div className="w-48 h-6 bg-[#B01070]/20 rounded" />
          <div className="w-64 h-3 bg-gray-200/60 rounded mt-2" />
        </div>
        <div className="relative md:w-[35%] flex-shrink-0">
          <div className="w-full h-11 rounded-xl bg-gray-100" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.06)] flex flex-col justify-between gap-5 relative overflow-hidden h-[210px]">
            <div className="absolute top-0 left-0 w-2 h-full bg-gray-100" />
            <div className="pl-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100" />
                <div className="flex flex-col gap-2">
                  <div className="w-32 h-4 bg-gray-200/60 rounded" />
                  <div className="w-24 h-3 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2">
                <div className="w-12 h-4 bg-gray-100 rounded" />
                <div className="w-28 h-4 bg-gray-200/40 rounded" />
              </div>
            </div>
            <div className="w-full grid grid-cols-2 gap-3 pl-2 mt-2">
              <div className="py-2.5 rounded-xl border border-gray-100 bg-gray-50 h-[38px]" />
              <div className="py-2.5 rounded-xl bg-[#B01070]/20 h-[38px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FriendsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[900px] px-4 py-8 flex flex-col gap-6 select-none">
      <div className="w-full bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-4 px-6 flex flex-col gap-4 animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="w-48 h-6 bg-[#B01070]/20 rounded" />
            <div className="w-64 h-3 bg-gray-200/60 rounded mt-2" />
          </div>
          <div className="py-2 px-4 rounded-xl bg-[#B01070]/20 h-9 w-40 self-start sm:self-auto" />
        </div>
        <div className="flex border-t border-gray-100 pt-3 gap-2">
          <div className="rounded-xl h-[34px] w-32 bg-gray-200/60" />
          <div className="rounded-xl h-[34px] w-32 bg-gray-100" />
          <div className="rounded-xl h-[34px] w-32 bg-gray-100" />
        </div>
      </div>

      <div className="w-full bg-white rounded-3xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-gray-100 min-h-[300px] flex flex-col justify-start animate-pulse">
        <div className="flex flex-col gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between border border-gray-100 rounded-2xl p-4 gap-4 h-[74px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100" />
                <div className="flex flex-col gap-2">
                  <div className="w-32 h-4 bg-gray-200/60 rounded" />
                  <div className="w-20 h-3 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="h-9 w-32 rounded-xl border border-gray-100 bg-gray-50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <section className="flex-grow flex items-center justify-center px-4 py-8 select-none">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col animate-pulse">
        <div className="flex justify-center border-b border-gray-100 pb-4">
          <div className="w-48 h-7 bg-[#B01070]/20 rounded" />
        </div>

        <div className="flex flex-col gap-1.5 mt-6">
          <div className="w-20 h-4 bg-gray-200/60 rounded" />
          <div className="w-full rounded-lg bg-gray-100 h-11" />
        </div>

        <div className="flex flex-col gap-1 py-2.5 mt-6">
          <div className="flex flex-col gap-1.5">
            <div className="w-32 h-4 bg-gray-200/60 rounded" />
            <div className="flex gap-2">
              <div className="flex-grow rounded-lg bg-gray-100 h-11" />
              <div className="rounded-lg bg-[#D30076]/40 w-[84px] h-11" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3.5 mt-2 border-t border-gray-100 pt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-gray-100 p-4 h-[74px]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100" />
                <div className="flex flex-col gap-1.5">
                  <div className="w-24 h-4 bg-gray-200/60 rounded" />
                  <div className="w-40 h-3 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
