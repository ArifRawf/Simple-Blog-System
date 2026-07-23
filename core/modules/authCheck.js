//authentication via jwt built-in module
const jwt = require('jsonwebtoken');
const path = require('path');
const { accessSec,refreshSec } = require(path.join(process.cwd(),'core','modules','secretKey'));
let refreshToken;
let accessToken;
let payload;
module.exports = (req,res, refreshTokens) => {
	const cookie = req.headers.cookie || '';
	if (!cookie) return false;
	const cookies = Object.fromEntries(
  cookie.split(';').map(c => {
    const [key, value] = c.trim().split('=');
    return [key, value];
  })
);
accessToken = cookies.accessToken;
 refreshToken = cookies.refreshToken;
 if(!refreshToken && !accessToken) return false;
	if(refreshTokens.size === 0 || !refreshTokens.get(refreshToken))  {
		return false;
		}
	try {
 payload = jwt.verify(accessToken,accessSec);
        } catch(err) {
		if (err.name === "TokenExpiredError") {
			let pl;
			try {
 pl = jwt.verify(refreshToken,refreshSec);
 } catch(err) {
 	if(err.name === "TokenExpiredError") {
 	res.setHeader('Set-Cookie', [
  'accessToken=; HttpOnly; Path=/',
  'refreshToken=; HttpOnly; Path=/'
]);
     res.writeHead(302, {
  Location: '/login.html'
});
res.end();
return false;
}
}
       const newAT = jwt.sign(
   {userid: pl.userid,role: pl.role,pdate: pl.pdate},
   accessSec,
   {expiresIn: '1m'}
  );
  res.setHeader('Set-Cookie',`accessToken=${newAT}; HttpOnly; Path=/; SameSite=Strict`);
  payload = jwt.verify(newAT, accessSec);
  } else {
        	return false;
        }
        }
        return payload;
        }