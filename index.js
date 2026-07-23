const http = require('http');
const indexPosts = require('./core/modules/postsIndex');
const view_profile = require('./core/modules/view-profile');
const video = require('./core/modules/video');
const categoryView = require('./core/modules/category');
const auth = require('./core/modules/authCheck');
const logout = require('./core/modules/logout');
const category_lists = require('./core/modules/category-lists');
const postRoute = require('./core/modules/post'); //post route
const latestPostsRoute = require('./core/modules/latestPosts');
const { accessSec,refreshSec } = require('./core/modules/secretKey'); //secret key for jwt
const fs = require('fs').promises; 
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util'); //for crypto.scrypt
let refreshTokens = new Map(); //All refresh Tokens are stored
const userProfiles = require('./core/modules/getUsers'); //returns users profile in array
const jwt = require('jsonwebtoken'); //to authorize users
const storedIps = new Map(); //to store ip and time of login user
const blockedIps = new Map(); //to block ip of login user
//creating server with pure built in http module

const server = http.createServer(async function (req,res) {
//parsing url to get params
const urlData = new URL(req.url,`http://${req.headers.host}`);
const segment = urlData.pathname.split('/'); //url segments in array
//category lists
if (await category_lists(req,res)) return;
//logout users
if(logout(req,res)) return;
//category
if(await categoryView(req,res,segment,urlData,refreshTokens)) return;
//view profile
if(await view_profile(req,res,segment,refreshTokens)) return;
//latestPosts Api
if(await latestPostsRoute(req,res,segment,urlData)) return;
//video section
if(video(req,res,segment,refreshTokens)) return;
//html render to  post
 if(segment.length === 3 && segment[1] === 'post') {
 	try{
 	const data = await fs.readFile(path.join(__dirname,'public','post-view.html'),'utf8');
         res.writeHead(200,{'Content-Type':'text/html'});
 return res.end(data);
 } catch(e) {
 	return res.end(e);
 }
 }
 //api route '/api/postview/:id' for view post
 if(segment.length === 4 && segment[1] === 'api' && segment[2] === 'postview') { 	
	const check_id = /^\d+$/.test(segment[3]);
	
  let postid = (check_id) ? Number(segment[3]) : null;
  const posts = await indexPosts();
  const exist = posts.some(p => p.id === postid);
	if(!postid) {
 	res.writeHead(400,{'Content-Type':'application/json'});
 	return res.end(JSON.stringify({error: 'Invalid Post ID!'})); 
         }
    if(postid && !exist) {
    	res.writeHead(404,{'Content-Type':'application/json'});
 	return res.end(JSON.stringify({error: 'No post found with the ID!'})); 
 }
    if(postid && exist) {
    	try { 
    	const postBody = JSON.parse(await fs.readFile(path.join(__dirname,'main','posts',`${postid}.json`),'utf8')); //returns the post data via id
    const profile = JSON.parse(await fs.readFile(path.join(process.cwd(),'users',`${postBody.authorId}.json`), 'utf8'));
    postBody.profilePic = profile.profilePic;
    postBody.role = profile.role;
    res.writeHead(200,{'Content-Type':'application/json'});
 	return res.end(JSON.stringify(postBody)); 
         
         } catch(err) {
         	res.writeHead(500,{'Content-Type':'application/json'});
 	return res.end(JSON.stringify({error: err.message})); 
 }
 }

         }
         
      if (req.method === "GET" &&
    req.url.startsWith("/pictures/profile/")) {

    const filename = path.basename(req.url);
console.log(filename);
    const file = await fs.readFile(path.join(
        process.cwd(),
        "pictures",
        "profile",
        filename
    ));

    res.writeHead(200,{'Content-Type':'image/jpg'});
		res.end(file);
	return;
}
      	
 
//index page
if(urlData.pathname === '/' || urlData.pathname === '/index.html') {
	try {
		const logged = auth(req,res,refreshTokens); //returns payload or false
		let pl_userid = null;
		let userProfile = null;
	if(logged) {
	 pl_userid = logged.userid;
	 userProfile = JSON.parse(await fs.readFile(path.join(process.cwd(),'users', `${pl_userid}.json`),'utf8'));
		}
let html = await fs.readFile(path.join(__dirname,'public','index.html'),'utf8');
	const loggedMenu = `<a href="/index.html">Home</a><br><a href="/profile">Profile</a><br><a href="/post.html">New Post</a><br><a href="/logout">Logout</a><br>`;
	const guestMenu = `<a href="/login.html">Login</a><br><a href="/register.html">Register</a>`;
	
  html = (userProfile) ? html.replace('{{HEAD_SECTION_CHECK}}',loggedMenu).replace('{{user}}',userProfile.username) : html.replace('{{HEAD_SECTION_CHECK}}',guestMenu).replace('{{user}}','Guest!');
		res.writeHead(200,{'Content-Type':'text/html'});
		return res.end(html);
		
	} catch(err) {
console.log(err);
 return res.end(err.message); }
 return;
	}
	
else if(urlData.pathname === '/profile-pic.html') {
	const logged = auth(req,res,refreshTokens);
	if(!logged) {
		res.writeHead(302,{'Location':'/login.html'});
		res.end();
		return;
		}
	data = await fs.readFile(path.join(__dirname,'public','upload-profile-pic.html'),'utf8');
		res.writeHead(200,{'Content-Type':'text/html'});
		res.end(data);
	return;
	}
	
	if(urlData.pathname === '/upload-video.html') {
	const logged = auth(req,res,refreshTokens);
	if(!logged) {
		res.writeHead(302,{'Location':'/login.html'});
		res.end();
		return;
		}
	data = await fs.readFile(path.join(__dirname,'public','video-uploader.html'),'utf8');
		res.writeHead(200,{'Content-Type':'text/html'});
		res.end(data);
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
	


//create post Route
 else if(urlData.pathname === '/api/post' && req.method === 'POST') {
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
   if(pdata.username.toLowerCase() === username.toLowerCase()) {
   	res.writeHead(400, { 'Content-Type': 'application/json' });
   return res.end(JSON.stringify({error: 'Username already has taken!' }));
   }
   }
   //storing username password to file system database json, each user id is id.json and inside username and crypto password 
await fs.writeFile(
      userfile, 
      JSON.stringify({userid: id,username: username,role: role, pdate: pdate, salt: passSalt, hash: passHash}));
res.writeHead(200, {'Content-Type':'application/json'});
		return res.end(JSON.stringify({success: 'Registration success, please login!'}));
			} catch(err) {
  res.writeHead(500, {'Content-Type':'application/json'});
  return res.end(JSON.stringify({error: err.message }));
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
		const payload = {userid: puData.userid,role: puData.role};
		//creating a token for this user
		const accessToken = jwt.sign(
   payload,
   accessSec,
   {expiresIn: '1m'}
  );
  const refreshToken = jwt.sign(
   payload,
   refreshSec,
   {expiresIn: '30m'}
  );
  
 //attaching the token to the user browser header
       res.setHeader('Set-Cookie',[`accessToken=${accessToken}; HttpOnly; Path=/; SameSite=Strict`,`refreshToken=${refreshToken}; HttpOnly; Path=/; SameSite=Strict`]);
       refreshTokens.set(refreshToken,refreshToken);
		res.writeHead(200, {'Content-Type':'application/json'});
		
		res.end(JSON.stringify({success: 'Login successful!'}));
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
		