const { eligible } = require("./dependabot-policy.cjs");

async function validationChecks(github, owner, repo, checks) {
  const result = [];
  for (const check of checks) {
    // The controller must not wait for its own pending/previous failed job.
    // Verify the producing workflow, not just its spoofable check name.
    const prefix = `https://github.com/${owner}/${repo}/actions/runs/`;
    const match = check.details_url?.startsWith(prefix) && check.details_url.slice(prefix.length).match(/^(\d+)\/job\/\d+$/);
    if (check.name === "enable" && check.app?.slug === "github-actions" && match) {
      const { data: run } = await github.rest.actions.getWorkflowRun({ owner, repo, run_id: Number(match[1]) });
      if (run.path === ".github/workflows/dependabot-automerge.yml") continue;
    }
    result.push(check);
  }
  return result;
}

module.exports = async ({ github, context, core }) => {
  const { owner, repo } = context.repo;
  const numbers = context.payload.pull_request
    ? [context.payload.pull_request.number]
    : (await github.paginate(github.rest.pulls.list, { owner, repo, state: "open", base: "main", per_page: 100 }))
      .filter(pr => pr.user.login === "dependabot[bot]").map(pr => pr.number);
  const { data: repository } = await github.rest.repos.get({ owner, repo });
  if (!repository.allow_auto_merge) return core.setFailed("O proprietário precisa ativar Settings > General > Allow auto-merge. Nenhum merge foi realizado.");
  let branch;
  try {
    ({ data: branch } = await github.rest.repos.getBranch({ owner, repo, branch: "main" }));
  } catch {
    return core.setFailed("Não foi possível confirmar a proteção da main. Configure os checks obrigatórios e permita sua consulta antes de usar a automação.");
  }
  for (const pull_number of numbers) {
    const { data: pr } = await github.rest.pulls.get({ owner, repo, pull_number });
    if (pr.user.login !== "dependabot[bot]") continue;
    const ref = pr.head.sha;
    const { data: comparison } = await github.rest.repos.compareCommits({ owner, repo, base: branch.commit.sha, head: ref });
    const upToDate = ["ahead", "identical"].includes(comparison.status);
    const allChecks = await github.paginate(github.rest.checks.listForRef, { owner, repo, ref, filter: "latest", per_page: 100 });
    const checks = await validationChecks(github, owner, repo, allChecks);
    const statuses = await github.paginate(github.rest.repos.listCommitStatusesForRef, { owner, repo, ref, per_page: 100 });
    const reason = eligible({ pr, repository, branch, upToDate, checks, statuses });
    if (reason) { core.info(`#${pull_number}: ${reason}`); continue; }
    // Re-read immediately before requesting native auto-merge. Branch protection
    // remains the authority if the base branch changes after these checks.
    const { data: current } = await github.rest.pulls.get({ owner, repo, pull_number });
    const { data: currentBase } = await github.rest.repos.getBranch({ owner, repo, branch: "main" });
    if (currentBase.commit.sha !== branch.commit.sha || current.head.sha !== ref || current.state !== "open" || current.draft || current.mergeable !== true || !["clean", "blocked"].includes(current.mergeable_state)) {
      core.info(`#${pull_number}: estado alterado durante a verificação.`);
      continue;
    }
    if (current.auto_merge) { core.info(`#${pull_number}: auto-merge já habilitado.`); continue; }
    try {
      await github.graphql(`mutation($id: ID!) { enablePullRequestAutoMerge(input: {pullRequestId: $id, mergeMethod: SQUASH}) { pullRequest { number } } }`, { id: current.node_id });
    } catch (error) {
      // GitHub can refuse queuing an already fully approved, clean PR.
      // Only this precise response allows the ordinary protected merge endpoint.
      if (current.mergeable_state !== "clean" || !/Pull request is in clean status/.test(error.message)) throw error;
      const { data: merged } = await github.rest.pulls.merge({ owner, repo, pull_number, sha: ref, merge_method: "squash" });
      if (!merged.merged) throw new Error(`GitHub não integrou o PR #${pull_number}.`);
      core.info(`#${pull_number}: merge automático concluído com o SHA verificado; proteções nativas respeitadas.`);
      break; // Remaining PRs must be checked again against the new main.
    }
    core.info(`#${pull_number}: auto-merge nativo habilitado após validação do HEAD ${ref}.`);
  }
};
module.exports.validationChecks = validationChecks;
