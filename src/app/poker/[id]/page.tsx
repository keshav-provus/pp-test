import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getIssueDetails } from "../../../../services/jira";
import { PokerSession } from "@/components/session";

// In Next.js 15, params is a Promise
export default async function PokerPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Await the params to get the actual ID
  const resolvedParams = await params;
  const issueKey = resolvedParams.id;

  if (!issueKey) {
    redirect("/dashboard");
  }

  // Fetch issue details with the resolved key
  let issue;
  try {
    issue = await getIssueDetails(issueKey);
  } catch (error) {
    console.error("Failed to load poker session:", error);
    // Redirect if the issue doesn't exist to prevent a crash loop
    redirect("/dashboard?error=issue-not-found");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <div className="flex-1">
        <PokerSession 
          sessionId={issueKey} 
          user={{
            ...session.user,
            name: session.user.name ?? "Unknown"
          }} 
          currentIssue={issue}
          onReturnToSelector={() => redirect("/dashboard")}
        />
      </div>
    </div>
  );
}