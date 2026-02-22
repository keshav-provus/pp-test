// components/poker/JoinSessionCard.tsx
import { Link2 } from 'lucide-react';

export const JoinSessionCard = () => {
  return (
    <div className="group relative p-8 rounded-2xl border border-zinc-800 bg-zinc-900/10 hover:border-zinc-700 transition-all flex flex-col justify-between">
      <div>
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/50 transition-colors">
          <Link2 className="text-zinc-400 group-hover:text-emerald-400" size={24} />
        </div>
        <h2 className="text-xl font-bold mb-2">Join Session</h2>
        <p className="text-sm text-zinc-500 leading-relaxed mb-8">
          Enter a room code or paste a session link provided by your teammate to start voting.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold">Room Code</label>
          <div className="flex gap-2">
            {['', '', '', ''].map((_, i) => (
              <input 
                key={i}
                type="text" 
                maxLength={1}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 text-center text-lg font-bold focus:outline-none focus:border-emerald-500 transition-colors uppercase"
              />
            ))}
          </div>
        </div>
        <button className="w-full border border-zinc-800 text-white font-bold py-3 rounded-lg text-sm hover:bg-zinc-800 transition-all">
          Enter Room
        </button>
      </div>
    </div>
  );
};