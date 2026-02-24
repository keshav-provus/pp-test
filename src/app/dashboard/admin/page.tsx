import { createClient } from "@supabase/supabase-js"; // Use standard client
import { env } from "@/lib/env";
import { ShieldCheck, Trash2 } from "lucide-react";
import { removeAllowedUser } from "./action";
import AddUserForm from "./AddUserForm";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    // 1. Create a "GOD MODE" client using the Service Role Key
    const supabaseAdmin = createClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 2. Fetch the data (RLS will be ignored)
    const { data: guests, error } = await supabaseAdmin
        .from("allowed_users")
        .select("*")
        .order("created_at", { ascending: false });

    // Debugging - keep this for one more refresh
    console.log("Service Role Fetch - Guests:", guests);

    return (
        <div className="min-h-screen bg-[#0a0f14] p-8 text-slate-200">
            <div className="max-w-4xl mx-auto">
                <header className="mb-10">
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck className="text-emerald-500 w-10 h-10" />
                        <h1 className="text-4xl font-extrabold text-white tracking-tight">Admin Control</h1>
                    </div>
                    <p className="text-slate-400 text-base">Manage external access for non-Provus email domains.</p>
                </header>

                <section className="bg-[#161b22] border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        Add Guest Access
                    </h2>
                    <AddUserForm />
                </section>

                <section className="bg-[#161b22] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-[#1c2128] border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-4 text-slate-400 text-xs uppercase font-bold tracking-widest">Email Address</th>
                                <th className="px-6 py-4 text-slate-400 text-xs uppercase font-bold tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {guests && guests.length > 0 ? (
                                guests.map((guest) => (
                                    <tr key={guest.id} className="group hover:bg-slate-800/40 transition-all">
                                        <td className="px-6 py-4 text-slate-200">{guest.email}</td>
                                        <td className="px-6 py-4 text-right">
                                            {/* Using a form for the server action */}
                                            <form action={async () => {
                                                "use server";
                                                await removeAllowedUser(guest.id);
                                            }}>
                                                <button type="submit" className="p-2 text-slate-500 hover:text-red-500 transition-colors">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={2} className="px-6 py-10 text-center text-slate-500 italic">
                                        No authorized guests found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </section>
            </div>
        </div>
    );
}