import { LogWrap } from "../Utils/LogWrap";
import { MessageManager } from "./MessageManager";
import { ListenerType } from "../../scripts/data/ListenerType";
import { GameDataManager } from "../../framework/Manager/GameDataManager";


export class SocketManager {
    private static instance: SocketManager;
    private sock: WebSocket = null;
    private sockConnectTimerId = 0


    public static getInstance(): SocketManager {
        if (this.instance == null)
            this.instance = new SocketManager();

        return this.instance;
    }

    private onOpened(event) {
        
        LogWrap.log("socket connect success, Ip: [" + event.target.url + "]");
        MessageManager.getInstance().messagePost(ListenerType.OnSocketConnectFinish);
    }

    private onRecvData(event) {
        this.messageReceive(event);
        MessageManager.getInstance().messagePost(ListenerType.OnSocketReceive);
    }

    private onSocketClose(event) {
        LogWrap.warn("socket close");
        if (this.sock)
            this.close();
        MessageManager.getInstance().messagePost(ListenerType.OnSocketConnectFail);
    }

    private onSocketErr(event) {
        LogWrap.err("socket error");
        this.close();
    }

    //异常关闭
    private close() {
        if (this.sock) {
            this.sock.close();
            this.sock = null;
        }
    }

    //客户端主动关闭
    public clientClose() {
        if (this.sock !== null) {
            this.sock.onopen = () => { };
            this.sock.onmessage = () => { };
            this.sock.onerror = () => { };
            this.sock.onclose = () => { };
            if (this.sock) {
                this.sock.close();
                this.sock = null;
            }
        }
    }

    public connect(url) {
        if (this.sock) {
            if (this.sock.readyState == WebSocket.CONNECTING)
            {
                LogWrap.log("socket connecting, wait");
                return;
            }
            this.close();
            LogWrap.log("has socket object, close and try it");
        }
        //url = "ws://192.168.2.94:6100"
        //url = "ws://192.168.2.35:6100"
        GameDataManager.getInstance().systemData.currentConnectIP = url;
        LogWrap.log("创建连接:url",url)
        this.sock = new WebSocket(url);
        this.sock.binaryType = "arraybuffer";

        this.sock.onopen = this.onOpened.bind(this);
        this.sock.onmessage = this.onRecvData.bind(this);
        this.sock.onclose = this.onSocketClose.bind(this);
        this.sock.onerror = this.onSocketErr.bind(this);
        let fn = function () {
            if (this.getSocketConnect())
                return;
            this.clientClose()
            MessageManager.getInstance().messagePost(ListenerType.OnSocketConnectFail);
        }.bind(this)
        if(this.sockConnectTimerId != 0)
        {
            clearTimeout(this.sockConnectTimerId);
            this.sockConnectTimerId = 0
        }
        this.sockConnectTimerId = setTimeout(fn, 10000);
    }

    public messageReceive(msg) {
        MessageManager.getInstance().messageReceive(msg);
    }

    public messageSend(msg) {
        if (!this.sock || this.sock.readyState != WebSocket.OPEN) {
            LogWrap.err("socket is closed! try to reconnect!");
            MessageManager.getInstance().messagePost(ListenerType.OnSocketConnectFail);
        }
        else {
            this.sock.send(msg);
        }
    }

    public getSocketConnect()
    {
        if (this.sock && this.sock.readyState == WebSocket.OPEN)
            return true
        return false
    }

    public getSocketReadyState()
    {
        if (this.sock)
            return this.sock.readyState
        return -1
    }

}

