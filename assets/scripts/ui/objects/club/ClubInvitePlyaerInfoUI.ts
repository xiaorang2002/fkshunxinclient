import { GameManager } from './../../../GameManager';
import { BaseUI, UIClass } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { MessageManager } from "../../../../framework/Manager/MessageManager";
import * as Proto from "../../../../proto/proto-min";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import { ListenerManager } from "../../../../framework/Manager/ListenerManager";
import { Utils } from "../../../../framework/Utils/Utils";
import { CLUB_POWER } from "../../../data/club/ClubData";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { AudioManager } from "../../../../framework/Manager/AudioManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class ClubInvitePlyaerInfoUI extends BaseUI {

    protected static className = "ClubInvitePlyaerInfoUI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_CLUB_DIR + this.className;
    }

    @property(cc.Label)
    labelName: cc.Label = null;
    @property(cc.Sprite)
    spHead: cc.Sprite = null;
    @property(cc.Label)
    labelId: cc.Label = null;

    private playerID = 0

    public onPlayerInfoFind(msg) {
        var info = msg.baseInfo
        this.labelName.string = info.nickname;
        Utils.loadTextureFromNet(this.spHead, info.icon);
        this.labelId.string = "ID:" + info.guid;
        this.playerID = info.guid
    }

    //关闭按钮
    private button_close(event) {
        UIManager.getInstance().closeUI(ClubInvitePlyaerInfoUI);
    }

    private button_invite(){
        AudioManager.getInstance().playSFX("button_click");
        var clubData = GameDataManager.getInstance().clubData;
        var type = "invite_join"
        var targetId = clubData.curSelectClubId
        MessageManager.getInstance().messageSend(Proto.C2S_INVITE_JOIN_CLUB.MsgID.ID, {invitee : this.playerID, inviterClub: targetId, inviteType: type});
        UIManager.getInstance().closeUI(ClubInvitePlyaerInfoUI)
    }

    private button_cancel(){
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().closeUI(ClubInvitePlyaerInfoUI);
    }

}