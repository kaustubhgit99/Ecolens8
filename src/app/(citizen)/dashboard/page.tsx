import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CitizenDashboardClient from "./CitizenDashboardClient";
import type { UserRow, ComplaintRow } from "@/lib/supabase/database.types";

type DashProfile = {
  id: string;
  full_name: string;
  role: string;
  coins_total: number;
  coins_month: number;
  ward: string | null;
};

export default async function CitizenDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rawProfile } = await supabase
    .from("users")
    .select("id, full_name, role, coins_total, coins_month, ward")
    .eq("id", user.id)
    .single();

  const profile: DashProfile | null = rawProfile as DashProfile | null;

  if (profile?.role === "authority" || profile?.role === "admin") {
    redirect("/queue");
  }

  const { data: rawComplaints } = await supabase
    .from("complaints")
    .select(
      "id,title,description,status,ai_priority,ai_category,address,created_at,resolved_at,image_url,department"
    )
    .eq("citizen_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  const complaints = (rawComplaints ?? []) as Array<
    Pick<
      ComplaintRow,
      | "id"
      | "title"
      | "description"
      | "status"
      | "ai_priority"
      | "ai_category"
      | "address"
      | "created_at"
      | "resolved_at"
      | "image_url"
      | "department"
    >
  >;

  const safeProfile: Pick<
    UserRow,
    "id" | "full_name" | "role" | "coins_total" | "coins_month" | "ward"
  > = profile ?? {
    id: user.id,
    full_name: "Citizen",
    role: "citizen",
    coins_total: 0,
    coins_month: 0,
    ward: null,
  };

  return (
    <CitizenDashboardClient
      profile={safeProfile}
      complaints={complaints}
      unreadCount={unreadCount ?? 0}
    />
  );
}
