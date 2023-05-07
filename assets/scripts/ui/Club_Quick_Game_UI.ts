import { RuleUI } from './RuleUI';
import { ListenerType } from './../data/ListenerType';
import { ListenerManager } from './../../framework/Manager/ListenerManager';
import { CLUB_POWER } from './../data/club/ClubData';
import { UIManager } from './../../framework/Manager/UIManager';
import { UnionUI_Rule } from './objects/union/UnionUI_Rule';
import { MessageManager } from './../../framework/Manager/MessageManager';
import { Utils } from './../../framework/Utils/Utils';
import { GameManager } from './../GameManager';
import { AudioManager } from './../../framework/Manager/AudioManager';
import { GAME_TYPE } from './../data/GameConstValue';
import { GameDataManager } from './../../framework/Manager/GameDataManager';
import { BaseUI, UIClass } from "../../framework/UI/BaseUI";
import { BaseRuleUI } from './objects/rule/BaseRuleUI';
import * as GameConstValue from "../data/GameConstValue";
import * as Proto from "../../proto/proto-min";
import { SYNC_TYPE } from "../../proto/proto-min";


const { ccclass, property } = cc._decorator;

@ccclass
export class Club_Quick_Game_UI extends BaseUI {

    protected static className = "Club_Quick_Game_UI";

    @property(cc.Prefab)
    leftItem: cc.Prefab = null;
    @property(cc.Prefab)
    midItem: cc.Prefab = null;
    @property(cc.Node)
    nodeMidContent: cc.Node = null;
    @property(cc.Node)
    nodeView: cc.Node = null;
    @property(cc.Label)
    labelClose: cc.Label = null;
    @property(cc.Node)
    btnLjtj: cc.Node = null;
    @property(cc.EditBox)
    gameNameEdit: cc.EditBox = null;

    // private leftNodeItem = []
    private midNodeItem = []
    // private curLeftSelectIdx = -1
    private curMidSelectIdx = -1
    private curRuleType = "base"
    private gameRulePrefab: cc.Node = null;
    private gameAdvanceUI : cc.Node = null;
    private baseRule = null
    private advanceRule = null
    private isRuleCanChange = false
    private isConfig = false
    private configIdx = -1
    private preSelectGameType = 0           // 将要选择的游戏类型

    private gameRuleUrl = [
        GameConstValue.ConstValue.UI_RULE_DIR + "RuleUI_MHXL",
        GameConstValue.ConstValue.UI_RULE_DIR + "RuleUI_LFMJ",
        GameConstValue.ConstValue.UI_RULE_DIR + "RuleUI_XZMJ",
        GameConstValue.ConstValue.UI_RULE_DIR + "RuleUI_LRPDK",
        GameConstValue.ConstValue.UI_RULE_DIR + "RuleUI_PDK",
        GameConstValue.ConstValue.UI_RULE_DIR + "RuleUI_DDZ",
        GameConstValue.ConstValue.UI_RULE_DIR + "RuleUI_4R2F",
        GameConstValue.ConstValue.UI_RULE_DIR + "RuleUI_3R2F",
        GameConstValue.ConstValue.UI_RULE_DIR + "RuleUI_2R3F", 
        GameConstValue.ConstValue.UI_RULE_DIR + "RuleUI_2R2F",
        GameConstValue.ConstValue.UI_RULE_DIR + "RuleUI_2R1F",
        GameConstValue.ConstValue.UI_RULE_DIR + "RuleUI_ZJH",
        GameConstValue.ConstValue.UI_RULE_DIR + "RuleUI_NN", 
        GameConstValue.ConstValue.UI_RULE_DIR + "RuleUI_SCPDK",
        GameConstValue.ConstValue.UI_RULE_DIR + "RuleUI_YJMJ",
        GameConstValue.ConstValue.UI_RULE_DIR + "RuleUI_ZGCP",
        GameConstValue.ConstValue.UI_RULE_DIR + "RuleUI_ZGMJ",
    ];
    private advanceSettingUrl = GameConstValue.ConstValue.UI_UNION + "UnionUI_Rule"

    onLoad()
    {
        
    }

    start()
    {
        this.initListener()
        // this.initLeftView()
        this.initMidView()
        if (this.curMidSelectIdx >= 0)
        {
            this.node.getChildByName("bg_no_game").active = false
            var clubData = GameDataManager.getInstance().clubData
            var templateId = this.midNodeItem[this.curMidSelectIdx].getComponent('Quick_Mid_Item').getTempateId()
            var templateInfo = clubData.getTemplateInfoById(templateId)
            this.baseRule = JSON.parse(templateInfo.template.rule);
            this.advanceRule = this.baseRule.union 
        } 
        else
        {
            this.node.getChildByName("bg_no_game").active = true
            this.updatePower()
            return
        }
        this.updatePower()
        this.updateRuleView()
    }

    initListener()
    {
        ListenerManager.getInstance().add(Proto.S2C_CONFIG_CLUB_TEAM_TEMPLATE.MsgID.ID, this, this.onConfigModifyRec);
        ListenerManager.getInstance().add(Proto.S2C_GET_CLUB_TEAM_TEMPLATE_CONFIG.MsgID.ID, this, this.onTemplateScoreConfigRec);
        ListenerManager.getInstance().add(Proto.S2C_EDIT_TABLE_TEMPLATE.MsgID.ID, this, this.onEditTemplateRec);
        ListenerManager.getInstance().add(ListenerType.clubFastRoomChanged, this, this.clubFastRoomChanged);
    }

    private onConfigModifyRec(msg)
    {
        GameManager.getInstance().openWeakTipsUI("操作成功！！");
        MessageManager.getInstance().disposeMsg();
    }

    private onEditTemplateRec(msg)
    {
        GameManager.getInstance().openWeakTipsUI("操作成功！！");
        MessageManager.getInstance().disposeMsg();
    }

    private onTemplateScoreConfigRec(msg)
    {
        var clubData = GameDataManager.getInstance().clubData
        var templateId = this.midNodeItem[this.curMidSelectIdx].getComponent('Quick_Mid_Item').getTempateId()
        if (clubData.curSelectClubId != msg.clubId)
            return
        MessageManager.getInstance().disposeMsg();
    }

    private clubFastRoomChanged(msg)
    {
        var clubData = GameDataManager.getInstance().clubData
        if (msg.type == SYNC_TYPE.SYNC_DEL) {
            this.initMidView()
            if (clubData.clubFastList.length > 0)
            {
                this.curMidSelectIdx = -1
                this.selectMidItem(0)
            }
            // for (var i = 0; i < this.midNodeItem.length; ++i) {
            //     var tempId = this.midNodeItem[i].getComponent('Quick_Mid_Item').getTempateId()
            //     if (tempId == msg.index) {
            //         var idx = this.curLeftSelectIdx 
            //         this.curLeftSelectIdx = -1
            //         this.curMidSelectIdx = -1
            //         this.selectLeftItem(idx)
            //         break;
            //     }
            // }
        }
        else if (msg.type == SYNC_TYPE.SYNC_ADD){
            // var clubData = GameDataManager.getInstance().clubData
            // var tempId = msg.index
            // var templateInfo = clubData.getTemplateInfoById(tempId)
            // var curSelectType = this.leftNodeItem[this.curLeftSelectIdx].getComponent('Quick_Game_Item').getGameType()
            // if (templateInfo.template.gameId == curSelectType)
            // {
            //     var idx = this.curLeftSelectIdx 
            //     this.curMidSelectIdx = -1
            //     this.curLeftSelectIdx = -1
            //     this.selectLeftItem(idx)
            // }
            // else
            // {
            //     this.selectLeftItemByGameType(templateInfo.template.gameId)
            // }
            this.initMidView()
            if (clubData.clubFastList.length > 0)
            {
                this.curMidSelectIdx = -1
                this.selectMidItem(0)
            }
        }
        else if (msg.type == SYNC_TYPE.SYNC_UPDATE)
        {
            var clubData = GameDataManager.getInstance().clubData
            for (var i = 0; i < this.midNodeItem.length; ++i) {
                var tempId = this.midNodeItem[i].getComponent('Quick_Mid_Item').getTempateId()
                if (tempId == msg.index) {
                    var templateInfo = clubData.getTemplateInfoById(tempId)
                    this.midNodeItem[i].getComponent('Quick_Mid_Item').setName(templateInfo.template.description)
                }
            }
        }
        this.updatePower()
    }

    // selectLeftItemByGameType(gameType)
    // {
    //     var idx = 0
    //     if (this.leftNodeItem.length == 0)
    //     {
    //         this.preSelectGameType = gameType
    //     }
    //     else
    //     {
    //         for (var leftItem of this.leftNodeItem)
    //         {
    //             if (leftItem.getComponent('Quick_Game_Item').getGameType() == gameType)
    //             {
    //                 break
    //             }
    //             idx += 1
    //         }
    //         this.curMidSelectIdx = -1
    //         this.selectLeftItem(idx)
    //     }
    // }


    // initLeftView()
    // {
    //     var clubData = GameDataManager.getInstance().clubData
    //     var tempIdx = 0
    //     this.nodeLeftContent.height = 103 * clubData.clubPower.length;
    //     if (this.nodeLeftContent.height < 627)
    //         this.nodeLeftContent.height = 627;
    //     for (var index = 0; index < clubData.clubPower.length; ++index) {
    //         if (clubData.clubPower[index] == 1)
    //             continue
    //         let item = cc.instantiate(this.leftItem);
    //         this.nodeLeftContent.addChild(item);
    //         item.setPosition(0, -item.height * (0.5 + index));
    //         item.getComponent('Quick_Game_Item').setGameInfo(index,clubData.clubPower[index])
    //         this.leftNodeItem.push(item);
    //         if (this.preSelectGameType == 0)
    //         {
    //             if (tempIdx == 0)
    //             {
    //                 this.curLeftSelectIdx = index
    //                 item.getComponent('Quick_Game_Item').setSelect(true)
    //             }
    //         }
    //         else
    //         {
    //             if (this.preSelectGameType == clubData.clubPower[index])
    //             {
    //                 this.curLeftSelectIdx = index
    //                 item.getComponent('Quick_Game_Item').setSelect(true)
    //             }    
    //         }
    //         tempIdx += 1
    //     }
    // }

    initMidView()
    {
        var clubData = GameDataManager.getInstance().clubData
        // var curSelectType = this.leftNodeItem[this.curLeftSelectIdx].getComponent('Quick_Game_Item').getGameType()
        var list = this.sortByGameId()
        this.curMidSelectIdx = -1
        this.nodeMidContent.height = 95 * list.length;
        this.nodeMidContent.removeAllChildren()
        this.midNodeItem = []
        if (this.gameRulePrefab)
            this.gameRulePrefab.removeFromParent()
        if (this.gameAdvanceUI)
            this.gameAdvanceUI.removeFromParent()
        if (this.nodeMidContent.height < 620)
            this.nodeMidContent.height = 620;
        for (var index = 0; index < list.length; ++index) {
            let item = cc.instantiate(this.midItem);
            this.nodeMidContent.addChild(item);
            item.setPosition(0, -item.height * (0.5 + index)-5*index);
            item.getComponent('Quick_Mid_Item').setTamplateInfo(index,list[index])
            this.midNodeItem.push(item);
            if (index == 0)
            {
                this.curMidSelectIdx = index
                item.getComponent('Quick_Mid_Item').setSelect(true)
            }
        }
        this.node.getChildByName("bg_no_game").active = list.length == 0

    }

    sortByGameId()
    {
        var clubData = GameDataManager.getInstance().clubData
        var tempList = []
        tempList = clubData.clubFastList.sort(function (a, b) { return a.template.templateId - b.template.templateId})
        tempList = tempList.sort(function (a, b) { return a.template.gameId - b.template.gameId})
        return tempList
    }


    updateRuleView()
    {
        var clubData = GameDataManager.getInstance().clubData
        this.node.getChildByName("nodeRule").getComponent(cc.ScrollView).stopAutoScroll()
        this.node.getChildByName("btn_common_rule").active = clubData.clubType != 1
        this.node.getChildByName("rule_select_bg").active = clubData.clubType == 1
        var templateId = this.midNodeItem[this.curMidSelectIdx].getComponent('Quick_Mid_Item').getTempateId()
        var templateInfo = clubData.getTemplateInfoById(templateId)
        this.baseRule = JSON.parse(templateInfo.template.rule);
        this.advanceRule = this.baseRule.union 
        this.nodeView.removeAllChildren()
        this.gameRulePrefab = null
        this.gameAdvanceUI = null
        var curSelectType = this.midNodeItem[this.curMidSelectIdx].getComponent('Quick_Mid_Item').getGameType()
        if (clubData.clubType == 1)
        {
            this.node.getChildByName("rule_select_bg").getChildByName("btn_base_unselect").getChildByName("btn_base_select").active = this.curRuleType == "base"
            this.node.getChildByName("rule_select_bg").getChildByName("btn_base_unselect").getChildByName("label_unselect").active = this.curRuleType != "base"
            this.node.getChildByName("rule_select_bg").getChildByName("btn_advance_unselect").getChildByName("btn_advance_select").active = this.curRuleType != "base"
            this.node.getChildByName("rule_select_bg").getChildByName("btn_advance_unselect").getChildByName("label_unselect").active = this.curRuleType == "base"
        }
        if(this.curRuleType == "base" || clubData.clubType != 1)
        {
            var type2UI = {
                100:0,
                110:1,
                200:2,
                210:3,
                211:4,
                220:5,
                201:6,
                202:7,
                203:8,
                204:9,
                205:10,
                300:11,
                310:12,
                212:13,
                230:14,
                350:15,
                260:16,
            }
            cc.resources.load(
                this.gameRuleUrl[type2UI[curSelectType]], null,
                function (error, prefab) {
                    if (error) {
                        return;
                    }
                    if (this.gameRulePrefab != null) {
                        this.gameRulePrefab.getComponent("BaseRuleUI").saveRule();
                        this.gameRulePrefab.destroy();
                    }
                    this.gameRulePrefab = cc.instantiate(prefab);
                    this.gameRulePrefab.y = this.nodeView.height / 2;
                    this.gameRulePrefab.parent = this.nodeView;
                    this.gameRulePrefab.getComponent("BaseRuleUI").initRule(this.baseRule);
                    this.gameRulePrefab.getComponent("BaseRuleUI").setRuleType(1);
                    this.nodeView.getParent().getComponent(cc.ScrollView).content = this.gameRulePrefab;
                }.bind(this));
        }
        else
        {
            cc.resources.load(
                this.advanceSettingUrl, null,
                function (error, prefab) {
                    if (error) {
                        return;
                    }
                    if (this.gameAdvanceUI != null) {
                        this.gameAdvanceUI.destroy();
                    }
                    this.gameAdvanceUI = cc.instantiate(prefab);
                    this.gameAdvanceUI.y = this.nodeView.height / 2;
                    this.gameAdvanceUI.parent = this.nodeView;
                    this.gameAdvanceUI.getComponent("UnionUI_Rule").initRule(this.advanceRule);
                    this.nodeView.getParent().getComponent(cc.ScrollView).content = this.gameAdvanceUI;
                }.bind(this));
        }
    }

    updatePower()
    {

        var clubData = GameDataManager.getInstance().clubData
        this.updateCloseLabel()
        if (clubData.clubFastList.length == 0)
        {
            this.node.getChildByName("layout").active = false;
            this.gameNameEdit.node.active = false;
            this.node.getChildByName("label_tips").active = false;
            return
        }
        var btn_del = false
        var btn_save = false
        var btn_tips = false
        if (clubData.clubType == 0) // 亲友群
        {
            if(clubData.roleType >= CLUB_POWER.CRT_ADMIN) // 管理员
            {
                btn_del = true
                btn_save = true
                this.isRuleCanChange = true
            }
            else
            {
                btn_tips = true
            }
        }
        else
        {
            if (clubData.isBigBossOfUnion()) // 是不是大盟主或者管理员
            {
                btn_del = true
                btn_save = true
                this.isRuleCanChange = true
            }
            else if (clubData.roleType >= CLUB_POWER.CRT_ADMIN)
            {
                this.checkOpen()
            }
            else
            {
                btn_tips = true
            }
        }
        if (this.isConfig) // 配置快捷玩法时，不执行
            return
        this.node.getChildByName("layout").active = true
        this.node.getChildByName("layout").getChildByName("btn_delete").active = btn_del
        this.node.getChildByName("layout").getChildByName("btn_save").active = btn_save
        this.gameNameEdit.node.active = btn_save
        if (btn_save)
        {
            var templateId = this.midNodeItem[this.curMidSelectIdx].getComponent('Quick_Mid_Item').getTempateId()
            var templateInfo = clubData.getTemplateInfoById(templateId)
            this.gameNameEdit.placeholder = templateInfo.template.description
        }
        this.node.getChildByName("label_tips").active = btn_tips
    }

    updateCloseLabel()
    {
        var str = ""
        var clubData = GameDataManager.getInstance().clubData
        if (clubData.clubType == 0) // 亲友群
        {
            if(clubData.roleType >= CLUB_POWER.CRT_ADMIN) // 管理员
            {
                str = "暂无可用玩法，是否立即添加"
                this.btnLjtj.active = true
            }
            else
                str = "暂无可用玩法，请联系群主或管理员添加"

        }
        else
        {
            if (clubData.isBigBossOfUnion()) // 是不是大盟主或者管理员
            {
                str = "暂无可用玩法，是否立即添加"
                this.btnLjtj.active = true
            }
            else if (clubData.roleType >= CLUB_POWER.CRT_ADMIN)
                str = "暂无可用玩法，请联系大盟主添加"  
            else
                str = "暂无可用玩法，请联系盟主或管理员添加"
        }   
        this.labelClose.string = str
    }

    checkOpen()
    {
        var clubData = GameDataManager.getInstance().clubData
        var templateId = this.midNodeItem[this.curMidSelectIdx].getComponent('Quick_Mid_Item').getTempateId()
        MessageManager.getInstance().messageSend(Proto.C2S_GET_CLUB_TEAM_TEMPLATE_CONFIG.MsgID.ID, {clubId: clubData.curSelectClubId, templateId: templateId});
    }

    // selectLeftItem(idx)
    // {
    //     if (this.curLeftSelectIdx == idx)
    //         return
    //     if (this.curLeftSelectIdx >= 0)
    //         this.leftNodeItem[this.curLeftSelectIdx].getComponent('Quick_Game_Item').setSelect(false);
    //     this.leftNodeItem[idx].getComponent('Quick_Game_Item').setSelect(true);
    //     this.curLeftSelectIdx = idx
    //     this.nodeView.removeAllChildren();
    //     this.nodeMidContent.removeAllChildren()
    //     this.midNodeItem = [];
    //     this.baseRule = null;
    //     this.advanceRule = null
    //     if (this.gameRulePrefab)
    //         this.gameRulePrefab.removeFromParent()
    //     if (this.gameAdvanceUI)
    //         this.gameAdvanceUI.removeFromParent()
    //     this.gameRulePrefab = null
    //     this.gameAdvanceUI = null
    //     this.node.getChildByName("nodeRule").getComponent(cc.ScrollView).stopAutoScroll()
    //     this.initMidView()
    //     if (this.curMidSelectIdx >= 0)
    //     {
    //         // this.node.getChildByName("bg_no_game").active = false
    //         var clubData = GameDataManager.getInstance().clubData
    //         var templateId = this.midNodeItem[this.curMidSelectIdx].getComponent('Quick_Mid_Item').getTempateId()
    //         var templateInfo = clubData.getTemplateInfoById(templateId)
    //         this.baseRule = JSON.parse(templateInfo.template.rule);
    //         this.advanceRule = this.baseRule.union
    //     } 
    //     else
    //     {
    //         // this.node.getChildByName("bg_no_game").active = true
    //         this.updateCloseLabel()
    //         this.gameRulePrefab = null
    //         this.gameAdvanceUI = null
    //         return
    //     }
    //     this.updatePower()
    //     this.updateRuleView()
    // }

    selectMidItem(idx)
    {
        if (this.curMidSelectIdx == idx)
            return
        for (var i =0; i < this.midNodeItem.length; ++i)
            this.midNodeItem[i].getComponent('Quick_Mid_Item').setSelect(false)
        this.midNodeItem[idx].getComponent('Quick_Mid_Item').setSelect(true)
        if (this.gameRulePrefab)
            this.gameRulePrefab.removeFromParent()
        if (this.gameAdvanceUI)
            this.gameAdvanceUI.removeFromParent()
        this.curMidSelectIdx = idx
        var clubData = GameDataManager.getInstance().clubData
        var templateId = this.midNodeItem[this.curMidSelectIdx].getComponent('Quick_Mid_Item').getTempateId()
        var templateInfo = clubData.getTemplateInfoById(templateId)
        this.baseRule = JSON.parse(templateInfo.template.rule);
        this.advanceRule = this.baseRule.union
        this.gameRulePrefab = null
        this.gameAdvanceUI = null
        this.nodeView.removeAllChildren();
        this.updateRuleView()
        this.gameNameEdit.placeholder = templateInfo.template.description
    }

    setConfig(idx)
    {
        this.node.getChildByName("btn_config").active = true
        this.isConfig = true
        this.configIdx = idx
    }

    button_base()
    {
        AudioManager.getInstance().playSFX("button_click");
        if (this.curRuleType == "base")
            return
        this.curRuleType = "base"
        this.updateRuleView()
    }

    button_advance()
    {
        AudioManager.getInstance().playSFX("button_click");
        if (this.curRuleType == "advance")
            return
        this.curRuleType = "advance"
        this.updateRuleView()
    }

    button_edit(event, CustomEvent)
    {
        AudioManager.getInstance().playSFX("button_click");
        var clubData = GameDataManager.getInstance().clubData
        if (this.advanceRule == null && clubData.clubType == 1) // 没有选择高级规则是，规则为空
            this.advanceRule = UnionUI_Rule.getDefaultRule()
        if(this.gameAdvanceUI != null)
            this.advanceRule = this.gameAdvanceUI.getComponent("UnionUI_Rule").getRule()
        if(this.gameRulePrefab != null)
            this.baseRule = this.gameRulePrefab.getComponent("BaseRuleUI").getRule()
        var templateId = this.midNodeItem[this.curMidSelectIdx].getComponent('Quick_Mid_Item').getTempateId()
        var templateInfo = clubData.getTemplateInfoById(templateId)
        var desc = templateInfo.template.description
        if(templateId == 0 || !templateInfo)
        {
            GameManager.getInstance().openWeakTipsUI("修改失败，找不到桌子信息");
            UIManager.getInstance().closeUI(Club_Quick_Game_UI)
            return
        }
        if (this.gameNameEdit.string.length != 0)
            desc = this.gameNameEdit.string
        var rule = this.baseRule
        if (this.advanceRule != null)
            rule.union = this.advanceRule
        var modifyFcType = ""
        var curFcType = ""
        if (rule.union)
        {
            if (rule.union.tax.percentage_commission == true) // 百分比分成
                modifyFcType = "baifenbi"
            else
                modifyFcType = "fudingzhi"
            var curRule = JSON.parse(templateInfo.template.rule)
            if (curRule.union.tax.percentage_commission == true) // 百分比分成
                curFcType = "baifenbi"
            else
                curFcType = "fudingzhi"
        }
        if (curFcType != modifyFcType)
        {
            let surefun = () => {
                let msg =
                {
                    template : {
                        template : {
                            templateId: templateId,
                            gameId: templateInfo.template.gameId,
                            rule: JSON.stringify(rule),
                            description:desc
                        },
                        clubId: GameDataManager.getInstance().clubData.curSelectClubId,
                    },
                    editOp : parseInt(CustomEvent)
                }
            MessageManager.getInstance().messageSend(Proto.C2S_EDIT_TABLE_TEMPLATE.MsgID.ID, msg);
            };
            let closefun = () => {
                
            };
            GameManager.getInstance().openSelectTipsUI("分成方式改变将会导致所有下级分成配置失效，确认修改？", surefun, closefun);
        }
        else
        {
            let msg =
            {
                template : {
                    template : {
                        templateId: templateId,
                        gameId: templateInfo.template.gameId,
                        rule: JSON.stringify(rule),
                        description:desc
                    },
                    clubId: GameDataManager.getInstance().clubData.curSelectClubId,
                },
                editOp : parseInt(CustomEvent)
            
            }
            MessageManager.getInstance().messageSend(Proto.C2S_EDIT_TABLE_TEMPLATE.MsgID.ID, msg);
        }
       
    }

    button_fast_game()
    {
        AudioManager.getInstance().playSFX("button_click");
        if (GameDataManager.getInstance().isCreatingRoom){
            GameManager.getInstance().openWeakTipsUI("房间创建中，请稍后");
            return
        }
        var clubData = GameDataManager.getInstance().clubData
        var templateId = this.midNodeItem[this.curMidSelectIdx].getComponent('Quick_Mid_Item').getTempateId()
        var templateInfo = clubData.getTemplateInfoById(templateId)
        var rule = JSON.parse(templateInfo.template.rule) 
        if (rule.option.gps_distance > 0){
            if (!Utils.checkGps())
                return
        }
        let msg =
        {
            clubId: clubData.curSelectClubId,
            templateId: templateId,
        }
        
        GameDataManager.getInstance().isCreatingRoom = true
        MessageManager.getInstance().messageSend(Proto.CS_CreateRoom.MsgID.ID, msg);
    }

    button_close()
    {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().closeUI(Club_Quick_Game_UI)
        
    }

    // btn_open()
    // {
    //     AudioManager.getInstance().playSFX("button_click");
    //     var active = this.node.getChildByName("btn_open").getChildByName("sp_select").active
    //     var templateId = this.midNodeItem[this.curMidSelectIdx].getComponent('Quick_Mid_Item').getTempateId()
    //     this.node.getChildByName("btn_open").getChildByName("sp_select").active = !active
    //     var clubData = GameDataManager.getInstance().clubData
    //     var conf = {
    //         templateId:templateId,
    //         visual: !active
    //     }
    //     MessageManager.getInstance().messageSend(Proto.C2S_CONFIG_CLUB_TEAM_TEMPLATE.MsgID.ID, { clubId:clubData.curSelectClubId, conf:conf});
    // }

    btn_config()
    {
        AudioManager.getInstance().playSFX("button_click");
        var templateId = this.midNodeItem[this.curMidSelectIdx].getComponent('Quick_Mid_Item').getTempateId()
        var clubData = GameDataManager.getInstance().clubData
        clubData.fastGameList[this.configIdx] = templateId
        MessageManager.getInstance().messageSend(Proto.C2S_CONFIG_FAST_GAME_LIST.MsgID.ID, { clubId:clubData.curSelectClubId, templateIds:{1:clubData.fastGameList[0], 2:clubData.fastGameList[1],
            3:clubData.fastGameList[2], 4:clubData.fastGameList[3]}});
        GameManager.getInstance().openWeakTipsUI("配置成功");
        UIManager.getInstance().closeUI(Club_Quick_Game_UI)
    }

    btn_ljtj()
    {
        AudioManager.getInstance().playSFX("button_click");
        var clubData = GameDataManager.getInstance().clubData
        UIManager.getInstance().openUI(RuleUI, 1, () => {
            UIManager.getInstance().closeUI(Club_Quick_Game_UI)
            UIManager.getInstance().getUI(RuleUI).getComponent("RuleUI").setGameTypeData(clubData.clubPower)
            UIManager.getInstance().getUI(RuleUI).getComponent("RuleUI").initUI(2);
        });
        
    }
}

