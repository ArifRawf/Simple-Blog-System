//all posts index list module
const fs = require('fs').promises; 
const path = require('path');

module.exports = async () => {
const data = JSON.parse(await fs.readFile(path.join(process.cwd(),'main','posts','postIndex.json'),'utf8'));
return data;
}