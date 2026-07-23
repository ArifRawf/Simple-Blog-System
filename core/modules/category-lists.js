const fs = require('fs').promises; 
const path = require('path');

//category implementation
module.exports = async (req,res) => {
	//parsing url to get params
const urlData = new URL(req.url,`http://${req.headers.host}`);
	if(urlData.pathname === '/category/lists') {
	const data = await fs.readFile(path.join(process.cwd(),'public','category-view.html'),'utf8');
		res.writeHead(200,{'Content-Type':'text/html'});
		res.end(data);
	return true;
	}
	
	//category listing api
 if(urlData.pathname === '/api/category/lists') { 
	try {
   let catLists = [];
   const cats = await fs.readdir(path.join(process.cwd(),'main','categories'));
    for(const file of cats) {
    const cat = JSON.parse(await fs.readFile(path.join(process.cwd(),'main','categories',file),'utf8'));
    catLists.push(cat);  
    }
    if(catLists.length === 0) {
    	res.writeHead(200,{'Content-Type':'application/json'});
	 res.end(JSON.stringify({error: 'category list is empty!'}));
	return true;
	}
    res.writeHead(200,{'Content-Type':'application/json'});
	 res.end(JSON.stringify(catLists));
	return true;
   } catch(err) {
   	console.log(err);
   res.end(err.message);
   return true;
   }
   return false;
   }
	}