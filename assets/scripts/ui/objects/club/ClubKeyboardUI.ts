import { ClubMemberUI } from './ClubMemberUI';
import { ClubTableInfoUI } from './ClubTableInfoUI';
import { GameManager } from './../../../GameManager';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { BaseUI, UIClass } from "../../../../framework/UI/BaseUI";
import * as GameConstValue from "../../../data/GameConstValue";
import { AudioManager } from '../../../../framework/Manager/AudioManager';
import { UIManager } from '../../../../framework/Manager/UIManager';
import * as Proto from "../../../../proto/proto-min";

const { ccclass, property } = cc._decorator;

@ccclass
export class ClubKeyboardUI extends BaseUI {
    protected static className = "ClubKeyboardUI";
    public static getUrl(): string {
        return GameConstValue.ConstValue.UI_CLUB_DIR + this.className;
    }

    @property(cc.Label)
    labelTitle: cc.Label = null;

@property(cc.Label)
    labelContent: cc.Label = null;

    private curType = 0
    private extraData = null

    start() {

    }

    initView(type, extraData) { // 1 成员搜索
        this.curType = type
        this.extraData = extraData
        if (type == 1)
            this.labelTitle.string = "请输入搜索ID"
        else if (type == 2)
            this.labelTitle.string = "请输入警戒值"
        else if (type == 3)
            this.labelTitle.string = "请输入玩家ID"
        else if (type == 4)
            this.labelTitle.string = "请输入玩家ID"
        else if (type == 5)
            this.labelTitle.string = "请输入房号ID"
    }

    private checkSearchInput() {
        var id = parseFloat(this.labelContent.string)
        if (this.labelContent.string == "") {
            GameManager.getInstance().openWeakTipsUI("搜索ID不能为空");
            return false
        }
        else if (isNaN(id))
        {
            GameManager.getInstance().openWeakTipsUI("请输入数字ID");
            return false
        }
        else if (this.labelContent.string.length < 4)
        {
            GameManager.getInstance().openWeakTipsUI("至少输入4位ID用于搜索");
            return false
        }
        else
            return true
    }

    private checkJinJieInput() {
        var id = parseFloat(this.labelContent.string)
        if (this.labelContent.string == "") {
            GameManager.getInstance().openWeakTipsUI("不能为空");
            return false
        }
        else if (isNaN(id))
        {
            GameManager.getInstance().openWeakTipsUI("请输入数字");
            return false
        }
        else
            return true
    }

    btn_close() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().closeUI(ClubKeyboardUI);

    }

    btn_confirm()
    {
        AudioManager.getInstance().playSFX("button_click");
        var clubData = GameDataManager.getInstance().clubData;
        var myId = GameDataManager.getInstance().userInfoData.userId
        if (this.curType == 1 && this.checkSearchInput())
        {
                MessageManager.getInstance().messageSend(Proto.CS_SEARCH_CLUB_PLAYER.MsgID.ID, {
                guidPattern: this.labelContent.string,
                clubId: clubData.curSelectClubId,
                partner: myId,
            })
            if (UIManager.getInstance().getUI(ClubMemberUI))
            {
                UIManager.getInstance().getUI(ClubMemberUI).getComponent("ClubMemberUI").setSearchPlayerId(this.labelContent.string)
            }
        }
        else if (this.curType == 2 && this.checkJinJieInput())
        {
            MessageManager.getInstance().messageSend(Proto.C2S_CLUB_EDIT_TEAM_CONFIG.MsgID.ID, {
                clubId: clubData.curSelectClubId,
                partner: this.extraData.partnerId,
                conf: JSON.stringify({credit:parseInt(this.labelContent.string)*100})
            })
        }
        else if (this.curType == 3)
        {
            var playerID = parseInt(this.labelContent.string)
            if (isNaN(playerID)){
                GameManager.getInstance().openWeakTipsUI("请输入正确玩家ID");
            }
            else
            {
                MessageManager.getInstance().messageSend(Proto.CS_SearchPlayer.MsgID.ID, {guid:playerID});
            }
        }
        else if (this.curType == 4)
        {
            var playerID = parseInt(this.labelContent.string)
            if (isNaN(playerID)){
                GameManager.getInstance().openWeakTipsUI("请输入正确玩家ID");
            }
            else
            {
                MessageManager.getInstance().messageSend(Proto.C2S_CLUB_BLOCK_ADD_PLAYER_TO_GROUP.MsgID.ID, {clubId: GameDataManager.getInstance().clubData.curSelectClubId, 
                    groupId:this.extraData.groupId,guid: playerID});
            }
        }
        else if (this.curType == 5)
        {
            var id = parseFloat(this.labelContent.string)
            var find = false
            if (isNaN(id))
            {
                GameManager.getInstance().openWeakTipsUI("请输入正确的房间ID");
            }
            else{
                for (let i = 0; i < clubData.clubRoomList.length; ++i) {
                    var roomInfo = clubData.clubRoomList[i]
                    if (roomInfo.tableId == id)
                    {
                        let _roominfo = roomInfo
                        find = true
                        UIManager.getInstance().openUI(ClubTableInfoUI, 1, () => {
                            UIManager.getInstance().getUI(ClubTableInfoUI).getComponent("ClubTableInfoUI").initUI(_roominfo)});
                    }
                }
            }
            if (!find)
            {
                GameManager.getInstance().openWeakTipsUI("未找到该房间，请输入正确的房间ID");
            }
        }
        else if (this.curType == 6)
        {
            var playerID = parseInt(this.labelContent.string)
            if (isNaN(playerID)){
                GameManager.getInstance().openWeakTipsUI("请输入正确组长ID");
            }
            else
            {
                MessageManager.getInstance().messageSend(Proto.C2S_CLUB_BLOCK_TEAM_ADD_TEAM_TO_GROUP.MsgID.ID, {clubId: GameDataManager.getInstance().clubData.curSelectClubId, 
                    groupId:this.extraData.groupId,guid: playerID});
            }
        }
        UIManager.getInstance().closeUI(ClubKeyboardUI);
    }

    private button_num(event, customEventData) {
        AudioManager.getInstance().playSFX("button_click");
        let input = parseInt(customEventData);
        if (input === 10) {
            if (this.labelContent.string.length > 0)
                this.labelContent.string = this.labelContent.string.substr(0, this.labelContent.string.length - 1);
        }
        else if (input === 11)
            this.labelContent.string = "";
        else
            this.labelContent.string = parseFloat(this.labelContent.string + customEventData).toString();
        if (this.labelContent.string == "")
            this.labelContent.string = ""
        this.labelTitle.node.active = this.labelContent.string.length == 0
    }

}