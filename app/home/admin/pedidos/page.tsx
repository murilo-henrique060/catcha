import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getBasicProfile } from "@/lib/controllers/UserController";
import { getPendingCards } from "@/lib/controllers/CardActions";
import { PedidosSkeleton } from "@/ui/components/skeletons";
import { PedidosWidget } from "@/ui/widgets/pedidos-widget";

export const unstable_instant = { prefetch: "static" };

export default async function PedidosPage() {
  return (
    <Suspense fallback={<PedidosSkeleton />}>
      <PedidosContent />
    </Suspense>
  );
}

async function PedidosContent() {
  const profileData = await getBasicProfile();

  if (!profileData || !profileData.profile) {
    redirect("/auth/login");
  }

  const role = profileData.profile.role;
  if (role !== 'admin' && role !== 'superadmin') {
    redirect("/home"); // Redirect non-admins
  }

  const pendingCards = await getPendingCards();

  return (
    <section className="flex-grow">
      <PedidosWidget cards={pendingCards} />
    </section>
  );
}
