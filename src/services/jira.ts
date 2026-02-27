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
  priority?: string;
  priorityIconUrl?: string;
  assignee?: string | null;
  assigneeAvatarUrl?: string | null;
  reporter?: string | null;
  reporterAvatarUrl?: string | null;
}

// NEW: Extended interface for detailed views
export interface JiraIssueDetails extends JiraIssue {
  description: string | null;
  reporter: string | null;
}

/**
 * Helper to retrieve and validate configuration.
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
      "Connection": "close",
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

interface JiraApiIssueFields {
  summary: string;
  status: {
    name: string;
    statusCategory: {
      name: string;
    };
  };
  priority?: {
    name: string;
    iconUrl?: string;
  };
  assignee?: {
    displayName: string;
    avatarUrls?: { "48x48": string; "32x32"?: string; "24x24"?: string; "16x16"?: string };
  };
  reporter?: {
    displayName: string;
    avatarUrls?: { "48x48": string; "32x32"?: string; "24x24"?: string; "16x16"?: string };
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
  priority: issue.fields.priority?.name,
  priorityIconUrl: issue.fields.priority?.iconUrl,
  assignee: issue.fields.assignee?.displayName,
  assigneeAvatarUrl: issue.fields.assignee?.avatarUrls?.["48x48"] || issue.fields.assignee?.avatarUrls?.["32x32"],
  reporter: issue.fields.reporter?.displayName,
  reporterAvatarUrl: issue.fields.reporter?.avatarUrls?.["48x48"] || issue.fields.reporter?.avatarUrls?.["32x32"],
});

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

export async function getIssuesByJql(jql: string): Promise<JiraIssue[]> {
  const config = getJiraConfig();
  let allData: JiraApiIssue[] = [];
  let isLast = false;
  let nextPageToken: string | undefined = undefined;

  while (!isLast) {
    const payload: {
      jql: string;
      maxResults: number;
      fields: string[];
      nextPageToken?: string;
    } = {
      jql: jql,
      maxResults: 50,
      fields: [
        "summary",
        "status",
        "priority",
        "assignee",
        "reporter"
      ]
    };
    
    if (nextPageToken) {
      payload.nextPageToken = nextPageToken;
    }

    const res = await fetch(`${config.baseUrl}/rest/api/3/search/jql`, {
      method: "POST",
      headers: {
        ...config.headers,
        "Content-Type": "application/json",
      } as HeadersInit,
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`JQL Search Error [${res.status}]:`, errorText);
      throw new Error(`Jira API Error [${res.status}]: ${errorText}`);
    }

    const json = await res.json();
    const issues = json.issues || [];
    allData = [...allData, ...issues];
    
    // The response returns next page token if more results exist
    nextPageToken = json.nextPageToken;
    isLast = json.isLast !== false; // Defend against pagination loops if undefined
  }
  
  return allData.map(mapIssue);
}

export async function matchIssuesAgainstJql(issueIds: string[], jql: string): Promise<string[]> {
  if (!issueIds.length || !jql.trim()) return [];
  
  const config = getJiraConfig();
  
  const res = await fetch(`${config.baseUrl}/rest/api/3/jql/match`, {
    method: "POST",
    headers: {
      ...config.headers,
      "Content-Type": "application/json",
    } as HeadersInit,
    body: JSON.stringify({
      issueIds: issueIds.map(id => parseInt(id, 10)),
      jqls: [jql]
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`JQL Match Error [${res.status}]:`, errorText);
    throw new Error(`Jira API Error [${res.status}]: ${errorText}`);
  }

  const json = await res.json();
  const matchResult = json.matches?.[0]; // We just sent 1 JQL string
  
  if (matchResult && matchResult.matchedIssues) {
    return matchResult.matchedIssues.map((id: number) => id.toString());
  }
  
  return [];
}

export interface JqlAutocompleteField {
  value: string;
  displayName: string;
  orderable: string;
  searchable: string;
  autoCompleteUrl?: string; // If present, can be used to pull values
  operators: string[];
}

export interface JqlAutocompleteData {
  visibleFieldNames: JqlAutocompleteField[];
  visibleFunctionNames: { value: string; displayName: string; isList: string }[];
}

export async function getJqlAutocompleteData(): Promise<JqlAutocompleteData> {
  const config = getJiraConfig();
  const res = await fetch(`${config.baseUrl}/rest/api/2/jql/autocompletedata`, {
    headers: config.headers as HeadersInit,
    cache: "force-cache", // Structure rarely changes
  });

  if (!res.ok) {
    throw new Error("Failed to fetch autocomplete metadata");
  }

  return await res.json();
}

export interface JqlSuggestion {
  value: string;
  displayName: string;
}

export async function getJqlSuggestions(fieldName: string, fieldValue: string): Promise<JqlSuggestion[]> {
  const config = getJiraConfig();
  const field = encodeURIComponent(fieldName);
  const predicate = encodeURIComponent(fieldValue);
  
  // Jira requires `fieldName` and `fieldValue`
  const url = `${config.baseUrl}/rest/api/2/jql/autocompletedata/suggestions?fieldName=${field}&fieldValue=${predicate}`;

  const res = await fetch(url, {
    headers: config.headers as HeadersInit,
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 400) {
      // 400 usually means this field doesn't support value suggestions (e.g. text search)
      return [];
    }
    throw new Error("Failed to fetch suggestions");
  }

  const data = await res.json();
  return data.results || [];
}

export async function getBoardBacklog(boardId: string): Promise<JiraIssue[]> {
  const jql = encodeURIComponent("statusCategory != Done AND sprint is EMPTY");
  const endpoint = `/rest/agile/1.0/board/${boardId}/issue?jql=${jql}`;
  const data = await fetchPaginatedData<JiraApiIssue>(endpoint, "issues");
  return data.map((issue: JiraApiIssue) => ({
    ...mapIssue(issue),
    source: "backlog",
  }));
}

export async function updateIssueStatus(
  issueKey: string,
  targetStatus: string,
) {
  const config = getJiraConfig();
  const transitionsUrl = `${config.baseUrl}/rest/api/2/issue/${issueKey}/transitions`;

  const res = await fetch(transitionsUrl, {
    method: "GET",
    headers: config.headers as HeadersInit,
    cache: "no-store",
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

export async function updateStoryPoints(issueKey: string, points: number) {
  const config = getJiraConfig();

  const response = await fetch(
    `${config.baseUrl}/rest/api/2/issue/${issueKey}`,
    {
      method: "PUT",
      headers: config.headers as HeadersInit,
      body: JSON.stringify({
        fields: {
          customfield_10026: points,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Jira Update Failed: ${errorBody}`);
  }

  return { success: true };
}

// FIX: Updated to fetch full details including description and reporter
export async function getIssueDetails(issueKey: string): Promise<JiraIssueDetails> {
  const config = getJiraConfig();
  const response = await fetch(`${config.baseUrl}/rest/api/2/issue/${issueKey}`, {
    method: "GET",
    headers: config.headers as HeadersInit,
    cache: "no-store", // Prevents caching stale data
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch issue ${issueKey}`);
  }

  const issue = await response.json();
  
  // Jira descriptions can sometimes be Atlassian Document Format objects
  let descriptionText = null;
  if (typeof issue.fields.description === "string") {
    descriptionText = issue.fields.description;
  } else if (issue.fields.description && typeof issue.fields.description === "object") {
    descriptionText = "Rich text formatting (ADF) detected. Please view in Jira.";
  }

  return {
    id: issue.id,
    key: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status.name,
    statusCategory: issue.fields.status.statusCategory?.name || "To Do",
    description: descriptionText,
    reporter: issue.fields.reporter?.displayName || null,
  };
}