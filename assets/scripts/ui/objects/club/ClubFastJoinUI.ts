import { PreferentData } from './../../../data/PreferentData';
import { Utils } from './../../../../framework/Utils/Utils';
import { BaseUI, UIClass } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { MessageManager } from "../../../../framework/Manager/MessageManager";
import * as Proto from "../../../../proto/proto-min";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { GameManager } from "../../../GameManager";
import { AudioManager } from "../../../../framework/Manager/AudioManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class ClubFastJoinUI extends BaseUI {

    protected static className = "ClubFastJoinUI";
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
    @property(cc.Node)
    templateListLayOut: cc.Node = null;
    @property(cc.Node)
    toggle_desk:cc.Node = null


    private gameNodeList = [];
    private templateNodeList = [];
    private gameTemplateData = new Map()
    private curSelectGameIdx = -1
    private collectGameList = null

    start() {
        this.gameTemplateData = this.getGameData()
        this.updateGameList()
    }

    private getGameData()
    {
        var clubData = GameDataManager.getInstance().clubData
        this.collectGameList = cc.sys.localStorage.getItem("collectFastList")
        if (this.collectGameList)
            this.collectGameList = JSON.parse(this.collectGameList)
        var gameTemplateMap = new Map();
        // 遍历所有的玩法列表
        for (let i = 0; i < clubData.clubFastList.length; ++i) {
            var gameId = clubData.clubFastList[i].template.gameId
            var templateId = clubData.clubFastList[i].template.templateId
            var templateList = gameTemplateMap.get(gameId)
            if(templateList)
            {
                templateList.push(templateId)
                gameTemplateMap.set(gameId, templateList)
            }
            else
                gameTemplateMap.set(gameId, [templateId])
        }
        if (this.collectGameList && this.collectGameList.length > 0)
        {
            var tempArrMap = Array.from(gameTemplateMap)
            tempArrMap.sort(function(a, b) {return this.collectGameList.indexOf(b[0]) - this.collectGameList.indexOf(a[0])}.bind(this))
            gameTemplateMap = new Map(tempArrMap.map(i=>[i[0],i[1]]))
        }
        return gameTemplateMap
    }


    updateGameList() {
        if (this.gameTemplateData.size == 0)
            return
        this.gameListContent.removeAllChildren()
        this.gameNodeList = []
        this.gameListContent.height = 91 * (this.gameTemplateData.size +1);
        if (this.gameListContent.height < 460)
            this.gameListContent.height = 460;
        var preferJoinGameId = cc.sys.localStorage.getItem("fastJoinGame")
        
        var selectGameIdx = 0
        var allItem = cc.instantiate(this.gameItemPrefab) // 增加一个全部按钮
        this.gameListContent.addChild(allItem);
        allItem.getComponent('ClubFastJoinGameItem').setInfo(0, -1)
        this.gameNodeList.push(allItem)
        var idx = 1
        this.gameTemplateData.forEach((list, gameId)=>{
            let item = cc.instantiate(this.gameItemPrefab);
            this.gameListContent.addChild(item);
            item.getComponent('ClubFastJoinGameItem').setInfo(idx, gameId, this.collectGameList)
            this.gameNodeList.push(item)
            if (preferJoinGameId && preferJoinGameId == gameId)
                selectGameIdx = idx
            idx += 1
        })
        if (this.curSelectGameIdx == -1 && this.gameNodeList.length > 0)
            this.selectGameItem(selectGameIdx)
    }

    updateTemplateList() {
        this.templateListLayOut.removeAllChildren()
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
            var clubData = GameDataManager.getInstance().clubData
            for (let i = 0; i < clubData.clubFastList.length; ++i) {
                var templateId = clubData.clubFastList[i].template.templateId
                dataList.push(templateId)
            }
        }
        this.templateListContent.height = 156 * Math.ceil(dataList.length / 2);
        if (this.templateListContent.height < 400)
            this.templateListContent.height = 400;
        for (let i = 0; i < dataList.length; i++){
            let item = cc.instantiate(this.templateItemPrefab);
            this.templateListLayOut.addChild(item);
            item.getComponent('ClubFastJoinTemplateItem').setInfo(i, dataList[i])
            this.templateNodeList.push(item)
        }
    }

    select_mz(ismz:boolean)
    {
        
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

    fastJoin(gameId,template,isGps)
    {
        if (GameDataManager.getInstance().isJoinRoom){
            GameManager.getInstance().openWeakTipsUI("加入房间中，请稍后");
            return
        }
        var clubData = GameDataManager.getInstance().clubData
        if (isGps){
            if (!Utils.checkGps())
                return
        }
        let msg =
        {
            clubId: clubData.curSelectClubId,
            gameId:gameId,
            templateId:template,
        }
        GameDataManager.getInstance().isJoinRoom = true
        PreferentData.getInstance().updateEnterGamePreferent(template)
        cc.sys.localStorage.setItem("fastJoinGame", gameId)
        MessageManager.getInstance().messageSend(Proto.CS_FastJoinRoom.MsgID.ID, msg);
        UIManager.getInstance().closeUI(ClubFastJoinUI);
    }

    private button_close() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().closeUI(ClubFastJoinUI);
    }

}