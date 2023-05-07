import { BaseUI } from "../../framework/UI/BaseUI";
import * as GameConstValue from "../data/GameConstValue";
import { LogWrap } from "../../framework/Utils/LogWrap";
import { UIManager } from "../../framework/Manager/UIManager";
import { AudioManager } from "../../framework/Manager/AudioManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class StrongTipsUI extends BaseUI {

    protected static className = "StrongTipsUI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_SYSTEM_DIR + this.className;
    }

    @property(cc.Label)
    labelConnect: cc.Label = null;
    private surefun: Function = null;

    onLoad() {
        super.onLoad()
    }

    initUI(text: string, surefun: Function, title) {
        //初始化位置
        this.surefun = surefun;
        this.labelConnect.string = text;
       // this.node.getChildByName("title").getComponent(cc.Label).string = title
        if(title != "提 示")
        {
            this.node.getChildByName("label_tips").getComponent(cc.Label).fontSize = 30;
            this.node.getChildByName("label_tips").color = new cc.Color(221, 90, 90)
        }
    }

    button_sure() {
        AudioManager.getInstance().playSFX("button_click");
        if (this.surefun === null)
            return;
        UIManager.getInstance().closeUI(StrongTipsUI);
        this.surefun();
    }
}
