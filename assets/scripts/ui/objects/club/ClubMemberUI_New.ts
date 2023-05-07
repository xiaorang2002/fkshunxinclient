import { HttpManager } from './../../../../framework/Manager/HttpManager';
import { ClubKeyboardUI } from './ClubKeyboardUI';
import { BaseUI, UIClass } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { MessageManager } from "../../../../framework/Manager/MessageManager";
import * as Proto from "../../../../proto/proto-min";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import { ListenerManager } from "../../../../framework/Manager/ListenerManager";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { GameManager } from "../../../GameManager";
import { StringData } from "../../../data/StringData";
import { AudioManager } from "../../../../framework/Manager/AudioManager";
import { CLUB_POWER } from "../../../data/club/ClubData";

const { ccclass, property } = cc._decorator;

@ccclass
export class ClubMemberUI_New extends BaseUI {

    protected static className = "ClubMemberUI_New";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_CLUB_DIR + this.className;
    }

    private clubData: any = null;
    private curMemberArray: any = [];                       //成员列表
    private items: any = [];                                //对象数组
    private spacing: number = 0;                            //对象之间的间隔
    private itemType = ""
    private curSelectPage = 1                               // 当前选择的页数
    private totalPage = 0                                      // 总页数
    private pageNum = 10 // 每一页的玩家数量
    private sending = false;             


    @property(cc.Prefab)
    memberPrefab: cc.Prefab = null;
    @property(cc.Prefab)
    messageItemPrefab: cc.Prefab = null;
    @property(cc.Prefab)
    blackListPrefab: cc.Prefab = null;
    @property(cc.Node)
    nodeListContent: cc.Node = null;
    @property(cc.Label)
    memberTitleName: cc.Label = null;
    @property(cc.Node)
    leftContent: cc.Node = null;
    @property(cc.EditBox)
    searchEdit: cc.EditBox = null;
    @property(cc.Label)
    partnerTitleName: cc.Label = null;
    @property(cc.EditBox)
    tongzhuoEdit_1: cc.EditBox = null;
    @property(cc.EditBox)
    tongzhuoEdit_2: cc.EditBox = null;

    private curSelectType = null
    private curSelectPlayerId = null
    private waitTime = 3
    private isWaiting = false
    private isSearchView = false // 当前是否是搜索界面
    private searchId = null
    private huopaiPlayer1 = ""
    private huopaiPlayer2 = ""

    onLoad() {
        //super.onLoad()
    }

    private initListen()
    {
        ListenerManager.getInstance().add(Proto.S2C_CLUB_PLAYER_LIST_RES.MsgID.ID, this, this.clubMemberListResponse);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_OP_RES.MsgID.ID, this, this.clubOpResponse);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_TRANSFER_MONEY_RES.MsgID.ID, this, this.scoreOpResponse);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_REQUEST_LIST_RES.MsgID.ID, this, this.clubApplyListRec);
        ListenerManager.getInstance().add(Proto.SC_SEARCH_CLUB_PLAYER.MsgID.ID, this, this.onSearchRec);

        // 禁止同桌
        ListenerManager.getInstance().add(Proto.S2C_CLUB_BLOCK_PULL_GROUPS.MsgID.ID, this, this.onGroupListRec);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_BLOCK_NEW_GROUP.MsgID.ID, this, this.onGroupChanged);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_BLOCK_DEL_GROUP.MsgID.ID, this, this.onGroupChanged);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_BLOCK_ADD_PLAYER_TO_GROUP.MsgID.ID, this, this.onPlayerChanged);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_BLOCK_REMOVE_PLAYER_FROM_GROUP.MsgID.ID, this, this.onPlayerChanged);

        // 组长隔离
        ListenerManager.getInstance().add(Proto.S2C_CLUB_BLOCK_TEAM_PULL_GROUPS.MsgID.ID, this, this.onTeamGroupListRec);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_BLOCK_TEAM_NEW_GROUP.MsgID.ID, this, this.onTeamGroupChanged);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_BLOCK_TEAM_DEL_GROUP.MsgID.ID, this, this.onTeamGroupChanged);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_BLOCK_TEAM_ADD_TEAM_TO_GROUP.MsgID.ID, this, this.onTeamChanged);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_BLOCK_TEAM_REMOVE_TEAM_FROM_GROUP.MsgID.ID, this, this.onTeamChanged);
    }

    update(dt)
    {
        if (this.isWaiting)
        {
            this.waitTime -= dt;
            if (this.waitTime <= 0)
            {
                this.waitTime = 3
                this.isWaiting = false;
            }
        }
    }

    private updateButtonSelect(type){
        if (this.curSelectType)
        {
            this.leftContent.getChildByName("btn_" + this.curSelectType).getChildByName("select_bg").active = false
            this.leftContent.getChildByName("btn_" + this.curSelectType).getChildByName("label_name").active = false
            this.leftContent.getChildByName("btn_" + this.curSelectType).getChildByName("label_name_unselect").active = true
            this.leftContent.getChildByName("btn_" + this.curSelectType).getChildByName("select_bg_unselect").active = true
            if (this.curSelectType == "add_message" || this.curSelectType == "del_message")
                this.node.getChildByName("node_message").active = false
            else
                this.node.getChildByName("node_" + this.curSelectType).active = false
        }
        this.curSelectType = type
        this.leftContent.getChildByName("btn_" + this.curSelectType).getChildByName("select_bg").active = true
        this.leftContent.getChildByName("btn_" + this.curSelectType).getChildByName("label_name").active = true
        this.leftContent.getChildByName("btn_" + this.curSelectType).getChildByName("label_name_unselect").active = false
        this.leftContent.getChildByName("btn_" + this.curSelectType).getChildByName("select_bg_unselect").active = false
        if (type == "add_message" || type == "del_message")
            this.node.getChildByName("node_message").active = true
        else
            this.node.getChildByName("node_" + this.curSelectType).active = true

        if (type == "member_geli" || type == "partner_geli")
        {
            this.node.getChildByName("btn_right").active = false
            this.node.getChildByName("label_page").active = false
            this.node.getChildByName("btn_left").active = false
            this.node.getChildByName("titlebg").active = false
            this.node.getChildByName("pages_num_bg").active = false
           // this.node.getChildByName("ScrollView").y = 3
        }
        else{
            this.node.getChildByName("btn_right").active = true
            this.node.getChildByName("label_page").active = true
            this.node.getChildByName("btn_left").active = true
            this.node.getChildByName("titlebg").active = true
            this.node.getChildByName("pages_num_bg").active = true
           // this.node.getChildByName("ScrollView").y = -37

        }

        if(type == "member" || type == "partner")
        {
            this.node.getChildByName("btn_search").active = true
            this.node.getChildByName("edit_search").active = true
        }
        else
        {
            this.node.getChildByName("btn_search").active = false
            this.node.getChildByName("edit_search").active = false
        }
    }


    public initView(playerId = 0) {
        this.clubData = GameDataManager.getInstance().clubData;
        this.isSearchView = false;
        this.searchId = 0
        this.initListen()
        this.updateButtonSelect("member")
        this.curSelectPlayerId = playerId
        if (playerId == 0)
            this.curSelectPlayerId = GameDataManager.getInstance().userInfoData.userId
        this.sendPlayerListRequest(this.curSelectPlayerId, 0)
        this.leftContent.getChildByName("btn_apply").active = this.clubData.roleType > CLUB_POWER.CRT_PRATNER
        this.leftContent.getChildByName("btn_partner_geli").active = this.clubData.roleType > CLUB_POWER.CRT_PRATNER
        this.leftContent.getChildByName("btn_member_geli").active = this.clubData.roleType > CLUB_POWER.CRT_PRATNER
        // var onlineNum = this.clubData.clubOnlinePlayerNum + "/" + this.clubData.clubAllPlayerNum
        // if (this.clubData.clubSettings != "")
        // {
        //     var info = JSON.parse(this.clubData.clubSettings)
        //     if ((info.limit_online_player_num == true || info.limit_online_player_num == "true") && this.clubData.roleType < CLUB_POWER.CRT_ADMIN)
        //     {
        //         var str1 = this.clubData.clubOnlinePlayerNum.toString()
        //         var str2 = this.clubData.clubAllPlayerNum.toString()
        //         if (this.clubData.clubOnlinePlayerNum > 99)
        //             str1 = "99+"
        //         if (this.clubData.clubAllPlayerNum>99)
        //             str2 = "99+"
        //         onlineNum = str1 + "/" + str2    
        //     }
        // }
        // this.node.getChildByName("label_online").getComponent(cc.Label).string = "在线人数: " + onlineNum
    }

    public setSearchPlayerId(playerId)
    {
        this.searchId = playerId
    }


    private sendPlayerListRequest(partner,role)
    {
        this.isWaiting = true
        this.waitTime = 3
        var msg = {
            clubId:this.clubData.curSelectClubId,
            partner:partner,
            role:role,
            pageSize:this.pageNum,
            pageNum:this.curSelectPage,
        }
        this.node.getChildByName("sp_wait").active = true
        this.node.getChildByName("sp_wait").runAction(cc.repeatForever(cc.rotateBy(1, 360)));
        if (partner == GameDataManager.getInstance().userInfoData.userId)
        {
            this.memberTitleName.string = "成员列表"
            this.partnerTitleName.string = "组长列表"
        }
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_PLAYER_LIST_REQ.MsgID.ID,msg)
    }

    clubMemberListResponse(msg: any) {
        this.isSearchView = false
        this.curMemberArray = [];
        for (var i = 0; i < msg.playerList.length; i++)
        {
            var info = {
                isApply:false,
                guid: msg.playerList[i].info.guid, 
                icon: msg.playerList[i].info.icon, 
                nickname: msg.playerList[i].info.nickname, 
                roleType: msg.playerList[i].role, 
                time: msg.playerList[i].info.time, 
                money: msg.playerList[i].money.count,
                extra: msg.playerList[i].extraData,
                parent: msg.playerList[i].parent,
                parentInfo: msg.playerList[i].parentInfo,
                isStopGame: msg.playerList[i].blockGaming,
                cansetpartner:msg.playerList[i].cansetpartner,
                isSearch:false
            }
            this.curMemberArray.push(info)
        }
        this.updateList("member");
        this.node.getChildByName("sp_empty").active = this.curMemberArray.length == 0
        this.curSelectPage = msg.pageNum
        this.totalPage = msg.totalPage
        if (this.totalPage == 0)
            this.totalPage = 1
        this.updatePage()
        this.isWaiting = false
        this.waitTime = 3
        this.node.getChildByName("sp_wait").active = false
        this.node.getChildByName("sp_wait").stopAllActions()
        MessageManager.getInstance().disposeMsg();
    }

    onSearchRec(msg)
    {
        this.curMemberArray = [];
        for (var i = 0; i < msg.players.length; i++)
        {
            if(this.curSelectType == "partner" && msg.players[i].role != CLUB_POWER.CRT_PRATNER)
                continue
            var info = {
                isApply:false,
                guid: msg.players[i].info.guid, 
                icon: msg.players[i].info.icon, 
                nickname: msg.players[i].info.nickname, 
                roleType: msg.players[i].role, 
                time: msg.players[i].info.time, 
                money: msg.players[i].money.count,
                extra: msg.players[i].extraData,
                parent: msg.players[i].parent,
                isStopGame: msg.players[i].blockGaming,
                parentInfo: msg.players[i].parentInfo,
                cansetpartner:msg.players[i].cansetpartner,
                isSearch:(true && GameDataManager.getInstance().userInfoData.userId!=msg.players[i].parent)
            }
            this.curMemberArray.push(info)
        }
        this.updateList("member");
        this.node.getChildByName("sp_empty").active = this.curMemberArray.length == 0
        this.curSelectPage = 1
        this.totalPage = 1
        this.updatePage()
        this.isSearchView = true
        GameManager.getInstance().openWeakTipsUI("搜索成功");
        MessageManager.getInstance().disposeMsg();
    }



    private clubOpResponse(msg: any) {
        if (msg.opType == 12) {
            //有人退出亲友群
            let surefun = () => {
                var uiType =  parseInt(cc.sys.localStorage.getItem("curClubType")) ;
                MessageManager.getInstance().messageSend(Proto.C2S_CLUBLIST_REQ.MsgID.ID, {type: uiType});
                MessageManager.getInstance().disposeMsg();
            };
            GameManager.getInstance().openStrongTipsUI(StringData.getString(10035), surefun);
            return;
        }
        GameManager.getInstance().openWeakTipsUI("操作成功");
        if (this.curSelectType == "apply")
            MessageManager.getInstance().messageSend(Proto.C2S_CLUB_REQUEST_LIST_REQ.MsgID.ID, { clubId: this.clubData.curSelectClubId})
        else
        {
            if (this.isSearchView && this.searchId != null) // 如果当前是搜索界面操作完成之后依然返回操作界面
            {
                MessageManager.getInstance().messageSend(Proto.CS_SEARCH_CLUB_PLAYER.MsgID.ID, {
                    guidPattern: this.searchId,
                    clubId: this.clubData.curSelectClubId,
                    partner: GameDataManager.getInstance().userInfoData.userId,
                })
            }
            else
            {
                if (this.curSelectType == "member")
                    this.sendPlayerListRequest(this.curSelectPlayerId, 0)
                else
                    this.sendPlayerListRequest(this.curSelectPlayerId, CLUB_POWER.CRT_PRATNER)
            }
        }
        MessageManager.getInstance().disposeMsg();
    }

    private scoreOpResponse(msg)
    {
        if (msg.result != 0)
        {
            if (msg.result == 51)
                GameManager.getInstance().openWeakTipsUI("玩家在游戏中，无法操作");
            else
                GameManager.getInstance().openWeakTipsUI(StringData.getString(msg.result));
            MessageManager.getInstance().disposeMsg();
            return;
        }

        GameManager.getInstance().openWeakTipsUI("操作成功");
        if (this.curSelectType == "apply")
            MessageManager.getInstance().messageSend(Proto.C2S_CLUB_REQUEST_LIST_REQ.MsgID.ID, { clubId: this.clubData.curSelectClubId})
        else{
            if (this.isSearchView && this.searchId != null) // 如果当前是搜索界面操作完成之后依然返回操作界面
            {
                MessageManager.getInstance().messageSend(Proto.CS_SEARCH_CLUB_PLAYER.MsgID.ID, {
                    guidPattern: this.searchId,
                    clubId: this.clubData.curSelectClubId,
                    partner: GameDataManager.getInstance().userInfoData.userId,
                })
            }
            else
            {
                if (this.curSelectType == "member")
                    var role = 0
                else
                    var role = 2
                this.sendPlayerListRequest(this.curSelectPlayerId, role)
            }
        }
        MessageManager.getInstance().disposeMsg();
    }

    private clubApplyListRec(msg){
        this.curMemberArray = [];
        for (var i = 0; i < msg.reqs.length; i++)
        {
            if (msg.reqs[i].type == "join"){
                var info = {
                    isApply:true,
                    reqId:msg.reqs[i].reqId,
                    type:msg.reqs[i].type,
                    guid: msg.reqs[i].who.guid, 
                    icon: msg.reqs[i].who.icon, 
                    nickname: msg.reqs[i].who.nickname, 
                    roleType: msg.reqs[i].who.roleType,
                    parent : 0,
                    parentInfo: null,
                    isSearch:false
                }
                this.curMemberArray.push(info)
            }
        }
        this.updateList("member");
        this.node.getChildByName("sp_empty").active = this.curMemberArray.length == 0
        this.isWaiting = false
        this.waitTime = 3
        this.node.getChildByName("sp_wait").active = false
        this.node.getChildByName("sp_wait").stopAllActions()
        MessageManager.getInstance().disposeMsg();
        
    }


    private clubAddPlayerResponse(msg: any) {
        //ToDo:可以根据具体情况做修改变更优化
        this.sendPlayerListRequest(this.curSelectPlayerId, 0)
        MessageManager.getInstance().disposeMsg();
    }

    // 禁止同桌
    private onGroupChanged(msg)
    {
        if (this.curSelectType != "member_geli")
        {
            MessageManager.getInstance().disposeMsg();
            return
        }
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_BLOCK_PULL_GROUPS.MsgID.ID, {clubId: GameDataManager.getInstance().clubData.curSelectClubId});
        MessageManager.getInstance().disposeMsg();
    }

    private onPlayerChanged(msg)
    {
        if (this.curSelectType != "member_geli")
        {
            MessageManager.getInstance().disposeMsg();
            return
        }
        GameManager.getInstance().openWeakTipsUI("操作成功！！");
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_BLOCK_PULL_GROUPS.MsgID.ID, {clubId: GameDataManager.getInstance().clubData.curSelectClubId});
        MessageManager.getInstance().disposeMsg();
    }

    private onGroupListRec(msg)
    {
        if (this.curSelectType != "member_geli")
        {
            MessageManager.getInstance().disposeMsg();
            return
        }
        if (this.curSelectType != "member_geli")
        {
            MessageManager.getInstance().disposeMsg();
            return
        }
        this.curMemberArray = msg.groups
        this.updateList("member_geli") 
        MessageManager.getInstance().disposeMsg();
    }

    // 组长隔离
    private onTeamGroupListRec(msg)
    {
        if (this.curSelectType != "partner_geli")
        {
            MessageManager.getInstance().disposeMsg();
            return
        }
        this.curMemberArray = msg.groups
        this.updateList("partner_geli") 
        MessageManager.getInstance().disposeMsg();
    }

    private onTeamGroupChanged(msg)
    {
        if (this.curSelectType != "partner_geli")
        {
            MessageManager.getInstance().disposeMsg();
            return
        }
        GameManager.getInstance().openWeakTipsUI("操作成功！！");
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_BLOCK_TEAM_PULL_GROUPS.MsgID.ID, {clubId: GameDataManager.getInstance().clubData.curSelectClubId});
        MessageManager.getInstance().disposeMsg();
    }

    private onTeamChanged(msg)
    {
        if (this.curSelectType != "partner_geli")
        {
            MessageManager.getInstance().disposeMsg();
            return
        }
        if (msg.result != 0)
        {
            if (msg.result == 251)
                GameManager.getInstance().openWeakTipsUI("请输入正确的组长id");
            else
                GameManager.getInstance().openWeakTipsUI("操作失败");
            MessageManager.getInstance().disposeMsg();
            return
        }
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_BLOCK_TEAM_PULL_GROUPS.MsgID.ID, {clubId: GameDataManager.getInstance().clubData.curSelectClubId});
        MessageManager.getInstance().disposeMsg();
    }

    //刷新列表
    private updateList(type) {
        // 排序
        this.nodeListContent.removeAllChildren()
        this.items = [];
        //清空原始数据
        if (type== "member_geli" || type== "partner_geli")
            this.nodeListContent.height = this.curMemberArray.length * 155;
        else
            this.nodeListContent.height = this.curMemberArray.length * (this.memberPrefab.data.height + this.spacing) + this.spacing;
        if (this.nodeListContent.height < 480)
            this.nodeListContent.height = 480;
        for (var i = 0; i < this.curMemberArray.length; ++i) {
            if (type == "member")
            {
                this.itemType = "ClubMemberItem_New"
                var item = cc.instantiate(this.memberPrefab);
                this.nodeListContent.addChild(item);
                let memberitem = item.getComponent(this.itemType);
                memberitem.setInfo(i, this.curSelectType, this.clubData.curSelectClubId, this.curMemberArray[i], this.curSelectPlayerId)
            }
            else if (type == "member_geli" || type == "partner_geli")
            {
                this.itemType = "UnionUI_Table_Blacklist_Group"
                var item = cc.instantiate(this.blackListPrefab);
                this.nodeListContent.addChild(item);
                let memberitem = item.getComponent(this.itemType);
                let inner = item.getChildByName("scroll").getComponent("NestableScrollView_Inner");
                this.node.getChildByName("ScrollView").getComponent("NestableScrollView_Outer").addItem(inner);
                memberitem.setInfo(this.curMemberArray[i], type)
            }
            else
            {
                this.itemType = "ClubMessageItem"
                var item = cc.instantiate(this.messageItemPrefab);
                this.nodeListContent.addChild(item);
                let memberitem = item.getComponent(this.itemType);
                memberitem.initView(this.curMemberArray[i], this.curSelectType)
            }
            item.setPosition(0, -item.height * (0.5 + i) - this.spacing * (i + 1));
            this.items.push(item);
        }
    }



    public updateListByItemClick(type, playerId, name)
    {
        this.curSelectPage = 1
        if (this.curSelectType != type)
            this.updateButtonSelect(type)
        if (type == "member")
        {
            this.memberTitleName.string = name + "的成员"
            this.sendPlayerListRequest(playerId, 0)
        }
        else
        {
            this.partnerTitleName.string = name + "的组长"
            this.sendPlayerListRequest(playerId, CLUB_POWER.CRT_PRATNER)
        }
        this.curSelectPlayerId = playerId;
    }

    private updatePage()
    {
        this.node.getChildByName("label_page").getComponent(cc.Label).string = this.curSelectPage + "/" + this.totalPage
    }

    private queryDate()
    {
        if (GameDataManager.getInstance().httpDataWaitTime > 0) {
            this.node.getChildByName("sp_empty").active = true
            GameManager.getInstance().openWeakTipsUI("请求频繁，请等待" + Math.floor(GameDataManager.getInstance().httpDataWaitTime) + "后重试");
            return
        }
        let url = ""
        let params = ""
        let startTime = 0
        var endTime = 0;
        startTime = Math.floor(new Date(new Date().toLocaleDateString()).getTime() / 1000) - 24 * 60 * 60 * 6
        endTime = Math.floor(new Date(new Date().toLocaleDateString()).getTime() / 1000) + 24 * 60 * 60 - 1
        url = GameConstValue.ConstValue.CLUB_MEMBER_CHANGE_URL
        var playerId = GameDataManager.getInstance().userInfoData.userId
        var clubData = GameDataManager.getInstance().clubData
        var clubId = clubData.curSelectClubId
        if (this.curSelectType == "del_message") {
            url = url + "?club_id=" + clubId + "&partner_id=" + playerId + "&start_time=" + startTime + "&page=" + this.curSelectPage + "&end_time=" + endTime + "&type=2"
        }
        else {
            url = url + "?club_id=" + clubId + "&partner_id=" + playerId + "&start_time=" + startTime + "&page=" + this.curSelectPage + "&end_time=" + endTime + "&type=1"
        }

        url = HttpManager.getInstance().encryptUrl(url) + "&guid="+ GameDataManager.getInstance().userInfoData.userId
        GameDataManager.getInstance().onHttpDataSend()
        this.isWaiting = true
        this.node.getChildByName("sp_wait").active = true
        this.node.getChildByName("sp_wait").runAction(cc.repeatForever(cc.rotateBy(1, 360)));
        HttpManager.getInstance().get(url, "", "", this.dataResponseDelMessage.bind(this));
    }

    private queryHuopai(player1 ,player2)
    {
        if (GameDataManager.getInstance().httpDataWaitTime > 0)
        {
            this.node.getChildByName("sp_empty").active = true
            GameManager.getInstance().openWeakTipsUI("请求频繁，请等待"+ Math.floor(GameDataManager.getInstance().httpDataWaitTime)+"后重试");
            return
        }
        let url = ""
        let params = ""
        this.huopaiPlayer1 = player1
        this.huopaiPlayer2 = player2
        url = GameConstValue.ConstValue.HUO_PAI_CHEAT_URL 
        var clubData = GameDataManager.getInstance().clubData
        var clubId = clubData.curSelectClubId
        params = "club_id="+clubId +"&page="+this.curSelectPage
        if (player1.length >0)
            params += "&guid="+player1
        if (player2.length >0)
            params += "&guid_other="+player2
        GameDataManager.getInstance().onHttpDataSend()
        this.isWaiting = true
        this.node.getChildByName("sp_wait").active = true
        this.node.getChildByName("sp_wait").runAction(cc.repeatForever(cc.rotateBy(1, 360)));
        url = HttpManager.getInstance().encryptUrl(url + "?" + params) + "&guid="+ GameDataManager.getInstance().userInfoData.userId
        HttpManager.getInstance().get(url, "", "", this.dataResponseHuopai.bind(this));
    }

    private dataResponseDelMessage(event, data)
    {
        GameDataManager.getInstance().onHttpDataRec()
        try{
            if (this.node == null)
                return;
            if (event != null && event.type == "timeout")
            {
                GameManager.getInstance().openWeakTipsUI("请求数据超时");
                this.node.getChildByName("sp_empty").active = true
                return
            }
            if (data == null)
            {
                GameManager.getInstance().openWeakTipsUI("未查询到数据");
                this.node.getChildByName("sp_empty").active = true
                return
            }
            var jsonData = JSON.parse(data)
            this.totalPage = jsonData.data.last_page
            this.curSelectPage = jsonData.data.current_page
            this.isWaiting = false
            this.waitTime = 3
            this.node.getChildByName("sp_wait").active = false
            this.node.getChildByName("sp_wait").stopAllActions()
            if (!jsonData.data.data || jsonData.data.data.length == 0)
            {
                this.nodeListContent.removeAllChildren();
                this.items = [];
                this.totalPage = 1
                this.curSelectPage = 1
                this.updatePage()
                this.node.getChildByName("sp_empty").active = true
                return
            }
            this.updatePage()
            this.node.getChildByName("sp_empty").active = false
            this.curMemberArray = jsonData.data.data
            this.updateList("message")
        }
        catch (e)
        {
            console.log(e)
        }        
    }

    private dataResponseHuopai(event, data)
    {
        GameDataManager.getInstance().onHttpDataRec()
        try{
            if (this.node == null)
                return;
            if (event != null && event.type == "timeout")
            {
                GameManager.getInstance().openWeakTipsUI("请求数据超时");
                return
            }
            if (data == null)
            {
                GameManager.getInstance().openWeakTipsUI("未查询到数据");
                return
            }
            var jsonData = JSON.parse(data)
            this.totalPage = jsonData.data.last_page
            this.curSelectPage = jsonData.data.current_page
            this.isWaiting = false
            this.waitTime = 3
            this.node.getChildByName("sp_wait").active = false
            this.node.getChildByName("sp_wait").stopAllActions()
            if (!jsonData.data.data || jsonData.data.data.length == 0)
            {
                this.nodeListContent.removeAllChildren();
                this.items = [];
                this.totalPage = 1
                this.curSelectPage = 1
                this.updatePage()
                this.node.getChildByName("sp_empty").active = true
                return
            }
            this.updatePage()
            this.node.getChildByName("sp_empty").active = false
            this.curMemberArray = jsonData.data.data
            this.updateList("huopai")
        }
        catch (e)
        {
            console.log(e)
        }        
    }


    //搜索返回
    private button_find(event) {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(ClubKeyboardUI, 20, () => {
            UIManager.getInstance().getUI(ClubKeyboardUI).getComponent("ClubKeyboardUI").initView(1)
        })
    }

    private button_close() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().closeUI(ClubMemberUI_New);
    }

    private button_member_list()
    {
        AudioManager.getInstance().playSFX("button_click");
        if (this.curSelectType == "member")
            return
        if (this.isWaiting)
            return
        this.updateButtonSelect("member")
        this.curSelectPage = 1
        this.curSelectPlayerId = GameDataManager.getInstance().userInfoData.userId
        this.searchId = null
        this.sendPlayerListRequest(this.curSelectPlayerId, 0)
    }

    private button_apply_list()
    {
        AudioManager.getInstance().playSFX("button_click");
        if (this.curSelectType == "apply")
            return 
        if (this.isWaiting)
            return
        this.searchId = null
        this.updateButtonSelect("apply")
        this.isWaiting = true
        this.node.getChildByName("sp_wait").active = true
        this.node.getChildByName("sp_wait").runAction(cc.repeatForever(cc.rotateBy(1, 360)));
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_REQUEST_LIST_REQ.MsgID.ID, { clubId: this.clubData.curSelectClubId})

    }

    // 合伙人列表按钮
    private button_partner()
    {
        AudioManager.getInstance().playSFX("button_click");
        if (this.curSelectType == "partner")
            return 
        if (this.isWaiting)
            return
        this.updateButtonSelect("partner")
        this.curSelectPage = 1
        this.curSelectPlayerId = GameDataManager.getInstance().userInfoData.userId
        this.searchId = null
        this.sendPlayerListRequest(this.curSelectPlayerId, CLUB_POWER.CRT_PRATNER)
    }

    private nextPage() 
    {
        if (this.isWaiting)
            return
        if (this.curSelectPage >= this.totalPage)
        {
            GameManager.getInstance().openWeakTipsUI("已经是最后一页了");
            return
        }
        this.curSelectPage += 1
        if (this.curSelectType == "partner")
            this.sendPlayerListRequest(this.curSelectPlayerId, CLUB_POWER.CRT_PRATNER)
        else if (this.curSelectType == "member")
            this.sendPlayerListRequest(this.curSelectPlayerId, 0)
        else if (this.curSelectType == "apply")
            MessageManager.getInstance().messageSend(Proto.C2S_CLUB_REQUEST_LIST_REQ.MsgID.ID, { clubId: this.clubData.curSelectClubId})
        else if (this.curSelectType == "huopai")
            this.queryHuopai(this.huopaiPlayer1, this.huopaiPlayer2)
        else
            this.queryDate()
    }

    private lastPage()
    {
        if (this.isWaiting)
            return
        if (this.curSelectPage == 1)
        {
            GameManager.getInstance().openWeakTipsUI("已经是最开始一页了");
            return
        }
        this.curSelectPage -= 1
        var role = 0
        if (this.curSelectType == "group")
            role = CLUB_POWER.CRT_PRATNER
        if (this.curSelectType == "partner")
            this.sendPlayerListRequest(this.curSelectPlayerId, CLUB_POWER.CRT_PRATNER)
        else if (this.curSelectType == "member")
            this.sendPlayerListRequest(this.curSelectPlayerId, 0)
        else if (this.curSelectType == "apply")
            MessageManager.getInstance().messageSend(Proto.C2S_CLUB_REQUEST_LIST_REQ.MsgID.ID, { clubId: this.clubData.curSelectClubId})
        else if (this.curSelectType == "huopai")
            this.queryHuopai(this.huopaiPlayer1, this.huopaiPlayer2)
        else
            this.queryDate()

    }

    button_add_message()
    {
        AudioManager.getInstance().playSFX("button_click")
        if (this.isWaiting)
            return
        if (this.curSelectType == "add_message")
            return 
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        this.updateButtonSelect("add_message")
        this.isWaiting = true
        this.node.getChildByName("sp_wait").runAction(cc.repeatForever(cc.rotateBy(1, 360)));
        this.queryDate()

    }

    btn_del_message() {
        AudioManager.getInstance().playSFX("button_click")
        if (this.curSelectType == "del_message")
            return
        if (this.isWaiting)
            return
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        this.updateButtonSelect("del_message")
        this.isWaiting = true
        this.node.getChildByName("sp_wait").runAction(cc.repeatForever(cc.rotateBy(1, 360)));
        this.queryDate()
    }

    btn_huo_pai() {
        AudioManager.getInstance().playSFX("button_click")
        if (this.curSelectType == "huopai")
            return
        this.node.getChildByName("sp_empty").active = false
        this.tongzhuoEdit_1.string = ""
        this.tongzhuoEdit_2.string = ""
        this.curMemberArray = [];
        this.nodeListContent.removeAllChildren()
        this.items = [];
        this.updateButtonSelect("huopai")
    }

    btn_partner_geli() {
        AudioManager.getInstance().playSFX("button_click")
        if (this.curSelectType == "partner_geli")
            return
        this.node.getChildByName("sp_empty").active = false
        this.updateButtonSelect("partner_geli")
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_BLOCK_TEAM_PULL_GROUPS.MsgID.ID, {clubId: GameDataManager.getInstance().clubData.curSelectClubId});
    }

    btn_member_geli() {
        AudioManager.getInstance().playSFX("button_click")
        if (this.curSelectType == "member_geli")
            return
        this.node.getChildByName("sp_empty").active = false
        this.updateButtonSelect("member_geli")
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_BLOCK_PULL_GROUPS.MsgID.ID, {clubId: GameDataManager.getInstance().clubData.curSelectClubId});
    }

    button_player_geli_add()
    {
        AudioManager.getInstance().playSFX("button_click")
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_BLOCK_NEW_GROUP.MsgID.ID, {clubId: GameDataManager.getInstance().clubData.curSelectClubId});
    }

    button_team_geli_add()
    {
        AudioManager.getInstance().playSFX("button_click")
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_BLOCK_TEAM_NEW_GROUP.MsgID.ID, {clubId: GameDataManager.getInstance().clubData.curSelectClubId});
    }

    btn_huopai_query()
    {
        AudioManager.getInstance().playSFX("button_click")
        if (this.curSelectType != "huopai")
            return
        if (this.isWaiting)
            return
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        var player1 = this.tongzhuoEdit_1.string
        var player2 = this.tongzhuoEdit_2.string
        if (player1.length == 0 && player2.length == 0)
        {
            GameManager.getInstance().openWeakTipsUI("至少输入一个玩家ID");
            return
        }

        if (player1.length > 0 && isNaN(parseInt(player1)))
        {
            GameManager.getInstance().openWeakTipsUI("输入的ID必须是数字");
            return
        }
        if (player2.length > 0 && isNaN(parseInt(player2)))
        {
            GameManager.getInstance().openWeakTipsUI("输入的ID必须是数字");
            return
        }
        if (player1.length > 0 && (player1.length < 6 || player1.length > 7))
        {
            GameManager.getInstance().openWeakTipsUI("请输入正确玩家ID位数");
            return
        }
        if (player2.length > 0 && (player2.length < 6 || player2.length > 7))
        {
            GameManager.getInstance().openWeakTipsUI("请输入正确玩家ID位数");
            return
        }
        this.node.getChildByName("sp_wait").runAction(cc.repeatForever(cc.rotateBy(1, 360)));
        this.queryHuopai(player1, player2)
    }

    btn_search() {
        AudioManager.getInstance().playSFX("button_click")
        var searchId = this.searchEdit.string
        var iniId = parseInt(searchId)
        if (searchId == "") {
            GameManager.getInstance().openWeakTipsUI("搜索ID不能为空");
            return 
        }
        else if (isNaN(iniId))
        {
            GameManager.getInstance().openWeakTipsUI("请输入数字ID");
            return 
        }
        else if (searchId.length < 4)
        {
            GameManager.getInstance().openWeakTipsUI("至少输入4位ID");
            return 
        }
        if (!this.clubData || !this.curSelectPlayerId)
            return 
        this.searchEdit.string = ""
        this.curSelectPlayerId = GameDataManager.getInstance().userInfoData.userId
        this.searchId = searchId
        if (this.curSelectType == "member")
            this.memberTitleName.string = "成员列表"
        else
            this.partnerTitleName.string = "组长列表"
        MessageManager.getInstance().messageSend(Proto.CS_SEARCH_CLUB_PLAYER.MsgID.ID, {
            guidPattern: searchId,
            clubId: this.clubData.curSelectClubId,
            partner: GameDataManager.getInstance().userInfoData.userId,
        })

    }


}
