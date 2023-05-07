import { ListenerType } from './../data/ListenerType';
import { ListenerManager } from './../../framework/Manager/ListenerManager';
import { SdkManager } from './../../framework/Utils/SdkManager';
import { SelectTipsUI } from './SelectTipsUI';
import { UnionUI_Rule } from './objects/union/UnionUI_Rule';
import { BaseUI } from "../../framework/UI/BaseUI";
import { GameDataManager } from "../../framework/Manager/GameDataManager";
import * as GameConstValue from "../data/GameConstValue";
import { LogWrap } from "../../framework/Utils/LogWrap";
import { BaseRuleUI } from "./objects/rule/BaseRuleUI";
import { UIManager } from "../../framework/Manager/UIManager";
import { MessageManager } from "../../framework/Manager/MessageManager";
import * as Proto from "../../proto/proto-min";
import { AudioManager } from "../../framework/Manager/AudioManager";
import { GameManager } from "../GameManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class RuleUI extends BaseUI {

    protected static className = "RuleUI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_HALL_DIR + this.className;
    }

    @property(cc.Prefab)
    ruleItemPrefab: cc.Prefab = null;
    @property(cc.EditBox)
    edit: cc.EditBox = null;
    @property(cc.Node)
    nodeView: cc.Node = null;
    @property(cc.Node)
    nodeListContent: cc.Node = null;

    private gameIdx: number = 0;       //当前游戏类型
    private gameRulePrefab: cc.Node = null;//当前的显示界面
    private uiType: number = 0;//当前规则界面的类型
    // private nodeView: any = 0;
    private gameTypeList = []
    private gameAdvanceUI : cc.Node = null;
    private baseRule = null
    private advanceRule = null
    private nodeItemList = []
    private isAdding = false

    //对应配置
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

    public setGameTypeData(value)
    {
        this.gameTypeList = value
    }

    onLoad()
    {
        
    }


    start()
    {
        this.isAdding = false
        this.initListen()
    }

    private initListen()
    {
        ListenerManager.getInstance().add(ListenerType.clubFastRoomChanged, this, this.clubFastRoomChanged);
    }

    //传入参数初始化界面
    /** type 0 大厅创建 1 亲友群创建 2 创建玩法*/
    /** rule 已有规则 */
    public initUI(type: number, gameType = 0) {

        //初始化游戏类型选项
        this.uiType = type;
        if (this.uiType == 0)
        {
            this.node.getChildByName("btn_common_rule").active = true
            this.node.getChildByName("rule_select_bg").active = false
            this.edit.node.active = false
        }
        else
        {
            if (GameDataManager.getInstance().clubData.clubType != 0)
            {
                this.node.getChildByName("btn_common_rule").active = false
                this.node.getChildByName("rule_select_bg").active = true
            }
            else
            {
                this.node.getChildByName("btn_common_rule").active =true
                this.node.getChildByName("rule_select_bg").active = false
            }
        }
        this.updateGameTypeList(gameType);
        this.settingSelect(0)

    }

    private clubFastRoomChanged(msg)
    {
        if (msg.type == 1){ // SYNC_TYPE.SYNC_ADD
            GameManager.getInstance().openWeakTipsUI("添加玩法成功");
            UIManager.getInstance().closeUI(RuleUI)
        }
    }

    private settingSelect(type)  // 0是基础界面 1是高级设置界面
    {
        var type2toggle = {
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

        this.node.getChildByName("rule_select_bg").getChildByName("btn_base_unselect").getChildByName("btn_base_select").active = type == 0
        this.node.getChildByName("rule_select_bg").getChildByName("btn_base_unselect").getChildByName("label_unselect").active = type == 1
        this.node.getChildByName("rule_select_bg").getChildByName("btn_advance_unselect").getChildByName("btn_advance_select").active = type == 1
        this.node.getChildByName("rule_select_bg").getChildByName("btn_advance_unselect").getChildByName("label_unselect").active = type == 0

        if (this.gameRulePrefab){
            this.baseRule = this.gameRulePrefab.getComponent(BaseRuleUI).getRule()
            this.gameRulePrefab.getComponent(BaseRuleUI).saveRule();
            this.gameRulePrefab.removeFromParent()
        }
        if (this.gameAdvanceUI){
            this.advanceRule = this.gameAdvanceUI.getComponent("UnionUI_Rule").getRule()
            this.gameAdvanceUI.removeFromParent()
        }
        this.gameRulePrefab = null 
        this.gameAdvanceUI = null
        var gameType = this.gameTypeList[this.gameIdx]
        if(type == 0)
        {
            cc.resources.load(
                this.gameRuleUrl[type2toggle[gameType]], cc.Prefab,
                function (error, prefab)  {
                    if (error) {
                        LogWrap.err(error);
                        return;
                    }
                    if (this.gameRulePrefab != null) {
                        this.gameRulePrefab.destroy();
                    }
                    this.gameRulePrefab = cc.instantiate(prefab);
                    this.gameRulePrefab.y = 0;
                    this.gameRulePrefab.parent = this.nodeView;
                    this.gameRulePrefab.getComponent(BaseRuleUI).initRule(this.baseRule);
                    this.gameRulePrefab.getComponent(BaseRuleUI).setRuleType(this.uiType);
                    this.nodeView.getParent().getComponent(cc.ScrollView).content = this.gameRulePrefab;
                }.bind(this));
        }
        else
        {
            cc.resources.load(
                this.advanceSettingUrl, cc.Prefab,
                function (error, prefab) {
                    if (error) {
                        LogWrap.err(error);
                        return;
                    }
                    if (this.gameAdvanceUI != null) {
                        this.gameAdvanceUI.destroy();
                    }
                    this.gameAdvanceUI = cc.instantiate(prefab);
                    this.gameAdvanceUI.y = 0;
                    this.gameAdvanceUI.parent = this.nodeView;
                    this.gameAdvanceUI.getComponent("UnionUI_Rule").initRule(this.advanceRule);
                    this.nodeView.getParent().getComponent(cc.ScrollView).content = this.gameAdvanceUI;
                }.bind(this));
        }
    }

    private updateGameTypeList(gameType = 0) {
        //管理员
        var tempIdx = 0
        for (let i = 0; i < this.gameTypeList.length; ++i) {
            if (this.gameTypeList[i] == 1)
                continue
            var newnode = cc.instantiate(this.ruleItemPrefab);
            newnode.parent = this.nodeListContent;
            var pnode = newnode.getComponent('RuleUI_Item');
            pnode.setInfo(i, this.gameTypeList[i])
            this.nodeItemList.push(pnode)
            this.nodeListContent.height = 90 * this.gameTypeList.length;
            if (gameType == 0 && tempIdx == 0)
            {
                this.gameIdx = i
                pnode.setSelect(true)
            }
            else if (gameType == this.gameTypeList[i]){
                this.gameIdx = i
                pnode.setSelect(true)
            }
            tempIdx += 1
            if (this.nodeListContent.height < 620)
                this.nodeListContent.height = 620;
        }
    }

    public selectGameItem(idx)
    {
        if (idx == this.gameIdx)
            return
        this.nodeItemList[this.gameIdx].getComponent('RuleUI_Item').setSelect(false);
        this.nodeItemList[idx].getComponent('RuleUI_Item').setSelect(true);
        this.gameIdx = idx
        this.baseRule = null
        this.advanceRule = null
        if (this.gameRulePrefab)
            this.gameRulePrefab.removeFromParent()
        if (this.gameAdvanceUI)
            this.gameAdvanceUI.removeFromParent()
        this.gameRulePrefab = null
        this.gameAdvanceUI = null
        this.node.getChildByName("gamerule").getComponent(cc.ScrollView).stopAutoScroll()
        this.settingSelect(0)
    }

    // public selectLeftByGame(gameType)
    // {
    //     console.log(this.gameIdx, "--------------------")
    //     for (var idx =0; idx < this.gameTypeList.length; idx++)
    //     {
    //         console.log(this.gameTypeList, idx, gameType)
    //         if (gameType == this.gameTypeList[idx])
    //         {
    //             this.selectGameItem(idx)
    //             return
    //         }
    //     }
    // }

    private onRoomNameEdit()
    {
        var editString = this.edit.string
        var length = editString.length
        if ( length > 50){
            this.edit.string = editString.substring(0, length-1)
            this.edit.focus()
        }
    }

    //大厅亲友群创建
    //0 大厅 1 亲友群创建 2 亲友群添加
    private button_create(event, customEventData) {
        AudioManager.getInstance().playSFX("button_click");
        if (this.advanceRule == null && this.uiType != 0&& GameDataManager.getInstance().clubData.clubType == 1) // 没有选择高级规则是，规则为空
            this.advanceRule = UnionUI_Rule.getDefaultRule() 
        if(this.gameAdvanceUI != null)
            this.advanceRule = this.gameAdvanceUI.getComponent("UnionUI_Rule").getRule()
        if(this.gameRulePrefab != null)
        {
            this.baseRule = this.gameRulePrefab.getComponent(BaseRuleUI).getRule()
            this.gameRulePrefab.getComponent(BaseRuleUI).saveRule();
        }

        var rule = this.baseRule
        if (this.advanceRule != null)
            rule.union = this.advanceRule

        if (GameDataManager.getInstance().isCreatingRoom){
            GameManager.getInstance().openWeakTipsUI("房间创建中，请稍后");
            return
        }

        if (this.uiType == 0) {
            if (this.baseRule == null)
            {
                GameManager.getInstance().openWeakTipsUI("请确认勾选了规则再创建");
                return
            }   
            if (this.baseRule.option.gps_distance > 0)  // 创建一个防作弊房间
            {
                if (GameDataManager.getInstance().gpsData == null || (GameDataManager.getInstance().gpsData.jingdu<0 || GameDataManager.getInstance().gpsData.weidu<0))
                {
                    try{
                        var localStoreGps = false
                        // var storeGps = cc.sys.localStorage.getItem("gpsdata")
                        var storeGps = null
                        if (!storeGps || storeGps == undefined || storeGps == "")
                            localStoreGps = false
                        else
                        {
                            var localGpsInfo = JSON.parse(storeGps)
                            var nowTime = new Date().getTime()
                            if (localGpsInfo.date && nowTime-localGpsInfo.date < 60*60*12*1000) // 12小时不过期
                                localStoreGps = true
                        }
                        if (!localStoreGps)
                        {
                            var tips = "创建GPS防作弊房间需要获取GPS定位信息，是否获取"
                            UIManager.getInstance().openUI(SelectTipsUI, 50, () => {
                                UIManager.getInstance().getUI(SelectTipsUI).getComponent("SelectTipsUI").initUI(tips, SdkManager.getInstance().doGetLocation, null);
                            });
                            return
                        }
                        else
                        {
                            GameDataManager.getInstance().gpsData = JSON.parse(storeGps)
                        }
                    }
                    catch (e)
                    {
                        return
                    }
                }
            }
            let msg =
            {
                gameType: this.gameTypeList[this.gameIdx],
                rule: JSON.stringify(this.baseRule) ,
            }
            GameDataManager.getInstance().isCreatingRoom = true
            MessageManager.getInstance().messageSend(Proto.CS_CreateRoom.MsgID.ID, msg);

        }
        else if (this.uiType == 1) {
            if (this.baseRule == null)
            {
                GameManager.getInstance().openWeakTipsUI("请确认勾选了规则再创建");
                return
            }  
            if (this.baseRule.option.gps_distance > 0)  // 创建一个防作弊房间
            {
                if (GameDataManager.getInstance().gpsData == null || (GameDataManager.getInstance().gpsData.jingdu<0 || GameDataManager.getInstance().gpsData.weidu<0))
                {
                    try{
                        var localStoreGps = false
                        // var storeGps = cc.sys.localStorage.getItem("gpsdata")
                        var storeGps = null
                        if (!storeGps || storeGps == undefined || storeGps == "")
                            localStoreGps = false
                        else
                        {
                            var localGpsInfo = JSON.parse(storeGps)
                            var nowTime = new Date().getTime()
                            if (localGpsInfo.date && nowTime-localGpsInfo.date < 60*60*12*1000) // 12小时不过期
                                localStoreGps = true
                        }
                        if (!localStoreGps)
                        {
                            var tips = "创建GPS防作弊房间需要获取GPS定位信息，是否获取"
                            UIManager.getInstance().openUI(SelectTipsUI, 50, () => {
                                UIManager.getInstance().getUI(SelectTipsUI).getComponent("SelectTipsUI").initUI(tips, SdkManager.getInstance().doGetLocation, null);
                            });
                            return
                        }
                        else
                        {
                            GameDataManager.getInstance().gpsData = JSON.parse(storeGps)
                        }
                    }
                    catch (e)
                    {
                        return
                    }
                }
            }
            let msg =
            {
                clubId: GameDataManager.getInstance().clubData.curSelectClubId,
                gameType: this.gameTypeList[this.gameIdx],
                rule: JSON.stringify(this.baseRule),
            }

            GameDataManager.getInstance().isCreatingRoom = true
            MessageManager.getInstance().messageSend(Proto.CS_CreateRoom.MsgID.ID, msg);
        }
        else if (this.uiType == 2) {
            if (this.edit.string.length == 0)
            {
                GameManager.getInstance().openWeakTipsUI("当前创建的玩法名字不能为空");
                if(this.gameAdvanceUI != null)
                    this.gameAdvanceUI.getComponent("UnionUI_Rule").initRuleInfoByData(this.advanceRule);
                return
            }
            if (this.isAdding)
            {
                GameManager.getInstance().openWeakTipsUI("添加玩法中，请稍后...");
                return
            }
            this.isAdding = true;
            let msg =
            {
                template : {
                    clubId: GameDataManager.getInstance().clubData.curSelectClubId,
                    template : {
                        templateId: 0,
                        gameId: this.gameTypeList[this.gameIdx],
                        rule: JSON.stringify(rule),
                        description: this.edit.string
                    },
                },
                editOp : 1
            
            }
            MessageManager.getInstance().messageSend(Proto.C2S_EDIT_TABLE_TEMPLATE.MsgID.ID, msg);
        }
    }

    private button_close() {
        AudioManager.getInstance().playSFX("button_click");
        if (this.gameRulePrefab != null) {
            this.gameRulePrefab.getComponent(BaseRuleUI).saveRule();
            this.gameRulePrefab.destroy();
        }
        UIManager.getInstance().closeUI(RuleUI);
    }



    private button_close_open_club(event, customEventData) {

       
    }

    private button_setting_select(event, customEventData)
    {
        let type = parseInt(customEventData);
        this.settingSelect(type)
    }

}

