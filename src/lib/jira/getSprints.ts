import { fetchJira } from "./config";
import { JiraSprint } from "./types";

export async function getSprints(boardId: number | string): Promise<JiraSprint[]> {
  const sprints = await fetchJira<JiraSprint>(
    `/rest/agile/1.0/board/${boardId}/sprint`, 
    "values"
  );
  
  return sprints.map(sprint => ({
    id: sprint.id,
    name: sprint.name,
    state: sprint.state,
  }));
}