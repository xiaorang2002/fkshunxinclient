import { PlayBackUI_NN } from './../playback/PlayBackUI_NN';
import { PlayBackUI_ZJH } from './../playback/PlayBackUI_ZJH';
import { PlayBackUI_PDK } from './../playback/PlayBackUI_PDK';
import { PlayBackUI_MJ } from './../playback/PlayBackUI_MJ';
import { GAME_TYPE } from './../../../data/GameConstValue';
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
export class UnionUI_Score_Record extends BaseUI {

    protected static className = "UnionUI_Score_Record";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_UNION + this.className;
    }

    @property(cc.Prefab)
    itemPreFab: cc.Prefab = null;

    @property(cc.Node)
    nodeListContent: cc.Node = null;
    

    private selectTimeIdx = 0   
    private nodeList = []
    private curSelectPage = 1                               // 当前选择的页数
    private totalPage = 1                                      // 总页数
    private pageNum = 10
    private sending = false;             
    private dateList = []

    private reqPlayerId = 0

    start()
    {
        this.initDate()
        this.resetView()
    }

    initView(playerId, playerName)
    {
        this.node.getChildByName("label_name").getComponent(cc.Label).string = "玩家:" + playerName  //Utils.getShortName(playerName,5)
        this.reqPlayerId = playerId
        this.queryDataOnSelectType()
    }

   
    private updateList(dataList) // 刷新统计滚动框
    {
        this.nodeList = []
        this.nodeListContent.removeAllChildren()

        this.nodeListContent.height = dataList.length * (this.itemPreFab.data.height);
        if (this.nodeListContent.height < 370)
            this.nodeListContent.height = 370;
        for (let i = 0; i < dataList.length; ++i) {
            var componentType = "UnionUI_Score_Record_Item"
            var newnode = cc.instantiate(this.itemPreFab);
            newnode.parent = this.nodeListContent;
            var pnode = newnode.getComponent(componentType);
            pnode.initView(dataList[i], "recordDetail")
            this.nodeList.push(newnode)
        }
    }

    private onDataRec(event, data)
    {
        GameDataManager.getInstance().onHttpDataRec()
        if (this.node == null)
            return;
        this.nodeListContent.removeAllChildren();
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
        this.updateList(jsonData.data.data)
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
        this.nodeListContent.removeAllChildren()
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

        url = GameConstValue.ConstValue.PLAYER_SCORE_RECORD_QUERY_URL // 积分
        params = "club_id="+clubId+"&guid="+this.reqPlayerId+"&created_time="+startTime +"&page="+this.curSelectPage+"&end_time="+endTime
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
        UIManager.getInstance().closeUI(UnionUI_Score_Record);
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

}
