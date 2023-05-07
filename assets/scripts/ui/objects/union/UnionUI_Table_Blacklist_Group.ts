import { ClubKeyboardUI } from './../club/ClubKeyboardUI';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { GameManager } from '../../../GameManager';
import { AudioManager } from "../../../../framework/Manager/AudioManager";
import * as  Proto from "../../../../proto/proto-min";

const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Table_Blacklist_Group extends cc.Component {

    @property(cc.Prefab)
    item: cc.Prefab = null;
    @property(cc.Node)
    nodeListContent: cc.Node = null;


    private nodeList = []
    private spacing = 0
    private groupId = 0
    private type = "member_geli"


    public setInfo(info, type) {
        this.type = type
        this.groupId = info.groupId
        this.updateList(info.players)
    }

    private updateList(dataList)
    {
        this.nodeListContent.removeAllChildren()
        this.nodeList = []
        this.nodeListContent.width = dataList.length * (this.item.data.width);
        if (this.nodeListContent.width < 710)
            this.nodeListContent.width = 710;
        for (let i = 0; i < dataList.length; ++i) {
            var newnode = cc.instantiate(this.item);
            newnode.parent = this.nodeListContent;
            newnode.setPosition(newnode.width * (0.5 + i) + this.spacing * (i + 1), 0);
            var pnode = newnode.getComponent('UnionUI_Table_Blacklist_Item');
            pnode.setInfo(dataList[i], this.groupId, this.type)
            this.nodeList.push(newnode)
        }
    }

    public getGroupId(){
        return this.groupId
    }

    button_del() {
        AudioManager.getInstance().playSFX("button_click")
        if (this.type == "member_geli")
            MessageManager.getInstance().messageSend(Proto.C2S_CLUB_BLOCK_DEL_GROUP.MsgID.ID, {clubId: GameDataManager.getInstance().clubData.curSelectClubId, groupId:this.groupId});
        else
            MessageManager.getInstance().messageSend(Proto.C2S_CLUB_BLOCK_TEAM_DEL_GROUP.MsgID.ID, {clubId: GameDataManager.getInstance().clubData.curSelectClubId, groupId:this.groupId});
        
            // let surefun = () => {
        //     MessageManager.getInstance().messageSend(Proto.C2S_CLUB_BLOCK_DEL_GROUP.MsgID.ID, {clubId: GameDataManager.getInstance().clubData.curSelectClubId, groupId:this.groupId});
        // };
        // let closefun = () => {
            
        // };
        // GameManager.getInstance().openSelectTipsUI("是否确定要删除该组", surefun, closefun);
    }

    button_add()
    {
        AudioManager.getInstance().playSFX("button_click")
        var addType = 4
        if (this.type == "partner_geli")
            var addType = 6
        UIManager.getInstance().openUI(ClubKeyboardUI, 20, () => {
            UIManager.getInstance().getUI(ClubKeyboardUI).getComponent("ClubKeyboardUI").initView(addType, {groupId:this.groupId})
        })
    }

}
