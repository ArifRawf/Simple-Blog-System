const path = require('path');
const logout = require(path.join(process.cwd(),'core','modules','logout'));
module.exports = (req,res) => {
	if(logout(req,res)) return; //for logout action
	}
	