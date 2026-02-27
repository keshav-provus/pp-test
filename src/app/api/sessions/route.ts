import { NextRequest, NextResponse } from "next/server";
import supabaseServer from "@/lib/supabaseServer";

// ─── POST /api/sessions — Save completed session ────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionCode,
      name,
      hostName,
      hostEmail,
      seriesKey,
      issues,
      participants,
    } = body as {
      sessionCode: string;
      name: string;
      hostName: string;
      hostEmail?: string;
      seriesKey: string;
      issues: {
        key: string;
        summary: string;
        source: "custom" | "jira";
        estimate?: string;
        votes?: Record<string, number | string | null>;
      }[];
      participants: { name: string; isHost: boolean }[];
    };

    const totalPoints = parseFloat(issues.reduce((sum, issue) => {
      const pts = parseFloat(issue.estimate || "0");
      return sum + (isNaN(pts) ? 0 : pts);
    }, 0).toFixed(2));

    // 1. Insert session
    const { data: session, error: sessionError } = await supabaseServer
      .from("sessions")
      .insert({
        session_code: sessionCode,
        name: name || "Untitled Session",
        host_name: hostName,
        host_email: hostEmail || null,
        series_key: seriesKey || "fibonacci",
        status: "completed",
        total_points: totalPoints,
      })
      .select("id")
      .single();

    if (sessionError || !session) {
      console.error("Failed to insert session:", sessionError);
      return NextResponse.json(
        { error: "Failed to save session", details: sessionError?.message },
        { status: 500 }
      );
    }

    const sessionId = session.id;

    // 2. Insert issues
    if (issues.length > 0) {
      const issueRows = issues.map((issue) => ({
        session_id: sessionId,
        issue_key: issue.key,
        summary: issue.summary,
        source: issue.source,
        estimate: issue.estimate || null,
        votes: issue.votes || {},
      }));

      const { error: issuesError } = await supabaseServer
        .from("session_issues")
        .insert(issueRows);

      if (issuesError) {
        console.error("Failed to insert issues:", issuesError);
      }
    }

    // 3. Insert participants
    if (participants.length > 0) {
      const participantRows = participants.map((p) => ({
        session_id: sessionId,
        name: p.name,
        is_host: p.isHost,
      }));

      const { error: participantsError } = await supabaseServer
        .from("session_participants")
        .insert(participantRows);

      if (participantsError) {
        console.error("Failed to insert participants:", participantsError);
      }
    }

    return NextResponse.json({ id: sessionId, totalPoints }, { status: 201 });
  } catch (err) {
    console.error("POST /api/sessions error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── GET /api/sessions — Fetch session history ──────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    let query = supabaseServer
      .from("sessions")
      .select(`
        *,
        session_issues (*),
        session_participants (*)
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (email) {
      query = query.eq("host_email", email);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch sessions:", error);
      return NextResponse.json(
        { error: "Failed to fetch sessions", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessions: data || [] });
  } catch (err) {
    console.error("GET /api/sessions error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
