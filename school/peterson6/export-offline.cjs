const fs=require('node:fs'),path=require('node:path');
const output=process.argv[2];if(!output)throw Error('Usage: node export-offline.cjs /absolute/output.html');
let html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+fs.readFileSync(path.join(__dirname,'style.css'),'utf8')+'</style>');
html=html.replace(/\s*<script defer src="[^"]+"><\/script>/g,'');
html=html.replace('href="/courses/"','href="https://mathexam.space/courses/"');
const scripts=['math.js','models.js','data.js','app.js'].map(f=>'<script>\n'+fs.readFileSync(path.join(__dirname,f),'utf8').replace(/<\/script/gi,'<\\/script')+'\n</script>').join('\n');
html=html.replace('</body>',scripts+'\n</body>');fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(output,html);console.log('Offline course written; all runtime assets embedded.');
