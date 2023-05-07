import { BaseUI } from "../../framework/UI/BaseUI";
import { AudioManager } from "../../framework/Manager/AudioManager";
import { UIManager } from "../../framework/Manager/UIManager";
import * as GameConstValue from "../data/GameConstValue";
import { GameDataManager } from "../../framework/Manager/GameDataManager";
import { GameManager } from "../../scripts/GameManager";
import { SocketManager } from './../../framework/Manager/SocketManager';
import { ListenerManager } from "./../../framework/Manager/ListenerManager";
import { ListenerType } from "./../data/ListenerType";
import * as child_process from 'child_process'
import pingIP from '../data/PingIp';
import { LogWrap } from "../../framework/Utils/LogWrap";
import { SdkManager } from "../../framework/Utils/SdkManager";
var ping = require('ping')

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameNet extends BaseUI {

    protected static className = "GameNet";
    public static getUrl(): string {
        return GameConstValue.ConstValue.UI_SYSTEM_DIR + this.className;
    }
    @property(cc.Label)
    myIP: cc.Label = null;

    @property(cc.Label)
    currentLine: cc.Label = null;       //当前连接的线路
    @property(cc.Label)
    position: cc.Label = null;          //经纬度
    @property(cc.Label)
    arrayLine: cc.Label[] = [];         //当前可以连接的所有线路
    @property(cc.Label)
    arrayDalayNum: cc.Label[] = [];     //所有线路的延时数据
    arrayIP: string[] = [];             //所有线路的IP
    toggleLines: cc.Toggle[] = [];
    selectToggle: number = 0;
    requestTime:number = 0;            //当他的值小于0时开始请求网络数据
    isPing:boolean = false;            

    private delay_t:number = 0
    private times:number = 5 
    private lastTime:number = 0       //记录上一次点击按钮的时间
    private bNoGps:boolean = false
    onLoad() {
        super.onLoad()
        ListenerManager.getInstance().add(ListenerType.OnSocketConnectFinish, this, this.onSocketConnectResponse);
        if (GameConstValue.ConstValue.LOGIN_MODE == GameConstValue.LOGIN_TYPE.LOGIN_DEBUG) {
            this.arrayIP = [GameConstValue.ConstValue.IP_ARR[GameConstValue.ConstValue.LOGIN_MODE][0].substring(5)];
        }
        else {
            var sysData = GameDataManager.getInstance().systemData
            this.arrayIP = sysData.curIpList
        }
        let showCount = this.arrayIP.length;
        for (let i = 0; i < 4; i++) {
            this.toggleLines[i] = cc.find("sp_bg/ToggleContainer/toggle" + i, this.node).getComponent(cc.Toggle);
            if (i < showCount) {
                this.toggleLines[i].node.active = true;
                this.arrayLine[i].string = this.getShowIP(this.arrayIP[i]);
                this.arrayDalayNum[i].node.parent.active = true;
            } else {
                this.toggleLines[i].node.active = false;
                this.arrayLine[i].string = "";
                this.arrayDalayNum[i].node.parent.active = false;
            }
        }
        this.initLayer()
    }

    onShow() {
        this.initLayer()
    }

    onDestroy() {
        ListenerManager.getInstance().removeAll(this);
    }
    
    start() {

    }

    public initLayer() {
        this.myIP.string = "我的IP：" + GameConstValue.ConstValue.NET_IP;
        let selectIP = GameDataManager.getInstance().systemData.currentConnectIP.substring(5);
        let index = this.arrayIP.indexOf(selectIP);
        this.currentLine.string = "当前线路：线路" + (index + 1);
        this.selectToggle = index;
        this.toggleLines[index].isChecked = true;
        this.isPing = false;
        this.lastTime = 0
        this.getGps()
    }

    private getGps()
    {
        if(GameDataManager.getInstance().gpsData == null){
            this.position.string = "位置：(-1,-1)未能获取到GPS！";
            this.bNoGps = true
            this.delay_t = 13 - this.times*2
            SdkManager.getInstance().doGetLocation()
        }else{
            this.bNoGps = false
            this.delay_t = 0;
            let reason = GameDataManager.getInstance().gpsData.reason;
            if(reason == undefined){
                reason = "";
            }
            this.position.string = `位置：(${Number(GameDataManager.getInstance().gpsData.jingdu).toFixed(2)},${Number(GameDataManager.getInstance().gpsData.weidu).toFixed(2)}) ${reason}`
        }

        if(this.times-- <= 0)
        {
            this.bNoGps = false
            this.delay_t = 0
        }
    }

    public getShowIP(selectIP: string) {
        return "(" + selectIP.substring(0, 3) + "***)";
    }
    private button_toggleEvent(event, CustomEvent) {
        AudioManager.getInstance().recordSound();
        this.selectToggle = parseInt(CustomEvent);
    }
    private button_close(event) {
        AudioManager.getInstance().recordSound();
        UIManager.getInstance().closeUI(GameNet);
    }
    private button_exchange(event) {
        let interval = new Date().getTime() - this.lastTime
        if(interval < 3000){
            GameManager.getInstance().openWeakTipsUI("您的操作过于频繁,请稍后再试!");
            return;
        }
        this.lastTime = new Date().getTime()

        AudioManager.getInstance().recordSound();
        let selectIP = GameDataManager.getInstance().systemData.currentConnectIP.substring(5);
        let index = this.arrayIP.indexOf(selectIP);
        if (index == this.selectToggle) {
            GameManager.getInstance().openWeakTipsUI("当前线路已经是你选择的线路!");
            return;
        }
        let connectIp = this.arrayIP[this.selectToggle];
        if (connectIp.indexOf(":") >= 0)
            connectIp = "ws://" + connectIp;
        else {
            connectIp= "ws://" + connectIp + ":" + 8100;
        }
        //GameDataManager.getInstance().systemData.isExchangeIP = true;
        SocketManager.getInstance().clientClose();
        SocketManager.getInstance().connect(connectIp);
    }
    private onSocketConnectResponse(){
        let selectIP = GameDataManager.getInstance().systemData.currentConnectIP.substring(5);
        let index = this.arrayIP.indexOf(selectIP);
        this.currentLine.string = "当前线路：线路" + (index + 1);
        GameManager.getInstance().openWeakTipsUI("当前线路已切换为你选择的线路!");
        //GameDataManager.getInstance().systemData.isExchangeIP = false;
    }
    protected update(dt: number): void {
        this.requestTime -= dt;
        if(this.requestTime < 0 && !this.isPing){
            this.isPing = true;
            this.requestTime = 3;
            pingIP.getInstance().getPing(this.arrayIP,this.pingResult.bind(this));
        }

        if(this.bNoGps)
        {
            this.delay_t -= dt
            if(this.delay_t <= 0)
            {
               this.getGps()   
            }
            
        }
    }
    public pingResult(resultData:any)
    {
       // LogWrap.log("pingResult:",this.arrayIP.toString())
       // LogWrap.log("resultData",JSON.stringify(resultData))

        this.isPing = false
        if(resultData && this.arrayIP){
            for(let i=0;i<this.arrayIP.length;i++){
                if(resultData[this.arrayIP[i]])
                {
                    this.arrayDalayNum[i].string = resultData[this.arrayIP[i]].time; 
                    if(resultData[this.arrayIP[i]].time > 360){
                        this.arrayDalayNum[i].node.color = new cc.Color(233, 75, 33)
                    }else{
                        this.arrayDalayNum[i].node.color = new cc.Color(7, 154, 32)
                    }
                }
               
            }
        }
    }

    private button_help(event,customData) {
        if(customData == "hide"){
            let wordbg = event.target.parent.getChildByName("helpBtn").getChildByName("wordbg")
            wordbg.active = false
        }
        else if(customData == "helpBtn"){   
            let wordbg = event.target.getChildByName("wordbg")
            wordbg.active = !wordbg.active
        }
    }
}
