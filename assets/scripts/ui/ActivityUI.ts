import { GameDataManager } from './../../framework/Manager/GameDataManager';
import { ConstValue } from './../data/GameConstValue';
import { HttpManager } from './../../framework/Manager/HttpManager';
import { BaseUI } from "../../framework/UI/BaseUI";
import * as GameConstValue from "../data/GameConstValue";
import { UIManager } from "../../framework/Manager/UIManager";
import { SdkManager } from "../../framework/Utils/SdkManager";
import { AudioManager } from "../../framework/Manager/AudioManager";
import { GameManager } from '../GameManager';
import { Utils } from '../../framework/Utils/Utils';

const { ccclass, property } = cc._decorator;

@ccclass
export class ActivityUI extends BaseUI {

    protected static className = "ActivityUI";

    private para = null
    private localStore = null
    @property(cc.Sprite)
    public ewm:cc.Sprite = null
    onLoad() {

    }

    start() {
      //  http://wwv.ijrme.com/static/themes/bianpingshushi/images/IOS.png

      //Utils.loadTextureFromNet(this.ewm, "https://oss-huadong1.oss-cn-hangzhou.aliyuncs.com/appurl/logos201805/202209/no_register1/2022_09_19_15_30_0698a5v.png");
    }

    public initPara(info, oClubStore = null) {
        this.para = info;
        this.localStore = oClubStore
    }

    public button_kefu()
    {
        AudioManager.getInstance().playSFX("button_click");
        var onlineKefuUrl = GameDataManager.getInstance().systemData.onlineKefuUrl
        if (onlineKefuUrl.length != 0)
        {
            cc.sys.openURL(onlineKefuUrl)
        }
        else
        {
            GameManager.getInstance().openWeakTipsUI("暂无在线客服");
        }
    }

    private button_close() {
        UIManager.getInstance().closeUI(ActivityUI);
    }
}
