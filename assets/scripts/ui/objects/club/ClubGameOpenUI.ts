import { GAME_NAME } from './../../../data/GameConstValue';
import { GameManager } from './../../../GameManager';
import { ListenerManager } from './../../../../framework/Manager/ListenerManager';
import { PreferentData } from './../../../data/PreferentData';
import { Utils } from './../../../../framework/Utils/Utils';
import { BaseUI, UIClass } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { MessageManager } from "../../../../framework/Manager/MessageManager";
import * as Proto from "../../../../proto/proto-min";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { AudioManager } from "../../../../framework/Manager/AudioManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class ClubGameOpenUI extends BaseUI {

    protected static className = "ClubGameOpenUI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_CLUB_DIR + this.className;
    }

    @property(cc.Prefab)
    gameItemPrefab: cc.Prefab = null;
    @property(cc.Prefab)
    templateItemPrefab: cc.Prefab = null;
    @property(cc.Node)
    gameListContent: cc.Node = null;
    @property(cc.Node)
    templateListContent: cc.Node = null;


    private gameNodeList = [];
    private templateNodeList = [];
    private gameTemplateData = new Map()
    private templateOpenData = new Map()
    private curSelectGameIdx = -1

    start() {
        var clubData = GameDataManager.getInstance().clubData
        ListenerManager.getInstance().add(Proto.SC_CLUB_TEAM_TEMPLATE_INFO.MsgID.ID, this, this.onOpenTemplateRec);
        ListenerManager.getInstance().add(Proto.SC_CLUB_CHANGE_TEAM_TEMPLATE.MsgID.ID, this, this.onCommitRec);
        MessageManager.getInstance().messageSend(Proto.CS_CLUB_TEAM_TEMPLATE_INFO.MsgID.ID, {clubId: clubData.curSelectClubId});
    }

    private onCommitRec(msg){
        GameManager.getInstance().openWeakTipsUI("保存成功，重新进入赛事后生效！");
        MessageManager.getInstance().disposeMsg();
    }

    private onOpenTemplateRec(msg){
        this.gameTemplateData.clear()
        this.templateOpenData.clear()
        for (let i = 0; i < msg.tableTemplates.length; ++i) {
            var gameId = msg.tableTemplates[i].template.gameId
            var templateId = msg.tableTemplates[i].template.templateId
            var templateList = this.gameTemplateData.get(gameId)
            var desc = GAME_NAME[gameId]
            if (msg.tableTemplates[i].template.description)
                desc = msg.tableTemplates[i].template.description
            if(templateList)
            {
                templateList.push({templateId: templateId, description: desc, rule: msg.tableTemplates[i].template.rule, gameId: msg.tableTemplates[i].template.gameId})
                this.gameTemplateData.set(gameId, templateList)
            }
            else
                this.gameTemplateData.set(gameId, [{templateId: templateId, description: desc, rule: msg.tableTemplates[i].template.rule, gameId: msg.tableTemplates[i].template.gameId}])
            this.templateOpenData.set(templateId, false)
        }
        for (let i = 0; i < msg.teamTemplateIds.length; ++i)
            this.templateOpenData.set(msg.teamTemplateIds[i], true)
        this.updateGameList()
        MessageManager.getInstance().disposeMsg();
    }

    updateGameList() {
        if (this.gameTemplateData.size == 0)
            return
        this.gameListContent.removeAllChildren()
        this.gameNodeList = []
        this.gameListContent.height = 85 * (this.gameTemplateData.size +1);
        if (this.gameListContent.height < 400)
            this.gameListContent.height = 400;
        
        var selectGameIdx = 0
        var allItem = cc.instantiate(this.gameItemPrefab) // 增加一个全部按钮
        this.gameListContent.addChild(allItem);
        allItem.getComponent('ClubFastJoinGameItem').setInfo(0, -1)
        this.gameNodeList.push(allItem)
        var idx = 1
        this.gameTemplateData.forEach((list, gameId)=>{
            let item = cc.instantiate(this.gameItemPrefab);
            this.gameListContent.addChild(item);
            item.getComponent('ClubFastJoinGameItem').setInfo(idx, gameId, [])
            this.gameNodeList.push(item)
            idx += 1
        })
        if (this.curSelectGameIdx == -1 && this.gameNodeList.length > 0)
            this.selectGameItem(selectGameIdx)
    }

    updateTemplateList() {
        this.templateListContent.removeAllChildren()
        this.templateNodeList = []
        if (this.curSelectGameIdx < 0)
            return
        var dataList = []
        if (this.curSelectGameIdx != 0) // 选中的不是全部
        {
            var curSelectGameType = this.gameNodeList[this.curSelectGameIdx].getComponent('ClubFastJoinGameItem').getGameType()
            dataList = this.gameTemplateData.get(curSelectGameType)
        }
        else
        {
            this.gameTemplateData.forEach((list, gameId)=>{
                dataList = dataList.concat(list)
            })
        }
        this.templateListContent.height = 90 * dataList.length;
        if (this.templateListContent.height < 300)
            this.templateListContent.height = 300;
        for (let i = 0; i < dataList.length; i++){
            let item = cc.instantiate(this.templateItemPrefab);
            this.templateListContent.addChild(item);
            item.getComponent('ClubGameOpenTemplateItem').setInfo(i, dataList[i], this.templateOpenData.get(dataList[i].templateId))
            this.templateNodeList.push(item)
        }
    }

    selectGameItem(index)
    {
        if (index == this.curSelectGameIdx)
            return
        if (this.curSelectGameIdx >= 0)
            this.gameNodeList[this.curSelectGameIdx].getComponent('ClubFastJoinGameItem').setSelect(false);
        this.gameNodeList[index].getComponent('ClubFastJoinGameItem').setSelect(true);
        this.curSelectGameIdx = index
        this.updateTemplateList()
    }

    openTemplate(template)
    {
        if (this.templateOpenData.get(template) == false) {
            this.templateOpenData.set(template, true);
        }
        else
        {
            this.templateOpenData.set(template, false);
        }
    }

    private button_save()
    {
        AudioManager.getInstance().playSFX("button_click");
        var openList = []
        this.templateOpenData.forEach((isOpen, template)=>{
            if (isOpen) 
                openList.push(template)
        })
        console.log(this.templateOpenData)
        if (openList.length == 0)
        {
            GameManager.getInstance().openWeakTipsUI("需要至少保留一个玩法");
            return
        }
        var clubData = GameDataManager.getInstance().clubData
        MessageManager.getInstance().messageSend(Proto.CS_CLUB_CHANGE_TEAM_TEMPLATE.MsgID.ID, {clubId: clubData.curSelectClubId, teamTemplateIds:openList});
        
    }

    private button_close() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().closeUI(ClubGameOpenUI);
    }

}