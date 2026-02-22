import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getIssueDetails } from "../../../../services/jira";
import { PokerSession } from "@/components/session";
import { FiShare2, FiCopy } from "react-icons/fi";
import { CopyLinkButton } from "@/components/ui/copy-link-button";

export default async function PokerPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const issueKey = params.id;
  const issue = await getIssueDetails(issueKey);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Session Header with Shareable Link */}
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
        <div>
          <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-lime-400">
            SESSION ID: {issueKey}
          </h1>
          <p className="text-zinc-500 text-[10px] uppercase font-bold mt-1">
            Share this ID with your team to join
          </p>
        </div>
        <CopyLinkButton sessionId={issueKey} />
      </div>

      <div className="flex-1">
        <PokerSession 
          sessionId={issueKey} 
          user={{
            ...session.user,
            name: session.user.name ?? ""
          }} 
          currentIssue={issue}
          onReturnToSelector={() => redirect("/dashboard")}
        />
      </div>
    </div>
  );
}