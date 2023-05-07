import { ClubMemberUI_New } from './ClubMemberUI_New';
import { UnionUI_Member_Info } from './../union/UnionUI_Member_Info';
import { MessageManager } from "../../../../framework/Manager/MessageManager";
import * as Proto from "../../../../proto/proto-min";
import { Utils } from "../../../../framework/Utils/Utils";
import { CLUB_POWER } from "../../../data/club/ClubData";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import { AudioManager } from "../../../../framework/Manager/AudioManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class ClubMemberItem_New extends cc.Component {

    private _clubId: number = 0;
    private _playerId: number = 0;
    private _reqId: number = 0;
    private _itemId: number = 0;
    private _info = null;
    private _curSelectId = 0
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
    labelRole: cc.Sprite = null;
    @property(cc.Label)
    labelNum: cc.Label = null;
    @property(cc.Label)
    labelStatus: cc.Label = null;
    @property(cc.Label)
    labelParentId: cc.Label = null;
    @property(cc.Label)
    labelParentName: cc.Label = null;
    @property(cc.Label)
    labelOnline: cc.Label = null;
    @property(cc.Node)
    btnOp1: cc.Node = null;
    @property(cc.Node)
    btnOp2: cc.Node = null;
    @property(cc.Node)
    btnMem: cc.Node = null;
    @property(cc.Node)
    btnPartner: cc.Node = null;
    @property({type:[cc.SpriteFrame]})
    memberSp:Array<cc.SpriteFrame> = []
    onLoad() {

    }

    public setInfo(idx, type, iClub, info, selectPlayer)
    {
        this.itemID = idx
        this._info = info
        this._curSelectId = selectPlayer
        this.setId(iClub, info.guid);
        this.setNameHead(info.icon, info.nickname);
        if (info.isApply){
            this._reqId = info.reqId
        }
        else
        {
            this.setType(info.roleType);
            
            if (info.parentInfo)
            {  
                this.labelParentId.string = info.parentInfo.guid.toString();
                this.labelParentName.string = Utils.getShortName(info.parentInfo.nickname, 10);
            }
            if (type == "member")
            {
                var desc = "在线"
                var color = new cc.Color(1, 146, 2)
                var data = JSON.parse(this._info.extra)

                if (data && data.logout_time)
                {
                    desc =  Utils.getTimeDifference(data.logout_time * 1000)
                    color = new cc.Color(97, 61, 30)
                }
                this.labelOnline.string = desc
                this.labelOnline.node.color = color
            }
            else
            {
                this.btnPartner.active = this._playerId != selectPlayer;
                var playerNum = 0
                var data = JSON.parse(this._info.extra)
                if (data && data.info && data.info.player_count)
                    playerNum = data.info.player_count
                this.labelNum.string = playerNum + "人"
            }
        }
        this.node.getChildByName("node_"+type).active = true;
    }

    //设置头像
    public setNameHead(headurl: string, name: string) {
        if(headurl && headurl != ""){
            Utils.loadTextureFromNet(this.spHead, headurl);
        }
        this.labelName.string = Utils.getShortName(name, 10);
    }

    //设置id
    public setId(clubid: number, pid: number) {
        this._clubId = clubid;
        this._playerId = pid;
        this.labelId.string = pid.toString();
    }

    public setManager(isManager)
    {
        return
    }


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
        var statusStr = "正常"
        //是否禁玩
        if (this._info.isStopGame)
            statusStr = "禁止";
        this.labelStatus.string = statusStr
        this.setRoleInfo(type)
        //管理员
        var clubData = GameDataManager.getInstance().clubData;
        if (clubData.roleType >= CLUB_POWER.CRT_PRATNER) {
            this.btnOp1.active = true;
            this.btnOp2.active = true;
        }
        else {
            this.btnOp1.active = false;
            this.btnOp2.active = false;
        }

        if (this._playerId == GameDataManager.getInstance().userInfoData.userId){
            this.btnOp1.active = false;
            this.btnOp2.active = false;
            this.btnMem.active = false;
            this.btnPartner.active = false;
        }
        if (clubData.roleType >= CLUB_POWER.CRT_ADMIN && type == CLUB_POWER.CRT_BOSS)
        {
            this.btnOp1.active = false;
            this.btnOp2.active = false;
        }
    }

    setRoleInfo(type)
    {
        var clubData = GameDataManager.getInstance().clubData;
        var roleStr = 0
     
        if (type == CLUB_POWER.CRT_BOSS) {
            if (clubData.clubType == 0) // 亲友群
                roleStr = 1
            else // 联盟
                roleStr = 2
        }
        else if (type == CLUB_POWER.CRT_PRATNER) // 合伙人
        {
            roleStr = 3
        }
        else if (type == CLUB_POWER.CRT_ADMIN)
        {
            roleStr = 4
        }
        this.labelRole.spriteFrame = this.memberSp[roleStr]
      
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

    button_member()
    {
        AudioManager.getInstance().playSFX("button_click");
        if (UIManager.getInstance().getUI(ClubMemberUI_New))
        {
            UIManager.getInstance().getUI(ClubMemberUI_New).getComponent("ClubMemberUI_New").updateListByItemClick("member", this._playerId, this.labelName.string)
        }
    }

    button_partner()
    {
        AudioManager.getInstance().playSFX("button_click");
        if (UIManager.getInstance().getUI(ClubMemberUI_New))
        {
            UIManager.getInstance().getUI(ClubMemberUI_New).getComponent("ClubMemberUI_New").updateListByItemClick("partner", this._playerId, this.labelName.string)
        }
    }

    //操作按钮
    button_check_info(event) {
        AudioManager.getInstance().playSFX("button_click");
        if (this._playerId == GameDataManager.getInstance().userInfoData.userId)
            return
        UIManager.getInstance().openUI(UnionUI_Member_Info, 30, () => { 
            UIManager.getInstance().getUI(UnionUI_Member_Info).getComponent("UnionUI_Member_Info").initView("union", this._info);})
    }
   
}

