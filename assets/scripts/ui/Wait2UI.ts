import { GameDataManager } from './../../framework/Manager/GameDataManager';
import { StringData } from './../data/StringData';
import { GameManager } from './../GameManager';
import { BaseUI } from "../../framework/UI/BaseUI";
import { LogWrap } from "../../framework/Utils/LogWrap";
import * as GameConstValue from "../data/GameConstValue";
import { UIManager } from "../../framework/Manager/UIManager";
import { LoginUI } from './LoginUI';

const { ccclass, property } = cc._decorator;

@ccclass
export class Wait2UI extends BaseUI {

    protected static className = "Wait2UI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_SYSTEM_DIR + this.className;
    }

    @property(cc.Label)
    tileLabel: cc.Label = null;

    @property(cc.Node)
    nodeWait: cc.Node = null;

    onLoad() {
      
    }

    public onReconnect()
    {
        this.node.getChildByName("desc").getComponent(cc.Label).string = "重连中,请稍后..."
        this.node.getChildByName("sp_wait").runAction(cc.repeatForever(cc.rotateBy(1, 360)));
        this.schedule(this.onReconnectTimeOut, 10, 1)
    }   

    private onReconnectTimeOut()
    {
        this.unschedule(this.onReconnectTimeOut)
        GameDataManager.getInstance().loginInfoData.deleteLoginInfo();
        UIManager.getInstance().closeAllExceptOpenUI(null)
        UIManager.getInstance().openUI(LoginUI, 0)
        GameManager.getInstance().openStrongTipsUI("重连超时，请重新登录",  () => { });
        UIManager.getInstance().closeUI(Wait2UI);
    }

    public onReconnectFailed()
    {
        GameDataManager.getInstance().loginInfoData.deleteLoginInfo();
        UIManager.getInstance().closeAllExceptOpenUI(null)
        UIManager.getInstance().openUI(LoginUI, 0)
        UIManager.getInstance().closeUI(Wait2UI);
    }

    public onReconnectSuccess()
    {
        this.unschedule(this.onReconnectTimeOut)
        UIManager.getInstance().closeUI(Wait2UI);
    }

    public onWait(title = "请等候", waitTimeOut = 5)
    {
        this.node.getChildByName("desc").getComponent(cc.Label).string = title
        this.node.getChildByName("sp_wait").runAction(cc.repeatForever(cc.rotateBy(1, 360)));
        this.schedule(this.onWaitTimeOut, waitTimeOut, 1)
    }

    public onWaitTimeOut()
    {
        this.unschedule(this.onWaitTimeOut)
        UIManager.getInstance().closeUI(Wait2UI);
    }

    stopWait()
    {
        this.unschedule(this.onWaitTimeOut)
        UIManager.getInstance().closeUI(Wait2UI);
    }

    // onShow() {
    //     let fn = function () {
    //         UIManager.getInstance().closeUI(WaitUI);
    //     }
    //     setTimeout(fn, 5000);
    // }

    // start() {
    //     let fn = function () {
    //         UIManager.getInstance().closeUI(WaitUI);
    //     }
    //     setTimeout(fn, 5000);
    // }

}
