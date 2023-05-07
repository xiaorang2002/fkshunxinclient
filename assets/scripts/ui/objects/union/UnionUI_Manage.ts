import { CLUB_POWER } from './../../../data/club/ClubData';
import { StringData } from './../../../data/StringData';
import { Utils } from './../../../../framework/Utils/Utils';
import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { ListenerManager } from './../../../../framework/Manager/ListenerManager';
import { HttpManager } from './../../../../framework/Manager/HttpManager';
import { GameManager } from './../../../GameManager';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { BaseUI, UIClass } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { AudioManager } from "../../../../framework/Manager/AudioManager";
import * as  Proto from "../../../../proto/proto-min";

const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Manage extends BaseUI {

    protected static className = "UnionUI_Manage";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_UNION + this.className;
    }

    @property(cc.Prefab)
    prefabItem1: cc.Prefab = null;
    
    @property(cc.Prefab)
    prefabItem2: cc.Prefab = null;

    @property(cc.Node)
    nodeListContent: cc.Node = null;

    @property(cc.EditBox)
    searchEdit: cc.EditBox = null;

    private selectTime = 0   
    private curSelectType = ""
    private nodeList = []
    private curSelectPage = 1                               // 当前选择的页数
    private totalPage = 0                                      // 总页数
    private pageNum = 10 // 每一页的玩家数量
    private sending = false;             
    private dataArry = []
    private selectTimeIdx = 0   
    private spacing: number = 0;                            //对象之间的间隔
    private dateList = []
    private isSearchView = false;
    private curMemberArray: any = [];                       //成员列表
    private waitTime = 3
    private isWaiting = false
    private searchId = null
    private curSelectPlayerId = 0

    onLoad()
    {
        
    }


    start()
    {
        this.curSelectPlayerId = GameDataManager.getInstance().userInfoData.userId
        var clubData = GameDataManager.getInstance().clubData
        if (clubData && clubData.roleType == CLUB_POWER.CRT_BOSS)
            this.node.getChildByName("btn_consume").active = true
        this.initListen()
        this.updateButtonSelect("member")
        this.initDate()
        this.resetView()
        this.queryDataOnSelectType()
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

    private initListen()
    {
        ListenerManager.getInstance().add(Proto.S2C_CLUB_PLAYER_LIST_RES.MsgID.ID, this, this.clubMemberListResponse);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_TRANSFER_MONEY_RES.MsgID.ID, this, this.scoreOpResponse);
        ListenerManager.getInstance().add(Proto.SC_SEARCH_CLUB_PLAYER.MsgID.ID, this, this.onSearchRec);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_EDIT_TEAM_CONFIG.MsgID.ID, this, this.onJjLimitResponse);
        ListenerManager.getInstance().add(Proto.S2C_EXCHANGE_CLUB_COMMISSON_RES.MsgID.ID, this, this.onConvertResponse);
    }


    clubMemberListResponse(msg: any) {
        if (this.curSelectType != "member" && this.curSelectType != "partner")
        {
            MessageManager.getInstance().disposeMsg();
            return;
        }
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
                teamMoney: msg.playerList[i].teamMoney.count,
                commission: msg.playerList[i].commission,
                cansetpartner:msg.playerList[i].cansetpartner,
                isSearch:false
            }
            this.curMemberArray.push(info)
        }
        this.updateList(this.curMemberArray)
        this.curSelectPage = msg.pageNum
        this.totalPage = msg.totalPage
        if (this.totalPage == 0)
            this.totalPage = 1
        this.updatePage()
        this.isWaiting = false
        this.waitTime = 3
        this.node.getChildByName("sp_wait").active = false
        this.node.getChildByName("sp_empty").active = this.curMemberArray.length == 0   

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
        var clubData = GameDataManager.getInstance().clubData
        if (this.isSearchView && this.searchId != null) // 如果当前是搜索界面操作完成之后依然返回操作界面
        {
            MessageManager.getInstance().messageSend(Proto.CS_SEARCH_CLUB_PLAYER.MsgID.ID, {
                guidPattern: this.searchId,
                clubId: clubData.curSelectClubId,
                partner: this.curSelectPlayerId,
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
        MessageManager.getInstance().disposeMsg();
    }

    onSearchRec(msg)
    {
        if (this.curSelectType != "member" && this.curSelectType != "partner")
        {
            MessageManager.getInstance().disposeMsg();
            return;
        }
        this.curMemberArray = [];
        for (var i = 0; i < msg.players.length; i++)
        {
            if (this.curSelectType == "partner" && msg.players[i].role != CLUB_POWER.CRT_PRATNER)
                continue;
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
                teamMoney: msg.players[i].teamMoney.count,
                commission: msg.players[i].commission,
                isSearch:(true && GameDataManager.getInstance().userInfoData.userId!=msg.players[i].parent)
            }
            this.curMemberArray.push(info)
        }
        this.updateList(this.curMemberArray)
        this.curSelectPage = 1
        this.totalPage = 1
        this.updatePage()
        this.isSearchView = true
        GameManager.getInstance().openWeakTipsUI("搜索成功");
        this.node.getChildByName("sp_wait").active = false
        this.node.getChildByName("sp_empty").active = this.curMemberArray.length == 0   
        MessageManager.getInstance().disposeMsg();
    }

    onJjLimitResponse(msg)
    {
        if (this.curSelectType == "record")
        {
            MessageManager.getInstance().disposeMsg();
            return 
        }
        GameManager.getInstance().openWeakTipsUI("操作成功");
        for (var i = 0; i < this.nodeList.length; ++i) {
            var item = this.nodeList[i];
            let memberitem = item.getComponent("UnionUI_Manage_Item1");
            if (memberitem.getPartnerId() == msg.partner)
            {
                var data = JSON.parse(msg.conf)
                memberitem.updateJinJie(data.credit)
            }
        }
        MessageManager.getInstance().disposeMsg();
    }


    onConvertResponse(msg)
    {
        var clubData = GameDataManager.getInstance().clubData
        if (clubData.curSelectClubId != msg.clubId)
        {
            MessageManager.getInstance().disposeMsg();
            return;
        }
        GameManager.getInstance().openWeakTipsUI("操作成功");
        if (this.isSearchView && this.searchId != null) // 如果当前是搜索界面操作完成之后依然返回操作界面
        {
            MessageManager.getInstance().messageSend(Proto.CS_SEARCH_CLUB_PLAYER.MsgID.ID, {
                guidPattern: this.searchId,
                clubId: clubData.curSelectClubId,
                partner: this.curSelectPlayerId,
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
       
        MessageManager.getInstance().disposeMsg();
    }

    private sendPlayerListRequest(partner,role)
    {
        var clubData = GameDataManager.getInstance().clubData
        this.isWaiting = true
        this.waitTime = 3
        var msg = {
            clubId:clubData.curSelectClubId,
            partner:partner,
            role:role,
            pageSize:this.pageNum,
            pageNum:this.curSelectPage,
        }
        this.node.getChildByName("sp_wait").active = true
        this.node.getChildByName("sp_wait").runAction(cc.repeatForever(cc.rotateBy(1, 360)));
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_PLAYER_LIST_REQ.MsgID.ID,msg)
    }


    private updateButtonSelect(type){
        if (this.curSelectType)
        {
            this.node.getChildByName("btn_" + this.curSelectType).getChildByName("select_bg").active = false
            this.node.getChildByName("btn_" + this.curSelectType).getChildByName("label_name").active = false
            this.node.getChildByName("btn_" + this.curSelectType).getChildByName("label_name_unselect").active = true
            this.node.getChildByName("btn_" + this.curSelectType).getChildByName("select_bg_unselect").active = true
            if (this.curSelectType == "record" || this.curSelectType == "recordDetail")
                this.node.getChildByName("node_bottom_record").active = false
            else
                this.node.getChildByName("node_bottom_"+ this.curSelectType).active = false
            this.node.getChildByName("title_"+ this.curSelectType).active = false
        }
        this.curSelectType = type
        this.node.getChildByName("btn_" + this.curSelectType).getChildByName("select_bg").active = true
        this.node.getChildByName("btn_" + this.curSelectType).getChildByName("label_name").active = true
        this.node.getChildByName("btn_" + this.curSelectType).getChildByName("label_name_unselect").active = false
        this.node.getChildByName("btn_" + this.curSelectType).getChildByName("select_bg_unselect").active = false
        if (this.curSelectType == "record" || this.curSelectType == "recordDetail")
            this.node.getChildByName("node_bottom_record").active = true
        else
            this.node.getChildByName("node_bottom_"+ this.curSelectType).active = true
        this.node.getChildByName("title_"+this.curSelectType).active = true
        this.node.getChildByName("btn_search").active = this.curSelectType != "record" && this.curSelectType != "consume" && this.curSelectType != "recordDetail"
        this.node.getChildByName("edit_search").active = this.curSelectType != "record" && this.curSelectType != "consume" && this.curSelectType != "recordDetail"
        
    }

    private queryDataOnSelectType()
    {
        if(this.curSelectType == "member" || this.curSelectType == "partner")
        {
            this.dataArry = []
            this.onSendStateChange(false)
            if (this.curSelectType == "member")
                var role = 0
            else
                var role = 2
            this.sendPlayerListRequest(this.curSelectPlayerId, role)
        }
        else
        {
            this.curMemberArray = []
            this.isWaiting = false
            this.waitTime = 3
            this.node.getChildByName("sp_wait").active = false
            this.queryData()
        }
    }


    private updateList(dataList) // 刷新统计滚动框
    {
        this.nodeList = []
        this.nodeListContent.removeAllChildren()
        var clubData = GameDataManager.getInstance().clubData

        if (this.curSelectType == "member" || this.curSelectType == "partner")
        {
            var itemType = "UnionUI_Manage_Item1"
            this.nodeListContent.height = this.curMemberArray.length * (this.prefabItem1.data.height);
            if (this.nodeListContent.height < 430)
                this.nodeListContent.height = 430;
            for (var i = 0; i < this.curMemberArray.length; ++i) {
                var item = cc.instantiate(this.prefabItem1);
                this.nodeListContent.addChild(item);
                item.setPosition(0, -item.height * (0.5 + i));
                let memberitem = item.getComponent(itemType);
                memberitem.setInfo(this.curSelectType, clubData.curSelectClubId, this.curMemberArray[i],this.curSelectPlayerId)
                this.nodeList.push(item);
            }
        }
        else
        {
            var itemType = "UnionUI_Score_Record_Item"
            this.nodeListContent.height = dataList.length * (this.prefabItem2.data.height + this.spacing) + this.spacing;
            if (this.nodeListContent.height < 430)
                this.nodeListContent.height = 430;
            for (var i = 0; i < dataList.length; ++i) {
                var item = cc.instantiate(this.prefabItem2);
                this.nodeListContent.addChild(item);
                item.setPosition(0, -item.height * (0.5 + i) - this.spacing * (i + 1));
                let memberitem = item.getComponent(itemType);
                memberitem.initView(dataList[i], this.curSelectType)
                this.nodeList.push(item);
            }
        }

    }


    private onDataRec(event, data)
    {
        GameDataManager.getInstance().onHttpDataRec()
        if (this.node == null)
            return;
        try
        {
            this.onSendStateChange(false)
            this.nodeListContent.removeAllChildren();
            this.nodeList = [];
            this.totalPage = 1
            this.curSelectPage = 1
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
            if (!jsonData.data.data || jsonData.data.data.length == 0)
            {
                this.updatePage()
                this.node.getChildByName("sp_empty").active = true
                return
            }
            this.updatePage()
            this.node.getChildByName("sp_empty").active = false
            this.dataArry = jsonData.data.data
            this.updateList(jsonData.data.data)
        }
        catch (e)
        {
            console.log(e)
        }
    }


    private onSendStateChange(state)
    {
        this.sending = state
        this.node.getChildByName("sp_wait").active = state
        if (state)
            this.node.getChildByName("sp_empty").active = false
        if (this.sending)
            this.node.getChildByName("sp_wait").runAction(cc.repeatForever(cc.rotateBy(1, 360)));
        else
            this.node.getChildByName("sp_wait").stopAllActions()
    }


    private initDate()
    {
        var tagetNode = this.node.getChildByName("node_bottom_record").getChildByName("sp_time")
        var label = this.node.getChildByName("node_bottom_record").getChildByName("select_label").getComponent(cc.Label)
        var curDate = new Date().getTime() / 1000
        this.dateList = []
        for (var i = 0; i < 7; i++)
        {
            this.dateList.push(curDate - i*24*3600)
            if (i == 0)
                label.string = Utils.formatDate(this.dateList[i], 2) 
            tagetNode.getChildByName("label" + i).getComponent(cc.Label).string = Utils.formatDate(this.dateList[i], 2)
        }
    }

    private updateSelectTime(){
        var label = this.node.getChildByName("node_bottom_record").getChildByName("select_label").getComponent(cc.Label)
        label.string = Utils.formatDate(this.dateList[this.selectTimeIdx], 2) 
    }

    // 切换page时触发
    private resetView() {
        this.curSelectPage = 1
        this.totalPage = 1
        this.nodeListContent.removeAllChildren()
        this.nodeList = []
        this.selectTimeIdx = 0
        this.updatePage()
        var label = this.node.getChildByName("node_bottom_record").getChildByName("select_label").getComponent(cc.Label)
        label.string = Utils.formatDate(this.dateList[0], 2) 
    }

    private updatePage()
    {
        if (this.curSelectType == "consume")
            return
        var str = this.curSelectType
        if (this.curSelectType == "recordDetail")
            str = "record"
        this.node.getChildByName("node_bottom_"+str).getChildByName("label_page").getComponent(cc.Label).string = this.curSelectPage + "/" + this.totalPage
    }

    private queryData(playerId = 0)
    {
        if (GameDataManager.getInstance().httpDataWaitTime > 0)
        {
            this.node.getChildByName("sp_empty").active = true
            GameManager.getInstance().openWeakTipsUI("请求频繁，请等待"+ Math.floor(GameDataManager.getInstance().httpDataWaitTime)+"后重试");
            return
        }
        let url = ""
        let params = ""
        // var startTime = this.dateList[this.selectTimeIdx]
        var startTime = Math.floor(new Date(new Date().toLocaleDateString()).getTime()/1000) - 24 * 60 * 60 * this.selectTimeIdx
        var endTime = startTime + 24*60*60 - 1

        var reqPlayerId = GameDataManager.getInstance().userInfoData.userId
        if (playerId != 0)
            reqPlayerId = playerId
        var clubData = GameDataManager.getInstance().clubData
        var clubId = clubData.curSelectClubId
        if (this.curSelectType == "record") // 上分记录
        {
            url = GameConstValue.ConstValue.PLAYER_OP_SCORE_RECORD_QUERY_URL + "?club_id="+clubId+"&guid="+reqPlayerId+"&created_time="+startTime +"&page="+this.curSelectPage+"&end_time="+endTime
            url = HttpManager.getInstance().encryptUrl(url) + "&guid="+ GameDataManager.getInstance().userInfoData.userId
        }
        else if (this.curSelectType == "recordDetail") // 积分变化详情
        {
            url = GameConstValue.ConstValue.PLAYER_SCORE_RECORD_QUERY_URL
            params = "club_id="+clubId+"&guid="+reqPlayerId+"&created_time="+startTime +"&page="+this.curSelectPage+"&end_time="+endTime
            url = HttpManager.getInstance().encryptUrl(url + "?" + params) + "&guid="+ GameDataManager.getInstance().userInfoData.userId
        }
        else{// 15天的房卡消耗
            startTime = Math.floor(new Date(new Date().toLocaleDateString()).getTime()/1000) - 24 * 60 * 60 * 14
            endTime = Math.floor(new Date(new Date().toLocaleDateString()).getTime()/1000) + 24*60*60 - 1
            params = "club_id="+clubId+"&start_time="+startTime +"&page="+this.curSelectPage+"&end_time="+endTime
            url = GameConstValue.ConstValue.DAILY_ROOM_CARD_COST_URL // 消耗
            url = HttpManager.getInstance().encryptUrl(url + "?" + params) + "&guid="+ GameDataManager.getInstance().userInfoData.userId
        }
        GameDataManager.getInstance().onHttpDataSend()
        HttpManager.getInstance().get(url, "", "", this.onDataRec.bind(this));
        this.onSendStateChange(true)
    }

    private reqPartnerMemberInfo(playerId, playerName, type)
    {
        this.updateButtonSelect(type)
        this.curSelectPlayerId = playerId
        this.node.getChildByName("label_name").active = true
        if (type == "member")
        {
            this.node.getChildByName("label_name").getComponent(cc.Label).string = Utils.getShortName(playerName, 5) + "的成员"
        }
           
        else{
            this.node.getChildByName("label_name").getComponent(cc.Label).string = Utils.getShortName(playerName, 5) + "的组长"
        }
           
        this.queryDataOnSelectType()
    }


    private button_left_page(event, customEventData)
    {
        AudioManager.getInstance().playSFX("button_click");
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        var type = customEventData
        if (this.curSelectType == type)
            return 
        this.curSelectPlayerId = GameDataManager.getInstance().userInfoData.userId
        this.node.getChildByName("label_name").active = false
        this.updateButtonSelect(type)
        this.selectTimeIdx = 0
        this.curSelectPage = 1
        this.updateSelectTime()
        this.queryDataOnSelectType()
    }

    private nextPage() 
    {
        if (this.curSelectPage >= this.totalPage)
        {
            GameManager.getInstance().openWeakTipsUI("已经是最后一页了");
            return
        }
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        this.curSelectPage += 1
        this.queryDataOnSelectType()
    }

    private lastPage()
    {
        if (this.curSelectPage == 1)
        {
            GameManager.getInstance().openWeakTipsUI("已经是最开始一页了");
            return
        }
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        this.curSelectPage -= 1
        this.queryDataOnSelectType()
    }


    private nextPage_time() 
    {
        if (this.selectTimeIdx == 0)
        {
            GameManager.getInstance().openWeakTipsUI("您选的已经是最后一天了");
            return
        }
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        this.selectTimeIdx -= 1
        this.updateSelectTime()
        this.queryDataOnSelectType()
    }

    private lastPage_time()
    {
        this.selectTimeIdx += 1
        if (this.selectTimeIdx > this.dateList.length - 1)
        {
            GameManager.getInstance().openWeakTipsUI("超过选择范围");
            this.selectTimeIdx = this.dateList.length - 1
            return
        }
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            this.selectTimeIdx -= 1
            return
        }
        this.updateSelectTime()
        this.queryDataOnSelectType()
    }

     button_time()
     {
         AudioManager.getInstance().playSFX("button_click")
         if(this.node.getChildByName("sp_time"))
         {
            var active = this.node.getChildByName("sp_time").active
            this.node.getChildByName("sp_time").active = !active
         }
       
     }
 
     button_select_time(event, customEventData)
     {
         AudioManager.getInstance().playSFX("button_click")
         var type = parseInt(customEventData)
         if (type == this.selectTimeIdx)
             return
         if (this.sending)
         {
             GameManager.getInstance().openWeakTipsUI("数据请求中");
             return
         }
         if(this.node.getChildByName("sp_time"))
         {
            this.node.getChildByName("sp_time").active = false
         }
         this.selectTimeIdx = type
         this.updateSelectTime()
        

     }


     btn_search() {
        AudioManager.getInstance().playSFX("button_click")
        var clubData = GameDataManager.getInstance().clubData
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
        if (!clubData || !this.curSelectPlayerId)
            return 
        this.node.getChildByName("label_name").active = false
        this.curSelectPlayerId = GameDataManager.getInstance().userInfoData.userId
        this.searchId = searchId
        this.searchEdit.string = ""
        this.dataArry = []
        this.onSendStateChange(false)
        MessageManager.getInstance().messageSend(Proto.CS_SEARCH_CLUB_PLAYER.MsgID.ID, {
            guidPattern: searchId,
            clubId: clubData.curSelectClubId,
            partner: GameDataManager.getInstance().userInfoData.userId,
        })

    }


    button_close() {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().closeUI(UnionUI_Manage);
    }

    

}
