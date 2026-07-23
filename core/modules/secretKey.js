const fs = require('fs');
const path = require('path');

//access and refresh token secret key loading from file manager
const accessSec = fs.readFileSync(path.join(process.cwd(),'secret','access.txt'),'utf8'); 
const refreshSec = fs.readFileSync(path.join(process.cwd(),'secret','refresh.txt'),'utf8'); 

module.exports = { accessSec, refreshSec };