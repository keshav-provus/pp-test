import { fetchJira } from "./config";
import { JiraIssue } from "./types";

export async function getIssues(sprintId: number | string): Promise<JiraIssue[]> {
  const issues = await fetchJira<any>(
    `/rest/agile/1.0/sprint/${sprintId}/issue`, 
    "issues"
  );
  
  return issues.map(issue => ({
    id: issue.id,
    key: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status?.name,
    storyPoints: issue.fields.customfield_10026 || null,
  }));
}