import { JIRA_HEADERS } from "./config";
import { JiraIssue } from "./types";
import { adfToPlainText } from "./utils";

export async function getIssueDetails(issueId: number | string): Promise<JiraIssue & { assignee: string; reporter: string; description: string }> {
  const response = await fetch(`${process.env.JIRA_BASE_URL}/rest/api/3/issue/${issueId}`, {
    headers: JIRA_HEADERS,
  });

  if (!response.ok) throw new Error("Failed to fetch issue details");
  const data = await response.json();

  return {
    id: data.id,
    key: data.key,
    status: data.fields.status.name,
    assignee: data.fields.assignee?.displayName || "Unassigned",
    reporter: data.fields.reporter?.displayName || "Unknown",
    summary: data.fields.summary,
    description: adfToPlainText(data.fields.description),
    storyPoints: data.fields.customfield_10026 || null,
  };
}