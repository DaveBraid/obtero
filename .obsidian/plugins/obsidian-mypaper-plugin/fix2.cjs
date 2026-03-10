const fs=require("fs");
let c=fs.readFileSync("src/settings.ts","utf8");
c=c.replace(/\); font-size:/g,"); + 'font-size:");
c=c.replace(/\); opacity:/g,"); + 'opacity:");
fs.writeFileSync("src/settings.ts",c,"utf8");
console.log("OK");
