import { spawnSync } from "node:child_process";

const command = process.platform === "win32" ? (process.env.ComSpec || "cmd.exe") : "npm";
const args = process.platform === "win32" ? ["/d", "/s", "/c", "npm audit --json"] : ["audit", "--json"];
const result = spawnSync(command, args, { encoding: "utf8", timeout: 120000 });
if (result.error) throw result.error;
let report;
try { report = JSON.parse(result.stdout); } catch { throw new Error("Não foi possível obter o relatório de vulnerabilidades do npm"); }
if (report.error || !report.vulnerabilities) throw new Error("A auditoria npm não foi concluída");
const targets = ["flatted", "lodash", "nanoid", "ws"];
const remaining = targets.filter(name => report.vulnerabilities[name]);
if (remaining.length) throw new Error(`Vulnerabilidades pendentes nas dependências de Jean: ${remaining.join(", ")}`);
console.log(`Sem avisos para: ${targets.join(", ")}. Outros componentes seguem no backlog dos demais integrantes.`);
