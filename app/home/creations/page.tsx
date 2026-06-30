import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/controllers/AuthController";
import { getCreatedCats } from "@/lib/controllers/CardActions";
import { CreationsWidget } from "@/ui/widgets/creations-widget";

async function CreationsContent() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth");
  }

  const createdCats = await getCreatedCats();
  return <CreationsWidget createdCats={createdCats} />;
}

function CreationsSkeleton() {
  return (
    <div className="flex h-full w-full flex-col bg-[#FFFAFD]">
      {/* Header */}
      <div className="flex items-center justify-between bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
          <div className="flex flex-col gap-1.5">
            <div className="h-6 w-40 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6 overflow-hidden">
        <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gray-200 animate-pulse" />
            <div className="flex flex-col gap-1.5">
              <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
              <div className="h-6 w-12 rounded bg-gray-200 animate-pulse" />
            </div>
          </div>
          <div className="h-10 w-40 rounded-xl bg-gray-200 animate-pulse" />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-6 p-1 pb-8">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="aspect-[0.714] w-full rounded-xl bg-gray-200 animate-pulse shadow-sm" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreationsPage() {
  return (
    <div className="flex h-[calc(100vh-56px)] w-full flex-col">
      <Suspense fallback={<CreationsSkeleton />}>
        <CreationsContent />
      </Suspense>
    </div>
  );
}
