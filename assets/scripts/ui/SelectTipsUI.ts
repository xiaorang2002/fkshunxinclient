import { GameManager } from './../GameManager';
import { BaseUI } from "../../framework/UI/BaseUI";
import * as GameConstValue from "../data/GameConstValue";
import { LogWrap } from "../../framework/Utils/LogWrap";
import { UIManager } from "../../framework/Manager/UIManager";
import { AudioManager } from "../../framework/Manager/AudioManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class SelectTipsUI extends BaseUI {

    protected static className = "SelectTipsUI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_SYSTEM_DIR + this.className;
    }

    @property(cc.Label)
    labelConnect: cc.Label = null;
    @property(cc.EditBox)
    edit: cc.EditBox = null;
    private surefun: Function = null;
    private cancelfun: Function = null;

    onLoad() {
        super.onLoad()
    }

    initUI(text: string, surefun: Function, cancelfun: Function) {
        //初始化位置
        this.surefun = surefun;
        this.cancelfun = cancelfun;
        this.labelConnect.string = text;
    }

    initEdit(text: string)
    {
        this.edit.node.active = true
        this.edit.placeholder = text
    }

    getEditText()
    {
        return this.edit.string
    }

    button_sure() {
        AudioManager.getInstance().playSFX("button_click");
        if (this.edit.node.active && this.edit.string == "")
        {
            GameManager.getInstance().openWeakTipsUI("昵称不能为空");
            return
        }
        if (this.surefun === null)
            return;

        this.surefun();
        UIManager.getInstance().closeUI(SelectTipsUI);
    }

    button_cancel() {
        AudioManager.getInstance().playSFX("button_click");
        if (this.cancelfun === null)
        {
            UIManager.getInstance().closeUI(SelectTipsUI);
            return;
        }
        this.cancelfun();
        UIManager.getInstance().closeUI(SelectTipsUI);

    }
}
