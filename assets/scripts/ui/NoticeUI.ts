import { UIManager } from './../../framework/Manager/UIManager';
import { AudioManager } from './../../framework/Manager/AudioManager';
import { GAME_TYPE } from './../data/GameConstValue';
import * as GameConstValue from "../data/GameConstValue";
import { BaseUI } from "../../framework/UI/BaseUI";

const { ccclass, property } = cc._decorator;

@ccclass
export class NoticeUI extends BaseUI {

    protected static className = "NoticeUI";
    public static getUrl(): string {
        return GameConstValue.ConstValue.UI_SYSTEM_DIR + this.className;
    }

    private curSelectPage = -1

    start()
    {
        this.updateButtonSelect(0)
        this.updateContent()
    }

    private updateButtonSelect(type){
        if (this.curSelectPage >= 0)
        {
            this.node.getChildByName("btn_page" + this.curSelectPage).getChildByName("select_bg").active = false
            this.node.getChildByName("btn_page" + this.curSelectPage).getChildByName("select_bg_unselect").active = true
        }
        this.curSelectPage = type
        this.node.getChildByName("btn_page" + type).getChildByName("select_bg").active = true
        this.node.getChildByName("btn_page" + type).getChildByName("select_bg_unselect").active = false

    }

    private updateContent()
    {
       this.node.getChildByName("jd_content").active = this.curSelectPage == 0
       this.node.getChildByName("fcm_content").active = this.curSelectPage == 2
       this.node.getChildByName("wwg_content").active = this.curSelectPage == 1

    }


    btn_game_select(event, CustomEvent)
    {
        var page = parseInt(CustomEvent)
        if (this.curSelectPage == page)
            return
        this.updateButtonSelect(page)
        this.updateContent()
    }


    btn_close() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().closeUI(NoticeUI);
    }

}
