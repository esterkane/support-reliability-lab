import Link from "next/link";
import { listTenants } from "@/lib/tenants";
import { listIncidents } from "@/lib/incidents";
import { getCurrentContent } from "@/lib/content";
import { tenantHref } from "@/lib/tenant-url";
import { publishContent, updateIncident } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [tenants, incidents] = await Promise.all([
    listTenants(),
    Promise.resolve(listIncidents()),
  ]);

  return (
    <main>
      <div className="row">
        <h1>Incident Console</h1>
        <Link href="/">← tenants</Link>
      </div>
      <p className="muted">
        Toggle the active incident per tenant. Each is deterministic and
        reproducible on the tenant&apos;s subdomain.
      </p>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Active incident</th>
              <th>Set</th>
              <th>Content</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.subdomain}>
                <td>
                  <strong>{t.name}</strong>
                  <br />
                  <span className="muted">{t.subdomain}</span>
                </td>
                <td>{t.incident}</td>
                <td>
                  <form action={updateIncident} className="row">
                    <input type="hidden" name="subdomain" value={t.subdomain} />
                    <select name="incident" defaultValue={t.incident}>
                      {incidents.map((i) => (
                        <option key={i.key} value={i.key}>
                          {i.title}
                        </option>
                      ))}
                    </select>
                    <button type="submit">Apply</button>
                  </form>
                </td>
                <td>
                  <form action={publishContent} className="row">
                    <input type="hidden" name="subdomain" value={t.subdomain} />
                    <span className="muted">
                      v{getCurrentContent(t.subdomain).version}
                    </span>
                    <button type="submit">Publish update</button>
                  </form>
                </td>
                <td>
                  <a href={tenantHref(t.subdomain)}>open</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Incident catalog</h2>
        <table>
          <thead>
            <tr>
              <th>Incident</th>
              <th>Symptom</th>
              <th>First signal</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {incidents
              .filter((i) => i.key !== "none")
              .map((i) => (
                <tr key={i.key}>
                  <td>{i.title}</td>
                  <td className="muted">{i.symptom}</td>
                  <td className="muted">{i.evidencePath}</td>
                  <td>
                    <span
                      className={`badge ${
                        i.status === "implemented" ? "ok" : "warn"
                      }`}
                    >
                      {i.status}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
