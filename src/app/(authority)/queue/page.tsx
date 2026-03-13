import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AuthorityQueueClient from "./AuthorityQueueClient";
import type { UserRow, ComplaintRow, DepartmentRow } from "@/lib/supabase/database.types";

type QueueProfile = {
  id: string;
  full_name: string;
  role: string;
  department: string | null;
  ward: string | null;
};

export default async function AuthorityQueuePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rawProfile } = await supabase
    .from("users")
    .select("id, full_name, role, department, ward")
    .eq("id", user.id)
    .single();

  const profile: QueueProfile | null = rawProfile as QueueProfile | null;

  if (profile?.role === "citizen") redirect("/dashboard");

  let query = supabase
    .from("complaints")
    .select(
      "id,title,description,status,ai_priority,ai_category,ai_department,ai_confidence,address,ward,department,created_at,resolved_at,citizen_id"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (profile?.role === "authority" && profile.department) {
    query = query.eq("department", profile.department);
  }

  const { data: rawComplaints } = await query;
  const { data: rawDepartments } = await supabase
    .from("departments")
    .select("id,name,code,active")
    .eq("active", true);

  const complaints = (rawComplaints ?? []) as Array<
    Pick<
      ComplaintRow,
      | "id"
      | "title"
      | "description"
      | "status"
      | "ai_priority"
      | "ai_category"
      | "ai_department"
      | "ai_confidence"
      | "address"
      | "ward"
      | "department"
      | "created_at"
      | "resolved_at"
      | "citizen_id"
    >
  >;

  const departments = (rawDepartments ?? []) as Array<
    Pick<DepartmentRow, "id" | "name" | "code" | "active">
  >;

  const safeProfile: Pick<UserRow, "id" | "full_name" | "role" | "department" | "ward"> =
    profile ?? {
      id: user.id,
      full_name: "Officer",
      role: "authority",
      department: null,
      ward: null,
    };

  return (
    <AuthorityQueueClient
      profile={safeProfile}
      complaints={complaints}
      departments={departments}
    />
  );
}
