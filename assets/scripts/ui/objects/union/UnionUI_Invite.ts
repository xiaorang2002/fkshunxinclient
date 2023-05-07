import { ClubKeyboardUI } from './../club/ClubKeyboardUI';
import { ClubInvitePlyaerInfoUI } from './../club/ClubInvitePlyaerInfoUI';
import { ThirdSelectUI } from './../../ThirdSelectUI';
import { SdkManager } from './../../../../framework/Utils/SdkManager';
import { ListenerManager } from './../../../../framework/Manager/ListenerManager';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { GameManager } from './../../../GameManager';
import { BaseUI, UIClass } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { AudioManager } from "../../../../framework/Manager/AudioManager";
import * as  Proto from "../../../../proto/proto-min";
import { CLUB_POWER } from "../../../data/club/ClubData";

const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Invite extends BaseUI {

    protected static className = "UnionUI_Invite";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_UNION + this.className;
    }

    start()
    {
        ListenerManager.getInstance().add(Proto.S2C_INVITE_JOIN_CLUB.MsgID.ID, this, this.onInviteResponse);
        ListenerManager.getInstance().add(Proto.SC_SearchPlayer.MsgID.ID, this, this.onPlayerInfoFind);  
       
    }

    onInviteResponse()
    {
        GameManager.getInstance().openWeakTipsUI("邀请成功！");
        MessageManager.getInstance().disposeMsg();
    }

    onPlayerInfoFind(msg)
    {
        UIManager.getInstance().openUI(ClubInvitePlyaerInfoUI, 21, () => {
            UIManager.getInstance().getUI(ClubInvitePlyaerInfoUI).getComponent("ClubInvitePlyaerInfoUI").onPlayerInfoFind(msg);
        })
        MessageManager.getInstance().disposeMsg();
    }

    button_close() {
        UIManager.getInstance().closeUI(UnionUI_Invite);
    }

    button_wx() {
        AudioManager.getInstance().playSFX("button_click")
        let storeUrl = cc.sys.localStorage.getItem("shareClubUrl");
        var clubData = GameDataManager.getInstance().clubData;
        if (!storeUrl || storeUrl == undefined)
        {
            var oMsg = {}
            for (var index = 0; index < clubData.allMyClubList.length; ++index) 
                oMsg[clubData.allMyClubList[index].cid] = 0
        }
        else
        {
            var oMsg = JSON.parse(storeUrl) as {}
        }
        if (oMsg[clubData.curSelectClubId] != 0)
        {
            SdkManager.getInstance().doNativeCopyClipbordText(oMsg[clubData.curSelectClubId], "复制分享链接成功，发送给好友即可");

        }
        else
        {
            var type = "joinclub"
            var id = GameDataManager.getInstance().userInfoData.userId
            var para = {type : type, club: clubData.curSelectClubId, guid: id}
            UIManager.getInstance().openUI(ThirdSelectUI, 98, () => {
                UIManager.getInstance().getUI(ThirdSelectUI).getComponent("ThirdSelectUI").initPara(para, oMsg);
            })
        }
        
    }

    // button_player() {
    //     AudioManager.getInstance().playSFX("button_click")
    //     var playerID = parseInt(this.edite.string)
    //     if (isNaN(playerID)){
    //         GameManager.getInstance().openWeakTipsUI("请输入正确玩家id");
    //         return
    //     }
    //     MessageManager.getInstance().messageSend(Proto.CS_SearchPlayer.MsgID.ID, {guid:playerID});
    // }

    button_keyboard() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(ClubKeyboardUI, 20, () => {
            UIManager.getInstance().getUI(ClubKeyboardUI).getComponent("ClubKeyboardUI").initView(3, null)
        })
    }


}
