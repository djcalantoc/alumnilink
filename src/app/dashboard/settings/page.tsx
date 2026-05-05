import { redirect } from "next/navigation";

/** Settings live on the profile experience for now; keeps a dedicated nav URL. */
export default function DashboardSettingsPage() {
  redirect("/dashboard/profile");
}
