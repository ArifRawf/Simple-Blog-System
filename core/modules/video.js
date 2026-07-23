const auth = require('./authCheck');
const fs = require('fs');
const path = require('path');

module.exports = (req,res,segment,refreshTokens) => {
	if(req.method === 'POST' && req.url === '/api/upload-video') {
		const logged = auth(req,res,refreshTokens);
		if(!logged) {
			res.writeHead(401,{'Content-Type':'application/json'});
        res.end(JSON.stringify({error: 'You must logged In!'}));
        return true;
        }
        const fileName = req.headers['x-file-name'];
        const saveLoc = path.join(process.cwd(),'videos',fileName);
        const writeFile = fs.createWriteStream(saveLoc);
        req.pipe(writeFile);
        writeFile.on('finish',()=> {
        	res.writeHead(200,{'Content-Type':'application/json'});
        res.end(JSON.stringify({status: 'Video Uploaded'}));
        return true;
        });
        writeFile.on('error',()=> {
        	res.writeHead(500,{'Content-Type':'application/json'});
        res.end(JSON.stringify({error: 'Failed To Upload Video!'}));
        return true;
        });
        return true;
        }
        }