// In-memory chrome.* stub; exercises service-worker.js trash / restore / import guard.
// Usage (from repo root): node tools/test-service-worker.mjs   → exit 0 when every check passes.
const store = {};
const L = {};
const errors = [];
process.on("unhandledRejection", e => errors.push(String(e)));

let next_id = 100;
const root = { id: "0", children: [
    { id: "1", title: "Bar", parentId: "0", children: [] },
    { id: "2", title: "Other", parentId: "0", children: [] },
]};
function all_nodes(n = root, out = []) { out.push(n); (n.children || []).forEach(c => all_nodes(c, out)); return out; }
function find(id) { return all_nodes().find(n => n.id === id); }
function reindex(p) { p.children.forEach((c, i) => (c.index = i)); }
function mkfolder(parentId, title) { const p = find(parentId); const f = { id: String(next_id++), title, parentId, children: [] }; p.children.push(f); reindex(p); return f; }
function mkbm(parentId, url, title = url) {
    const p = find(parentId);
    const bm = { id: String(next_id++), parentId, url, title };
    p.children.push(bm); reindex(p);
    L.created(bm.id, { ...bm });
    return bm;
}

globalThis.chrome = {
    storage: { local: {
        get: async k => (k in store ? { [k]: structuredClone(store[k]) } : {}),
        set: async o => Object.assign(store, structuredClone(o)),
        remove: async k => { delete store[k]; },
    }},
    bookmarks: {
        onCreated: { addListener: f => (L.created = f) },
        onImportBegan: { addListener: f => (L.importBegan = f) },
        onImportEnded: { addListener: f => (L.importEnded = f) },
        getTree: async () => [structuredClone(root)],
        getChildren: async id => { const n = find(id); if (!n || !n.children) throw new Error("Can't find parent bookmark for id."); return structuredClone(n.children); },
        remove: async id => { const n = find(id); const p = find(n.parentId); p.children = p.children.filter(c => c.id !== id); reindex(p); },
        create: async ({ parentId = "2", index, title, url }) => {
            const p = find(parentId); if (!p) throw new Error("no parent");
            if (index !== undefined && index > p.children.length) throw new Error("Index out of bounds.");
            const bm = { id: String(next_id++), parentId, url, title };
            p.children.splice(index ?? p.children.length, 0, bm); reindex(p);
            L.created(bm.id, { ...bm });
            return bm;
        },
    },
    runtime: {
        onInstalled: { addListener: f => (L.installed = f) },
        onMessage: { addListener: f => (L.message = f) },
    },
};

const ext = new URL("../extension/", import.meta.url);
await import(new URL("background/service-worker.js", ext));
const site = await import(new URL("utils/site.js", ext));
const bmu = await import(new URL("utils/bookmark.js", ext));
const tick = () => new Promise(r => setTimeout(r, 30));
const urls = () => all_nodes().filter(n => n.url).map(n => `${n.url}@${n.parentId}:${n.index}`).join(", ");
const send = msg => new Promise(res => { const keep = L.message(msg, {}, res); if (keep !== true) res(undefined); });
let ok = true;
const check = (name, cond) => { console.log(`${cond ? "PASS" : "FAIL"} ${name}`); ok &&= cond; };

// 1. existing 3 bookmarks on x.com across two folders, then enable + new bookmark
const work = mkfolder("1", "work");
await tick();
mkbm("1", "https://x.com/old1"); mkbm(work.id, "https://x.com/old2"); mkbm("2", "https://x.com/old3");
await tick();
check("before enable nothing deleted", bmu.find_bookmarks_by_domain([root], "x.com").length === 3);
await site.enable_site("x.com");
mkbm("1", "https://x.com/new"); await tick();
check("only newest remains", urls().includes("x.com/new") && bmu.find_bookmarks_by_domain([root], "x.com").length === 1);
let trash = await bmu.get_trash();
check("3 items in trash", trash.length === 3);

// 2. restore old2 (folder still exists) -> goes back, new is NOT deleted
let r = await send({ type: "restore", id: trash.find(t => t.url.endsWith("old2")).id }); await tick();
check("restore ok", r?.ok === true);
check("old2 back in work folder, new kept", urls().includes(`x.com/old2@${work.id}`) && urls().includes("x.com/new"));
check("trash now 2", (await bmu.get_trash()).length === 2);

// 3. delete original folder of old1? old1 was in "1" -> simulate missing parent by editing trash
trash = await bmu.get_trash();
const t1 = trash.find(t => t.url.endsWith("old1"));
store.trash = store.trash.map(t => t.id === t1.id ? { ...t, parentId: "999", index: 50 } : t);
r = await send({ type: "restore", id: t1.id }); await tick();
check("restore with missing parent falls back", r?.ok === true && urls().includes("x.com/old1@2"));

// 4. index clamp: old3 index larger than folder length
const t3 = (await bmu.get_trash()).find(t => t.url.endsWith("old3"));
store.trash = store.trash.map(t => t.id === t3.id ? { ...t, index: 99 } : t);
r = await send({ type: "restore", id: t3.id }); await tick();
check("restore clamps index", r?.ok === true && urls().includes("x.com/old3@2"));
check("trash empty", (await bmu.get_trash()).length === 0);

// 5. import guard: during import no deletions
L.importBegan();
mkbm("2", "https://x.com/imp1"); mkbm("2", "https://x.com/imp2"); await tick();
L.importEnded();
check("import keeps all", bmu.find_bookmarks_by_domain([root], "x.com").length === 6);

// 6. after import, normal behavior resumes; restoring URL set does not leak
mkbm("1", "https://x.com/after"); await tick();
check("after import rotates to 1", bmu.find_bookmarks_by_domain([root], "x.com").length === 1);

// 7. folder creation does not throw; disabled site untouched
mkfolder("1", "f2"); L.created("x", { id: "x", title: "folder" }); await tick();
mkbm("1", "https://y.com/a"); mkbm("1", "https://y.com/b"); await tick();
check("disabled y.com keeps 2", bmu.find_bookmarks_by_domain([root], "y.com").length === 2);

// 8. trash limit 50
store.trash = Array.from({ length: 49 }, (_, i) => ({ id: "t" + i, removed_at: Date.now() }));
await bmu.add_to_trash([{ id: "a" }, { id: "b" }, { id: "c" }]);
check("trash capped at 50, newest first", store.trash.length === 50 && store.trash[0].id === "a");

// 9. unknown message ignored
check("non-restore message ignored", L.message({ type: "other" }, {}, () => {}) === undefined);

// 10. double-click restore: same id sent twice concurrently
mkbm("1", "https://x.com/dup-old"); await tick();
mkbm("1", "https://x.com/dup-new"); await tick();
const td = (await bmu.get_trash()).find(t => t.url?.endsWith("dup-old"));
await Promise.all([send({ type: "restore", id: td.id }), send({ type: "restore", id: td.id })]); await tick();
const xs = bmu.find_bookmarks_by_domain([root], "x.com").map(n => n.url).sort().join(",");
console.log("   x.com now:", xs);
check("double restore -> dup-new kept + exactly one dup-old", xs === "https://x.com/dup-new,https://x.com/dup-old");

// 11. discard one entry
const DAY = 24 * 60 * 60 * 1000;
store.trash = [
    { id: "d1", url: "https://x.com/d1", removed_at: Date.now() },
    { id: "d2", url: "https://x.com/d2", removed_at: Date.now() },
];
r = await send({ type: "discard", id: "d1" });
check("discard ok and removes only that entry", r?.ok === true && (await bmu.get_trash()).map(t => t.id).join() === "d2");

// 12. clear all
r = await send({ type: "clear" });
check("clear empties trash", r?.ok === true && (await bmu.get_trash()).length === 0);

// 13. 7-day expiry: filtered on read, purged on next write
store.trash = [
    { id: "fresh", url: "https://x.com/f", removed_at: Date.now() - 6 * DAY },
    { id: "stale", url: "https://x.com/s", removed_at: Date.now() - 8 * DAY },
];
check("expired entry hidden on read", (await bmu.get_trash()).map(t => t.id).join() === "fresh");
await send({ type: "discard", id: "nope" });
check("expired entry purged from storage on write", store.trash.map(t => t.id).join() === "fresh");

// 14. concurrent discard (popup) + deletions (service worker) lose nothing
store.trash = [{ id: "keep-out", url: "https://x.com/k", removed_at: Date.now() }];
const before = bmu.find_bookmarks_by_domain([root], "x.com").map(n => n.url);
const p1 = send({ type: "discard", id: "keep-out" });
mkbm("1", "https://x.com/race-new");
await p1; await tick(); await tick();
const ids = (await bmu.get_trash()).map(t => t.url).sort();
check("race: discarded gone, all deleted bookmarks recorded",
    !ids.includes("https://x.com/k") && before.every(u => ids.includes(u)) && ids.length === before.length);

check("no unhandled errors", errors.length === 0);
if (errors.length) console.log(errors);
process.exit(ok ? 0 : 1);
