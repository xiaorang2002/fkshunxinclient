import { ClubRecordUI } from './../club/ClubRecordUI';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { GameManager } from './../../../GameManager';
import { BaseUI, UIClass } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { MessageManager } from "../../../../framework/Manager/MessageManager";
import * as Proto from "../../../../proto/proto-min";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import { ListenerManager } from "../../../../framework/Manager/ListenerManager";
import { Utils } from "../../../../framework/Utils/Utils";
import { CLUB_POWER } from "../../../data/club/ClubData";
import { UIManager } from "../../../../framework/Manager/UIManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Member_Info extends BaseUI {

    protected static className = "UnionUI_Member_Info";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_UNION + this.className;
    }

    @property(cc.Label)
    label_name: cc.Label = null;
    @property(cc.Sprite)
    spHead: cc.Sprite = null;
    @property(cc.Label)
    label_id: cc.Label = null;
    @property(cc.RichText)
    label_parent: cc.RichText = null;

    @property(cc.Node)
    button_add_admin: cc.Node = null;
    @property(cc.Node)
    button_remove_admin: cc.Node = null;
    @property(cc.Node)
    button_add_partner: cc.Node = null;
    @property(cc.Node)
    button_remove_partner: cc.Node = null;
    @property(cc.Node)
    button_del: cc.Node = null;
    @property(cc.Node)
    button_cancel: cc.Node = null;

    private curType: any = null;
    private memberInfo = null

    public initView(type,info): void {
        var clubData = GameDataManager.getInstance().clubData;
        this.memberInfo = info
        this.curType = type
        if (type == "record")
        {
            this.setId(info.guid, info.parentInfo);
            this.setNameHead(info.icon, info.nickname);
            this.node.getChildByName("btn_record").active = false
            this.node.getChildByName("layout_btn").active = false
            this.node.getChildByName("search_title").active = true
            this.node.getChildByName("title").active = false
            return
        }

        if (clubData.roleType >= CLUB_POWER.CRT_PRATNER)
        {
            if (info.roleType == CLUB_POWER.CRT_ADMIN && clubData.roleType == CLUB_POWER.CRT_BOSS)
            {
                this.button_add_admin.active = false
                this.button_add_partner.active = false
                this.button_remove_partner.active = false
            }
            else if (info.roleType >= CLUB_POWER.CRT_ADMIN && clubData.roleType == CLUB_POWER.CRT_ADMIN) //双方都是管理员
            {
                this.node.active = false
            }
            else if (info.roleType == CLUB_POWER.CRT_PRATNER)
            {
                this.button_add_admin.active = false
                this.button_remove_admin.active = false
                this.button_add_partner.active = false 
                this.button_del.active = false 
            }
            else
            {
                this.button_remove_admin.active = false
                this.button_remove_partner.active = false
            }
            if (clubData.roleType != CLUB_POWER.CRT_BOSS){
                this.button_add_admin.active = false
                this.button_remove_admin.active = false
                if (clubData.roleType == CLUB_POWER.CRT_ADMIN)
                {
                    this.button_add_partner.active = false
                    this.button_remove_partner.active = false
                }
            }
            if (GameDataManager.getInstance().userInfoData.userId != info.parent)
            {
                this.button_remove_partner.active = false
                this.button_add_partner.active = false
                this.button_add_admin.active = false
                this.button_remove_admin.active = false
                if (clubData.roleType == CLUB_POWER.CRT_BOSS && info.roleType == CLUB_POWER.CRT_PRATNER)
                    this.button_remove_partner.active = true
               
            }else{
                if(info.roleType == CLUB_POWER.CRT_PLAYER)
                {
                    if(info.cansetpartner)
                    {
                        this.button_add_partner.active = true
                    }else{
                        this.button_add_partner.active = false
                    }
                }
            }

           

          
        }

      

      

        if (info.isStopGame)
        {
            this.button_cancel.active = (clubData.roleType == CLUB_POWER.CRT_BOSS || clubData.roleType == CLUB_POWER.CRT_ADMIN)
            this.node.getChildByName("layout_btn").getChildByName("btn_stop").active = false
        }
        else
        {
            this.button_cancel.active = false
            this.node.getChildByName("layout_btn").getChildByName("btn_stop").active = true
        }
        this.setId(info.guid, info.parentInfo);
        this.setNameHead(info.icon, info.nickname);
    }


    //设置id
    public setId(pid: number, parent) {
        this.label_id.string = pid.toString()
        if (parent)
            this.label_parent.string = "<color=#83582D>"+"" +Utils.getShortName(parent.nickname,10)+"</c><color=#A38158>"+"("+parent.guid+")"+"</color>"
        else
            this.label_parent.string = ""
    }

    //设置头像
    public setNameHead(headurl: string, name: string) {
        Utils.loadTextureFromNet(this.spHead, headurl);
        this.label_name.string = ""+Utils.getShortName(name, 10);
    }

    btn_close() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().closeUI(UnionUI_Member_Info);

    }

    btn_add_admin()
    {
        this.sendmsg(3)
    }

    btn_remove_admin()
    {
        this.sendmsg(4)
    }

    btn_fengting()
    {
        this.sendmsg(7)

    }

    btn_cancel_fengting()
    {
        this.sendmsg(8)

    }

    btn_stop()
    {
        this.sendmsg(1)
    }

    // 踢出联盟 
    btn_del()
    {
        if (this.curType != "player")// 踢联盟
        {
            if(this.memberInfo.roleType >= CLUB_POWER.CRT_PRATNER)
            {
                GameManager.getInstance().openWeakTipsUI("请先解除职务之后再踢出");
                return  
            }
            this.sendmsg(9)
        }
        else // 踢玩家
        {
            if(this.memberInfo.roleType >= CLUB_POWER.CRT_PRATNER)
            {
                GameManager.getInstance().openWeakTipsUI("请先解除职务之后再踢出");
                return  
            }
            this.sendmsg(9)
        }
    }

    // 取消禁止游戏
    btn_cancel()
    {
        this.sendmsg(2)
    }
    
    // 添加合伙人
    btn_add_partner()
    {
        this.sendmsg(5)
    }

    // 移除合伙人
    btn_remove_partner()
    {
        this.sendmsg(6)
    }


    sendmsg(op)
    {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().closeUI(UnionUI_Member_Info);
        if (op == 7 || op == 8)
        {
            var clubData = GameDataManager.getInstance().clubData;
            MessageManager.getInstance().messageSend(Proto.C2S_CLUB_OP_REQ.MsgID.ID, {
                clubId: clubData.curSelectClubId,
                targetId: this.memberInfo.clubId,
                op:op
            })
        }
        else
        {
            var clubData = GameDataManager.getInstance().clubData;
            MessageManager.getInstance().messageSend(Proto.C2S_CLUB_OP_REQ.MsgID.ID, {
                clubId: clubData.curSelectClubId,
                targetId: this.memberInfo.guid,
                op:op
            })
        }
    }

    button_recore() {
        AudioManager.getInstance().playSFX("button_click")
        var guid = this.memberInfo.guid
        var nickName = this.memberInfo.nickname
        var icon = this.memberInfo.icon
        UIManager.getInstance().closeUI(UnionUI_Member_Info);
        UIManager.getInstance().openUI(ClubRecordUI, 30, () => {
            UIManager.getInstance().getUI(ClubRecordUI).getComponent("ClubRecordUI").setQueryPlayerInfo(guid,nickName, icon)
            UIManager.getInstance().getUI(ClubRecordUI).getComponent("ClubRecordUI").updateView()
        })
    }

}