import { CLUB_POWER } from './../../../data/club/ClubData';
import { ListenerManager } from './../../../../framework/Manager/ListenerManager';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { GameManager } from '../../../GameManager';
import { BaseUI, UIClass } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { AudioManager } from "../../../../framework/Manager/AudioManager";
import * as  Proto from "../../../../proto/proto-min";

const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Spread extends BaseUI {

    protected static className = "UnionUI_Spread";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_UNION + this.className;
    }

    @property(cc.Prefab)
    item1: cc.Prefab = null;
    
    @property(cc.Prefab)
    item2: cc.Prefab = null;

    @property(cc.Node)
    nodeListContent: cc.Node = null;

    @property(cc.EditBox)
    edit: cc.EditBox = null;

    private curSelectType = ""
    private nodeList = []

    onLoad()
    {
        
    }


    start()
    {
        // this.updateButtonSelect("single")
        // var clubData = GameDataManager.getInstance().clubData
        this.updateButtonSelect("single")
        var clubData = GameDataManager.getInstance().clubData
        var isBigUnion = clubData.isBigBossOfUnion()
        this.setDevoteType(isBigUnion)
        this.initListen()
        // MessageManager.getInstance().messageSend(Proto.C2S_GET_CLUB_TEAM_TEMPLATE_CONFIG.MsgID.ID, {clubId: clubData.curSelectClubId});
        // var msg = {
        //     clubId: clubData.curSelectClubId,
        //     partner:GameDataManager.getInstance().userInfoData.userId,
        //     role:CLUB_POWER.CRT_PRATNER,
        //     pageSize:-1,
        //     pageNum:1,
        // }
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_GET_TEAM_PARTNER_CONFIG.MsgID.ID, {clubId: clubData.curSelectClubId})
    }

    private initListen()
    {
        ListenerManager.getInstance().add(Proto.S2C_CONFIG_CLUB_TEAM_TEMPLATE.MsgID.ID, this, this.onConfigModifyRec);
        ListenerManager.getInstance().add(Proto.S2C_GET_CLUB_TEAM_TEMPLATE_CONFIG.MsgID.ID, this, this.onTemplateScoreConfigRec);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_GET_TEAM_PARTNER_CONFIG.MsgID.ID, this, this.onTeamConfRec);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_EDIT_TEAM_CONFIG.MsgID.ID, this, this.onTeamConfChange);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_EDIT_TEAM_PARTNER_CONFIG.MsgID.ID, this, this.onTeamConfChanged);
    }

    private onConfigModifyRec(msg)
    {
        GameManager.getInstance().openWeakTipsUI("操作成功！！");
        var clubData = GameDataManager.getInstance().clubData
        if (this.curSelectType  == "defaut")
        {
            MessageManager.getInstance().messageSend(Proto.C2S_GET_CLUB_TEAM_TEMPLATE_CONFIG.MsgID.ID, {clubId: clubData.curSelectClubId});
        }
        MessageManager.getInstance().disposeMsg();
    }

    private onTeamConfChanged(msg)
    {
        GameManager.getInstance().openWeakTipsUI("操作成功！！");
        
        MessageManager.getInstance().disposeMsg();
        
    }
    
    onTeamConfChange(msg)
    {
        var clubData = GameDataManager.getInstance().clubData
        GameManager.getInstance().openWeakTipsUI("操作成功！！");
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_GET_TEAM_PARTNER_CONFIG.MsgID.ID, {clubId: clubData.curSelectClubId});
        MessageManager.getInstance().disposeMsg();
    }

    onTemplateScoreConfigRec(msg)
    {
        if (this.curSelectType != "defaut")
            this.updateButtonSelect("defaut")
        this.updateList(msg.confs)
        MessageManager.getInstance().disposeMsg();
    }

    onTeamConfRec(msg)
    {
        if (this.curSelectType != "single")
            this.updateButtonSelect("single")
        this.updateList(msg.confs)
        var percent = 0
        try
        {
            var remoteConf = JSON.parse(msg.partnerConf)
            if (remoteConf)
            {
                percent = remoteConf.percent
                percent /= 100
            }
            
        }
        catch (e){}
        this.edit.string = percent.toString()
        MessageManager.getInstance().disposeMsg();
    }

    private setDevoteType(isBigUnion)
    {
        if (!isBigUnion)
        {
            this.node.getChildByName("defaut_page").getChildByName("label_name").getComponent(cc.Label).string = "合伙人贡献值"

        }
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
        this.node.getChildByName("single_page").active = this.curSelectType != "defaut"
        this.node.getChildByName("defaut_page").active = this.curSelectType == "defaut"
    }

    private updateList(dataList)
    {
        this.nodeListContent.removeAllChildren()
        this.nodeList = []
        this.nodeListContent.height = dataList.length * (this.item1.data.height);
        if (this.nodeListContent.height < 420)
            this.nodeListContent.height = 420;
        var clubData = GameDataManager.getInstance().clubData
        if (this.curSelectType == "defaut")
        {
            for (let i = 0; i < dataList.length; ++i) {
                var templateInfo = clubData.getTemplateInfoById(dataList[i].templateId)
                if (templateInfo == null)
                {
                    dataList[i].gameId = 0
                    continue
                }
                dataList[i].gameId = templateInfo.template.gameId
            }
            var finishList = this.sortByGameId(dataList)
            for (let j =0; j<finishList.length; ++j)
            {
                if (finishList[j].gameId != 0)
                {
                    var newnode = cc.instantiate(this.item1);
                    newnode.parent = this.nodeListContent;
                    var pnode = newnode.getComponent('UnionUI_Spread_Item1');
                    pnode.setInfo(finishList[j])
                    this.nodeList.push(newnode)
                }
            }
        }
        else
        {
            for (let i = 0; i < dataList.length; ++i) {
                if (dataList[i].baseInfo.guid == GameDataManager.getInstance().userInfoData.userId)
                {
                    continue
                }
                var newnode = cc.instantiate(this.item2);
                newnode.parent = this.nodeListContent;
                var pnode = newnode.getComponent('UnionUI_Spread_Item2');
                var info = {
                    guid: dataList[i].baseInfo.guid, 
                    icon: dataList[i].baseInfo.icon, 
                    nickname: dataList[i].baseInfo.nickname, 
                    conf:dataList[i].conf
                }
                pnode.setInfo(info)
                this.nodeList.push(newnode)
            }
        }
    }

    sortByGameId(targetList){
        var tempList = []
        tempList = targetList.sort(function (a, b) { return a.templateId - b.templateId})
        tempList = tempList.sort(function (a, b) { return a.gameId - b.gameId})
        return tempList
    }

    button_close() {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().closeUI(UnionUI_Spread);
    }

    button_defaut() {
        AudioManager.getInstance().playSFX("button_click")
        if (this.curSelectType == "defaut")
            return
        this.updateButtonSelect("defaut")
        var clubData = GameDataManager.getInstance().clubData
        MessageManager.getInstance().messageSend(Proto.C2S_GET_CLUB_TEAM_TEMPLATE_CONFIG.MsgID.ID, {clubId: clubData.curSelectClubId});

    }

    button_single()
    {
        AudioManager.getInstance().playSFX("button_click")
        if (this.curSelectType == "single")
            return 
        this.updateButtonSelect("single")
        var clubData = GameDataManager.getInstance().clubData
        var msg = {
            clubId: clubData.curSelectClubId,
            partner:GameDataManager.getInstance().userInfoData.userId,
            role:CLUB_POWER.CRT_PRATNER,
            pageSize:-1,
            pageNum:1,
        }
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_PLAYER_LIST_REQ.MsgID.ID, msg)
    }

    button_yjpz()
    {
        AudioManager.getInstance().playSFX("button_click")
        var percent = this.edit.string
        var intPercent = parseInt(percent)
        if (percent == "") {
            this.edit.string = "0"
            GameManager.getInstance().openWeakTipsUI("输入的点位不能为空");
            return 
        }
        else if (isNaN(intPercent))
        {
            this.edit.string = "0"
            GameManager.getInstance().openWeakTipsUI("请输入数字");
            return 
        }
        else if (intPercent > 100 || intPercent < 0)
        {
            this.edit.string = "0"
            GameManager.getInstance().openWeakTipsUI("请输入0到100之前的点位");
            return 
        }
        var clubData = GameDataManager.getInstance().clubData
        var msg = {
            clubId: clubData.curSelectClubId,
            partner:GameDataManager.getInstance().userInfoData.userId,
            conf:JSON.stringify({commission:{percent:intPercent*100}}),
        }
        let surefun = () => {
            MessageManager.getInstance().messageSend(Proto.C2S_CLUB_EDIT_TEAM_CONFIG.MsgID.ID, msg)
        };
        let closefun = () => {
            
        };
        var content = "一键配置仅对未设置过点位的组长或玩法生效，设置为 "+percent+"% ？"
        GameManager.getInstance().openSelectTipsUI(content, surefun, closefun);

    }

    button_help(event, customEventData)
    {
        AudioManager.getInstance().playSFX("button_click")
        this.node.getChildByName("help_bg").active = true
    }

    button_pinbi()
    {
        this.node.getChildByName("help_bg").active = false
    }

}
