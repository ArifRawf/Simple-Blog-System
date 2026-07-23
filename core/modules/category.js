const auth = require('./authCheck');
const fs = require('fs').promises; 
const path = require('path');

module.exports = async (req,res,segment,urlData,refreshTokens) => {	

//checking if user request through /category/
if(segment.length === 3 && segment[1] === 'category' || segment.length === 2 && segment[1] === 'category') {
	if(urlData.searchParams.get('act') === 'new') {
		let data = await fs.readFile(path.join(process.cwd(),'public','cat-new-post.html'),'utf8');
		res.writeHead(200,{'Content-Type':'text/html'});
		 res.end(data);
		return true;
		}
	try{
		
		let data = await fs.readFile(path.join(process.cwd(),'public','category-posts.html'),'utf8');
	 const logged = auth(req,res,refreshTokens); //returns payload or null
		data = (logged) ? data.replace('{{addpost}}',`<a href="?act=new" class="new-post-btn">New Post</a>`) : data.replace('{{addpost}}','');
		res.writeHead(200,{'Content-Type':'text/html'});
		 res.end(data);
		return true;
	} catch(err) { res.end(err.message); return true; }
	return true;
	}

//category view api
if(segment.length === 4 && segment[1] === 'api' && segment[2] === 'category') {
 	const cat_files = await fs.readdir(path.join(process.cwd(),'main','categories'));
     const cat_names = []; //array of category names
     const page = Number(urlData.searchParams.get('page'));
     const limit = 6;
	 let start = (page - 1) * limit;
	 let end = start + limit;
	const posts = JSON.parse(await fs.readFile(path.join(process.cwd(),'main','posts','postIndex.json'), 'utf8')).sort((a, b) => b.id - a.id);
	
    for(const i of cat_files) {
    	const file = JSON.parse(await fs.readFile(path.join(process.cwd(),'main','categories',i),'utf8')); //holding the data of category files
       cat_names.push(file.catName.toLowerCase());
       }
       if(cat_names.includes(segment[3].toLowerCase())) {
       
       const cat_posts = posts.filter(r => r.cat.toLowerCase() === segment[3].toLowerCase());
       const totalposts = cat_posts.length;
	const totalpages = Math.ceil(totalposts / limit);
       const pagingposts = cat_posts.slice(start,end);
       
       res.writeHead(200,{'Content-Type':'application/json'});
        res.end(JSON.stringify({posts: pagingposts, paging: { totalpages, totalposts }}));
  return true;
       } else {
       	res.writeHead(404,{'Content-Type':'application/json'});
       res.end(JSON.stringify({error: 'Invalid Category Name or Category Not Found!'}));
       return true;
       }
       return true;
       }

    
    }