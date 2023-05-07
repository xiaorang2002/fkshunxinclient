import { Utils } from './../../../../framework/Utils/Utils';
import { CardEffect } from './../pdk/CardEffect';
import { PDKCheckCardType } from './../../../data/game_pdk/PDKCheckCardType';
import { ShowRuleUI } from './../rule/ShowRuleUI';
import { GAME_TYPE, ConstValue } from './../../../data/GameConstValue';
import { UIManager } from "../../../../framework/Manager/UIManager";
import { BaseUI } from "../../../../framework/UI/BaseUI";
import { AudioManager } from "../../../../framework/Manager/AudioManager";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import PdkRoundOver_UI from '../pdk/PdkRoundOver_UI';


// 出牌类型(跑得快)
enum PDK_CARD_TYPE {
	ERROR                    = 0,                                //错误类型
	SINGLE                   = 1,                                //单牌类型
	LAIZI_SINGLE 			 = 2,
	DOUBLE                   = 3,                                //对牌类型
	LAIZI_DOUBLE 			 = 4,
	THREE                    = 5,                                //三不带
	LAIZI_THREE				 = 6,
	THREE_WITH_ONE           = 7,                          	//三带一
	THREE_WITH_TWO           = 8,                          //三带一对
	FOUR_WITH_SINGLE         = 9,                          	//四带二
	FOUR_WITH_DOUBLE         = 10,                          	//四带一对
	FOUR_WITH_THREE 		 = 11,
	FOUR					 = 12,
	LAIZI_FOUR				 = 13,
	SINGLE_LINE              = 14,                                	//顺子
	DOUBLE_LINE              = 15,                                //连对
	PLANE                    = 16,                               //飞机 不带
	PLANE_WITH_ONE           = 17,                               //飞机 带牌 单
    PLANE_WITH_TWO           = 18,                               //飞机 带牌 对
    PLANE_WITH_MIX 			 = 19,
	SOFT_TRIPLE_BOMB 		 = 20,
	TRIPLE_BOMB 			 = 21,			//三张炸弹
	LAIZI_TRIPLE_BOMB		 = 22,			//三张癞子炸弹
	SOFT_BOMB 				 = 23,
	BOMB                     = 24,          //炸弹
	LAIZI_BOMB				 = 25,			//癞子炸弹
	MISSLE 					 = 26,
}

const { ccclass, property } = cc._decorator;
@ccclass
export class PlayBackUI_PDK extends BaseUI {
    protected static className = "PlayBackUI_PDK";

    @property(cc.Layout)
    myCardsLayout: cc.Layout = null;

    private gameRule = null;                // 游戏规则
    private zhuang = 0;
    private _playerInfoMap= new Map();      // 本局游戏数据
    private _playerCardMap = new Map();     // 本局玩家的牌node
    private playerNum = 0                   // 玩家人数
    private controlSeat = -1                // 当前轮到谁了
    private gameType = 0                   // 游戏类型
    private acitonTable = null              // 本局操作集合
    private curStep = 0;
    private playTime = 2;
    private balanceInfo = [];
    private curRound = null;
    private cardNum = 0
    private speed = 2                       // 回放速度
    private myId = 0
    private startTime = 0
    private roomId = 0

    private isPlay = false;             // 是否开始回放
    private isCall = false;             // 是否开始叫地主阶段
    private callTable = null              // 叫地主操作集合 
    private landlordCards = []          // 地主底牌
    private baseScore = 1               // 底分
    private times = 1                   // 倍数
    private landlordId = 0              // 地主是谁
    private addSize = 0

    private lastOutCards = null;
    private lastOutSeat = -1;
    private timeNodePos = [[0,-17], [360,155], [179,262],[-360,155]]
    private readonly shuiYinMap = {210:0, 211:1, 212:2, 220:3}


    @property([cc.SpriteFrame])
    stageSp: cc.SpriteFrame[] = [];
    @property([cc.SpriteFrame])
    shuiyin_spf: cc.SpriteFrame[] = [];

    onLoad() {
        
    }

    start() {
        var contentSize = this.node.getContentSize()
        this.addSize = contentSize.width - ConstValue.SCREEN_W
        var playerNode = this.node.getChildByName("player_info").getChildByName("player" + 0)
        playerNode.getChildByName("stage").position = cc.v3(this.addSize/2,-131)
        this.updateSelfCardSize()
    }
    //时间刷新初始化
    initTime() {
        this.schedule(this.loop.bind(this), 0.25);
    }

    private loop()
    {
        //播放时间
        if (this.isPlay || this.isCall)
        {
            this.playTime -= 0.25;

            this.node.getChildByName("jishi").getChildByName("time").getComponent(cc.Label).string = Math.ceil(this.playTime) + "s"
        }
        if (this.playTime <= 0) {
            this.playTime = this.speed
            if (this.isPlay)
                this.doActiton()
            if (this.isCall)
                this.doCall()
        }
    }

    public getRealSeatByRemoteSeat(seat)
    {
        var myInfo = this._playerInfoMap.get(0)
        var offset = myInfo.realSeat - myInfo.seat
        var otherRealSeat = (seat + offset + this.playerNum)%this.playerNum
        var seatMap = []
        if (this.playerNum == 3) // 3人坐0,1,3号位
            seatMap = [0,1,3]
        else if (this.playerNum == 2) // 2人坐0,2
            seatMap = [0,2]
        else if (this.playerNum == 4)
            seatMap = [0,1,2,3,4]
        return seatMap[otherRealSeat]
    }

    initView(type, info, playerID)
    {
        try{
            this.myId = playerID
            this.gameRule = info.rule;
            this.zhuang = info.zhuang
            this.playerNum = info.players.length
            this.curStep = 0;
            this.lastOutCards = 0;
            this.lastOutSeat = -1;
            this.gameType = type
            this.acitonTable = info.actions
            this.playTime = 2;
            this.curRound = info.cur_round
            this.startTime = info.start_game_time
            this.roomId = info.table_id
            if (this.gameType == GAME_TYPE.LRPDK)
                this.cardNum = 16
            else if (this.gameType == GAME_TYPE.PDK)
                this.cardNum = this.gameRule.play.card_num
            else if (this.gameType == GAME_TYPE.SCPDK)
                this.cardNum = 10
            else
                this.cardNum = 17
            this.initPlayerInfo(info)
            this.initPlayerCard()
            this.updateTableView()
            this.initTime()
            this.setTopUI()
            this.initShuiYin()
            this.node.getChildByName("btn_play").active = false
            this.node.getChildByName("btn_pause").active = true
            this.node.getChildByName("btn_over").active = false
            if(this.gameType == GAME_TYPE.DDZ)
            {
                this._playerInfoMap.forEach((infoObj, seat)=>{
                    var data = {
                        chairId: infoObj.seat,
                        roundScore: infoObj.roundScore,
                        roundMoney: infoObj.roundMoney,
                        baseScore: info.base_score,
                        times: info.base_times,
                    }
                    this.balanceInfo.push(data)
                })
                this.isCall = true;
                this.callTable = info.landlord_compete
                this.landlordCards = info.landlord_cards
                this.times = info.base_times
                this.baseScore = info.base_score
                this.landlordId = info.landlord
                var targetStr = "node_ddz_top"
                if (this.playerNum == 2)
                    targetStr = "node_ddz_right"
                this.node.getChildByName(targetStr).active = true
                var firstChairId = this.getNextTurn()
                var firstPlaySeat = this.getRealSeatByRemoteSeat(firstChairId)
                this.onPlayerTurn(firstPlaySeat)
            }
            else{
                this.initBalanceInfo()
                var firstChairId = this.getNextTurn()
                var firstPlaySeat = this.getRealSeatByRemoteSeat(firstChairId)
                this.onPlayerTurn(firstPlaySeat)
                this.isPlay = true;
            }
            if (this.gameType == GAME_TYPE.LRPDK && info.left_cards)
            {
                this.initLeftCards(info.left_cards)
                this.node.getChildByName("left_cards").active = true
            }
            else if (this.gameType == GAME_TYPE.DDZ && info.left_cards)
            {
                this.initLeftCards(info.left_cards)
                this.node.getChildByName("left_cards").active = true
            }
        }
        catch(e) {
            console.log(e)
        }
       
    }

    setTopUI()
    {
        this.node.getChildByName("label_room_id").getComponent(cc.Label).string = this.roomId.toString()
        this.node.getChildByName("label_time").getComponent(cc.Label).string = Utils.formatDate(this.startTime, 1)
    }

    private initShuiYin() {
        var shuiYinIdx = this.shuiYinMap[this.gameType]
        if (typeof shuiYinIdx != "number")
            return
        this.node.getChildByName("shuiyin").getComponent(cc.Sprite).spriteFrame = this.shuiyin_spf[shuiYinIdx]
        this.node.getChildByName("shuiyin").active = true
    }

    initPlayerInfo(info)
    {
        var isFind = false
        for (var idx = 0; idx < this.playerNum; idx++)
        {
            var playerInfo = info.players[idx]
            if (playerInfo.guid == this.myId)
                isFind = true
        }
        if (!isFind) // 没有找到自己的座位
            this.myId = info.players[0].guid
        for (var idx = 0; idx < this.playerNum; idx++)
        {
            var playerInfo = info.players[idx]
            var cards = playerInfo.deal_cards.sort(function (a, b) {return a - b})
            Utils.pdkWenDingSort(cards)
            cards = Utils.sortWithLaiZi(cards)
            if (playerInfo.guid == this.myId){
                var totalMoney = playerInfo.totalMoney
                if (playerInfo.total_money)
                    totalMoney = playerInfo.total_money
                var finalMsg = {
                    realSeat: 0,
                    seat: idx + 1,
                    id: playerInfo.guid,
                    name: playerInfo.nickname,
                    head: playerInfo.head_url,
                    sex: playerInfo.sex,
                    isZhuang: false,
                    isOnline: true,
                    isTrustee: false,
                    roundScore: playerInfo.score,
                    totalScore: playerInfo.total_score,
                    roundMoney: playerInfo.round_money,
                    totalMoney: totalMoney,
                    inCards: cards,
                    outCards: [],
                    bombScore:playerInfo.bomb_score
                }
                this._playerInfoMap.set(0, finalMsg);
            }
        }
        for (var idx = 0; idx < this.playerNum; idx++)
        {
            var playerInfo = info.players[idx]
            var cards = playerInfo.deal_cards.sort(function (a, b) {return a - b})
            Utils.pdkWenDingSort(cards)
            cards = Utils.sortWithLaiZi(cards)
            if (playerInfo.guid != this.myId){
                var totalMoney = playerInfo.totalMoney
                if (playerInfo.total_money)
                    totalMoney = playerInfo.total_money
                var realSeat = this.getRealSeatByRemoteSeat(idx + 1)
                var finalMsg = {
                    realSeat: 0,
                    seat: idx + 1,
                    id: playerInfo.guid,
                    name: playerInfo.nickname,
                    head: playerInfo.head_url,
                    sex: playerInfo.sex,
                    isZhuang: false,
                    isOnline: true,
                    isTrustee: false,
                    roundScore: playerInfo.score,
                    totalScore: playerInfo.total_score,
                    roundMoney: playerInfo.round_money,
                    totalMoney: totalMoney,
                    inCards: cards,
                    outCards: [],
                    bombScore:playerInfo.bomb_score
                }
                this._playerInfoMap.set(realSeat, finalMsg);
            }
        }
        this._playerInfoMap.forEach((infoObj, seat)=>{
            var playerNode = this.node.getChildByName("player_info").getChildByName("player" + seat)
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).active = true
            var spHead = playerNode.getChildByName("sp").getComponent(cc.Sprite)
            Utils.loadTextureFromNet(spHead, infoObj.head)
            playerNode.getChildByName("label_name").getComponent(cc.Label).string = infoObj.name
            playerNode.getChildByName("score").getComponent(cc.Label).string = (infoObj.totalMoney/100).toString()
            playerNode.active = true
        })
    }

    pdkSort(cards)
    {
        //接下来我们用冒泡排序的方法来给这个数组排序
        for(let i=0;i<cards.length-1;i++){
            for(let j=0;j<cards.length-1-i;j++){
                if(Utils.getPdkCardValue(cards[j]) > Utils.getPdkCardValue(cards[j+1])){
                //如果这一项比后一项大就交换位置了
                let tmp = cards[j]
                cards[j] = cards[j+1]
                cards[j+1] = tmp
                }
            }
        }
    }

    // 加载第三方牌
    initLeftCards(cards) {
        cards = cards.sort(function (a, b) {return a - b})
        Utils.pdkWenDingSort(cards)
        for (var i = 0; i < cards.length; i++)
        {
            var textureId = Utils.getPdkColorAndMjTextureId(cards[i])
            var cardNode = this.node.getChildByName("left_cards").getChildByName("cards").getChildByName("card"+i)
            Utils.loadTextureFromLocal(cardNode.getComponent(cc.Sprite), "/cards/card_s_" + textureId);
            cardNode.active = true;
        }
        
    }

    private initPlayerCard()
    {
        this._playerInfoMap.forEach((infoObj, seat)=>{
            var playerNode = this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat)
            var handCards = [];
            var outCards = [];
            if(this.gameType == GAME_TYPE.SCPDK && seat != 0)
                this.updateCardsView(seat)
            else
            {
                for (var i = 0; i < 20; i++) {
                    handCards.push(playerNode.getChildByName("cards").getChildByName("card" + i));
                    handCards[i].active = false;
                }
                for (var i = 0; i < 20; i++) {
                    outCards.push(playerNode.getChildByName("outcards").getChildByName("card" + i));
                    outCards[i].active = false;
                }
                var info = {
                    pdkInArray : handCards,
                    pdkOutArray : outCards,
                }
                this._playerCardMap.set(seat, info)
            }
        })
    }

    private updateCardsView(seat)
    {
        var handCards = [];
        var outCards = [];
        var playerNode = this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat)
        // 4人显示不同
        if (this.playerNum == 4)
        {
            if(seat == 1 || seat == 3)
            {
                playerNode.getChildByName("cards").active = false;
                playerNode.getChildByName("outcards").active = false;
                playerNode.getChildByName("cards_10").active = true;
                playerNode.getChildByName("outcards_10").active = true;
                for (var i = 0; i < 10; i++) {
                    outCards.push(playerNode.getChildByName("outcards_10").getChildByName("card" + i));
                    outCards[i].active = false;
                }
                for (var i = 0; i < 10; i++) {
                    handCards.push(playerNode.getChildByName("cards_10").getChildByName("card" + i));
                    handCards[i].active = false;
                }
            }
            else
            {
                playerNode.getChildByName("cards").active = false;
                playerNode.getChildByName("outcards").active = true;
                playerNode.getChildByName("cards_10").active = true;
                for (var i = 0; i < 20; i++) {
                    outCards.push(playerNode.getChildByName("outcards").getChildByName("card" + i));
                    outCards[i].active = false;
                }
                for (var i = 0; i < 10; i++) {
                    handCards.push(playerNode.getChildByName("cards_10").getChildByName("card" + i));
                    handCards[i].active = false;
                }
            }
        }
        else
        {
            if(seat == 1 || seat == 3)
            {
                playerNode.getChildByName("cards").active = true;
                playerNode.getChildByName("outcards").active = false;
                playerNode.getChildByName("outcards_10").active = true;
                for (var i = 0; i < 10; i++) {
                    outCards.push(playerNode.getChildByName("outcards_10").getChildByName("card" + i));
                    outCards[i].active = false;
                }
                for (var i = 0; i < 20; i++) {
                    handCards.push(playerNode.getChildByName("cards").getChildByName("card" + i));
                    handCards[i].active = false;
                }
            }
            else
            {
                playerNode.getChildByName("cards").active = true;
                playerNode.getChildByName("outcards").active = true;
                for (var i = 0; i < 20; i++) {
                    outCards.push(playerNode.getChildByName("outcards").getChildByName("card" + i));
                    outCards[i].active = false;
                }
                for (var i = 0; i < 20; i++) {
                    handCards.push(playerNode.getChildByName("cards").getChildByName("card" + i));
                    handCards[i].active = false;
                }
            }
        }
        var info = {
            pdkInArray : handCards,
            pdkOutArray : outCards,
        }
        this._playerCardMap.set(seat, info)
    }

    updatePlayerCardLayout(cardNum)
    {
        var width = this.node.getContentSize().width
        this.addSize = width - ConstValue.SCREEN_W
        var cardWith = 186
        if(this.addSize > 250)
            cardWith = 193.8
        if (cardNum < 15)
            cardNum = 15
        var spacing = cardWith - (width - cardWith) /(cardNum - 1) 
        if (this.myCardsLayout.spacingX == spacing)
            return
        this.myCardsLayout.spacingX = -1*spacing
        this.myCardsLayout.updateLayout()
    }

    updateSelfCardSize() {
        var width = this.node.getContentSize().width
        this.addSize = width - ConstValue.SCREEN_W
        if(this.addSize>250)
        {
            var cardsNode = this.node.getChildByName("node_cardsMgr").getChildByName("player0").getChildByName("cards")
            for (var child of cardsNode.children)
            {
                child.scale = 1.25
            }
        }
    }


    private updateTableView()
    {
        this._playerInfoMap.forEach((infoObj, seat)=>{
            this.handCardsChange(seat);
            this.setCardNum(seat)
        })
    }

    setCardNum(seat)
    {
        if (seat == 0)
            return
        var cardsArray = this._playerInfoMap.get(seat).inCards;
        var playerNode = this.node.getChildByName("player_info").getChildByName("player" + seat)
        playerNode.getChildByName("label_num").active = true
        playerNode.getChildByName("card_num").active = true
        playerNode.getChildByName("label_num").getComponent(cc.Label).string = cardsArray.length.toString()
    }

    //刷新手牌麻将的显示(整体刷新)
    handCardsChange(realSeat) {
        if (realSeat == 1 || realSeat == 2)
        {
            var cardsArray = JSON.parse(JSON.stringify(this._playerInfoMap.get(realSeat).inCards));
            this.pdkSort(cardsArray) // 由于显示问题，1号位玩家的牌序应该是从小到大显示
            cardsArray = Utils.sortWithLaiZi(cardsArray,true)
        }
        else
        {
            var cardsArray = this._playerInfoMap.get(realSeat).inCards;
        }
        var inCardsNodeList = this._playerCardMap.get(realSeat).pdkInArray
        var textureType = "common"
        if (realSeat == 0)
            this.updatePlayerCardLayout(cardsArray.length)
        if (realSeat != 0)
            var textureType = "small"
        for (var i = 0; i < inCardsNodeList.length; ++i) {
            inCardsNodeList[i].y = 0;
            inCardsNodeList[i].color = cc.Color.WHITE;
            inCardsNodeList[i].removeAllChildren();
            if (i < cardsArray.length)
                this.setCardTexture(inCardsNodeList[i], cardsArray[i], textureType);
            else
                this.setCardTexture(inCardsNodeList[i], -1);
        }
    }


    //刷新出牌
    private outCardsChange(realSeat) {
        if (realSeat == 1)
        {
            var cardsArray = JSON.parse(JSON.stringify(this._playerInfoMap.get(realSeat).outCards));
            this.pdkSort(cardsArray) // 由于显示问题，1号位玩家的牌序应该是从小到大显示
            cardsArray = PDKCheckCardType.getSortedOutCards(cardsArray, true)
        }
        else
        {
            var cardsArray = this._playerInfoMap.get(realSeat).outCards;
        }
        var outCardsNodeList = this._playerCardMap.get(realSeat).pdkOutArray
        for (var i = 0; i < outCardsNodeList.length; ++i) {
            if (i < cardsArray.length)
                this.setCardTexture(outCardsNodeList[i], cardsArray[i]);
            else
                this.setCardTexture(outCardsNodeList[i], -1);

            outCardsNodeList[i].removeAllChildren();
        }
    }

    //移除对应手牌
    removeHandCards(handCards, cards) {

        for(var cardId of cards)
            {
                var idx = handCards.indexOf(cardId)
                if (idx >= 0)
                    handCards.splice(idx, 1);
            }
    }

    private setDdzLandlordCards()
    {
        for (var i =1; i<4; i++)
        {
            var cardId = 0
            var targetStr = "node_ddz_top"
            if (this.playerNum == 2)
                targetStr = "node_ddz_right"
            var sprite = this.node.getChildByName(targetStr).getChildByName("card_di"+i).getComponent(cc.Sprite)
            if (this.landlordCards.length != 0)
            {
                cardId = this.landlordCards[i-1]
                var textureId = Utils.getPdkColorAndMjTextureId(cardId)
            }
            else
            {
                textureId = 0
            }
            Utils.loadTextureFromLocal(sprite, "/cards/card_s_" + textureId);
        }
    }

    private updateDdzTopView()
    {
        var landlordSeat = this.getRealSeatByRemoteSeat(this.landlordId)
        var newCards = this._playerInfoMap.get(landlordSeat).inCards.concat(this.landlordCards)
        var cards = newCards.sort(function (a, b) {return a - b})
        Utils.pdkWenDingSort(cards)
        this._playerInfoMap.get(landlordSeat).inCards = cards
        this.handCardsChange(landlordSeat)
        this.setCardNum(landlordSeat)
        this._playerInfoMap.forEach((infoObj, seat)=>{
            this.node.getChildByName("player_info").getChildByName("player" + seat).getChildByName("ddz_dz").active = landlordSeat == seat
            this.node.getChildByName("player_info").getChildByName("player" + seat).getChildByName("ddz_nm").active = landlordSeat != seat
        })
        this.setDdzLandlordCards()
        var targetStr = "node_ddz_top"
        if (this.playerNum == 2)
            targetStr = "node_ddz_right"
        var topNode = this.node.getChildByName(targetStr)
        topNode.getChildByName("label_times").getComponent(cc.Label).string = this.times.toString()
        topNode.getChildByName("label_score").getComponent(cc.Label).string = this.baseScore.toString()
    }

    /**玩家是否在线 */
    public setPlayerOnline(seat)
    {
        var onlineNode = this.node.getChildByName("player_info").getChildByName("player" + seat).getChildByName("online")
        onlineNode.active = !this._playerInfoMap.get(seat).isOnline;
    }

    public setTrustee(seat)
    {
        var tuoguanNode = this.node.getChildByName("player_info").getChildByName("player" + seat).getChildByName("tuoguanTip")
        tuoguanNode.active = this._playerInfoMap.get(seat).isTrustee;
    }


    private doCall()
    {
        // -4:不叫 -3:不抢  -1:抢地主 -2:叫地主  1:1分 2:2分 3:3分  
        if (!this.isCall)
            return
        if (this.curStep <= (this.callTable.length - 1))
        {
            var callInfo = this.callTable[this.curStep]
            var realSeat = this.getRealSeatByRemoteSeat(callInfo.chair_id)
            this.setStage(realSeat, callInfo.action)
            if (this.callTable.length > this.curStep+1)
            {   
                var nextPlayChairId = this.callTable[this.curStep + 1].chair_id
                var nextPlaySeat = this.getRealSeatByRemoteSeat(nextPlayChairId)
                this.node.getChildByName("player_info").getChildByName("player" + nextPlaySeat).getChildByName("stage").active = false
                this.onPlayerTurn(nextPlaySeat)
            }
            if (this.curStep == (this.callTable.length - 1))
            {
                this.unscheduleAllCallbacks()
                this.isPlay = true
                this.isCall = false
                this.curStep = 0
                this.playTime = 2
                this.updateDdzTopView()
                this._playerInfoMap.forEach((infoObj, seat)=>{
                    this.node.getChildByName("player_info").getChildByName("player" + seat).getChildByName("stage").active = false
                })
                this.initTime()
                return
            }
        }
        this.curStep += 1
    }

    private replaceLaZiCards(outCards, replaceList)
    {
        var copyCards = JSON.parse(JSON.stringify(outCards))
        for(var idx = 0; idx < copyCards.length; idx++)
        {
            if (Math.floor(copyCards[idx]/20) == 4 && replaceList.length > 0)
                copyCards[idx] = replaceList.pop()
        }
        return copyCards
    }
    


    private doActiton()
    {
        if (!this.isPlay)
            return
        var actionInfo = this.acitonTable[this.curStep]
        if (actionInfo && actionInfo.action == 2) // 出牌
        {
            var realSeat = this.getRealSeatByRemoteSeat(actionInfo.chair_id) 
            var outType = 2
            if (this.lastOutSeat == realSeat || this.lastOutSeat == -1)
                outType = 3
            var outCards = actionInfo.cards
            var afterReplaceCards = [] // 替换癞子之后的牌
            if(actionInfo.laizi_replace && actionInfo.laizi_replace.length > 0)
            {
                afterReplaceCards = this.replaceLaZiCards(outCards, actionInfo.laizi_replace)
            }
            this.lastOutSeat = realSeat
            if(afterReplaceCards.length > 0)
                this.lastOutCards = afterReplaceCards
            else
                this.lastOutCards = outCards
            this.removeHandCards(this._playerInfoMap.get(realSeat).inCards, actionInfo.cards) 
            if(afterReplaceCards.length > 0)
                this._playerInfoMap.get(realSeat).outCards = afterReplaceCards
            else
                this._playerInfoMap.get(realSeat).outCards = outCards
            this.handCardsChange(realSeat)
            this.outCardsChange(realSeat)
            this.setCardNum(realSeat)
            var cardType = this.getClientCardTypeByGameTpe(actionInfo.cards_type)
            if(afterReplaceCards.length > 0)
                this.onPlayCardsVoice({type:outType, cardType:cardType, cards:afterReplaceCards, seat:realSeat})
            else
                this.onPlayCardsVoice({type:outType, cardType:cardType, cards:outCards, seat:realSeat})
            this.checkAni(realSeat, cardType)
            if (cardType == 13 && this.gameType == GAME_TYPE.DDZ) // 炸弹
            {   
                this.times *= 2
                var targetStr = "node_ddz_top"
                if (this.playerNum == 2)
                    targetStr = "node_ddz_right"
                var topNode = this.node.getChildByName(targetStr)
                topNode.getChildByName("label_times").getComponent(cc.Label).string = this.times.toString()
            }
        }
        else if (actionInfo && actionInfo.action == 1) { // 不要
            var realSeat = this.getRealSeatByRemoteSeat(actionInfo.chair_id)
            this.setStage(realSeat, -5)
            this.onPlayCardsVoice({type:1, cardType:0, cards:[], seat:realSeat})
            
        }
        else if (actionInfo.act == "Trustee")
        {
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            if (actionInfo.trustee)
                this._playerInfoMap.get(seat).isTrustee = true;
            else
                this._playerInfoMap.get(seat).isTrustee = false;
            this.setTrustee(seat)
            this.curStep += 1
            this.doActiton()
            return
        }
        else if(actionInfo.act == "Offline")
        {
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            this._playerInfoMap.get(seat).isOnline = false;
            this.setPlayerOnline(seat)
            this.curStep += 1
            this.doActiton()
            return
        }
        else if(actionInfo.act == "Reconnect")
        {
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            this._playerInfoMap.get(seat).isOnline = true;
            this.setPlayerOnline(seat)
            this.curStep += 1
            this.doActiton()
            return
        }
        
        if (this.acitonTable.length > this.curStep+1)
        {   
            var nextPlayChairId = this.getNextTurn()
            if (nextPlayChairId != 0)
            {
                var nextPlaySeat = this.getRealSeatByRemoteSeat(nextPlayChairId)
                this.onPlayerTurn(nextPlaySeat)
            }
        }
        this.curStep += 1
        if (this.acitonTable.length < this.curStep+1)
        {
            this.unscheduleAllCallbacks()
            this.node.getChildByName("btn_play").active = false
            this.node.getChildByName("btn_pause").active = false
            this.node.getChildByName("playback_left").active = false
            this.node.getChildByName("playback_right").active = false
            this.node.getChildByName("label_speed").active = false
            this.node.getChildByName("btn_over").active = true
            this.node.getChildByName("jishi").active = false
            if (this.gameType == GAME_TYPE.DDZ)
            {
                UIManager.getInstance().openUI(PdkRoundOver_UI, 32,()=>{
                    UIManager.getInstance().closeUI(CardEffect)
                    UIManager.getInstance().getUI(PdkRoundOver_UI).getComponent("PdkRoundOver_UI").iniViewByPlayBackDdz(this.balanceInfo, this._playerInfoMap, this.gameRule, this.gameType, this.startTime);
                    })
            }
            else
            {
                UIManager.getInstance().openUI(PdkRoundOver_UI, 32,()=>{
                    UIManager.getInstance().closeUI(CardEffect)
                    UIManager.getInstance().getUI(PdkRoundOver_UI).getComponent("PdkRoundOver_UI").iniViewByPlayBack(this.balanceInfo, this._playerInfoMap, this.gameRule, this.gameType, this.startTime);
                    })
            }
            return
        }
    }

    private getNextTurn():any{
        var lastStepCount = this.acitonTable.length - this.curStep - 1
        var nextPlayChairId = 0
        for (var nextIdx = 1; nextIdx <= lastStepCount; nextIdx++)
        {
            nextPlayChairId = this.acitonTable[this.curStep + nextIdx].chair_id
            if (nextPlayChairId >= 1)
                break
        }
        return nextPlayChairId
    }

    private initBalanceInfo()
    {
        var finMsg = []
        this._playerInfoMap.forEach((infoObj, seat)=>{
            var balanceInfo = {
                chairId: infoObj.seat,
                handCards: infoObj.inCards,
                bombScore: infoObj.bombScore,
                roundScore: infoObj.roundScore,
                totalScore: infoObj.totalScore,
                roundMoney: infoObj.roundMoney,
                totalMoney: infoObj.totalMoney, 
            }
            finMsg.push(balanceInfo)
        })
        this.balanceInfo = finMsg
    }

    // 牌型 服务器端 1：单牌 2：对子 3：三不带 4.三带一 5.三带二 6.四带二 7.4带2对 8.四带三 9.顺子 10.连对 11.飞机 12.飞机带单
    // 13：飞机带对 14：炸弹
    private onPlayCardsVoice(msg) {
        if (msg.cardType == 15)
            return
        var type2Voice = {
            3:"shunzi", 4:"liandui", 6:"sandaiyi", 7: "sandaier",10:"feiji", 11:"feiji", 12:"feiji", 8:"sidaier", 13:"zhadan"
        ,9:"sidaisan", 14: "sidaier",15:"feiji"}
        var voiceStr = ""
        if (msg.type == 1) {
            var num = Utils.reandomNumBoth(1,4)
            if (this._playerInfoMap.get(msg.seat).sex == 1)
                voiceStr = "male_voice/buyao" + num
            else
                voiceStr = "female_voice/buyao" + num
        }
        else if (msg.type == 2) {
            if (msg.cardType != 1 && msg.cardType != 2 && msg.cardType != 5 && !type2Voice[msg.cardType])
                return
            if (this._playerInfoMap.get(msg.seat).sex == 1) {
                if (msg.cardType == 1 || msg.cardType == 2)
                    voiceStr = "male_voice/man_" + msg.cardType + "_" + Utils.getPdkCardValue(msg.cards[0])
                else if (msg.cardType == 5)
                    voiceStr = "male_voice/man_" + 3 + "_" + Utils.getPdkCardValue(msg.cards[0])
                else if (msg.cardType == 13)
                    voiceStr = "male_voice/" + type2Voice[msg.cardType]
                else {
                    var num = Utils.reandomNumBoth(1,3)
                    voiceStr = "male_voice/dani" + num
                }
            }
            else {
                if (msg.cardType == 1 || msg.cardType == 2)
                    voiceStr = "female_voice/female_" + msg.cardType + "_" + Utils.getPdkCardValue(msg.cards[0])
                else if (msg.cardType == 5)
                    voiceStr = "female_voice/female_" + 3 + "_" + Utils.getPdkCardValue(msg.cards[0])
                else if (msg.cardType == 13)
                    voiceStr = "female_voice/" + type2Voice[msg.cardType]
                else {
                    var num = Utils.reandomNumBoth(1,3)
                    voiceStr = "female_voice/dani" + num
                }
            }
            AudioManager.getInstance().playSFX("chupai")
        }
        else // type == 3
        {
            if (msg.cardType != 1 && msg.cardType != 2 && msg.cardType != 5 && !type2Voice[msg.cardType])
                return
            if (this._playerInfoMap.get(msg.seat).sex == 1) {
                if (msg.cardType == 1 || msg.cardType == 2)
                    voiceStr = "male_voice/man_" + msg.cardType + "_" + Utils.getPdkCardValue(msg.cards[0])
                else if (msg.cardType == 5)
                    voiceStr = "male_voice/man_" + 3 + "_" + Utils.getPdkCardValue(msg.cards[0])
                else
                    voiceStr = "male_voice/" + type2Voice[msg.cardType]
            }
            else {
                if (msg.cardType == 1 || msg.cardType == 2)
                    voiceStr = "female_voice/female_" + msg.cardType + "_" + Utils.getPdkCardValue(msg.cards[0])
                else if (msg.cardType == 5)
                    voiceStr = "female_voice/female_" + 3 + "_" + Utils.getPdkCardValue(msg.cards[0])
                else {
                    voiceStr = "female_voice/" + type2Voice[msg.cardType]
                }
            }
            AudioManager.getInstance().playSFX("chupai")

        }
        AudioManager.getInstance().playSFX(voiceStr)
    }

    private checkAni(seat, cardType)
    {
        if (cardType == 15)
            return
        var cardNum = this._playerInfoMap.get(seat).inCards.length
        var voiceStr = ""
        if (cardNum<= 2 && cardNum > 0)
        {
            if (this._playerInfoMap.get(seat).sex == 1)
            {
                if (cardNum == 1) { voiceStr = "male_voice/baojing1" }
                if (cardNum == 2) { voiceStr = "male_voice/baojing2" }
            }
            else
            {
                if (cardNum == 1) { voiceStr = "female_voice/baojing1" }
                if (cardNum == 2) { voiceStr = "female_voice/baojing2" }
            }     
            this.onAnimationPlay({ realSeat: seat, type: 20 }) // 警报
            AudioManager.getInstance().playSFX(voiceStr)
        }
        this.onAnimationPlay({ realSeat: seat, type: cardType})
    }

    onAnimationPlay(msg)
    {
        UIManager.getInstance().openUI(CardEffect, 33, () => {
            UIManager.getInstance().getUI(CardEffect).getComponent("CardEffect").playeEffect(msg, this.gameType)
        })
    }


    private onPlayerTurn(seat)
    {
        this.node.getChildByName("jishi").active = true
        var x = this.timeNodePos[seat][0]
        var y = this.timeNodePos[seat][1]
        if (seat == 1)
            x += this.addSize/2
        else if (seat == 3)
            x -= this.addSize/2
        this.node.getChildByName("jishi").position = cc.v3(x, y)
        this.node.getChildByName("jishi").getChildByName("time").getComponent(cc.Label).string = "2s"
        var playerNode = this.node.getChildByName("player_info").getChildByName("player" + seat)
        playerNode.getChildByName("stage").active = false
        this._playerInfoMap.get(seat).outCards = []
        this.outCardsChange(seat)
        
    }

    private setStage(seat, action)
    {
        var action2Sp = {
            "-5":0,"-4":1,"-3":2,"1":3,"2":4,"3":5,"-2":6,"-1":7
        }
        var stageNode = this.node.getChildByName("player_info").getChildByName("player" + seat).getChildByName("stage")
        stageNode.active = true
        stageNode.getComponent(cc.Sprite).spriteFrame = this.stageSp[action2Sp[action.toString()]]
    }

     //设置一张牌的显示
     private setCardTexture(node, cardid, type = "common") {
         if (cardid <= 0) {
             //id非法并隐藏该节点
             node.active = false;
             node.attr = -1;
             return;
         }
         node.attr = cardid;
         var textureId = Utils.getPdkColorAndMjTextureId(cardid)
         if (type == "small")
            Utils.loadTextureFromLocal(node.getComponent(cc.Sprite), "/cards/card_s_" + textureId, function () { node.active = true; });
         else
            Utils.loadTextureFromLocal(node.getComponent(cc.Sprite), "/cards/card_" + textureId, function () { node.active = true; });
     }

    private getClientCardTypeByGameTpe(cardType)
    {
        if (this.gameType == GAME_TYPE.DDZ)
        {
            let typeMap = {1:1, 2:2, 3:5, 4:6, 5:7, 6:8, 7:9, 8:9, 9:3, 10:4, 11:10, 12:11, 13:12, 14:13}
            return typeMap[cardType]
        }
        else{ // 跑得快的type
            let typeMap = {1:1, 2:1, 3:2, 4:2, 5:5, 6:5, 7:6, 8:7, 9:8, 10:8, 11:9, 12:15, 13:15, 
            14:3,15:4, 16:10, 17:11, 18:12, 19:15, 20:13, 21:13, 22:13, 23:13, 24:13, 25:14}
            return typeMap[cardType]
        }
    }


    /**规则按钮 */
    private button_rule() {
        AudioManager.getInstance().playSFX("button_click")
        var info = {
            rule: JSON.stringify(this.gameRule),
            gameType: this.gameType,
        }
        UIManager.getInstance().openUI(ShowRuleUI, 34, () => {
            UIManager.getInstance().getUI(ShowRuleUI).getComponent("ShowRuleUI").initUI(info, 1);
        })
    }
    
    //关闭按钮
    close_button(event) {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().closeUI(PlayBackUI_PDK);
        UIManager.getInstance().closeUI(CardEffect)
    }

       //暂停播放按钮
       playback_speed_button(event, customEventData) {
        AudioManager.getInstance().playSFX("button_click")
        if (customEventData == "right")
        {
            if (this.speed == 0.5)
                return
            this.speed /= 2
            var strSpeed = "1x"
            if (this.speed == 1)
                strSpeed = "2x"
            else if (this.speed == 0.5)
                strSpeed = "4x"
        }
        else{
            if (this.speed == 2)
                return
            this.speed *= 2
            var strSpeed = "1x"
            if (this.speed == 1)
                strSpeed = "2x"
            else if (this.speed == 0.5)
                strSpeed = "4x"
        }
        this.node.getChildByName("label_speed").getComponent(cc.Label).string = strSpeed
    }

    //暂停播放按钮
    play_pause_button(event) {
        AudioManager.getInstance().playSFX("button_click")
        if (this.isPlay) {
            this.isPlay = false;
            this.node.getChildByName("btn_play").active = true
            this.node.getChildByName("btn_pause").active = false
        }
        else {
            this.isPlay = true;
            this.node.getChildByName("btn_play").active = false
            this.node.getChildByName("btn_pause").active = true 

        }
    }

    btn_round()
    {
        AudioManager.getInstance().playSFX("button_click")
        if (this.gameType == GAME_TYPE.DDZ)
            {
                UIManager.getInstance().openUI(PdkRoundOver_UI, 32,()=>{
                    UIManager.getInstance().closeUI(CardEffect)
                    UIManager.getInstance().getUI(PdkRoundOver_UI).getComponent("PdkRoundOver_UI").iniViewByPlayBackDdz(this.balanceInfo, this._playerInfoMap, this.gameRule, this.gameType, this.startTime);
                    })
            }
            else
            {
                UIManager.getInstance().openUI(PdkRoundOver_UI, 32,()=>{
                    UIManager.getInstance().closeUI(CardEffect)
                    UIManager.getInstance().getUI(PdkRoundOver_UI).getComponent("PdkRoundOver_UI").iniViewByPlayBack(this.balanceInfo, this._playerInfoMap, this.gameRule, this.gameType, this.startTime);
                    })
            }
    }

}
