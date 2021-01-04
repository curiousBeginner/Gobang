var WebSocketServer = require('ws').Server,
wss = new WebSocketServer({ port: 8181 });
// 用户列表
let chatUsers = []
var userObject = {}
// 房间
var room = {}
// 格式化
function format(d){
  return JSON.parse(d)
}
function sendFormat(d){
  return JSON.stringify(d)
}
function sendData(code,msg){
  return sendFormat({
    code,
    data: msg
  })
}
function roomList(){
  let o = []
  Object.keys(room).map(k=>{
    o.push({
      id:room[k].id,
      name: room[k].name,
      count: room[k].user.length
    })
  })
  return o 
}
// 
const createdRoom = (info, user) =>{
  const { name, id } = info
  if(name&&id){
    room[id] = {
      name,id,
      mainUserId: '',
      user: [],
      data: null
    }
  }
  if(user) {
    addRoomUser(id,user)
  }
}

const setRoomInfo=(id,key,data)=>{
  if(id&&room[id]){
    room[id][key] = data
  }
}

// 用户加入房间
const addRoomUser = (roomId,user) => {
  if(roomId&&room[roomId]){
    if(!room[roomId].mainUserId){
      room[roomId].mainUserId = user.id
    }
    if(room[roomId].user.find(d=>{
      return d.id === user.id
    })){ return }
    console.log('用户加入房间')
    room[roomId].user.push(user)
  }
}
// 用户退出房间
const remRoomUser = (roomId,user) => {
  if(roomId&&room[roomId]){
    const index = room[roomId].user.findIndex(d=>{return d.id === user.id})
    if(index>=0){
      room[roomId].user.splice(index,1)
      if(room[roomId].user.length === 0){
        delete room[roomId]
      }
    }
  }
}

function addConnect(info={}){
  return new Promise((res,rej)=>{
    let id = info.id || `user_${new Date().getTime()}`
    let userInfo = { id }
    if(userObject[id]){
      // 用户已存在
      console.log('用户已存在',id)
      userInfo = userObject[id]
    }else{
      // 用户不存在
      console.log('用户不存在',id)
      setUserInfo(userInfo)
    }
    if(id){
      res(userInfo)
    }else{
      rej(new Error('用户创建失败'))
    }
  })
}

function setUserInfo(info){
  const { id } = info
  if(!id) { return }
  userObject[id] = info
  // chatUsers.push(info)
}

// 广播通知,ids: 指定通知人员
const broadcast = (info,option) => {
  const { ids,notId } = option || {}
  console.log(ids,'ids')
  console.log(notId,'notId');
  wss.clients.forEach(function(conn) {
    console.log(conn.socketId,'socketId')
    if(ids){
      if(ids.indexOf(conn.socketId)>=0){
        conn.send(info)
      }
    }else if(notId){
      if(conn.socketId!==notId){
        conn.send(info)
      }
    }else{
      conn.send(info)
    }
  })
}

wss.on('connection', function (ws) {
  console.log('链接ws')
  ws.on('close',function(code){

  })
  ws.on('message', function (message) {
    const { type, data } = format(message)
    console.log(type,data)
    switch(type){
      case 100:
        console.log('创建用户')
        addConnect(data).then(d=>{
          console.log('用户信息',d)
          ws.socketId = d.id
          ws.send(sendData(100,d))
        }).catch(err=>{
          console.log('err报错',err)
          ws.send(sendData(400,{err}))
        })
      break;
      case 101:
        userObject[data.id] = data
        ws.socketId = data.id
        ws.send(sendData(101,data))
        break;
      case 200:
        const {id,name} = data
        if(userObject[id]){
          const roomId = `room_${new Date().getTime()}`
          createdRoom({
            id:  roomId,
            name
          })
          let ids = []
          Object.keys(userObject).map(k=>{
            const d = userObject[k]
            if(!d.roomId&&d.name){
              ids.push(d.id)
            }
          })
          broadcast(sendData(202,roomList()),{ids})
        }
      break;
      case 201:
        if(room[data.id]&&data.userId){
          console.log('房间详情')
          let userId = data.userId
          addRoomUser(data.id,userObject[userId])
          userObject[data.userId].roomId = data.id
          let roomInfo = room[data.id] || {}
          let user = []
          if(roomInfo){
            roomInfo.user.map(d=>{
              if(d.id === userId){ return }
              user.push({
                name: d.name
              })
            })
          }
          console.log(room[data.id].data)
          ws.send(sendData(201,{
            ...roomInfo,
            user,
          }))
        }else{
          console.log('房间列表')
          ws.send(sendData(202,roomList()))
        }
        break;
      case 203:
        // 设置房间数据
        if(!room[data.id].data){
          setRoomInfo(data.id,'data',data.data)
        }
        let ids = []
        room[data.id].user.map(d=>{
          if(d.id!=ws.socketId){
            ids.push(d.id)
          }
        })
        console.log(ids,'同步数据')
        broadcast(sendData(203,{
          data: room[data.id].data
        }),{ids: ids})
      break;
      case 204:
        const { roomId,x,y,role } = data
        if(room[roomId].user.length<=1){return}
        const s = []
        room[roomId].data[y][x] = role
        room[roomId].user.map(d=>{
          s.push(d.id)
        })
        console.log(room[roomId].data,s)
        broadcast(sendData(204,data),{ids:s})
      break;
      case 205:
        setRoomInfo(data.id,'data',data.data)

        break;
      case 300: 
        let ids300 = []
        room[data.id].user.map(d=>{
          if(d.id!=ws.socketId){
            ids300.push(d.id)
          }
        })
        console.log(ids300,'游戏开始')
        broadcast(sendData(300,{
        }),{ids: ids300})
      break;
    }
  })
});