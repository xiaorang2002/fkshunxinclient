import { BaseUI } from "../../framework/UI/BaseUI";
import * as GameConstValue from "../data/GameConstValue";
import { LogWrap } from "../../framework/Utils/LogWrap";
import { UIManager } from "../../framework/Manager/UIManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class WeakTipsUI extends BaseUI {

    protected static className = "WeakTipsUI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_SYSTEM_DIR + this.className;
    }

    @property(cc.Label)
    labelConnect: cc.Label = null;

    onLoad() {

    }

    initUI(text: string) {
        //初始化位置
        var action_1 = cc.delayTime(2);
        var action_2 = cc.callFunc(function () {
            UIManager.getInstance().closeUI(WeakTipsUI);
        }.bind(this));
        this.node.runAction(cc.sequence(action_1, action_2));
        this.labelConnect.string = text;
    }
}
