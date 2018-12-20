

var temp = {};
module.exports = function(ns,io,info,clients) {

  
  
  ns.on('connection', function connection(socket) {
  socket.name = socket.remoteAddress + ":" + socket.remotePort 
  clients.push(socket);
  temp.name=socket.name;
  temp.status = "waitting";
  temp.user="";
  temp.locatex=0;
  temp.locatey=0;
  temp.isFire = false;
  temp.state = false;
  temp.room =null;
  temp.where = null;
  
  info.push(temp);

  temp ={};
  socket.write("Welcome " + socket.name + "\n");
  io.of('/listboard').emit('update board', info);
  socket.setEncoding('utf8');
  console.log("Co nguoi ket noi " );
  socket.on('data',function(data){
    console.log(socket.name,data);
    for(var i = 0;i<info.length;i++){
    
      if(socket.name == info[i].name){
               if(data == 'w')
                 info[i].locatey--;
               if(data == 'a')
                 info[i].locatex--;
               if(data == 's')
                 info[i].locatey++;
               if(data == 'd')
                 info[i].locatex++;
               if(info[i].locatex ==8)
                 info[i].locatex = 0;
               if(info[i].locatex ==-1)
                 info[i].locatex = 7;
               if(info[i].locatey ==8)
                 info[i].locatey = 0;
               if(info[i].locatey ==-1)
                 info[i].locatey = 7;
               if(data == 'f')
                 info[i].isFire =true;
      }
    }
     io.of('/mapping2').emit('update map',info);
  });
  socket.setTimeout(10000);
  socket.on('timeout', () => {
    console.log('socket timeout');
    let vitri;
    for(var i = 0;i < clients.length;i++){
      
      if(clients[i]==socket)
        clients.splice(i,1);
      
      if(info[i].name == socket.name)
        info.splice(i,1);
        vitri = i;
    }
    
    io.of('/mapping2').emit('disconnected controller',vitri);
    io.of('/listboard').emit('update board', info);
    socket.end();
  })
  socket.on('error',function(err){});
  socket.on('close',function(err){
  
    let vitri;
    for(var i = 0;i < clients.length;i++){
      
      if(clients[i]==socket)
        clients.splice(i,1);
      
      if(info[i].name == socket.name)
      {
        info.splice(i,1);
        vitri = i;
      }
    }
    io.of('/mapping2').emit('disconnected controller',vitri);
    console.log("mat ket noi");
    console.log(vitri);
    io.of('/listboard').emit('update board', info);  
  });
  
  
});
}