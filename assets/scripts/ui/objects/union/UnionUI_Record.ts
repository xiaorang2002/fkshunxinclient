import { UnionUI_Member_Info } from './UnionUI_Member_Info';
import { ClubRecordUI } from './../club/ClubRecordUI';
import { UnionUI_Member_Common } from './UnionUI_Member_Common';
import { UnionUI_Partner_Common } from './UnionUI_Partner_Common';
import { PlayBackUI_NN } from './../playback/PlayBackUI_NN';
import { PlayBackUI_ZJH } from './../playback/PlayBackUI_ZJH';
import { PlayBackUI_PDK } from './../playback/PlayBackUI_PDK';
import { PlayBackUI_MJ } from './../playback/PlayBackUI_MJ';
import { PlayBackUI_CP } from '../playback/PlayBackUI_CP';
import { GAME_TYPE, GAME_NAME } from './../../../data/GameConstValue';
import { Utils } from './../../../../framework/Utils/Utils';
import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { ListenerManager } from './../../../../framework/Manager/ListenerManager';
import { CLUB_POWER } from './../../../data/club/ClubData';
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
export class UnionUI_Record extends BaseUI {

    protected static className = "UnionUI_Record";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_UNION + this.className;
    }

    @property(cc.Prefab)
    tjItem1: cc.Prefab = null;
    
    @property(cc.Prefab)
    tjItem2: cc.Prefab = null;

    @property(cc.Prefab)
    recordItem1: cc.Prefab = null;

    @property(cc.Prefab)
    recordItem2: cc.Prefab = null;

    @property(cc.Node)
    tjListContent: cc.Node = null;
    
    @property(cc.Node)
    recordListContent: cc.Node = null;

    @property(cc.EditBox)
    searchEdit: cc.EditBox = null;

    @property(cc.EditBox)
    searchRoomEdit: cc.EditBox = null;

    @property(cc.Label)
    labelWinLose: cc.Label = null;
    @property(cc.Label)
    labelBigWin: cc.Label = null;
    @property(cc.Label)
    labelPlayCount: cc.Label = null;
    @property(cc.Label)
    labelActive: cc.Label = null;
    @property(cc.Label)
    labelValidCount: cc.Label = null;
    @property(cc.Label)
    labelCommission: cc.Label = null;
    @property(cc.Label)
    labelRecordPlayCount: cc.Label = null;
    @property(cc.Label)
    labelAllCommission: cc.Label = null;
    @property(cc.Label)
    labelAllValid: cc.Label = null;
    @property(cc.Node)
    gamelistnode:cc.Node = null

    private selectTimeIdx = 0   
    private curSelectType_left = ""
    private curSelectType_top = ""
    private nodeList = []
    private curSelectPage = 1                               // 当前选择的页数
    private totalPage = 0                                      // 总页数
    private pageNum = 10
    private sending = false;             
    private dataArry = []
    private dateList = []
    private curRecordArray: any = [];                       //战绩列表
    private recordItems: any = [];                                //对象数组
    private spacing: number = 6;                            //对象之间的间隔
    private roundRule = null
    private roundTableName = ""
    private searchTableId = ""
    private searchPlayerId = ""
    private sortParameter = ""
    private sortType = ""
    private selectGameId = 0
    private gameList = []

    onLoad()
    {
        
    }


    start()
    {
        ListenerManager.getInstance().add(Proto.SC_CLUB_MEMBER_INFO.MsgID.ID, this, this.onSearchRec);
        var clubData = GameDataManager.getInstance().clubData
        if(clubData.roleType == CLUB_POWER.CRT_ADMIN)
        {
            this.updateButtonSelectTop("top_mid")
            this.updateButtonSelectLeft("member")
        }
        else
        {
            this.updateButtonSelectTop("top_left")
            this.updateButtonSelectLeft("member")
        }
        this.updateSortView()
        this.initDate()
        this.initGame()
        this.resetView()
        this.queryDataOnSelectType()
    }

    private onSearchRec(msg)
    {
        MessageManager.getInstance().disposeMsg();
        try
        {
            var info = {
                isApply:false,
                guid: msg.info.info.guid, 
                icon: msg.info.info.icon, 
                nickname: msg.info.info.nickname, 
                roleType: msg.info.role, 
                time: msg.info.info.time, 
                money: msg.info.money.count,
                extra: msg.info.extraData,
                parent: msg.info.parent,
                isStopGame: msg.info.blockGaming,
                parentInfo: msg.info.parentInfo,
                cansetpartner:msg.info.cansetpartner,
                isSearch:true
            }
            UIManager.getInstance().openUI(UnionUI_Member_Info, 30, () => { 
                UIManager.getInstance().getUI(UnionUI_Member_Info).getComponent("UnionUI_Member_Info").initView("record", info);})
        }
        catch (e)
        {
            GameManager.getInstance().openWeakTipsUI("未找到该玩家信息");
        }
    }


    private updateButtonSelectLeft(type){
        var tjNode = this.node.getChildByName("node_tj")
        if (this.curSelectType_left)
        {
            tjNode.getChildByName("btn_" + this.curSelectType_left).getChildByName("select_bg").active = false
            tjNode.getChildByName("btn_" + this.curSelectType_left).getChildByName("label_name").active = false
            tjNode.getChildByName("btn_" + this.curSelectType_left).getChildByName("label_name_unselect").active = true
            tjNode.getChildByName("btn_" + this.curSelectType_left).getChildByName("select_bg_unselect").active = true
        }
        this.curSelectType_left = type
        tjNode.getChildByName("btn_" + this.curSelectType_left).getChildByName("select_bg").active = true
        tjNode.getChildByName("btn_" + this.curSelectType_left).getChildByName("label_name").active = true
        tjNode.getChildByName("btn_" + this.curSelectType_left).getChildByName("label_name_unselect").active = false
        tjNode.getChildByName("btn_" + this.curSelectType_left).getChildByName("select_bg_unselect").active = false
        tjNode.getChildByName("title_tj1").active = this.curSelectType_top == "top_left"
        tjNode.getChildByName("title_tj3").active = this.curSelectType_top == "top_right" && this.curSelectType_left == "member"
        tjNode.getChildByName("title_tj3_partner").active = this.curSelectType_top == "top_right" && this.curSelectType_left == "partner"
        this.node.getChildByName("node_bottom_tj").getChildByName("tj1").active = this.curSelectType_top == "top_left"
        this.node.getChildByName("node_bottom_tj").getChildByName("tj3").active = this.curSelectType_top == "top_right" && this.curSelectType_left == "member"
        this.node.getChildByName("node_bottom_tj").getChildByName("tj3_partner").active = this.curSelectType_top == "top_right" && this.curSelectType_left == "partner"
    }

    private updateButtonSelectTop(type)
    {
        if (this.curSelectType_top)
        {
            this.node.getChildByName("btn_" + this.curSelectType_top).getChildByName("select_bg").active = false
            this.node.getChildByName("btn_" + this.curSelectType_top).getChildByName("label_name").active = false
            this.node.getChildByName("btn_" + this.curSelectType_top).getChildByName("label_name_unselect").active = true
        }
        this.curSelectType_top = type
        this.node.getChildByName("btn_" + this.curSelectType_top).getChildByName("select_bg").active = true
        this.node.getChildByName("btn_" + this.curSelectType_top).getChildByName("label_name").active = true
        this.node.getChildByName("btn_" + this.curSelectType_top).getChildByName("label_name_unselect").active = false
        this.node.getChildByName("node_tj").active = type != "top_mid"
        this.node.getChildByName("node_record").active = type == "top_mid"
        this.node.getChildByName("node_bottom_tj").active = type != "top_mid"
        this.node.getChildByName("node_bottom_zj").active = type == "top_mid"
        if (type == "top_left")
        {
            this.sortParameter = "winlose"
            this.sortType = "desc"
        }
        else if (type == "top_right")
        {
            this.sortParameter = "commission"
            this.sortType = "desc"
        }
        if (type == "top_mid")
        {
            this.selectGameId = 0
            this.updateSelectGame()
        }
        this.node.getChildByName("node_bottom_zj").getChildByName("sp_game").active = false
        
    }

    private updateBottomData(type, data) {

        if (type == 1)
        {
            var winLose = 0
            var playCount = 0
            var bigWin = 0
            var active = 0
            if (data)
            {
                if (data.active_count)
                    active = data.active_count
                if (data.bigwin)
                    bigWin = data.bigwin
                if (data.play_count)
                    playCount = data.play_count
                if (data.winlose)
                    winLose = data.winlose
            }
            this.labelBigWin.string = bigWin.toString()
            this.labelWinLose.string = (winLose/100).toString()
            this.labelPlayCount.string = playCount.toString()
            this.labelActive.string = active.toString()
        }
        if (type == 2)
        {
            var validCount = 0
            var commission = 0
            if (data)
            {
                if (data.valid_count)
                    validCount = data.valid_count
                if (data.commission)
                    commission = data.commission
            }
            this.labelValidCount.string = validCount.toFixed(2).toString()
            this.labelCommission.string = (commission/100).toString()
        }
        if (type == 3)
        {
            var validCount = 0
            var commission = 0
            if (data)
            {
                if (data.valid_count)
                    validCount = data.valid_count
                if (data.commission)
                    commission = data.commission
            }
            this.labelAllValid.string = validCount.toFixed(2).toString()
            this.labelAllCommission.string = (commission/100).toString()
        }

    }

    private updateTjList(dataList) // 刷新统计滚动框
    {
        this.nodeList = []
        this.tjListContent.removeAllChildren()

        this.tjListContent.height = dataList.length * (this.tjItem1.data.height);
        if (this.tjListContent.height < 400)
            this.tjListContent.height = 400;
        for (let i = 0; i < dataList.length; ++i) {
            if (this.curSelectType_top == "top_right")
            {
                var componentType = "UnionUI_Record_Item2"
                var newnode = cc.instantiate(this.tjItem2);
            }
            else
            {
                var componentType = "UnionUI_Record_Item1"
                var newnode = cc.instantiate(this.tjItem1);
            }
            newnode.parent = this.tjListContent;
            var pnode = newnode.getComponent(componentType);
            pnode.initView(dataList[i], this.curSelectType_left, this.selectTimeIdx, GameDataManager.getInstance().userInfoData.userId)
            this.nodeList.push(newnode)
        }

    }

    private updateRecordList(type) {
        //清空原始数据
        this.recordListContent.removeAllChildren();
        this.recordItems = [];
        //改变大小
        this.recordListContent.height = this.curRecordArray.length * (this.recordItem1.data.height + this.spacing) + this.spacing;
        if (this.recordListContent.height < 450)
            this.recordListContent.height = 450;
        for (var index = 0; index < this.curRecordArray.length; ++index) {
            if (this.curRecordArray[index].game_id == GAME_TYPE.ZJH || this.curRecordArray[index].game_id == GAME_TYPE.NN)
            {
                var item = cc.instantiate(this.recordItem2);
                var component = "ClubRecordItem_ZJH"
            }
            else{
                var item = cc.instantiate(this.recordItem1);
                var component = "ClubRecordItem"
            }
            this.recordListContent.addChild(item);
            item.setPosition(0, -item.height * (0.5 + index) - this.spacing * (index + 1));
            item.getComponent(component).updateView(index, this.curRecordArray[index], type, this.roundRule, this.roundTableName)
            this.recordItems.push(item);
        }
        this.node.getChildByName("sp_empty").active = (this.curRecordArray.length == 0)
    }

    private onDataRec(event, data)
    {
        GameDataManager.getInstance().onHttpDataRec()
        if (this.node == null)
            return;
        this.tjListContent.removeAllChildren();
        this.nodeList = [];
        this.totalPage = 1
        this.curSelectPage = 1
        this.updatePage()
        if (event != null && event.type == "timeout")
        {
            GameManager.getInstance().openWeakTipsUI("请求数据超时");
            this.onSendStateChange(false)
            this.node.getChildByName("sp_empty").active = true
            if (this.curSelectType_top == "top_mid")
                this.node.getChildByName("sp_empty").position = cc.v3(0,0)
            else
                this.node.getChildByName("sp_empty").position = cc.v3(106,-47)
            return
        }
        if (data == null)
        {
            GameManager.getInstance().openWeakTipsUI("未查询到数据");
            this.onSendStateChange(false)
            this.node.getChildByName("sp_empty").active = true
            if (this.curSelectType_top == "top_mid")
                this.node.getChildByName("sp_empty").position = cc.v3(0,0)
            else
                this.node.getChildByName("sp_empty").position = cc.v3(106,-47)
            return
        }
        var jsonData = JSON.parse(data)
        this.totalPage = jsonData.data.last_page
        this.curSelectPage = jsonData.data.current_page
        if (!jsonData.data.data || jsonData.data.data.length == 0)
        {
            this.node.getChildByName("sp_empty").active = true
            if (this.curSelectType_top == "top_mid")
                this.node.getChildByName("sp_empty").position = cc.v3(0,0)
            else
                this.node.getChildByName("sp_empty").position = cc.v3(106,-47)
            this.onSendStateChange(false)
            return
        }
        this.updatePage()
        this.node.getChildByName("sp_empty").active = false
        this.dataArry = jsonData.data.data
        this.updateTjList(jsonData.data.data)
        if (this.curSelectType_top == "top_left")
            this.updateBottomData(1, jsonData.data.total_data)
        else if (this.curSelectType_left == "member" && this.curSelectType_top == "top_right")
            this.updateBottomData(2, jsonData.data.total_data)
        else if (this.curSelectType_left == "partner" && this.curSelectType_top == "top_right")
            this.updateBottomData(3, jsonData.data.total_data)
        this.onSendStateChange(false)
    }

    clubRecordListResponse(event, data)
    {
        GameDataManager.getInstance().onHttpDataRec()
        if (this.node == null)
            return;
        this.onSendStateChange(false)
        this.recordListContent.removeAllChildren();
        this.recordItems = [];
        this.curRecordArray = []
        this.totalPage = 1
        this.curSelectPage = 1
        if (event != null && event.type == "timeout")
        {
            GameManager.getInstance().openWeakTipsUI("请求数据超时");
            this.node.getChildByName("sp_empty").active = true
            this.labelRecordPlayCount.string = ""
            if (this.curSelectType_top == "top_mid")
                this.node.getChildByName("sp_empty").position = cc.v3(0,0)
            else
                this.node.getChildByName("sp_empty").position = cc.v3(106,-47)
            return
        }
        if (data == null)
        {
            GameManager.getInstance().openWeakTipsUI("未查询到信息");
            this.node.getChildByName("sp_empty").active = true
            this.labelRecordPlayCount.string = ""
            if (this.curSelectType_top == "top_mid")
                this.node.getChildByName("sp_empty").position = cc.v3(0,0)
            else
                this.node.getChildByName("sp_empty").position = cc.v3(106,-47)
            return
        }
        var jsonData = JSON.parse(data)
        if (jsonData.data.data.length == 0)
        {
            this.updatePage()
            this.node.getChildByName("sp_empty").active = true
            this.labelRecordPlayCount.string = ""
            if (this.curSelectType_top == "top_mid")
                this.node.getChildByName("sp_empty").position = cc.v3(0,0)
            else
                this.node.getChildByName("sp_empty").position = cc.v3(106,-47)
            return
        }
        this.node.getChildByName("sp_empty").active = false
        this.totalPage = jsonData.data.last_page
        this.curSelectPage = jsonData.data.current_page
        if (jsonData.data.total)
            this.labelRecordPlayCount.string = jsonData.data.total
        else
            this.labelRecordPlayCount.string = ""
        this.updatePage()
        this.curRecordArray = jsonData.data.data
        this.updateRecordList("big_type");
        this.node.getChildByName("node_bottom_zj").getChildByName("btn_return").active = false
    }

    roundDataListResponse(event, data) {
        GameDataManager.getInstance().onHttpDataRec()
        if (this.node == null)
            return;
        this.onSendStateChange(false)
        if (event != null && event.type == "timeout")
        {
            GameManager.getInstance().openWeakTipsUI("请求数据超时");
            return
        }
        if (data == null)
        {
            GameManager.getInstance().openWeakTipsUI("未查询到当日对局信息");
            return
        }
        var jsonData = JSON.parse(data)
        if (jsonData.data.data.length == 0)
        {
            this.recordListContent.removeAllChildren();
            this.recordItems = [];
            this.curRecordArray = []
            this.totalPage = 0
            this.curSelectPage = 1
            this.updatePage()
            this.node.getChildByName("sp_empty").active = true
            if (this.curSelectType_top == "top_mid")
                this.node.getChildByName("sp_empty").position = cc.v3(0,0)
            else
                this.node.getChildByName("sp_empty").position = cc.v3(106,-47)
            return
        }
        this.node.getChildByName("sp_empty").active = false
        this.totalPage = jsonData.data.last_page
        this.curSelectPage = jsonData.data.current_page
        this.updatePage()
        this.curRecordArray = jsonData.data.data
        this.updateRecordList("round_type");
        this.node.getChildByName("node_bottom_zj").getChildByName("btn_return").active = true
    }


    private onSendStateChange(state)
    {
        this.sending = state
        this.node.getChildByName("sp_wait").active = state
        if (this.curSelectType_top == "top_mid")
            this.node.getChildByName("sp_wait").position = cc.v3(0,0)
        else
            this.node.getChildByName("sp_wait").position = cc.v3(106,-34)
        if (state)
            this.node.getChildByName("sp_empty").active = false
        if (this.sending)
            this.node.getChildByName("sp_wait").runAction(cc.repeatForever(cc.rotateBy(1, 360)));
        else
            this.node.getChildByName("sp_wait").stopAllActions()
    }

    private initDate()
    {
        var tagetNode = this.node.getChildByName("sp_time")
        var label = this.node.getChildByName("select_label").getComponent(cc.Label)
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

    private initGame()
    {
        var clubData = GameDataManager.getInstance().clubData
        var tagetNode = this.node.getChildByName("node_bottom_zj").getChildByName("sp_game")
        this.gamelistnode.getChildByName("label" + 0).getComponent(cc.Label).string = "全部"
        var count = 1
        for (var i = 0; i < clubData.clubPower.length; i++)
        {   
            if (count > 19)
                continue
            if (clubData.clubPower[i] == 203 || clubData.clubPower[i] == 100 || clubData.clubPower[i] == 110 || clubData.clubPower[i] == 230)
                continue
            var gameName = GAME_NAME[clubData.clubPower[i]]
            this.gamelistnode.getChildByName("label" + count).getComponent(cc.Label).string = gameName
            count += 1
            this.gameList.push(clubData.clubPower[i])
        }
        this.gamelistnode.height = count*47
        tagetNode.height = count*47
        if(tagetNode.height > 470)
        {
            tagetNode.height = 470
        }
    }

    private updateSelectTime(){
        var label = this.node.getChildByName("select_label").getComponent(cc.Label)
        label.string = Utils.formatDate(this.dateList[this.selectTimeIdx], 2) 
    }

    private updateSelectGame(){
        var label = this.node.getChildByName("node_bottom_zj").getChildByName("game_id").getComponent(cc.Label)
        if (this.selectGameId == 0)
            label.string = "全 部"
        else
            label.string = GAME_NAME[this.selectGameId]
    }

    // 切换page时触发
    private resetView() {
        this.curSelectPage = 1
        this.totalPage = 1
        this.tjListContent.removeAllChildren()
        this.nodeList = []
        this.selectTimeIdx = 0
        this.updatePage()
        var label = this.node.getChildByName("select_label").getComponent(cc.Label)
        label.string = Utils.formatDate(this.dateList[0], 2) 
    }

    private updatePage()
    {
        this.node.getChildByName("label_page").getComponent(cc.Label).string = this.curSelectPage + "/" + this.totalPage
    }

    private updateSortView()
    {
        if (this.curSelectType_top == "top_left")
        {
            var targetNode = this.node.getChildByName("node_tj").getChildByName("title_tj1")
            targetNode.getChildByName("sort_winlose").active = false;
            targetNode.getChildByName("sort_bigwin_count").active = false;
            targetNode.getChildByName("sort_play_count").active = false;
            targetNode.getChildByName("sort_"+this.sortParameter).active = true;
            targetNode.getChildByName("sort_"+this.sortParameter).getChildByName("desc").active = this.sortType == "desc";
        }
        else if (this.curSelectType_top == "top_right")
        {
            if (this.curSelectType_left == "member")
                var targetNode = this.node.getChildByName("node_tj").getChildByName("title_tj3")
            else
                var targetNode = this.node.getChildByName("node_tj").getChildByName("title_tj3_partner")
            targetNode.getChildByName("sort_commission").active = false;
            targetNode.getChildByName("sort_valid_count").active = false;
            targetNode.getChildByName("sort_"+this.sortParameter).active = true;
            targetNode.getChildByName("sort_"+this.sortParameter).getChildByName("desc").active = this.sortType == "desc";
            
        }
    }

    private queryDataOnSelectType(playerId = 0)
    {
        if (this.curSelectType_top == "top_left" || this.curSelectType_top == "top_right")
        {
            this.recordListContent.removeAllChildren();
            this.recordItems = [];
            this.curRecordArray = []
            this.updatePage()
            this.queryData(playerId)
        }
        else
        {

            this.tjListContent.removeAllChildren();
            this.nodeList = [];
            this.updatePage()
            this.node.getChildByName("node_bottom_zj").getChildByName("btn_return").active = false
            this.queryRecordDate()
        }
    }

    private queryData(playerId = 0)
    {
        if(this.curSelectType_top == "top_mid")
            return
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
        if (this.curSelectType_top == "top_left" && this.curSelectType_left == "member") // 选择是战绩统计-成员
        {
            url = GameConstValue.ConstValue.NEW_MEMBER_RECORD_STATISTICS_URL 
            params = "club_id="+clubId+"&guid="+reqPlayerId+"&start_time="+startTime +"&page="+this.curSelectPage+"&end_time="+endTime+ "&team_id=" + reqPlayerId           
        }
        else if (this.curSelectType_top == "top_left" && this.curSelectType_left == "partner") // 选择是战绩统计-组长
        {
            url = GameConstValue.ConstValue.NEW_MEMBER_RECORD_STATISTICS_PARTNER_URL 
            params = "club_id="+clubId+"&guid="+reqPlayerId+"&start_time="+startTime +"&page="+this.curSelectPage+"&end_time="+endTime+ "&team_id=" + reqPlayerId           
        }
        else if (this.curSelectType_top == "top_right" && this.curSelectType_left == "member") // 选择是联盟统计-成员
        {
            url = GameConstValue.ConstValue.NEW_UNION_STATISTICS_MEMBER_URL 
            params = "club_id="+clubId+"&guid="+reqPlayerId+"&start_time="+startTime +"&page="+this.curSelectPage+"&end_time="+endTime+ "&team_id=" + reqPlayerId
        }
        else if (this.curSelectType_top == "top_right" && this.curSelectType_left == "partner") // 选择是联盟统计-组长
        {
            url = GameConstValue.ConstValue.NEW_UNION_STATISTICS_PARTNER_URL
            params = "club_id="+clubId+"&guid="+reqPlayerId+"&start_time="+startTime +"&page="+this.curSelectPage+"&end_time="+endTime+ "&team_id=" + reqPlayerId
        }
        if (this.sortParameter.length > 0) { 
            params += "&sort=" + this.sortParameter + "&order=" + this.sortType
        }

        url = HttpManager.getInstance().encryptUrl(url + "?" + params) + "&guid="+ GameDataManager.getInstance().userInfoData.userId
        GameDataManager.getInstance().onHttpDataSend()
        HttpManager.getInstance().get(url, "", "", this.onDataRec.bind(this));
        this.onSendStateChange(true)
    }

    private queryRecordDate()
    {
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        if (GameDataManager.getInstance().httpDataWaitTime > 0)
        {
            GameManager.getInstance().openWeakTipsUI("请求频繁，请等待"+ Math.floor(GameDataManager.getInstance().httpDataWaitTime)+"后重试");
            this.node.getChildByName("sp_empty").active = true
            if (this.curSelectType_top == "top_mid")
                this.node.getChildByName("sp_empty").position = cc.v3(0,0)
            else
                this.node.getChildByName("sp_empty").position = cc.v3(106,-47)
            return
        }
        var clubId = GameDataManager.getInstance().clubData.curSelectClubId
        var startTime = Math.floor(new Date(new Date().toLocaleDateString()).getTime()/1000) - 24 * 60 * 60 * this.selectTimeIdx;// 要查询的日期0点
        var endTime = startTime + 24*60*60 - 1
        var url = GameConstValue.ConstValue.QUERY_TEAM_RECORD_URL 
        var reqPlayerId = GameDataManager.getInstance().userInfoData.userId
        var params = "start_time="+startTime+"&end_time="+endTime+"&guid="+ reqPlayerId +"&page="+this.curSelectPage+"&team_id="+reqPlayerId + "&club_id="+clubId
        if (this.searchTableId != "")
            params += "&table_id=" + this.searchTableId
        else if (this.selectGameId != 0)
        {
            var gameMsg = JSON.stringify({game_id:this.selectGameId}) 
            params += "&filter=" + gameMsg
        }
        this.searchTableId = ""
        this.labelRecordPlayCount.string = ""
        this.onSendStateChange(true)
        GameDataManager.getInstance().onHttpDataSend()

        url = HttpManager.getInstance().encryptUrl(url + "?" + params) + "&guid="+ GameDataManager.getInstance().userInfoData.userId

        HttpManager.getInstance().get(url, "", "", this.clubRecordListResponse.bind(this));
    }

    public queryRoudData(roundId, gameRule, tableName)
    {
        if (this.curSelectType_top != "top_mid")
            return
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        if (GameDataManager.getInstance().httpDataWaitTime > 0)
        {
            GameManager.getInstance().openWeakTipsUI("请求频繁，请等待"+ Math.floor(GameDataManager.getInstance().httpDataWaitTime)+"后重试");
            return
        }
        var startTime = Math.floor(new Date(new Date().toLocaleDateString()).getTime()/1000) - 24 * 60 * 60 * this.selectTimeIdx;// 要查询的日期0点
        var endTime = startTime + 24*60*60 - 1       
        let url = GameConstValue.ConstValue.RECORD_QUERY_URL  + "?start_time="+startTime+"&end_time="+endTime+"&page=1"+"&round_id="+roundId
        url = HttpManager.getInstance().encryptUrl(url) + "&guid="+ GameDataManager.getInstance().userInfoData.userId
        this.roundRule = gameRule
        this.roundTableName = tableName
        this.onSendStateChange(true)
        GameDataManager.getInstance().onHttpDataSend()
        HttpManager.getInstance().get(url, "", "", this.roundDataListResponse.bind(this));
    }

    resPlayBack(gameId, index) {
        if (this.curSelectType_top != "top_mid")
            return
        try
        {
            var info = JSON.parse(this.curRecordArray[index].log) 
            if (!info.rule)
                info.rule = JSON.parse(this.roundRule) 
            var reqPlayerId = GameDataManager.getInstance().userInfoData.userId
            var targetId = this.curRecordArray[index].game_id
            if (Utils.isXzmj(gameId) || gameId == GameConstValue.GAME_TYPE.MHXL|| gameId == GameConstValue.GAME_TYPE.LFMJ)
            {
                UIManager.getInstance().openUI(PlayBackUI_MJ, 31, () => {
                    UIManager.getInstance().getUI(PlayBackUI_MJ).getComponent("PlayBackUI_MJ").initView(targetId, info,reqPlayerId);
                })
            }
            else if(gameId == GameConstValue.GAME_TYPE.PDK || gameId == GameConstValue.GAME_TYPE.LRPDK|| gameId == GameConstValue.GAME_TYPE.SCPDK || gameId == GameConstValue.GAME_TYPE.DDZ)    
            {
                UIManager.getInstance().openUI(PlayBackUI_PDK, 31, () => {
                    UIManager.getInstance().getUI(PlayBackUI_PDK).getComponent("PlayBackUI_PDK").initView(targetId, info, reqPlayerId);
                })
            }
            else if (gameId == GameConstValue.GAME_TYPE.ZJH)
            {
                UIManager.getInstance().openUI(PlayBackUI_ZJH, 31, () => {
                    UIManager.getInstance().getUI(PlayBackUI_ZJH).getComponent("PlayBackUI_ZJH").initView(targetId, info, reqPlayerId);
                })
            }
            else if (gameId == GameConstValue.GAME_TYPE.NN)
            {
                UIManager.getInstance().openUI(PlayBackUI_NN, 31, () => {
                    UIManager.getInstance().getUI(PlayBackUI_NN).getComponent("PlayBackUI_NN").initView(targetId, info, reqPlayerId);
                })
            }
            else if (gameId == GameConstValue.GAME_TYPE.ZGCP)
            {
                UIManager.getInstance().openUI(PlayBackUI_CP, 31, () => {
                    UIManager.getInstance().getUI(PlayBackUI_CP).getComponent("PlayBackUI_CP").initView(gameId, info, this.playerId);
                })
            }
        }
        catch (e)
        {
            GameManager.getInstance().openWeakTipsUI("战绩回放失败，刷新后重试");
        }
    }


    private nextPage() 
    {
        if (this.curSelectPage >= this.totalPage)
        {
            GameManager.getInstance().openWeakTipsUI("已经是最后一页了");
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
        this.curSelectPage -= 1
        this.queryDataOnSelectType()
    }


    button_close() {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().closeUI(UnionUI_Record);
    }

     private button_top(event, customEventData)
     {
        AudioManager.getInstance().playSFX("button_click");
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        var type = customEventData
        var clubData = GameDataManager.getInstance().clubData
        if (clubData.roleType == CLUB_POWER.CRT_ADMIN && type == "top_right")
        {
            GameManager.getInstance().openWeakTipsUI("功能未开放");
            return
        }
        if (this.curSelectType_top == type)
            return 
        var leftSelect = this.curSelectType_left
        this.curSelectType_left = ""
        this.totalPage = 1
        this.curSelectPage = 1
        this.updateButtonSelectTop(type)
        this.updateButtonSelectLeft(leftSelect)
        this.updateSortView()
        this.queryDataOnSelectType()
     }

     private button_left(event, customEventData)
     {
        AudioManager.getInstance().playSFX("button_click");
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        var type = customEventData
        if (this.curSelectType_left == type)
            return 
        this.totalPage = 1
        this.curSelectPage = 1
        this.updateButtonSelectLeft(type)
        this.updateSortView()
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
         this.node.getChildByName("sp_time").active = false
         this.selectTimeIdx = type
         this.updateSelectTime()
        this.queryDataOnSelectType()

     }

     button_game()
     {
        AudioManager.getInstance().playSFX("button_click")
        var active = this.node.getChildByName("node_bottom_zj").getChildByName("sp_game").active
        this.node.getChildByName("node_bottom_zj").getChildByName("sp_game").active = !active
     }
 
     button_select_game(event, customEventData)
     {
        AudioManager.getInstance().playSFX("button_click")
        this.node.getChildByName("node_bottom_zj").getChildByName("sp_game").active = false
        var type = parseInt(customEventData)
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        if (this.curSelectType_top != "top_mid")
            return
        var gameid = 0
        if (type != 0)
            gameid = this.gameList[type - 1]
        if (gameid == this.selectGameId)
            return
        this.selectGameId = gameid
        this.updateSelectGame()
        this.queryDataOnSelectType()
     }


     btn_search() {
        AudioManager.getInstance().playSFX("button_click")
        var searchId = this.searchEdit.string
        var intId = parseInt(searchId)
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            this.selectTimeIdx -= 1
            return
        }
        if (searchId == "") {
            GameManager.getInstance().openWeakTipsUI("搜索ID不能为空");
            return 
        }
        else if (isNaN(intId))
        {
            GameManager.getInstance().openWeakTipsUI("请输入数字ID");
            return 
        }
        else if (this.curSelectType_top != "top_mid")
        {   
            if (searchId.length < 4)
            {
                GameManager.getInstance().openWeakTipsUI("至少输入4位ID");
                return 
            }
        }
        else if (this.curSelectType_top == "top_mid")
        {   
            if (searchId.length < 6)
            {
                GameManager.getInstance().openWeakTipsUI("请输入玩家的全ID");
                return 
            }
        }
        this.searchEdit.string = ""
        if (this.curSelectType_left == "partner" && this.curSelectType_top == "top_left")
        {
            UIManager.getInstance().openUI(UnionUI_Partner_Common, 20, () => {
                UIManager.getInstance().getUI(UnionUI_Partner_Common).getComponent("UnionUI_Partner_Common").initSearchView(searchId,searchId,"top_left",this.selectTimeIdx)
            })
        }
        else if (this.curSelectType_left == "member" && this.curSelectType_top == "top_left")
        {
            UIManager.getInstance().openUI(UnionUI_Member_Common, 25, () => {
                UIManager.getInstance().getUI(UnionUI_Member_Common).getComponent("UnionUI_Member_Common").initSearchView(searchId,searchId,"top_left",this.selectTimeIdx)
            })
        }
        else if (this.curSelectType_left == "member" && this.curSelectType_top == "top_right")
        {
            UIManager.getInstance().openUI(UnionUI_Member_Common, 25, () => {
                UIManager.getInstance().getUI(UnionUI_Member_Common).getComponent("UnionUI_Member_Common").initSearchView(searchId,searchId,"top_right",this.selectTimeIdx)
            })
        }
        else if (this.curSelectType_left == "partner" && this.curSelectType_top == "top_right")
        {
            UIManager.getInstance().openUI(UnionUI_Partner_Common, 20, () => {
                UIManager.getInstance().getUI(UnionUI_Partner_Common).getComponent("UnionUI_Partner_Common").initSearchView(searchId,searchId,"top_right",this.selectTimeIdx)
            })
        }
        else if (this.curSelectType_top == "top_mid")
        {
            UIManager.getInstance().openUI(ClubRecordUI, 30, () => {
                UIManager.getInstance().getUI(ClubRecordUI).getComponent("ClubRecordUI").setQuerySearchPlayerInfo(searchId, this.selectTimeIdx)
                UIManager.getInstance().getUI(ClubRecordUI).getComponent("ClubRecordUI").updateView()
            })
        }

    }

    btn_search_room()
    {
        AudioManager.getInstance().playSFX("button_click")
        var searchId = this.searchRoomEdit.string
        var intId = parseInt(searchId)
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            this.selectTimeIdx -= 1
            return
        }
        if (searchId == "") {
            GameManager.getInstance().openWeakTipsUI("房间号不能为空");
            return 
        }
        else if (isNaN(intId))
        {
            GameManager.getInstance().openWeakTipsUI("请输入数字");
            return 
        } 
        else if (searchId.length < 6)
        {
            GameManager.getInstance().openWeakTipsUI("请输入至少的6位房间号");
            return 
        }
        this.searchRoomEdit.string = ""
        this.searchTableId = searchId
        UIManager.getInstance().openUI(ClubRecordUI, 30, () => {
            UIManager.getInstance().getUI(ClubRecordUI).getComponent("ClubRecordUI").setQuerySearchTableInfo(this.searchTableId, this.selectTimeIdx)
            UIManager.getInstance().getUI(ClubRecordUI).getComponent("ClubRecordUI").updateView()
        })

    }

    btn_return()
    {
        AudioManager.getInstance().playSFX("button_click")
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            this.selectTimeIdx -= 1
            return
        }
        this.queryDataOnSelectType()
    }

    btn_sort(event, customEventData)
    {
        AudioManager.getInstance().playSFX("button_click")
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            this.selectTimeIdx -= 1
            return
        }
        if (this.sortParameter == customEventData)
        {
            if (this.sortType == "desc")
                this.sortType = "asc"
            else
                this.sortType = "desc"
        }
        else
            this.sortType = "desc"
        this.sortParameter = customEventData
        this.updateSortView()
        this.queryDataOnSelectType()
    }


}
