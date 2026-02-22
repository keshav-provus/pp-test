"use server";

/**
 * Interfaces to ensure type safety across the application and prevent
 * Vercel build-time 'any' errors.
 */
export interface JiraBoard {
  id: string;
  name: string;
  type: string;
}

export interface JiraSprint {
  id: string;
  name: string;
  state: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  status: string;
  statusCategory: string;
  source?: string;
}

/**
 * Helper to retrieve and validate configuration.
 * Wrapping this in a function ensures we get the latest process.env values.
 */
const getJiraConfig = () => {
  const baseUrl = (process.env.JIRA_BASE_URL || "").trim();
  const user = (process.env.JIRA_USER || "").trim();
  const apiKey = (process.env.JIRA_API_KEY || "").trim();

  if (!baseUrl || !user || !apiKey) {
    throw new Error(
      "Missing JIRA environment variables (URL, User, or API Key)",
    );
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    headers: {
      Authorization: `Basic ${Buffer.from(`${user}:${apiKey}`).toString("base64")}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  };
};

/**
 * Generic paginated fetcher for Jira Agile APIs
 */
async function fetchPaginatedData<T>(
  endpoint: string,
  dataKey: string,
): Promise<T[]> {
  const config = getJiraConfig();
  let allData: T[] = [];
  let isLast = false;
  let startAt = 0;

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  while (!isLast) {
    const separator = cleanEndpoint.includes("?") ? "&" : "?";
    const url = `${config.baseUrl}${cleanEndpoint}${separator}startAt=${startAt}`;

    const response = await fetch(url, {
      method: "GET",
      headers: config.headers as HeadersInit,
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jira API Error [${response.status}]: ${errorText}`);
    }

    const json = await response.json();
    const values = (json[dataKey] as T[]) || [];
    allData = [...allData, ...values];

    isLast = json.isLast ?? values.length < (json.maxResults || 50);
    startAt += values.length;
  }
  return allData;
}

/**
 * Fetch all boards accessible to the user
 */
export async function getBoardData(): Promise<JiraBoard[]> {
  const data = await fetchPaginatedData<JiraBoard>(
    "/rest/agile/1.0/board",
    "values",
  );
  return data.map((b) => ({
    id: b.id.toString(),
    name: b.name,
    type: b.type.toLowerCase(),
  }));
}

/**
 * Fetch active and future sprints for a specific Scrum board
 */
export async function getSprints(boardId: string): Promise<JiraSprint[]> {
  const data = await fetchPaginatedData<JiraSprint>(
    `/rest/agile/1.0/board/${boardId}/sprint`,
    "values",
  );
  return data
    .filter((s: JiraSprint) => s.state !== "closed")
    .map((s: JiraSprint) => ({
      id: s.id.toString(),
      name: s.name,
      state: s.state,
    }));
}

/**
 * Standard mapping for Jira Issues to our local UI format
 */
interface JiraApiIssueFields {
  summary: string;
  status: {
    name: string;
    statusCategory: {
      name: string;
    };
  };
}

interface JiraApiIssue {
  id: string;
  key: string;
  fields: JiraApiIssueFields;
}

const mapIssue = (issue: JiraApiIssue): JiraIssue => ({
  id: issue.id,
  key: issue.key,
  summary: issue.fields.summary,
  status: issue.fields.status.name,
  statusCategory: issue.fields.status.statusCategory.name,
});

/**
 * Fetch issues from a specific Sprint (Scrum flow)
 */
export async function getIssuesBySprint(
  sprintId: string,
): Promise<JiraIssue[]> {
  const jql = encodeURIComponent("statusCategory != Done");
  const endpoint = `/rest/agile/1.0/sprint/${sprintId}/issue?jql=${jql}`;
  const data = await fetchPaginatedData<JiraApiIssue>(endpoint, "issues");
  return data.map(mapIssue);
}

export async function getIssuesByBoard(boardId: string): Promise<JiraIssue[]> {
  const jql = encodeURIComponent("statusCategory != Done");
  const endpoint = `/rest/agile/1.0/board/${boardId}/issue?jql=${jql}`;
  const data = await fetchPaginatedData<JiraApiIssue>(endpoint, "issues");
  return data.map(mapIssue);
}

/**
 * Retrieves the backlog for a board
 */
export async function getBoardBacklog(boardId: string): Promise<JiraIssue[]> {
  const jql = encodeURIComponent("statusCategory != Done AND sprint is EMPTY");
  const endpoint = `/rest/agile/1.0/board/${boardId}/issue?jql=${jql}`;
  const data = await fetchPaginatedData<JiraApiIssue>(endpoint, "issues");
  return data.map((issue: JiraApiIssue) => ({
    ...mapIssue(issue),
    source: "backlog",
  }));
}

/**
 * Performs an issue status transition with robust error checking
 */
export async function updateIssueStatus(
  issueKey: string,
  targetStatus: string,
) {
  const config = getJiraConfig();
  const transitionsUrl = `${config.baseUrl}/rest/api/2/issue/${issueKey}/transitions`;

  const res = await fetch(transitionsUrl, {
    method: "GET",
    headers: config.headers as HeadersInit,
    cache: "no-store", // Critical: Prevent Vercel from caching old transition lists
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `Failed to fetch available transitions for ${issueKey}: ${errorBody}`,
    );
  }

  const { transitions } = await res.json();
  interface JiraTransition {
    id: string;
    name: string;
    to?: {
      statusCategory?: {
        key: string;
      };
    };
  }

  const transition = transitions.find(
    (t: JiraTransition) => t.name.toLowerCase() === targetStatus.toLowerCase(),
  );

  if (!transition) {
    throw new Error(
      `Jira Workflow Error: Status "${targetStatus}" is not a valid next step for ${issueKey}.`,
    );
  }

  const updateRes = await fetch(transitionsUrl, {
    method: "POST",
    headers: config.headers as HeadersInit,
    body: JSON.stringify({ transition: { id: transition.id } }),
  });

  if (!updateRes.ok) {
    const updateError = await updateRes.text();
    throw new Error(`Jira Transition Failed: ${updateError}`);
  }

  return { success: true };
}

/**
 * Moves an issue to the 'Done' status category
 */
export async function transitionToDone(issueKey: string) {
  const config = getJiraConfig();
  const transitionsUrl = `${config.baseUrl}/rest/api/2/issue/${issueKey}/transitions`;

  const res = await fetch(transitionsUrl, {
    method: "GET",
    headers: config.headers as HeadersInit,
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to fetch available transitions");

  const { transitions } = await res.json();
  interface JiraTransition {
    id: string;
    name: string;
    to: {
      statusCategory: {
        key: string;
      };
    };
  }

  const doneTransition = transitions.find(
    (t: JiraTransition) =>
      t.to.statusCategory.key === "done" || t.name.toLowerCase() === "done",
  );

  if (!doneTransition)
    throw new Error("No 'Done' transition available for this issue.");

  const updateRes = await fetch(transitionsUrl, {
    method: "POST",
    headers: config.headers as HeadersInit,
    body: JSON.stringify({ transition: { id: doneTransition.id } }),
  });

  if (!updateRes.ok) throw new Error("Failed to transition issue to Done");

  return { success: true };
}

/**
 * Creates a new Jira issue
 */
export async function createJiraIssue(
  summary: string,
  boardId: string,
  issueType: string = "Task",
  sprintId?: string | null,
) {
  const config = getJiraConfig();

  const boardRes = await fetch(
    `${config.baseUrl}/rest/agile/1.0/board/${boardId}/project`,
    {
      headers: config.headers as HeadersInit,
    },
  );

  if (!boardRes.ok) throw new Error("Failed to find project for this board");

  const projectData = await boardRes.json();
  const projectKey = projectData.values[0]?.key;

  if (!projectKey) throw new Error("Could not find project key for this board");

  interface JiraIssueFields {
    project: { key: string };
    summary: string;
    issuetype: { name: string };
    customfield_10020?: number;
  }

  const fields: JiraIssueFields = {
    project: { key: projectKey },
    summary: summary,
    issuetype: { name: issueType },
  };

  if (sprintId) {
    fields.customfield_10020 = parseInt(sprintId);
  }

  const response = await fetch(`${config.baseUrl}/rest/api/2/issue`, {
    method: "POST",
    headers: config.headers as HeadersInit,
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Jira Create Error:", errorData);
    throw new Error("Failed to create Jira issue");
  }

  return await response.json();
}

/**
 * Moves an issue to the board's backlog
 */
export async function moveIssueToBacklog(issueKey: string) {
  const config = getJiraConfig();
  const response = await fetch(
    `${config.baseUrl}/rest/agile/1.0/backlog/issue`,
    {
      method: "POST",
      headers: config.headers as HeadersInit,
      body: JSON.stringify({ issues: [issueKey] }),
    },
  );

  if (response.status === 204 || response.ok) return true;
  throw new Error("Failed to move issue to backlog");
}

/**
 * Moves an issue to a specific sprint
 */
export async function moveIssueToSprint(issueKey: string, sprintId: string) {
  const config = getJiraConfig();
  const response = await fetch(
    `${config.baseUrl}/rest/agile/1.0/sprint/${sprintId}/issue`,
    {
      method: "POST",
      headers: config.headers as HeadersInit,
      body: JSON.stringify({ issues: [issueKey] }),
    },
  );

  if (response.status === 204 || response.ok) return true;
  throw new Error("Failed to move issue to sprint");
}
