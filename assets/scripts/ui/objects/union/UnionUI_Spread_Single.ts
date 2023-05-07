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
export class UnionUI_Spread_Single extends BaseUI {

    protected static className = "UnionUI_Spread_Single";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_UNION + this.className;
    }

    @property(cc.Prefab)
    item: cc.Prefab = null;

    @property(cc.Node)
    nodeListContent: cc.Node = null;

    private nodeList = []
    private _clubId = 0
    private playerId = 0

    onLoad()
    {
        
    }


    updateView(iClub, playerId)
    {
        var clubData = GameDataManager.getInstance().clubData
        this._clubId = iClub
        this.playerId = playerId
        // var isBigUnion = clubData.isBigBossOfUnion()
        // this.setDevoteType(isBigUnion)
        this.initListen()
        MessageManager.getInstance().messageSend(Proto.C2S_GET_CLUB_TEMPLATE_COMMISSION.MsgID.ID, {clubId: clubData.curSelectClubId, partnerId:playerId});
    }

    private initListen()
    {
        ListenerManager.getInstance().add(Proto.S2C_CONFIG_CLUB_TEMPLATE_COMMISSION.MsgID.ID, this, this.onConfigModifyRec);
        ListenerManager.getInstance().add(Proto.S2C_GET_CLUB_TEMPLATE_COMMISSION.MsgID.ID, this, this.onTemplateScoreConfigRec);
        ListenerManager.getInstance().add(Proto.S2C_RESET_CLUB_TEMPLATE_COMMISSION.MsgID.ID, this, this.onRestRec);
        
        
    }

    private onConfigModifyRec(msg)
    {
        var clubData = GameDataManager.getInstance().clubData
        GameManager.getInstance().openWeakTipsUI("操作成功！！");
        MessageManager.getInstance().messageSend(Proto.C2S_GET_CLUB_TEMPLATE_COMMISSION.MsgID.ID, {clubId: clubData.curSelectClubId, partnerId: this.playerId});
        MessageManager.getInstance().disposeMsg();
    }


    onTemplateScoreConfigRec(msg)
    {
        this.updateList(msg.confs, msg.partnerId)
        MessageManager.getInstance().disposeMsg();
    }

    onRestRec(msg)
    {
        var clubData = GameDataManager.getInstance().clubData
        GameManager.getInstance().openWeakTipsUI("重置成功！！");
        MessageManager.getInstance().messageSend(Proto.C2S_GET_CLUB_TEMPLATE_COMMISSION.MsgID.ID, {clubId: clubData.curSelectClubId, partnerId: this.playerId});
        MessageManager.getInstance().disposeMsg();
    }

    // private setDevoteType(isBigUnion)
    // {
    //     if (!isBigUnion)
    //     {
    //         this.node.getChildByName("label_title").getComponent(cc.Label).string = "合伙人贡献值"
    //     }
    // }
    

    private updateList(dataList, partnerId)
    {
        var clubData = GameDataManager.getInstance().clubData
        this.nodeListContent.removeAllChildren()
        this.nodeList = []
        this.nodeListContent.height = dataList.length * (this.item.data.height);
        if (this.nodeListContent.height < 404)
            this.nodeListContent.height = 404;
        for (let i = 0; i < dataList.length; ++i) {
            var templateInfo = clubData.getTemplateInfoById(dataList[i].templateId)
            if (templateInfo == null)
            {
                dataList[i].gameId = 0
                continue
            }
            dataList[i].gameId = templateInfo.template.gameId
        }
        var finishList = this.sortByGameId(dataList)
        for (let j =0; j<finishList.length; ++j)
        {
            if (finishList[j].gameId != 0)
            {
                var newnode = cc.instantiate(this.item);
                newnode.parent = this.nodeListContent;
                var pnode = newnode.getComponent('UnionUI_Spread_Single_Item');
                pnode.setInfo(finishList[j])
                this.nodeList.push(newnode)
            }
        }
    }

    sortByGameId(targetList){
        var tempList = []
        tempList = targetList.sort(function (a, b) { return a.templateId - b.templateId})
        tempList = tempList.sort(function (a, b) { return a.gameId - b.gameId})
        return tempList
    }



    button_close() {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().closeUI(UnionUI_Spread_Single);
    }

}
