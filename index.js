const http = require('http');
const profileRoute = require('./core/routes/profile'); //profile route
const postRoute = require('./core/routes/post'); //post route
const latestPostsRoute = require('./core/routes/latestPosts');
const { accessSec,refreshSec } = require('./core/modules/secretKey'); //secret key for jwt
const fs = require('fs').promises; 
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util'); //for crypto.scrypt
let refreshTokens = {};
const usersList = require('./core/modules/getUsers'); //an array of users id.json
const jwt = require('jsonwebtoken'); //to authorize users
const storedIps = new Map(); //to store ip and time of login user
const blockedIps = new Map(); //to block ip of login user
//creating server with pure built in http module
let postidstore;

const server = http.createServer(async function (req,res) {
//parsing url to get params
const urlData = new URL(req.url,`http://${req.headers.host}`);
const indexPosts = JSON.parse(await fs.readFile(path.join(__dirname,'main','posts','postIndex.json'),'utf8'));
let post_view_html = await fs.readFile(path.join(__dirname,'public','post-view.html'),'utf8');
 const postviewCheck = urlData.pathname.split('/');
 let postid;
 let postid_regex;
 let postid_api;
 let postid_regex_api;
 
 //postviewCheck for html render
 if(postviewCheck.length === 3 && postviewCheck[1] === 'post') {
  postid = postviewCheck[2];
  postid_regex = /^\d+$/.test(postid);
 } 

 //postviewcheck for api
 if(postviewCheck.length === 4 && postviewCheck[1] === 'api' && postviewCheck[2] === 'postview') {
 	postid_api = postviewCheck[3];
     postid_regex_api = /^\d+$/.test(postid_api);
     console.log(postid_api);
     }
//html render
 if(urlData.pathname === `/post/${postid}` || urlData.pathname === `/post` || urlData.pathname === `/post/`) {
 	if(!postid_regex) {
 	res.writeHead(404,{'Content-Type':'application/json'});
 	return res.end(JSON.stringify({error: 'please enter a valid post url'})); 
         }
         res.writeHead(200,{'Content-Type':'text/html'});
 return res.end(post_view_html);
 }
 
 //postview api
 if(urlData.pathname === `/api/postview/${postid_api}`) {
 	try {
 	const postbodyapi = JSON.parse(await fs.readFile(path.join(process.cwd(),'main','posts',`${postid_api}.json`),'utf8'));
 res.writeHead(200,{'Content-Type':'application/json'});
 return res.end(JSON.stringify(postbodyapi));
}catch(err) {
 	if(err.code === 'ENOENT') {
 	res.writeHead(404,{'Content-Type':'application/json'});
 	return res.end(JSON.stringify({error: 'Invalid post url or post deleted!'}));
 }
 }
 }
 
 
 

//<--All Served Pages-->
//index page
if(urlData.pathname === '/' || urlData.pathname === '/index.html') {
	try{
   const data = await fs.readFile(path.join(__dirname,'public','index.html'),'utf8');
		res.writeHead(200,{'Content-Type':'text/html'});
		res.end(data);
	} catch(err) { return res.end(err.message); }
	return;
	}

//profile page with api
else if(urlData.pathname === '/profile.html') {
try {
await profileRoute(req,res,refreshTokens,urlData);
 } catch(err) { return res.end(err.message); }
	return;
	}
	
	
			
//post page
else if(urlData.pathname === '/post.html') {
	data = await fs.readFile(path.join(__dirname,'public','post.html'),'utf8');
		res.writeHead(200,{'Content-Type':'text/html'});
		res.end(data);
	return;
	}

//login page
	else if(urlData.pathname === '/login.html') {
	data = await fs.readFile(path.join(__dirname,'public','login.html'),'utf8');
		res.writeHead(200,{'Content-Type':'text/html'});
		res.end(data);
	return;
	}

//registration page
if (urlData.pathname === '/register.html') {
	const data = await fs.readFile(path.join(__dirname,'public','register.html'),'utf8');
		res.writeHead(200,{'Content-Type':'text/html'});
		res.end(data);
	return;
	}
	
//style.css to polish html
else if(urlData.pathname === '/style.css') {
	const data = await fs.readFile(path.join(__dirname,'public','style.css'),'utf8');
		res.writeHead(200,{'Content-Type':'text/css'});
		res.end(data);
	return;
	}
	
//--->category Implementation
//category creating route
if(urlData.pathname === '/category/create') {
	const data = await fs.readFile(path.join(process.cwd(),'public','create-category.html'),'utf8');
		res.writeHead(200,{'Content-Type':'text/html'});
		res.end(data);
	return;
	}
	//api for creating category, each category has id,json file
if(urlData.pathname === '/api/category/create' && req.method === 'POST') {
	let body = '';
	req.on('data', (c) => { 
		body += c.toString();
		});
	req.on('end',async () => {
		let cat;
	try {
	 cat = JSON.parse(body);
	} catch(err) {
		if(err) {
			console.log(err);
			return res.end(err.message);
			}
			}
	if(!cat.cat_name) {
		res.writeHead(400,{'Content-Type':'application/json'});
	return res.end(JSON.stringify({status: 'Category name shouldnt empty!'}));
	}
	const cat_name = cat.cat_name;
	const cat_id = cat.cat_id;
	try {
	await fs.writeFile(path.join(process.cwd(),'main','categories',`${cat_id}.json`), 
	JSON.stringify({catId: cat_id, catName: cat_name})
	);
	res.writeHead(200,{'Content-Type':'application/json'});
	return res.end(JSON.stringify({status: 'category Created Successfully'}));
	} catch(err) {
		if(err) {
			res.writeHead(500,{'Content-Type':'application/json'});
	return res.end(JSON.stringify({error: err.message}));
			}
			}
		});
		return;
	}
//api for listing category
if(urlData.pathname === '/api/category/lists') { 
	try {
   const cats = await fs.readdir(path.join(process.cwd(),'main','categories'));
   let catLists = [];
    for(const file of cats) {
    const cat = JSON.parse(await fs.readFile(path.join(process.cwd(),'main','categories',file),'utf8'));
    catLists.push(cat);
    console.log(cat + ' pushed');
    }
    if(catLists.length === 0) {
    	res.writeHead(200,{'Content-Type':'application/json'});
	return res.end(JSON.stringify({error: 'category list is empty!'}));
	}
    res.writeHead(200,{'Content-Type':'application/json'});
	return res.end(JSON.stringify(catLists));
   } catch(err) {
   	console.log(err);
  return res.end(err);
   }
   return;
   }



//<--All Api Routes->>

//latest post api
else if(urlData.pathname === '/api/latestPosts') {
await latestPostsRoute(req,res);
	return;
	}

//post Route
 else if(req.url === '/api/post' && req.method === 'POST') {
 	 postRoute(req,res,refreshTokens);
 return;
	}
 	
  //register route
else if(req.url === '/register' && req.method === 'POST') {
	let body = '';
	req.on('data', (c) => {
	 body += c.toString();
	});
	//when all data arrives
	req.on('end', async ()=> {
		try {
   let data = JSON.parse(body);
	const id = data.userid;
	const username = data.username;
	const password = data.password;
	const role = data.role;
	const pdate = data.pdate;
	const userfile = path.join(__dirname,'users',`${id}.json`);
	//regex for validation
	const usernameRegex = /^(?=.*[a-zA-Z])[a-zA-Z0-9]{5,16}$/;
	//checking for blank username and password
	if(!username || !password) {
		res.writeHead(400, {'Content-Type':'application/json'});
		res.end(JSON.stringify({error: 'Username And Password should not be blanked'}));
		return;
		}
	//checking the username if valid or not with regex
	if(!usernameRegex.test(username)) {
		res.writeHead(400, {'Content-Type':'application/json'});
		res.end(JSON.stringify({error: 'Invalid Username, Username should be letters and numbers,min 5 chars and max 16 chars!'}));
		return;
		} 
	//Encrypting the password with crypto
	let passSalt;
	let dKey;
	let passHash;
	const scryptAsync = promisify(crypto.scrypt);
	passSalt = crypto.randomBytes(16).toString('hex');
	dKey = await scryptAsync(password,passSalt,64);
	passHash = dKey.toString('hex');
	const files = await fs.readdir(path.join(__dirname,'users'));
	//checking if user exist
   for(const file of files) {
   const f = await fs.readFile(path.join(__dirname,'users',file),'utf8');
   const pdata = JSON.parse(f);
   if(pdata.username === username) {
   	res.writeHead(400, { 'Content-Type': 'application/json' });
   return res.end(JSON.stringify({error: 'Username already has taken!' }));
   }
   }
   //storing username password to file system database json, each user id is id.json and inside username and crypto password 
await fs.writeFile(
      userfile, 
      JSON.stringify({userid: id, username: username,role: role, pdate: pdate, salt: passSalt, hash: passHash}));
res.writeHead(200, {'Content-Type':'application/json'});
		return res.end(JSON.stringify({success: 'Registration success, please login!'}));
			} catch(err) {
  res.writeHead(500, {'Content-Type':'application/json'});
  return res.end(JSON.stringify({ error: err.message }));
}
	});
	return;
	} 

	
	
//login system
else if(req.url === '/api/login' && req.method === 'POST') {
	//making login attempts check for security
	const ip = req.socket.remoteAddress 
	const timeNow = Date.now();
	const loginAttempts = storedIps.get(ip);
	const blockedTime = blockedIps.get(ip);
	//checking if blocked ip time passed given time
	if(blockedTime > Date.now()) {
		res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({error: 'Login Blocked For 30 seconds! Please Try Again Later!'}));
    return;
    } 
   else if(blockedTime < Date.now()) {
   	blockedIps.delete(ip);
   console.log(blockedIps + 'deleted');
    }
 if(!loginAttempts) {
 	storedIps.set(ip,{
 	count: 1,
     time: timeNow
     }
    );
     }	
 //check if login attempt time become 1 minute then reset
else if(timeNow - loginAttempts.time > 60000) {
	storedIps.set(ip,{
 	count: 1,
     time: timeNow
     }
    );
    } 
    //now main attempts, if usrr attempt more than 5 time under 1 minute then
    else {
    storedIps.set(ip,{
    	count: loginAttempts.count +1,
       time: timeNow
}
);
    if(loginAttempts.count > 5) {
    	blockedIps.set(ip,Date.now() + 30000);
    console.log(blockedIps);
    	res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({error: 'too much login attempts, please try after 1 minute'}));
    return;
    }
     }
	
	let body = '';
	req.on('data', (c) => {
	 body += c.toString();
	});
	req.on('end', async ()=> {
		let data;
	try{
   data = JSON.parse(body);
   } catch(err) {
   	res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Invalid JSON' }));
    console.log(err);
    }
    //check if username and password is empty
    
   const username = data.username;
   const password = data.password;
   if(!username || !password) {
    	res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Please Enter Username And Password!' }));
    }
   //comaparing username and password from stored json files. 
   try {
   const files = await fs.readdir(path.join(__dirname,'users')); //now array of files
   	const usernameRegex = /^(?=.*[a-zA-Z])[a-zA-Z0-9]{5,16}$/;
   if(!usernameRegex.test(username)) {
   	res.writeHead(400, {'Content-Type':'application/json'});
		res.end(JSON.stringify({error: 'Invalid Username, Username should be letters and numbers,min 5 chars and max 16 chars!'}));
		return;
		} 
   if(files.length === 0) {
   	res.writeHead(200, {'Content-Type':'application/json'});
		res.end(JSON.stringify({success: 'Username is available,be the first to register!'}));
		return;
		}
		//converting to promise based function
const scryptAsync = promisify(crypto.scrypt);
   for(const file of files) {
   const userData = await fs.readFile(path.join(__dirname,'users',file),'utf8');
   //parsing the string into json
   const puData = JSON.parse(userData);
   //now creating a new hash from puData salt via entered password
	const dKey = await scryptAsync(password,puData.salt,64);
	const bufhash = Buffer.from(puData.hash,'hex');
	const check = crypto.timingSafeEqual(bufhash,dKey);
	if(username === puData.username && check) {
		const payload = {username: puData.username, userid: puData.userid,role: puData.role, pdate: puData.pdate};
		//creating a token for this user
		const accessToken = jwt.sign(
   payload,
   accessSec,
   {expiresIn: '30s'}
  );
  const refreshToken = jwt.sign(
   payload,
   refreshSec,
   {expiresIn: '10m'}
  );
  
 //attaching the token to the user browser header
       res.setHeader('Set-Cookie',[`accessToken=${accessToken}; HttpOnly; Path=/; SameSite=Strict`,`refreshToken=${refreshToken}; HttpOnly; Path=/; SameSite=Strict`]);
       refreshTokens = {refreshToken};
       
		res.writeHead(200, {'Content-Type':'application/json'});
		res.end(JSON.stringify({logged: true,success: 'Login successful!'}));
		console.log(refreshTokens);
		return;
		}
	
		} //forloop closed
		res.writeHead(400, {'Content-Type':'application/json'});
		return res.end(JSON.stringify({error: 'Invalid Credentials, Please input valid usename and password!'}));
		} catch(err) {
	console.log(err);
	res.writeHead(500, {'Content-Type':'application/json'});
		res.end(JSON.stringify({error: err.message}));
		return;
	} 
	}); //req.on 'end' closed
	} //if closed

	
//if request come from unknown route
 else  { res.end('404 requested page not found'); }
		}); //server brace closed
		
		
		
		
		//2nd server for testing
		const testServer = http.createServer(async function (req,res) {
const urlObj = new URL(req.url,`http://${req.headers.host}`);
if(urlObj.pathname === '/alluser') {
	res.writeHead(200, {
  'Content-Type': 'application/json'
});
	res.end(JSON.stringify(await usersList));
	return;
	}
else if(urlObj.pathname === '/') {
	const cookie = req.headers.cookie || '';
const cookies = 
  cookie.split(';').map(c => {
    const [key, value] = c.trim().split('=');
    return [key, value];
  });
console.log(Object.fromEntries(cookies));
} else {
	res.end('page not found');
	}
	});
	
	//plugged the test server after main server
	testServer.listen(4000,()=>{console.log('server running on port 4000')});	


//main server		
		server.listen(3000, () => {
     return console.log('server listening on port 3000');
     }
);
		