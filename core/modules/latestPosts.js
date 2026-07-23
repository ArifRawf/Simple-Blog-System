const path = require('path');
const fs = require('fs').promises;
const postIndexloc = path.join(process.cwd(),'main','posts','postIndex.json');

module.exports = async (req,res,segment, urlData) => {
	//modifying api/latestPosts to accesible from api/latesfPosts/ 
	if(segment[1] === 'api' && segment[2] === 'latestposts') {
		segment = segment.filter(Boolean); //removing empty element of string from segment
		}
		
	 if(segment.length === 2 && segment[0] === 'api' && segment[1] === 'latestposts') {
	let page = Number(urlData.searchParams.get('page')); //get page id from url
	try {
	const limit = 6;
	 let start = (page - 1) * limit;
	 let end = start + limit;
	const postIndexFile = JSON.parse(await fs.readFile(postIndexloc,'utf8')).sort((a, b) => b.id - a.id);
	const totalposts = postIndexFile.length;
	const totalpages = Math.ceil(totalposts / limit);
	const LatestPosts = postIndexFile.slice(start, end);
	if(LatestPosts.length === 0) {
	res.writeHead(404,{'Content-Type': 'application/json'});
	res.end(JSON.stringify({error: 'No Posts!'}));
	return true;
	}
	res.writeHead(200,{'Content-Type': 'application/json'});
	res.end(JSON.stringify({posts: LatestPosts, paging: { totalpages, totalposts }}));
	return true;
	}
	catch(err) {
		console.log(err);
		res.writeHead(500,{'Content-Type': 'application/json'});
	res.end(JSON.stringify({error: 'Server Error!'}));
	return true;
		}
	}
	}
	
	
	