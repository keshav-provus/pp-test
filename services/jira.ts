"use server";

const JIRA_CONFIG = {
  baseUrl: process.env.JIRA_BASE_URL || "",
  headers: {
    Authorization: `Basic ${Buffer.from(
      `${process.env.JIRA_USER}:${process.env.JIRA_API_KEY}`
    ).toString("base64")}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  },
};

async function fetchPaginatedData<T>(endpoint: string, dataKey: string): Promise<T[]> {
  if (!JIRA_CONFIG.baseUrl) throw new Error("JIRA_BASE_URL is missing in .env");

  let allData: T[] = [];
  let isLast = false;
  let startAt = 0;

  const cleanBase = JIRA_CONFIG.baseUrl.replace(/\/$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  while (!isLast) {
    const separator = cleanEndpoint.includes('?') ? '&' : '?';
    const url = `${cleanBase}${cleanEndpoint}${separator}startAt=${startAt}`;

    const response = await fetch(url, {
      method: "GET",
      headers: JIRA_CONFIG.headers as HeadersInit,
      next: { revalidate: 0 }, // Set to 0 to ensure real-time accuracy during planning
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jira API Error [${response.status}]: ${errorText}`);
    }

    const json = await response.json();
    const values = json[dataKey] || [];
    allData = [...allData, ...values];

    // Check if we've reached the end
    isLast = json.isLast ?? (values.length < (json.maxResults || 50));
    startAt += values.length;
  }
  return allData;
}

/**
 * Fetch all boards accessible to the user
 */
export async function getBoardData() {
  const data = await fetchPaginatedData<any>("/rest/agile/1.0/board", "values");
  return data.map((b) => ({
    id: b.id.toString(),
    name: b.name,
    type: b.type.toLowerCase(),
  }));
}

/**
 * Fetch active and future sprints for a specific Scrum board
 */
export async function getSprints(boardId: string) {
  const data = await fetchPaginatedData<any>(`/rest/agile/1.0/board/${boardId}/sprint`, "values");
  // Filter out closed sprints; only Active and Future are estimable
  return data
    .filter((s: any) => s.state !== "closed")
    .map((s: any) => ({
      id: s.id.toString(),
      name: s.name,
      state: s.state,
    }));
}

/**
Standard mapping for Jira Issues to our local UI format
*/

const mapIssue = (issue: any) => ({
  id: issue.id,
  key: issue.key,
  summary: issue.fields.summary,
  status: issue.fields.status.name, // e.g., "In Progress"
  statusCategory: issue.fields.status.statusCategory.name, // e.g., "To Do" or "In Progress"
});

/**
 * Fetch issues from a specific Sprint (Scrum flow)
 * Excludes COMPLETED issues using JQL
 */
export async function getIssuesBySprint(sprintId: string) {
  // JQL: We want everything except issues in the 'Done' category
  const jql = encodeURIComponent("statusCategory != Done");
  const endpoint = `/rest/agile/1.0/sprint/${sprintId}/issue?jql=${jql}`;

  const data = await fetchPaginatedData<any>(endpoint, "issues");
  return data.map(mapIssue);
}

/**
 * Fetch issues directly from a Board (Kanban flow)
 * Excludes COMPLETED issues using JQL
 */
export async function getIssuesByBoard(boardId: string) {
  const jql = encodeURIComponent("statusCategory != Done");
  const endpoint = `/rest/agile/1.0/board/${boardId}/issue?jql=${jql}`;
  const data = await fetchPaginatedData<any>(endpoint, "issues");
  return data.map(mapIssue);
}

export async function updateIssueStatus(issueKey: string, targetStatus: string) {
  const cleanBase = process.env.JIRA_BASE_URL?.replace(/\/$/, "");  
  // 1. Get available transitions for this specific issue
  const transitionsUrl = `${cleanBase}/rest/api/2/issue/${issueKey}/transitions`;
  const res = await fetch(transitionsUrl, {
    method: "GET",
    headers: JIRA_CONFIG.headers as HeadersInit,
  });

  const { transitions } = await res.json();
  
  // 2. Find the transition ID that matches our target (e.g., "To Do", "In Progress")
  const transition = transitions.find((t: any) => 
    t.name.toLowerCase() === targetStatus.toLowerCase()
  );

  if (!transition) {
    throw new Error(`No transition found for status: ${targetStatus}`);
  }

  // 3. Perform the transition
  await fetch(transitionsUrl, {
    method: "POST",
    headers: JIRA_CONFIG.headers as HeadersInit,
    body: JSON.stringify({ transition: { id: transition.id } }),
  });

  return { success: true, newStatus: transition.name };
}

export async function getBoardBacklog(boardId: string) {
  const jql = encodeURIComponent("statusCategory != Done AND sprint is EMPTY");
  const endpoint = `/rest/agile/1.0/board/${boardId}/issue?jql=${jql}`;
  const data = await fetchPaginatedData<any>(endpoint, "issues");
  return data.map((issue: any) => ({
    id: issue.id,
    key: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status.name,
    statusCategory: issue.fields.status.statusCategory.name,
    source: 'backlog' // Metadata to identify source
  }));
}

export async function transitionToDone(issueKey: string) {
  const cleanBase = process.env.JIRA_BASE_URL?.replace(/\/$/, "");
  const transitionsUrl = `${cleanBase}/rest/api/2/issue/${issueKey}/transitions`;

  const res = await fetch(transitionsUrl, {
    method: "GET",
    headers: JIRA_CONFIG.headers as HeadersInit,
  });

  const { transitions } = await res.json();
  
  // Find transition that belongs to the 'Done' category
  const doneTransition = transitions.find((t: any) => 
    t.to.statusCategory.key === "done" || t.name.toLowerCase() === "done"
  );

  if (!doneTransition) throw new Error("No 'Done' transition available for this issue.");

  await fetch(transitionsUrl, {
    method: "POST",
    headers: JIRA_CONFIG.headers as HeadersInit,
    body: JSON.stringify({ transition: { id: doneTransition.id } }),
  });

  return { success: true };
}

export async function createJiraIssue(summary: string, boardId: string, issueType: string = "Task", sprintId?: string | null) {
  // Fetch project key associated with the board
  const boardRes = await fetch(`${JIRA_CONFIG.baseUrl}/rest/agile/1.0/board/${boardId}/project`, {
    headers: JIRA_CONFIG.headers as HeadersInit,
  });
  const projectData = await boardRes.json();
  const projectKey = projectData.values[0]?.key;

  if (!projectKey) throw new Error("Could not find project for this board");

  const fields: any = {
    project: { key: projectKey },
    summary: summary,
    issuetype: { name: issueType },
  };

  // If a sprintId is provided, add it to the custom field for sprints
  // Note: 'customfield_10020' is the standard for Jira Cloud; adjust if your instance differs.
  if (sprintId) {
    fields.customfield_10020 = parseInt(sprintId);
  }

  const response = await fetch(`${JIRA_CONFIG.baseUrl}/rest/api/2/issue`, {
    method: "POST",
    headers: JIRA_CONFIG.headers as HeadersInit,
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Jira Create Error:", errorData);
    throw new Error("Failed to create Jira issue");
  }
  
  return await response.json();
}

export async function moveIssueToBacklog(issueKey: string) {
  const response = await fetch(`${process.env.JIRA_BASE_URL}/rest/agile/1.0/backlog/issue`, {
    method: "POST",
    headers: JIRA_CONFIG.headers as HeadersInit,
    body: JSON.stringify({ issues: [issueKey] }),
  });

  if (response.status === 204 || response.ok) return true;
  throw new Error("Failed to move to backlog");
}

export async function moveIssueToSprint(issueKey: string, sprintId: string) {
  const response = await fetch(`${process.env.JIRA_BASE_URL}/rest/agile/1.0/sprint/${sprintId}/issue`, {
    method: "POST",
    headers: JIRA_CONFIG.headers as HeadersInit,
    body: JSON.stringify({ issues: [issueKey] }),
  });

  if (response.status === 204 || response.ok) return true;
  throw new Error("Failed to move to sprint");
}