// components/BoardSelector.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Board {
  id: number;
  name: string;
  type: string;
}

export default function BoardSelector({ boards }: { boards: Board[] }) {
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const router = useRouter();

  const handleGoToSprints = () => {
    if (selectedBoardId) {
      // Navigate to the next selection step
      router.push(`/poker/board/${selectedBoardId}`);
    }
  };

  return (
    <div className="space-y-4">
      <select
        value={selectedBoardId}
        onChange={(e) => setSelectedBoardId(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
      >
        <option value="" disabled>-- Select a Board --</option>
        {boards.map((board) => (
          <option key={board.id} value={board.id}>
            {board.name} ({board.type})
          </option>
        ))}
      </select>

      <button
        onClick={handleGoToSprints}
        disabled={!selectedBoardId}
        className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
      >
        View Sprints
      </button>
    </div>
  );
}