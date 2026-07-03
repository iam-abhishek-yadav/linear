import "dotenv/config";
import { createOrgInvite } from "../src/lib/invites";

async function main() {
  const emailArg = process.argv.find((arg) => arg.startsWith("--email="));
  const email = emailArg?.split("=")[1];

  await createOrgInvite(email);
}

main().catch((error) => {
  console.error("Failed to create org invite:", error);
  process.exit(1);
});
