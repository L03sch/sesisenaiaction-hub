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
