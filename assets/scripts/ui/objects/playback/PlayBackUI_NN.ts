import { GAME_STATE_NN } from './../../../data/nn/GameInfo_NN';
import { ShowRuleUI } from './../rule/ShowRuleUI';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { Utils } from './../../../../framework/Utils/Utils';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { BaseUI } from "../../../../framework/UI/BaseUI";
import { PLAYER_STATE } from './../../../data/zjh/GamePlayerInfo_ZJH';

const { ccclass, property } = cc._decorator;
@ccclass
export class PlayBackUI_NN extends BaseUI {
    protected static className = "PlayBackUI_NN";

    @property(cc.Label)
    roundLabel: cc.Label = null
    @property(cc.Font)
    fontNumZ: cc.Font = null
    @property(cc.Font)
    fontNumF: cc.Font = null
    @property([cc.SpriteFrame])
    cardTypeSpf: cc.SpriteFrame[] = [];
    @property([cc.SpriteFrame])
    callBankerSpf: cc.SpriteFrame[] = [];


    private gameRule = null;                // 游戏规则
    private zhuang = 0;
    private bankerSeat = 0
    private _playerInfoMap= new Map();      // 本局游戏数据
    private playerNum = 0                   // 玩家人数
    private gameType = 0                   // 游戏类型
    private curRound = null;
    private speed = 10                       // 回放速度
    private isPlay = false;             // 是否开始回放
    private myId = 0
    private unUseGoldList = []
    private usedGoldList = []
    private loopTime = 10
    private gameState = 0

    onLoad() {
        
    }

    start()
    {
        this.initGoldObject()
    }

    public getRealSeatByRemoteSeat(seat)
    {
        var playerNum = this.getCurTypePlayerNum()
        var myInfo = this._playerInfoMap.get(0)
        var offset = myInfo.realSeat - myInfo.seat
        var otherRealSeat = (seat + offset + playerNum)%playerNum
        if (playerNum == 6 && otherRealSeat != 0)
            otherRealSeat += 1
        return otherRealSeat
    }

    public getCurTypePlayerNum()
    {
        var list = [6,8]
        return list[this.gameRule.room.player_count_option]
    }

    initView(type, info, playerId)
    {
        try{
            this.myId = playerId
            this.gameRule = info.rule;
            this.zhuang = info.banker
            this.playerNum = info.players.length
            this.gameType = type
            this.curRound = info.cur_round
            this.setRound()
            this.initPlayerInfo(info)
            this.initBalanceInfo(info)
            this.bankerSeat = this.getRealSeatByRemoteSeat(this.zhuang)
            this.node.getChildByName("btn_play").active = false
            this.node.getChildByName("btn_pause").active = true
            this.updatePlayerCard()
            this.isPlay = true;
            this.nextState()
        }
        catch(e) {
            console.log(e)
        }
       
    }

    initPlayerInfo(info)
    {
        var firstSeatIdx = -1
        for (var idx = 0; idx < this.playerNum; idx++)
        {
            var playerInfo = info.players[idx]
            if (playerInfo && playerInfo.guid == this.myId){
                firstSeatIdx = idx
            }
        }
        if (firstSeatIdx < 0)
            firstSeatIdx = 0
        var firstSeatMsg = {
            realSeat: 0,
            seat: info.players[firstSeatIdx].chair_id,
            id: info.players[firstSeatIdx].guid,
            name: info.players[firstSeatIdx].nickname,
            head: info.players[firstSeatIdx].head_url,
            sex: info.players[firstSeatIdx].sex,
            isZhuang: false,
            roundScore: 0,
            totalScore: 0,
            roundMoney: 0,
            totalMoney: 0,
            cards: [],
            cardsPair: [],
            isGaming:false,
            robBankerTimes:info.callbanker[firstSeatIdx],
            cardsType:0,
            usedScore:info.bet[firstSeatIdx], // 下注分数
        }
        this._playerInfoMap.set(0, firstSeatMsg);


        for (var idx = 0; idx < this.playerNum; idx++)
        {
            var playerInfo = info.players[idx]
            if (playerInfo && firstSeatIdx != idx){
                var realSeat = this.getRealSeatByRemoteSeat(playerInfo.chair_id)
                var finalMsg = {
                    realSeat: realSeat,
                    seat: playerInfo.chair_id,
                    id: playerInfo.guid,
                    name: playerInfo.nickname,
                    head: playerInfo.head_url,
                    sex: playerInfo.sex,
                    isZhuang: false,
                    roundScore: 0,
                    totalScore: 0,
                    roundMoney: 0,
                    totalMoney: 0,
                    cards: [],
                    cardsPair: [],
                    isGaming:false,
                    robBankerTimes:info.callbanker[idx],
                    cardsType:0,
                    usedScore:info.bet[idx],

                }
                this._playerInfoMap.set(realSeat, finalMsg);
            }
        }
        this._playerInfoMap.forEach((infoObj, seat)=>{
            var playerNode = this.node.getChildByName("node_player").getChildByName("player" + seat)
            var spHead = playerNode.getChildByName("sp").getComponent(cc.Sprite)
            Utils.loadTextureFromNet(spHead, infoObj.head)
            playerNode.getChildByName("label_name").getComponent(cc.Label).string = infoObj.name
            // playerNode.getChildByName("score").getComponent(cc.Label).string = (infoObj.roundMoney/100).toString()
            // playerNode.getChildByName("sp_master_bg").active = infoObj.seat == this.zhuang
            playerNode.active = true
        })
    }

    private initBalanceInfo(info)
    {
        this._playerInfoMap.forEach((infoObj, seat)=>{
            for (var balanceInfo of info.balance)
            {
                if (balanceInfo.chair_id == infoObj.seat)
                {
                    infoObj.roundScore = balanceInfo.score
                    infoObj.totalScore = balanceInfo.total_score
                    infoObj.roundMoney = balanceInfo.money
                    infoObj.totalMoney = balanceInfo.total_money
                    infoObj.cards = balanceInfo.cards
                    infoObj.cardsPair = balanceInfo.cards_pair
                    infoObj.cardsType = balanceInfo.cards_type
                    infoObj.isGaming = true
                }
            }
        })
    }

    private onTimeChange(time)
    {
        this.loopTime = time
        var desc = ""
        if (this.gameState == GAME_STATE_NN.STATE_ROB_BANKER)
        {
            desc = "抢庄..."
        }
        else if (this.gameState == GAME_STATE_NN.STATE_BIT)
        {
            desc = "选择下注分数..."
        }
        else if (this.gameState == GAME_STATE_NN.STATE_PLAY)
        {
            desc = "算牛..."
        }
        this.node.getChildByName("time").getComponent(cc.Label).string = desc + this.loopTime +"秒"
        this.unscheduleAllCallbacks()
        this.schedule(this.loop, 1);
    }

    private loop() {
        if (!this.isPlay)
            return
        if (this.loopTime > 0)
        {
            this.loopTime -= 1
            var desc = ""
            if (this.gameState == GAME_STATE_NN.STATE_ROB_BANKER)
            {
                desc = "抢庄..."
            }
            else if (this.gameState == GAME_STATE_NN.STATE_BIT)
            {
                desc = "选择下注分数..."
            }
            else if (this.gameState == GAME_STATE_NN.STATE_PLAY)
            {
                desc = "算牛..."
            }
            this.node.getChildByName("time").getComponent(cc.Label).string = desc + this.loopTime +"秒"
        }
        else
        {
            this.unschedule(this.loop);
            this.node.getChildByName("time").getComponent(cc.Label).string = ""
            this.nextState()
        }
    }


    private updatePlayerCard() {
        this._playerInfoMap.forEach((infoObj, seat)=>{
            for (var i = 0; i < 5; i++)
            {
                var cardNode =  this.node.getChildByName("node_player").getChildByName("player"+seat).getChildByName("card"+seat+"_"+i)
                cardNode.active = infoObj.isGaming
                if (infoObj.cards.length > 0)
                    this.setCardTexture(cardNode,infoObj.cards[i])
            }
        })
    }

    /**手牌变化 */
    private onHandCardChanged(seat) {
        var playerObj = this._playerInfoMap.get(seat)
        var playerNode = this.node.getChildByName("node_player").getChildByName("player"+seat)
        for (var i = 0; i < 5; i++)
        {
            var cardNode =  playerNode.getChildByName("card"+seat+"_"+i)
            if (playerObj.cards.length > 0)
                this.setCardTexture(cardNode,playerObj.cards[i])
        }
    }

    public updateCardsType(seat)
    {
        var typeNode = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("card_type")
        var type =  this._playerInfoMap.get(seat).cardsType
        if (type == 0)
        {
            typeNode.active = false
            return
        }
        if (type < 21)
            typeNode.getComponent(cc.Sprite).spriteFrame = this.cardTypeSpf[type-1]
        else
            typeNode.getComponent(cc.Sprite).spriteFrame = this.cardTypeSpf[type-10]  
        typeNode.active = true
        this.splitCardOnDisplayed(seat)
    }

    public splitCardOnDisplayed(seat)
    {

        var cardsType = this._playerInfoMap.get(seat).cardsType
        if (cardsType > 1 && cardsType != 23 && cardsType != 24 && cardsType != 26 && cardsType != 27)
        {
            var playerNode = this.node.getChildByName("node_player").getChildByName("player"+seat)
            for (var i = 0; i < 5; i++)
            {
                if (seat == 0)
                {
                    if (i == 1)
                        playerNode.getChildByName("card"+seat+"_"+i).x -= 10
                    else if (i ==2)
                        playerNode.getChildByName("card"+seat+"_"+i).x -= 20
                    else if (i == 3)
                        playerNode.getChildByName("card"+seat+"_"+i).x += 10
                }
                else if (seat == 1 || seat == 2)
                {
                    if (i == 0 || i == 1 || i == 2)
                        playerNode.getChildByName("card"+seat+"_"+i).x -= 10
                }
                else
                {
                    if (i == 3 || i == 4)
                        playerNode.getChildByName("card"+seat+"_"+i).x += 10
                }
            }
        }
    }

    public hideCommonCallTime()
    {
        this._playerInfoMap.forEach((infoObj, seat)=>{
            if (infoObj.seat != this.zhuang)
                this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("rob_times").active = false
        })
    }

    private setMaster(seat) 
     {
         var chairId = this._playerInfoMap.get(seat).seat
         var masterNode = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("sp_master_bg") 
         masterNode.active = (chairId == this.zhuang)
     }

    private setRound()
    {
        var list = [8, 12, 16, 20];
        var ruleJuShu = list[this.gameRule.round.option];
        this.node.getChildByName("label_title_round").getComponent(cc.Label).string = "局数：" + this.curRound + "/" + ruleJuShu
    }

    private setUsedScore(seat)
    {
        var labelScore = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("use_score").getChildByName("label_score").getComponent(cc.Label) 
        var score = this._playerInfoMap.get(seat).usedScore
        if(score)
            labelScore.string = score.toString();
        else
            labelScore.string = "0"
    }

    private setRobBankerTimes(seat)
    {
        var spCallTimer = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("rob_times").getComponent(cc.Sprite) 
        var score = this._playerInfoMap.get(seat).robBankerTimes
        spCallTimer.spriteFrame = this.callBankerSpf[score]
        spCallTimer.node.active = true
    }

    /**设置分数 */
    public setScore(seat) 
    {
        var labelScore = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("score").getComponent(cc.Label) 
        var score = this._playerInfoMap.get(seat).roundMoney / 100
        labelScore.string = score.toString();
        if (score < 0)
            labelScore.node.color = new cc.Color(255, 64, 64);
        else
            labelScore.node.color = new cc.Color(251, 224, 72);
    }


    private nextState()
    {
        if (this.gameState == 0)
            this.gameState = GAME_STATE_NN.STATE_ROB_BANKER
        else if(this.gameState == GAME_STATE_NN.STATE_ROB_BANKER){
            this._playerInfoMap.forEach((infoObj, seat)=>{
                this.setRobBankerTimes(seat)
                this.setMaster(seat)
            })
            this.gameState = GAME_STATE_NN.STATE_BIT
        }
        else if(this.gameState == GAME_STATE_NN.STATE_BIT)
        {
            this._playerInfoMap.forEach((infoObj, seat)=>{
                this.setUsedScore(seat)
            })
            this.gameState = GAME_STATE_NN.STATE_PLAY
        }
        else if(this.gameState == GAME_STATE_NN.STATE_PLAY)
        {
            this.node.getChildByName("btn_play").active = false
            this.node.getChildByName("btn_pause").active = false
            this.node.getChildByName("playback_left").active = false
            this.node.getChildByName("playback_right").active = false
            this.node.getChildByName("label_speed").active = false
            this.onGameRoundOver()
            return
        }
        this.onTimeChange(this.speed)
    }   

    
    private initGoldObject()
    {
        // 初始化用来做结算动画的金币
        for (var i = 0; i <8; i++)
        {
            var goldList = []
            for (var j = 0; j < 5; j++)
            {
                var goldObj = cc.instantiate(this.node.getChildByName("gold_node").getChildByName("gold"))
                goldObj.active = false
                goldObj.parent = this.node.getChildByName("gold_node")
                goldList.push(goldObj)
            }
            this.unUseGoldList.push(goldList)
        }
    }

    public resetUnUseGoldList()
    {
        for (var usedList of this.usedGoldList)
            this.unUseGoldList.push(usedList)
        this.usedGoldList = []
    }

    // 小局结算赢筹码动画
    public onRoundOverWinGold(winInfo) {
        var winLoseInfoMap = winInfo
        var winList = []
        var loseList = []
        winLoseInfoMap.forEach((score, seat)=>{
            if (score > 0)
                winList.push(seat)
            else if (score < 0)
                loseList.push(seat)
        })
        if( this.gameRule.play.no_banker_compare)
            this.bankerSeat = winList[0]
        for (let i = 0; i < loseList.length; i++)
            this.doGoldAction(this.bankerSeat, loseList[i])
        for (let i = 0; i < winList.length; i++)
            this.doGoldAction(winList[i], this.bankerSeat)   
    }

    private doGoldAction(winSeat, loseSeat)
    {
        var goldList = this.unUseGoldList.pop();
        this.usedGoldList.push(goldList)
        var delayTime = 0
        if (goldList.length <= 0)
            return
        for(var goldObj of goldList)
        {
            goldObj.position = this.node.getChildByName("node_player").getChildByName("player" +loseSeat).position
            let endpos = this.node.getChildByName("node_player").getChildByName("player"+winSeat).position;
            goldObj.active = true
            let action0 = cc.delayTime(delayTime);
            let action1 = cc.moveTo(0.5, cc.v2(endpos.x, endpos.y));
            let finish = cc.callFunc(function (node, actionNode) {
                actionNode.active= false
            }, this, goldObj);
            goldObj.runAction(cc.sequence(action0, action1, finish));
            delayTime += 0.08
        }
    }
    
    public setPlayerCardsByPair(seat, pair)
    {
        if (pair)
        {
            if (pair.length == 2)
            {
                if (pair[0].length > pair[1].length)
                    this._playerInfoMap.get(seat).cards = pair[0].concat(pair[1])
                else
                    this._playerInfoMap.get(seat).cards = pair[1].concat(pair[0])
                this.onHandCardChanged(seat)
            }
            else if (pair.length == 1)
            {
                if (seat != 0)
                    this._playerInfoMap.get(seat).cards = pair[0]
                this.onHandCardChanged(seat)
            }
        }
    }

    public getVoiceStringByType(type) // 获取音效
    {
        var voiceMap = {1:"no_niu", 2:"niu_1", 3:"niu_2", 4:"niu_3", 5:"niu_4", 6:"niu_5", 7:"niu_6", 8:"niu_7"
        , 9:"niu_8", 10:"niu_9", 11:"niu_niu", 21:"shunzi_niu", 22:"tonghua_niu", 23:"yinhua_niu", 24:"jinhua_niu",
        25:"hulu_niu", 26:"boom_niu", 27:"wuxiao_niu", 28:"tonghaushun_niu"}
        return voiceMap[type]
    }

    //单局结束
    private onGameRoundOver()
    {
        var mapScore = new Map()
        var actionList = []
        this.node.getChildByName("time").getComponent(cc.Label).string = ""
        this._playerInfoMap.forEach((infoObj, seat)=>{
            var score = infoObj.roundMoney/100
            mapScore.set(seat, score)
            let action1 = cc.callFunc(function (target, data) {
                this.setPlayerCardsByPair(data.curSeat, data.cardsPair)
                this.updateCardsType(data.curSeat)
                if (data.cardsType != 21 && data.cardsType != 23 && data.cardsType != 24 && data.cardsType != 28)
                {
                    // 缺失的语音不播报
                    var voiceStr = this.getVoiceStringByType(data.cardsType)
                    this.onActionVoiceRec({seat: data.curSeat, type:voiceStr})
                }
            }, this, {curSeat:seat, cardsPair:infoObj.cardsPair, cardsType:infoObj.cardsType})
            let action2 = cc.delayTime(0.9);
            actionList.push(action1,action2) 
        })
        let goldAction = cc.callFunc(function (target) {
            this.onRoundOverWinGold(mapScore)
        },this)
        let goldActionDelay = cc.delayTime(1.0);
        let finishFunc = cc.callFunc(function (node) {
            mapScore.forEach((score, seat)=>{
                var isUnion = true
                if (this.gameRule.union)
                    var isUnion = true
                else
                    var isUnion = false
                if (isUnion)
                {
                    var fuhao = ""
                    var labelScore = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("round_over_score_union").getComponent(cc.Label)
                    if (score < 0) 
                        var color = new cc.Color(120,206,255)
                    else
                    {
                        fuhao = "+"
                        var color = new cc.Color(255,172,115)
                    }
                    labelScore.string = fuhao+score.toString();
                    labelScore.node.color = color
                    labelScore.node.active = true;
                }
                else
                {
                    var labelScore = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("round_over_score").getComponent(cc.Label)
                    if (score < 0) {
                        labelScore.font = this.fontNumF;
                        labelScore.string = "/" + score;
                    }
                    else {
                        labelScore.font = this.fontNumZ;
                        labelScore.string = "/" + score;
                    }
                    labelScore.node.active = true;
                }
            })
        }, this)
        actionList.push(goldAction) 
        actionList.push(goldActionDelay) 
        actionList.push(finishFunc) 
        this.node.runAction(cc.sequence(actionList));
    }

    
    // 音效
    public onActionVoiceRec(msg) {
        var voiceStr = ""
        if (this._playerInfoMap.get(msg.seat).sex == 1) 
            voiceStr = "man_nn/" + msg.type + "_man"
        else
            voiceStr = "woman_nn/" + msg.type + "_woman"
        AudioManager.getInstance().playSFX(voiceStr)
    }

    //设置一张牌的显示
    private setCardTexture(node, cardid) {
        if (cardid == 255 || cardid == 0) // 隐藏牌
        {
            Utils.loadTextureFromLocal(node.getComponent(cc.Sprite), "/cards/card_0_0");
            return
        }
        var textureId = Utils.getPdkColorAndMjTextureId(cardid)
        Utils.loadTextureFromLocal(node.getComponent(cc.Sprite), "/cards/card_" + textureId);
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
        UIManager.getInstance().closeUI(PlayBackUI_NN);
    }

       //暂停播放按钮
       playback_speed_button(event, customEventData) {
        AudioManager.getInstance().playSFX("button_click")
        if (customEventData == "right")
        {
            if (this.speed == 2)
                return
            this.speed /= 2
            if (this.speed == 2.5)
                this.speed = 2
            var strSpeed = "1x"
            if (this.speed == 5)
                strSpeed = "2x"
            else if (this.speed == 2)
                strSpeed = "5x"
        }
        else{
            if (this.speed == 10)
                return
            this.speed *= 2
            if (this.speed == 6)
                this.speed = 5
            var strSpeed = "1x"
            if (this.speed == 5)
                strSpeed = "2x"
            else if (this.speed == 2)
                strSpeed = "5x"
        }
        this.node.getChildByName("label_speed").getComponent(cc.Label).string = strSpeed
        if (Math.abs(this.speed - this.loopTime) > 1)
        {
            this.unschedule(this.loop)
            this.node.getChildByName("time").getComponent(cc.Label).string = ""
            this.onTimeChange(this.speed)
        }
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


}