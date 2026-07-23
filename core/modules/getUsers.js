const path = require('path'); 
const fs = require('fs').promises; 

async function getUsers() {
const userProfiles = [];
const userFiles = await fs.readdir(path.join(process.cwd(),'users'));
for(const file of userFiles) {
	const data = JSON.parse(await fs.readFile(path.join(process.cwd(),'users',file),'utf8'));
	userProfiles.push(data);
	}
	return userProfiles;
}

module.exports = getUsers;