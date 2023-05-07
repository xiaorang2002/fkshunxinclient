import { GameManager } from './../../../GameManager';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { BaseUI, UIClass } from "../../../../framework/UI/BaseUI";
import * as GameConstValue from "../../../data/GameConstValue";
import { AudioManager } from '../../../../framework/Manager/AudioManager';
import { UIManager } from '../../../../framework/Manager/UIManager';
import * as Proto from "../../../../proto/proto-min";

const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Score extends BaseUI {
    protected static className = "UnionUI_Score";
    public static getUrl(): string {
        return GameConstValue.ConstValue.UI_UNION + this.className;
    }

    private memberInfo = null
    private curType = 1
    private myScore = 0
    private targetScore = 0

    @property(cc.Label)
    labelScore: cc.Label = null;

    @property(cc.Label)
    labelTitle: cc.Label = null;

    initView(type, info) { // 1加分 2减分
        this.curType = type
        this.memberInfo = info
        this.myScore = GameDataManager.getInstance().clubData.playerScore
        this.targetScore = info.money/100.0
        this.labelScore.string = ""
        if (type == 1)
            this.labelTitle.string = "增加积分"
        else
            this.labelTitle.string = "减少积分"
    }


    btn_close() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().closeUI(UnionUI_Score);

    }

    btn_confirm()
    {
        AudioManager.getInstance().playSFX("button_click");
        var clubData = GameDataManager.getInstance().clubData;
        var myId = GameDataManager.getInstance().userInfoData.userId
        if (this.labelScore.string == "")
        {
            GameManager.getInstance().openWeakTipsUI("请输入分数")
            return
        }   
        var editScore = parseFloat(this.labelScore.string) 
        if (isNaN(editScore)){
            this.labelScore.string = "0"
            GameManager.getInstance().openWeakTipsUI("只能输入数字")
            return
        }
        if (this.curType == 1 && editScore > this.myScore)
        {
            GameManager.getInstance().openWeakTipsUI("增加的积分不能超过自己的总积分")
            this.labelScore.string = this.myScore.toString()
            return
        }
        if (this.curType == 2 && editScore > this.targetScore)
        {
            GameManager.getInstance().openWeakTipsUI("减少的积分不能超过对方的总积分")
            this.labelScore.string = this.targetScore.toString()
            return
        }
        if (editScore == 0)
        {
            GameManager.getInstance().openWeakTipsUI("请输入分数")
            return

        }
        if (this.labelScore.string.indexOf(".") >= 0)
        {
            var y = this.labelScore.string.indexOf(".") + 1;//获取小数点的位置
            var count = this.labelScore.string.length - y;//获取小数点后的个数
            if (count > 2)
            {
                GameManager.getInstance().openWeakTipsUI("输入的分数不能超过2位小数")
                return
            }
        }
        var targetId = this.memberInfo.guid
        var sourceId = myId
        if (this.curType == 2)
        {
            targetId = myId
            sourceId = this.memberInfo.guid
        }
        var msg = {
            sourceType: 0,
            sourceId:sourceId,
            targetType:0,
            targetId:targetId,
            money: editScore * 100,
            extData: clubData.curSelectClubId,
        }
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_TRANSFER_MONEY_REQ.MsgID.ID, msg)
        UIManager.getInstance().closeUI(UnionUI_Score);
    }

    private button_num(event, customEventData) {
        AudioManager.getInstance().playSFX("button_click");
        let input = parseInt(customEventData);
        if (input === 10 ) {
            if (this.labelScore.string.length > 0)
                this.labelScore.string = this.labelScore.string.substr(0, this.labelScore.string.length - 1);
        }
        else if (input === 11)
            this.labelScore.string = this.labelScore.string + ".";
        else
            this.labelScore.string = this.labelScore.string + customEventData;
        this.labelTitle.node.active = this.labelScore.string.length == 0
        
    }

}