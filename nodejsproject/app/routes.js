var User            = require('../app/models/user');
var rooms =[];
var roomcount = 0;
var loopsfn =[];
module.exports = function(app, passport,io,info,ns,clients) {

    // =====================================
    // Trang ch? (c� c�c url login) ========
    // =====================================
    app.use(function (req, res, next) {
      console.log(req.body);
      
    next()
    });
     app.get('/mapping2',isLoggedIn,function(req,res){
       var index = findIndexUser(info,req.user.local.email);
       
       if(index!=-1){
        let infoUser;
        for (let i = 0;i<info.length;i++)
        {
          if(info[i].user == req.user.local.email )
            infoUser = info[i];
        }
        if(infoUser ==null )
          res.redirect('/listboard');
        else
        {
        if(infoUser.where =="/mapping2")
          res.render('mapping2.ejs',{ useraut:req.user.local.email,indexaut:index});  
        else if(infoUser.where =="/rooms")
          res.redirect(infoUser.where);
        else
          res.redirect('/listboard');
        }
       }
       else
         res.redirect('/listboard');
     });
     
     io.of('/mapping2').on('connect', function(socket){
       
       console.log('someone connected mapping2 from: ' + socket.id);
       var temp1;
       
       var room=null;
       var countdown;
      socket.on('join room',function(data)
      {
        room = getUserRoom(info,data);
        if(room==null)
        {
          User.findOne({ 'local.email' :  data }, function(err, user) {
            var enemyId = user.enemyId;
            User.findOne({ '_id' :  enemyId }, function(err, usere) {
                room=getUserRoom(info,usere.local.email);
                setUserRoom(info,data,room);
                socket.join(room)
                console.log(room)
            })
          })
        }
        else
        {
        socket.join(room)
        console.log(room)
        }
        for(var i = 0; i<rooms.length;i++)
        {
          if(room == rooms[i].room)
            countdown = rooms[i];
        }
        
      });
       socket.on('get user',function(temp){
         let over;
         var index = findIndexUser(info,temp);
         if(index==-1)
           return 0;
         User.findOne({ 'local.email' :  temp }, function(err, user) {
           over = user.isOver;
           var stateUser = findUserState(info,user.local.email)
           var enemyId = user.enemyId;
            var map_ta = new Array(8);
            for (var i = 0; i < map_ta.length; i++) {
              map_ta[i] = new Array(8);
            }
            if(user.locateboat!=null)
              for (var i = 0;i<64;i++)
              {
                if(user.locateboat[i]!=null)
                {
                  if(user.locateboat[i].isBoat)
                    map_ta[user.locateboat[i].x][user.locateboat[i].y] = "A";
                  if(user.locateboat[i].isShoot)
                    map_ta[user.locateboat[i].x][user.locateboat[i].y] = "S";
                  if(user.locateboat[i].isBreak)
                    map_ta[user.locateboat[i].x][user.locateboat[i].y] = "B";
                }
              }
            
            var map_dich = new Array(8);
            for (var i = 0; i < map_dich.length; i++) {
              map_dich[i] = new Array(8);
            }
            User.findOne({ '_id' :  enemyId }, function(err, usere) {
              for (var i = 0;i<64;i++)
              {
                if(usere.locateboat[i]!=null)
                {
                  if(usere.locateboat[i].isShoot)
                    map_dich[usere.locateboat[i].x][usere.locateboat[i].y] = "S";
                  if(usere.locateboat[i].isBreak)
                    map_dich[usere.locateboat[i].x][usere.locateboat[i].y] = "B";
                }
              }
             var stateEnemy = findUserState(info,usere.local.email)
             if(countdown!= null)
                socket.emit('update tadich',map_ta,map_dich,info,index,user.isTurn,{countdown: countdown.countdown,User: stateUser, Enemy: stateEnemy},over);
             });
             
         });
         temp1 = temp;
       });
       socket.on("surrender",function(user){
        User.findOneAndUpdate({'local.email': user},
        {'$set':{'isOver':true}},
        function(err,maganer){
        });
        socket.in(room).emit('xuly surrender',user);
        let infoUser;
        for (let temp of info)
        {
          if(temp.user == user )
            infoUser = temp;
        }
        infoUser.where = "/rooms";
        let numplayer = 0;
        for (let index = 0; index < info.length; index++) {
          if(info[index].room == room)
            numplayer++;
          if(user == info[index].user)
          {
            info[index].state=false;
            info[index].room=null;
          }
        }
        if(numplayer==1)
        {
          for(let i = 0; i<rooms.length;i++)
          {
            if(rooms[i].room = room)
            {
              clearInterval(loopsfn[i]); 
              loopsfn[i] = null;
              loopsfn.splice(i,1);
              rooms[i]=null;
              rooms.splice(i,1);
            }
          }
        }
       })
       socket.on("reset countdown",function(){
        countdown.countdown=countdown.countdown+1;
       })
       socket.on('update state',function(useremail){
         changeUserState(info,useremail)
         User.findOne({ 'local.email' :  useremail }, function(err, user) {
             var enemyId = user.enemyId;
             User.findOne({ '_id' :  enemyId }, function(err, usere) {
              var stateUser = findUserState(info,user.local.email)
              var stateEnemy = findUserState(info,usere.local.email)
               if(stateUser == true && stateEnemy == true)
               {
                
                if(countdown.countdown>1 &&countdown.countdown<=180){

                
                 
                  countdown.countdown=countdown.countdown;
                }
                else
                {
                   
                  countdown.countdown=179;
                }
              } 
               else{
                //socket.in(room).emit('set time',-1);
                countdown.countdown=1800;
                console.log(socket.rooms);
               }
             })
         })
       })
      socket.on("swicth board",function(user){
        let infoUser;
        for (let temp of info)
        {
          if(temp.user == user )
            infoUser = temp;
        }
        infoUser.where = null;
      })
      socket.on("out room",function(data){
        User.findOneAndUpdate({'local.email': data},
      {'$set':{'isOver':true}},
      function(err,maganer){
      });
        let infoUser;
        for (let temp of info)
        {
          if(temp.user == data )
            infoUser = temp;
        }
        infoUser.where = "/rooms";
        let numplayer = 0;
        for (let index = 0; index < info.length; index++) {
          if(info[index].room == room)
            numplayer++;
          if(data == info[index].user)
          {
            info[index].state=false;
            info[index].room=null;
          }
        }
        if(numplayer==1)
        {
          for(let i = 0; i<rooms.length;i++)
          {
            if(rooms[i].room = room)
            {
              clearInterval(loopsfn[i]); 
              loopsfn[i] = null;
              loopsfn.splice(i,1);
              rooms[i]=null;
              rooms.splice(i,1);
            }
          }
        }
      })
      socket.on("game over",function(data){
        User.findOneAndUpdate({'local.email': data},
      {'$set':{'isOver':true}},
      function(err,maganer){
      });

        let infoUser;
        for (let temp of info)
        {
          if(temp.user == data )
            infoUser = temp;
        }
        infoUser.where = "/rooms";
        
        for(let i = 0; i<rooms.length;i++)
        {
          if(rooms[i].room = room)
          {
            clearInterval(loopsfn[i]);
            loopsfn[i] = null;
            loopsfn.splice(i,1);
            rooms[i]=null;
            rooms.splice(i,1);
          }
        }
        for (let index = 0; index < info.length; index++) {
          if(data == info[index].user)
          {
            info[index].state=false;
            info[index].room=null;
          }
        }
      })
       
       socket.on('user fire',function(index){
           info[index].isFire=false;
           let check = true;
           let over;
           User.findOne({ 'local.email' :  temp1 }, function(err, user) {
             if(user.isTurn)
             {
              over = user.isOver
             var enemyId = user.enemyId;
             User.findOne({ '_id' :  enemyId }, function(err, usere) {
              for (let i = 0; i < usere.locateboat.length; i++) {
                if(usere.locateboat[i].x==info[index].locatex&&usere.locateboat[i].y==info[index].locatey)
                  if(usere.locateboat[i].isShoot)
                    {
                      check = false;
                      
                    }
                    
              }
              if(check)
                    {
                     User.findOneAndUpdate({'$and':[
                                          {'_id': enemyId},{'locateboat': {'$elemMatch':
                                          {'x':info[index].locatex,'y':info[index].locatey}}
                    }]},
                                      {'$set':{'locateboat.$.isShoot':true}},
                                      function(err,maganer){
                                      });
                    User.findOneAndUpdate({'$and':[
                                          {'_id': enemyId},{'locateboat': {'$elemMatch':
                                          {'x':info[index].locatex,'y':info[index].locatey,'isBoat':true}}
                    }]},
                                      {'$set':{'locateboat.$.isBreak':true}},
                                      function(err,maganer){
                                      var map_ta = new Array(8);
                                      for (var i = 0; i < map_ta.length; i++) {
                                        map_ta[i] = new Array(8);
                                      }
                                      for (var i = 0;i<64;i++)
                                      {
                                        if(user.locateboat[i].isBoat)
                                          map_ta[user.locateboat[i].x][user.locateboat[i].y] = "A";
                                        if(user.locateboat[i].isShoot)
                                          map_ta[user.locateboat[i].x][user.locateboat[i].y] = "S";
                                        if(user.locateboat[i].isBreak)
                                          map_ta[user.locateboat[i].x][user.locateboat[i].y] = "B";
                                      }
                                      
                                      var map_dich = new Array(8);
                                      for (var i = 0; i < map_dich.length; i++) {
                                        map_dich[i] = new Array(8);
                                      }
                                      
                                      User.findOne({ '_id' :  enemyId }, function(err, usere) {
                                        for (var i = 0;i<64;i++)
                                        {
                                        
                                          if(usere.locateboat[i].isShoot)
                                            map_dich[usere.locateboat[i].x][usere.locateboat[i].y] = "S";
                                          if(usere.locateboat[i].isBreak)
                                          {
                                            map_dich[usere.locateboat[i].x][usere.locateboat[i].y] = "B";
                                            
                                          }
                                          
                                        }
                                        
                                        
                                        if(!maganer)
                                        {
                    
                                          map_dich[info[index].locatex][info[index].locatey]="S";
                                        }
                                        else
                                        {
                                          map_dich[info[index].locatex][info[index].locatey]="B";
                                          for (let i = 0;i<info.length;i++)
                                          {
                                            if(info[i].user == temp1 )
                                              {
                                                clients[i].write("q");                                    
                                              }
                                            if(info[i].user == maganer.local.email )
                                            {
                                              clients[i].write("r");                                    
                                            }
                                          }
                                        }
                                        var stateUser = findUserState(info,user.local.email)
                                        var stateEnemy = findUserState(info,usere.local.email)
                                        countdown.countdown=180;
                                       socket.emit('update tadich',map_ta,map_dich,info,index,false,{countdown: countdown.countdown,User: stateUser, Enemy: stateEnemy},over);                     
                                      });
                                        
                                      });
                   
                    User.findByIdAndUpdate(enemyId,
                            {"$set":{ "isTurn": true}},
                            function (err, managerparent) {
                                if (err) throw err;
                                       });
                    User.findByIdAndUpdate(user._id,
                            {"$set":{ "isTurn": false}},
                            function (err, managerparent) {
                                if (err) throw err;
                                       });
                     
                    }  
            })
                               
              }          
           });
         });
        
       socket.on('disconnect', function(err){
         
         console.log('someone disconnect mapping2 from: ' + socket.id);
       }); 
     });
    app.get('/rooms',isLoggedIn,function(req,res){
      let user = req.user
      let infoUser =null;
      for (let i = 0;i<info.length;i++)
      {
        if(info[i].user == req.user.local.email )
          infoUser = info[i];
      }
      if(infoUser ==null){
        res.redirect("/listboard")
      }
      else
      {
        if(infoUser.where=="/rooms"){
          infoUser.where = "/rooms"
          res.render('rooms.ejs',{ useraut:req.user.local.email});
        }
        else if(infoUser.where==null)
        {
          res.redirect("/listboard")
        }
        else
        {
          res.redirect(infoUser.where)
        }
      }
    })
    app.get('/listboard',isLoggedIn,function(req,res){
      
      let user = req.user
      let infoUser =null;
      for (let i = 0;i<info.length;i++)
      {
        if(info[i].user == req.user.local.email )
          infoUser = info[i];
      }
      if(infoUser !=null && infoUser.where!=null){
        res.redirect(infoUser.where);
      }
      setImmediate(function(){
        res.render('listboard.ejs',{ useraut:req.user.local.email});
      });
    
        
      
    });
    io.of('/listboard').on('connect', function(socket){
      console.log('someone connected listboard from: ' + socket.id);
      socket.emit('update board', info);
      var tmp = '';
      socket.on('send user',function(data){
        tmp = data;
      });
      socket.on('select board',function(i){
          console.log(socket.id + ': chon board '+(i+1));
          info[i].status = "Connected";
          info[i].user=tmp;
          info[i].locatex=0;
          info[i].locatey=0;
          info[i].isFire=false;
          info[i].where="/rooms";
          
          io.of('/listboard').emit('update board', info);

        });
      socket.on('disconnect board',function(i){
        console.log(socket.id + ': bo board '+(i+1));
        info[i].status = "waitting";
        info[i].user='';
        info[i].locatex=0;
        info[i].locatey=0;
        info[i].isFire=false;
        info[i].where=null;
        io.of('/listboard').emit('update board', info);
      });

      socket.on("backlistboard",function(username){
        let infoUser;
        for (let temp of info)
        {
          if(temp.user == username )
            infoUser = temp;
        }
        if(infoUser!=null)
          infoUser.where = null;
      })
      socket.on("connect rooms",function(){
        socket.emit("update rooms",rooms,info);
      })

      socket.on("create room",function(username){
        var name = "room "+roomcount;
        var index = rooms.length;
        rooms.push({room: name,countdown:18000});
        var room = rooms[index];
        loopsfn[index] = setInterval(function(){
          room.countdown--;
        }, 1000);
        setUserRoom(info,username,"room "+roomcount)
        roomcount++;
        io.of("/listboard").emit("update rooms",rooms,info);
        
        
        let infoUser;
        for (let temp of info)
        {
          if(temp.user == username )
            infoUser = temp;
        }
        infoUser.where = "/mapping2"
      })
      socket.on("join room",function(username,roomname){
        let infoUser;
        for (let temp of info)
        {
          if(temp.user == username )
            infoUser = temp;
        }
        infoUser.where = "/mapping2"
        
        setUserRoom(info,username,roomname)
        let Hostname;
        for(let i = 0;i<info.length;i++)
        {
          if(info[i].room == roomname&&info[i].user!=username)
            Hostname = info[i].user;
        }

        User.findOne({ 'local.email' :  Hostname }, function(err, host){
          let HostId = host._id;
          
          User.findOne({ 'local.email' :  username }, function(err, user){
            if(host.isOver||user.isOver||host._id!=user.enemyId||user._id!=host.enemyId)
            {
              
              refreshBoard(Hostname,user._id,true);
              
              setTimeout(function(){ refreshBoard(username,host._id,false); }, 500);
            }
          });
        });
      })
    });
    app.get('/', function(req, res) {
        res.render('index.ejs'); // 
    });

    // =====================================
    // �ang n?p ===============================
    // =====================================
    // hi?n th? form dang nh?p
    app.get('/login', function(req, res) {
        res.render('login.ejs', { message: req.flash('loginMessage') }); 
    });
    
   app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/listboard',
        failureRedirect : '/login', 
        failureFlash : true
        
    }));

    // =====================================
    // �ang k� ==============================
    // =====================================
    // hi?n th? form dang k�
    app.get('/signup', function(req, res) {
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    // X? l� form dang k� ? d�y
   app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile', // �i?u hu?ng t?i trang hi?n th? profile
        failureRedirect : '/signup', // Tr? l?i trang dang k� n?u l?i
        failureFlash : true 
        
    }));

    // =====================================
    // Th�ng tin user dang k� =====================
    // =====================================
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user // truy?n d?i tu?ng user cho profile.ejs d? hi?n th? l�n view
        });
    });

    // =====================================
    // �ang xu?t ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
    
};

// H�m du?c s? d?ng d? ki?m tra d� login hay chua
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/');
}
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
function makeNewLocateBoat(x1,y1,boatis,breakis,shootis)
{
  return {
    x: x1,
    y: y1,
    isBoat           :boatis,
    isBreak          :breakis,
    isShoot          :shootis
  };
}

function findIndexUser(info,user)
{
  for(var i = 0;i < info.length;i++){
    if(info[i].user == user)
      return i;
  }
  return -1;
}
function findUserState(info,useremail)
{
  for(var i = 0;i < info.length;i++){
    if(info[i].user == useremail)
      return info[i].state;
  }
  return false;
}
function changeUserState(info,useremail)
{
  for(var i = 0;i < info.length;i++){
    if(info[i].user == useremail)
    {
      info[i].state=!info[i].state;
      return 1;
    }
  }
  return null;
}
function setUserRoom(info,useremail,room)
{
  for(var i = 0;i < info.length;i++){
    if(info[i].user == useremail)
    {
      info[i].room=room;
      return 1;
    }
  }
  return null;
}
function getUserRoom(info,useremail)
{
  for(var i = 0;i < info.length;i++){
    if(info[i].user == useremail)
    {
      return info[i].room;
    }
  }
  return null;
}

function refreshBoard(useremail,enemyId,turn)
{
  User.findOne({ 'local.email' :  useremail }, function(err, user) {
    var ID = user._id
    User.findByIdAndUpdate(ID,
      {"$set":{"locateboat":[]}},
          function(err,manager){
    });
    for(var i = 0;i<8;i++){
    var jcheck = getRandomInt(8);
      for(var j = 0;j<8;j++){
        if(jcheck==j){
          var NewLocateBoat = makeNewLocateBoat(i,j,true,false,false);
          }
        else
        {
          var NewLocateBoat =  makeNewLocateBoat(i,j,false,false,false);
        }
        User.findByIdAndUpdate(ID,
          {"$push":{ "locateboat": NewLocateBoat}},{ "new": true, "upsert": true},
          function (err, managerparent) {
              if (err) throw err;
                    });
      }
    }
    User.findByIdAndUpdate(ID,
          {"$set":{ "isTurn": turn,"enemyId":enemyId},"isOver":false},
          function (err, managerparent) {
              if (err) throw err;
                    });
  });
}