import { PreferentData } from './../../../data/PreferentData';
import { Utils } from './../../../../framework/Utils/Utils';
import { GameManager } from './../../../GameManager';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { BaseUI } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { MessageManager } from "../../../../framework/Manager/MessageManager";
import * as Proto from "../../../../proto/proto-min";

const { ccclass, property } = cc._decorator;

@ccclass
export class ShowRuleUI extends BaseUI {
    protected static className = "ShowRuleUI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_RULE_DIR + this.className;
    }

    @property(cc.Label)
    labelBase: cc.Label = null;
    @property(cc.Label)
    labelRule: cc.Label = null;
    @property(cc.Label)
    labelAdvancRule: cc.Label = null;
    @property(cc.Node)
    nodeJoin: cc.Node = null;

    onLoad() {
        super.onLoad()
    }

    start() {
    }

    private _joinInfo: any = null;
    private _isGps = false
    initUI(info, clubType,joinInfo: any = null) {
        this.nodeJoin.active = (joinInfo != null);
        this._joinInfo = joinInfo;
        try{
            this.labelBase.string = "规则：" + Utils.getBase(info);
            this.labelRule.string = "玩法：" + Utils.getRule(info);
            this._isGps = JSON.parse(info.rule).option.gps_distance > 0
            if (clubType == 0)
                this.labelAdvancRule.string = ""
            else{
                this.labelAdvancRule.string = this.getAdvanceRule(info.rule);
            }
        }
        catch (e)
        {
            this.labelBase.string = "规则：未解析出房间规则"
            this.labelRule.string = "玩法：未解析出相关玩法"
        }
        
    }

    getAdvanceRule(rule)
    {
        var rule = JSON.parse(rule).union;
        if (rule == undefined)
            return ""
        let str = "高级规则：";
        if (rule.entry_score)
            str += "进房门槛:" + rule.entry_score/100 + "分  "
        if (rule.score_rate)
            str += "游戏底分: " + rule.score_rate + "倍  " 
        if (rule.min_score)
            str += "最低游戏门槛: " + rule.min_score/100 + "分 "
        else
            str += "最低游戏门槛: " + "关 "
        if (rule.tax.AA != null){
            str += "AA消耗" + rule.tax.AA/100 + "分"
        }
        else
        {
            try{
                var scoreList = []
                var consumeList = []
                for (var dataList of rule.tax.big_win)
                {
                    scoreList.push(dataList[0]/100)
                    consumeList.push(dataList[1]/100)
                }
                str += "积分段" +JSON.stringify(scoreList) + ",房间消耗"+JSON.stringify(consumeList)
            }
            catch (e){}
        }
        return str
    }
    private btn_close() {
        UIManager.getInstance().closeUI(ShowRuleUI);
    }

    private button_add() {
        if (this._joinInfo.tableId > 0) {
            if (GameDataManager.getInstance().isJoinRoom){
                GameManager.getInstance().openWeakTipsUI("加入房间中，请稍后");
                return
            }
            if (this._isGps){
                if (!Utils.checkGps())
                    return
            }

            let msg =
            {
                tableId: this._joinInfo.tableId,
            }
            GameDataManager.getInstance().isJoinRoom = true
            PreferentData.getInstance().updateEnterGamePreferent(this._joinInfo.templateId)
            MessageManager.getInstance().messageSend(Proto.CS_JoinRoom.MsgID.ID, msg);
        }
        else {
            if (GameDataManager.getInstance().isCreatingRoom){
                GameManager.getInstance().openWeakTipsUI("房间创建中，请稍后");
                return
            }
            if (this._isGps){
                if (!Utils.checkGps())
                    return
            }
            let msg =
            {
                clubId: this._joinInfo.clubId,
                templateId: this._joinInfo.templateId,
            }
            
            GameDataManager.getInstance().isCreatingRoom = true
            PreferentData.getInstance().updateEnterGamePreferent(this._joinInfo.templateId)
            MessageManager.getInstance().messageSend(Proto.CS_CreateRoom.MsgID.ID, msg);
        }
        UIManager.getInstance().closeUI(ShowRuleUI);
    }
}
