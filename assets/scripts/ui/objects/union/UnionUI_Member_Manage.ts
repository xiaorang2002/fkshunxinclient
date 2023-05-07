import { HttpManager } from './../../../../framework/Manager/HttpManager';
import { ClubRecordUI } from './../club/ClubRecordUI';
import { Utils } from './../../../../framework/Utils/Utils';
import { GameManager } from './../../../GameManager';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { BaseUI, UIClass } from "../../../../framework/UI/BaseUI";
import * as GameConstValue from "../../../data/GameConstValue";
import { AudioManager } from '../../../../framework/Manager/AudioManager';
import { UIManager } from '../../../../framework/Manager/UIManager';
import * as Proto from "../../../../proto/proto-min";
import { CLUB_POWER } from "../../../data/club/ClubData";

const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Member_Manage extends BaseUI {
    protected static className = "UnionUI_Member_Manage";
    public static getUrl(): string {
        return GameConstValue.ConstValue.UI_UNION + this.className;
    }

    @property(cc.Prefab)
    item: cc.Prefab = null;
    @property(cc.Sprite)
    spHead: cc.Sprite = null;
    @property(cc.Label)
    label_id: cc.Label = null;
    @property(cc.Label)
    label_name: cc.Label = null;
    @property(cc.Label)
    label_parent: cc.Label = null;
    @property(cc.Node)
    button_add_admin: cc.Node = null;
    @property(cc.Node)
    button_remove_admin: cc.Node = null;
    @property(cc.Node)
    button_add_partner: cc.Node = null;
    @property(cc.Node)
    button_remove_partner: cc.Node = null;
    @property(cc.Node)
    button_del: cc.Node = null;
    @property(cc.Node)
    button_cancel: cc.Node = null;
    @property(cc.Node)
    scoreContent: cc.Node = null;
    @property(cc.Node)
    commissionContent: cc.Node = null;

    private memberInfo = null
    private curType = ""
    private curSelectType = ""
    private info = null
    private selectTime = 0   
    private sending = false;     
    private curSelectPage = 1                               // 当前选择的页数
    private totalPage = 0       
    private nodeList = []
    private yjNodeList = []
    private dataArry = []

    onLoad()
    {
        
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
        this.node.getChildByName("node_base").active = this.curSelectType == "base"
        this.node.getChildByName("node_score").active = this.curSelectType == "score"
        this.node.getChildByName("node_commission").active = this.curSelectType == "commission"
        if (this.curSelectType == "base")
        {
            this.node.getChildByName("sp_wait").active = false
            this.node.getChildByName("sp_wait").stopAllActions()
        }

    }

    initUiWithType(type, info)
    {
        this.info = info
        this.curType = type
        var clubData = GameDataManager.getInstance().clubData;
        this.memberInfo = info

        if (clubData.roleType >= CLUB_POWER.CRT_PRATNER)
        {
            if (info.roleType == CLUB_POWER.CRT_ADMIN && clubData.roleType == CLUB_POWER.CRT_BOSS)
            {
                this.button_add_admin.active = false
                this.button_add_partner.active = false
                this.button_remove_partner.active = false
            }
            else if (info.roleType >= CLUB_POWER.CRT_ADMIN && clubData.roleType == CLUB_POWER.CRT_ADMIN) //双方都是管理员
            {
                this.node.active = false
            }
            else if (info.roleType == CLUB_POWER.CRT_PRATNER)
            {
                this.button_add_admin.active = false
                this.button_remove_admin.active = false
                this.button_add_partner.active = false 
                this.button_del.active = false 
            }
            else
            {
                this.button_remove_admin.active = false
                this.button_remove_partner.active = false
            }
            if (clubData.roleType != CLUB_POWER.CRT_BOSS){
                this.button_add_admin.active = false
                this.button_remove_admin.active = false
                if (clubData.roleType == CLUB_POWER.CRT_ADMIN)
                {
                    this.button_add_partner.active = false
                    this.button_remove_partner.active = false
                }
            }
            if (GameDataManager.getInstance().userInfoData.userId != info.parent)
                this.button_remove_partner.active = false
        }
        if (info.isStopGame)
        {
            this.button_cancel.active = true
            this.node.getChildByName("node_base").getChildByName("layout_btn").getChildByName("btn_stop").active = false
        }
        else
        {
            this.button_cancel.active = false
            this.node.getChildByName("node_base").getChildByName("layout_btn").getChildByName("btn_stop").active = true
        }
        this.node.getChildByName("btn_commission").active = info.roleType == CLUB_POWER.CRT_PRATNER
        this.updateButtonSelect("base")
        this.setId(info.guid, info.parent);
        this.setNameHead(info.icon, info.nickname);
    }

    //设置id
    public setId(pid: number, parent) {
        this.label_id.string = "" +pid
        this.label_parent.string = "" +parent

    }

    //设置头像
    public setNameHead(headurl: string, name: string) {
        Utils.loadTextureFromNet(this.spHead, headurl);
        this.label_name.string = ""+Utils.getShortName(name);
    }

    private queryScoreRecord()
    {
        if (GameDataManager.getInstance().httpDataWaitTime > 0)
        {
            GameManager.getInstance().openWeakTipsUI("请求频繁，请等待"+ Math.floor(GameDataManager.getInstance().httpDataWaitTime)+"后重试");
            this.node.getChildByName("node_score").getChildByName("sp_empty").active = true
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
        var clubData = GameDataManager.getInstance().clubData
        var clubId = clubData.curSelectClubId
        params = "club_id="+clubId+"&guid="+this.info.guid+"&created_time="+startTime +"&page="+this.curSelectPage+"&end_time="+endTime
        url = HttpManager.getInstance().encryptUrl(url + "?" + params) + "&guid="+ GameDataManager.getInstance().userInfoData.userId
        GameDataManager.getInstance().onHttpDataSend()
        HttpManager.getInstance().get(url, "", "", this.dataResponse.bind(this));
        this.onSendStateChange(true)
    }

    private queryDateYjMessage()
    {
        if (GameDataManager.getInstance().httpDataWaitTime > 0)
        {
            GameManager.getInstance().openWeakTipsUI("请求频繁，请等待"+ Math.floor(GameDataManager.getInstance().httpDataWaitTime)+"后重试");
            this.node.getChildByName("node_commission").getChildByName("sp_empty").active = true
            return
        }
        let url = ""
        let params = ""
        let startTime = 0
        var endTime = 0;
        startTime = Math.floor(new Date(new Date().toLocaleDateString()).getTime()/1000) - 24 * 60 * 60 * 6
        endTime = Math.floor(new Date(new Date().toLocaleDateString()).getTime()/1000) + 24*60*60 - 1
        url = GameConstValue.ConstValue.PLAYER_DALIY_COMMISSION_URL 
        var clubData = GameDataManager.getInstance().clubData
        var clubId = clubData.curSelectClubId
        params = "club_id="+clubId+"&guid="+this.info.guid+"&start_time="+startTime +"&page="+this.curSelectPage+"&end_time="+endTime
        GameDataManager.getInstance().onHttpDataSend()
        HttpManager.getInstance().get(url, "", params, this.dataResponseYj.bind(this));
        this.onSendStateChange(true)

    }

    // 收到数据
    private dataResponse(event, data) {
        GameDataManager.getInstance().onHttpDataRec()
        if (this.node == null)
            return;
        this.onSendStateChange(false)
        if (event != null && event.type == "timeout")
        {
            GameManager.getInstance().openWeakTipsUI("请求数据超时");
            this.node.getChildByName("node_score").getChildByName("sp_empty").active = true
            return
        }
        if (data == null)
        {
            GameManager.getInstance().openWeakTipsUI("未查询到积分信息");
            this.node.getChildByName("node_score").getChildByName("sp_empty").active = true
            return
        }
        var jsonData = JSON.parse(data)
        this.totalPage = jsonData.data.last_page
        this.curSelectPage = jsonData.data.current_page
        if (!jsonData.data.data || jsonData.data.data.length == 0)
        {
            this.scoreContent.removeAllChildren();
            this.nodeList = [];
            this.totalPage = 1
            this.curSelectPage = 1
            this.updatePage()
            this.node.getChildByName("node_score").getChildByName("sp_empty").active = true
            return
        }
        this.updatePage()
        this.node.getChildByName("node_score").getChildByName("sp_empty").active = false
        this.dataArry = jsonData.data.data
        this.updateList(jsonData.data.data)
    }

    dataResponseYj(event, data) {
        GameDataManager.getInstance().onHttpDataRec()
        if (this.node == null)
            return;
        this.onSendStateChange(false)
        try{
        if (event != null && event.type == "timeout")
        {
            GameManager.getInstance().openWeakTipsUI("请求数据超时");
            this.node.getChildByName("node_commission").getChildByName("sp_empty").active = true
            return
        }
        if (data == null)
        {
            GameManager.getInstance().openWeakTipsUI("未查询到积分信息");
            this.node.getChildByName("node_commission").getChildByName("sp_empty").active = true
            return
        }
        var jsonData = JSON.parse(data)
        if (!jsonData.data.data || jsonData.data.data.length == 0)
        {
            this.commissionContent.removeAllChildren();
            this.yjNodeList = [];
            this.node.getChildByName("node_commission").getChildByName("sp_empty").active = true
            return
        }
        this.node.getChildByName("node_commission").getChildByName("sp_empty").active = false
        this.dataArry = jsonData.data.data

            this.updateYjList(jsonData.data.data)

        }
        catch (e) {
            console.log(e)
        }
    }

    private onSendStateChange(state)
    {
        this.sending = state
        var waitNode = this.node.getChildByName("sp_wait")
        var emptyNode = this.node.getChildByName("node_"+this.curSelectType).getChildByName("sp_empty")
        waitNode.active = state
        if (state)
            emptyNode.active = false
        if (this.sending)
            waitNode.runAction(cc.repeatForever(cc.rotateBy(1, 360)));
        else
            waitNode.stopAllActions()
    }


    private updateList(dataList)
    {
        this.scoreContent.removeAllChildren()
        this.nodeList = []
        this.scoreContent.height = dataList.length * (this.item.data.height);
        if (this.scoreContent.height < 434)
            this.scoreContent.height = 434;
        for (let i = 0; i < dataList.length; ++i) {
            var newnode = cc.instantiate(this.item);
            newnode.parent = this.scoreContent;
            var pnode = newnode.getComponent('UnionUI_Member_Manage_Item');
            pnode.initView(dataList[i], this.curSelectType)
            this.nodeList.push(newnode)
        }
    }

    private updateYjList(dataList)
    {
        this.commissionContent.removeAllChildren()
        this.yjNodeList = []
        this.commissionContent.height = dataList.length * (this.item.data.height);
        if (this.commissionContent.height < 434)
            this.commissionContent.height = 434;
        for (let i = 0; i < dataList.length; ++i) {
            var newnode = cc.instantiate(this.item);
            newnode.parent = this.commissionContent;
            var pnode = newnode.getComponent('UnionUI_Member_Manage_Item');
            pnode.initView(dataList[i], this.curSelectType)
            this.yjNodeList.push(newnode)
        }
    }

    private updatePage()
    {
        this.node.getChildByName("node_score").getChildByName("label_page").getComponent(cc.Label).string = this.curSelectPage + "/" + this.totalPage
    }

    private updateSelectTime(){
        var active = this.node.getChildByName("node_score").getChildByName("sp_time").active
        this.node.getChildByName("node_score").getChildByName("sp_time").active = !active
        this.node.getChildByName("node_score").getChildByName("jiantou1").getChildByName("jiantou2").active = active
        var label = this.node.getChildByName("node_score").getChildByName("select_label").getComponent(cc.Label)
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

    btn_close() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().closeUI(UnionUI_Member_Manage);

    }

    btn_add_admin()
    {
        this.sendmsg(3)
    }

    btn_remove_admin()
    {
        this.sendmsg(4)
    }

    btn_fengting()
    {
        this.sendmsg(7)

    }

    btn_cancel_fengting()
    {
        this.sendmsg(8)

    }

    btn_stop()
    {
        this.sendmsg(1)
    }

    // 踢出联盟 
    btn_del()
    {
        if (this.curType != "player")// 踢联盟
        {
            if(this.memberInfo.roleType >= CLUB_POWER.CRT_PRATNER)
            {
                GameManager.getInstance().openWeakTipsUI("请先解除职务之后再踢出");
                return  
            }
            this.sendmsg(9)
        }
        else // 踢玩家
        {
            if(this.memberInfo.roleType >= CLUB_POWER.CRT_PRATNER)
            {
                GameManager.getInstance().openWeakTipsUI("请先解除职务之后再踢出");
                return  
            }
            this.sendmsg(9)
        }
    }

    // 取消禁止游戏
    btn_cancel()
    {
        this.sendmsg(2)
    }
    
    // 添加合伙人
    btn_add_partner()
    {
        this.sendmsg(5)
    }

    // 移除合伙人
    btn_remove_partner()
    {
        this.sendmsg(6)
    }


    sendmsg(op)
    {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().closeUI(UnionUI_Member_Manage);
        if (op == 7 || op == 8)
        {
            var clubData = GameDataManager.getInstance().clubData;
            MessageManager.getInstance().messageSend(Proto.C2S_CLUB_OP_REQ.MsgID.ID, {
                clubId: clubData.curSelectClubId,
                targetId: this.memberInfo.clubId,
                op:op
            })
        }
        else
        {
            var clubData = GameDataManager.getInstance().clubData;
            MessageManager.getInstance().messageSend(Proto.C2S_CLUB_OP_REQ.MsgID.ID, {
                clubId: clubData.curSelectClubId,
                targetId: this.memberInfo.guid,
                op:op
            })
        }
    }


    
    button_base() {
        AudioManager.getInstance().playSFX("button_click")
        if (this.curSelectType == "base")
            return
        this.updateButtonSelect("base")

    }

    button_score()
    {
        AudioManager.getInstance().playSFX("button_click")
        if (this.curSelectType == "score")
            return 
        this.updateButtonSelect("score")
        this.queryScoreRecord()
    }

    button_commission()
    {
        AudioManager.getInstance().playSFX("button_click")
        if (this.curSelectType == "commission")
            return 
        this.updateButtonSelect("commission")
        this.queryDateYjMessage()
        
    }

    button_recore() {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().openUI(ClubRecordUI, 30, () => {
            UIManager.getInstance().getUI(ClubRecordUI).getComponent("ClubRecordUI").setQueryPlayerInfo(this.info.guid,this.info.nickname, this.info.icon)
            UIManager.getInstance().getUI(ClubRecordUI).getComponent("ClubRecordUI").updateView()
        })
    }

    private nextPage() 
    {
        if (this.curSelectPage >= this.totalPage)
        {
            GameManager.getInstance().openWeakTipsUI("已经是最后一页了");
            return
        }
        this.curSelectPage += 1
        this.queryScoreRecord()
    }

    private lastPage()
    {
        if (this.curSelectPage == 1)
        {
            GameManager.getInstance().openWeakTipsUI("已经是最开始一页了");
            return
        }
        this.curSelectPage -= 1
        this.queryScoreRecord()
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
        this.queryScoreRecord()

    }

}