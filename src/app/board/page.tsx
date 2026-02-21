// app/poker/page.tsx
import { getBoardData } from "@/features/jira/functions/functions";
import BoardSelector from "../../features/jira/components/BoardSelector";

export default async function PokerPage() {
  const boards = await getBoardData();

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Planning Poker: Select Board</h1>
      <p className="text-gray-600 mb-4">
        Choose a Jira board to start your planning session.
      </p>
      
      <BoardSelector boards={boards} />
    </div>
  );
}