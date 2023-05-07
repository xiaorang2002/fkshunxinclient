import { ClubRecordUI } from './ClubRecordUI';
import { BaseUI, UIClass } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { MessageManager } from "../../../../framework/Manager/MessageManager";
import * as Proto from "../../../../proto/proto-min";
import { Utils } from "../../../../framework/Utils/Utils";
import { CLUB_POWER } from "../../../data/club/ClubData";
import { ClubMemberPlyaerInfoUI } from "./ClubMemberPlyaerInfoUI";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import { AudioManager } from "../../../../framework/Manager/AudioManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class ClubMemberItem extends BaseUI {

    protected static className = "ClubMemberItem";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_CLUB_DIR + this.className;
    }

    private _clubId: number = 0;
    private _playerId: number = 0;
    private _reqId: number = 0;
    private _itemId: number = 0;
    private _info = null;
    public get itemID(): number {
        return this._itemId;
    }
    public set itemID(value: number) {
        this._itemId = value;
    }

    @property(cc.Sprite)
    spHead: cc.Sprite = null;
    @property(cc.Label)
    labelId: cc.Label = null;
    @property(cc.Label)
    labelName: cc.Label = null;
    @property(cc.Sprite)
    spItem: cc.Sprite = null;
    @property(cc.Node)
    nodeNoPlay: cc.Node = null;
    @property(cc.Node)
    btnYes: cc.Node = null;
    @property(cc.Node)
    btnNo: cc.Node = null;
    @property(cc.Node)
    btnOp: cc.Node = null;
    @property(cc.Node)
    btnRecord: cc.Node = null;
    @property(cc.Label)
    labelStatus: cc.Label = null;
    onLoad() {

    }

    public setInfo(idx, type, iClub, info)
    {
        this.itemID = idx
        this._info = info
        // this.setIdx()
        this.setId(iClub, info.guid);
        this.setNameHead(info.icon, info.nickname);
        // this.setTime(info.time);
        if (info.isApply){
            this._reqId = info.reqId
            this.setapplyType();
            // this.node.getChildByName("label_ju1").active = false
            // this.node.getChildByName("label_ju2").active = false
        }
        else
        {
            // var data = JSON.parse(this._info.extra)
            // var tempInfo = [{date:0,commission:0,play_count:0}, {date:0,commission:0,play_count:0}]
            // var todayTime = Math.floor(new Date(new Date().toLocaleDateString()).getTime()/1000)
            // if (Array.isArray(data.logs))
            // {
            //     tempInfo = data.logs.sort(function (a, b) {return a.date - b.date})
            //     if (tempInfo.length == 1 && tempInfo[0].date < todayTime)
            //     {
            //         tempInfo.push({date:todayTime,commission:0,play_count:0})
            //     }
            //     else if (tempInfo.length == 1 && tempInfo[0].date >= todayTime)
            //     {
            //         tempInfo = [{date:todayTime,commission:0,play_count:0}, {date:tempInfo[0].date,commission:tempInfo[0].commission,play_count:tempInfo[0].play_count}]
            //     }
            // }
            // this.node.getChildByName("label_ju1").getComponent(cc.Label).string = tempInfo[1].play_count.toString()       // 今日局数 
            // this.node.getChildByName("label_ju2").getComponent(cc.Label).string = tempInfo[0].play_count.toString()         // 昨日局数
            this.setType(info.roleType);
        }
    }

    // setIdx()
    // {
    //     if(this.itemID%2 == 0)
    //         var isSp = true
    //     else
    //         var isSp = false
    //     this.node.getChildByName("sp_bg").active = !isSp
    // }

    //设置头像
    public setNameHead(headurl: string, name: string) {
        if(headurl && headurl != ""){
            Utils.loadTextureFromNet(this.spHead, headurl);
        }
        this.labelName.string = Utils.getShortName(name);
    }

    // 隐藏管理按钮
    openOp()
    {
        this.btnOp.active = true;
    }

    //设置id
    public setId(clubid: number, pid: number) {
        this._clubId = clubid;
        this._playerId = pid;
        this.labelId.string = "ID：" + pid;
    }

    public setManager(isManager)
    {
        return
    }

    // //设置时间
    // setTime(time) {
    //     if (time == 0) {
    //         this.labelTime.node.color = new cc.Color(49, 164, 23);
    //         this.labelTime.string = "在 线";
    //     }
    //     else if (time == -1) {
    //         this.labelTime.node.color = new cc.Color(158, 124, 23);
    //         this.labelTime.string = "牌桌内";
    //     }
    //     else {
    //         this.labelTime.node.color = new cc.Color(239, 96, 40);
    //         this.labelTime.string = this.labelTime.string = Utils.getTimeDifference(time * 1000);
    //     }

    // }

    //设置类型 
    //CRT_PLAYER = 1; //普通成员
    //CRT_partner = 2;  //合伙人
    //CRT_ADMIN = 3;  //管理员
    // CRT_BOSS = 4;   //创建者，老板
    //type 对应玩家权限
    //isapply 是否为申请的玩家
    //admin 自己在群中的权限
    setType(type) {
        //添加标签
        var clubData = GameDataManager.getInstance().clubData;
        //是否禁玩
        if (this._info.isStopGame)
            this.nodeNoPlay.active = true;
        else
            this.nodeNoPlay.active = false;
        //管理员
        var clubData = GameDataManager.getInstance().clubData;
        if (clubData.roleType >= CLUB_POWER.CRT_PRATNER) {
            this.btnYes.active = false;
            this.btnNo.active = false;
            this.btnOp.active = true;
            this.btnRecord.active = true;
        }
        else {
            this.btnYes.active = false;
            this.btnNo.active = false;
            this.btnOp.active = false;
            this.btnRecord.active = false;
        }

        if (this._playerId == GameDataManager.getInstance().userInfoData.userId){
            this.btnYes.active = false;
            this.btnNo.active = false;
            this.btnOp.active = false;
            this.btnRecord.active = false;
            this.setRoleIcon(clubData.roleType)
        }
        else{
            this.setRoleIcon(type)
        }
    }

    setRoleIcon(type)
    {
        this.spItem.node.active = true;
        var clubData = GameDataManager.getInstance().clubData;
        if (type == CLUB_POWER.CRT_BOSS) {
            if (clubData.clubType == 0) // 亲友群
                this.labelStatus.string = "群 主"
            else // 联盟
                this.labelStatus.string = "盟 主"
        }
        else if (type == CLUB_POWER.CRT_PRATNER) // 合伙人
            this.labelStatus.string = "合伙人"
        else if (type == CLUB_POWER.CRT_ADMIN)
            this.labelStatus.string = "管理员"
        else
            this.spItem.node.active = false;
    }

    setapplyType()
    {
        this.btnYes.active = true;
        this.btnNo.active = true;
        this.btnOp.active = false;
        this.nodeNoPlay.active = false;
        this.spItem.node.active = false;

    }



    //同意
    button_yes(event) {
        AudioManager.getInstance().playSFX("button_click");
        let msg =
        {
            clubId: this._clubId,
            targetId: this._playerId,
            op: 10,
            requestId: this._reqId
        }
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_OP_REQ.MsgID.ID, msg);
    }

    //拒绝
    button_no(event) {
        AudioManager.getInstance().playSFX("button_click");
        let msg =
        {
            clubId: this._clubId,
            targetId: this._playerId,
            op: 11,
            requestId: this._reqId,
        }
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_OP_REQ.MsgID.ID, msg);
    }

    //添加按钮
    button_add(event) {
        AudioManager.getInstance().playSFX("button_click");
        let msg =
        {
            clubId: this._clubId,
            playerId: this._playerId,
        }
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_ADD_PLAYER_REQ.MsgID.ID, msg);
    }

    //操作按钮
    button_check_info(event) {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(ClubMemberPlyaerInfoUI, 2, () => {
            UIManager.getInstance().getUI(ClubMemberPlyaerInfoUI).getComponent("ClubMemberPlyaerInfoUI").updateShow(this._info)
        });
    }

    button_recore() {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().openUI(ClubRecordUI, 30, () => {
            UIManager.getInstance().getUI(ClubRecordUI).getComponent("ClubRecordUI").setQueryPlayerInfo(this._info.guid,this._info.nickname, this._info.icon)
            UIManager.getInstance().getUI(ClubRecordUI).getComponent("ClubRecordUI").updateView()
        })
    }
}

