import Link from "next/link";
import { listTenants } from "@/lib/tenants";
import { getIncident } from "@/lib/incidents";

export default async function LandingPage() {
  const tenants = await listTenants();

  return (
    <main>
      <h1>Support Reliability Lab</h1>
      <p className="muted">
        A multi-tenant Next.js incident lab for Vercel support scenarios. Each
        tenant below carries a deterministic, reproducible incident. Open one to
        see the failure; open <Link href="/admin">/admin</Link> to toggle them.
      </p>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Tenants</h2>
        <table>
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Plan</th>
              <th>Incident</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => {
              const incident = getIncident(t.incident);
              return (
                <tr key={t.subdomain}>
                  <td>
                    <strong>{t.name}</strong>
                    <br />
                    <span className="muted">{t.subdomain}</span>
                  </td>
                  <td>{t.plan}</td>
                  <td>{incident.title}</td>
                  <td>
                    <a href={`http://${t.subdomain}.localhost:3000`}>
                      {t.subdomain}.localhost
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="muted" style={{ fontSize: "0.85rem" }}>
        Local tip: Chrome and Firefox resolve <code>*.localhost</code>{" "}
        automatically. Otherwise:{" "}
        <code>
          curl -i -H &quot;Host: slow-api.localhost:3000&quot;
          http://127.0.0.1:3000/
        </code>
      </p>
    </main>
  );
}
