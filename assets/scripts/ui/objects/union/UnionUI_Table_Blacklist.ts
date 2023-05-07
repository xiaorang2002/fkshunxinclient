import { ListenerManager } from './../../../../framework/Manager/ListenerManager';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { GameManager } from '../../../GameManager';
import { BaseUI, UIClass } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { AudioManager } from "../../../../framework/Manager/AudioManager";
import * as  Proto from "../../../../proto/proto-min";

const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Table_Blacklist extends BaseUI {

    protected static className = "UnionUI_Table_Blacklist";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_UNION + this.className;
    }

    @property(cc.Prefab)
    item: cc.Prefab = null;
    @property(cc.Node)
    nodeListContent: cc.Node = null;

    private nodeList = []
    private spacing = 0

    start()
    {
        this.initListen()
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_BLOCK_PULL_GROUPS.MsgID.ID, {clubId: GameDataManager.getInstance().clubData.curSelectClubId});

    }

    private initListen()
    {
        ListenerManager.getInstance().add(Proto.S2C_CLUB_BLOCK_PULL_GROUPS.MsgID.ID, this, this.onGroupListRec);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_BLOCK_NEW_GROUP.MsgID.ID, this, this.onGroupChanged);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_BLOCK_DEL_GROUP.MsgID.ID, this, this.onGroupChanged);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_BLOCK_ADD_PLAYER_TO_GROUP.MsgID.ID, this, this.onPlayerChanged);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_BLOCK_REMOVE_PLAYER_FROM_GROUP.MsgID.ID, this, this.onPlayerChanged);
        
    }

    private onGroupChanged(msg)
    {
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_BLOCK_PULL_GROUPS.MsgID.ID, {clubId: GameDataManager.getInstance().clubData.curSelectClubId});
        MessageManager.getInstance().disposeMsg();
    }

    private onPlayerChanged(msg)
    {
        GameManager.getInstance().openWeakTipsUI("操作成功！！");
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_BLOCK_PULL_GROUPS.MsgID.ID, {clubId: GameDataManager.getInstance().clubData.curSelectClubId});
        MessageManager.getInstance().disposeMsg();
    }

    private onGroupListRec(msg)
    {
        this.updateList(msg.groups) 
        MessageManager.getInstance().disposeMsg();
    }

    private onConfigModifyRec(msg)
    {
        GameManager.getInstance().openWeakTipsUI("操作成功！！");
        MessageManager.getInstance().disposeMsg();
    }


    private updateList(dataList)
    {
        this.nodeListContent.removeAllChildren()
        this.nodeList = []
        this.nodeListContent.height = dataList.length * 160;
        if (this.nodeListContent.height < 366)
            this.nodeListContent.height = 366;
        for (let i = 0; i < dataList.length; ++i) {
            var newnode = cc.instantiate(this.item);
            newnode.parent = this.nodeListContent;
            newnode.setPosition(0, -newnode.height * (0.5 + i) - this.spacing * (i + 1));
            var pnode = newnode.getComponent('UnionUI_Table_Blacklist_Group');
            let inner = newnode.getChildByName("scroll").getComponent("NestableScrollView_Inner");
            this.node.getChildByName("scrollView").getComponent("NestableScrollView_Outer").addItem(inner);
            pnode.setInfo(dataList[i])
            this.nodeList.push(newnode)
        }
    }


    button_close() {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().closeUI(UnionUI_Table_Blacklist);
    }

    button_add()
    {
        AudioManager.getInstance().playSFX("button_click")
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_BLOCK_NEW_GROUP.MsgID.ID, {clubId: GameDataManager.getInstance().clubData.curSelectClubId});
    }

}
