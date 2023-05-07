import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { Utils } from './../../../../framework/Utils/Utils';
import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { AudioManager } from "../../../../framework/Manager/AudioManager";
import * as  Proto from "../../../../proto/proto-min";

const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Table_Blacklist_Item extends cc.Component {

    @property(cc.Sprite)
    spHead: cc.Sprite = null;

    private playerId = 0
    private groupId = 0
    private type = "member_geli"

    public setInfo(info, groupId, type) {
        this.type = type
        this.playerId = info.guid
        this.groupId = groupId
        if(info.icon && info.icon != ""){
            Utils.loadTextureFromNet(this.spHead, info.icon);
        }
        this.node.getChildByName("label_name").getComponent(cc.Label).string = Utils.getShortName(info.nickname);
        this.node.getChildByName("label_id").getComponent(cc.Label).string = info.guid;
    }

    button_del() {
        AudioManager.getInstance().playSFX("button_click")
        if (this.type == "member_geli")
            MessageManager.getInstance().messageSend(Proto.C2S_CLUB_BLOCK_REMOVE_PLAYER_FROM_GROUP.MsgID.ID, {clubId: GameDataManager.getInstance().clubData.curSelectClubId, groupId:this.groupId
                ,guid: this.playerId});
        else
            MessageManager.getInstance().messageSend(Proto.C2S_CLUB_BLOCK_TEAM_REMOVE_TEAM_FROM_GROUP.MsgID.ID, {clubId: GameDataManager.getInstance().clubData.curSelectClubId, groupId:this.groupId
                ,guid: this.playerId});      
        
    }

}
