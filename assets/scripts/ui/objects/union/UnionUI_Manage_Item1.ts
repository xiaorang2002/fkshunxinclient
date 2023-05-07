import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { StringData } from './../../../data/StringData';
import { UnionUI_Manage } from './UnionUI_Manage';
import { UnionUI_Score_Record } from './UnionUI_Score_Record';
import { ClubKeyboardUI } from './../club/ClubKeyboardUI';
import { GameManager } from './../../../GameManager';
import { UnionUI_Score } from './UnionUI_Score';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { Utils } from './../../../../framework/Utils/Utils';
import { CLUB_POWER } from "../../../data/club/ClubData";
import * as  Proto from "../../../../proto/proto-min";

const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Manage_Item1 extends cc.Component {


    private _clubId: number = 0;
    private _playerId: number = 0;
    private _info = null;
    private _cruSelectId = 0
    private _playerName = ""

    @property(cc.Sprite)
    spHead: cc.Sprite = null;
    @property(cc.Sprite)
    spItem: cc.Sprite = null;
    @property(cc.Label)
    labelStatus: cc.Label = null;

    setInfo( type, iClub, info, selectId = 0)
    {
        var clubData = GameDataManager.getInstance().clubData;
        this._info = info
        this._cruSelectId = selectId
        this._playerName = info.nickname
        this.setId(iClub, info.guid);
        this.setNameHead(info.icon, info.nickname);
        if(type == "member")
        {
            this.node.getChildByName("node_member").getChildByName("label_score").getComponent(cc.Label).string = (this._info.money/100.0).toString()       // 积分
        }
        else
            this.updateGroupInfo();
        this.node.getChildByName("node_member").active = type == "member";
        this.node.getChildByName("node_partner").active = type == "partner";
        this.node.getChildByName("node_partner").getChildByName("btn_jinjie").active = info.parent == GameDataManager.getInstance().userInfoData.userId;
        if (clubData.roleType == CLUB_POWER.CRT_ADMIN && clubData.roleType <= info.roleType)
        {
            this.node.getChildByName("node_member").getChildByName("btn_add").active = false;
            this.node.getChildByName("node_member").getChildByName("btn_reduce").active = false;
            if(info.roleType == CLUB_POWER.CRT_BOSS)
            {
                this.node.getChildByName("node_member").getChildByName("btn_rizhi").active = false;
            }
        }
        if (this._playerId == GameDataManager.getInstance().userInfoData.userId || selectId == this._playerId)
        {
            this.node.getChildByName("node_member").getChildByName("btn_add").active = false;
            this.node.getChildByName("node_member").getChildByName("btn_reduce").active = false;
            this.node.getChildByName("node_partner").getChildByName("btn_add").active = false;
            this.node.getChildByName("node_partner").getChildByName("btn_reduce").active = false;
            this.node.getChildByName("node_partner").getChildByName("btn_member").active = false;
            this.node.getChildByName("node_partner").getChildByName("btn_partner").active = false;
            this.node.getChildByName("node_partner").getChildByName("btn_jinjie").active = false;
        }
    }

    
    updateGroupInfo() // 合伙人信息
    {
        var data = JSON.parse(this._info.extra)
        var money = this._info.money
        if (this._info.teamMoney)
            money += this._info.teamMoney
        if (this._info.isSearch)
        {
            this.node.getChildByName("node_partner").getChildByName("label_jj").getComponent(cc.Label).string = "-" 
            this.node.getChildByName("node_partner").getChildByName("label_score_group").getComponent(cc.Label).string = (money/100.0).toString()
            this.node.getChildByName("node_partner").getChildByName("label_score_single").getComponent(cc.Label).string = (this._info.money/100).toString() 
            this.node.getChildByName("node_partner").getChildByName("label_commission").getComponent(cc.Label).string = (this._info.commission/100).toString() 
            return
        }
        var parentGuid = 0
        var targetGuid = 0
        try{
            if (this._info.parentInfo.guid)
                parentGuid = this._info.parentInfo.guid
            if (this._info.guid)
                targetGuid = this._info.guid
        }
        catch(e){}
        if (parentGuid == GameDataManager.getInstance().userInfoData.userId || targetGuid == GameDataManager.getInstance().userInfoData.userId)
        {
            var credit = 0
            if (data.conf)
                credit = data.conf.credit
            if (!credit)
                var des = "警戒值:0"
            else
                var des = (credit/100).toString()
            this.node.getChildByName("node_partner").getChildByName("label_jj").getComponent(cc.Label).string = des     // 警戒

        }
        else
            this.node.getChildByName("node_partner").getChildByName("label_jj").getComponent(cc.Label).string = "-" 
        this.node.getChildByName("node_partner").getChildByName("label_score_single").getComponent(cc.Label).string = (this._info.money/100.0).toString()       // 积分
        this.node.getChildByName("node_partner").getChildByName("label_score_group").getComponent(cc.Label).string = (money/100).toString() 
        this.node.getChildByName("node_partner").getChildByName("label_commission").getComponent(cc.Label).string = (this._info.commission/100.0).toString() 
    }


    //设置id
    public setId(clubid: number, pid: number) {
        this._clubId = clubid;
        this._playerId = pid;
        this.node.getChildByName("label_id").getComponent(cc.Label).string = pid.toString()
    }

    //设置头像
    public setNameHead(headurl: string, name: string) {
        if(headurl && headurl != ''){
            Utils.loadTextureFromNet(this.spHead, headurl);
        }      
        this.node.getChildByName("label_name").getComponent(cc.Label).string = Utils.getShortName(name,10);
    }

    public getPartnerId(){
        return this._playerId
    }

    public updateJinJie(value){
        this.node.getChildByName("node_partner").getChildByName("label_jj").getComponent(cc.Label).string = (value/100).toString();
    }

    button_mem()
    {
        AudioManager.getInstance().playSFX("button_click");
        if(UIManager.getInstance().getUI(UnionUI_Manage))
            UIManager.getInstance().getUI(UnionUI_Manage).getComponent("UnionUI_Manage").reqPartnerMemberInfo(this._playerId, this._playerName, "member")
    }

    button_partner()
    {
        AudioManager.getInstance().playSFX("button_click");
        if(UIManager.getInstance().getUI(UnionUI_Manage))
            UIManager.getInstance().getUI(UnionUI_Manage).getComponent("UnionUI_Manage").reqPartnerMemberInfo(this._playerId, this._playerName, "partner")
    }


    button_score(event, customEventData)
    {
        AudioManager.getInstance().playSFX("button_click");
        var type = parseInt(customEventData)
        if (!this._info)
            return
        var data = {money: this._info.money, guid: this._info.guid}
        UIManager.getInstance().openUI(UnionUI_Score, 8, () => { 
            UIManager.getInstance().getUI(UnionUI_Score).getComponent("UnionUI_Score").initView(type, data);})
    }

    button_jinjie(event, customEventData) // 警戒
    {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(ClubKeyboardUI, 20, () => {
            UIManager.getInstance().getUI(ClubKeyboardUI).getComponent("ClubKeyboardUI").initView(2, {partnerId:this._playerId})
        })
    }

    button_convert(){
        if (this._info && this._info.commission <= 0)
        {
            GameManager.getInstance().openWeakTipsUI("业绩为0，不可兑换");
            return
        }
        var clubData = GameDataManager.getInstance().clubData;
        var clubId = clubData.curSelectClubId
        let surefun = () => {
            MessageManager.getInstance().messageSend(Proto.C2S_EXCHANGE_CLUB_COMMISSON_REQ.MsgID.ID, {clubId: clubId, count: -1, partnerId:this._playerId});
        };
        let closefun = () => {
            
        };
        GameManager.getInstance().openSelectTipsUI("将组长【"+ Utils.getShortName(this._playerName,10)+"】的业绩全部兑换？", surefun, closefun);
    }

    button_rizhi(event, customEventData) // 日志
    {
        AudioManager.getInstance().playSFX("button_click");
        if (!this._info)
            return
        UIManager.getInstance().openUI(UnionUI_Score_Record, 5, () => {
            UIManager.getInstance().getUI(UnionUI_Score_Record).getComponent("UnionUI_Score_Record").initView(this._playerId,this._playerName)
        })
    }

}

