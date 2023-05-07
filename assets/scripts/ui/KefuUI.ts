import { HttpManager } from './../../framework/Manager/HttpManager';
import { GameManager } from './../GameManager';
import { SdkManager } from './../../framework/Utils/SdkManager';
import { GameDataManager } from './../../framework/Manager/GameDataManager';
import { UIManager } from './../../framework/Manager/UIManager';
import { AudioManager } from './../../framework/Manager/AudioManager';
import { ConstValue } from './../data/GameConstValue';
import { BaseUI } from '../../framework/UI/BaseUI';


const { ccclass, property } = cc._decorator;

@ccclass
export class KefuUI extends BaseUI {

    protected static className = "KefuUI";
    public static getUrl(): string {
        return ConstValue.UI_SYSTEM_DIR + this.className;
    }

    @property(cc.EditBox)
    editSuggest: cc.EditBox = null;

    @property(cc.EditBox)
    editAgent: cc.EditBox = null;

    start()
    {
        this.node.getChildByName("label_wx").getComponent(cc.Label).string = "客服微信："+ GameDataManager.getInstance().systemData.kefu
    }


    
    button_close() {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().closeUI(KefuUI);
    }

   /**复制 */
   btn_copy() {
    AudioManager.getInstance().playSFX("button_click");
    SdkManager.getInstance().doNativeCopyClipbordText(GameDataManager.getInstance().systemData.kefu);
    }   


    /**发送按钮 */
    btn_fasong() {
        AudioManager.getInstance().playSFX("button_click");
        var suggestStr = this.editSuggest.string
        var agentStr = this.editAgent.string
        if (agentStr.length == 0)
        {
            GameManager.getInstance().openWeakTipsUI("请输入联系方式后再提交");
            return
        }
        // var content = "反馈内容："+suggestStr + "   联系方式："+agentStr
        this.editSuggest.string = ""
        this.editAgent.string = ""
        var para = {guid:GameDataManager.getInstance().userInfoData.userId, content:suggestStr, wechat:agentStr}
        HttpManager.getInstance().post(ConstValue.FEED_BACK_URL, "", null, JSON.stringify(para),
            (error, ret) => {
                if (ret) {
                    GameManager.getInstance().openWeakTipsUI("提交成功"); 
                }
                else
                {
                    GameManager.getInstance().openWeakTipsUI("提交失败"); 
                }
            });
    }

    btn_online_kefu()
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
}
