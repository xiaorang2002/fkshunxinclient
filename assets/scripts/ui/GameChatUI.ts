import { MessageManager } from './../../framework/Manager/MessageManager';
import { GAME_TYPE } from './../data/GameConstValue';
import { BaseUI } from "../../framework/UI/BaseUI";
import { UIManager } from "../../framework/Manager/UIManager";
import { GameDataManager } from "../../framework/Manager/GameDataManager";
import { StringData } from "../data/StringData";
import { AudioManager } from "../../framework/Manager/AudioManager";
import { GameManager } from "../GameManager";
import * as Proto from "../../proto/proto-min";

const { ccclass, property } = cc._decorator;

@ccclass
export class GameChatUI extends BaseUI {
    protected static className = "GameChatUI";

    @property(cc.Node)
    nodeCahtContent: cc.Node = null;
    @property(cc.EditBox)
    ebChat: cc.EditBox = null;

    public static _VoiceCDTime = 0;

    onLoad() {
       
    }


    start() {
        var gameType = ""
        if (GameDataManager.getInstance().curGameType == GAME_TYPE.PDK || GameDataManager.getInstance().curGameType == GAME_TYPE.LRPDK
        || GameDataManager.getInstance().curGameType == GAME_TYPE.DDZ || GameDataManager.getInstance().curGameType == GAME_TYPE.SCPDK)
            gameType = "ddz"
        else
            gameType = "mj"
        if (gameType == "mj")
        {
            var chatId = 9000;
            var length = 10
        }
        else
        {
            var length = 9
            var chatId = 9100;
        }
        //初始化语音内容
        for (var i = 1; i <= length; ++i) {
            this.nodeCahtContent.getChildByName("chat_" + (i-1)).getChildByName("text").getComponent(cc.Label).string = StringData.getString(chatId + i);
            this.nodeCahtContent.getChildByName("chat_" + (i-1)).active = true
        }
        if (GameDataManager.getInstance().curGameType == GAME_TYPE.ZJH || GameDataManager.getInstance().curGameType == GAME_TYPE.NN)
        {
            this.node.getChildByName("menu").getChildByName("text").active = false
        }

    }

    private button_send_emoji(event, customEventData) {
        var emojiId = parseInt(customEventData);
        // 发送emoj
        MessageManager.getInstance().messageSend(Proto.C2SPlayerInteraction.MsgID.ID, {contentIdx: emojiId, type: 0, receiver:0});
        UIManager.getInstance().closeUI(GameChatUI);
    }

    //发送按钮
    private button_send_chat(event, customEventData) {
        var emojiId = parseInt(customEventData) + 1;
        if (Date.now() - GameChatUI._VoiceCDTime < 3000) {
            GameManager.getInstance().openWeakTipsUI(StringData.getString(10069));
            return;
        }
        GameChatUI._VoiceCDTime = Date.now();
        MessageManager.getInstance().messageSend(Proto.C2SPlayerInteraction.MsgID.ID, {contentIdx: emojiId, type: 1, receiver:0});
        UIManager.getInstance().closeUI(GameChatUI);
    }

    private button_close() {
        UIManager.getInstance().closeUI(GameChatUI);
    }
}