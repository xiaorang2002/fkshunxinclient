import { PlayBackUI_MJ } from './../playback/PlayBackUI_MJ';
import { Utils } from './../../../../framework/Utils/Utils';
import { GAME_TYPE, GAME_NAME } from './../../../data/GameConstValue';
import { GAME_STATE_MJ } from './../../../data/mj/defines';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { BaseUI } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import * as Proto from "../../../../proto/proto-min";
import { MessageManager } from "../../../../framework/Manager/MessageManager";
import ZjRoundOver_UI from './ZjRoundOver_UI';

const { ccclass, property } = cc._decorator;
// 捉鸡玩法得分部分
@ccclass
export default class ZjScoreDetailPage_UI extends BaseUI {
    protected static className = "ZjScoreDetailPage_UI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_MJ_DIR + this.className;
    }

    @property({ type: [cc.SpriteFrame] })
    spWinBg: Array<cc.SpriteFrame> = [];
    @property(cc.Prefab)
    scoreNodePrefab: cc.Prefab = null;

    private spacing = 3
    private contentList = []
    private uiType = "common"
    private isUnion = false
    private zhuangPosList = [cc.v3(-512,234),cc.v3(-198,234),cc.v3(111, 234),cc.v3(421,234)]

    onLoad() {
        
    }
    
    commonInitView() {
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
        var overInfo = gameData.gameinfo.curRoundOverData
        this.checkIsUnion()
        for (var index = 0; index <overInfo.playerBalance.length; index++)
        {
            var chairId = overInfo.playerBalance[index].chairId
            var realSeat = gameData.getRealSeatByRemoteSeat(chairId)
            var nickName = gameData.overTempPlayerInfo.get(realSeat).name
            var icon = gameData.overTempPlayerInfo.get(realSeat).headurl
            var isZhuang = gameData.gameinfo.dealerId==gameData.overTempPlayerInfo.get(realSeat).id
            this.initPlayerBaseData(chairId, overInfo.playerBalance[index],nickName,icon,isZhuang,realSeat)
            this.initScorePage(chairId, overInfo.playerBalance[index])
        } 
        
        var curTime = GameDataManager.getInstance().systemData.severTime;
        this.node.getChildByName("label_room_id").getComponent(cc.Label).string = "房间号：" + gameData.gameinfo.roomId.toString()
        this.node.getChildByName("label_game_type").getComponent(cc.Label).string = GAME_NAME[GameDataManager.getInstance().curGameType] 
        this.node.getChildByName("label_time").getComponent(cc.Label).string =  "时间：" + Utils.getTimeString(curTime);
        this.node.getChildByName("btn_return").active = false
        if (overInfo.benJi)
        {
            this.node.getChildByName("fan_mj").active = true
            var sp_mj = this.node.getChildByName("fan_mj").getChildByName("mj_sp").getComponent(cc.Sprite)
            Utils.loadTextureFromLocal(sp_mj, "/card_mj/mj_" + overInfo.benJi);
        }
    }

    checkIsUnion()
    {
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
        var oRule = gameData.gameinfo.rule
        if (oRule.union)
            this.isUnion = true
        else
            this.isUnion = false    
    }

    playBackInitView(gameType, balanceInfo, playerInfoMap, benji)
    {
        this.uiType = "playBack"
        for (var index = 0; index < balanceInfo.length; index++)
        {
            var chairId = balanceInfo[index].chair_id
            var realSeat = getRealSeatByChaiId(chairId, playerInfoMap)
            var nickName = playerInfoMap.get(realSeat).name
            var icon = playerInfoMap.get(realSeat).head
            var isZhuang = playerInfoMap.get(realSeat).isZhuang
            this.initPlayerBaseData(chairId, balanceInfo[index],nickName,icon,isZhuang,realSeat)
            this.initScorePage(chairId, balanceInfo[index])
        } 
        function getRealSeatByChaiId(chairId, playerInfoMap)
        {
            var reVlaue = -1
            playerInfoMap.forEach((infoObj, seat)=>{
                if (infoObj.seat == chairId)
                    reVlaue = seat
            })
            return reVlaue
        }
        this.node.getChildByName("label_room_id").getComponent(cc.Label).string = ""
        this.node.getChildByName("label_time").getComponent(cc.Label).string =  ""
        this.node.getChildByName("label_game_type").getComponent(cc.Label).string = GAME_NAME[gameType] 
        this.node.getChildByName("btn_return").active = true
        this.node.getChildByName("btn_continue").active = false
        if (benji)
        {
            this.node.getChildByName("fan_mj").active = true
            var sp_mj = this.node.getChildByName("fan_mj").getChildByName("mj_sp").getComponent(cc.Sprite)
            Utils.loadTextureFromLocal(sp_mj, "/card_mj/mj_" +benji);
        }
    }

    initPlayerBaseData(chairId, balanceInfo, name, icon, isZhuang, realSeat)
    {
        var playerNode = this.node.getChildByName("player" + (chairId-1))
        playerNode.active = true
        var headSp = playerNode.getChildByName("default_head").getComponent(cc.Sprite)
        var scoreBg = playerNode.getChildByName("bg").getComponent(cc.Sprite)
        if(this.uiType == "playBack")
        {
            var roundScore = balanceInfo.round_score
            var totalScore = balanceInfo.total_score
            var roundMoney = balanceInfo.round_money
        }
        else{
            var roundScore = balanceInfo.roundScore
            var totalScore = balanceInfo.totalScore
            var roundMoney = balanceInfo.roundMoney
        }

        if (!roundScore)
            roundScore = 0
        if (!totalScore)
            totalScore = 0
        if (!roundMoney)
            roundMoney = 0
        playerNode.getChildByName("label_name").getComponent(cc.Label).string = name
        playerNode.getChildByName("label_account").getComponent(cc.Label).string = "总计：" + totalScore.toString()
        Utils.loadTextureFromNet(headSp, icon);
        var pre = ''
        if (!this.isUnion) // 亲友群积分仅仅是积分
        {
            var labelScore = playerNode.getChildByName("label_round_score").getComponent(cc.Label)
           
            if (roundScore < 0) {
                var color = new cc.Color(125, 230, 244)
            }
            else {
                var color = new cc.Color(255,227,87)
                pre = '+'
            }
            labelScore.string = pre + roundScore.toString()
            labelScore.node.color = color
        }
        else
        {   
            playerNode.getChildByName("union").active = true
            var labelScore1 = playerNode.getChildByName("union").getChildByName("label_score1").getComponent(cc.Label)
            var labelScore2 = playerNode.getChildByName("union").getChildByName("label_score2").getComponent(cc.Label)
            if (roundScore < 0) {
                var color = new cc.Color(125, 230, 244)
            }
            else{
                var color = new cc.Color(255,227,87)
            }
            labelScore1.node.color = color
            labelScore1.string = roundScore.toString();
            labelScore2.node.color= color
            labelScore2.string = (roundMoney/100).toString();
            
        }
        // 赢了
        if (roundScore >= 0){
            playerNode.getChildByName("sp_win_down").active = true
        }
        scoreBg.spriteFrame = this.spWinBg[roundScore>=0?0:1]
        if (realSeat == 0) // 如果是自己
            this.node.getChildByName("sp_self_win").position = playerNode.position
        if (isZhuang)
            this.node.getChildByName("sp_zhuang").position = cc.v3(playerNode.position.x-51.5, playerNode.position.y+223);
    }

    initScorePage(chairId, balanceInfo)
    {
        var playerNode = this.node.getChildByName("player" + (chairId-1))
        var nodeListContent = playerNode.getChildByName("scrollView").getChildByName("view").getChildByName("content") 
        var count = 0
        if (balanceInfo.status != 1) // BalanceStatus.Hu
        {
            var item = cc.instantiate(this.scoreNodePrefab);
            nodeListContent.addChild(item);
            item.setPosition(0, -item.height * (0.5 + count) - this.spacing * (count + 1));
            count += 1
            item.getComponent("ZjScoreNode").updateTitleInfo(balanceInfo.status)
        }
        for (var i = 0; i < balanceInfo.items.length; ++i) {
            for (var j =0; j < balanceInfo.items[i].typescore.length; j++){
                var item = cc.instantiate(this.scoreNodePrefab);
                nodeListContent.addChild(item);
                item.setPosition(0, -item.height * (0.5 + count) - this.spacing * (count + 1));
                count += 1
                item.getComponent("ZjScoreNode").updateHuInfo(balanceInfo.items[i].type, balanceInfo.items[i].typescore[j])

            }
        }
        var gangMap = new Map()
        for (var i = 0; i < balanceInfo.gang.length; ++i) {
            var skey = balanceInfo.gang[i].type + "^" + balanceInfo.gang[i].tile + "^" +balanceInfo.gang[i].score
            if (gangMap.get(skey))
                gangMap.set(skey, gangMap.get(skey)+ balanceInfo.gang[i].count)
            else
                gangMap.set(skey, balanceInfo.gang[i].count)
            
        }
        gangMap.forEach((value, key)=>{
            var item = cc.instantiate(this.scoreNodePrefab);
            nodeListContent.addChild(item);
            item.getComponent("ZjScoreNode").updateGangInfo(key, value)
            this.contentList.push(item)
            item.setPosition(0, -item.height * (0.5 + count) - this.spacing * (i + count));
            count += 1
        })
        var jiMap = new Map()
        for (var i = 0; i < balanceInfo.ji.length; ++i) {
            var skey = balanceInfo.ji[i].type + "^" + balanceInfo.ji[i].tile + "^" +balanceInfo.ji[i].score
            if (jiMap.get(skey))
                jiMap.set(skey, jiMap.get(skey)+ balanceInfo.ji[i].count)
            else
                jiMap.set(skey, balanceInfo.ji[i].count)
        }
        jiMap.forEach((value, key)=>{
            var item = cc.instantiate(this.scoreNodePrefab);
            nodeListContent.addChild(item);
            item.getComponent("ZjScoreNode").updateJiInfo(key, value)
            this.contentList.push(item)
            item.setPosition(0, -item.height * (0.5 + count) - this.spacing * (count + 1));
            count += 1
        })
        var realHeight = count * (70 + this.spacing) + this.spacing;
        if (realHeight > nodeListContent.height)
            nodeListContent.height = realHeight
    }

    btn_continue()
    {
        AudioManager.getInstance().playSFX("button_click")
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
        gameData.cleanRoundOver();
        if (gameData.gameinfo.curGameOverData == null) {
            gameData.setGameState(GAME_STATE_MJ.PER_BEGIN)
            UIManager.getInstance().closeUI(ZjScoreDetailPage_UI);
        }
        else {
            gameData.setGameState(GAME_STATE_MJ.GAME_CLOSE);
        }
    }

    btn_return()
    { 
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().closeUI(ZjScoreDetailPage_UI)
        UIManager.getInstance().closeUI(PlayBackUI_MJ)
    }

    btn_card_detail()
    {
        AudioManager.getInstance().playSFX("button_click")
        if (this.uiType == "playBack"){
            UIManager.getInstance().closeUI(ZjScoreDetailPage_UI)   
            return
        }

        var curGameType = GameDataManager.getInstance().curGameType
        if (curGameType == GAME_TYPE.MHXL || curGameType == GAME_TYPE.LFMJ)
            UIManager.getInstance().openUI(ZjRoundOver_UI, 20,()=>{ 
                UIManager.getInstance().hideUI(ZjScoreDetailPage_UI);
            })
    }

}