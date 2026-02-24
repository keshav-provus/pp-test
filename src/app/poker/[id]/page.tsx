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
    /* UPDATED: Changed bg-[#0a0a0a] to bg-background and added text-foreground */
    <main className="h-screen bg-background text-foreground transition-colors duration-500 overflow-hidden">
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