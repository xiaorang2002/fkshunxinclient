import { UnionUI_Spread_Detail } from './UnionUI_Spread_Detail';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { GAME_NAME,GAME_TYPE } from './../../../data/GameConstValue';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import * as Proto from "../../../../proto/proto-min";
import { MessageManager } from "../../../../framework/Manager/MessageManager";


const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Spread_Single_Item extends cc.Component {

    private templateId = 0
    private gameId = 0
    private rule = ""
    private total = 0
    private _playerId: number = 0;
    private info = null
    private num = 0

    setInfo(info)
    {
        this.info = info
        this.templateId = info.templateId
        this._playerId = info.partnerId;
        var clubData = GameDataManager.getInstance().clubData
        var templateInfo = clubData.getTemplateInfoById(info.templateId)
        this.gameId = templateInfo.template.gameId
        var oRule = JSON.parse(templateInfo.template.rule)
        this.setRule(oRule)
        this.node.getChildByName("label_name").getComponent(cc.Label).string = templateInfo.template.description
        this.node.getChildByName("label_type").getComponent(cc.Label).string = GAME_NAME[this.gameId]
        this.node.getChildByName("label_num").getComponent(cc.Label).string = this.num + " 人"
        var fcType = ""
        if (oRule.union.tax.percentage_commission == true) // 百分比分成
            fcType = "百分比"
        else
            fcType = "分段"
        this.node.getChildByName("label_fc").getComponent(cc.Label).string = fcType
    }

    setRule(rule)
    {
        this.rule = rule
        if (this.gameId == GAME_TYPE.MHXL) {
            var temp = [4,3,2]
            this.num = temp[rule.room.player_count_option];
        }
        if (this.gameId == GAME_TYPE.LFMJ) {
            var temp = [3,2]
            this.num = temp[rule.room.player_count_option];
        }
        if(this.gameId == GAME_TYPE.XZMJ || this.gameId == GAME_TYPE.ZGMJ)
            this.num = 4
        else if (this.gameId == GAME_TYPE.PDK)
            this.num = 3
        else if (this.gameId == GAME_TYPE.LRPDK)
            this.num = 2
        else if (this.gameId == GAME_TYPE.DDZ)
        {
            var temp = [3,2]
            this.num = temp[rule.room.player_count_option];
        }
        else if (this.gameId == GAME_TYPE.FR2F)
            this.num =  4
        else if (this.gameId == GAME_TYPE.SR2F)
            this.num =  3
        else if (this.gameId == GAME_TYPE.TR3F || this.gameId == GAME_TYPE.TR2F||this.gameId == GAME_TYPE.TR1F)
            this.num =  2
        else if (this.gameId == GAME_TYPE.SCPDK) {
            var temp = [4,3,2]
            this.num = temp[rule.room.player_count_option];
        }
        else if (this.gameId == GAME_TYPE.ZJH || this.gameId == GAME_TYPE.NN)
        {
            var temp = [6,8]
            this.num = temp[rule.room.player_count_option];
        }
        else if (this.gameId == GAME_TYPE.ZGCP)
        {
            var temp = [3,2]
            this.num = temp[rule.room.player_count_option];
        }
        this.node.getChildByName("label_num").getComponent(cc.Label).string = this.num.toString()
    }

    //获取id
    getId() {
        return this.templateId
    }

    btn_confirm()
    {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(UnionUI_Spread_Detail, 10, () => {
            UIManager.getInstance().getUI(UnionUI_Spread_Detail).getComponent("UnionUI_Spread_Detail").setInfo(this.info, this._playerId);
            });
      
        // MessageManager.getInstance().messageSend(Proto.C2S_CONFIG_CLUB_TEMPLATE_COMMISSION.MsgID.ID, {clubId:clubData.curSelectClubId,conf: conf});

    }

    btn_reset()
    {
        AudioManager.getInstance().playSFX("button_click");
        var clubData = GameDataManager.getInstance().clubData
        MessageManager.getInstance().messageSend(Proto.C2S_RESET_CLUB_TEMPLATE_COMMISSION.MsgID.ID, {clubId:clubData.curSelectClubId,templateId: this.templateId, partnerId: this._playerId});
        
    }


}
