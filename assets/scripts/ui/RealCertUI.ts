import { HallUI } from './HallUI';
import { GameDataManager } from './../../framework/Manager/GameDataManager';
import { StringData } from './../data/StringData';
import { ConstValue } from './../data/GameConstValue';
import { MessageManager } from './../../framework/Manager/MessageManager';
import { ListenerManager } from './../../framework/Manager/ListenerManager';
import { GameManager } from './../GameManager';
import { BaseUI } from "../../framework/UI/BaseUI";
import * as GameConstValue from "../data/GameConstValue";
import { LogWrap } from "../../framework/Utils/LogWrap";
import { UIManager } from "../../framework/Manager/UIManager";
import { AudioManager } from "../../framework/Manager/AudioManager";
import * as Proto from "../../proto/proto-min";

const { ccclass, property } = cc._decorator;

@ccclass
export class RealCertUI extends BaseUI {

    protected static className = "RealCertUI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_SYSTEM_DIR + this.className;
    }

    @property(cc.EditBox)
    nameEdit: cc.EditBox = null;

    @property(cc.EditBox)
    certEdit: cc.EditBox = null;


    start() {
        ListenerManager.getInstance().add(Proto.SC_PERSONAL_ID_BIND.MsgID.ID, this, this.onBindMsgRec);
    }

  
    private onBindMsgRec(msg)
    {
        GameManager.getInstance().openWeakTipsUI("认证成功");
        GameDataManager.getInstance().userInfoData.isRealCert = true
        if(UIManager.getInstance().getUI(HallUI))
            UIManager.getInstance().getUI(HallUI).getComponent("HallUI").initData()
        MessageManager.getInstance().disposeMsg();
        UIManager.getInstance().closeUI(RealCertUI);
    }

    checkStr(name, num)
    {
        var regName =/^[\u4e00-\u9fa5]{2,4}$/; 
        if(!regName.test(name)){ 
            GameManager.getInstance().openWeakTipsUI("真实姓名有误"); 
            return false; 
        }
        var regIdNo = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/; 
        if(!regIdNo.test(num)){ 
            GameManager.getInstance().openWeakTipsUI("请填写正确的身份证号"); 
            return false; 
        }
        return true;
    }

    button_commit() // 获取验证码入口
    {
        var name = this.nameEdit.string
        var num = this.certEdit.string
        if (this.checkStr(name, num))
            MessageManager.getInstance().messageSend(Proto.CS_PERSONAL_ID_BIND.MsgID.ID, {name: name, id:num});
    }

    btn_close()
    {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().closeUI(RealCertUI);
    }
}
