import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="mt-8 mx-auto w-full max-w-md bg-[#1a1a1a] border-2 border-[#fbf0df] rounded-2xl p-6 text-center shadow-xl flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-[#fbf0df]">Interactive Counter</h2>
      
      <div className="flex flex-col items-center gap-2">
        <span className="text-6xl font-mono font-bold text-[#f3d5a3] select-none transition-all duration-200 transform scale-110">
          {count}
        </span>
        <span className="text-xs text-[#fbf0df]/50 uppercase tracking-widest">Current Count</span>
      </div>

      <div className="flex gap-3 justify-center mt-2">
        <button
          onClick={() => setCount(prev => Math.max(0, prev - 1))}
          className="bg-transparent border border-[#fbf0df]/40 text-[#fbf0df]/80 px-4 py-2 rounded-xl font-bold transition-all duration-100 hover:border-[#fbf0df] hover:text-[#fbf0df] active:scale-95 cursor-pointer text-sm"
        >
          Decrement
        </button>
        
        <button
          onClick={() => setCount(prev => prev + 1)}
          className="bg-[#fbf0df] text-[#1a1a1a] border-0 px-6 py-2 rounded-xl font-bold transition-all duration-100 hover:bg-[#f3d5a3] hover:-translate-y-px active:scale-95 cursor-pointer shadow-lg text-sm"
        >
          Increment
        </button>

        <button
          onClick={() => setCount(0)}
          className="bg-transparent border border-red-500/30 text-red-400 px-4 py-2 rounded-xl font-bold transition-all duration-100 hover:bg-red-500/10 active:scale-95 cursor-pointer text-sm"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
