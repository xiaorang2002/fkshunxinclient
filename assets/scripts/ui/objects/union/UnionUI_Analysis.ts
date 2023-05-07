import { HttpManager } from './../../../../framework/Manager/HttpManager';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { GameManager } from '../../../GameManager';
import { BaseUI, UIClass } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { AudioManager } from "../../../../framework/Manager/AudioManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Analysis extends BaseUI {

    protected static className = "UnionUI_Analysis";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_UNION + this.className;
    }
    
    @property(cc.Prefab)
    item: cc.Prefab = null;

    @property(cc.Prefab)
    ruleItemPrefab: cc.Prefab = null;

    @property(cc.Node)
    gameListContent: cc.Node = null;

    @property(cc.Node)
    nodeListContent: cc.Node = null;

    private gameIdx: number = -1;       //当前游戏类型
    private gameItemList = []
    private nodeList = []
    private sending = false;             
    private selectTime = 0   
    private curSelectPage = 1
    private totalPage = 0                                      // 总页数
    private spacing: number = 0;                            //对象之间的间隔
    private dataArry = []
    private clubId = 0 //要查询的clubid
    private curSelectType = ""
    private curPlayerId = 0

    onLoad()
    {
        
    }


    start()
    {
        var clubData = GameDataManager.getInstance().clubData
        this.clubId = clubData.curSelectClubId
        this.curPlayerId = GameDataManager.getInstance().userInfoData.userId
        this.updateGameTypeList()
        this.updatePage()

    }

    private updateGameTypeList() {
        //管理员
        var clubData = GameDataManager.getInstance().clubData
        var allNode = cc.instantiate(this.ruleItemPrefab);
        allNode.parent = this.gameListContent;
        allNode.getComponent('RuleUI_Item').setAllInfo();
        this.gameItemList.push(allNode)
        this.gameListContent.height = 90 * clubData.clubPower.length;
        var idx = 1

        for (let i = 0; i < clubData.clubPower.length; ++i) {
            if (clubData.clubPower[idx] == 1)
                continue
            var newnode = cc.instantiate(this.ruleItemPrefab);
            newnode.parent = this.gameListContent;
            var pnode = newnode.getComponent('RuleUI_Item');
            pnode.setInfo(idx, clubData.clubPower[i])
            this.gameItemList.push(newnode)
            idx += 1
        }
        this.gameListContent.height = 90 * (clubData.clubPower.length+1);
        if (this.gameListContent.height < 600)
            this.gameListContent.height = 600;
        if (this.gameItemList.length != 0)
        {
            this.gameItemList[0].getComponent('RuleUI_Item').setSelect(true)
            this.gameItemList[0].getComponent('RuleUI_Item').btn_click()
        }
    }

    public selectGameItem(idx)
    {
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        if (idx == this.gameIdx)
            return
        if(this.gameIdx >= 0)
            this.gameItemList[this.gameIdx].getComponent('RuleUI_Item').setSelect(false);
        this.gameItemList[idx].getComponent('RuleUI_Item').setSelect(true);
        this.gameIdx = idx
        this.queryDate()
    }

    // 发送http请求向后台请求数据
    private queryDate(searchId = 0)
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
        this.nodeListContent.removeAllChildren()
        this.nodeList = []
        let url = ""
        let params = ""
        let startTime = 0
        var endTime = 0;
        if (this.selectTime != 3){
            startTime = Math.floor(new Date(new Date().toLocaleDateString()).getTime()/1000) - 24 * 60 * 60 * this.selectTime;
            if(this.selectTime == 0)//今日
                endTime = Math.floor(new Date(new Date().toLocaleDateString()).getTime()/1000) + 24*60*60 - 1   //当日23.59.59
            else if (this.selectTime == 1)// 昨日
                endTime = Math.floor(new Date(new Date().toLocaleDateString()).getTime()/1000) - 1
            else     
                endTime = Math.floor(new Date(new Date().toLocaleDateString()).getTime()/1000) - 24*60*60 - 1
        }
        else
        {
            startTime = Math.floor(new Date(new Date().toLocaleDateString()).getTime()/1000) - 24 * 60 * 60 * 6
            endTime = Math.floor(new Date(new Date().toLocaleDateString()).getTime()/1000) + 24*60*60 - 1
        }
        var clubData = GameDataManager.getInstance().clubData
        url = GameConstValue.ConstValue.CLUB_DAILY_RECORD 
        params = "club_id="+this.clubId+"&start_time="+startTime+"&end_time="+endTime+"&page="+this.curSelectPage+"&guid="+this.curPlayerId+"&team_id="+this.curPlayerId
        if (this.gameIdx > 0){
            params += "&game_id="+clubData.clubPower[this.gameIdx-1]
        }
            
        url = HttpManager.getInstance().encryptUrl(url + "?" +params) + "&guid="+ GameDataManager.getInstance().userInfoData.userId
        GameDataManager.getInstance().onHttpDataSend()
        HttpManager.getInstance().get(url, "", "", this.dataResponse.bind(this));
        this.onSendStateChange(true)
        this.sending = true

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

    private updateSelectTime(){
        var active = this.node.getChildByName("sp_time").active
        this.node.getChildByName("sp_time").active = !active
        this.node.getChildByName("jiantou1").getChildByName("jiantou2").active = active
        var label = this.node.getChildByName("select_label").getComponent(cc.Label)
        var str = "今日"
        if (this.selectTime == 0)
            str = "今日"
        else if (this.selectTime == 1)
            str = "昨日"
        else if (this.selectTime == 2)
            str = "前日"
        else    
            str = "本周"
        
        label.string = str
                  
    }

    // 收到数据
    private dataResponse(event, data) {
        GameDataManager.getInstance().onHttpDataRec()
        if (this.node == null)
            return;
        this.sending = false
        this.onSendStateChange(false)
        if (event != null && event.type == "timeout")
        {
            GameManager.getInstance().openWeakTipsUI("请求数据超时");
            this.node.getChildByName("sp_empty").active = true
            return
        }
        if (data == null)
        {
            GameManager.getInstance().openWeakTipsUI("未查询到数据信息");
            this.node.getChildByName("sp_empty").active = true
            return
        }
        var jsonData = JSON.parse(data)
        this.totalPage = jsonData.data.last_page
        this.curSelectPage = jsonData.data.current_page
        if (!jsonData.data.data)
        {
            this.nodeListContent.removeAllChildren();
            this.nodeList = [];
            this.totalPage = 1
            this.curSelectPage = 1
            this.updatePage()
            this.node.getChildByName("sp_empty").active = true
            return
        }
        this.updatePage()
        try
        {
            this.node.getChildByName("sp_empty").active = jsonData.data.data.length == 0
            this.dataArry = jsonData.data.data
            this.updateList(jsonData.data.data)
        
        } catch (e) {
            console.log(e)
        }

    }

    private updateList(dataList)
    {
        this.nodeListContent.removeAllChildren()
        this.nodeList = []
        //改变大小
        this.node.getChildByName("ScrollView").getComponent(cc.ScrollView).stopAutoScroll()
        this.nodeListContent.height = this.dataArry.length * (this.item.data.height + this.spacing) + this.spacing;
        if (this.nodeListContent.height < 400)
            this.nodeListContent.height = 400;
        for (let i = 0; i < dataList.length; ++i) {
            var newnode = cc.instantiate(this.item);
            newnode.parent = this.nodeListContent;
            var pnode = newnode.getComponent('UnionUI_Analysis_Item2');
            var info = {
                id:dataList[i].guid,
                name:dataList[i].nickname,
                icon:dataList[i].head_url,
                score:dataList[i].delta_money,
                dyjCount:dataList[i].bigwin_count,
                gameCout:dataList[i].play_count
            }  
            pnode.initView(info)
            this.nodeList.push(newnode)
        }
    }

    button_close() {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().closeUI(UnionUI_Analysis);
    }

    button_time()
    {
        AudioManager.getInstance().playSFX("button_click")
        this.updateSelectTime()
    }

    button_select_time(event, customEventData)
    {
        AudioManager.getInstance().playSFX("button_click")
        var type = parseInt(customEventData)
        if (type == this.selectTime)
            return
        this.selectTime = type
        this.updateSelectTime()
        this.queryDate()

    }
    private updatePage()
    {
        this.node.getChildByName("label_page").getComponent(cc.Label).string = this.curSelectPage + "/" + this.totalPage
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

}
