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
export class UnionUI_Message extends BaseUI {

    protected static className = "UnionUI_Message";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_UNION + this.className;
    }

    @property(cc.Prefab)
    item: cc.Prefab = null;
    
    @property(cc.Prefab)
    applyItem: cc.Prefab = null;

    @property(cc.Node)
    nodeListContent: cc.Node = null;

    @property(cc.Label)
    title: cc.Label = null;
    
    @property(cc.Label)
    title1: cc.Label = null;

    private selectTime = 0   
    private curSelectType = ""
    private nodeList = []
    private curSelectPage = 1                               // 当前选择的页数
    private totalPage = 0                                      // 总页数
    private pageNum = 30 // 每一页的玩家数量
    private sending = false;             
    private dataArry = []

    onLoad()
    {
        
    }


    start()
    {
        this.initListen()
        var clubData = GameDataManager.getInstance().clubData
        var select = "add_message"
        if (clubData.clubType == 0)
        {
            select = "apply_message"
            MessageManager.getInstance().messageSend(Proto.C2S_CLUB_REQUEST_LIST_REQ.MsgID.ID, { clubId: clubData.curSelectClubId})
            this.updateButtonSelect(select)
        }
        else
        {
            this.updateButtonSelect(select)
            this.queryDate()
        }
        this.node.getChildByName("btn_add_message").active = clubData.roleType != CLUB_POWER.CRT_PLAYER
        this.node.getChildByName("btn_del_message").active = clubData.roleType != CLUB_POWER.CRT_PLAYER
        this.node.getChildByName("btn_apply_message").active = (clubData.roleType == CLUB_POWER.CRT_ADMIN || clubData.roleType == CLUB_POWER.CRT_BOSS)
        // this.node.getChildByName("btn_apply_message").active = (clubData.roleType != CLUB_POWER.CRT_PLAYER && clubData.clubType == 0)
    }
    private initListen()
    {
        ListenerManager.getInstance().add(Proto.S2C_CLUB_REQUEST_LIST_RES.MsgID.ID, this, this.clubApplyListRec);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_OP_RES.MsgID.ID, this, this.clubOpResponse);

        
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
        var title = "操作人"
        this.node.getChildByName("titlebg").getChildByName("label2").active = this.curSelectType != "apply_message"
        this.node.getChildByName("node_bottom").active = this.curSelectType != "apply_message"
        this.node.getChildByName("titlebg").getChildByName("label4").active = this.curSelectType == "apply_message"
        this.node.getChildByName("titlebg").getChildByName("label3").active = this.curSelectType != "apply_message"
        if (this.curSelectType == "apply_message")
            this.title1.string = "玩家信息"
        else
            this.title1.string = "时 间"
        this.title.string = title
    }

    private clubApplyListRec(msg){
        this.onSendStateChange(false)
        if (this.curSelectType != "apply_message")
        {
            MessageManager.getInstance().disposeMsg();
            return
        }
        this.node.getChildByName("sp_empty").active = msg.reqs.length == 0
        var curMemberArray = [];
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
                    extra: null,
                    isStopGame: false,
                    parent : 0,
                    isSearch:false
                }
                curMemberArray.push(info)
            }
        }
        this.updateApplyList(curMemberArray);
        MessageManager.getInstance().disposeMsg();
        
    }

    private clubOpResponse(msg: any) {
        if (msg.op == 10 || msg.op == 11) // 申请加入或者申请被拒绝
        {
            var clubData = GameDataManager.getInstance().clubData
            GameManager.getInstance().openWeakTipsUI("操作成功");
            if (this.curSelectType == "apply_message")
                MessageManager.getInstance().messageSend(Proto.C2S_CLUB_REQUEST_LIST_REQ.MsgID.ID, { clubId: clubData.curSelectClubId})
        }
        MessageManager.getInstance().disposeMsg();
        
    }

    // 发送http请求向后台请求数据
    private queryDate()
    {
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        if (this.curSelectType == "score_record")
            this.queryScoreRecord()
        else if (this.curSelectType == "add_message")
            this.queryDateAddMessage()
        else if (this.curSelectType == "yj_message")
            this.queryDateYjMessage()
        else
            this.queryDateDelMessage()
    }

    private queryDateAddMessage()
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
        url = GameConstValue.ConstValue.CLUB_MEMBER_CHANGE_URL 
        var playerId = GameDataManager.getInstance().userInfoData.userId
        var clubData = GameDataManager.getInstance().clubData
        var clubId = clubData.curSelectClubId
        params = "club_id="+clubId+"&partner_id="+playerId+"&start_time="+startTime +"&page="+this.curSelectPage+"&end_time="+endTime+"&type=1"
        url = HttpManager.getInstance().encryptUrl(url + "?" + params) + "&guid="+ GameDataManager.getInstance().userInfoData.userId
        GameDataManager.getInstance().onHttpDataSend()
        HttpManager.getInstance().get(url, "", "", this.dataResponseAddMessage.bind(this));
        this.onSendStateChange(true)
    }

    private queryDateDelMessage()
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
        url = GameConstValue.ConstValue.CLUB_MEMBER_CHANGE_URL 
        var playerId = GameDataManager.getInstance().userInfoData.userId
        var clubData = GameDataManager.getInstance().clubData
        var clubId = clubData.curSelectClubId
        params = "club_id="+clubId+"&partner_id="+playerId+"&start_time="+startTime +"&page="+this.curSelectPage+"&end_time="+endTime+"&type=2"
        url = HttpManager.getInstance().encryptUrl(url + "?" + params) + "&guid="+ GameDataManager.getInstance().userInfoData.userId
        GameDataManager.getInstance().onHttpDataSend()
        HttpManager.getInstance().get(url, "", "", this.dataResponseDelMessage.bind(this));
        this.onSendStateChange(true)
    }

    private queryDateYjMessage()
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
        url = GameConstValue.ConstValue.PLAYER_DALIY_COMMISSION_URL 
        var playerId = GameDataManager.getInstance().userInfoData.userId
        var clubData = GameDataManager.getInstance().clubData
        var clubId = clubData.curSelectClubId
        params = "club_id="+clubId+"&guid="+playerId+"&start_time="+startTime +"&page="+this.curSelectPage+"&end_time="+endTime
        GameDataManager.getInstance().onHttpDataSend()
        HttpManager.getInstance().get(url, "", params, this.dataResponseYj.bind(this));
        this.onSendStateChange(true)

    }

    private queryScoreRecord()
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
        url = GameConstValue.ConstValue.PLAYER_SCORE_RECORD_QUERY_URL 
        var playerId = GameDataManager.getInstance().userInfoData.userId
        var clubData = GameDataManager.getInstance().clubData
        var clubId = clubData.curSelectClubId
        params = "club_id="+clubId+"&guid="+playerId+"&created_time="+startTime +"&page="+this.curSelectPage+"&end_time="+endTime
        url = HttpManager.getInstance().encryptUrl(url + "?" + params) + "&guid="+ GameDataManager.getInstance().userInfoData.userId
        GameDataManager.getInstance().onHttpDataSend()
        HttpManager.getInstance().get(url, "", "", this.dataResponse.bind(this));
        this.onSendStateChange(true)
    }

    // 收到数据
    private dataResponse(event, data) {
        if (this.curSelectType != "score_record")
            return
        this.onDataRec(event, data)
    }

    dataResponseYj(event, data) {
        GameDataManager.getInstance().onHttpDataRec()
        if (this.node == null)
            return;
        this.onSendStateChange(false)
        if (this.curSelectType != "yj_message")
            return
        if (event != null && event.type == "timeout")
        {
            GameManager.getInstance().openWeakTipsUI("请求数据超时");
            return
        }
        if (data == null)
        {
            GameManager.getInstance().openWeakTipsUI("未查询到积分信息");
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

    dataResponseDelMessage(event, data)
    {
        if (this.curSelectType != "del_message")
            return
        this.onDataRec(event, data)
    }

    
    dataResponseAddMessage(event, data)
    {
        if (this.curSelectType != "add_message")
            return
        this.onDataRec(event, data)
    }

    private onDataRec(event, data)
    {
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
        if (this.nodeListContent.height < 410)
            this.nodeListContent.height = 410;
        for (let i = 0; i < dataList.length; ++i) {
            var newnode = cc.instantiate(this.item);
            newnode.parent = this.nodeListContent;
            var pnode = newnode.getComponent('UnionUI_Message_Item');
            pnode.initView(dataList[i], this.curSelectType)
            this.nodeList.push(newnode)
        }
    }

    private updateApplyList(dataList)
    {
        var clubData = GameDataManager.getInstance().clubData
        this.nodeListContent.removeAllChildren()
        this.nodeList = []
        this.nodeListContent.height = dataList.length * (this.applyItem.data.height);
        if (this.nodeListContent.height < 410)
            this.nodeListContent.height = 410;
        for (let i = 0; i < dataList.length; ++i) {
            var newnode = cc.instantiate(this.applyItem);
            newnode.parent = this.nodeListContent;
            var pnode = newnode.getComponent('ClubApplyItem');
            pnode.setInfo(i, this.curSelectType, clubData.curSelectClubId, dataList[i])
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
        UIManager.getInstance().closeUI(UnionUI_Message);
    }

    // 积分记录 
    button_score_record() {
        AudioManager.getInstance().playSFX("button_click")
        if (this.curSelectType == "score_record")
            return
        this.updateButtonSelect("score_record")
        this.resetView()
        this.queryDate()

    }

    button_add_message()
    {
        AudioManager.getInstance().playSFX("button_click")
        if (this.curSelectType == "add_message")
            return 
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        this.updateButtonSelect("add_message")
        this.resetView()
        this.queryDate()
    }

    btn_del_message() {
        AudioManager.getInstance().playSFX("button_click")
        if (this.curSelectType == "del_message")
            return
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        this.updateButtonSelect("del_message")
        this.resetView()
        this.queryDate()
    }

    btn_yj_message() {
        AudioManager.getInstance().playSFX("button_click")
        if (this.curSelectType == "yj_message")
            return
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        this.updateButtonSelect("yj_message")
        this.resetView()
        this.queryDate()
    }

    btn_apply_message()
    {
        AudioManager.getInstance().playSFX("button_click")
        if (this.curSelectType == "apply_message")
            return
        var clubData = GameDataManager.getInstance().clubData
        this.updateButtonSelect("apply_message")
        this.resetView()
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_REQUEST_LIST_REQ.MsgID.ID, { clubId: clubData.curSelectClubId})

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

}
