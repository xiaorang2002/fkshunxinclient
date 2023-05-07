import { Utils } from './../../../../framework/Utils/Utils';
import { HttpManager } from './../../../../framework/Manager/HttpManager';
import { GameManager } from './../../../GameManager';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { BaseUI, UIClass } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { AudioManager } from "../../../../framework/Manager/AudioManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Member_Common extends BaseUI {

    protected static className = "UnionUI_Member_Common";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_UNION + this.className;
    }

    @property(cc.Prefab)
    tjItem1: cc.Prefab = null;
    
    @property(cc.Prefab)
    tjItem2: cc.Prefab = null;

    @property(cc.Node)
    tjListContent: cc.Node = null;
    
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

    private selectTimeIdx = 0   
    private nodeList = []
    private curSelectPage = 1                               // 当前选择的页数
    private totalPage = 0                                      // 总页数
    private pageNum = 10
    private sending = false;             
    private dateList = []
    private searchId = null

    private reqPlayerId = 0
    private curSelectType= ""
    private timeIdx = 0
    private sortParameter = ""
    private sortType = ""

    start()
    {
       
    }

    initView(playerId, playerName, type, timeIdx)
    {
        this.initDate()
        this.resetView()
        this.node.getChildByName("label_name").getComponent(cc.Label).string = Utils.getShortName(playerName,5) + "的成员统计"
        this.node.getChildByName("record").active = type == "top_left"
        this.node.getChildByName("comission").active = type != "top_left"
        this.reqPlayerId = playerId
        this.curSelectType = type
        this.timeIdx = timeIdx
        this.selectTimeIdx = timeIdx
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
        this.updateSortView()
        this.updateSelectTime()
        this.queryDataOnSelectType()
    }

    initSearchView(searchId, desc, type, timeIdx)
    {
        this.initDate()
        this.resetView()
        this.node.getChildByName("label_name").getComponent(cc.Label).string = desc + "的搜索结果"
        this.node.getChildByName("record").active = type == "top_left"
        this.node.getChildByName("comission").active = type != "top_left"
        this.curSelectType = type
        this.timeIdx = timeIdx
        this.selectTimeIdx = timeIdx
        this.searchId = searchId
        this.reqPlayerId = GameDataManager.getInstance().userInfoData.userId
        this.updateSelectTime()
        this.queryDataOnSelectType()
    }

    private updateSortView()
    {
        if (this.curSelectType == "top_left")
        {
            var targetNode = this.node.getChildByName("record")
            targetNode.getChildByName("sort_winlose").active = false;
            targetNode.getChildByName("sort_bigwin_count").active = false;
            targetNode.getChildByName("sort_play_count").active = false;
            targetNode.getChildByName("sort_"+this.sortParameter).active = true;
            targetNode.getChildByName("sort_"+this.sortParameter).getChildByName("desc").active = this.sortType == "desc";
        }
        else if (this.curSelectType == "top_right")
        {
            var targetNode = this.node.getChildByName("comission")
            targetNode.getChildByName("sort_commission").active = false;
            targetNode.getChildByName("sort_valid_count").active = false;
            targetNode.getChildByName("sort_"+this.sortParameter).active = true;
            targetNode.getChildByName("sort_"+this.sortParameter).getChildByName("desc").active = this.sortType == "desc";
            
        }
    }
   
    private updateTjList(dataList) // 刷新统计滚动框
    {
        this.nodeList = []
        this.tjListContent.removeAllChildren()

        this.tjListContent.height = dataList.length * (this.tjItem1.data.height);
        if (this.tjListContent.height < 328)
            this.tjListContent.height = 328;
        for (let i = 0; i < dataList.length; ++i) {
            if (this.curSelectType == "top_right")
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
            pnode.initView(dataList[i], "member", this.timeIdx, this.reqPlayerId)
            this.nodeList.push(newnode)
        }
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
                this.labelBigWin.string = bigWin.toString()
                this.labelWinLose.string = (winLose/100).toString()
                this.labelPlayCount.string = playCount.toString()
                this.labelActive.string = active.toString()
            }
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
                this.labelValidCount.string = validCount.toFixed(2).toString()
                this.labelCommission.string = (commission/100).toString()
            }
        }

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
            return
        }
        if (data == null)
        {
            GameManager.getInstance().openWeakTipsUI("未查询到数据");
            this.onSendStateChange(false)
            this.node.getChildByName("sp_empty").active = true
            return
        }
        var jsonData = JSON.parse(data)
        this.totalPage = jsonData.data.last_page
        this.curSelectPage = jsonData.data.current_page
        if (!jsonData.data.data || jsonData.data.data.length == 0)
        {
            this.node.getChildByName("sp_empty").active = true
            this.onSendStateChange(false)
            return
        }
        this.updatePage()
        this.node.getChildByName("sp_empty").active = false
        this.updateTjList(jsonData.data.data)
        if (this.curSelectType == "top_left")
            this.updateBottomData(1, jsonData.data.total_data)
        else if (this.curSelectType == "top_right")
            this.updateBottomData(2, jsonData.data.total_data)
        this.onSendStateChange(false)
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

    private updateSelectTime(){
        var label = this.node.getChildByName("select_label").getComponent(cc.Label)
        label.string = Utils.formatDate(this.dateList[this.selectTimeIdx], 2) 
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

    private queryDataOnSelectType()
    {
        this.updatePage()
        this.queryData()
    }

    private queryData()
    {
        if(this.curSelectType == "top_mid")
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

        var clubData = GameDataManager.getInstance().clubData
        var clubId = clubData.curSelectClubId

        if (this.curSelectType == "top_left") // 选择是战绩统计-成员
        {
            url = GameConstValue.ConstValue.NEW_MEMBER_RECORD_STATISTICS_URL 
            params = "club_id="+clubId+"&guid="+this.reqPlayerId+"&start_time="+startTime +"&page="+this.curSelectPage+"&end_time="+endTime+ "&team_id=" + this.reqPlayerId
        }
        else if (this.curSelectType == "top_right") // 选择是联盟统计-成员
        {
            url = GameConstValue.ConstValue.NEW_UNION_STATISTICS_MEMBER_URL 
            params = "club_id="+clubId+"&guid="+this.reqPlayerId+"&start_time="+startTime +"&page="+this.curSelectPage+"&end_time="+endTime+ "&team_id=" + this.reqPlayerId
        }
        if (params != "" && this.searchId != null)
        {
            params += "&filter=" + JSON.stringify({guid:this.searchId}) 
        }
        if (this.sortParameter.length > 0) { 
            params += "&sort=" + this.sortParameter + "&order=" + this.sortType
        }

        url = HttpManager.getInstance().encryptUrl(url + "?" + params) + "&guid="+ GameDataManager.getInstance().userInfoData.userId
        GameDataManager.getInstance().onHttpDataSend()
        HttpManager.getInstance().get(url, "", "", this.onDataRec.bind(this));
        this.onSendStateChange(true)
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
        UIManager.getInstance().closeUI(UnionUI_Member_Common);
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
