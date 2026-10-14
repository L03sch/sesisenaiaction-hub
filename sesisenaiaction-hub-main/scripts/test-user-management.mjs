import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

async function invoke(functionName, options = {}) {
  let handler;
  const calls = [];
  const logs = [];
  const caller = { id: "caller", email: options.email || "admin@example.test", app_metadata: options.metadata || {} };
  const client = {
    rpc: async (name, payload) => { calls.push([name, payload]); return {data: options.setupReady !== false, error: options.rpcError || null}; },
    auth: {
      getUser: async () => ({ data: { user: options.invalidToken ? null : caller }, error: null }),
      signInWithPassword: async () => ({data: {user: options.wrongCurrent ? null : caller},error: options.wrongCurrent ? {code:"invalid_credentials"} : null}),
      signOut: async () => ({error:null}),
      admin: {
        createUser: async (payload) => { calls.push(["create", payload]); return { data: { user: { id: "created" } }, error: options.createError || null }; },
        inviteUserByEmail: async (email, payload) => { calls.push(["invite", {email, ...payload}]); return { data: { user: {id: "created"} }, error: options.inviteError || null }; },
        updateUserById: async (id, payload) => { calls.push(["metadata", payload]); return {error: options.updateError || null}; },
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
        maybeSingle: async () => ({data: options.unknownDepartment ? null : {name: "Educação"},error: options.departmentError || null}),
        single: async () => ({ data: { department: id === "caller" ? (options.callerDepartment === undefined ? "Educação" : options.callerDepartment) : (options.targetDepartment || "Educação"), is_absolute_admin: id === "caller" ? options.absolute !== false : options.targetAbsolute === true, role: id === "caller" ? (options.role || "admin") : (options.targetRole || "professor") }, error: options.profileError || null }),
        then(resolve) { return Promise.resolve({ count: options.plans || 0, error: options.plansError || null }).then(resolve); },
      };
      assert.ok(["profiles", "action_plans", "departments"].includes(table));
      return chain;
    },
  };
  const shared = (await Promise.all(["password-policy", "errors", "password-access"].map(name=>readFile(`supabase/functions/_shared/${name}.ts`, "utf8")))).join("\n");
  const source = (shared + "\n" + await readFile(`supabase/functions/${functionName}/index.ts`, "utf8"))
    .replace(/^import[^\r\n]*\r?\n/gm, "").replace(/^export /gm, "");
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  vm.runInNewContext(js, {
    createClient: () => client,
    Deno: { env: { get: () => "fixture" }, serve: (callback) => { handler = callback; } },
    Response, TextEncoder, console: {error: line=>logs.push(line)}, crypto: { randomUUID: () => "00000000-0000-0000-0000-000000000099" },
  });
  const headers = options.noToken ? {} : { Authorization: "Bearer fixture" };
  const response = await handler(new Request("https://example.test", {
    method: "POST", headers,
    body: options.invalidJson ? "{" : JSON.stringify(functionName === "complete-initial-password" ? {current_password: options.currentPassword || "InitialSecret!2026", new_password: options.password || "PersonalSecret!2026"} : functionName !== "delete-user-completely"
      ? { user_email: "new@example.test", user_password: options.password || "SecureFixture!2026", user_full_name: "New User", user_department: options.newDepartment === undefined ? "Educação" : options.newDepartment, user_role: options.newRole || "professor" }
      : { user_id: options.targetId || "target" }),
  }));
  return { response, calls, logs };
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
  test(`${functionName}: ordinary admin follows operation permissions`, async () => {
    const {response, calls} = await invoke(functionName, {absolute: false});
    assert.equal(response.status, functionName === "delete-user-completely" ? 200 : 403); assert.equal(calls.length, functionName === "delete-user-completely" ? 1 : 0);
  });
  test(`${functionName}: protected absolute admin works with any email`, async () => {
    const { response, calls } = await invoke(functionName);
    assert.equal(response.status, functionName !== "delete-user-completely" ? 201 : 200);
    assert.equal(calls.length, functionName !== "delete-user-completely" ? 3 : 1);
  });
}
test("account creation cannot grant principal admin privileges", async () => {
  const { response, calls } = await invoke("create-user-account", { newRole: "absolute_admin" });
  assert.equal(response.status, 400); assert.equal(calls.length, 0);
});
test("principal can create an ordinary admin with a password and no department", async () => {
  const { response, calls } = await invoke("create-user-account", { newRole: "admin", newDepartment: null });
  assert.equal(response.status, 201);
  assert.equal(calls[1][1].password, "SecureFixture!2026");
  assert.equal(calls[1][1].app_metadata.user_role, "admin");
  assert.equal(calls[1][1].user_metadata.department, null);
  assert.equal(calls[1][1].user_metadata.is_absolute_admin, undefined);
  assert.equal(calls[1][1].user_metadata.password, undefined);
});
test("ordinary admin cannot create another admin with a password", async () => {
  const { response, calls } = await invoke("create-user-account", { absolute: false, newRole: "admin" });
  assert.equal(response.status, 403);
  assert.equal(calls.length, 0);
});
test("account creation stores authorization in app_metadata", async () => {
  const { calls } = await invoke("create-user-account");
  assert.equal(calls[1][1].app_metadata.user_role, "professor");
  assert.deepEqual(Object.keys(calls[1][1].app_metadata), ["user_role", "must_change_password"]);
  assert.equal(calls[1][1].app_metadata.must_change_password, true);
  assert.equal(calls[1][1].user_metadata.role, undefined);
});
test("administrators cannot delete themselves", async () => {
  const { response, calls } = await invoke("delete-user-completely", { targetId: "caller" });
  assert.equal(response.status, 400); assert.equal(calls.length, 0);
});
test("ordinary administrators cannot delete another administrator", async () => {
  const { response, calls } = await invoke("delete-user-completely", { targetRole: "admin", absolute: false });
  assert.equal(response.status, 403); assert.equal(calls.length, 0);
});
test("authors cannot be deleted along with their institutional plans", async () => {
  const { response, calls } = await invoke("delete-user-completely", { plans: 2 });
  assert.equal(response.status, 409); assert.equal(calls.length, 0);
});
test("failed plan lookup does not allow account deletion", async () => {
  const { response, calls } = await invoke("delete-user-completely", { plansError: new Error("Unavailable") });
    assert.equal(response.status, 500); assert.equal(calls.filter(c=>c[0]!=="diagnostic").length, 0);
});

test("invitation cannot grant the principal Admin role", async () => {
  const {response, calls} = await invoke("invite-user-account", {newRole: "absolute_admin"});
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
  assert.equal(response.status, 500); assert.equal(calls.filter(c=>c[0]!=="diagnostic").length, 3);
});

test("principal Admin can delete a normal administrator", async () => {
 const {response,calls} = await invoke("delete-user-completely", {targetRole:"admin"});
 assert.equal(response.status,200); assert.equal(calls[0][0],"delete");
});
for (const absolute of [true,false]) test(`principal Admin cannot be deleted by admin absolute=${absolute}`,async()=>{
 const {response,calls}=await invoke("delete-user-completely",{absolute,targetRole:"admin",targetAbsolute:true});
 assert.equal(response.status,403);assert.equal(calls.length,0);
});
test("normal admin can delete a coordinator",async()=>{
 const {response,calls}=await invoke("delete-user-completely",{absolute:false,targetRole:"coordenador"});
 assert.equal(response.status,200);assert.equal(calls.length,1);
});

test("principal Admin can invite an ordinary administrator", async () => {
 const {response,calls}=await invoke("invite-user-account",{newRole:"admin"});
 assert.equal(response.status,201);
 assert.equal(calls[0][1].user_role,"admin");
 assert.equal(calls[1][1].data.is_absolute_admin,undefined);
 assert.equal(calls[1][1].data.role,undefined);
});
test("normal admin cannot invite another administrator", async () => {
 const {response,calls}=await invoke("invite-user-account",{absolute:false,newRole:"admin"});
 assert.equal(response.status,403);assert.equal(calls.length,0);
});

for (const functionName of ["create-user-account","invite-user-account"]) {
  for (const options of [{newDepartment:null},{unknownDepartment:true}]) test(`${functionName} rejects invalid department ${JSON.stringify(options)}`,async()=>{
    const {response,calls}=await invoke(functionName,options);assert.equal(response.status,400);assert.equal(calls.length,0);
  });
  test(`${functionName} fails closed when department lookup fails`,async()=>{
    const {response,calls}=await invoke(functionName,{departmentError:{message:"Unavailable"}});assert.equal(response.status,500);assert.equal(calls.length,0);
  });
}
test("ordinary administrators can manage professors across departments",async()=>{
 const {response,calls}=await invoke("delete-user-completely",{absolute:false,callerDepartment:null,targetDepartment:"Mecânica"});assert.equal(response.status,200);assert.equal(calls.length,1);
});
test("principal can delete ordinary users across departments",async()=>{
 const {response,calls}=await invoke("delete-user-completely",{callerDepartment:"Educação",targetDepartment:"Mecânica"});assert.equal(response.status,200);assert.equal(calls.length,1);
});

test("administrator invitation does not require a department",async()=>{
 const {response,calls}=await invoke("invite-user-account",{newRole:"admin",newDepartment:null});assert.equal(response.status,201);assert.equal(calls[1][1].data.department,null);
});

for (const password of ["aaaaaa", "LongButNoSymbol123", "Abc!1234567890", "Password!1234", "A!2" + "é".repeat(40)]) {
  test("creation rejects a weak or overlong password without creating an account", async()=>{
    const {response,calls}=await invoke("create-user-account",{password});
    assert.equal(response.status,400); assert.equal(calls.length,0);
  });
}
for (const name of ["create-user-account","invite-user-account","delete-user-completely"]) {
  test(`${name}: pending personal password blocks the protected Admin too`,async()=>{
    const {response,calls}=await invoke(name,{metadata:{must_change_password:true}});
    assert.equal(response.status,403);assert.equal(calls.length,0);
  });
  test(`${name}: old session stays blocked after password setup`,async()=>{
    const {response,calls}=await invoke(name,{metadata:{initial_password_changed_at:"2026-10-14T00:00:00Z"},setupReady:false});
    assert.equal(response.status,403);assert.deepEqual(calls.map(c=>c[0]),["password_setup_complete"]);
  });
  test(`${name}: malformed JSON does not expose internals`,async()=>{
    const {response,calls}=await invoke(name,{invalidJson:true});
    assert.equal(response.status,400);assert.equal(calls.length,0);
  });
}
test("provider error text and credentials never enter the response or diagnostics",async()=>{
  const secret="PRIVATE_FIXTURE_CREDENTIAL";
  const {response,logs}=await invoke("invite-user-account",{inviteError:{message:secret,code:secret}});
  const body=await response.json();
  assert.equal(response.status,500);assert.ok(body.incident_id);
  assert.equal(JSON.stringify(body).includes(secret),false);
  // An allowlisted *shape* cannot distinguish a credential from an error code.
  // Only known error-code values should be emitted by the diagnostic helper.
  assert.equal(logs.some(line=>line.includes(secret)),false);
});
for(const options of [{noToken:true},{invalidToken:true}]) test("initial reset requires a valid authenticated user",async()=>{
  const {response,calls}=await invoke("complete-initial-password",options);assert.equal(response.status,401);assert.equal(calls.length,0);
});
test("initial reset cannot be used as an unrestricted admin password endpoint",async()=>{
  const {response,calls}=await invoke("complete-initial-password");assert.equal(response.status,409);assert.equal(calls.length,0);
});
for(const extra of [{wrongCurrent:true},{password:"InitialSecret!2026"},{password:"aaaaaa"}]) test("initial reset rejects wrong, reused or weak passwords",async()=>{
  const {response,calls}=await invoke("complete-initial-password",{metadata:{must_change_password:true},...extra});
  assert.ok([400,403].includes(response.status));assert.equal(calls.length,0);
});
test("personal password reset preserves authorization and invalidates old sessions by timestamp",async()=>{
  const {response,calls}=await invoke("complete-initial-password",{metadata:{must_change_password:true,user_role:"professor"}});
  assert.equal(response.status,200);assert.equal(calls.length,1);
  const update=calls[0][1];assert.equal(update.password,"PersonalSecret!2026");assert.equal(update.app_metadata.must_change_password,false);assert.equal(update.app_metadata.user_role,"professor");assert.ok(Date.parse(update.app_metadata.initial_password_changed_at));
});
test("failed personal password save does not report success",async()=>{
  const {response}=await invoke("complete-initial-password",{metadata:{must_change_password:true},updateError:{message:"Sensitive internal data"}});
  assert.equal(response.status,500);assert.equal((await response.text()).includes("Sensitive internal data"),false);
});
