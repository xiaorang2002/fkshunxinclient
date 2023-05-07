// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { LogWrap } from "../../framework/Utils/LogWrap";


const {ccclass, property} = cc._decorator;

@ccclass
export default class PingIp {
    private static instance: PingIp;

    public static getInstance(): PingIp {
        if (this.instance == null)
            this.instance = new PingIp();

        return this.instance;
    }
    private tempobj = {}
    private iparr = []
    private cur_index = 0
    private callback:Function
    public getPing(arr,cb)
    {

        //arr  = ["sxws.awoeo.com:8100", "211.99.97.12:8100", "211.99.97.74:8100", "47.107.103.195:8100"]
        this.iparr = arr
        this.callback = cb
        this.tempobj = {}
        this.cur_index = 0
        this.connect(arr[this.cur_index])
    }

    private connect(url)
    {
        let that = this
        let start_t = (new Date()).getTime()
        
        let connectIp = url;
        if (connectIp.indexOf(":") >= 0)
            connectIp = "ws://" + connectIp;
        else {
            connectIp= "ws://" + connectIp + ":" + 8100;
        }
        let sock = new WebSocket(connectIp);
         sock.binaryType = "arraybuffer";


        sock.onopen = function(ev)
        {
            LogWrap.log("发送心跳包",url)
            that.closesocket(sock,url,start_t,'onopen',"success")
            start_t = (new Date()).getTime()
            sock.send('{}')
           
        }
        sock.onmessage = function(){
            that.closesocket(sock,url,start_t,'onmessage',"success")
        }
        sock.onclose = function(){
            LogWrap.log("onclose.......",url)
           // that.closesocket(sock,url,start_t,'onclose','failed')
           sock.close()
           sock = null
           that.cur_index++
           if(that.tempobj[url] && that.tempobj[url]["status"] == "onopen")
           {
                LogWrap.log("url...time",url,(new Date()).getTime() - start_t)
                that.tempobj[url]["time"] = (new Date()).getTime() - start_t
           }
           if(that.cur_index < that.iparr.length)
           {
                that.connect(that.iparr[that.cur_index])
           }else{
                that.callback(that.tempobj)
           }
        }
        sock.onerror = function(){
            that.closesocket(sock,url,start_t,'onerror','failed')
        }
    }

    private closesocket(sock,url,startT,status,result)
    {
        if(sock == null)
        {
            return
        }
        LogWrap.log(url,status,result)
        if(result != "success" && status != "onopen")
        {
            sock.close()
            sock = null
        }
        let obj = {}
        obj = {"url":url,"time":(new Date()).getTime() - startT,"status":status,"result":result}
        this.tempobj[url] = obj

      
    }

}
