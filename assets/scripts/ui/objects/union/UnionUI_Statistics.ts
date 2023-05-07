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
export class UnionUI_Statistics extends BaseUI {

    protected static className = "UnionUI_Statistics";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_UNION + this.className;
    }

    @property(cc.Prefab)
    item: cc.Prefab = null;
    
    @property(cc.Node)
    nodeListContent: cc.Node = null;

    @property(cc.Label)
    title1: cc.Label = null;
    
    @property(cc.Label)
    title2: cc.Label = null;

    @property(cc.Label)
    title3: cc.Label = null;

    @property(cc.Label)
    title4: cc.Label = null;

    @property(cc.Label)
    title5: cc.Label = null;
    
    @property(cc.Label)
    labelHelp: cc.Label = null;

    private selectTime = 0   
    private curSelectType = ""
    private nodeList = []
    private curSelectPage = 1                               // 当前选择的页数
    private totalPage = 0                                      // 总页数
    private pageNum = 30 // 每一页数量
    private sending = false;             
    private dataArry = []
    private curSelectPlayer = 0
    private curSelectRoleType = 0
    private heplBgPosion = [[-168,204],[-168,128],[-168,38],[-168,-48],[-168,-128]]

    onLoad()
    {
        
    }


    initView(playerId, roleType = -1)
    {
        if (roleType < 0)
        {
            var clubData = GameDataManager.getInstance().clubData
            roleType = clubData.roleType
        }
        this.curSelectRoleType = roleType
        var select = "js"
        this.curSelectPlayer = playerId
        this.updateButtonSelect(select)
        this.queryDate()
        this.node.getChildByName("btn_yj").active = (roleType != CLUB_POWER.CRT_PLAYER && roleType != CLUB_POWER.CRT_ADMIN)
        this.node.getChildByName("btn_gx").active = (roleType != CLUB_POWER.CRT_PLAYER && roleType != CLUB_POWER.CRT_ADMIN)
        this.node.getChildByName("btn_xh").active = roleType == CLUB_POWER.CRT_BOSS
    }

    private updateButtonSelect(type){
        if (this.curSelectType)
        {
            this.node.getChildByName("btn_" + this.curSelectType).getChildByName("select_bg").active = false
            this.node.getChildByName("btn_" + this.curSelectType).getChildByName("label_name").active = false
            this.node.getChildByName("btn_" + this.curSelectType).getChildByName("label_name_unselect").active = true
            this.node.getChildByName("btn_" + this.curSelectType).getChildByName("select_bg_unselect").active = true
        }
        this.curSelectType = type
        this.node.getChildByName("btn_" + this.curSelectType).getChildByName("select_bg").active = true
        this.node.getChildByName("btn_" + this.curSelectType).getChildByName("label_name").active = true
        this.node.getChildByName("btn_" + this.curSelectType).getChildByName("label_name_unselect").active = false
        this.node.getChildByName("btn_" + this.curSelectType).getChildByName("select_bg_unselect").active = false
        this.node.getChildByName("title_bg").getChildByName("label6").active = false
        if (this.curSelectType == "gx")
        {
            this.title1.node.active = false
            this.title2.node.active = false
            this.title3.node.active = true
            this.title4.node.active = true
            this.title5.node.active = true
        }
        else
        {
            this.title1.node.active = true
            this.title2.node.active = true
            this.title3.node.active = false
            this.title4.node.active = false
            this.title5.node.active = false
            if (this.curSelectType == "js")
            {
                this.node.getChildByName("title_bg").getChildByName("label6").active = true
                this.title1.string = "局 数"
            }
            else if (this.curSelectType == "sy")
                this.title1.string = "分 数"
            else if (this.curSelectType == "yj")
                this.title1.string = "收 入" 
            else
                this.title1.string = "房 卡" 
        }
        this.node.getChildByName("node_bottom").active = this.curSelectType == "gx"

    }

    public setSyTypeVisible(visible)
    {
        this.node.getChildByName("btn_sy").active = visible
    }

    // 发送http请求向后台请求数据
    private queryDate()
    {
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        if (this.curSelectType == "gx")
            this.queryGx()
        else
            this.queryDataByWeak(this.curSelectType)
    }

    private queryGx()
    {
        if (GameDataManager.getInstance().httpDataWaitTime > 0)
        {
            this.node.getChildByName("sp_empty").active = true
            GameManager.getInstance().openWeakTipsUI("请求频繁，请等待"+ Math.floor(GameDataManager.getInstance().httpDataWaitTime)+"后重试");
            return
        }
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
        url = GameConstValue.ConstValue.TEAM_MEMBER_DAIL_CONTRIBUTE_URL 
        var clubData = GameDataManager.getInstance().clubData
        var clubId = clubData.curSelectClubId
        params = "club_id="+clubId+"&team_id="+this.curSelectPlayer+"&start_time="+startTime +"&page="+this.curSelectPage+"&end_time="+endTime
        GameDataManager.getInstance().onHttpDataSend()
        HttpManager.getInstance().get(url, "", params, this.dataResponseGx.bind(this));
        this.onSendStateChange(true)
    }

    

    private queryDataByWeak(type)
    {
        if (GameDataManager.getInstance().httpDataWaitTime > 0)
        {
            this.node.getChildByName("sp_empty").active = true
            GameManager.getInstance().openWeakTipsUI("请求频繁，请等待"+ Math.floor(GameDataManager.getInstance().httpDataWaitTime)+"后重试");
            return
        }
        let url = ""
        let params = ""
        let startTime = 0
        var endTime = 0;
        startTime = Math.floor(new Date(new Date().toLocaleDateString()).getTime()/1000) - 24 * 60 * 60 * 6
        endTime = Math.floor(new Date(new Date().toLocaleDateString()).getTime()/1000) + 24*60*60 - 1
        var clubData = GameDataManager.getInstance().clubData
        var clubId = clubData.curSelectClubId

        if (type == "js")
        {
            url = GameConstValue.ConstValue.PLAYER_DAILY_PLAY_COUNT_URL // 局数
            params = "club_id="+clubId+"&start_time="+startTime +"&page="+this.curSelectPage+"&end_time="+endTime
            params += "&guid="+this.curSelectPlayer
        }
        else if (type == "sy")
        {
            url = GameConstValue.ConstValue.PLAYER_DAILY_WIN_LOSE_URL // 输赢 
            params = "club_id="+clubId+"&start_time="+startTime +"&page="+this.curSelectPage+"&end_time="+endTime+"&guid="+this.curSelectPlayer
        }
        else if (type == "yj") 
        {
            url = GameConstValue.ConstValue.PLAYER_DALIY_COMMISSION_URL // 业绩
            params = "club_id="+clubId+"&guid="+this.curSelectPlayer+"&start_time="+startTime +"&page="+this.curSelectPage+"&end_time="+endTime
        }
        else
        {
            params = "club_id="+clubId+"&start_time="+startTime +"&page="+this.curSelectPage+"&end_time="+endTime
            url = GameConstValue.ConstValue.DAILY_ROOM_CARD_COST_URL // 消耗
            url = HttpManager.getInstance().encryptUrl(url + "?" + params)  + "&guid="+ GameDataManager.getInstance().userInfoData.userId
            params = ""
        }
           

        GameDataManager.getInstance().onHttpDataSend()
        HttpManager.getInstance().get(url, "", params, this.dataResponseByWeak.bind(this));
        this.onSendStateChange(true)

    }


    // 收到数据
    private dataResponseGx(event, data) {
        if (this.curSelectType != "gx")
            return
        GameDataManager.getInstance().onHttpDataRec()
        if (this.node == null)
            return;
        this.onSendStateChange(false)
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
            this.nodeListContent.removeAllChildren();
            this.nodeList = [];
            this.totalPage = 1
            this.curSelectPage = 1
            this.updatePage()
            this.node.getChildByName("sp_empty").active = true
            return
        }
        this.updatePage()
        this.node.getChildByName("sp_empty").active = false
        this.dataArry = jsonData.data.data
        this.updateList(jsonData.data.data)
    }

    dataResponseByWeak(event, data) {
        GameDataManager.getInstance().onHttpDataRec()
        if (this.node == null)
            return;
        this.onSendStateChange(false)
        if (this.curSelectType == "gx")
            return
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
        if (!jsonData.data.data || jsonData.data.data.length == 0)
        {
            this.nodeListContent.removeAllChildren();
            this.nodeList = [];
            this.node.getChildByName("sp_empty").active = true
            return
        }
        this.node.getChildByName("sp_empty").active = false
        this.dataArry = jsonData.data.data
        var sorList = jsonData.data.data.sort(function (a, b) { return b.date - a.date });
        this.updateList(sorList)
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

    private updateList(dataList)
    {
        this.nodeListContent.removeAllChildren()
        this.nodeList = []
        this.nodeListContent.height = dataList.length * (this.item.data.height);
        if (this.nodeListContent.height < 400)
            this.nodeListContent.height = 400;
        for (let i = 0; i < dataList.length; ++i) {
            var newnode = cc.instantiate(this.item);
            newnode.parent = this.nodeListContent;
            var pnode = newnode.getComponent('UnionUI_Statistics_Item');
            pnode.initView(dataList[i], this.curSelectType, this.curSelectPlayer)
            this.nodeList.push(newnode)
        }
    }


    private updateSelectTime(){
        var active = this.node.getChildByName("node_bottom").getChildByName("sp_time").active
        this.node.getChildByName("node_bottom").getChildByName("sp_time").active = !active
        this.node.getChildByName("node_bottom").getChildByName("jiantou1").getChildByName("jiantou2").active = active
        var label = this.node.getChildByName("node_bottom").getChildByName("select_label").getComponent(cc.Label)
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

    // 切换page时触发
    private resetView() {
        this.curSelectPage = 1
        this.totalPage = 1
        this.nodeListContent.removeAllChildren()
        this.nodeList = []
        this.selectTime = 0
        this.updatePage()
        var label = this.node.getChildByName("node_bottom").getChildByName("select_label").getComponent(cc.Label)
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

    private updatePage()
    {
        this.node.getChildByName("node_bottom").getChildByName("label_page").getComponent(cc.Label).string = this.curSelectPage + "/" + this.totalPage
    }

    button_close() {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().closeUI(UnionUI_Statistics);
    }

    // 积分记录 
    button_js() {
        AudioManager.getInstance().playSFX("button_click")
        if (this.curSelectType == "js")
            return
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        this.updateButtonSelect("js")
        this.resetView()
        this.queryDate()

    }

    button_sy()
    {
        AudioManager.getInstance().playSFX("button_click")
        if (this.curSelectType == "sy")
            return 
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        this.updateButtonSelect("sy")
        this.resetView()
        this.queryDate()
    }

    btn_yj() {
        AudioManager.getInstance().playSFX("button_click")
        if (this.curSelectType == "yj")
            return
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        this.updateButtonSelect("yj")
        this.resetView()
        this.queryDate()
    }

    btn_gx() {
        AudioManager.getInstance().playSFX("button_click")
        if (this.curSelectType == "gx")
            return
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        this.updateButtonSelect("gx")
        this.resetView()
        this.queryDate()
    }

    btn_xh()
    {
        AudioManager.getInstance().playSFX("button_click")
        if (this.curSelectType == "xh")
            return
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        this.updateButtonSelect("xh")
        this.resetView()
        this.queryDate()
    }

    private nextPage() 
    {
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
        if (this.curSelectPage == 1)
        {
            GameManager.getInstance().openWeakTipsUI("已经是最开始一页了");
            return
        }
        this.curSelectPage -= 1
        this.queryDate()
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
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        this.selectTime = type
        this.updateSelectTime()
        this.queryDate()

    }

    button_help(event, customEventData)
    {
        AudioManager.getInstance().playSFX("button_click")
        var heplString = ["玩家一周之内，每一天的总局数","玩家一周之内，每一天的总输赢分数","玩家一周之内，每一天的总收入","下属玩家当天对我的贡献数据，如果是合伙人，则是合伙人整个团队对我的贡献值",
        "一周内，每一天的房卡消耗"]
        var type = parseInt(customEventData)
        this.node.getChildByName("help_bg").active = true
        this.node.getChildByName("help_bg").position = cc.v3(this.heplBgPosion[type][0],this.heplBgPosion[type][1])
        this.labelHelp.string = heplString[type]
    }

    button_pinbi()
    {
        this.node.getChildByName("help_bg").active = false
    }


}
