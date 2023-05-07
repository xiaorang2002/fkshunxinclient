import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { UnionUI_Member_Info } from './../union/UnionUI_Member_Info';
import { ListenerManager } from './../../../../framework/Manager/ListenerManager';
import { CLUB_POWER } from './../../../data/club/ClubData';
import { ClubUI } from './../../ClubUI';
import { PlayBackUI_ZJH } from './../playback/PlayBackUI_ZJH';
import { GAME_TYPE, GAME_NAME } from './../../../data/GameConstValue';
import { PlayBackUI_PDK } from './../playback/PlayBackUI_PDK';
import { Utils } from './../../../../framework/Utils/Utils';
import { PlayBackUI_MJ } from './../playback/PlayBackUI_MJ';
import { HttpManager } from './../../../../framework/Manager/HttpManager';
import { BaseUI, UIClass } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { GameManager } from "../../../GameManager";
import { AudioManager } from "../../../../framework/Manager/AudioManager";
import * as Proto from "../../../../proto/proto-min";
import { PlayBackUI_NN } from './../playback/PlayBackUI_NN';
import { PlayBackUI_CP } from '../playback/PlayBackUI_CP';

const { ccclass, property } = cc._decorator;

@ccclass
export class ClubRecordUI extends BaseUI {

    protected static className = "ClubRecordUI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_CLUB_DIR + this.className;
    }

    private curRecordArray: any = [];                       //战绩列表
    private recordItems: any = [];                                //对象数组

    private spacing: number = 6;                            //对象之间的间隔
    private sending = false;                
    private curSelectPage = 1
    private totalPage = 0                                      // 总页数
    private playerId = 0
    private playername = ''
    private curSelectType = 0   // 0 个人战绩   1 团队战绩
    private roundRule = null
    private roundTableName = ""
    private dateList = []
    private selectTimeIdx = 0
    private searchTableId = null
    private needCheckPower = true
    private selectGameId = 0
    private gameList = []

    @property(cc.Prefab)
    recordPrefab: cc.Prefab = null;
    @property(cc.Prefab)
    recordPrefab_ZJH: cc.Prefab = null;
    @property(cc.ScrollView)
    scrollViewRecord: cc.ScrollView = null;
    @property(cc.Node)
    nodeListRecord: cc.Node = null;
    @property(cc.Label)
    labelPlayCount: cc.Label = null;
    @property(cc.Node)
    gameListContent: cc.Node = null;

    onLoad(){
        super.onLoad()
    }

    start() {
        ListenerManager.getInstance().add(Proto.SC_CLUB_MEMBER_INFO.MsgID.ID, this, this.onSearchRec);
        this.updatePage()
        this.updateSelectGame()
        this.initGame()
        if(this.playername == '')
        {
            this.playername = GameDataManager.getInstance().userInfoData.userName
        }
        this.node.getChildByName("label_name").getComponent(cc.Label).string = "玩家:"+this.playername
    }

    setQueryPlayerInfo(id,name,icon = null, needCheckPower = true) {
        this.initDate();
        this.playerId = id
        this.playername = name
        this.node.getChildByName("label_name").getComponent(cc.Label).string = Utils.getShortName(name, 5)  + "的战绩"
    }

    setQuerySearchTableInfo(id, timeIdx)
    {

        this.initDate();
        this.searchTableId = id
        this.selectTimeIdx = timeIdx
        this.playerId = GameDataManager.getInstance().userInfoData.userId
        this.node.getChildByName("label_name").getComponent(cc.Label).string = "搜索结果"
        this.updateSelectTime()
    }

    setQuerySearchPlayerInfo(id, timeIdx)
    {
        this.initDate();
        this.playerId = parseInt(id)
        this.selectTimeIdx = timeIdx
        this.node.getChildByName("label_name").getComponent(cc.Label).string = "搜索结果"
        this.updateSelectTime()
    }

    updateView(){
        if (this.needCheckPower)
            this.updateTypeByPower()
        this.queryDate()
    }

    updateTypeByPower(){
        this.curSelectType = 0
        if (UIManager.getInstance().getUI(ClubUI) && GameDataManager.getInstance().clubData.roleType >= CLUB_POWER.CRT_PRATNER){
                this.curSelectType = 1
        }
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

    resPlayBack(gameId, index) {
        try
        {
            var info = JSON.parse(this.curRecordArray[index].log) 
            if (!info.rule)
                info.rule = JSON.parse(this.roundRule) 
            var gameId = this.curRecordArray[index].game_id
            if (Utils.isXzmj(gameId) || gameId == GameConstValue.GAME_TYPE.MHXL|| gameId == GameConstValue.GAME_TYPE.LFMJ)
            {
                UIManager.getInstance().openUI(PlayBackUI_MJ, 31, () => {
                    UIManager.getInstance().getUI(PlayBackUI_MJ).getComponent("PlayBackUI_MJ").initView(gameId, info,this.playerId);
                })
            }
            else if(gameId == GameConstValue.GAME_TYPE.PDK || gameId == GameConstValue.GAME_TYPE.LRPDK|| gameId == GameConstValue.GAME_TYPE.SCPDK || gameId == GameConstValue.GAME_TYPE.DDZ)    
            {
                UIManager.getInstance().openUI(PlayBackUI_PDK, 31, () => {
                    UIManager.getInstance().getUI(PlayBackUI_PDK).getComponent("PlayBackUI_PDK").initView(gameId, info, this.playerId);
                })
            }
            else if (gameId == GameConstValue.GAME_TYPE.ZJH)
            {
                UIManager.getInstance().openUI(PlayBackUI_ZJH, 31, () => {
                    UIManager.getInstance().getUI(PlayBackUI_ZJH).getComponent("PlayBackUI_ZJH").initView(gameId, info, this.playerId);
                })
            }
            else if (gameId == GameConstValue.GAME_TYPE.NN)
            {
                UIManager.getInstance().openUI(PlayBackUI_NN, 31, () => {
                    UIManager.getInstance().getUI(PlayBackUI_NN).getComponent("PlayBackUI_NN").initView(gameId, info, this.playerId);
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

    clearPage()
    {
        this.curSelectPage = 1
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
            this.nodeListRecord.removeAllChildren();
            this.recordItems = [];
            this.curRecordArray = []
            this.totalPage = 0
            this.curSelectPage = 1
            this.updatePage()
            this.node.getChildByName("sp_empty").active = true
            return
        }
        this.node.getChildByName("sp_empty").active = false
        this.totalPage = jsonData.data.last_page
        this.curSelectPage = jsonData.data.current_page
        this.updatePage()
        this.curRecordArray = jsonData.data.data
        this.updateList("round_type");
        this.node.getChildByName("btn_return").active = true
    }

    clubRecordListResponse(event, data)
    {
        GameDataManager.getInstance().onHttpDataRec()
        if (this.node == null)
            return;
        this.onSendStateChange(false)
        if (event != null && event.type == "timeout")
        {
            GameManager.getInstance().openWeakTipsUI("请求数据超时");
            this.node.getChildByName("sp_empty").active = true
            this.labelPlayCount.string = "0"
            return
        }
        if (data == null)
        {
            GameManager.getInstance().openWeakTipsUI("未查询到信息");
            this.node.getChildByName("sp_empty").active = true
            this.labelPlayCount.string = "0"
            return
        }
        var jsonData = JSON.parse(data)
        if (jsonData.data.data.length == 0)
        {
            this.nodeListRecord.removeAllChildren();
            this.recordItems = [];
            this.curRecordArray = []
            this.totalPage = 1
            this.curSelectPage = 1
            this.updatePage()
            this.node.getChildByName("sp_empty").active = true
            this.labelPlayCount.string = "0"
            return
        }
        this.node.getChildByName("sp_empty").active = false
        this.totalPage = jsonData.data.last_page
        this.curSelectPage = jsonData.data.current_page
        this.updatePage()
        if (jsonData.data.total)
            this.labelPlayCount.string = jsonData.data.total
        else
            this.labelPlayCount.string = "0"
        this.curRecordArray = jsonData.data.data
        this.updateList("big_type");
        this.node.getChildByName("btn_return").active = false
    }

    //刷新列表
    private updateList(type) {
        //清空原始数据
        this.nodeListRecord.removeAllChildren();
        this.recordItems = [];
        //改变大小
        this.nodeListRecord.height = this.curRecordArray.length * (this.recordPrefab.data.height + this.spacing) + this.spacing;
        if (this.nodeListRecord.height < 420)
            this.nodeListRecord.height = 420;
        for (var index = 0; index < this.curRecordArray.length; ++index) {
            if (this.curRecordArray[index].game_id == GAME_TYPE.ZJH || this.curRecordArray[index].game_id == GAME_TYPE.NN)
            {
                var item = cc.instantiate(this.recordPrefab_ZJH);
                var component = "ClubRecordItem_ZJH"
            }
            else{
                var item = cc.instantiate(this.recordPrefab);
                var component = "ClubRecordItem"
            }
            this.nodeListRecord.addChild(item);
            item.setPosition(0, -item.height * (0.5 + index) - this.spacing * (index + 1));
            item.getComponent(component).updateView(index, this.curRecordArray[index], type, this.roundRule, this.roundTableName)
            this.recordItems.push(item);
        }
        this.node.getChildByName("sp_empty").active = (this.curRecordArray.length == 0)
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
        var gameTypeList = GameDataManager.getInstance().systemData.gameTypeList
        if (UIManager.getInstance().getUI(ClubUI))
            gameTypeList = GameDataManager.getInstance().clubData.clubPower
        var tagetNode = this.node.getChildByName("sp_game")
        this.gameListContent.getChildByName("label" + 0).getComponent(cc.Label).string = "全部"
        var count = 1
        for (var i = 0; i < gameTypeList.length; i++)
        {   
            if (count > 19)
                continue
            if (gameTypeList[i] == 203 || gameTypeList[i] == 100 || gameTypeList[i] == 110 || gameTypeList[i] == 230)
                continue
            var gameName = GAME_NAME[gameTypeList[i]]
            this.gameListContent.getChildByName("label" + count).getComponent(cc.Label).string = gameName
            count += 1
            this.gameList.push(gameTypeList[i])
        }
        this.gameListContent.height = count * 48
        this.node.getChildByName("sp_game").height = count * 48
        this.node.getChildByName("sp_game").getChildByName("view").height = count * 48
        tagetNode.height = count*48
        if(tagetNode.height > 495)
        {
            tagetNode.height = 495
            this.node.getChildByName("sp_game").getChildByName("view").height = 495
        }
       

        
    }


    private updateSelectTime(){
        var label = this.node.getChildByName("select_label").getComponent(cc.Label)
        label.string = Utils.formatDate(this.dateList[this.selectTimeIdx], 2) 
    }

    private updateSelectGame(){
        var label = this.node.getChildByName("game_id").getComponent(cc.Label)
        if (this.selectGameId == 0)
            label.string = "全 部"
        else
            label.string = GAME_NAME[this.selectGameId]
    }

    private queryDate()
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
            return
        }
        var startTime = Math.floor(new Date(new Date().toLocaleDateString()).getTime()/1000) - 24 * 60 * 60 * this.selectTimeIdx;// 要查询的日期0点
        var endTime = startTime + 24*60*60 - 1
        var myId = GameDataManager.getInstance().userInfoData.userId
        if (UIManager.getInstance().getUI(ClubUI))
        {
            var clubData = GameDataManager.getInstance().clubData
            if (clubData.clubSettings != "")
            {
                var info = JSON.parse(clubData.clubSettings)
                if ((info.allow_search_record_no_limit == true || info.allow_search_record_no_limit == "true") && this.playerId != myId)
                {
                    myId = this.playerId 
                    this.curSelectType = 0
                }
            }
        }
        if(this.curSelectType == 0)
        {
            var url = GameConstValue.ConstValue.RECORD_ALL_QUERY_URL 
            var params = "start_time="+startTime+"&end_time="+endTime+"&guid="+ myId + "&page="+this.curSelectPage
        }
        else{
            var url = GameConstValue.ConstValue.QUERY_TEAM_RECORD_URL 
            var params = "start_time="+startTime+"&end_time="+endTime+"&guid="+ myId +"&page="+this.curSelectPage+"&team_id="+myId
        }

        if (UIManager.getInstance().getUI(ClubUI)) // 如果是在群里面点击战绩
        {
            var clubId = GameDataManager.getInstance().clubData.curSelectClubId
            params += "&club_id="+clubId
        }

        if(this.searchTableId != null)
        {
            params += "&filter=" + JSON.stringify({table_id:this.searchTableId}) 
        }
        else if (this.selectGameId != 0)
        {
            if (this.playerId != myId)
            {
                var filterMsg1 = {game_id:this.selectGameId, guid:this.playerId} 
                params += "&filter=" + JSON.stringify(filterMsg1) 
            }
            else
            {
                var filterMsg2 = {game_id:this.selectGameId} 
                params += "&filter=" + JSON.stringify(filterMsg2) 
            }
        }
        else if (this.playerId != myId)
        {
            var gameMsg = JSON.stringify({guid:this.playerId})  
            params += "&filter=" + gameMsg
        }
        url = HttpManager.getInstance().encryptUrl(url + "?" + params) + "&guid="+ GameDataManager.getInstance().userInfoData.userId
        this.onSendStateChange(true)
        GameDataManager.getInstance().onHttpDataSend()
        HttpManager.getInstance().get(url, "", "", this.clubRecordListResponse.bind(this));
    }

    private queryRoudData(roundId, gameRule, tableName)
    {
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

    private updatePage()
    {
        this.node.getChildByName("label_page").getComponent(cc.Label).string = this.curSelectPage + "/" + this.totalPage
    }

    private button_close() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().closeUI(ClubRecordUI);
    }

    private nextPage() 
    {
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        if (this.curSelectPage >= this.totalPage)
        {
            GameManager.getInstance().openWeakTipsUI("已经是最后一页了");
            return
        }
        this.curSelectPage += 1
        this.queryDate()
    }

    private lastPage()
    {
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        if (this.curSelectPage == 1)
        {
            GameManager.getInstance().openWeakTipsUI("已经是最开始一页了");
            return
        }
        this.curSelectPage -= 1
        this.queryDate()
    }

    private button_return() {
        AudioManager.getInstance().playSFX("button_click");
        this.queryDate()
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
        this.queryDate()
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
        this.queryDate()
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
         this.queryDate()
     }

     button_game()
     {
        AudioManager.getInstance().playSFX("button_click")
        var active = this.node.getChildByName("sp_game").active
        this.node.getChildByName("sp_game").active = !active
     }
 
     button_select_game(event, customEventData)
     {
        AudioManager.getInstance().playSFX("button_click")
        this.node.getChildByName("sp_game").active = false
        var type = parseInt(customEventData)
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        var gameid = 0
        if (type != 0)
            gameid = this.gameList[type - 1]
        if (gameid == this.selectGameId)
            return
        this.selectGameId = gameid
        this.updateSelectGame()
        this.queryDate()
     }


}
