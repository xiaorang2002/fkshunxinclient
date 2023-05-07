import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { MessageManager } from './../../../../framework/Manager/MessageManager';
import infoGameUI from "../info/infoGameUI";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { GameManager } from "../../../../scripts/GameManager";
import * as Proto from "../../../../proto/proto-min";

const { ccclass, property } = cc._decorator;

@ccclass
export class emoteInfoItemUI extends cc.Component {

    @property(cc.Label)
    lable_gold: cc.Label = null;
    @property(cc.Sprite)
    sprite_emote: cc.Sprite = null;
    @property(cc.Node)
    btn_sp: cc.Node = null;

    private itemType = null;
    private targetID = 0;

    setPrice(price) {
        this.lable_gold.string = price.toString();
    }

    setSpriteIndex(iIndex, spriteFrame: cc.SpriteFrame) {
        this.itemType = iIndex;
        this.sprite_emote.spriteFrame = spriteFrame;
    }

    setGray() {
        this.getComponent(cc.Button).interactable = false;
    }

    setPlayerChairId(ChariId) {
        this.targetID = ChariId;
    }

    //选中按钮
    select_button(event) {
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
        if (!gameData)
            return
        var oRule = gameData.gameinfo.rule
        if (oRule.option.block_hu_dong)
        {
            GameManager.getInstance().openWeakTipsUI("本局禁止互动，详情请联系群主");
            return
        }

        if (infoGameUI.actionState) {
            GameManager.getInstance().openWeakTipsUI("操作过于频繁请稍后再试");
            UIManager.getInstance().closeUI(infoGameUI);
            return;
        }
        MessageManager.getInstance().messageSend(Proto.C2SPlayerInteraction.MsgID.ID, { contentIdx: this.itemType+1, type: 2, receiver: this.targetID });
        UIManager.getInstance().closeUI(infoGameUI);
    }

}
