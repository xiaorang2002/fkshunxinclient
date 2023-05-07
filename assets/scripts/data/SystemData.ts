import { StrongTipsUI } from './../ui/StrongTipsUI';
import { ListenerType } from "./ListenerType";
import { MessageManager } from "../../framework/Manager/MessageManager";
import * as GameConstValue from "./GameConstValue";
import { GameManager } from "../GameManager";
import { LogWrap } from "../../framework/Utils/LogWrap";
import { StringData } from "./StringData";
import { UIManager } from "../../framework/Manager/UIManager";
import { LoginUI } from "../ui/LoginUI";
import { Utils } from '../../framework/Utils/Utils';

export class SystemData {
    public static className = "SystemData";
    public maxRoundRobinNum = 1; //最大轮询次数
    public curRoundRobinNum = 0; //当前轮询下表
    public curConfigGetIndex = -1;
    public _curIpList = []//线上的
    public _curConfigList = [] // 当前可供拉取配置的列表  线上的
    public _maxConfigGetNum = 0
    public version = "1.0.03"; // 当前的服务器版本
    public kefu = ""
    public isFirstStartGame = true;
    public shareSid = ""     // 登录时从剪切板拿到的sid
    public shareData = "" // 登录时通过sid获取的登录数据
    public promoter = 0
    public channelId = ""
    public remoteConfigInfo = ""
    public backupConfigUrl = "" // 备份配置拉取地址
    public lastSuccessConfigUrl = "" // 上次拉取配置成功的地址
    public currentReqConfigUrl = "" // 当前拉取配置的地址
    public randomIpList = []
    public errorMap = new Map()
    public errorRefreshTime = 30
    public gameTypeList = []
    public allReadyConnectList = []      // 已经连过的ip
    public onlineKefuUrl = ""
    public currentConnectIP = ""         // 当前连接的线路
    public isExchangeIP = false

    public set curIpList(v)
    {
        this._curIpList = v
    }

    public get curIpList()
    {
        if(this._curIpList.length == 0)
        {
            this._curIpList = GameConstValue.ConstValue.IP_ARR[GameConstValue.ConstValue.LOGIN_MODE] 
        }
        return this._curIpList
    }

    public set curConfigList (v)
    {
        this._curConfigList = v
    }

    public get curConfigList ()
    {
        if(this._curConfigList.length == 0)
        {
            this._curConfigList = GameConstValue.ConstValue.CONFIG_URL_ARR[GameConstValue.ConstValue.LOGIN_MODE] 
        }
        return this._curConfigList
    }

    public set maxConfigGetNum(v)
    {
        this._maxConfigGetNum = v
    }

    public get maxConfigGetNum()
    {
        if(this._maxConfigGetNum == 0)
        {
            this._maxConfigGetNum = this.curConfigList.length
        }
        return this._maxConfigGetNum
    }

    //服务器时间 以服务于本地的差值方式存储
    private _severTime: number = 0;
    public get severTime(): number {
        return this._severTime;
    }
    public set severTime(value: number) {
        this._severTime = value*1000;
    }

    //心跳是否开启
    private _isHeartOpen: boolean = false;
    public get isHeartOpen(): boolean {
        return this._isHeartOpen;
    }
    public set isHeartOpen(value: boolean) {
        this._isHeartOpen = value;
        this._breakLineTime = new Date().getTime();
        this._sendHeartTime = 0
        this._curHeartTime = 0
    }

    //发送心跳
    private _curHeartTime: number = 0; //心跳间隔
    private _sendHeartTime: number = 0;//心跳发送时间
    private _breakLineTime: number = 0;//断线检测时间
    public sendHeart(dt: number): boolean {
        if (this._isHeartOpen) {
            var nowTime = new Date().getTime()
            if (nowTime - this._sendHeartTime > GameConstValue.ConstValue.HEART_TIME*1000)
            {
                this._sendHeartTime = new Date().getTime();
                return true;
            }
        }
        return false;
    }

    //收到心跳
    private _ping: number = 0;
    public get ping(): number {
        return this._ping;
    }
    public receiveHeart() {
        this._ping = new Date().getTime() - this._sendHeartTime;
        if (LogWrap.HEART_LOG_SWITCH) {
            LogWrap.info(this._ping);
        }
    }

    public getSendHeatTime(){
        return this._sendHeartTime
    }

    public getMsgRecTime(){
        return this._breakLineTime
    }

    //重置断线时间
    public resetBreakTime() {
        this._breakLineTime = new Date().getTime();
    }

    //更新断线时间
    public updateBreakTime(dt) {
        if (this._isHeartOpen) {
            if (new Date().getTime() - this._breakLineTime > GameConstValue.ConstValue.BREAK_LINE_TIME * 1000) {
                //大于断线时间，断开网络
                GameManager.getInstance().onLinkBreakOrBackground()
                //断掉心跳，断掉socket
                GameManager.getInstance().closeSocket();
                GameManager.getInstance().connectSocket();
            }
        }
    }

    //重连次数
    private _reconnectTimes: number = 0;
    public reconnectSocket() {
        LogWrap.log("断线重连次数:",this._reconnectTimes)
        this._reconnectTimes += 1;
        this.curRoundRobinNum += 1;
        if (this._reconnectTimes >= GameConstValue.ConstValue.RECONNECT_TIMES) {
            LogWrap.warn("已经轮询过所有服务器");
            GameManager.getInstance().closeWaitUI();
            this._reconnectTimes = 0;
            this.curRoundRobinNum = 0;
            this.allReadyConnectList = []
            let surefun = () => {
                GameManager.getInstance().connectSocket();
            };
            let closefun = () => {
                UIManager.getInstance().openUI(LoginUI, 0, () => {
                    UIManager.getInstance().closeAllExceptOpenUI(LoginUI);
                });
            };
            UIManager.getInstance().closeUI(StrongTipsUI)
            MessageManager.getInstance().clearMsglist(); // 清理消息队列
            GameManager.getInstance().openSelectTipsUI(StringData.getString(10026), surefun, closefun);
        }
        else {
            //三秒一次重连
            GameManager.getInstance().connectSocket();
            // setTimeout(() => {
            // }, 3000);
        }
    }   

    public getRandomNewIp()
    {
        var newIpList = [];
        for (var ip of this.curIpList)
        {
            if (this.allReadyConnectList.indexOf(ip) < 0)
                newIpList.push(ip)
        }
        if (newIpList.length == 0)
            return ""
        var index = Utils.reandomNum(1, newIpList.length + 1) - 1
        return newIpList[index]
    }

    public clearConnectLogic() // 清理连接逻辑
    {
        this.allReadyConnectList = []
        this.curRoundRobinNum = 0;
    }

    refreshErrorMap(dt) {
        this.errorMap.forEach((time, errorMsg)=>{
            time -= dt
            if (time <= 0)
                this.errorMap.delete(errorMsg)
            else
                this.errorMap.set(errorMsg, time)
        })
    }

    //大厅公告
    private _hallNotice: string = "";
    public get hallNotice(): string {
        return this._hallNotice;
    }
    public set hallNotice(value: string) {
        this._hallNotice = value;
        MessageManager.getInstance().messagePost(ListenerType.noticeChanged, {type:2});
    }
    public _globalNoticeList = []
    public get globalNoticeList() {
        return this._globalNoticeList;
    }
    public set globalNoticeList(value) {
        this._globalNoticeList = value;
        MessageManager.getInstance().messagePost(ListenerType.noticeChanged, {type:1});
    }
}