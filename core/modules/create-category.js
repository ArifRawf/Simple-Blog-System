
module.exports = (req,res) => {
	//creating a category html
if(urlData.pathname === '/category/create') {	
	const data = await fs.readFile(path.join(process.cwd(),'public','create-category.html'),'utf8');
		res.writeHead(200,{'Content-Type':'text/html'});
		res.end(data);
	return;
	}
	//api for creating category
	