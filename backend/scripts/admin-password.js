import { createInterface } from "node:readline/promises";
import { hashAdminPassword } from "../src/lib/admin-auth.js";

const terminal = createInterface({ input: process.stdin, output: process.stdout });
const password = await terminal.question("Admin password (input is visible in this terminal): ");
terminal.close();
if (password.length < 10) throw new Error("Choose a password of at least 10 characters");
console.log(`ADMIN_PASSWORD_HASH=${hashAdminPassword(password)}`);
