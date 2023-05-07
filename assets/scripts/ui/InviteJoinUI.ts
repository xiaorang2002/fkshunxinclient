import { GameManager } from './../GameManager';
import { GameDataManager } from './../../framework/Manager/GameDataManager';
import { AudioManager } from './../../framework/Manager/AudioManager';
import { MessageManager } from './../../framework/Manager/MessageManager';
import { Utils } from './../../framework/Utils/Utils';
import { BaseUI } from "../../framework/UI/BaseUI";
import * as GameConstValue from "../data/GameConstValue";
import { LogWrap } from "../../framework/Utils/LogWrap";
import { UIManager } from "../../framework/Manager/UIManager";
import * as Proto from "../../proto/proto-min";

const { ccclass, property } = cc._decorator;

@ccclass
export class InviteJoinUI extends BaseUI {

    protected static className = "InviteJoinUI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_SYSTEM_DIR + this.className;
    }

    @property(cc.Sprite)
    spHead: cc.Sprite = null;

    @property(cc.Label)
    label1: cc.Label = null;

    @property(cc.Label)
    label2: cc.Label = null;

    private tableId = 0;
    private rule = ""
    private time = 15


    updateView(info) {
        this.tableId = info.table.tableId;
        if(info.inviter.icon && info.inviter.icon != ''){
            Utils.loadTextureFromNet(this.spHead, info.inviter.icon);
        }  
        this.label1.string = "【"+info.inviter.nickname+"】邀请您一起游戏"
        this.rule = info.table.rule
        this.label2.string = "本局玩法：" + Utils.getBase(info.table) + " " + Utils.getRule(info.table)
        this.unschedule(this.loop)
        this.time = 15
        this.node.getChildByName("time").getComponent(cc.Label).string =  this.time + "s"
        this.schedule(this.loop, 1, 15);
        try
        {
            var isNotPremitInviteBy5 = cc.sys.localStorage.getItem("isNotPremitInviteBy5");
            var nowTime = new Date().getTime()
            if (isNotPremitInviteBy5 && nowTime - parseInt(isNotPremitInviteBy5)  < 300*1000)
                this.node.getChildByName("select").getChildByName("checkmark").active = true
            else
                this.node.getChildByName("select").getChildByName("checkmark").active = false
        }
        catch (e)
        {
            this.node.getChildByName("select").getChildByName("checkmark").active = false
        }
    }

    loop()
    {   
        if (this.time > 0)
        {
            this.time -= 1
            this.node.getChildByName("time").getComponent(cc.Label).string =  this.time + "s"
        }
        else
        {
            this.unschedule(this.loop)
            UIManager.getInstance().closeUI(InviteJoinUI);
        }
    }

    button_join() {
        AudioManager.getInstance().playSFX("button_click")
        if (this.tableId == 0)
            return
        if (GameDataManager.getInstance().isJoinRoom){
            GameManager.getInstance().openWeakTipsUI("加入房间中，请稍后");
            return
        }
        var oRule = JSON.parse(this.rule)
        if (oRule.option.gps_distance > 0){
            if (!Utils.checkGps())
                return
        }
        UIManager.getInstance().closeUI(InviteJoinUI);
        let msg =
        {
            tableId: this.tableId,
        }
        GameDataManager.getInstance().isJoinRoom = true
        MessageManager.getInstance().messageSend(Proto.CS_JoinRoom.MsgID.ID, msg);
    }

    button_cancel() {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().closeUI(InviteJoinUI);
    }

    private button_permit_invite()
    {
        AudioManager.getInstance().playSFX("button_click");
        var active = this.node.getChildByName("select").getChildByName("checkmark").active
        this.node.getChildByName("select").getChildByName("checkmark").active = !active
        var isNotPremitInvite = 0
        if (!active)
            isNotPremitInvite = new Date().getTime()
        cc.sys.localStorage.setItem("isNotPremitInviteBy5", isNotPremitInvite);
    }

}
