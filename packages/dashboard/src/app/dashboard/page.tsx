import { SiteNav } from "@/components/site-nav";
import { DashboardShell } from "@/components/dashboard-shell";
import { buildSnapshot } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DashboardPage(): Promise<React.ReactElement> {
  const snap = await buildSnapshot();
  return (
    <div>
      <SiteNav currentRoute="dashboard" />
      <main>
        <DashboardShell snap={snap} />
      </main>
    </div>
  );
}
