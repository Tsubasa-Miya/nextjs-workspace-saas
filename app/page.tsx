/* istanbul ignore file */
export default function Page() {
  return (
    <main className="container stack">
      <div className="stack">
        <h1>SaaS Starter</h1>
        <p className="muted">Next.js + PostgreSQL + Auth.js</p>
        <p>
          Health: <a href="/healthz">/healthz</a>
        </p>
      </div>
    </main>
  );
}
