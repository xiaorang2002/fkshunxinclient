import { UIManager } from './../../framework/Manager/UIManager';
import { AudioManager } from './../../framework/Manager/AudioManager';
import { ConstValue } from './../data/GameConstValue';
import { BaseUI } from '../../framework/UI/BaseUI';


const { ccclass, property } = cc._decorator;

@ccclass
export class KefuOnlineUI extends BaseUI {

    protected static className = "KefuOnlineUI";
    public static getUrl(): string {
        return ConstValue.UI_SYSTEM_DIR + this.className;
    }

    start()
    {
    }


    
    button_close() {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().closeUI(KefuOnlineUI);
    }

}
