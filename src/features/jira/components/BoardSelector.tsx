'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchableDropdown from '../../../components/searchable-dropdown';

export default function BoardSelector({ boards }) {
  const [selectedBoard, setSelectedBoard] = useState(null);
  const router = useRouter();

  const handleGoToSprints = () => {
    if (selectedBoard) {
      router.push(`/select-sprint?boardId=${selectedBoard.id}`);
    }
  };

  return (
    <div className="space-y-6">
      <SearchableDropdown
        options={boards}
        label="name"
        idKey="id"
        selectedVal={selectedBoard?.name || ""}
        handleChange={(val) => setSelectedBoard(val)}
      />

      <button
        onClick={handleGoToSprints}
        disabled={!selectedBoard}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
      >
        Continue to Sprints
      </button>
    </div>
  );
}