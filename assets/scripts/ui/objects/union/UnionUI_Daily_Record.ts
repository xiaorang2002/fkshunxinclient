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
export class UnionUI_Daily_Record extends BaseUI {

    protected static className = "UnionUI_Daily_Record";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_UNION + this.className;
    }

    @property(cc.Prefab)
    item: cc.Prefab = null;
    
    @property(cc.Node)
    nodeListContent: cc.Node = null;

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
    private heplBgPosion = [[-168,204],[-168,128],[-168,38]]

    initView(playerId,roleType = -1)
    {

        if (roleType < 0)
        {
            var clubData = GameDataManager.getInstance().clubData
            roleType = clubData.roleType
        }
        var select = "jf"
        this.curSelectPlayer = playerId
        this.updateButtonSelect(select)
        this.queryDate()
        this.node.getChildByName("btn_yj").active = (roleType == CLUB_POWER.CRT_PRATNER || roleType == CLUB_POWER.CRT_BOSS)
        this.node.getChildByName("btn_gx").active = (roleType == CLUB_POWER.CRT_PRATNER || roleType == CLUB_POWER.CRT_BOSS)
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
       
       this.node.getChildByName("title1").active = this.curSelectType == "jf"
       this.node.getChildByName("title2").active = this.curSelectType == "yj"
       this.node.getChildByName("title3").active = this.curSelectType == "gx"
        this.node.getChildByName("node_bottom").active = true

    }

    // 发送http请求向后台请求数据
    private queryDate()
    {
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
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
        var clubData = GameDataManager.getInstance().clubData
        var clubId = clubData.curSelectClubId
        if (this.curSelectType == "jf")
        {
            url = GameConstValue.ConstValue.PLAYER_SCORE_RECORD_QUERY_URL // 积分
            params = "club_id="+clubId+"&guid="+this.curSelectPlayer+"&created_time="+startTime +"&page="+this.curSelectPage+"&end_time="+endTime
        }
        else if (this.curSelectType == "yj")
        {
            url = GameConstValue.ConstValue.LOG_PLAYER_COMISSION_URL // 业绩
            params = "club_id="+clubId+"&team_id="+this.curSelectPlayer+"&created_time="+startTime +"&page="+this.curSelectPage+"&end_time="+endTime
        }
        else
        {
            params = "club_id="+clubId+"&team_id="+this.curSelectPlayer+"&created_time="+startTime +"&page="+this.curSelectPage+"&end_time="+endTime
            url = GameConstValue.ConstValue.LOG_TEAM_MEMBER_CONTRIBUTE_URL // 贡献
        }
       
        url = HttpManager.getInstance().encryptUrl(url + "?" + params) + "&guid="+ GameDataManager.getInstance().userInfoData.userId
        GameDataManager.getInstance().onHttpDataSend()
        HttpManager.getInstance().get(url, "", "", this.dataResponse.bind(this));
        this.onSendStateChange(true)
    }

    // 收到数据
    private dataResponse(event, data) {
        GameDataManager.getInstance().onHttpDataRec()
        if (this.node == null)
            return;
        try{
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

    private updateList(dataList)
    {
        this.nodeListContent.removeAllChildren()
        this.nodeList = []
        this.nodeListContent.height = dataList.length * (this.item.data.height);
        if (this.nodeListContent.height < 420)
            this.nodeListContent.height = 420;
        for (let i = 0; i < dataList.length; ++i) {
            // if (this.curSelectType == "jf" && dataList[i].reason == 52)
            // {
            //     continue
            // }
            var newnode = cc.instantiate(this.item);
            newnode.parent = this.nodeListContent;
            var pnode = newnode.getComponent('UnionUI_Daily_Record_Item');
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
        UIManager.getInstance().closeUI(UnionUI_Daily_Record);
    }

    button_jf() {
        AudioManager.getInstance().playSFX("button_click")
        if (this.curSelectType == "jf")
            return
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        this.updateButtonSelect("jf")
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

    button_help(event, customEventData)
    {
        AudioManager.getInstance().playSFX("button_click")
        var heplString = ["玩家积分记录，包含每一次积分变化的详细记录","记录所选日期的具体每一笔收入","下属所有玩家对我的贡献值明细"]
        var type = parseInt(customEventData)
        this.node.getChildByName("help_bg").active = true
        this.node.getChildByName("help_bg").position = cc.v3(this.heplBgPosion[type][0],this.heplBgPosion[type][1])
        this.labelHelp.string = heplString[type]
    }

    button_pinbi()
    {
        this.node.getChildByName("help_bg").active = false
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

}
