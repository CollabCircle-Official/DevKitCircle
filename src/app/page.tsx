import { Dashboard } from "@/components/Dashboard";
import { connection } from "next/server";

export default async function Home() {
  // A per-request render lets middleware nonce every Next.js hydration script.
  await connection();
  return <Dashboard />;
}
