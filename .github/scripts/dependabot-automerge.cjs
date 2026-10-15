const { eligible } = require("./dependabot-policy.cjs");

module.exports = async ({ github, context, core }) => {
  const { owner, repo } = context.repo;
  const numbers = context.payload.pull_request
    ? [context.payload.pull_request.number]
    : (await github.paginate(github.rest.pulls.list, { owner, repo, state: "open", base: "main", per_page: 100 }))
      .filter(pr => pr.user.login === "dependabot[bot]").map(pr => pr.number);
  const { data: repository } = await github.rest.repos.get({ owner, repo });
  if (!repository.allow_auto_merge) return core.setFailed("O proprietário precisa ativar Settings > General > Allow auto-merge. Nenhum merge foi realizado.");
  let protection;
  try {
    const result = await github.graphql(`query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        ref(qualifiedName: "refs/heads/main") {
          branchProtectionRule { requiresStatusChecks requiresStrictStatusChecks requiredStatusCheckContexts }
        }
      }
    }`, { owner, repo });
    const rule = result.repository?.ref?.branchProtectionRule;
    protection = rule?.requiresStatusChecks ? { required_status_checks: {
      strict: rule.requiresStrictStatusChecks, contexts: rule.requiredStatusCheckContexts,
    } } : null;
  } catch {
    return core.setFailed("Não foi possível confirmar a proteção da main. Configure os checks obrigatórios e permita sua consulta antes de usar a automação.");
  }
  for (const pull_number of numbers) {
    const { data: pr } = await github.rest.pulls.get({ owner, repo, pull_number });
    if (pr.user.login !== "dependabot[bot]") continue;
    const ref = pr.head.sha;
    const checks = await github.paginate(github.rest.checks.listForRef, { owner, repo, ref, filter: "latest", per_page: 100 });
    const statuses = await github.paginate(github.rest.repos.listCommitStatusesForRef, { owner, repo, ref, per_page: 100 });
    const reason = eligible({ pr, repository, protection, checks, statuses });
    if (reason) { core.info(`#${pull_number}: ${reason}`); continue; }
    // Re-read immediately before requesting native auto-merge. Branch protection
    // remains the authority if the base branch changes after these checks.
    const { data: current } = await github.rest.pulls.get({ owner, repo, pull_number });
    if (current.head.sha !== ref || current.state !== "open" || current.draft || current.mergeable !== true || current.mergeable_state !== "clean") {
      core.info(`#${pull_number}: estado alterado durante a verificação.`);
      continue;
    }
    if (current.auto_merge) { core.info(`#${pull_number}: auto-merge já habilitado.`); continue; }
    await github.graphql(`mutation($id: ID!) { enablePullRequestAutoMerge(input: {pullRequestId: $id, mergeMethod: SQUASH}) { pullRequest { number } } }`, { id: current.node_id });
    core.info(`#${pull_number}: auto-merge nativo habilitado após validação do HEAD ${ref}.`);
  }
};
