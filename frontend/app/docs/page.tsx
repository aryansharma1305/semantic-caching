import Link from "next/link";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { CodeBlock } from "@/components/docs/CodeBlock";

const CURL_EXAMPLE = `curl -X POST https://your-api-host/query \\
  -H "Authorization: Bearer sr_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"query": "What is the refund policy for enterprise plans?"}'`;

const PYTHON_EXAMPLE = `import requests

response = requests.post(
    "https://your-api-host/query",
    headers={"Authorization": "Bearer sr_live_..."},
    json={"query": "What is the refund policy for enterprise plans?"},
)
data = response.json()
print(data["answer"], data["cache_hit"], data["cost_usd"])`;

const JS_EXAMPLE = `const res = await fetch("https://your-api-host/query", {
  method: "POST",
  headers: {
    Authorization: "Bearer sr_live_...",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: "What is the refund policy for enterprise plans?" }),
});
const data = await res.json();
console.log(data.answer, data.cache_hit, data.cost_usd);`;

const RESPONSE_HIT = `{
  "answer": "...",
  "cache_hit": true,
  "similarity": 0.96,
  "latency_ms": 9
}`;

const RESPONSE_MISS = `{
  "answer": "...",
  "cache_hit": false,
  "model_used": "claude-haiku-4-5-20251001",
  "cost_usd": 0.00031,
  "latency_ms": 412
}`;

export default function DocsPage() {
  return (
    <div className="flex min-h-full flex-col">
      <LandingNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-fg">
          Quickstart
        </h1>
        <p className="mt-3 max-w-xl text-fg-muted">
          Four steps to get your own backend caching and routing queries through this
          API. No SDK required — it&apos;s a plain HTTP endpoint.
        </p>

        <ol className="mt-10 flex flex-col gap-10">
          <Step n="1" title="Create an account">
            <p>
              <Link href="/sign-up" className="text-accent hover:underline">
                Sign up
              </Link>{" "}
              — it takes under a minute and puts you straight on the dashboard.
            </p>
          </Step>

          <Step n="2" title="Add a provider key">
            <p>
              In the dashboard, open <strong className="text-fg">API keys</strong> and
              add your Anthropic or OpenAI key. It&apos;s encrypted at rest and never
              returned in plaintext by any endpoint — every request still goes to the
              provider you chose, at the provider&apos;s own rates.
            </p>
          </Step>

          <Step n="3" title="Generate an API token">
            <p>
              Provider keys authenticate <em>this service</em> to the LLM provider.
              You still need a separate token to authenticate <em>your backend</em> to
              this service — open <strong className="text-fg">API access</strong> in
              the dashboard and create one. The full value is shown exactly once;
              copy it somewhere safe.
            </p>
          </Step>

          <Step n="4" title="Call the endpoint">
            <p>
              Send your query as a <code className="font-mono text-sm">POST</code> to{" "}
              <code className="font-mono text-sm">/query</code> with the token as a
              bearer header. A near-duplicate of a question you&apos;ve already asked
              returns instantly from cache; anything new gets routed to a small or
              large model and cached for next time.
            </p>
            <div className="mt-4 flex flex-col gap-4">
              <CodeBlock label="curl" code={CURL_EXAMPLE} />
              <CodeBlock label="python" code={PYTHON_EXAMPLE} />
              <CodeBlock label="javascript" code={JS_EXAMPLE} />
            </div>
          </Step>
        </ol>

        <section className="mt-16 border-t border-border pt-10">
          <h2 className="text-xl font-semibold tracking-tight text-fg">
            Response shape
          </h2>
          <p className="mt-2 text-sm text-fg-muted">
            Same endpoint, two possible outcomes depending on whether the query hit
            the cache.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CodeBlock label="cache hit" code={RESPONSE_HIT} />
            <CodeBlock label="cache miss" code={RESPONSE_MISS} />
          </div>
        </section>

        <section className="mt-16 border-t border-border pt-10">
          <h2 className="text-xl font-semibold tracking-tight text-fg">
            Authentication
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-fg-muted">
            Every endpoint except <code className="font-mono">/health</code> requires
            an <code className="font-mono">Authorization: Bearer &lt;token&gt;</code>{" "}
            header. Two kinds of token work: an API token from step 3 above (for
            server-to-server calls — starts with{" "}
            <code className="font-mono">sr_live_</code>), or a Clerk session token
            (what the dashboard itself uses, tied to a signed-in browser session).
            Use an API token for your own backend integrations.
          </p>
        </section>

        <section className="mt-16 border-t border-border pt-10">
          <h2 className="text-xl font-semibold tracking-tight text-fg">
            Other endpoints
          </h2>
          <dl className="mt-4 flex flex-col divide-y divide-border">
            <EndpointRow
              method="GET"
              path="/stats"
              desc="Aggregate cache hit rate, average latency, total cost, and requests by model — your own account only."
            />
            <EndpointRow
              method="GET"
              path="/queries?limit=N"
              desc="Recent query log, most recent first."
            />
            <EndpointRow
              method="GET"
              path="/settings/providers"
              desc="Which providers you have configured."
            />
          </dl>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-5">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-accent-soft font-mono text-sm font-semibold text-accent">
        {n}
      </span>
      <div className="flex flex-1 flex-col gap-2 pt-0.5">
        <h3 className="text-lg font-semibold text-fg">{title}</h3>
        <div className="text-sm leading-relaxed text-fg-muted [&_strong]:text-fg [&_em]:not-italic [&_em]:font-medium [&_em]:text-fg">
          {children}
        </div>
      </div>
    </li>
  );
}

function EndpointRow({
  method,
  path,
  desc,
}: {
  method: string;
  path: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col gap-1 py-4 first:pt-0 sm:flex-row sm:items-baseline sm:gap-4">
      <div className="flex flex-none items-center gap-2 sm:w-56">
        <span className="rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-xs font-semibold text-fg-muted">
          {method}
        </span>
        <code className="font-mono text-sm text-fg">{path}</code>
      </div>
      <p className="text-sm text-fg-muted">{desc}</p>
    </div>
  );
}
