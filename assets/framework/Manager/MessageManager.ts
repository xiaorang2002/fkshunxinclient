import { ConstValue } from './../../scripts/data/GameConstValue';
import { ListenerType } from './../../scripts/data/ListenerType';
import { SocketManager } from './SocketManager';
import { LogWrap } from "../Utils/LogWrap";
import { ListenerManager } from "../Manager/ListenerManager";
import { GameManager } from "../../scripts/GameManager";
import { StringData } from "../../scripts/data/StringData";


export class MessageManager {
    private static instance: MessageManager;
    private protoMap = new Map<number, any>();
    private msgList: Array<any> = [];
    private firstMsgList: Array<number> = [];
    private waitList = []

    public static getInstance(): MessageManager {
        if (this.instance == null)
            this.instance = new MessageManager();

        return this.instance;
    }

    public getProtoAction(id: number): any {
        return this.protoMap.get(id);
    }

    public addProtoAction(id: number, msgAction: any): void {
        this.protoMap.set(id, msgAction);
    }

    public addFirstMsgList(msgId: number) {
        if (msgId == undefined || msgId == 0) {
            LogWrap.err("Can't found msgId：", msgId);
            return;
        }
        this.firstMsgList.push(msgId);
    }

    public removeFirstMsgList(msgId: number) {
        if (msgId == undefined || msgId == 0) {
            LogWrap.err("Can't found msgId：", msgId);
            return;
        }

        for (let i = 0; i < this.firstMsgList.length; ++i) {
            if (this.firstMsgList[i] == msgId) {
                this.firstMsgList.splice(i, 1);
                return;
            }
        }
    }

    public isInFirstMsgList(msgId: number): boolean {
        for (let i = 0; i < this.firstMsgList.length; ++i) {
            if (this.firstMsgList[i] == msgId)
                return true;
        }
        return false;
    }

    public updateWaitList(dt) {
        if (this.waitList.length > 0)
        {
            if(this.waitList[0][1] <= 0)
            {
                this.waitList.splice(0, 1)
                this.messagePost(ListenerType.messageStatusChanged, {status:"timeout"});
            }
            else
                this.waitList[0][1] -= dt
        }
    }

    public indexOfWaitList(msgId)
    {
        for (var i = 0; i < this.waitList.length;i++)
        {
            if (this.waitList[i][0] == msgId)
                return i
        }
        return -1
    }

    //消息分发
    private postMsg(msgId: number, msgData: any = null) {
        if (msgId == undefined || msgId == 0) {
            LogWrap.err("Can't found msgId：", msgId);
            return;
        }
        if (msgData == null) {
            LogWrap.err("msgData is null");
            return;
        }
        if (msgData.result == 32) // 全局维护
            GameManager.getInstance().onGameWeiHu()
        if (msgData.result && msgData.result != 0 && msgId != 1195 && msgId != 1006 && msgId != 1197
            && msgId != 14115 && msgId != 1003 && msgId != 1003 && msgId != 998 && msgId != 1231 && msgId != 14127
            && msgId != 14078 && msgId != 1241 && msgId != 14145) {
            if(msgData.result == 240 || msgData.result == 251) // 非法操作不显示
            {
                MessageManager.getInstance().disposeMsg();
                return
            }
            if (msgData.result == 224 || msgData.result == 235) // 如果被封号
                SocketManager.getInstance().clientClose();
            if(msgData.result == 3)
                cc.sys.localStorage.setItem("loginInfo", "")
            if (msgData.result == 253 || msgData.result == 254)
            {
                GameManager.getInstance().openStrongTipsUI(StringData.getString(msgData.result), () => { });
                MessageManager.getInstance().disposeMsg();
                return
            }
            GameManager.getInstance().openWeakTipsUI(StringData.getString(msgData.result));
            MessageManager.getInstance().disposeMsg();
            return;
        }

        //检测是否为第一优先级
        if (this.isInFirstMsgList(msgId)) {
            ListenerManager.getInstance().trigger(msgId, msgData);
            return;
        }

        let msgEvent = {
            msgId: msgId,
            msgData: msgData
        };
        this.msgList.push(msgEvent);
        if (this.msgList.length == 1) {
            let postOk = ListenerManager.getInstance().trigger(msgId, msgData);
            if (!postOk)
                this.disposeMsg();
        }
    }

    //消息完成回调
    public disposeMsg() {
        let msg = this.msgList.shift();
        if (!msg)
            return;
        if(msg.msgId != 14125)
            LogWrap.info("disPosMdg ID：", msg.msgId);
        if (this.msgList.length != 0) {
            let postOk = ListenerManager.getInstance().trigger(this.msgList[0].msgId, this.msgList[0].msgData);
            if (!postOk)
                this.disposeMsg();
        }
    }

    private encodeMsg(msgId: number, msgData: any): any {
        if (msgId == undefined || msgId == 0) {
            LogWrap.err("Can't found msgId：", msgId);
            return null;
        }
        let cMsg = this.protoMap.get(msgId);
        if (cMsg) {
            let message = cMsg.create(msgData);
            return cMsg.encode(message).finish();
        }
        else {
            LogWrap.err("Can't found msgId：", msgId);
            return null;
        }
    }

    private decodeMsg(msgId: number, msgData: any): any {
        if (msgId == undefined || msgId == 0) {
            LogWrap.err("Can't found msgId：", msgId);
            return null;
        }

        let cMsg = this.protoMap.get(msgId);
        if (cMsg) {
            return cMsg.decode(msgData);
        }
        else {
            LogWrap.err("Can't found msgId：", msgId);
            return null;
        }
    }

    public messageSend(msgId: number, msgData: any, isWait: boolean = false, waitId = 0) {
        let encodedata = this.encodeMsg(msgId, msgData);
        if (this.indexOfWaitList(waitId) >= 0)
            this.messagePost(ListenerType.messageWaiting);
        if (isWait)
        {
            this.messagePost(ListenerType.messageStatusChanged, {status:"send"});
            this.waitList.push([waitId,ConstValue.MESSAGE_WAIT_TIME]);
        }
        let data = encodedata.buffer.slice(encodedata.byteOffset, encodedata.byteOffset + encodedata.byteLength);
        let msgLength = data.byteLength;
        let buffer = new ArrayBuffer(8 + msgLength);
        let view1 = new DataView(buffer);
        let view2 = new DataView(data);
        view1.setInt32(0, msgLength);
        view1.setInt32(4, msgId);
        GameManager.getInstance().addMsgId(msgId)
        for (let i = 0; i < view2.byteLength; ++i)
            view1.setInt8(8 + i, view2.getInt8(i));

        if (msgId == 1113 && !LogWrap.HEART_LOG_SWITCH) { }
        else{
            LogWrap.log("Send Message ID:", msgId,", action:"+this.getProtoAction(msgId).name, ", Content:", JSON.stringify(msgData),encodedata.byteLength);
        }
            
        SocketManager.getInstance().messageSend(view1.buffer);
    }

    //解包分发
    public messageReceive(msg: any) {
        
        let view1 = new DataView(msg.data);
        let msgid = view1.getInt32(4); // 先取出视图1中4-8位的msgid
        let tempArray = new Uint8Array(view1.buffer) // 将arraybuffer转换成8位无符号整型数组
        // 先取出缓冲区长度，再申请一个该长度的数据视图，将视图1对应位置的字节挨个遍历放到新的视图中，将新的视图缓冲区解析成具体消息（以舍弃）
        // let buffer = new ArrayBuffer(view1.getInt32(0));
        // let view2 = new DataView(buffer);
        // for (let i = 0; i < view2.byteLength; ++i)
        //     view2.setInt8(i, view1.getInt8(8 + i));
        // let msgData = this.decodeMsg(msgid, new Uint8Array(view2.buffer));
        let msgData = this.decodeMsg(msgid, tempArray.subarray(8)); // 从数组的第8位开始，将数据解析成具体的消息
        GameManager.getInstance().addMsgId(msgid)
        if (msgid == 1112 && !LogWrap.HEART_LOG_SWITCH) { }
        else
        {
            if (this.indexOfWaitList(msgid) >= 0)
            {
                this.messagePost(ListenerType.messageStatusChanged, {status:"nomal"});
                this.waitList.splice(this.indexOfWaitList(msgid), 1)
            }
            if (msgid != 14125)
            {
                LogWrap.log("Receive Message ID:", msgid,", action:",this.getProtoAction(msgid).name, ", Content:",JSON.stringify(msgData) );
            }
                
        }
        this.postMsg(msgid, msgData);
    }

    //客户端内部分发
    public messagePost(msgId: number, msgData: any = null, isQueue: boolean = false) {
        //内部消息,是否需要进入队列
        if (isQueue)
            this.postMsg(msgId, msgData);
        else
            ListenerManager.getInstance().trigger(msgId, msgData);
    }

    //获取编码包
    public getEncode(cMsg: any, msgData: any) {
        if (cMsg) {
            let message = cMsg.create(msgData);
            let encodedata = cMsg.encode(message).finish();
            return encodedata;
        }
        else {
            LogWrap.err("cMsg is Null");
            return null;
        }
    }

    //获取解码包
    public getDecode(cMsg: any, msgData: any) {
        if (cMsg) {
            return cMsg.decode(msgData);
        }
        else {
            LogWrap.err("cMsg is Null");
            return null;
        }
    }

    //得到消息队列的消息数
    public getMsgListNum() {
        return this.msgList.length;
    }

    public clearMsglist() {
        this.msgList = [];
    }

}

