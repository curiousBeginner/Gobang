var header = $('#header')
var room = $('#room')
var main = $('#app')
function User(id,data) {
    this.name = ''
    this.id = id
    if(data&& data instanceof Object){
        this.setInfo(data)
    }
}
User.prototype.setName = function(callback) {
    var n = window.prompt('名称：')
    callback('name',n)
}
User.prototype.setInfo = function(data){
    for(var x in data){
        if(data[x]){
            this.set(x,data[x])
        }
    }
}
User.prototype.set = function(key,data){
    this[key] = data
}
function Room(){
    this.name = ''
    this.id = ''
}
Room.prototype = {
    constructor: Room,
    ...User.prototype,
}
Room.prototype.initData = function(){
    this.name = ''
    this.id = ''
}
function init(data) {
    
}
function setUserInfo(data){
    if(data.name){
        header.html('<div class="header-name">用户名称：'+data.name+'</div>')
    }
}
function setRoomInfo(data){
    if(data.name){
        room.addClass('room-box')
        room.html('<div class="room-name">房间名称：'+data.name+'</div>')
    }
    if(data.user&&data.user.length){
        let html = ' / 其他用户：'
        data.user.forEach((d,index) => {
            if(index){
                html += ','
            }
            html += d.name
        });
        $('.room-name').html($('.room-name').html()+html)
    }
}
function createDom(className) {
    main.html('<div class="'+className+'"></div>')
    return $('.'+className)
}

function createdUser(data,callback) {
    var user = createDom('user_content')
    var html = ''
    var name_box = 'created_user_name_box'
    if(data.name){
        setUserInfo(data)
        callback('init')
    }else{
        html = '<div class="'+name_box+'"><button type="button">创建用户名称</button></div>'
    }
    user.html(html)
    $("."+name_box).children('button').on('click',function(){
        User.prototype.setName(callback)
    })
}

function createdRoomList(list,callback) {
    if(!createdRoomList.box){
        createdRoomList.box = createDom('room_box')
        createdRoomList.box.on('click','.room_add_bt',function(){
            User.prototype.setName(callback)
        })
        createdRoomList.box.on('click','.room_list_bt',function(){
            callback('room',this.id)
        })
    }
    if(!createdRoomList.add){
        createdRoomList.box.html('<div class="room_add"><button class="room_add_bt" type="button">创建房间</button></div>') 
        createdRoomList.add = $(".room_add")
    }
    if(!createdRoomList.list){
        createdRoomList.box.html(createdRoomList.box.html()+'<div class="room_list"></div>') 
        createdRoomList.list = $('.room_list')
    }
    var html = ''
    for(var i = 0;i<list.length;i++){
        html+="<div><p>房间名称："+list[i].name+"</p><button class='room_list_bt' id="+list[i].id+" type='button'>加入房间</button></div>"
    }
    createdRoomList.list.html(html)
}

function roomInfo(option,callback){
    var gobang = new Gobang(option)
    main.html(gobang.canvas)
    callback(gobang)
}
function Gobang(option){
    option = option || {}
    this.canvas = document.createElement('canvas')
    this.context = this.canvas.getContext('2d')
    // 内容
    this.scope = option.scope || 450
    this.width= this.scope
    this.height= this.scope
    this.contentScope = this.scope * 0.9
    this.offset = this.scope * 0.05
    this.endState = false
    this.roleOption = {
        black:{
            color: '#636766',
            key: 'black',
            label: '黑子',
            victory: 5,
            value: 1
        },
        white:{
            color: '#b9b9b9',
            key: 'white',
            label: '白子',
            victory: 10,
            value: 2
        }
    }
    // 角色分为 1：黑子，2： 白子
    this.role = option.autoRole ? 'black' : ''
    // 自动切换角色
    this.autoRole = option.autoRole||false
    // 下一步角色
    this.nextRole = 'black'
    // data:[[1,2,0],[0,0,0]] ----- 1代表黑，2代表白，0代表空
    this.data = option.data || []
    this.bg = this._buffer()
    this.curIndex = option.curIndex || 15
    this.interval = this.contentScope / this.curIndex
    this.clickFn = null
    this.victoryCallback = null
    this.startSate = false
    this.init()
    this.setVictoryCallback(option.victoryCallback)
    this.onClick(option.onClick)
}
// 设置角色
Gobang.prototype.setRole = function(role){
    if(this.roleOption[role]){
        this.role = this.roleOption[role].key
    }
}
// 设置角色
Gobang.prototype.setNextRole = function(role){
    if(this.roleOption[role]){
        this.nextRole = this.roleOption[role].key
    }
}

// 设置自动角色
Gobang.prototype.setAutoRole = function(role){
    if(this.autoRole){
        this.setRole(role)
    }
}
// 获取胜利角色
Gobang.prototype.getVictoryRole = function(victory){
    for(var x in this.roleOption){
        if(this.roleOption[x].victory === victory){
            return this.roleOption[x]
        }
    }
}
// 获取角色
Gobang.prototype.getRole = function(value){
    for(var x in this.roleOption){
        if(this.roleOption[x].value === value){
            return this.roleOption[x]
        }
    }
}
// 设置胜利回调函数
Gobang.prototype.setVictoryCallback = function(fn) {
    if(typeof fn === 'function'){
        this.victoryCallback = fn
    }else{
        this.victoryCallback = null
    }
}
Gobang.prototype.fnVictory = function(role){
    if(typeof this.victoryCallback === 'function'){
        this.victoryCallback(role)
    }
}
Gobang.prototype._buffer = function() {
    canvas = document.createElement('canvas')
    canvas.id = `buffer_${new Date().getTime()}`
    canvas.width = this.width
    canvas.height = this.height
    context = canvas.getContext('2d')
    return {
        id:canvas.id,
        canvas,
        context
    }
}
Gobang.prototype.drawChess = function(x,y,role) {
    if(!role){ return }
    if(role!==this.nextRole){ return }
    //开始绘制
    this.context.beginPath();
    //绘制指定圆
    this.context.arc(this.offset + x*this.interval, this.offset +y*this.interval, this.interval/2, 0, 2*Math.PI);
    //进行填充
    if(role&&this.roleOption[role]) {
        this.data[y][x] = this.roleOption[role].value;
        this.context.fillStyle = this.roleOption[role].color;
        if(this.roleOption[role].value === 1){
            // 黑子
            this.setAutoRole('white')
            this.setNextRole('white')
        }else{
            // 白子
            this.setAutoRole('black')
            this.setNextRole('black')
        }
    }
    this.context.fill();
    //结束绘制
    this.context.closePath();
}
Gobang.prototype.initData = function(){
    for(var i=0;i<=this.curIndex;i++){
        this.data[i] = []
        for(var j=0;j<=this.curIndex;j++){
            this.data[i][j] = 0
        }
    }
}
Gobang.prototype.setData = function(data){
    if(data&&data instanceof Array&&data.length>0){
        this.data = data
    }
    var _this = this
    this.mapData(function(x,y,role){
        if(role){
            _this.drawChess(x,y,_this.getRole(role).key)
        }
    })
}
Gobang.prototype.mapData = function(fn){
    for(var i =0;i<this.data.length;i++){
        for(var j = 0;j<this.data.length;j++){
            if(typeof fn === 'function'){
                fn(i,j,this.data[i][j])
            }
        }
    }
}
Gobang.prototype.initTable = function(){
    for(var i=0;i<=this.curIndex;i++){
        //绘制横线
        var y = this.offset + i * this.interval
        this.bg.context.moveTo(this.offset,y)
        this.bg.context.lineTo(this.contentScope + this.offset,y)
        //绘制竖线
        var x = this.offset + i * this.interval
        this.bg.context.moveTo(x,this.offset)
        this.bg.context.lineTo(x,this.contentScope + this.offset)
    }
    this.bg.context.strokeStyle = "#bfbfbf";
    this.bg.context.stroke();
}
Gobang.prototype.getVerifyPoint = function(x,y) {
    let verifyPoint = []
    let d = this.data
    for(var i=0;i<=4;i++){
        // 横向
        if(x-i>=0){
            verifyPoint.push([
                d[y][x-i],
                d[y][x-i+1],
                d[y][x-i+2],
                d[y][x-i+3],
                d[y][x-i+4]
            ])
            // verifyPoint.push([[x-i,y],[x-i+1,y],[x-i+2,y],[x-i+3,y],[x-i+4,y]])
        }
        // // 纵向
        if(y-i>=0&&y-i+4<=this.curIndex){
            verifyPoint.push([
                d[y-i][x],
                d[y-i+1][x],
                d[y-i+2][x],
                d[y-i+3][x],
                d[y-i+4][x]
            ])
            // verifyPoint.push([[x,y-i],[x,y-i+1],[x,y-i+2],[x,y-i+3],[x,y-i+4]])
        }
        // 左右
        if(x-i>=0&&y-i>=0&&x-i+4<=this.curIndex&&y-i+4<=this.curIndex){
            verifyPoint.push([
                d[y-i][x-i],
                d[y-i+1][x-i+1],
                d[y-i+2][x-i+2],
                d[y-i+3][x-i+3],
                d[y-i+4][x-i+4]
            ])
            // verifyPoint.push([[x-i,y-i],[x-i+1,y-i+1],[x-i+2,y-i+2],[x-i+3,y-i+3],[x-i+4,y-i+4]])
        }
        // 右左
        if(x+i<=this.curIndex&&x+i-4>=0&&y-i>=0&&y-i+4<=this.curIndex){
            verifyPoint.push([
                d[y-i][x+i],
                d[y-i+1][x+i-1],
                d[y-i+2][x+i-2],
                d[y-i+3][x+i+3],
                d[y-i+4][x+i+4]
            ])
            // verifyPoint.push([[x+i,y-i],[x+i-1,y-i+1],[x+i-2,y-i+2],[x+i-3,y-i+3],[x+i-4,y-i+4]])
        }
    }
    return verifyPoint
}
Gobang.prototype.verify = function(x,y){
    const d = this.getVerifyPoint(x,y)
    for(var i =0;i<d.length;i++){
        let sum = 0,o = d[i]
        for(var j =0;j<o.length;j++){
            if(o[j]){
                sum =sum + o[j]
            }else{
                sum = 0
                break
            }
        }
        // 检查是否胜出
        if(sum&&sum%5 === 0){
            this.endState = true
            this.startSate = false
            this.fnVictory(this.getVictoryRole(sum))
            return true
        }
    }
}
Gobang.prototype.gameStart =function (){
    this.startSate = true
} 
Gobang.prototype.moveLater = function(x,y,role){
    if(this.startSate){
        this.drawChess(x,y,role)
        this.verify(x,y)
    }else{
        console.log('还未开始')
    }
}
Gobang.prototype.onClick = function(fn) {
    if(typeof fn === 'function'){
        this.clickFn = fn
    }else{
        this.clickFn = null
    }
}
Gobang.prototype.click = function(x,y){
    if(typeof this.clickFn === 'function'){
        this.clickFn(x,y)
    }else{
        this.moveLater(x,y)
    }
}
Gobang.prototype.init = function(){
    this.canvas.id = "gobang_canvas"
    this.canvas.width = this.width
    this.canvas.height = this.height
    console.log('绘制图表')
    this.initTable()
    if(!this.data.length){
        this.initData()
    }else{
        console.log('绘制旗子')
        this.setData()
    }
    this.context.drawImage(this.bg.canvas,0,0,this.width,this.height,0,0,this.width,this.height)
    var _this = this
    var t = $('#text')
    this.canvas.onclick = function(event){
        if(_this.role !== _this.nextRole){ return }
        if(_this.endState||(!_this.role&&this.autoRole===false)){ return }
        var x = Math.floor((event.offsetX - _this.offset + _this.interval/2) / _this.interval);
        var y = Math.floor((event.offsetY - _this.offset + _this.interval/2) / _this.interval);
        if(x>=0&&y>=0&&_this.data[y][x] === 0){
            _this.click(x,y)
            // t.html(t.html()+'['+x+','+y+']')
        }
    }
}