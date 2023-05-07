import { GameManager } from './../../../GameManager';
import { MessageManager } from '../../../../framework/Manager/MessageManager';
import { cardChangPai, createCombinationList, createCombinationListByGameEnd, GAME_STATE_CP, ROUND_OVER_HU_TYPE_CP } from '../../../data/cp/cpDefines';
import { Utils } from '../../../../framework/Utils/Utils';
import { BaseUI } from "../../../../framework/UI/BaseUI";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { AudioManager } from "../../../../framework/Manager/AudioManager";
import TuoGuanUI from '../../TuoGuanUI';
import { CP_SECTION_TYPE } from '../../../../proto/proto';
import { PlayBackUI_CP } from '../playback/PlayBackUI_CP';
import { GameData_ZGCP } from '../../../data/cp/GameData_ZGCP';


const { ccclass, property } = cc._decorator;

@ccclass
export default class CpRoundOver_UI extends BaseUI {

    protected static className = "CpRoundOver_UI";
    @property(cc.SpriteFrame)
    spf_hu: cc.SpriteFrame[] = [];

    private time = 15

    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_CP_DIR + this.className;
    }

    start() {
    }
    onLoad() {

    }
    onDestroy() {
        super.onDestroy();
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
        //try {
        var gameData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType()
        if (!gameData.gameinfo.curRoundOverData) {
            UIManager.getInstance().closeUI(CpRoundOver_UI);
            return
        }

        this.initLayer()
        this.initRule(gameData.gameinfo.rule, GameDataManager.getInstance().curGameType)
        if (gameData.gameinfo.time != 0)
            this.time = gameData.gameinfo.time - 5
        //gameData.cleanRoundOver();
        if (UIManager.getInstance().getUI(TuoGuanUI) && gameData.gameinfo.curGameOverData == null) {
            this.continue_button()
            return
        }
        if (UIManager.getInstance().getUI(TuoGuanUI) && gameData.gameinfo.curGameOverData != null)
            UIManager.getInstance().closeUI(TuoGuanUI)
        // 有总结算数据的时候  小结算不显示倒计时
        if (gameData.gameinfo.curGameOverData) {
            this.node.getChildByName("time").active = false
            this.node.getChildByName("timeBg").active = false
        }
        else {
            this.node.getChildByName("time").getComponent(cc.Label).string = this.time + "s"
            this.schedule(this.loop, 1, this.time);
        }
    }

    /**初始化 */
    initLayer() {
        let gameData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType()
        let curRoundOverData = gameData.gameinfo.curRoundOverData;

        this.setMj();
        this.setPlayerItemInfo()

        for (var index = 0; index < curRoundOverData.players.length; index++) {
            var realSeat = this.getRealSeatByRemoteSeat(curRoundOverData.players[index].chairId)
            var tempInfo = gameData.overTempPlayerInfo.get(realSeat)
            this.setPlayerInfo(curRoundOverData.players[index].chairId, tempInfo, gameData.gameinfo.dealerId == tempInfo.id)
        }

        this.node.active = true;
        this.node.getChildByName("label_time").getComponent(cc.Label).string = Utils.getTimeString(GameDataManager.getInstance().systemData.severTime)
        this.node.getChildByName("label_fangHao").getComponent(cc.Label).string = "房号:" + gameData.gameinfo.roomId
    }

    private initRule(oRule, gameType) {
        var info = { rule: JSON.stringify(oRule), gameType: gameType }
        var rule1 = Utils.getBase(info);
        var rule2 = Utils.getRule(info);
        this.node.getChildByName("label_rule").getComponent(cc.Label).string = "玩法：" + rule1 + " " + rule2;
        if (oRule.union && oRule.union.score_rate) {
            this.node.getChildByName("label_basescore").getComponent(cc.Label).string = "底分：" + oRule.union.score_rate;
        }

    }

    public getRealSeatByRemoteSeat(seat) {
        let gameData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType()
        var playerNum = gameData.getCurTypePlayerNum()
        var myInfo = gameData.overTempPlayerInfo.get(0)
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

    private setMjTexture(node, mjid, isPlayBack: boolean = false) {
        if (isPlayBack) {
            UIManager.getInstance().getUI(PlayBackUI_CP).getComponent("PlayBackUI_CP").setMjTexture(node, mjid, 1)
        }
        else {
            cc.find("GameUI_CP/node_cardsMgr/player0", this.node.parent).getComponent("SelfCardControl_Cp").setMjTexture(node, mjid, 1)
        }
    }

    // 设置playerItem信息 坨数/胡番/胡牌类型/胡牌标志/分数
    private setPlayerItemInfo(curRoundOverDataPlayBack = null, playerInfoMap = null) {
        let gameData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType()
        let curRoundOverData = gameData ? gameData.gameinfo.curRoundOverData : curRoundOverDataPlayBack
        let playerBalance = curRoundOverData.playerBalance
        let players = curRoundOverData.players
        let isPlayBack: boolean = curRoundOverDataPlayBack ? true : false
        // 慌庄判断, 遍历所有玩家 所有玩家都没有胡 就是慌庄
        let isHuangZhuang = true
        for (let index = 0; index < playerBalance.length; index++) {
            if (playerBalance[index].hu) {
                isHuangZhuang = false
                break
            }
        }

        // 找到庄家ID 用于判断慌庄
        let chairIdZhuang = -1
        if (isHuangZhuang) {
            // 找个庄 这么难 擦
            if (isPlayBack) {
                playerInfoMap.forEach((playerInfo) => {
                    if (playerInfo.isZhuang == true) {
                        chairIdZhuang = playerInfo.seat
                    }
                })
            }
            else {
                for (var index = 0; index < curRoundOverData.players.length; index++) {
                    let viewID = this.getRealSeatByRemoteSeat(curRoundOverData.players[index].chairId)
                    let tempInfo = gameData.overTempPlayerInfo.get(viewID)
                    if (gameData.gameinfo.dealerId == tempInfo.id) {
                        chairIdZhuang = curRoundOverData.players[index].chairId
                        break
                    }
                }
            }
        }

        for (let index = 0; index < playerBalance.length; index++) {
            let chairId = playerBalance[index].chairId
            let hu = playerBalance[index].hu
            let huFan = playerBalance[index].huFan
            let items = playerBalance[index].items
            let baoting = playerBalance[index].baoting
            let isChipiao = players[index].isChipiao
            let isDianpao = players[index].isDianpao
            let isXiaohu = players[index].isXiaohu
            let tuos = players[index].tuos
            let isBaopai = players[index].isBaopai

            let roundScore = playerBalance[index].roundScore
            let roundMoney = playerBalance[index].roundMoney

            let playerNode = this.node.getChildByName("player" + index)
            let label_tuo = playerNode.getChildByName("label_tuo")
            let label_fan = playerNode.getChildByName("label_fan")
            let label_item = playerNode.getChildByName("label_item")
            let hu_order = playerNode.getChildByName("hu_order")
            let hu_dianpao = playerNode.getChildByName("hu_dianpao")
            let hu_huangzhuang = playerNode.getChildByName("hu_huangzhuang")
            let hu_baopai = playerNode.getChildByName("hu_baopai")
            let hu_tianhu = playerNode.getChildByName("hu_tianhu")
            let label_scoreWin = playerNode.getChildByName("label_scoreWin")
            let label_scoreLose = playerNode.getChildByName("label_scoreLose")

            hu_tianhu.active = false
            // 显示 胡/天胡
            if (hu) {
                hu_order.active = true
            }

            // 慌庄
            if (chairIdZhuang != -1 && chairIdZhuang == chairId && isHuangZhuang == true) {
                hu_huangzhuang.active = true
            }

            // 点炮
            if (isDianpao) {
                hu_dianpao.active = true
            }

            // 包牌
            if (isBaopai) {
                hu_baopai.active = true
            }

            //报
            if (baoting) {
                playerNode.getChildByName("sp_bao").active = true
            }

            // 显示胡番
            if (huFan) {
                label_fan.getComponent(cc.Label).string = huFan + "番"
                label_fan.active = true
            }

            // 显示坨数
            let str_tuoshu = ""
            if (isXiaohu) {
                str_tuoshu += "小胡"
            }

            if (isChipiao) {
                str_tuoshu += str_tuoshu == "" ? "吃飘" : " 吃飘"
            }

            if (str_tuoshu != "") {
                str_tuoshu += "\n\n"
            }

            if (tuos) {
                str_tuoshu += tuos + "坨"
            }

            label_tuo.getComponent(cc.Label).string = str_tuoshu
            label_tuo.active = true

            // 显示赢分
            if (roundMoney && roundMoney >= 0) {
                label_scoreWin.getComponent(cc.Label).string = "+" + (roundMoney / 100)
            }

            // 显示输分
            if (roundMoney && roundMoney < 0) {
                label_scoreLose.getComponent(cc.Label).string = "" + (roundMoney / 100)
            }

            // 慌庄时候 显示的分数
            if (isHuangZhuang == true || (!roundMoney)) {
                label_scoreLose.getComponent(cc.Label).string = "0"
            }

            // 显示胡牌类型
            if (items) {
                let str = ""
                for (let index_items = 0; index_items < items.length; index_items++) {
                    let element = items[index_items];
                    // 显示天胡/隐藏胡 icon
                    // if (2 == items[index_items].type) {
                    //     hu_order.active = false
                    //     hu_tianhu.active = true
                    // }

                    if (index_items > 0) {
                        str += "\n"
                    }

                    // 平胡不用显示数量
                    if (1 == items[index_items].type) {
                        str += `${ROUND_OVER_HU_TYPE_CP[element.type]}`
                    }
                    else {
                        str += `${ROUND_OVER_HU_TYPE_CP[element.type]}x${element.count}`
                    }
                }
                label_item.getComponent(cc.Label).string = str
                label_item.active = true
            }
        }
    }

    private setMj(curRoundOverDataPlayBack = null) {
        // seat 是chairID
        let gameData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType()
        for (let index = 0; index < 3; index++) {
            let playerNode = this.node.getChildByName("player" + index)
            playerNode.active = false
        }

        let isPlayBack: boolean = curRoundOverDataPlayBack ? true : false
        let node_qiepai = this.node.getChildByName("node_qiepai")

        let curRoundOverData = gameData ? gameData.gameinfo.curRoundOverData : curRoundOverDataPlayBack
        let players = curRoundOverData.players
        let playerBalance = curRoundOverData.playerBalance
        //let indexList:number[] = [1,16,3,20,20,5,6,6,7,19,10,11,12,4,14,15]
        let indexList: number[] = gameData ? gameData.gameinfo.qieCard : curRoundOverDataPlayBack.qie_pai

        for (let index = 0; index < players.length; index++) {
            let space = 4
            let space_handcard = 3
            let pos_x = -318
            let pos_y = -70
            let cardItem = this.node.getChildByName("cardItem")
            let card_w = 40

            let playerNode = this.node.getChildByName("player" + index)
            let pbMingPai = players[index].pbMingPai
            let shouPai = players[index].shouPai
            let hu = playerBalance[index].hu
            let huTile = playerBalance[index].huTile

            // 先绘制吃碰杠
            for (let index_cpg = 0; index_cpg < pbMingPai.length; index_cpg++) {
                let element = pbMingPai[index_cpg];
                let cardNode = cc.instantiate(cardItem)
                cardNode.parent = playerNode
                cardNode.active = true
                pos_x += index_cpg == 0 ? 0 : card_w + space
                cardNode.position = cc.v3(pos_x, pos_y)
                // 吃
                if (CP_SECTION_TYPE.Chi == element.type) {
                    let card0 = cardNode.getChildByName("card0")
                    card0.active = true
                    this.setMjTexture(card0, element.tile, isPlayBack)
                    //element.othertile  // 被吃的一张牌
                    let card1 = cardNode.getChildByName("card1")
                    card1.active = true
                    this.setMjTexture(card1, element.othertile, isPlayBack)
                }
                // 碰
                else if (CP_SECTION_TYPE.Peng == element.type) {
                    for (let i = 0; i < 3; i++) {
                        let card = cardNode.getChildByName("card" + i)
                        card.active = true
                        this.setMjTexture(card, element.tile, isPlayBack)
                    }
                }
                // 偷
                else if (CP_SECTION_TYPE.Tou == element.type) {
                    for (let i = 0; i < 3; i++) {
                        let card = cardNode.getChildByName("card" + i)
                        card.active = true
                        this.setMjTexture(card, element.tile, isPlayBack)
                    }
                }
                // 巴
                else if (CP_SECTION_TYPE.Gang == element.type) {
                    for (let i = 0; i < 4; i++) {
                        let card = cardNode.getChildByName("card" + i)
                        card.active = true
                        this.setMjTexture(card, element.tile, isPlayBack)
                    }
                }
            }

            // 增加间隔, 当没有吃碰的时候 位置被偏移
            if (pos_x != -318 || pbMingPai.length == 1) {
                pos_x += space
                pos_x += card_w
            }
            // 绘制已经打出的牌
            // 绘制手牌
            // 将形成组合的牌 两两成列
            if (huTile && huTile != 0) {
                // 将被胡的那张牌附加到 手牌牌组中
                shouPai[shouPai.length] = huTile
            }

            // 构建组合
            let isShowHu = false  // 有可能会有两个玩家同时胡的情况
            // 断点查看一下手牌情况
            let combinationList = createCombinationListByGameEnd(shouPai)
            combinationList.forEach((element) => {
                let cardNode = cc.instantiate(cardItem)
                cardNode.active = true
                cardNode.parent = playerNode
                pos_x += card_w + space_handcard
                cardNode.position = cc.v3(pos_x, pos_y)

                for (let index = 0; index < element.length; index++) {
                    let cpObj = element[index];
                    let card = cardNode.getChildByName("card" + index)
                    card.active = true

                    this.setMjTexture(card, cpObj.cardIndex, isPlayBack)
                    // 显示胡的那一张牌
                    if (huTile && huTile != 0 && cpObj.cardIndex == huTile && isShowHu == false) {
                        card.getChildByName("img_hu").active = true
                        isShowHu = true // 如果遇到胡牌是7的情况 则需要这样判断
                    }
                }
            })
        }

        if (players.length > 2) return

        // 如果只有两个玩家  将会切一副牌出来, 结算时 暂时在第三个玩家手牌区域

        let cardItem_qiepai = this.node.getChildByName("cardItem_qiepai")
        let combinationList = new Map<number, Array<cardChangPai>>()
        combinationList = createCombinationList(indexList)

        let space = -5
        let card_index = 0
        let pos_x = -442
        let card_w = 40
        combinationList.forEach((element) => {
            let cardNode = cc.instantiate(cardItem_qiepai)
            cardNode.parent = node_qiepai
            cardNode.active = true
            //pos_x += card_w
            pos_x += card_index == 0 ? 0 : card_w + space
            cardNode.position = cc.v3(pos_x, 0)
            for (let index_line = 0; index_line < element.length; index_line++) {
                let cardInfo = element[index_line];
                let card = cardNode.getChildByName("card" + index_line)
                card.active = true
                this.setMjTexture(card, cardInfo.cardIndex, isPlayBack)
            }
            card_index++
        })
    }

    playBackInitView(balanceInfo, playerInfoMap, rule, gameType, startTime, gameEndInfo) {


        let players = []
        let playerBalance = []
        for (let index = 0; index < gameEndInfo.balance.length; index++) {
            let tmpData_playerBalance = {
                chairId: gameEndInfo.balance[index].chair_id,
                hu: gameEndInfo.balance[index].hu,
                huFan: gameEndInfo.balance[index].hu_fan,
                totalScore: gameEndInfo.balance[index].total_score,
                roundScore: gameEndInfo.balance[index].round_score,
                items: gameEndInfo.balance[index].items,
                baoting: balanceInfo[index].baoting,

                status: gameEndInfo.balance[index].status,
                huTile: gameEndInfo.balance[index].hu_tile,
                huIndex: gameEndInfo.balance[index].hu_index,
                roundMoney: gameEndInfo.balance[index].round_money,
                totalMoney: gameEndInfo.balance[index].total_money,
            }

            let tmpData_players = {
                chairId: gameEndInfo.players[index].chair_id,
                isChipiao: gameEndInfo.players[index].is_chipiao,
                isDianpao: gameEndInfo.players[index].is_dianpao,
                isXiaohu: gameEndInfo.players[index].is_xiaohu,
                tuos: gameEndInfo.players[index].tuos,
                pbMingPai: gameEndInfo.players[index].pai.ming_pai,
                shouPai: gameEndInfo.players[index].pai.shou_pai,
                isBaopai: gameEndInfo.players[index].pai.is_baopai,
            }

            playerBalance[index] = tmpData_playerBalance
            players[index] = tmpData_players
        }

        let curRoundOverData = { qie_pai: gameEndInfo.qie_pai, players: players, playerBalance: playerBalance }

        this.initRule(rule, gameType)
        this.unschedule(this.loop)
        this.node.getChildByName("time").active = false
        this.node.getChildByName("timeBg").active = false
        this.node.getChildByName("btnMgr").getChildByName("btn_card_detail").active = true
        this.node.getChildByName("btnMgr").getChildByName("btn_continue").active = false
        this.node.getChildByName("label_time").getComponent(cc.Label).string = Utils.getTimeString(startTime * 1000)
        //this.node.getChildByName("label_fangHao").getComponent(cc.Label).string = "房号:" + this._gameData.gameinfo.roomId
        this.setMj(curRoundOverData);
        this.setPlayerItemInfo(curRoundOverData, playerInfoMap)

        for (var index = 0; index < balanceInfo.length; index++) {
            var chairId = balanceInfo[index].chair_id
            var realSeat = getRealSeatByChaiId(chairId, playerInfoMap)
            // if (cardsCount == 14 || cardsCount == 8 || cardsCount == 11)
            //     this.removeCard(playerInfoMap.get(realSeat).inMj, tempMap.get(chairId))
            //this.setMj(chairId, playerInfoMap.get(realSeat).inMj, playerInfoMap.get(realSeat).pgMj);

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

    //分享按钮
    share_button() {
        AudioManager.getInstance().playSFX("button_click")
        return
    }

    //继续游戏按钮
    continue_button() {
        AudioManager.getInstance().playSFX("button_click")
        var gameData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType()
        gameData.cleanRoundOver();
        if (gameData.gameinfo.curGameOverData == null) {
            gameData.setGameState(GAME_STATE_CP.PER_BEGIN);
        }
        else {
            // if (UIManager.getInstance().getUI(TuoGuanUI))
            //     return
            gameData.setGameState(GAME_STATE_CP.GAME_CLOSE);
        }
        UIManager.getInstance().closeUI(CpRoundOver_UI);
    }

    btn_card_detail() {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().closeUI(CpRoundOver_UI);

    }
}
