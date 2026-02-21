import { JiraPaginatedResponse } from "./types";

export const JIRA_HEADERS = {
  Authorization: `Basic ${Buffer.from(
    `${process.env.JIRA_USER}:${process.env.JIRA_API_KEY}`
  ).toString("base64")}`,
  Accept: "application/json",
  "Content-Type": "application/json",
};

export async function fetchJira<T>(endpoint: string, dataKey: string): Promise<T[]> {
  let allData: T[] = [];
  let isLast = false;
  let startAt = 0;

  while (!isLast) {
    const response = await fetch(`${process.env.JIRA_BASE_URL}${endpoint}?startAt=${startAt}`, {
      headers: JIRA_HEADERS,
    });

    if (!response.ok) throw new Error(`Jira Error: ${response.statusText}`);

    const json: JiraPaginatedResponse<T> = await response.json();
    const values = json[dataKey as keyof typeof json] as T[] || [];
    
    allData = [...allData, ...values];
    isLast = json.isLast;
    startAt += values.length;
  }
  return allData;
}