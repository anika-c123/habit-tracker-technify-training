import { redirect } from "next/navigation";

// The app starts at /groups. Logged-out visitors get sent on to /login by
// proxy.ts before they ever reach it.
export default function Home() {
  redirect("/groups");
}
