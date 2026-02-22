"use client";
import { toast } from "sonner";
import { FiCopy } from "react-icons/fi";

export const CopyLinkButton = ({ sessionId }: { sessionId: string }) => {
  const copy = () => {
    navigator.clipboard.writeText(sessionId);
    toast.success("Session ID copied to clipboard!");
  };

  return (
    <button 
      onClick={copy}
      className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase hover:bg-lime-400 hover:text-black transition-all"
    >
      <FiCopy /> COPY SESSION ID
    </button>
  );
};