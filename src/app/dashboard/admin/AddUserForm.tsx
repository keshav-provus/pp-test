"use client";

import { addAllowedUser } from "./action";
import { useRef } from "react";

export default function AddUserForm() {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleAction(formData: FormData) {
    const result = await addAllowedUser(formData);
    if (result?.error) {
      alert(result.error); // Now alert works because this is client-side
    } else {
      formRef.current?.reset(); // Clears the input field on success
    }
  }

  return (
    <form ref={formRef} action={handleAction} className="flex gap-3">
      <input 
        name="email"
        type="email" 
        placeholder="partner@gmail.com"
        required
        className="flex-1 bg-[#0a0f14] border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
      />
      <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-[#0a0f14] font-bold px-6 py-2 rounded-xl transition-all">
        Grant Access
      </button>
    </form>
  );
}