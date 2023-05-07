import { MessageManager } from './../../framework/Manager/MessageManager';
import { AudioManager } from './../../framework/Manager/AudioManager';
import { BaseUI } from "../../framework/UI/BaseUI";
import * as GameConstValue from "../data/GameConstValue";
import * as Proto from "../../proto/proto-min"



const { ccclass, property } = cc._decorator;

@ccclass
export default class TuoGuanUI extends BaseUI {

    protected static className = "TuoGuanUI";

    onLoad() {
      
    }
    
    public static getUrl(): string {
        return GameConstValue.ConstValue.UI_SYSTEM_DIR + this.className;
    }
    // 取消托管
    private btn_cancel_tg()
    {
        AudioManager.getInstance().playSFX("button_click")
        MessageManager.getInstance().messageSend(Proto.CS_Trustee.MsgID.ID, {isTrustee: false});

    }
}