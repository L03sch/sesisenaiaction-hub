import { spawnSync } from "node:child_process";

const command = process.platform === "win32" ? (process.env.ComSpec || "cmd.exe") : "npm";
const args = process.platform === "win32" ? ["/d", "/s", "/c", "npm audit --json"] : ["audit", "--json"];
const result = spawnSync(command, args, { encoding: "utf8", timeout: 120000 });
if (result.error) throw result.error;
let report;
try { report = JSON.parse(result.stdout); } catch { throw new Error("Não foi possível obter o relatório de vulnerabilidades do npm"); }
if (report.error || !report.vulnerabilities) throw new Error("A auditoria npm não foi concluída");
// Keep the original file name for existing CI consumers. Include every dependency
// remediated in the security backlog; braces remains explicitly tracked in KAN-32.
const targets = ["flatted", "lodash", "nanoid", "ws", "ajv", "brace-expansion", "js-yaml", "picomatch", "yaml"];
const remaining = targets.filter(name => report.vulnerabilities[name]);
if (remaining.length) throw new Error(`Vulnerabilidades pendentes nas dependências corrigidas: ${remaining.join(", ")}`);
console.log(`Sem avisos para: ${targets.join(", ")}. Avisos fora desse escopo não são considerados resolvidos por esta verificação.`);
