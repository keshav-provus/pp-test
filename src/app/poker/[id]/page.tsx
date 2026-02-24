import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { PokerSession } from "@/components/pages/poker-session";

export default async function PokerPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ host?: string }>
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const isHost = resolvedSearchParams.host === "true";

  return (
    <main className="h-screen bg-[#0a0a0a]">
      <PokerSession 
        sessionId={resolvedParams.id} 
        user={{
          id: session.user.id,
          name: session.user.name ?? "Unknown"
        }} 
        isHost={isHost}
      />
    </main>
  );
}