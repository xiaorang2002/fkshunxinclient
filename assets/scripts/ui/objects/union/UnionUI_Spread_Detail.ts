import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { GAME_NAME, GAME_TYPE } from './../../../data/GameConstValue';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { GameManager } from './../../../GameManager';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { LogWrap } from './../../../../framework/Utils/LogWrap';
import { BaseUI } from "../../../../framework/UI/BaseUI";
import * as GameConstValue from "../../../data/GameConstValue";
import * as Proto from "../../../../proto/proto-min";

const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Spread_Detail extends BaseUI {

    protected static className = "UnionUI_Spread_Detail";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_UNION + this.className;
    }
    
    private fcDetailList = [
        {range:99999, value:0},
        {range:0, value:0},
        {range:0, value:0},
        {range:0, value:0},
        {range:0, value:0},
    ]
    private templateId = 0
    private partnerId = 0
    private total = 0
    private type = "fudingzhi"


    @property(cc.Label)
    labelType: cc.Label = null;

    @property(cc.Label)
    labelName: cc.Label = null;

    @property(cc.Label)
    labelNum: cc.Label = null;

    @property(cc.Node)
    labelHuomian: cc.Node = null;

    @property(cc.Label)
    labelMyCommission: cc.Label = null;

    @property(cc.EditBox)
    edit_FC_fenshu1: cc.EditBox = null;

    @property(cc.EditBox)
    edit_FC_fenshu2: cc.EditBox = null;

    @property(cc.EditBox)
    edit_FC_fenshu3: cc.EditBox = null;

    @property(cc.EditBox)
    edit_FC_fenshu4: cc.EditBox = null;

    @property(cc.EditBox)
    edit_FC_fenshu5: cc.EditBox = null;

    @property(cc.EditBox)
    edit_FC_consume1: cc.EditBox = null;

    @property(cc.EditBox)
    edit_FC_consume2: cc.EditBox = null;

    @property(cc.EditBox)
    edit_FC_consume3: cc.EditBox = null;
    
    @property(cc.EditBox)
    edit_FC_consume4: cc.EditBox = null;
    
    @property(cc.EditBox)
    edit_FC_consume5: cc.EditBox = null;

    @property(cc.EditBox) // 百分比分成
    edit_BFB: cc.EditBox = null;

    start() {

    }

    setInfo(info, partnerId = 0)
    {
        this.templateId = info.templateId
        this.partnerId = partnerId
        var clubData = GameDataManager.getInstance().clubData
        var templateInfo = clubData.getTemplateInfoById(info.templateId)
        var gameId = templateInfo.template.gameId
        var rule = JSON.parse(templateInfo.template.rule)
        var baodi = 0
        this.labelHuomian.getChildByName("label_huomian").getComponent(cc.Label).string = "0" +" 分"
        if (rule.union.tax.min_ensurance)
        {
            baodi = rule.union.tax.min_ensurance/100
            this.labelHuomian.active = true
            this.labelHuomian.getChildByName("label_huomian").getComponent(cc.Label).string = baodi +" 分"
        }
        this.labelName.string = templateInfo.template.description
        this.labelType.string = GAME_NAME[gameId]
        this.labelNum.string = this.getPlayerNum(rule, gameId) + " 人"
        var fenchenNode = this.node.getChildByName("nodeSet").getChildByName("view").getChildByName("content").getChildByName("fenduan")
        var baifenbiNode = this.node.getChildByName("nodeSet").getChildByName("view").getChildByName("content").getChildByName("baifenbi")
        fenchenNode.active = rule.union.tax.percentage_commission != true
        baifenbiNode.active = rule.union.tax.percentage_commission == true
        if (rule.union.tax.percentage_commission == true) // 百分比分成
        {
            this.type = "baifenbi"
            this.total = info.myCommissionRate/100
            this.labelMyCommission.string = this.total.toString()+"%"
            if (info.teamCommissionRate)
                this.edit_BFB.string =  (info.teamCommissionRate/100).toString()
            else
                this.edit_BFB.string = "0"
        }
        else
        {
            if (info.teamCommissionConf)
                this.fcDetailList = this.parseList(info.teamCommissionConf)
            for (var idx = 0; idx < this.fcDetailList.length; idx ++)
            {
                this.edit_FC_fenshu1.string = this.fcDetailList[0].range.toString()
                this.edit_FC_consume1.string = this.fcDetailList[0].value.toString()

                if (this.fcDetailList[1].range == 0){
                    fenchenNode.getChildByName("fenshu2").active = false
                    this.edit_FC_fenshu2.string = "0"
                    this.edit_FC_consume2.string = "0"
                }
                else
                {
                    fenchenNode.getChildByName("fenshu2").active = true
                    this.edit_FC_fenshu2.string = this.fcDetailList[1].range.toString()
                    this.edit_FC_consume2.string = this.fcDetailList[1].value.toString()
                    fenchenNode.getChildByName("fenshu2").getChildByName("label_score").getComponent(cc.Label).string =  (parseFloat(this.edit_FC_fenshu1.string)+0.01).toString()
                    
                }
                if (this.fcDetailList[2].range == 0){
                    fenchenNode.getChildByName("fenshu3").active = false
                    this.edit_FC_fenshu3.string = "0"
                    this.edit_FC_consume3.string = "0"
                }
                else
                {
                    fenchenNode.getChildByName("fenshu3").active = true
                    this.edit_FC_fenshu3.string = this.fcDetailList[2].range.toString()
                    this.edit_FC_consume3.string = this.fcDetailList[2].value.toString()
                    fenchenNode.getChildByName("fenshu3").getChildByName("label_score").getComponent(cc.Label).string =  (parseFloat(this.edit_FC_fenshu2.string)+0.01).toString()

                }
                if (this.fcDetailList[3].range == 0){
                    fenchenNode.getChildByName("fenshu4").active = false
                    this.edit_FC_fenshu4.string = "0"
                    this.edit_FC_consume4.string = "0"
                }
                else
                {
                    fenchenNode.getChildByName("fenshu4").active = true
                    this.edit_FC_fenshu4.string = this.fcDetailList[3].range.toString()
                    this.edit_FC_consume4.string = this.fcDetailList[3].value.toString()
                    fenchenNode.getChildByName("fenshu4").getChildByName("label_score").getComponent(cc.Label).string =  (parseFloat(this.edit_FC_fenshu3.string)+0.01).toString()

                }
                if (this.fcDetailList[4].range == 0){
                    fenchenNode.getChildByName("fenshu5").active = false
                    this.edit_FC_fenshu5.string = "0"
                    this.edit_FC_consume5.string = "0"
                }
                else
                {
                    fenchenNode.getChildByName("fenshu5").active = true
                    this.edit_FC_fenshu4.string = this.fcDetailList[4].range.toString()
                    this.edit_FC_consume4.string = this.fcDetailList[4].value.toString()
                    fenchenNode.getChildByName("fenshu5").getChildByName("label_score").getComponent(cc.Label).string =  (parseFloat(this.edit_FC_fenshu4.string)+0.01).toString()

                }
            }
        }
        
    }

    formatList(lst)
    {
        var finalList = []
        for (var i =0; i < lst.length; i++)
        {
            if (lst[i].range > 0)
                finalList.push({range:lst[i].range*100, value:lst[i].value*100})
        }
        return finalList
    }

    parseList(lst)
    {
        var finalList = []
        for (var i =0; i < 5; i++)
        {
            if (lst[i])
                finalList.push({range:lst[i].range/100, value:lst[i].value/100})
            else
                finalList.push({range:0, value:0})
        }
        return finalList
    }

    getPlayerNum(rule,gameId)
    {
        var oRule = rule
        var num = 0
        if (gameId == GAME_TYPE.MHXL) {
            var temp = [4,3,2]
            num = temp[oRule.room.player_count_option];
        }
        else if (gameId == GAME_TYPE.LFMJ) {
            var temp = [3,2]
            num = temp[oRule.room.player_count_option];
        }
        else if (gameId == GAME_TYPE.ZJH || gameId == GAME_TYPE.NN)
        {
            var temp = [6,8]
            num = temp[oRule.room.player_count_option];
        }
        else if (gameId == GAME_TYPE.XZMJ || gameId == GAME_TYPE.ZGMJ)
        {
            num = 4
        }
        else if (gameId == GAME_TYPE.PDK)
            num = 3
        else if (gameId == GAME_TYPE.LRPDK)
            num = 2
        else if (gameId == GAME_TYPE.DDZ)
        {
            var temp = [3,2]
            num = temp[oRule.room.player_count_option];
        }
        else if (gameId == GAME_TYPE.FR2F)
            num =  4
        else if (gameId == GAME_TYPE.SR2F)
            num =  3
        else if (gameId == GAME_TYPE.TR3F || gameId == GAME_TYPE.TR2F||gameId == GAME_TYPE.TR1F)
            num =  2
        else if (gameId == GAME_TYPE.SCPDK) {
            var temp = [4,3,2]
            num = temp[oRule.room.player_count_option];
        }
        else if (gameId == GAME_TYPE.YJMJ)
        {
            var temp = [4,3,2]
            num = temp[oRule.room.player_count_option];
        }
        else if (gameId == GAME_TYPE.ZGCP)
        {
            var temp = [3,2]
            num = temp[oRule.room.player_count_option];
        }
        else if (gameId == GAME_TYPE.ZGMJ)
        {
            var temp = [3,2]
            num = temp[oRule.room.player_count_option];
        }
        return num
    }

    public onFCfenshu1_edit()
    {
        var score = parseFloat(this.edit_FC_fenshu1.string)
        var fenchenNode = this.node.getChildByName("nodeSet").getChildByName("view").getChildByName("content").getChildByName("fenduan")
        if (!isNaN(score)){
            if (score > 99999)
                this.edit_FC_fenshu1.string = "99999"
            else if (score <= 0)
                this.edit_FC_fenshu1.string = "99999"
        }
        else {
            this.edit_FC_fenshu1.string = "99999"
            GameManager.getInstance().openWeakTipsUI("只能输入数字")
        }
        this.fcDetailList[0].range = parseFloat(this.edit_FC_fenshu1.string)
        if (this.edit_FC_fenshu1.string == "99999")
        {
            this.fcDetailList[1].range = 0
            this.fcDetailList[1].value = 0
            this.fcDetailList[2].range = 0
            this.fcDetailList[2].value = 0
            this.fcDetailList[3].range = 0
            this.fcDetailList[3].value = 0
            this.fcDetailList[4].range = 0
            this.fcDetailList[4].value = 0
            fenchenNode.getChildByName("fenshu2").active = false
            fenchenNode.getChildByName("fenshu3").active = false
            fenchenNode.getChildByName("fenshu4").active = false
            fenchenNode.getChildByName("fenshu5").active = false
            return
        }
        if (this.edit_FC_fenshu2.string == "0"){
            this.edit_FC_fenshu2.string = "99999"
            this.fcDetailList[1].range = 99999
        }
        if(parseFloat(this.edit_FC_fenshu2.string) < parseFloat(this.edit_FC_fenshu1.string))
        {
            this.edit_FC_fenshu1.string = fenchenNode.getChildByName("fenshu2").getChildByName("label_score").getComponent(cc.Label).string
            return
        }
        fenchenNode.getChildByName("fenshu2").getChildByName("label_score").getComponent(cc.Label).string =  (parseFloat(this.edit_FC_fenshu1.string)+0.01).toFixed(2).toString()
        fenchenNode.getChildByName("fenshu2").active = true
        this.onFCConsume2_edit()        
    }

    public onFCfenshu2_edit()
    {
        var score = parseFloat(this.edit_FC_fenshu2.string)
        var fenchenNode = this.node.getChildByName("nodeSet").getChildByName("view").getChildByName("content").getChildByName("fenduan")
        if (!isNaN(score)){
            if (score > 99999)
                this.edit_FC_fenshu2.string = "99999"
            else if (score < 0)
                this.edit_FC_fenshu2.string = "99999"
        }
        else {
            this.edit_FC_fenshu2.string = "99999"
            GameManager.getInstance().openWeakTipsUI("只能输入数字")
        }
        if (parseFloat(this.edit_FC_fenshu2.string) <= parseFloat(this.edit_FC_fenshu1.string) + 0.01){
            this.edit_FC_fenshu2.string = "99999"
        }
        this.fcDetailList[1].range = parseFloat(this.edit_FC_fenshu2.string) 
        if (this.edit_FC_fenshu2.string == "99999")
        {
            this.fcDetailList[2].range = 0
            this.fcDetailList[2].value = 0
            this.fcDetailList[3].range = 0
            this.fcDetailList[3].value = 0
            this.fcDetailList[4].range = 0
            this.fcDetailList[4].value = 0
            fenchenNode.getChildByName("fenshu3").active = false
            fenchenNode.getChildByName("fenshu4").active = false
            fenchenNode.getChildByName("fenshu5").active = false
            return
        }
        if (this.edit_FC_fenshu3.string == "0"){
            this.edit_FC_fenshu3.string = "99999"
            this.fcDetailList[2].range = 99999
        }
        fenchenNode.getChildByName("fenshu3").getChildByName("label_score").getComponent(cc.Label).string =  (parseFloat(this.edit_FC_fenshu2.string)+0.01).toFixed(2).toString()
        fenchenNode.getChildByName("fenshu3").active = true
        this.onFCConsume3_edit() 
    }

    public onFCfenshu3_edit()
    {
        var score = parseFloat(this.edit_FC_fenshu3.string)
        var fenchenNode = this.node.getChildByName("nodeSet").getChildByName("view").getChildByName("content").getChildByName("fenduan")
        if (!isNaN(score)){
            if (score > 99999)
                this.edit_FC_fenshu3.string = "99999"
            else if (score < 0)
                this.edit_FC_fenshu3.string = "99999"
        }
        else {
            this.edit_FC_fenshu3.string = "99999"
            GameManager.getInstance().openWeakTipsUI("只能输入数字")
        }
        if (parseFloat(this.edit_FC_fenshu3.string) <= parseFloat(this.edit_FC_fenshu2.string) + 0.01){
            this.edit_FC_fenshu3.string = "99999"
        }
        this.fcDetailList[2].range = parseFloat(this.edit_FC_fenshu3.string) 
        if (this.edit_FC_fenshu3.string == "99999")
        {
            this.fcDetailList[3].range = 0
            this.fcDetailList[3].value = 0
            this.fcDetailList[4].range = 0
            this.fcDetailList[4].value = 0
            fenchenNode.getChildByName("fenshu4").active = false
            fenchenNode.getChildByName("fenshu5").active = false
            return
        }
        if (this.edit_FC_fenshu4.string == "0"){
            this.edit_FC_fenshu4.string = "99999"
            this.fcDetailList[3].range = 99999
        }
        fenchenNode.getChildByName("fenshu4").getChildByName("label_score").getComponent(cc.Label).string =  (parseFloat(this.edit_FC_fenshu3.string)+0.01).toFixed(2).toString()
        fenchenNode.getChildByName("fenshu4").active = true
        this.onFCConsume4_edit() 
    }

    public onFCfenshu4_edit()
    {
        var score = parseFloat(this.edit_FC_fenshu4.string)
        var fenchenNode = this.node.getChildByName("nodeSet").getChildByName("view").getChildByName("content").getChildByName("fenduan")
        if (!isNaN(score)){
            if (score > 99999)
                this.edit_FC_fenshu4.string = "99999"
            else if (score < 0)
                this.edit_FC_fenshu4.string = "99999"
        }
        else {
            this.edit_FC_fenshu4.string = "99999"
            GameManager.getInstance().openWeakTipsUI("只能输入数字")
        }
        if (parseFloat(this.edit_FC_fenshu4.string) <= parseFloat(this.edit_FC_fenshu3.string) + 0.01){
            this.edit_FC_fenshu4.string = "99999"
        }
        this.fcDetailList[3].range = parseFloat(this.edit_FC_fenshu4.string) 
        if (this.edit_FC_fenshu4.string == "99999")
        {
            this.fcDetailList[4].range = 0
            this.fcDetailList[4].value = 0
            fenchenNode.getChildByName("fenshu5").active = false
            return
        }
        if (this.edit_FC_fenshu5.string == "0"){
            this.edit_FC_fenshu5.string = "99999"
            this.fcDetailList[4].range = 99999
        }
        fenchenNode.getChildByName("fenshu5").getChildByName("label_score").getComponent(cc.Label).string =  (parseFloat(this.edit_FC_fenshu4.string)+0.01).toFixed(2).toString()
        fenchenNode.getChildByName("fenshu5").active = true
        this.onFCConsume5_edit() 
    }

    public onFCfenshu5_edit()
    {
        var score = parseFloat(this.edit_FC_fenshu5.string)
        if (!isNaN(score)){
            if (score > 99999)
                this.edit_FC_fenshu5.string = "99999"
            else if (score < 0)
                this.edit_FC_fenshu5.string = "99999"
        }
        else {
            this.edit_FC_fenshu5.string = "99999"
            GameManager.getInstance().openWeakTipsUI("只能输入数字")
        }
        if (parseFloat(this.edit_FC_fenshu5.string) < parseFloat(this.edit_FC_fenshu4.string)){
            this.edit_FC_fenshu5.string = "99999"
            return
        }
        this.fcDetailList[4].range = parseFloat(this.edit_FC_fenshu5.string) 
    }

    public onFCConsume1_edit()
    {
        var score = parseFloat(this.edit_FC_consume1.string)
        var fenchenNode = this.node.getChildByName("nodeSet").getChildByName("view").getChildByName("content").getChildByName("fenduan")
        if (!isNaN(score)){
            if (score > 99999)
                this.edit_FC_consume1.string = "99999"
            else if (score < 0)
                this.edit_FC_consume1.string = "0"
        }
        else {
            this.edit_FC_consume1.string = "0"
            GameManager.getInstance().openWeakTipsUI("只能输入数字")
        }
        this.fcDetailList[0].value = parseFloat(this.edit_FC_consume1.string)

        if (fenchenNode.getChildByName("fenshu2").active)
            this.onFCConsume2_edit()
    }

    public onFCConsume2_edit()
    {
        var score = parseFloat(this.edit_FC_consume2.string)
        var fenchenNode = this.node.getChildByName("nodeSet").getChildByName("view").getChildByName("content").getChildByName("fenduan")
        if (!isNaN(score)){
            if (score > 99999)
                this.edit_FC_consume2.string = "99999"
            else if (score < 0)
                this.edit_FC_consume2.string = "0"
        }
        else {
            this.edit_FC_consume2.string = "0"
            GameManager.getInstance().openWeakTipsUI("只能输入数字")
        }
        // if (parseFloat(this.edit_FC_consume2.string) <= parseFloat(this.edit_FC_consume1.string)){
        //     this.edit_FC_consume2.string = (parseFloat(this.edit_FC_consume1.string) + 1).toString()
        // }
        this.fcDetailList[1].value = parseFloat(this.edit_FC_consume2.string)
        if (fenchenNode.getChildByName("fenshu3").active)
            this.onFCConsume3_edit()
    }

    public onFCConsume3_edit()
    {
        var score = parseFloat(this.edit_FC_consume3.string)
        var fenchenNode = this.node.getChildByName("nodeSet").getChildByName("view").getChildByName("content").getChildByName("fenduan")
        if (!isNaN(score)){
            if (score > 99999)
                this.edit_FC_consume3.string = "99999"
            else if (score < 0)
                this.edit_FC_consume3.string = "0"
        }
        else {
            this.edit_FC_consume3.string = "0"
            GameManager.getInstance().openWeakTipsUI("只能输入数字")
        }
        // if (parseFloat(this.edit_FC_consume3.string) <= parseFloat(this.edit_FC_consume2.string)){
        //     this.edit_FC_consume3.string = (parseFloat(this.edit_FC_consume2.string) + 1).toString()
        // }
        this.fcDetailList[2].value = parseFloat(this.edit_FC_consume3.string)
        if (fenchenNode.getChildByName("fenshu4").active)
            this.onFCConsume4_edit()
    }

    public onFCConsume4_edit()
    {
        var score = parseFloat(this.edit_FC_consume4.string)
        var fenchenNode = this.node.getChildByName("nodeSet").getChildByName("view").getChildByName("content").getChildByName("fenduan")
        if (!isNaN(score)){
            if (score > 99999)
                this.edit_FC_consume4.string = "99999"
            else if (score < 0)
                this.edit_FC_consume4.string = "0"
        }
        else {
            this.edit_FC_consume4.string = "0"
            GameManager.getInstance().openWeakTipsUI("只能输入数字")
        }
        // if (parseFloat(this.edit_FC_consume4.string) <= parseFloat(this.edit_FC_consume3.string)){
        //     this.edit_FC_consume4.string = (parseFloat(this.edit_FC_consume3.string) + 1).toString()
        // }
        this.fcDetailList[3].value = parseFloat(this.edit_FC_consume4.string)
        if (fenchenNode.getChildByName("fenshu5").active)
            this.onFCConsume4_edit()
    }

    public onFCConsume5_edit()
    {
        var score = parseFloat(this.edit_FC_consume5.string)
        if (!isNaN(score)){
            if (score > 99999)
                this.edit_FC_consume5.string = "99999"
            else if (score < 0)
                this.edit_FC_consume5.string = "0"
        }
        else {
            this.edit_FC_consume5.string = "0"
            GameManager.getInstance().openWeakTipsUI("只能输入数字")
        }
        // if (parseFloat(this.edit_FC_consume5.string) <= parseFloat(this.edit_FC_consume4.string)){
        //     this.edit_FC_consume5.string = (parseFloat(this.edit_FC_consume4.string) + 1).toString()
        // }
        this.fcDetailList[4].value = parseFloat(this.edit_FC_consume5.string)

    }

    public editBFBFinished()
    {
        var score = Math.floor(parseFloat(this.edit_BFB.string) *100)/100
        if (isNaN(score)){
            this.edit_BFB.string = "0"
            GameManager.getInstance().openWeakTipsUI("只能输入数字")
            return
        }
        else if (score < 0)
        {
            this.edit_BFB.string = "0"
            GameManager.getInstance().openWeakTipsUI("不能输入负百分比")
            return
        }
        else if (score > 100)
        {
            this.edit_BFB.string = "0"
            GameManager.getInstance().openWeakTipsUI("输入的百分比不能超过100")
            return
        }
        this.edit_BFB.string = score.toString();
    }




    public btn_save(){
        AudioManager.getInstance().playSFX("button_click"); 
        var clubData = GameDataManager.getInstance().clubData
        if (this.type == "baifenbi")
        {
            var score = parseFloat(this.edit_BFB.string)
            if (isNaN(score)){
                this.edit_BFB.string = "0"
                GameManager.getInstance().openWeakTipsUI("只能输入数字")
                return
            }
            var clubData = GameDataManager.getInstance().clubData
            if (this.partnerId !=0)
            {
                let conf1 = {
                    templateId:this.templateId,
                    visual:true,
                    partnerId: this.partnerId,
                    teamCommissionRate: score*100,
                    myCommissionRate:this.total*100,
                }
                MessageManager.getInstance().messageSend(Proto.C2S_CONFIG_CLUB_TEMPLATE_COMMISSION.MsgID.ID, {clubId:clubData.curSelectClubId,conf:conf1});
            }
            else
            {
                let conf2 = {
                    templateId:this.templateId,
                    visual:true,
                    teamCommissionRate: score*100,
                    myCommissionRate:this.total*100,
                }
                MessageManager.getInstance().messageSend(Proto.C2S_CONFIG_CLUB_TEAM_TEMPLATE.MsgID.ID, {clubId:clubData.curSelectClubId,conf:conf2});
            }
        }
        else
        {
            if (this.partnerId !=0)
            {
                let conf1 = {
                    templateId:this.templateId,
                    partnerId: this.partnerId,
                    visual:true,
                    teamCommissionConf:this.formatList(this.fcDetailList),
                }
                MessageManager.getInstance().messageSend(Proto.C2S_CONFIG_CLUB_TEMPLATE_COMMISSION.MsgID.ID, {clubId:clubData.curSelectClubId,conf: conf1});
            }
            else
            {
                let conf2 = {
                    templateId:this.templateId,
                    visual:true,
                    teamCommissionConf:this.formatList(this.fcDetailList),
                }
                MessageManager.getInstance().messageSend(Proto.C2S_CONFIG_CLUB_TEAM_TEMPLATE.MsgID.ID, {clubId:clubData.curSelectClubId,conf:conf2});
            }
        }
    }

    private button_close() {
        AudioManager.getInstance().playSFX("button_click"); 
        UIManager.getInstance().closeUI(UnionUI_Spread_Detail);
    }
}
