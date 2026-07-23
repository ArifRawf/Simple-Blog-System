const fs = require('fs').promises;
const path = require('path');
const auth = require('./authCheck');
const userProfiles = require('./getUsers'); 
module.exports = async (req,res,segment,refreshTokens) => {
	
		//authentication
	const logged = auth(req,res,refreshTokens);
	
//reading the html file
	let viewprofilehtml = await fs.readFile(path.join(process.cwd(),'public','view-profile.html'),'utf8');
	  //modifying the requested path to redirect users from /profile/ to /profile 
  if(segment[1] === 'profile') {
  	segment = segment.filter(Boolean);
  }
  
	//getting the logged in username
	let loggedProfile;
	let loggedUsername;
	if(logged) {
	 loggedProfile = JSON.parse(await fs.readFile(path.join(process.cwd(),'users',`${logged.userid}.json`),'utf8'));
	loggedUsername = loggedProfile.username;
}

//when visit /profile redirecting to their profile if logged
 if(logged && segment.length === 1 && segment[0] === 'profile') {
 	res.writeHead(302,{'Location':`/profile/${loggedUsername}`});
 res.end();
 return true;
 }

  //to render html to /profile/:username
	if((segment.length === 1 || segment.length === 2) && segment[0] === 'profile') {
		try{
			//showing change profile picture link when visiting same username
		 if(loggedProfile && loggedUsername.toLowerCase() === segment[1].toLowerCase()) { 
viewprofilehtml = viewprofilehtml.replace('{{change}}',`<span><a href='/profile-pic.html'>change</a></span>`);
} else {
viewprofilehtml = viewprofilehtml.replace('{{change}}','');
}
         res.writeHead(200,{'Content-Type':'text/html'});
 res.end(viewprofilehtml);
 return true;
 } catch(e) {
 	console.log(e);
  res.end('server error!');
  return true;
 }
 }
 
 //api for upload profile picture
 if(segment.length === 4 && segment[1] === 'api' && segment[2] === 'profile' && segment[3] === 'picture') {
 	const chunks = [];
 //auth
 	if(!logged) {
 	res.writeHead(401, {'Content-Type':'application/json'});
            res.end(JSON.stringify({error: "You Must Login To Change Profile Picture!"}));
return true;
}
        //if auth continue
        req.on("data", chunk => {
            chunks.push(chunk);
        });

        req.on("end", async () => {
        	const setId = Date.now();
            const body = Buffer.concat(chunks);
           await fs.writeFile(path.join(process.cwd(),"pictures","profile",`${setId}.jpg`),
                    body);
               loggedProfile['profilePic'] = `/pictures/profile/${setId}.jpg`;
              await fs.writeFile(path.join(process.cwd(),"users",`${loggedProfile.userid}.json`),
                    JSON.stringify(loggedProfile, null, 2));
                    res.writeHead(200, {'Content-Type':'application/json','Location':'/profile'});
            res.end(JSON.stringify({success: "Profile Picture Uploaded!"}));
            return true;
        });
        return true;
    }
    

 
 //api for view profile
 if(segment.length === 4 && segment[1] === 'api' && segment[2] === 'profile') {
const username = segment[3];
 const users = await userProfiles(); //returns array of obj of user data
		const userData = users.find(p => p.username.toLowerCase() === username.toLowerCase());
 	if(!logged) {
			res.writeHead(401, {'Content-Type':'application/json'});
			res.end(JSON.stringify({error: 'You must login or register to view profile'}));
			return true;
			}
			
		if(!userData) {
			res.writeHead(404, {'Content-Type':'application/json'});
			res.end(JSON.stringify({error: 'User Doesn’t Exist!'}));
			return true;
			}
			
		res.writeHead(200, {'Content-Type':'application/json'});
			res.end(JSON.stringify({username: userData.username,userid: userData.userid, role: userData.role, pdate: userData.pdate, profilePic: userData.profilePic}));
			return true;
			}
			}
		
		