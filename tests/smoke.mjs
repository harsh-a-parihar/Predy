const API = process.env.PREDY_API || "http://localhost:8787";

async function run() {
  const res = await fetch(`${API}/api/predy/instruct`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ instruction: "optimize my yield safely" })
  });
  const json = await res.json();
  if (!json.ok || !json.data?.executorOutput) {
    console.error("Smoke test failed", json);
    process.exit(1);
  }
  console.log("Smoke test passed:", json.data.predictionId);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
