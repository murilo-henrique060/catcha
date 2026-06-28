import { CardFace, CardRarity } from "@/ui/widgets/card-types";
import { redirect } from "next/navigation";

import { FaForward, FaClock } from "react-icons/fa6";
import { GiUpCard } from "react-icons/gi";

import { createSupabaseServerClient } from "@/lib/services/supabase/server";
import { NavbarWidget } from "@/ui/widgets/navbar";
import { CardWidget } from "@/ui/widgets/card";


const stats = [
  { label: "S", value: "1/10", percent: "10%", color: "#F5B400" },
  { label: "A", value: "1/20", percent: "50%", color: "#2F46FF" },
  { label: "B", value: "1/30", percent: "20%", color: "#16A34A" },
  { label: "C", value: "1/40", percent: "10%", color: "#6B7280" },
];

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const load_percentage = 50

  if (!data.user) {
    redirect("/auth/login");
  }

  const username = data.user?.user_metadata?.username ?? "Username";

  return (
    <main className="flex flex-col min-h-screen bg-[#F7F5F7]">
      <NavbarWidget username={username} />
      <section className="flex-grow flex py-4">
        <div className="flex-grow-6 flex flex-col items-center justify-center gap-4">
          <CardWidget className="h-[60vh] w-[42.857vh]" title="Card Title" rarity={CardRarity.C} start_face={CardFace.FRONT} image_url="/cats/cat001.webp" />

          <div className="bg-[#EAEAEA] flex items-center shadow-[0_4px_6px_0_rgba(0,0,0,0.25)] rounded-lg p-3 w-full max-w-[42.857vh] text-[#BD2C85] font-bold gap-2">
            <FaClock className="text-[20px]" />
            00:00

            <div className="flex-grow flex rounded-full bg-[#FFFFFF] h-[5px]">
              <div
                className="rounded-full animate-gradient bg-gradient-to-r from-[#FA6DBD] via-[#9F267B] via-[#E10B83] to-[#FA6DBD] h-full"
                style={{ width: `${load_percentage}%` }}
              />
              <div className="flex-grow" />
            </div>
          </div>

          <div className="flex gap-2.5 w-full max-w-[42.857vh]">
            <button
              type="button"
              className="flex-grow italic flex items-center justify-center gap-1 rounded-[6px] bg-[#D30076] px-3 py-1.5 text-[15px] font-bold text-white shadow-[0_3px_8px_rgba(211,0,118,0.35)] transition-colors hover:bg-[#B90067]"
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
        </div>
        <div className="flex-grow-4">

        </div>
      </section>
    </main>
  );
}
