import { redirect } from "next/navigation";
import { AppShell } from "../../components/shell";
import { createSupabaseServerClient } from "../../lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const authResult = supabase ? await supabase.auth.getUser() : null;
  const authUser = authResult?.data.user ?? null;

  if (!authUser) {
    redirect("/teacher");
  }

  const appRole = authUser.user_metadata?.app_role;
  const allowed = appRole === "admin" || appRole === "super_admin";

  return (
    <AppShell className="max-w-4xl pt-16">
      <section className="rounded-[2rem] bg-white p-8 shadow-[0_18px_50px_rgba(95,73,166,0.09)]">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#948aad]">Admin portal</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#1d1731]">
          {allowed ? "Admin tools are staged here" : "Admin access required"}
        </h1>
        <p className="mt-4 text-sm leading-7 text-[#6f6787]">
          {allowed
            ? "This placeholder route is protected for admin or super_admin accounts and will host district and operations tools in the next spec slice."
            : "Your signed-in account does not currently have the app_role metadata required for the admin workspace."}
        </p>
      </section>
    </AppShell>
  );
}
