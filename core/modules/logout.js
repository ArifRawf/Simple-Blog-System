//Logout handler to logout user and redirect to login page
	module.exports = (req,res) => {
	const urlData = new URL(req.url,`http://${req.headers.host}`); //url Object Data
	if(urlData.pathname === '/logout') {
	res.writeHead(302,{'Set-Cookie' : [`accessToken=; HttpOnly; Path=/; SameSite=Strict`,`refreshToken=; HttpOnly; Path=/; SameSite=Strict`], 'Location' : '/login.html'});
	res.end();
	return true;
	}
	return false;
	}
	
	