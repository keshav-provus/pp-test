import { JIRA_HEADERS } from "./config";

export async function setIssueStoryPoints(issueId: number | string, storyPoints: number) {
  const response = await fetch(`${process.env.JIRA_BASE_URL}/rest/api/3/issue/${issueId}`, {
    method: "PUT",
    headers: JIRA_HEADERS,
    body: JSON.stringify({
      fields: {
        customfield_10026: storyPoints,
      },
    }),
  });

  if (!response.ok) throw new Error("Failed to update story points");
  return { success: true };
}