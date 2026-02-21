import { fetchJira } from "./config";
import { JiraBoard } from "./types";

export async function getBoardData(): Promise<JiraBoard[]> {
  // TypeScript now knows 'boards' is an array of JiraBoard
  const boards = await fetchJira<JiraBoard>("/rest/agile/1.0/board", "values");
  
  return boards.map(board => ({
    id: board.id,
    name: board.name,
  }));
}