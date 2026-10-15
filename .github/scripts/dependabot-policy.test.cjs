const { test } = require("node:test");
const assert = require("node:assert/strict");
const { eligible, requiredChecks } = require("./dependabot-policy.cjs");
function sample() {
  return {
    repository: { full_name: "L03sch/sesisenaiaction-hub", allow_auto_merge: true },
    pr: { user: { login: "dependabot[bot]" }, state: "open", draft: false, base: { ref: "main" }, head: { repo: { full_name: "L03sch/sesisenaiaction-hub" } }, mergeable: true, mergeable_state: "clean" },
    branch: { protected: true, protection: { required_status_checks: { contexts: requiredChecks } } },
    upToDate: true,
    checks: requiredChecks.map(name => ({ name, status: "completed", conclusion: "success" })),
    statuses: [],
  };
}
test("allows only a protected, fully checked Dependabot PR", () => assert.equal(eligible(sample()), null));
test("can queue a fully checked PR while GitHub waits for approval", () => {
  const x = sample(); x.pr.mergeable_state = "blocked"; assert.equal(eligible(x), null);
});
for (const [name, change] of [
  ["disabled repository setting", x => { x.repository.allow_auto_merge = false; }],
  ["human PR", x => { x.pr.user.login = "someone"; }],
  ["draft", x => { x.pr.draft = true; }],
  ["fork", x => { x.pr.head.repo.full_name = "someone/fork"; }],
  ["different base", x => { x.pr.base.ref = "other"; }],
  ["closed PR", x => { x.pr.state = "closed"; }],
  ["conflict", x => { x.pr.mergeable = false; }],
  ["outdated branch", x => { x.pr.mergeable_state = "behind"; }],
  ["unknown mergeability", x => { x.pr.mergeable = null; }],
  ["missing protection", x => { x.branch = null; }],
  ["unprotected branch", x => { x.branch.protected = false; }],
  ["outdated ancestry", x => { x.upToDate = false; }],
  ["missing required rule", x => { x.branch.protection.required_status_checks.contexts = ["permissions"]; }],
  ["missing check", x => { x.checks.pop(); }],
  ["pending check", x => { x.checks[0].status = "in_progress"; }],
  ["failed check", x => { x.checks[0].conclusion = "failure"; }],
  ["skipped check", x => { x.checks[0].conclusion = "skipped"; }],
  ["extra failed check", x => { x.checks.push({ name: "other", status: "completed", conclusion: "failure" }); }],
  ["failed commit status", x => { x.statuses.push({ context: "external", state: "failure" }); }],
]) test(`rejects ${name}`, () => { const x = sample(); change(x); assert.ok(eligible(x)); });
test("accepts checks stored as app-bound branch rules", () => {
  const x = sample(); x.branch.protection.required_status_checks = { checks: requiredChecks.map(context => ({ context, app_id: 15368 })) };
  assert.equal(eligible(x), null);
});
test("uses latest rerun and does not accept an older success", () => {
  const x = sample(); x.checks.unshift({ name: "permissions", status: "completed", conclusion: "failure" }); assert.ok(eligible(x));
  x.checks[0].conclusion = "success"; x.checks.push({ name: "permissions", status: "completed", conclusion: "failure" }); assert.equal(eligible(x), null);
});

const run = require("./dependabot-automerge.cjs");
function harness(errorMessage, changedHead = false, mergeState = "clean") {
  const x = sample();
  x.branch.commit = { sha: "base-sha" };
  x.pr.head.sha = "tested-sha";
  x.pr.node_id = "PR_test";
  x.pr.mergeable_state = mergeState;
  let reads = 0;
  const merges = [];
  const listChecks = () => {};
  const listStatuses = () => {};
  const github = {
    rest: {
      repos: {
        get: async () => ({ data: x.repository }),
        getBranch: async () => ({ data: x.branch }),
        compareCommits: async () => ({ data: { status: "ahead" } }),
        listCommitStatusesForRef: listStatuses,
      },
      pulls: {
        get: async () => ({ data: { ...x.pr, head: { ...x.pr.head, sha: changedHead && ++reads > 1 ? "new-sha" : "tested-sha" } } }),
        merge: async args => { merges.push(args); return { data: { merged: true } }; },
      },
      checks: { listForRef: listChecks },
    },
    paginate: async endpoint => endpoint === listChecks ? x.checks : [],
    graphql: async () => { if (errorMessage) throw new Error(errorMessage); return {}; },
  };
  return { merges, options: { github, context: { repo: { owner: "L03sch", repo: "sesisenaiaction-hub" }, payload: { pull_request: { number: 22 } } }, core: { info() {}, setFailed(message) { throw new Error(message); } } } };
}
test("only requests native auto-merge when queuing succeeds", async () => {
  const x = harness(); await run(x.options); assert.equal(x.merges.length, 0);
});
test("already-clean fallback merges only the tested SHA", async () => {
  const x = harness("Pull request Pull request is in clean status"); await run(x.options);
  assert.equal(x.merges.length, 1); assert.equal(x.merges[0].sha, "tested-sha");
});
test("permission failures never fall back to merge", async () => {
  const x = harness("Resource not accessible by integration");
  await assert.rejects(run(x.options), /Resource not accessible/); assert.equal(x.merges.length, 0);
});
test("review-blocked PR can only be queued, never immediately merged", async () => {
  const x = harness("Pull request is in clean status", false, "blocked");
  await assert.rejects(run(x.options)); assert.equal(x.merges.length, 0);
});
test("changed HEAD blocks all merge requests", async () => {
  const x = harness("Pull request is in clean status", true); await run(x.options); assert.equal(x.merges.length, 0);
});
test("ignores only the controller's own identified workflow check", async () => {
  const check = { name: "enable", app: { slug: "github-actions" }, details_url: "https://github.com/L03sch/sesisenaiaction-hub/actions/runs/123/job/456", conclusion: "failure" };
  const github = { rest: { actions: { getWorkflowRun: async () => ({ data: { path: ".github/workflows/dependabot-automerge.yml" } }) } } };
  assert.deepEqual(await run.validationChecks(github, "L03sch", "sesisenaiaction-hub", [check]), []);
  github.rest.actions.getWorkflowRun = async () => ({ data: { path: ".github/workflows/other.yml" } });
  assert.deepEqual(await run.validationChecks(github, "L03sch", "sesisenaiaction-hub", [check]), [check]);
});
test("a check name or foreign URL cannot spoof the controller", async () => {
  const check = { name: "enable", app: { slug: "github-actions" }, details_url: "https://github.com/other/repo/actions/runs/123/job/456" };
  assert.deepEqual(await run.validationChecks({}, "L03sch", "sesisenaiaction-hub", [check]), [check]);
});
