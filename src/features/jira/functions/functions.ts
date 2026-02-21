// lib/jira.ts

/**
 * Shared configuration for Jira API requests.
 * Uses Buffer for Base64 encoding which is standard in Node.js/Vercel environments.
 */
const JIRA_CONFIG = {
  baseUrl: process.env.JIRA_BASE_URL,
  headers: {
    Authorization: `Basic ${Buffer.from(
      `${process.env.JIRA_USER}:${process.env.JIRA_API_KEY}`
    ).toString("base64")}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  },
};

/**
 * Generic helper to handle paginated Jira Agile requests.
 */
async function fetchPaginatedData<T>(endpoint: string, dataKey: string): Promise<T[]> {
  let allData: T[] = [];
  let isLast = false;
  let startAt = 0;

  while (!isLast) {
    const url = `${JIRA_CONFIG.baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}startAt=${startAt}`;
    const response = await fetch(url, {
      method: "GET",
      headers: JIRA_CONFIG.headers,
      next: { revalidate: 60 }, // Optional: Next.js caching
    });

    if (!response.ok) {
      throw new Error(`Jira API error [${response.status}]: ${response.statusText}`);
    }

    const json = await response.json();
    const values = json[dataKey] || [];
    allData = [...allData, ...values];
    
    isLast = json.isLast ?? true;
    startAt += values.length || 50;
  }

  return allData;
}

/**
 * Fetches all available boards.
 */
export async function getBoardData() {
  const boards = await fetchPaginatedData<any>("/rest/agile/1.0/board", "values");
  return boards.map(board => ({
    id: board.id,
    name: board.name,
    type: board.type,
  }));
}

/**
 * Fetches sprints for a specific board.
 */
export async function getSprints(boardId: number | string) {
  const sprints = await fetchPaginatedData<any>(`/rest/agile/1.0/board/${boardId}/sprint`, "values");
  return sprints.map(sprint => ({
    id: sprint.id,
    name: sprint.name,
    state: sprint.state,
  }));
}

/**
 * Fetches issues for a specific sprint.
 */
export async function getIssues(sprintId: number | string) {
  const issues = await fetchPaginatedData<any>(`/rest/agile/1.0/sprint/${sprintId}/issue`, "issues");
  return issues.map(issue => ({
    id: issue.id,
    key: issue.key,
    summary: issue.fields.summary,
  }));
}

/**
 * Fetches detailed information for a single issue.
 */
export async function getIssueDetails(issueId: number | string) {
  const response = await fetch(`${JIRA_CONFIG.baseUrl}/rest/api/3/issue/${issueId}`, {
    headers: JIRA_CONFIG.headers,
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

/**
 * Updates story points for a Jira issue (Server Action compatible).
 */
export async function setIssueStoryPoints(issueId: number | string, storyPoints: number) {
  const response = await fetch(`${JIRA_CONFIG.baseUrl}/rest/api/3/issue/${issueId}`, {
    method: "PUT",
    headers: JIRA_CONFIG.headers,
    body: JSON.stringify({
      fields: {
        customfield_10026: storyPoints,
      },
    }),
  });

  if (!response.ok) throw new Error("Failed to update story points");
  return { success: true };
}

/**
 * Utility to convert Atlassian Document Format (ADF) to plain text.
 */
function adfToPlainText(node: any): string {
  if (!node) return "";
  const parts: string[] = [];
  const blocks = new Set(["paragraph", "heading", "listItem"]);

  function walk(n: any) {
    if (n.type === "text") parts.push(n.text || "");
    if (Array.isArray(n.content)) {
      n.content.forEach(walk);
      if (blocks.has(n.type)) parts.push("\n");
    }
  }

  walk(node);
  return parts.join("").trim();
}