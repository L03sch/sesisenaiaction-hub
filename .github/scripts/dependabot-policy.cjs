const requiredChecks = ["permissions", "CodeQL (javascript-typescript)", "CodeQL (java-kotlin)"];

function eligible({ pr, repository, protection, checks, statuses }) {
  if (!repository.allow_auto_merge) return "O proprietário precisa ativar Allow auto-merge.";
  if (pr.user?.login !== "dependabot[bot]" || pr.state !== "open" || pr.draft) return "Não é um PR aberto do Dependabot pronto para revisão.";
  if (pr.base.ref !== "main" || pr.head.repo?.full_name !== repository.full_name) return "Base ou origem não autorizada.";
  if (pr.mergeable !== true || pr.mergeable_state !== "clean") return "Conflito, proteção pendente ou branch desatualizada.";
  const rules = protection?.required_status_checks;
  const contexts = [...(rules?.contexts || []), ...(rules?.checks || []).map(check => check.context)];
  if (!rules?.strict || !requiredChecks.every(name => contexts.includes(name))) return "Configure na main os três checks obrigatórios e a exigência de branch atualizada.";
  // The API returns newest first. A previous failure must not override a successful rerun.
  const latest = new Map();
  for (const check of checks) if (!latest.has(check.name)) latest.set(check.name, check);
  if (!requiredChecks.every(name => latest.has(name))) return "Checks obrigatórios ainda não foram encontrados no HEAD atual.";
  if ([...latest.values()].some(check => check.status !== "completed" || check.conclusion !== "success")) return "Há check pendente, falho, cancelado ou ignorado.";
  const latestStatuses = new Map();
  for (const status of statuses) if (!latestStatuses.has(status.context)) latestStatuses.set(status.context, status);
  if ([...latestStatuses.values()].some(status => status.state !== "success")) return "Há status pendente ou com erro.";
  return null;
}

module.exports = { eligible, requiredChecks };
