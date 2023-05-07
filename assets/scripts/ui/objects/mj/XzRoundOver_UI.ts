import { GameManager } from './../../../GameManager';
import { ROUND_OVER_HU_TYPE } from './../../../data/mj/defines';
import { MessageManager } from '../../../../framework/Manager/MessageManager';
import { GAME_STATE_MJ } from '../../../data/mj/defines';
import { Utils } from '../../../../framework/Utils/Utils';
import { BaseUI } from "../../../../framework/UI/BaseUI";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { AudioManager } from "../../../../framework/Manager/AudioManager";
import TuoGuanUI from '../../TuoGuanUI';


const { ccclass, property } = cc._decorator;

@ccclass
export default class XzRoundOver_UI extends BaseUI {

    protected static className = "XzRoundOver_UI";
    @property(cc.SpriteFrame)
    spf_title_bg: cc.SpriteFrame[] = [];
    @property(cc.SpriteFrame)
    spf_bg: cc.SpriteFrame[] = [];
    @property(cc.SpriteFrame)
    spf_hu: cc.SpriteFrame[] = [];

    private _gameData = null;   
    private _islj = false       // 是否流局
    private time = 15
    private isUnion = false
    private uiType = "common"

    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_MJ_DIR + this.className;
    }
    onLoad() {
        
    }
    
    start() {
    }
    
    onDestroy() {
        super.onDestroy();
        this._gameData = null
    }

    loop()
    {   
        if (this.time > 0)
        {
            this.time -= 1
            this.node.getChildByName("time").getComponent(cc.Label).string =  this.time + "s"
        }
        else
        {
            this.unschedule(this.loop)
            this.continue_button()
        }
    }

    iniView()
    { 
        try{
            this.initLayer()
            var gameData = GameDataManager.getInstance().getDataByCurGameType()
            this.initRule(gameData.gameinfo.rule, GameDataManager.getInstance().curGameType)
            if (gameData.gameinfo.time != 0)
                this.time = gameData.gameinfo.time-5
            gameData.cleanRoundOver();
            if (UIManager.getInstance().getUI(TuoGuanUI) && gameData.gameinfo.curGameOverData == null)
            {
                this.continue_button()
                return
            }
            if (UIManager.getInstance().getUI(TuoGuanUI) && gameData.gameinfo.curGameOverData != null)
                UIManager.getInstance().closeUI(TuoGuanUI)
            this.schedule(this.loop, 1, this.time);
            this.node.getChildByName("time").getComponent(cc.Label).string = this.time + "s"
        }
        catch (e)
        {
            GameManager.getInstance().handReconnect()
        }
    }

    /**初始化 */
    initLayer() {
        this._gameData = GameDataManager.getInstance().getDataByCurGameType()
        this.checkIsUnion()
        var info = this._gameData.gameinfo.curRoundOverData;
        var tempMap = this.setBaseInfo(info.playerBalance,  this._gameData.overTempPlayerInfo.get(0).seat, this._gameData.overTempPlayerInfo.size)
        for (var index =0; index < info.players.length; index++) {
            var cardsCount = info.players[index].shouPai.length + info.players[index].pbMingPai.length*3
            if (cardsCount == 14 || cardsCount == 8 || cardsCount == 11)
                this.removeCard(info.players[index].shouPai, tempMap.get(info.players[index].chairId))
            this.setMj(info.players[index].chairId, info.players[index].shouPai, info.players[index].pbMingPai);
            var realSeat = this.getRealSeatByRemoteSeat(info.players[index].chairId)
            var tempInfo = this._gameData.overTempPlayerInfo.get(realSeat)
            this.setPlayerInfo(info.players[index].chairId, tempInfo, this._gameData.gameinfo.dealerId == info.id)
        }

        this.node.active = true;
        this.node.getChildByName("label_time").getComponent(cc.Label).string = Utils.getTimeString(GameDataManager.getInstance().systemData.severTime)
    }

    private initRule(oRule, gameType)
    {
        var info = {rule:JSON.stringify(oRule), gameType:gameType}
        var rule1 = Utils.getBase(info);
        var rule2 = Utils.getRule(info);
        this.node.getChildByName("label_rule").getComponent(cc.Label).string = "玩法：" + rule1 + " " + rule2;
        if(oRule.union && oRule.union.score_rate)
            this.node.getChildByName("label_basescore").getComponent(cc.Label).string = "底分：" + oRule.union.score_rate;
    }

    public getRealSeatByRemoteSeat(seat)
    {
        var playerNum = this._gameData.getCurTypePlayerNum()
        var myInfo = this._gameData.overTempPlayerInfo.get(0)
        var offset = myInfo.realSeat - myInfo.seat
        var otherRealSeat = (seat + offset + playerNum)%playerNum
        var seatMap = []
        if (playerNum == 2) // 2人坐0,2
            seatMap = [0,2]
        else if (playerNum == 3) // 3人坐0,1,3号位
            seatMap = [0,1,3]
        else
            seatMap = [0,1,2,3]
        return seatMap[otherRealSeat]
    }

    setBaseInfo(balanceInfo, myChairId, playerNum)
    {
        for (var seat = 0; seat < 4; ++seat)
            this.node.getChildByName("player"+seat).active = false
        var maxScore = 0;
        var tempMap = new Map()
        this._islj = false;
        var huNum = 0
        var noJiao = true
        for (var idx = 0; idx < balanceInfo.length; idx++)
        {
            if (balanceInfo[idx].status > 0)
                noJiao = false
            if (balanceInfo[idx].hu != 0)
                huNum +=1
        }

        for (var balanceDetail of balanceInfo) {
            var roundScore = balanceDetail.roundScore
            if (this.uiType == "playBack")
            {
                var huTile = balanceDetail.hu_tile
                var tempChairId = balanceDetail.chair_id
            }
            else
            {
                var huTile = balanceDetail.huTile
                var tempChairId = balanceDetail.chairId
            }
            if (huTile)
            {
                    tempMap.set(tempChairId, huTile)
                    var playerNode = this.node.getChildByName("player"+(tempChairId-1))
                    playerNode.getChildByName("mj_hu").active = true
                    Utils.loadTextureFromLocal(playerNode.getChildByName("mj_hu").getChildByName("sp").getComponent(cc.Sprite),
                    "/card_mj/mj_" + huTile);
            }
            if (!roundScore)
                roundScore = 0
            if (roundScore > maxScore)
                maxScore = roundScore;
            if (tempChairId == myChairId) {
                this.node.getChildByName("sp_title_defeat").active = (roundScore < 0);
                this.node.getChildByName("sp_title_win").active = (roundScore >= 0);

                if (roundScore >= 0) {
                    this.node.getChildByName("change_bg").getComponent(cc.Sprite).spriteFrame = this.spf_bg[0];
                    this.node.getChildByName("change_bg2").getComponent(cc.Sprite).spriteFrame = this.spf_bg[0];
                }
                else {
                    this.node.getChildByName("change_bg").getComponent(cc.Sprite).spriteFrame = this.spf_bg[1];
                    this.node.getChildByName("change_bg2").getComponent(cc.Sprite).spriteFrame = this.spf_bg[1];
                }

            }
            this.setXZInfo(balanceDetail, noJiao, huNum, playerNum)
        }
        if (huNum < playerNum - 1)
            this._islj = true
        this.node.getChildByName("sp_title_liuju").active = this._islj;
        if (this._islj) {
            this.node.getChildByName("change_bg").getComponent(cc.Sprite).spriteFrame = this.spf_bg[1];
            this.node.getChildByName("change_bg2").getComponent(cc.Sprite).spriteFrame = this.spf_bg[1];
            this.node.getChildByName("sp_title_win").active = false;
            this.node.getChildByName("sp_title_defeat").active = false;
        }
        return tempMap
    }

    private removeCard(cardList, cardId)
    {
        for (var j = 0; j < cardList.length; ++j) {
            if (cardList[j] === cardId) {
                cardList.splice(j, 1);
                break;
            }
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

    private setPlayerInfo(chairId, info, isZhuang)
    {   
        var playerNode = this.node.getChildByName("player"+(chairId-1))
        playerNode.active = true
        var labelId = playerNode.getChildByName("label_id").getComponent(cc.Label)
        var labelName = playerNode.getChildByName("label_name").getComponent(cc.Label)
        var nodeZhuang = playerNode.getChildByName("sp_zhuang")
        var spHead = playerNode.getChildByName("head_sp").getComponent(cc.Sprite)
        labelId.string = info.id;
        labelName.string = Utils.getShortName(info.name,10)
        nodeZhuang.active = isZhuang
        Utils.loadTextureFromNet(spHead, info.headurl);
        if (info.id == GameDataManager.getInstance().userInfoData.userId) {
            labelId.node.color = new cc.Color(255, 249, 163, 255)
            labelId.node.getChildByName("label_title").color = new cc.Color(255, 249, 163, 255);
            labelName.node.color = new cc.Color(255, 249, 163, 255)
            if (this._islj) {
                playerNode.getChildByName("sp_item_win_bg").active = false;
                playerNode.getChildByName("sp_item_bg").active = true;
                return;
            }
            if (this.node.getChildByName("sp_title_win").active) {
                playerNode.getChildByName("sp_item_win_bg").active = true;
                playerNode.getChildByName("sp_item_bg").active = false;
            }
            else {
                playerNode.getChildByName("sp_item_win_bg").active = false;
                playerNode.getChildByName("sp_item_bg").active = true;
            }

        }
        else {
            labelId.node.color = new cc.Color(255, 255, 255, 255)
            labelId.node.getChildByName("label_title").color = new cc.Color(255, 255, 255, 255);
            labelName.node.color = new cc.Color(255, 255, 255, 255)
            playerNode.getChildByName("sp_item_win_bg").active = false;
            playerNode.getChildByName("sp_item_bg").active = false;
        }
    }

    // 血战麻将的一些信息（番，分数，胡的时间）
    private setXZInfo(info, noJiao, huNum, playerNum)
    {
        if (this.uiType == "playBack")
        {
            var playerNode = this.node.getChildByName("player"+(info.chair_id-1))
            var fan = info.hu_fan
        }
        else
        {
            var playerNode = this.node.getChildByName("player"+(info.chairId-1))
            var fan = info.huFan
        }

        playerNode.getChildByName("label_fan").getComponent(cc.Label).string = fan + "番"
        playerNode.getChildByName("label_fan").active = true

        if (this.uiType == "playBack")
        {
            var roundScore = info.round_score
            var roundMoney = info.round_money
        }
        else
        {
            var roundScore = info.roundScore
            var roundMoney = info.roundMoney
        }

        if (!roundMoney)
            roundMoney = 0
        if (!roundScore)
            roundScore = 0
        var labelScore = playerNode.getChildByName("label_score").getComponent(cc.Label)
        playerNode.getChildByName("label_score").active = true
        var stringScore = 0
        if (this.isUnion)
            stringScore = roundMoney/100
        else
            stringScore = roundScore
        if (roundScore < 0) {
            var color = new cc.Color(152,185,233)
        }
        else {
            var color = new cc.Color(236,128,53)
        }
        labelScore.string = stringScore.toString()
        labelScore.node.color = color
        playerNode.getChildByName("label_unique").getComponent(cc.Label).string = ""
        var itemStr = ""
        if (info.items.length)
        {
            for (var item of info.items)
            {
                itemStr += ROUND_OVER_HU_TYPE[item.type] + "x" + item.count
                if (item.type == 1 || item.type == 2) // 天胡 地胡
                    playerNode.getChildByName("label_unique").getComponent(cc.Label).string = ROUND_OVER_HU_TYPE[item.type]
            }
        }
        playerNode.getChildByName("label_item").getComponent(cc.Label).string = itemStr
        playerNode.getChildByName("label_item").active = true
        if (this.uiType == "playBack")
            var index = info.hu_index
        else
            var index = info.huIndex
        var huType = info.hu  // 自摸2，胡1
        var status = info.status // 1查叫  2胡  3叫
        if (!noJiao){ // 有叫牌
            if(huType && huType >= 1){
                playerNode.getChildByName("hu_order").active = true
                playerNode.getChildByName("hu_order").getComponent(cc.Sprite).spriteFrame = this.spf_hu[(index - 1) + (huType - 1) * 3]
            }
            else if (huNum < playerNum- 1) // 流局
            {
                playerNode.getChildByName("hu_order").active = true
                if (status == 1)
                    playerNode.getChildByName("hu_order").getComponent(cc.Sprite).spriteFrame = this.spf_hu[6]
                else if (status == 2)
                    playerNode.getChildByName("hu_order").getComponent(cc.Sprite).spriteFrame = this.spf_hu[7]
                else
                    playerNode.getChildByName("hu_order").active = false
            }
        }

    }

    private setMj(seat, handMj, pgArray)
    {
        //调整手牌位置
        seat -= 1
        var sortHandMj = handMj.sort(function (a, b) { return a - b })
        var hidenum = (4 - Math.floor(sortHandMj.length / 3)) * 3;
        var playerNode = this.node.getChildByName("player"+seat)
        var mjList = playerNode.getChildByName("in_mj").children
        for (var k = 0; k < 13; ++k) {
            let mjnode = mjList[k];
            if (k < hidenum)
                mjnode.active = false;
            else {
                Utils.loadTextureFromLocal(mjnode.getChildByName("sp").getComponent(cc.Sprite),
                    "/card_mj/mj_" + sortHandMj[k - hidenum], function () { mjnode.active = true; });
            }
        }

        var mjPgNodeList = playerNode.getChildByName("pg_mj").children
        for (var i = 0; i < 4; ++i) {
            if (i < pgArray.length) {
                mjPgNodeList[i].active = true;
                for (var j = 0; j < pgArray[i].length; ++j) {
                    if (j < 4) {
                        let pgnode = mjPgNodeList[i].getChildByName("mj_" + j);
                        var cardId = pgArray[i][j]
                        if ((pgArray[i][5] == 15 || pgArray[i][5] == 6) && j == 3)
                            cardId = 0
                        if (cardId > 0)
                            Utils.loadTextureFromLocal(pgnode.getChildByName("sp").getComponent(cc.Sprite),
                                "/card_mj/mj_" + cardId, function () { pgnode.active = true; });
                        else if (cardId == 0)
                        {
                            Utils.loadTextureFromLocal(pgnode.getComponent(cc.Sprite), "card_mj/mj_pg_2_b");
                            Utils.loadTextureFromLocal(pgnode.getChildByName("sp").getComponent(cc.Sprite), "", function () { pgnode.active = true; }); 
                            pgnode.active = true
                        }
                        else
                            pgnode.active = false;
                    }
                }
            }
            else
                mjPgNodeList[i].active = false;
        }

    }

    playBackInitView(balanceInfo, playerInfoMap, rule, gameType, startTime)
    {
        this.uiType = "playBack"
        this.initRule(rule, gameType)
        this.unschedule(this.loop)
        this.node.getChildByName("time").active = false
        this.node.getChildByName("time copy").active = false
        this.node.getChildByName("btnMgr").getChildByName("btn_card_detail").active = true
        this.node.getChildByName("btnMgr").getChildByName("btn_continue").active = false
        this.node.getChildByName("label_time").getComponent(cc.Label).string = Utils.getTimeString(startTime*1000)
        if (rule.union)
            this.isUnion = true
        else
            this.isUnion = false    
        var tempMap = this.setBaseInfo(balanceInfo, playerInfoMap.get(0).seat, playerInfoMap.size)
        for (var index = 0; index < balanceInfo.length; index++)
        {
            var chairId = balanceInfo[index].chair_id
            var realSeat = getRealSeatByChaiId(chairId, playerInfoMap)
            var cardsCount = playerInfoMap.get(realSeat).inMj.length + playerInfoMap.get(realSeat).pgMj.length*3
            if (cardsCount == 14 || cardsCount == 8 || cardsCount == 11)
                this.removeCard(playerInfoMap.get(realSeat).inMj, tempMap.get(chairId))
            this.setMj(chairId, playerInfoMap.get(realSeat).inMj, playerInfoMap.get(realSeat).pgMj);

            var nickName = playerInfoMap.get(realSeat).name
            var icon = playerInfoMap.get(realSeat).head
            var isZhuang = playerInfoMap.get(realSeat).isZhuang
            var info = {    
                id: playerInfoMap.get(realSeat).id,
                headurl: icon,
                name: nickName,
            }
            this.setPlayerInfo(chairId, info,isZhuang)
        } 
        this.node.active = true;
        function getRealSeatByChaiId(chairId, playerInfoMap)
        {
            var reVlaue = -1
            playerInfoMap.forEach((infoObj, seat)=>{
                if (infoObj.seat == chairId)
                    reVlaue = seat
            })
            return reVlaue
        }


    }
    
    //分享按钮
    share_button(event) {
        AudioManager.getInstance().playSFX("button_click")
        return
    }

    //继续游戏按钮
    continue_button() {
        AudioManager.getInstance().playSFX("button_click")
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
        if (gameData.gameinfo.curGameOverData == null) {
            gameData.setGameState(GAME_STATE_MJ.PER_BEGIN);
        }
        else {
            if (UIManager.getInstance().getUI(TuoGuanUI))
                return
            gameData.setGameState(GAME_STATE_MJ.GAME_CLOSE);
        }
        UIManager.getInstance().closeUI(XzRoundOver_UI);
    }

    btn_card_detail()
    {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().closeUI(XzRoundOver_UI);

    }

}
