//Only role with admin can change other user role
const fs = require('fs').promises;
const path = require('path');
const auth = require('./authCheck');
const userProfiles = require('./getUsers'); 

module.exports = async (req,res,segment,refreshTokens) => {
	const users = await userProfiles(); //returns all users data
	const logged = auth(req,res,refreshTokens); //returns payload or false
	let loggedUser;
	if(logged) {
	loggedUser = JSON.parse(await fs.readFile(path.join(process.cwd(),'users',`${logged.userid}.json`),'utf8'));
	}
	