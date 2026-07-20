import { useState } from "react";

export function Greeting() {
  const [name, setName] = useState("");

  return (
    <div className="mt-8 mx-auto w-full max-w-md bg-[#1a1a1a] border-2 border-[#fbf0df] rounded-2xl p-6 text-center shadow-xl flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-[#fbf0df]">Greeting</h2>
      
      <div className="flex flex-col items-center gap-2">
        <span className="text-3xl font-bold text-[#f3d5a3] select-none transition-all duration-200">
          {"Hello" + (name ? ", " + name : "") + "! 👋"}
        </span>
        <span className="text-xs text-[#fbf0df]/50 uppercase tracking-widest">A Friendly Welcome</span>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name..."
          className="w-full bg-transparent border-2 border-[#fbf0df]/40 rounded-xl px-4 py-2 text-center text-[#fbf0df] placeholder-[#fbf0df]/40 font-medium focus:border-[#fbf0df] outline-none transition-all duration-200 text-sm"
        />
      </div>
    </div>
  );
}

export default Greeting;
