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
export default class ZgRoundOver_UI extends BaseUI {

    protected static className = "ZgRoundOver_UI";
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
    private scoreRate = 1  //底分
    private luoboColor:{ [key: string]: boolean } = {}
    private luoboArg =[]
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_MJ_DIR + this.className;
    }

    start() {
    }
    onLoad() {

    }
    onDestroy() {
        super.onDestroy();
        this._gameData = null
    }

    loop() {
        if (this.time > 0) {
            this.time -= 1
            this.node.getChildByName("time").getComponent(cc.Label).string = this.time + "s"
        }
        else {
            this.unschedule(this.loop)
            this.continue_button()
        }
    }

    iniView() {
        try {
            var gameData = GameDataManager.getInstance().getDataByCurGameType()
            if (!gameData.gameinfo.curRoundOverData) {
                UIManager.getInstance().closeUI(ZgRoundOver_UI);
                return
            }
            if(gameData.gameinfo.rule.union){
                this.scoreRate = gameData.gameinfo.rule.union.score_rate
            }           
            this.initLayer()
            this.initRule(gameData.gameinfo.rule, GameDataManager.getInstance().curGameType)
            if (gameData.gameinfo.time != 0)
                this.time = gameData.gameinfo.time - 5
            gameData.cleanRoundOver();
            if (UIManager.getInstance().getUI(TuoGuanUI) && gameData.gameinfo.curGameOverData == null) {
                this.continue_button()
                return
            }
            if (UIManager.getInstance().getUI(TuoGuanUI) && gameData.gameinfo.curGameOverData != null)
                UIManager.getInstance().closeUI(TuoGuanUI)
            this.schedule(this.loop, 1, this.time);
            this.node.getChildByName("time").getComponent(cc.Label).string = this.time + "s"
        }
        catch (e) {
            GameManager.getInstance().handReconnect()
        }
    }

    /**初始化 */
    initLayer() {
        this.luoboColor = {}
        this._gameData = GameDataManager.getInstance().getDataByCurGameType()
        this.checkIsUnion()
        var info = this._gameData.gameinfo.curRoundOverData;
        var tempMap = this.setBaseInfo(info.playerBalance, this._gameData.overTempPlayerInfo.get(0).seat, this._gameData.overTempPlayerInfo.size)
        //显示抓鸟的牌
        if (info.luobos != undefined && info.luobos.length > 0) {
            this.showLuoBoPai(info.luobos)
        }
        for (var index = 0; index < info.players.length; index++) {
            var cardsCount = info.players[index].shouPai.length + info.players[index].pbMingPai.length * 3
            if(tempMap.get(info.players[index].chairId))
            {
                this.setHu(tempMap.get(info.players[index].chairId),info.players[index].chairId)
            }
            if (cardsCount == 14 || cardsCount == 8 || cardsCount == 11)
                this.removeCard(info.players[index].shouPai, tempMap.get(info.players[index].chairId))
            this.setMj(info.players[index].chairId, info.players[index].shouPai, info.players[index].pbMingPai);
           
            var realSeat = this.getRealSeatByRemoteSeat(info.players[index].chairId)
            var tempInfo = this._gameData.overTempPlayerInfo.get(realSeat)
            this.setPlayerInfo(info.players[index].chairId, tempInfo, this._gameData.gameinfo.dealerId == tempInfo.id)
        }

        this.node.active = true;
        this.node.getChildByName("label_time").getComponent(cc.Label).string = Utils.getTimeString(GameDataManager.getInstance().systemData.severTime)
        this.node.getChildByName("label_fangHao").getComponent(cc.Label).string = "房号:" + this._gameData.gameinfo.roomId
    }

    private initRule(oRule, gameType) {
        var info = { rule: JSON.stringify(oRule), gameType: gameType }
        var rule1 = Utils.getBase(info);
        var rule2 = Utils.getRule(info);
        this.node.getChildByName("label_rule").getComponent(cc.Label).string = "玩法：" + rule1 + " " + rule2;
        if (oRule.union && oRule.union.score_rate) {
            this.scoreRate = oRule.union.score_rate
            this.node.getChildByName("label_basescore").getComponent(cc.Label).string = "底分：" + oRule.union.score_rate;
        }

    }

    public getRealSeatByRemoteSeat(seat) {
        var playerNum = this._gameData.getCurTypePlayerNum()
        var myInfo = this._gameData.overTempPlayerInfo.get(0)
        var offset = myInfo.realSeat - myInfo.seat
        var otherRealSeat = (seat + offset + playerNum) % playerNum
        var seatMap = []



        if (playerNum == 2) // 2人坐0,2
            seatMap = [0, 2]
        else if (playerNum == 3) // 3人坐0,1,3号位
            seatMap = [0, 1, 3]
        else
            seatMap = [0, 1, 2, 3]
        return seatMap[otherRealSeat]
    }

    //显示萝卜牌
    showLuoBoPai(mapais) {
        this.luoboArg = []
        let luoBo_pai = this.node.getChildByName("luoBo_pai")
        let bg = luoBo_pai.getChildByName("bg")
        bg.active = false
        luoBo_pai.active = true
        let n = 0
        for (let i = 0; i < mapais.length; ++i) {
            let mjNode = luoBo_pai.getChildByName("mj_" + i)
            if (mapais[i].pai > 0) {
                this.luoboArg[n] =  mapais[i].pai
                Utils.loadTextureFromLocal(mjNode.getChildByName("sp").getComponent(cc.Sprite),
                    "/card_mj/mj_" + mapais[i].pai, function () { mjNode.active = true; });
                bg.active = true
                n++
            }
            else {
                mjNode.active = false;
            }
        }
        if(bg.active)
        {
            bg.scaleX = n == 2?0.9:0.53
        }
        
    }
    setBaseInfo(balanceInfo, myChairId, playerNum) {
        for (var seat = 0; seat < 3; ++seat)
            this.node.getChildByName("player" + seat).active = false
        var maxScore = 0;
        var tempMap = new Map()
        this._islj = false;
        var huNum = 0
        var noJiao = true
        for (var idx = 0; idx < balanceInfo.length; idx++) {
            if (balanceInfo[idx].status > 0)
                noJiao = false
            if (balanceInfo[idx].hu != 0)
                huNum += 1
        }

        for (var balanceDetail of balanceInfo) {
            var roundScore = balanceDetail.roundScore
            if (this.uiType == "playBack") {
                var huTile = balanceDetail.hu_tile
                var tempChairId = balanceDetail.chair_id
            }
            else {
                var huTile = balanceDetail.huTile
                var tempChairId = balanceDetail.chairId
            }
            var playerNode = this.node.getChildByName("player" + (tempChairId - 1))
            if (huTile) {
              
                tempMap.set(tempChairId, huTile)
                playerNode.getChildByName("mj_hu").active = true
                Utils.loadTextureFromLocal(playerNode.getChildByName("mj_hu").getChildByName("sp").getComponent(cc.Sprite),
                    "/card_mj/mj_" + huTile);
            }
            if (balanceDetail.piao != undefined && balanceDetail.piao>0) {
                playerNode.getChildByName("sp_piao").active = true
            }else{
                playerNode.getChildByName("sp_piao").active = false
            }
            //报
            if (balanceDetail.baoting != undefined && balanceDetail.baoting) {
                playerNode.getChildByName("sp_bao").active = true
            }else{
                playerNode.getChildByName("sp_bao").active = false
            }

            if (!roundScore)
                roundScore = 0
            if (roundScore > maxScore)
                maxScore = roundScore;
            if (tempChairId == myChairId) {
                this.node.getChildByName("sp_title_defeat").active = (roundScore < 0);
                this.node.getChildByName("sp_title_win").active = (roundScore >= 0);
                this.node.getChildByName("change_bg_win").active = (roundScore >= 0);
                this.node.getChildByName("change_bg_lose").active = (roundScore < 0);
            }
            this.setXZInfo(balanceDetail, noJiao, huNum, playerNum)
        }
        if (huNum < playerNum - 1)
            this._islj = true
        this.node.getChildByName("sp_title_liuju").active = this._islj;
        if (this._islj) {
            this.node.getChildByName("change_bg_win").active = false;
            this.node.getChildByName("change_bg_lose").active = true;
            this.node.getChildByName("sp_title_win").active = false;
            this.node.getChildByName("sp_title_defeat").active = false;
        }
        return tempMap
    }

    private removeCard(cardList, cardId) {
        for (var j = 0; j < cardList.length; ++j) {
            if (cardList[j] === cardId) {
                cardList.splice(j, 1);
                break;
            }
        }
    }

    checkIsUnion() {
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
        var oRule = gameData.gameinfo.rule
        if (oRule.union)
            this.isUnion = true
        else
            this.isUnion = false
    }

    private setPlayerInfo(chairId, info, isZhuang) {
        var playerNode = this.node.getChildByName("player" + (chairId - 1))
        playerNode.active = true
        var labelId = playerNode.getChildByName("label_id").getComponent(cc.Label)
        var labelName = playerNode.getChildByName("label_name").getComponent(cc.Label)
        var nodeZhuang = playerNode.getChildByName("sp_zhuang")
        var spHead = playerNode.getChildByName("head_sp").getComponent(cc.Sprite)
        labelId.string = info.id;
        labelName.string = Utils.getShortName(info.name, 10)
        nodeZhuang.active = isZhuang
        Utils.loadTextureFromNet(spHead, info.headurl);
    }

    // 血战麻将的一些信息（番，分数，胡的时间）
    private setXZInfo(info, noJiao, huNum, playerNum) {
        let seatid = 0
        if (this.uiType == "playBack") {
            var playerNode = this.node.getChildByName("player" + (info.chair_id - 1))
            seatid = info.chair_id - 1
        }
        else {
            var playerNode = this.node.getChildByName("player" + (info.chairId - 1))
            seatid = info.chairId - 1
        }

        //报
        // if(info.baoting)
        // {
        //     playerNode.getChildByName("sp_bao").active = true
        // }

        if (this.uiType == "playBack") {
            var roundScore = info.round_score
            var roundMoney = info.round_money
            var huScore = info.hu_score || 0
            var huFan = info.hu_fan || 0
            var luoboScore = info.luobo_score
            var gangScore = info.gang_score || 0
        }
        else {
            var roundScore = info.roundScore
            var roundMoney = info.roundMoney
            var huScore = info.huScore || 0
            var huFan = info.huFan || 0
            var luoboScore = info.luoboScore || 0
            var gangScore = info.gangScore || 0
        }

        if (!roundMoney)
            roundMoney = 0
        if (!roundScore)
            roundScore = 0
        var labelScore = playerNode.getChildByName("label_score").getComponent(cc.Label)
        playerNode.getChildByName("label_score").active = true
        var stringScore = 0
        if (this.isUnion)
            stringScore = roundMoney / 100
        else
            stringScore = roundScore
        labelScore.string = stringScore.toString()
        var itemStr = ""
        let guiCount = 0
        let gangCount = 0
        if (info.items != undefined && info.items.length>0) {
            for (let i = 0; i < info.items.length; i++) {
                if(info.items[i].type == 22){  //四归一
                    guiCount++
                } else if(info.items[i].type == 20 || info.items[i].type == 36
                    || info.items[i].type == 82 || info.items[i].type == 118 
                    || info.items[i].type == 119 || info.items[i].type == 120){  //杠
                    gangCount += info.items[i].count
                }
                else if (ROUND_OVER_HU_TYPE[info.items[i].type] != undefined && info.items[i].count != 0) {
                    itemStr += "" + ROUND_OVER_HU_TYPE[info.items[i].type] + " "
                }
            }
        }

        if (guiCount > 0) {
            itemStr += guiCount.toString() + "归 "
        }
        if (gangCount > 0) {
            itemStr += gangCount.toString() + "杠 "
        }
        if (info.piao != undefined && info.piao > 0) {
            itemStr += "飘 "
        }
        if (luoboScore != undefined && luoboScore > 0) {
            itemStr += "萝卜x" + luoboScore + " "
            this.luoboColor[seatid] = true
        }else{
            this.luoboColor[seatid] = false
        }

        playerNode.getChildByName("label_item").getComponent(cc.Label).string = itemStr
        playerNode.getChildByName("label_item").active = true
        // var index = info.hu_index
        if (this.uiType == "playBack")
            var index = info.hu_index
        else
            var index = info.huIndex
        var huType = info.hu  // 自摸2，胡1
        var status = info.status // 1查叫  2胡  3叫
        LogWrap.log(">>>>>>>>>>>>>>>>status:"+status," huType:"+huType," huNum:"+huNum," playerNum:"+playerNum)
        if (!noJiao){ // 有叫牌
            if(huType && huType >= 1){
                playerNode.getChildByName("hu_order").active = true
                playerNode.getChildByName("hu_order").getComponent(cc.Sprite).spriteFrame = this.spf_hu[(index - 1) + (huType - 1) * 2]
            }
            else if (huNum < playerNum- 1) // 流局
            {
                playerNode.getChildByName("hu_order").active = true
                if (status == 1) 
                    playerNode.getChildByName("hu_order").getComponent(cc.Sprite).spriteFrame = this.spf_hu[4]  //查叫
                else if (status == 3)
                    playerNode.getChildByName("hu_order").getComponent(cc.Sprite).spriteFrame = this.spf_hu[5]  //叫牌
                else
                    playerNode.getChildByName("hu_order").active = false
            }
        }

        playerNode.getChildByName("label_fan").getComponent(cc.Label).string = huFan.toString()
        playerNode.getChildByName("label_gang").getComponent(cc.Label).string = gangScore.toString()
        playerNode.getChildByName("label_hu").getComponent(cc.Label).string = huScore.toString()

    }

    private setMj(seat, handMj, pgArray) {
        //调整手牌位置
        seat -= 1
        var sortHandMj = handMj.sort(function (a, b) { return a - b })
        var hidenum = (4 - Math.floor(sortHandMj.length / 3)) * 3;
        var playerNode = this.node.getChildByName("player" + seat)
        let isluobo = this.luoboColor[seat]
        let mj1 = this.luoboArg[0] || -1
        let mj2 = this.luoboArg[1] || -1
        var mjList = playerNode.getChildByName("in_mj").children
        for (var k = 0; k < 13; ++k) {
            let mjnode = mjList[k];
            mjnode.color = cc.Color.WHITE
            if (k < hidenum)
                mjnode.active = false;
            else {
                Utils.loadTextureFromLocal(mjnode.getChildByName("sp").getComponent(cc.Sprite),
                    "/card_mj/mj_" + sortHandMj[k - hidenum], function () { mjnode.active = true; });
                if(isluobo && (sortHandMj[k - hidenum] == mj1 || sortHandMj[k - hidenum] == mj2))
                {
                    mjnode.color = cc.Color.YELLOW
                }
            }
        }

        var mjPgNodeList = playerNode.getChildByName("pg_mj").children
        for (var i = 0; i < 4; ++i) {
            if (i < pgArray.length) {
                mjPgNodeList[i].active = true;
                for (var j = 0; j < pgArray[i].length; ++j) {
                    if (j < 4) {
                        let pgnode = mjPgNodeList[i].getChildByName("mj_" + j);
                        pgnode.color = cc.Color.WHITE
                        var cardId = pgArray[i][j]
                        if ((pgArray[i][5] == 15 || pgArray[i][5] == 6) && j == 3)
                            cardId = 0
                        if (cardId > 0)
                        {
                            Utils.loadTextureFromLocal(pgnode.getChildByName("sp").getComponent(cc.Sprite),
                            "/card_mj/mj_" + cardId, function () { pgnode.active = true; });
                            if(isluobo && (cardId == mj1 || cardId == mj2))
                            {
                                pgnode.color = cc.Color.YELLOW
                            }
                        }
                            
                        else if (cardId == 0) {
                            Utils.loadTextureFromLocal(pgnode.getComponent(cc.Sprite), "card_mj/mj_pg_2_b");
                            Utils.loadTextureFromLocal(pgnode.getChildByName("sp").getComponent(cc.Sprite), "", function () { pgnode.active = true; });
                            pgnode.active = true
                        } else{
                            pgnode.active = false;
                        }
                           
                    }
                }
            }
            else
                mjPgNodeList[i].active = false;
        }

    }

    playBackInitView(balanceInfo, playerInfoMap, rule, gameType, startTime, luoBoPais) {
        this.luoboColor = {}
        this.uiType = "playBack"
        this.initRule(rule, gameType)
        this.unschedule(this.loop)
        this.node.getChildByName("time").active = false
        this.node.getChildByName("timeBg").active = false
        this.node.getChildByName("btnMgr").getChildByName("btn_card_detail").active = true
        this.node.getChildByName("btnMgr").getChildByName("btn_continue").active = false
        this.node.getChildByName("label_time").getComponent(cc.Label).string = Utils.getTimeString(startTime * 1000)
        //this.node.getChildByName("label_fangHao").getComponent(cc.Label).string = "房号:" + this._gameData.gameinfo.roomId
        if (rule.union)
            this.isUnion = true
        else
            this.isUnion = false
        //显示萝卜的牌
        
        if (luoBoPais.length > 0) {
            this.showLuoBoPai(luoBoPais)
        }
        var tempMap = this.setBaseInfo(balanceInfo, playerInfoMap.get(0).seat, playerInfoMap.size)
        for (var index = 0; index < balanceInfo.length; index++) {
            var chairId = balanceInfo[index].chair_id
            var realSeat = getRealSeatByChaiId(chairId, playerInfoMap)
            var cardsCount = playerInfoMap.get(realSeat).inMj.length + playerInfoMap.get(realSeat).pgMj.length * 3
            if(tempMap.get(chairId))
            {
                 this.setHu(tempMap.get(chairId),chairId)
            }
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
            this.setPlayerInfo(chairId, info, isZhuang)
        }
        this.node.active = true;
        function getRealSeatByChaiId(chairId, playerInfoMap) {
            var reVlaue = -1
            playerInfoMap.forEach((infoObj, seat) => {
                if (infoObj.seat == chairId)
                    reVlaue = seat
            })
            return reVlaue
        }
    }

    private setHu(huTile,tempid)
    {
        //  let isluobo = this.luoboColor[tempid - 1]
        let mj1 = this.luoboArg[0] || -1
        let mj2 = this.luoboArg[1] || -1
        var playerNode = this.node.getChildByName("player" + (tempid - 1))      
        playerNode.getChildByName("mj_hu").color = cc.Color.WHITE
        if(huTile == mj1 || huTile == mj2)
        {
            playerNode.getChildByName("mj_hu").color = cc.Color.YELLOW
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
            gameData.gameinfo.curGameOverData = null
        }
        else {
            if (UIManager.getInstance().getUI(TuoGuanUI))
                return
            gameData.setGameState(GAME_STATE_MJ.GAME_CLOSE);
        }
        UIManager.getInstance().closeUI(ZgRoundOver_UI);
    }

    btn_card_detail() {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().closeUI(ZgRoundOver_UI);

    }

}
