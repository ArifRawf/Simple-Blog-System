const jwt = require('jsonwebtoken');
	const path = require('path');
	const { accessSec,refreshSec } = require(path.join(process.cwd(),'core','modules','secretKey'));
 const fs = require('fs').promises;
	const auth = require('./authCheck');
	


async function post(req,res,refreshTokens) {
	
	const logged = auth(req,res,refreshTokens);
	if(!logged) {
		res.writeHead(401, {'Content-Type':'application/json'});
	return res.end(JSON.stringify({error: 'Logged Users Only!'}));
	}
	let body = '';
	req.on('data', (c) => {
	 body += c.toString();
	});
	//when all data arrives
	req.on('end', async ()=> {
		let data;
		try{
    data = JSON.parse(body);
   } catch(e) {
   	res.writeHead(400, {'Content-Type':'application/json'});
	return res.end(JSON.stringify({error: e.message}));
	}
	
	if(!data.post.titleP || !data.post.postB) {
   	res.writeHead(401, {'Content-Type':'application/json'});
	return res.end(JSON.stringify({error:'please write something?'}));
	}
	if(!data.post.catId) {
		res.writeHead(400, {'Content-Type':'application/json'});
	return res.end(JSON.stringify({error:'You must select a category!'}));
	}
	const postTitle = data.post.titleP;
	const catId = data.post.catId;
	const postBody = data.post.postB;
	const postTime = data.post.date;
        const categoryName = JSON.parse(await fs.readFile(path.join(process.cwd(),'main','categories',`${catId}.json`), 'utf8')).catName;
        const profile = JSON.parse(await fs.readFile(path.join(process.cwd(),'users',`${logged.userid}.json`), 'utf8'));
        const author = profile.username;
        
     const postId = Date.now();
	const postLocation = path.join(process.cwd(),'main','posts',`${postId}.json`);
	const postindexLocation = path.join(process.cwd(),'main','posts','postIndex.json');
	let postData = {id: postId, author: author,authorId: profile.userid, title: postTitle, cat: categoryName, catId: catId,  body: postBody, date: postTime};
	let postIndex = {id: postId, authorId: profile.userid,author: author, title: postTitle, cat: categoryName, catId: catId, excerpts: postBody.length > 120 ? postBody.slice(0,120) + '...' : postBody, date: postTime};
	const indexFetch = JSON.parse(await fs.readFile(postindexLocation,'utf8'));
	indexFetch.push(postIndex);
	await fs.writeFile(postindexLocation,JSON.stringify(indexFetch));
	await fs.writeFile(postLocation,JSON.stringify(postData)
);
	res.writeHead(200, {'Content-Type':'application/json'});
        	 res.end(JSON.stringify({status:'Post Added Succesfully!'}));
        return;
        
        
        
        }); //req end closed
        }
        
        module.exports = post;