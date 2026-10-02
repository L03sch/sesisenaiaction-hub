import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

async function invoke(functionName, options = {}) {
  let handler;
  const calls = [];
  const caller = { id: "caller", email: options.email || "admin@example.test" };
  const client = {
    rpc: async (name, payload) => { calls.push([name, payload]); return {error: null}; },
    auth: {
      getUser: async () => ({ data: { user: options.invalidToken ? null : caller }, error: null }),
      admin: {
        createUser: async (payload) => { calls.push(["create", payload]); return { data: { user: { id: "created" } }, error: null }; },
        inviteUserByEmail: async (email, payload) => { calls.push(["invite", {email, ...payload}]); return { data: { user: {id: "created"} }, error: options.inviteError || null }; },
        updateUserById: async (id, payload) => { calls.push(["metadata", payload]); return {error: null}; },
        getUserById: async () => ({ data: { user: { id: "target", email: "target@example.test" } }, error: null }),
        deleteUser: async (id) => { calls.push(["delete", id]); return { error: null }; },
      },
    },
    from(table) {
      let id;
      const chain = {
        select() { return chain; },
        update(payload) { calls.push(["profile", payload]); return chain; },
        eq(_column, value) { id = value; return chain; },
        single: async () => ({ data: { is_absolute_admin: options.absolute !== false, role: id === "caller" ? (options.role || "admin") : (options.targetRole || "professor") }, error: options.profileError || null }),
        then(resolve) { return Promise.resolve({ count: options.plans || 0, error: options.plansError || null }).then(resolve); },
      };
      assert.ok(["profiles", "action_plans"].includes(table));
      return chain;
    },
  };
  const source = (await readFile(`supabase/functions/${functionName}/index.ts`, "utf8"))
    .replace(/^import .*createClient.*;\r?\n/m, "");
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  vm.runInNewContext(js, {
    createClient: () => client,
    Deno: { env: { get: () => "fixture" }, serve: (callback) => { handler = callback; } },
    Response, crypto: { randomUUID: () => "00000000-0000-0000-0000-000000000099" },
  });
  const headers = options.noToken ? {} : { Authorization: "Bearer fixture" };
  const response = await handler(new Request("https://example.test", {
    method: "POST", headers,
    body: JSON.stringify(functionName !== "delete-user-completely"
      ? { user_email: "new@example.test", user_password: "test-password", user_full_name: "New User", user_role: options.newRole || "professor" }
      : { user_id: options.targetId || "target" }),
  }));
  return { response, calls };
}

for (const functionName of ["create-user-account", "delete-user-completely", "invite-user-account"]) {
  test(`${functionName}: requires authentication`, async () => {
    const { response, calls } = await invoke(functionName, { noToken: true });
    assert.equal(response.status, 401); assert.equal(calls.length, 0);
  });
  test(`${functionName}: rejects invalid sessions`, async () => {
    const { response, calls } = await invoke(functionName, { invalidToken: true });
    assert.equal(response.status, 401); assert.equal(calls.length, 0);
  });
  for (const role of ["professor", "coordenador"]) {
    test(`${functionName}: ${role} denied even with legacy admin email`, async () => {
      const { response, calls } = await invoke(functionName, { role, email: "administrador.plan@gmail.com" });
      assert.equal(response.status, 403); assert.equal(calls.length, 0);
    });
  }
  test(`${functionName}: profile lookup failures deny access`, async () => {
    const { response, calls } = await invoke(functionName, { profileError: { message: "Unavailable" } });
    assert.equal(response.status, 403); assert.equal(calls.length, 0);
  });
  test(`${functionName}: ordinary admin cannot manage users`, async () => {
    const {response, calls} = await invoke(functionName, {absolute: false});
    assert.equal(response.status, 403); assert.equal(calls.length, 0);
  });
  test(`${functionName}: protected absolute admin works with any email`, async () => {
    const { response, calls } = await invoke(functionName);
    assert.equal(response.status, functionName !== "delete-user-completely" ? 201 : 200);
    assert.equal(calls.length, functionName !== "delete-user-completely" ? 3 : 1);
  });
}
test("account creation cannot grant admin privileges", async () => {
  const { response, calls } = await invoke("create-user-account", { newRole: "admin" });
  assert.equal(response.status, 400); assert.equal(calls.length, 0);
});
test("account creation stores authorization in app_metadata", async () => {
  const { calls } = await invoke("create-user-account");
  assert.equal(calls[1][1].app_metadata.user_role, "professor");
  assert.deepEqual(Object.keys(calls[1][1].app_metadata), ["user_role"]);
  assert.equal(calls[1][1].user_metadata.role, undefined);
});
test("administrators cannot delete themselves", async () => {
  const { response, calls } = await invoke("delete-user-completely", { targetId: "caller" });
  assert.equal(response.status, 400); assert.equal(calls.length, 0);
});
test("administrators cannot delete another administrator", async () => {
  const { response, calls } = await invoke("delete-user-completely", { targetRole: "admin" });
  assert.equal(response.status, 400); assert.equal(calls.length, 0);
});
test("authors cannot be deleted along with their institutional plans", async () => {
  const { response, calls } = await invoke("delete-user-completely", { plans: 2 });
  assert.equal(response.status, 409); assert.equal(calls.length, 0);
});
test("failed plan lookup does not allow account deletion", async () => {
  const { response, calls } = await invoke("delete-user-completely", { plansError: new Error("Unavailable") });
  assert.equal(response.status, 500); assert.equal(calls.length, 0);
});

test("invitation cannot grant admin privileges", async () => {
  const {response, calls} = await invoke("invite-user-account", {newRole: "admin"});
  assert.equal(response.status, 400); assert.equal(calls.length, 0);
});
test("invitation configures coordinator on the server and uses a fixed redirect", async () => {
  const {response, calls} = await invoke("invite-user-account", {newRole: "coordenador"});
  assert.equal(response.status, 201);
  assert.equal(calls[1][1].redirectTo, "https://plan-action-sesi-senai.jean-franco-junior.chatgpt.site/auth?invite=1");
  assert.equal(calls[1][1].data.role, undefined);
  assert.equal(calls[0][0], "prepare_user_enrollment");
  assert.equal(calls[0][1].user_role, "coordenador");
  assert.equal(calls[1][1].data.enrollment_token, calls[0][1].enrollment_token);
});
test("email provider failure is not reported as a sent invitation", async () => {
  const {response, calls} = await invoke("invite-user-account", {inviteError: {message: "SMTP unavailable"}});
  assert.equal(response.status, 400); assert.equal(calls.length, 3);
});
