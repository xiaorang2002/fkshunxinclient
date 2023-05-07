import { UnionUI_Member_Info } from './UnionUI_Member_Info';
import { UnionUI_Daily_Record } from './UnionUI_Daily_Record';
import { UnionUI_Statistics } from './UnionUI_Statistics';
import { ClubKeyboardUI } from './../club/ClubKeyboardUI';
import { GameManager } from './../../../GameManager';
import { ClubGroupUI } from './../club/ClubGroupUI';
import { UnionUI_Score } from './UnionUI_Score';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { Utils } from './../../../../framework/Utils/Utils';
import { CLUB_POWER } from "../../../data/club/ClubData";

const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Member_Item extends cc.Component {


    private _itemId: number = 0;
    public get itemID(): number {
        return this._itemId;
    }
    public set itemID(value: number) {
        this._itemId = value;
    }

    private _clubId: number = 0;
    private _playerId: number = 0;
    private _info = null;
    private _cruSelectId = 0

    @property(cc.Sprite)
    spHead: cc.Sprite = null;
    @property(cc.Sprite)
    spItem: cc.Sprite = null;
    @property(cc.Label)
    labelStatus: cc.Label = null;

    setInfo(idx, type, iClub, info, selectId = 0)
    {
        var clubData = GameDataManager.getInstance().clubData;
        this.itemID = idx
        this._info = info
        this._cruSelectId = selectId
        this.setId(iClub, info.guid);
        this.setNameHead(info.icon, info.nickname);
        if(type == "member")
            this.updateMemberInfo();
        else
            this.updateGroupInfo();
        this.node.getChildByName("node_mem").active = type == "member";
        this.node.getChildByName("node_group").active = type == "group";
        this.node.getChildByName("node_group").getChildByName("btn_jijie").active = info.parent == GameDataManager.getInstance().userInfoData.userId;
        if (this._info.isStopGame)
            this.node.getChildByName("sp_stop").active = true;
        else
            this.node.getChildByName("sp_stop").active = false;
        if (clubData.roleType == CLUB_POWER.CRT_ADMIN && clubData.roleType <= info.roleType)
        {
            this.node.getChildByName("node_mem").getChildByName("btn_add").active = false;
            this.node.getChildByName("node_mem").getChildByName("btn_reduce").active = false;
            if(info.roleType == CLUB_POWER.CRT_BOSS)
            {
                this.node.getChildByName("node_mem").getChildByName("btn_rizhi").active = false;
                this.node.getChildByName("node_mem").getChildByName("btn_tongji").active = false;
            }
        }
        if (this._playerId == GameDataManager.getInstance().userInfoData.userId || selectId == this._playerId)
        {
            this.setRoleIcon(info.roleType)
            this.node.getChildByName("node_mem").getChildByName("btn_add").active = false;
            this.node.getChildByName("node_mem").getChildByName("btn_reduce").active = false;
            this.node.getChildByName("node_group").getChildByName("btn_mem").active = false;
            this.node.getChildByName("node_group").getChildByName("btn_jijie").active = false;
            this.node.getChildByName("node_group").getChildByName("btn_partner").active = false;
        }
        else
            this.setRoleIcon(info.roleType)
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

    updateMemberInfo() // 成员信息
    {
        if (this._info.isSearch)
        {
            // this.node.getChildByName("node_mem").getChildByName("label_ju1").getComponent(cc.Label).string = "-"       // 昨日局数
            // this.node.getChildByName("node_mem").getChildByName("label_ju2").getComponent(cc.Label).string = "-"        // 今日局数
            // this.node.getChildByName("node_mem").getChildByName("label_gx1").getComponent(cc.Label).string = "-"      // 昨日贡献
            // this.node.getChildByName("node_mem").getChildByName("label_gx2").getComponent(cc.Label).string = "-"       // 今日贡献
            this.node.getChildByName("node_mem").getChildByName("label_score").getComponent(cc.Label).string = (this._info.money/100.0).toString()       // 积分
            return
        }
        // var data = JSON.parse(this._info.extra)
        // var info = [{date:0,commission:0,play_count:0}, {date:0,commission:0,play_count:0}]
        // var todayTime = Math.floor(new Date(new Date().toLocaleDateString()).getTime()/1000)
        // if (Array.isArray(data.logs))
        // {
        //     info = data.logs.sort(function (a, b) {return a.date - b.date})
        //     if (info.length == 1 && info[0].date < todayTime)
        //     {
        //         info.push({date:todayTime,commission:0,play_count:0})
        //     }
        //     else if (info.length == 1 && info[0].date >= todayTime)
        //     {
        //         info = [{date:todayTime,commission:0,play_count:0}, {date:info[0].date,commission:info[0].commission,play_count:info[0].play_count}]
        //     }
        // }
        // if (!info[0].commission)
        //     info[0].commission = 0
        // if (!info[1].commission)
        //     info[1].commission = 0
        // this.node.getChildByName("node_mem").getChildByName("label_ju1").getComponent(cc.Label).string = info[0].play_count.toString()       // 昨日局数
        // this.node.getChildByName("node_mem").getChildByName("label_ju2").getComponent(cc.Label).string = info[1].play_count.toString()        // 今日局数
        // this.node.getChildByName("node_mem").getChildByName("label_gx1").getComponent(cc.Label).string = (info[0].commission/100).toString()      // 昨日贡献
        // this.node.getChildByName("node_mem").getChildByName("label_gx2").getComponent(cc.Label).string = (info[1].commission/100).toString()       // 今日贡献
        this.node.getChildByName("node_mem").getChildByName("label_score").getComponent(cc.Label).string = (this._info.money/100.0).toString()       // 积分
    }

    
    updateGroupInfo() // 合伙人信息
    {
        var data = JSON.parse(this._info.extra)
        // var info = [{date:0,commission:0,play_count:0}, {date:0,commission:0,play_count:0}]
        // var todayTime = Math.floor(new Date(new Date().toLocaleDateString()).getTime()/1000)
        var playerCount = 0
        var money = this._info.money
        if (data.info && data.info.player_count)
            playerCount = data.info.player_count
        if (this._info.teamMoney)
            money += this._info.teamMoney
        // if (Array.isArray(data.logs))
        // {
        //     info = data.logs.sort(function (a, b) {return a.date - b.date})
        //     if (info.length == 1 && info[0].date < todayTime)
        //     {
        //         info.push({date:todayTime,commission:0,play_count:0})
        //     }
        //     else if (info.length == 1 && info[0].date >= todayTime)
        //     {
        //         info = [{date:todayTime,commission:0,play_count:0}, {date:info[0].date,commission:info[0].date,play_count:info[0].play_count}]
        //     }
        // }
        if (this._info.isSearch)
        {
            this.node.getChildByName("node_group").getChildByName("label_yj").getComponent(cc.Label).string = (this._info.commission/100).toString()
            this.node.getChildByName("node_group").getChildByName("label_jj").getComponent(cc.Label).string = "-" 
            this.node.getChildByName("node_group").getChildByName("label_mem").getComponent(cc.Label).string = playerCount.toString()
            this.node.getChildByName("node_group").getChildByName("label_all").getComponent(cc.Label).string = (money/100.0).toString()
            return
        }
        // this.node.getChildByName("node_group").getChildByName("label_yj").getComponent(cc.Label).string = info[0].play_count.toString()
        this.node.getChildByName("node_group").getChildByName("label_mem").getComponent(cc.Label).string = playerCount.toString()       // 成员数
        var parentGuid = 0
        var targetGuid = 0
        if (this._info.parentInfo.guid)
            parentGuid = this._info.parentInfo.guid
        if (this._info.guid)
            targetGuid = this._info.guid
        
        if (parentGuid == GameDataManager.getInstance().userInfoData.userId || targetGuid == GameDataManager.getInstance().userInfoData.userId)
        {
            var credit = 0
            if (data.conf)
                credit = data.conf.credit
            this.node.getChildByName("node_group").getChildByName("label_jj").getComponent(cc.Label).string = (credit/100).toString()     // 警戒

        }
        else
        this.node.getChildByName("node_group").getChildByName("label_jj").getComponent(cc.Label).string = "-" 
        this.node.getChildByName("node_group").getChildByName("label_all").getComponent(cc.Label).string = (money/100).toString() 
        this.node.getChildByName("node_group").getChildByName("label_yj").getComponent(cc.Label).string = (this._info.commission/100).toString()
    }

    public setManager(isManager)
    {
        if (this._playerId == GameDataManager.getInstance().userInfoData.userId)
            return
        this.node.getChildByName("node_group").getChildByName("btn_jijie").active = isManager;
        if (!isManager)
            this.node.getChildByName("node_group").getChildByName("label_jj").getComponent(cc.Label).string = "-"
    }

    //设置id
    public setId(clubid: number, pid: number) {
        this._clubId = clubid;
        this._playerId = pid;
        this.node.getChildByName("label_id").getComponent(cc.Label).string = pid.toString()
    }

    //设置头像
    public setNameHead(headurl: string, name: string) {
        if(headurl && headurl != ""){
            Utils.loadTextureFromNet(this.spHead, headurl);
        }
        this.node.getChildByName("label_name").getComponent(cc.Label).string = Utils.getShortName(name,10);
    }

    public getPartnerId(){
        return this._playerId
    }

    public updateJinJie(value){
        this.node.getChildByName("node_group").getChildByName("label_jj").getComponent(cc.Label).string = (value/100).toString();
    }

    // button_import(event) {
    //     AudioManager.getInstance().playSFX("button_click");
    //     if (GameDataManager.getInstance().isImport)
    //     {
    //         GameManager.getInstance().openWeakTipsUI("正在导入中请稍后");
    //         return
    //     }
    //     UIManager.getInstance().openUI(ClubMemberUI, 2, () => { 
    //         UIManager.getInstance().getUI(ClubMemberUI).getComponent("ClubMemberUI").importPlayerByClubId(this._info.clubId)})
    // }


    button_mem() // 下属成员
    {
        AudioManager.getInstance().playSFX("button_click");
        if(UIManager.getInstance().getUI(ClubGroupUI))
            UIManager.getInstance().getUI(ClubGroupUI).getComponent("ClubGroupUI").updateListByItemClick("member", this._playerId)
    }

    button_partner() // 下属合伙人
    {
        AudioManager.getInstance().playSFX("button_click");
        if(UIManager.getInstance().getUI(ClubGroupUI))
            UIManager.getInstance().getUI(ClubGroupUI).getComponent("ClubGroupUI").updateListByItemClick("group", this._playerId)
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

    button_rizhi(event, customEventData) // 日志
    {
        AudioManager.getInstance().playSFX("button_click");
        if (!this._info)
            return
        UIManager.getInstance().openUI(UnionUI_Daily_Record, 5, () => {
            UIManager.getInstance().getUI(UnionUI_Daily_Record).getComponent("UnionUI_Daily_Record").initView(this._playerId,this._info.roleType)
        })
    }
    button_tongji(event, customEventData) // 统计
    {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(UnionUI_Statistics, 5, () => {
            UIManager.getInstance().getUI(UnionUI_Statistics).getComponent("UnionUI_Statistics").initView(this._playerId,this._info.roleType)
        })
    }


    button_op()
    {
        AudioManager.getInstance().playSFX("button_click");
        if (this._playerId == GameDataManager.getInstance().userInfoData.userId || this._cruSelectId == this._playerId)
            return
        UIManager.getInstance().openUI(UnionUI_Member_Info, 30, () => { 
            UIManager.getInstance().getUI(UnionUI_Member_Info).getComponent("UnionUI_Member_Info").initView("union", this._info);})
    }

}

