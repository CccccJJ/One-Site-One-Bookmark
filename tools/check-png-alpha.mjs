// Prints size, color type and the alpha of pixel (0,0) of an 8-bit RGBA PNG.
// Usage: node tools/check-png-alpha.mjs store/images/store-icon-128.png   (store icon corners must be transparent)
import fs from "node:fs";
import zlib from "node:zlib";
const buf = fs.readFileSync(process.argv[2]);
let pos = 8, idat = [], w, h, depth, ctype;
while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; ctype = data[9]; }
    if (type === "IDAT") idat.push(data);
    pos += 12 + len;
}
const raw = zlib.inflateSync(Buffer.concat(idat));
// first pixel of first row is unaffected by every PNG filter type (no left/up neighbours)
console.log(`${w}x${h} depth=${depth} colortype=${ctype} (6=RGBA) pixel(0,0) rgba=${[...raw.subarray(1, 5)].join(",")}`);
