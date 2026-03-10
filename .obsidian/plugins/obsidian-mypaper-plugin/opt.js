const fs=require("fs");const c=fs.readFileSync("src/settings.ts","utf8");
c=c.replace(/previewContainer\.style\.gap = '20px';/g,'previewContainer.style.gap = '24px';");
c=c.replace(/controls\.style\.gridTemplateColumns = 'repeat\(2, 1fr\)';/g,'controls.style.gridTemplateColumns = 'repeat(3, 1fr)';");
c=c.replace(/controls\.style\.marginTop = '12px';/g,'controls.style.marginTop = '20px';");
c=c.replace(/controls\.style\.gap = '12px';/g,'controls.style.gap = '16px';");
fs.writeFileSync("src/settings.ts",c,"utf8");
console.log("OK");
