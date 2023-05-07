import { BaseUI } from "../../../framework/UI/BaseUI";
import { ListenerType } from "../../data/ListenerType";
import { ListenerManager } from "../../../framework/Manager/ListenerManager";
import { GameDataManager } from "../../../framework/Manager/GameDataManager";
import * as GameConstValue from "../../data/GameConstValue";
import { AudioManager } from "../../../framework/Manager/AudioManager";
import { UIManager } from "../../../framework/Manager/UIManager";
import { Utils } from "../../../framework/Utils/Utils";

const { ccclass, property } = cc._decorator;

@ccclass
export class BaseMoneyInfoUI extends BaseUI {

    protected static className = "BaseMoneyInfoUI";

    @property(cc.Label)
    labelNum: cc.Label = null;

    @property(cc.Integer)
    type: number = 0;

    onLoad() {
        ListenerManager.getInstance().add(ListenerType.RoomCardsChanged, this, this.onMoneyChange);
        ListenerManager.getInstance().add(ListenerType.GoldChanged, this, this.onMoneyChange);
        ListenerManager.getInstance().add(ListenerType.DiamondChanged, this, this.onMoneyChange);

        let userinfo = GameDataManager.getInstance().userInfoData;
        switch (this.type) {
            case GameConstValue.MONEY_TYPE.ROOMCARD:
                if (this.labelNum == null) { return; }
                if (userinfo == null || userinfo.roomCard == null) {
                    return;
                }
                this.labelNum.string = (userinfo.roomCard).toString();
                break;
            case GameConstValue.MONEY_TYPE.GOLD:
                if (this.labelNum == null) { return; }
                if (userinfo == null || userinfo.gold == null) {
                    return;
                }
                this.labelNum.string = Utils.FormatNum(userinfo.gold, 0)
                break;
            case GameConstValue.MONEY_TYPE.DIAMOND:
                if (this.labelNum == null) { return; }
                if (userinfo == null || userinfo.diamond == null) {
                    return;
                }
                this.labelNum.string = Utils.FormatNum(userinfo.diamond, 0)
                break
        }
    }
    private onMoneyChange() {
        let userinfo = GameDataManager.getInstance().userInfoData;
        switch (this.type) {
            case GameConstValue.MONEY_TYPE.ROOMCARD:
                if (this.labelNum == null) { return; }
                if (userinfo == null || userinfo.roomCard == null) {
                    return;
                }
                this.labelNum.string = (userinfo.roomCard).toString();
                break;
            case GameConstValue.MONEY_TYPE.GOLD:
                if (this.labelNum == null) { return; }
                if (userinfo == null || userinfo.gold == null) {
                    return;
                }
                this.labelNum.string = Utils.FormatNum(userinfo.gold, 0)
                break;
            case GameConstValue.MONEY_TYPE.DIAMOND:
                if (this.labelNum == null) { return; }
                if (userinfo == null || userinfo.diamond == null) {
                    return;
                }
                this.labelNum.string = Utils.FormatNum(userinfo.diamond, 0)
                break;
        }
    }

    public updateInfo(value: string) {
        this.labelNum.string = value;
    }

}
