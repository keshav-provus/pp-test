export async function getBoardData() {
  let data = [];
  let isLast = false;
  let startAt = 0;
  while (isLast === false) {
    try {
      const response = await fetch(
        `${process.env.JIRA_BASE_URL}/rest/agile/1.0/board?startAt=${startAt}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${btoa(
              `${process.env.JIRA_USER}:${process.env.JIRA_API_KEY}`,
            )}`,
            Accept: "application/json",
          },
        },
      );
      if (!response.ok) {
        throw new Error(`Error fetching dashboards: ${response.statusText}`);
      }
      const dashboardData = await response.json();
      data = [
        ...data,
        ...dashboardData.values.map((dashboard) => ({
          id: dashboard.id,
          name: dashboard.name,
          type: dashboard.type,
        })),
      ];
      isLast = dashboardData.isLast;
      startAt += 50;
    } catch (error) {
      console.error("Error:", error);
      isLast = true;
    }
  }
  return data;
}

//getBoardData();


export async function getSprints(boardId: number) {
  let sprintData = [];
  let isLast = false;
  let startAt = 0;
  while (isLast === false) {
    try {
      const response = await fetch(
        `${process.env.JIRA_BASE_URL}/rest/agile/1.0/board/${boardId}/sprint?startAt=${startAt}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${btoa(
              `${process.env.JIRA_USER}:${process.env.JIRA_API_KEY}`,
            )}`,
            Accept: "application/json",
          },
        },
      );
      if (!response.ok) {
        throw new Error(`Error fetching dashboards: ${response.statusText}`);
      }
      const jsonData = await response.json();
      sprintData = [
        ...sprintData,
        ...jsonData.values.map((sprint) => ({
          id: sprint.id,
          name: sprint.name,
        })),
      ];
      isLast = jsonData.isLast;
      startAt += 50;
    } catch (error) {
      console.error("Error:", error);
      isLast = true;
    }
  }
  console.log("Final sprint data:", sprintData);
}

//getSprints(388);

export async function getIssues(sprintId: number) {
  let issueData = [];
  let isLast = false;
  let startAt = 0;
  while (isLast === false) {
    try {
      const response = await fetch(
        `${process.env.JIRA_BASE_URL}/rest/agile/1.0/sprint/${sprintId}/issue?startAt=${startAt}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${btoa(
              `${process.env.JIRA_USER}:${process.env.JIRA_API_KEY}`,
            )}`,
            Accept: "application/json",
          },
        },
      );
      if (!response.ok) {
        throw new Error(`Error fetching dashboards: ${response.statusText}`);
      }
      const jsonData = await response.json();
      issueData = [
        ...issueData,
        ...jsonData.issues.map((issue) => ({
          id: issue.id,
          key: issue.key,
          summary: issue.fields.summary,
        })),
      ];
      //console.log('Fetched issues:', jsonData);
      isLast = jsonData.isLast;
      startAt += 50;
    } catch (error) {
      console.error("Error:", error);
      isLast = true;
    }
  }
  console.log("Final issue data:", issueData);
}

//getIssues(1810);

export async function getIssueDetails(issueId: number) {
  const issueDetails = {};
  try {
    const response = await fetch(
      `${process.env.JIRA_BASE_URL}/rest/api/3/issue/${issueId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${btoa(
            `${process.env.JIRA_USER}:${process.env.JIRA_API_KEY}`,
          )}`,
          Accept: "application/json",
        },
      },
    );
    if (!response.ok) {
      throw new Error(`Error fetching issue details: ${response.statusText}`);
    }
    const issueDetails = await response.json();
    console.log("Issue details:", issueDetails);
    issueDetails["id"] = issueDetails.id;
    issueDetails["key"] = issueDetails.key;
    issueDetails["status"] = issueDetails.fields.status.name;
    issueDetails["assignee"] = issueDetails.fields.assignee
      ? issueDetails.fields.assignee.displayName
      : "Unassigned";
    issueDetails["reporter"] = issueDetails.fields.reporter
      ? issueDetails.fields.reporter.displayName
      : "Unknown";
    issueDetails["creator"] = issueDetails.fields.creator
      ? issueDetails.fields.creator.displayName
      : "Unknown";
    issueDetails["summary"] = issueDetails.fields.summary;
    issueDetails["description"] = adfToPlainText(issueDetails.fields.description);
    console.log("Final issue details:", issueDetails);

    console.log(issueDetails);
  } catch (error) {
    console.error("Error:", error);
  }
}

//getIssueDetails(50345);

export async function setIssueStoryPoints(
  issueId: number,
  storyPoints: number,
) {
  try {
    const response = await fetch(
      `${process.env.JIRA_BASE_URL}/rest/api/3/issue/${issueId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Basic ${btoa(
            `${process.env.JIRA_USER}:${process.env.JIRA_API_KEY}`,
          )}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            customfield_10026: storyPoints,
          },
        }),
      },
    );
    if (!response.ok) {
      throw new Error(`Error setting story points: ${response.statusText}`);
    }
    console.log("Story points set successfully");
  } catch (error) {
    console.error("Error:", error);
  }
}

//setIssueStoryPoints(50345, 8);

type ADFNode = {
  type: string;
  text?: string;
  content?: ADFNode[];
  [key: string]: any;
};

function adfToPlainText(node: ADFNode | null | undefined): string {
  if (!node) return "";

  const blocks = new Set([
    "paragraph",
    "heading",
    "bulletList",
    "orderedList",
    "listItem",
    "panel",
    "blockquote",
  ]);

  const parts: string[] = [];

  function walk(n: ADFNode) {
    if (n.type === "text") {
      parts.push(n.text || "");
      return;
    }

    if (Array.isArray(n.content)) {
      n.content.forEach((child) => walk(child));

      if (blocks.has(n.type)) {
        parts.push("\n");
      }
    }
  }

  walk(node);

  return parts.join("").replace(/\s+$/, "");
}
