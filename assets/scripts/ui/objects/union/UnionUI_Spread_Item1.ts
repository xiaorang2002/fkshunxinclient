import { UnionUI_Spread_Detail } from './UnionUI_Spread_Detail';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { GAME_NAME,GAME_TYPE } from './../../../data/GameConstValue';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";


const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Spread_Item1 extends cc.Component {

    private templateId = 0
    private gameId = 0
    private rule = ""
    private total = 0
    private taxType = -1
    private num = 0
    private info = null

    setInfo(info)
    {
        this.info = info
        this.templateId = info.templateId
        var clubData = GameDataManager.getInstance().clubData
        var templateInfo = clubData.getTemplateInfoById(info.templateId)
        this.gameId = templateInfo.template.gameId
        var oRule = JSON.parse(templateInfo.template.rule)
        this.setRule(oRule)
        // var baodi = 0
        // if (oRule.union.tax.min_ensurance)
        //     baodi = oRule.union.tax.min_ensurance/100
        // this.total = info.myCommissionRate/100
        this.node.getChildByName("label_name").getComponent(cc.Label).string = templateInfo.template.description
        this.node.getChildByName("label_type").getComponent(cc.Label).string = GAME_NAME[this.gameId]
        this.node.getChildByName("label_num").getComponent(cc.Label).string = this.num + " 人"
        var fcType = ""
        if (oRule.union.tax.percentage_commission == true) // 百分比分成
            fcType = "百分比"
        else
            fcType = "分段"
        this.node.getChildByName("label_fc").getComponent(cc.Label).string = fcType
        
        // this.node.getChildByName("label_baodi").getComponent(cc.Label).string = baodi.toString()
        // this.node.getChildByName("label_num").getComponent(cc.Label).string = (info.myCommissionRate/100).toString()
        // if (info.teamCommissionRate)
        //     this.edit.string =  (info.teamCommissionRate/100).toString()
        // else
        //     this.edit.string = "0"
    }

    setRule(rule)
    {
        var oRule = rule
        if (this.gameId == GAME_TYPE.MHXL) {
            var temp = [4,3,2]
            this.num = temp[oRule.room.player_count_option];
        }
        else if (this.gameId == GAME_TYPE.LFMJ) {
            var temp = [3,2]
            this.num = temp[oRule.room.player_count_option];
        }
        else if (this.gameId == GAME_TYPE.XZMJ || this.gameId == GAME_TYPE.ZGMJ)
            this.num = 4
        else if (this.gameId == GAME_TYPE.PDK)
            this.num = 3
        else if (this.gameId == GAME_TYPE.LRPDK)
            this.num = 2
        else if (this.gameId == GAME_TYPE.DDZ)
        {
            var temp = [3,2]
            this.num = temp[oRule.room.player_count_option];
        }
        else if (this.gameId == GAME_TYPE.FR2F)
            this.num =  4
        else if (this.gameId == GAME_TYPE.SR2F)
            this.num =  3
        else if (this.gameId == GAME_TYPE.TR3F || this.gameId == GAME_TYPE.TR2F||this.gameId == GAME_TYPE.TR1F)
            this.num =  2
        else if (this.gameId == GAME_TYPE.SCPDK) {
            var temp = [4,3,2]
            this.num = temp[oRule.room.player_count_option];
        }
        else if (this.gameId == GAME_TYPE.ZJH || this.gameId == GAME_TYPE.NN)
        {
            var temp = [6,8]
            this.num = temp[oRule.room.player_count_option];
        }
        else if (this.gameId == GAME_TYPE.YJMJ){
            var temp = [4,3,2]
            this.num = temp[oRule.room.player_count_option];
        }
        else if (this.gameId == GAME_TYPE.ZGCP){
            var temp = [3,2]
            this.num = temp[oRule.room.player_count_option];
        }
        else if (this.gameId == GAME_TYPE.ZGMJ){
            var temp = [3,2]
            this.num = temp[oRule.room.player_count_option];
        }
    }

    //获取id
    getId() {
        return this.templateId
    }

    // editFinished()
    // {
    //     var score = Math.floor(parseFloat(this.edit.string) *100)/100
    //     if (isNaN(score)){
    //         this.edit.string = "0"
    //         GameManager.getInstance().openWeakTipsUI("只能输入数字")
    //         return
    //     }
    //     else if (score < 0)
    //     {
    //         this.edit.string = "0"
    //         GameManager.getInstance().openWeakTipsUI("不能输入负百分比")
    //         return
    //     }
    //     else if (score > this.total)
    //     {
    //         this.edit.string = "0"
    //         GameManager.getInstance().openWeakTipsUI("输入的百分比不能超过"+this.total)
    //         return
    //     }
    //     this.edit.string = score.toString();
    // }

    btn_confirm()
    {
        AudioManager.getInstance().playSFX("button_click");
        // var commission = this.total*100
        // if (this.taxType == 1)
        //     commission = commission * this.num
        // var conf = {
            // templateId:this.templateId,
            // visual:true,
            // teamCommissionRate: score*100,
            // myCommissionRate:this.total*100,
        // }
        UIManager.getInstance().openUI(UnionUI_Spread_Detail, 10, () => {
            UIManager.getInstance().getUI(UnionUI_Spread_Detail).getComponent("UnionUI_Spread_Detail").setInfo(this.info);
            });
        // MessageManager.getInstance().messageSend(Proto.C2S_CONFIG_CLUB_TEAM_TEMPLATE.MsgID.ID, {clubId:clubData.curSelectClubId,conf:conf});
    }


}
