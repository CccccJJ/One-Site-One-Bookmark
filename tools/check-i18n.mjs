// Validates _locales parity, key usage, description length, leftover hardcoded CJK in UI code.
// Usage (from repo root): node tools/check-i18n.mjs   → exit 0 when every check passes.
import fs from "node:fs";
const ext = new URL("../extension/", import.meta.url);
const read = p => fs.readFileSync(new URL(p, ext), "utf8");
let ok = true;
const check = (name, cond, extra = "") => { console.log(`${cond ? "PASS" : "FAIL"} ${name}${extra ? " — " + extra : ""}`); ok &&= cond; };

const manifest = JSON.parse(read("manifest.json"));
const en = JSON.parse(read("_locales/en/messages.json"));
const zh = JSON.parse(read("_locales/zh_CN/messages.json"));
const enKeys = Object.keys(en).sort(), zhKeys = Object.keys(zh).sort();
check("en/zh_CN key sets identical", JSON.stringify(enKeys) === JSON.stringify(zhKeys),
    `only en: ${enKeys.filter(k => !zh[k])} | only zh: ${zhKeys.filter(k => !en[k])}`);
for (const k of enKeys) {
    const pe = Object.keys(en[k].placeholders ?? {}).sort().join(), pz = Object.keys(zh[k]?.placeholders ?? {}).sort().join();
    if (pe !== pz) check(`placeholders match for ${k}`, false, `${pe} vs ${pz}`);
    for (const [lang, msgs] of [["en", en], ["zh_CN", zh]]) {
        const used = [...(msgs[k]?.message ?? "").matchAll(/\$([A-Za-z_]+)\$/g)].map(m => m[1].toLowerCase());
        const declared = Object.keys(msgs[k]?.placeholders ?? {});
        if (used.some(u => !declared.includes(u))) check(`${lang}.${k} placeholders declared`, false);
    }
}

const html = read("popup/popup.html"), js = read("popup/popup.js");
const used = new Set([
    ...[...html.matchAll(/data-i18n="([^"]+)"/g)].map(m => m[1]),
    ...[...js.matchAll(/\bt\("([^"]+)"/g)].map(m => m[1]),
    ...[...JSON.stringify(manifest).matchAll(/__MSG_([A-Za-z0-9_]+)__/g)].map(m => m[1]),
]);
const missing = [...used].filter(k => !en[k] || !zh[k]);
check(`all ${used.size} used keys exist in both locales`, missing.length === 0, missing.join());
const unused = enKeys.filter(k => !used.has(k));
check("no unused keys", unused.length === 0, unused.join());

for (const [lang, msgs] of [["en", en], ["zh_CN", zh]]) {
    const len = [...msgs.ext_description.message].length;
    check(`${lang} description <= 132 chars`, len <= 132, `${len}`);
}

const cjk = /[㐀-鿿＀-￯]/;
const codeLines = s => s.split("\n").map((l, i) => [i + 1, l])
    .filter(([, l]) => !/^\s*\/\//.test(l) && !/console\.log/.test(l));
const leftovers = [...codeLines(html).map(x => ["html", ...x]), ...codeLines(js).map(x => ["js", ...x])].filter(([, , l]) => cjk.test(l));
check("no hardcoded CJK in popup html/js", leftovers.length === 0, leftovers.map(([f, n]) => `${f}:${n}`).join(" "));
check("manifest has no host_permissions", !("host_permissions" in manifest));
check("manifest has activeTab", manifest.permissions.includes("activeTab"));
check("default_locale en", manifest.default_locale === "en");
process.exit(ok ? 0 : 1);
