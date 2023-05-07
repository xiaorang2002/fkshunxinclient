import { BaseUI } from "../../../framework/UI/BaseUI";
import { Utils } from "../../../framework/Utils/Utils";
import { UIManager } from "../../../framework/Manager/UIManager";
import { GameDataManager } from "../../../framework/Manager/GameDataManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class BasePlayerInfoUI extends BaseUI {

    protected static className = "BasePlayerInfoUI";

    @property(cc.Sprite)
    spHead: cc.Sprite = null;
    @property(cc.Label)
    labelName: cc.Label = null;
    @property(cc.Label)
    labelId: cc.Label = null;

    onLoad() {
      
    }

    public updateInfo(headurl?: string, name?: string, id?: string) {
        let head_url = headurl ? headurl : GameDataManager.getInstance().userInfoData.userHead
        if(head_url && head_url != '')
        {
            Utils.loadTextureFromNet(this.spHead, headurl ? headurl : GameDataManager.getInstance().userInfoData.userHead);
        }
        this.labelName.string = Utils.getShortName(name ? name : GameDataManager.getInstance().userInfoData.userName);
        this.labelId.string = "ID:" + (id ? id : GameDataManager.getInstance().userInfoData.userId);
    }

    //详细信息按钮
    private button_userInfo() {
    }
}
