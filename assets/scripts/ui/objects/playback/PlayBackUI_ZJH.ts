import { ShowRuleUI } from './../rule/ShowRuleUI';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { Utils } from './../../../../framework/Utils/Utils';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { BaseUI } from "../../../../framework/UI/BaseUI";
import { PLAYER_STATE } from './../../../data/zjh/GamePlayerInfo_ZJH';
import { ZjhCheckCardType } from '../../../data/zjh/ZjhCheckCardType';

const { ccclass, property } = cc._decorator;
@ccclass
export class PlayBackUI_ZJH extends BaseUI {
    protected static className = "PlayBackUI_ZJH";

    @property([cc.SpriteFrame])
    stateSpf: cc.SpriteFrame[] = [];
    @property(cc.Node)
    bpPlayerWin: cc.Node = null;
    @property(cc.Node)
    bpPlayerLose: cc.Node = null;
    @property(cc.Animation)
    animQiePaiLeft: cc.Animation = null;
    @property(cc.Font)
    fontNumZ: cc.Font = null
    @property(cc.Font)
    fontNumF: cc.Font = null
    @property([cc.SpriteFrame])
    cardTypeSpf: cc.SpriteFrame[] = [];

    private gameRule = null;                // 游戏规则
    private zhuang = 0;
    private _playerInfoMap= new Map();      // 本局游戏数据
    private playerNum = 0                   // 玩家人数
    private controlSeat = -1                // 当前轮到谁了
    private gameType = 0                   // 游戏类型
    private acitonTable = null              // 本局操作集合
    private curStep = 0;
    private playTime = 2;
    private curRound = null;
    private cardNum = 0
    private speed = 2                       // 回放速度
    private isPlay = false;             // 是否开始回放
    private chipsNodeList = []
    private totalDeskScore = 0          // 桌面总分
    private baseScore = 0
    private menScore = 0
    private isInAction = false
    private isGameOver = false
    private lun = 1
    private myId = 0
    private cardCache = new Map()

    onLoad() {
        
    }
    
    //时间刷新初始化
    initTime() {
        this.schedule(this.loop.bind(this), 0.25);
    }

    private loop()
    {
        if(this.isInAction) // 在播放动画时暂停后续逻辑
            return
        //播放时间
        if (this.isPlay)
        {
            this.playTime -= 0.25;
            var percent = this.playTime / this.speed
            this.node.getChildByName("node_player").getChildByName("player" + this.controlSeat).getChildByName("timer").getComponent(cc.ProgressBar).progress = percent
        }
        if (this.playTime <= 0) {
            this.playTime = this.speed
            if (this.isPlay)
                this.doActiton()
        }
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
            this.curStep = 0;
            this.gameType = type
            this.acitonTable = info.actions
            this.playTime = 2;
            this.curRound = info.curRound
            this.baseScore = info.rule.play.base_score
            this.menScore = info.rule.play.base_men_score
            console.log(info.rule.play)
            this.initPlayerInfo(info)
            this.initBalanceInfo(info)
            this.node.getChildByName("btn_play").active = false
            this.node.getChildByName("btn_pause").active = true
            this.updatePlayerCard()
            var firstChairId = this.getNextTurn()
            var firstPlaySeat = this.getRealSeatByRemoteSeat(firstChairId)
            this.onPlayerTurn(firstPlaySeat)
            this.isPlay = true;
            this.initTime()
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
            if (playerInfo.guid == this.myId){
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
            state:PLAYER_STATE.STATE_NORMAL,
            roundScore: 0,
            totalScore: 0,
            roundMoney: 0,
            totalMoney: 0,
            cards: [],
            isGaming:false,
            usedScore:0, // 下注分数
        }
        this._playerInfoMap.set(0, firstSeatMsg);


        for (var idx = 0; idx < this.playerNum; idx++)
        {
            var playerInfo = info.players[idx]
            if (firstSeatIdx != idx){
                var realSeat = this.getRealSeatByRemoteSeat(playerInfo.chair_id)
                var finalMsg = {
                    realSeat: realSeat,
                    seat: playerInfo.chair_id,
                    id: playerInfo.guid,
                    name: playerInfo.nickname,
                    head: playerInfo.head_url,
                    sex: playerInfo.sex,
                    isZhuang: false,
                    state:PLAYER_STATE.STATE_NORMAL,
                    roundScore: 0,
                    totalScore: 0,
                    roundMoney: 0,
                    totalMoney: 0,
                    cards: [],
                    isGaming:false,
                    usedScore:0, // 下注分数

                }
                this._playerInfoMap.set(realSeat, finalMsg);
            }
        }
        this._playerInfoMap.forEach((infoObj, seat)=>{
            var playerNode = this.node.getChildByName("node_player").getChildByName("player" + seat)
            var spHead = playerNode.getChildByName("sp").getComponent(cc.Sprite)
            Utils.loadTextureFromNet(spHead, infoObj.head)
            playerNode.getChildByName("label_name").getComponent(cc.Label).string = infoObj.name
            playerNode.getChildByName("score").getComponent(cc.Label).string = (infoObj.roundMoney/100).toString()
            playerNode.getChildByName("sp_master_bg").active = infoObj.seat == this.zhuang
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
                    infoObj.roundScore = balanceInfo.round_score
                    infoObj.totalScore = balanceInfo.total_score
                    infoObj.roundMoney = balanceInfo.round_money
                    infoObj.totalMoney = balanceInfo.total_money
                    infoObj.cards = balanceInfo.cards
                    infoObj.isGaming = true
                    var menZhu = this.menScore
                    if (!menZhu)
                        menZhu = this.baseScore
                    this.totalDeskScore += menZhu
                    infoObj.usedScore += menZhu
                    this.onPlayerScoreChanged(seat)
                    this.putChips(seat, menZhu, false)
                }
            }
        })
        this.onDeskScoreChanged()
    }

    private onPlayerTurn(seat)
    {
        this.controlSeat = seat
        var percent = this.playTime / this.speed
        if(this.node.getChildByName("node_player") && this.node.getChildByName("node_player").getChildByName("player" + this.controlSeat) && this.node.getChildByName("node_player").getChildByName("player" + this.controlSeat).getChildByName("timer"))
        {
            this.node.getChildByName("node_player").getChildByName("player" + this.controlSeat).getChildByName("timer").getComponent(cc.ProgressBar).progress = percent
        }
       
    }

    /**刷新所有玩家牌相关 */
    private updatePlayerCard(hide = false) {
        this._playerInfoMap.forEach((infoObj, seat)=>{
            for (var i = 0; i < 3; i++)
            {
                var cardNode =  this.node.getChildByName("node_player").getChildByName("player"+seat).getChildByName("card"+seat+"_"+i)
                if (hide)
                    cardNode.active = false
                else
                {
                    cardNode.active = infoObj.isGaming
                    if (infoObj.cards.length > 0)
                        this.setCardTexture(cardNode,infoObj.cards[i])
                }
            }
            this.updateCardTyep(seat)
        })
    }
    
    /**玩家是否在线 */
    public setPlayerOnline(seat)
    {
        var onlineNode = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("online")
        onlineNode.active = !this._playerInfoMap.get(seat).isOnline;
    }

    public setTrustee(seat)
    {
        return
    }

    private doActiton()
    {
        if (!this.isPlay)
            return
        var actionInfo = this.acitonTable[this.curStep]
        if (actionInfo.turn)
        {
            this.lun = actionInfo.turn
            this.updateLunShu()
        }
        if (actionInfo.act == "Trustee")
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
        if (actionInfo.action == "look_cards") // 看牌
        {
            var realSeat = this.getRealSeatByRemoteSeat(actionInfo.chair_id)
            this._playerInfoMap.get(realSeat).state = PLAYER_STATE.STATE_LOOK
            this.onCardStateRec(realSeat)
            this.onActionVoiceRec(realSeat, "kanpai")
        }
        else if(actionInfo.action == "giveup") // 弃牌
        {
            var realSeat = this.getRealSeatByRemoteSeat(actionInfo.chair_id)
            this._playerInfoMap.get(realSeat).state = PLAYER_STATE.STATE_ABANDON
            this.onCardStateRec(realSeat)
            this.onActionVoiceRec(realSeat, "qipai")
        }
        else if(actionInfo.action == "compare") // 比牌
        {
            var sourceSeat = this.getRealSeatByRemoteSeat(actionInfo.chair_id)
            var targetSeat = this.getRealSeatByRemoteSeat(actionInfo.compare_with)
            if (actionInfo.win)
            {
                var winnerSeat = sourceSeat
                var loserSeat = targetSeat
            }
            else
            {
                var winnerSeat = targetSeat
                var loserSeat = sourceSeat
            }
            // 比牌动画
            this._playerInfoMap.get(sourceSeat).usedScore += actionInfo.score
            this.totalDeskScore += actionInfo.score
            this.onDeskScoreChanged()
            this.onPlayerScoreChanged(sourceSeat)
            this.putChips(sourceSeat, actionInfo.score)
            this.onActionVoiceRec(sourceSeat, "bipai")
            this.onBiPaiResult(loserSeat, winnerSeat)
        }
        else if (actionInfo.action == "add_score") // 加注
        {
            var realSeat = this.getRealSeatByRemoteSeat(actionInfo.chair_id)
            var times = 1
            if (this._playerInfoMap.get(realSeat).state == PLAYER_STATE.STATE_LOOK)
                times = 2
            this.baseScore = actionInfo.score/times
            this._playerInfoMap.get(realSeat).usedScore += actionInfo.score
            this.totalDeskScore += actionInfo.score
            this.onDeskScoreChanged()
            this.onPlayerScoreChanged(realSeat)
            this.putChips(realSeat, actionInfo.score)
            this.onActionVoiceRec(realSeat, "jiazhu")

        }
        else if (actionInfo.action == "follow") //跟注
        {
            var realSeat = this.getRealSeatByRemoteSeat(actionInfo.chair_id)
            this._playerInfoMap.get(realSeat).usedScore += actionInfo.score
            this.totalDeskScore += actionInfo.score
            this.onDeskScoreChanged()
            this.onPlayerScoreChanged(realSeat)
            this.putChips(realSeat, actionInfo.score)
            this.onActionVoiceRec(realSeat, "genzhu")
        }
        else if (actionInfo.action == "all_in")
        {
            var realSeat = this.getRealSeatByRemoteSeat(actionInfo.chair_id)
            var isWin = this.acitonTable.length <= this.curStep+1
            this.onPlayerAllIn({allInSeat: realSeat, isWin:isWin})
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
            this.isGameOver = true
            if (this.isInAction)
                return
            this.onOver()
            return
        }
    }   

    private onPlayerAllIn(msg)
    {
        var actionNode = this.node.getChildByName("node_player").getChildByName("player"+msg.allInSeat).getChildByName("all_in_label")
        actionNode.opacity = 0
        let action1 = cc.fadeIn(0.1);
        let action2 = cc.delayTime(1);
        let action3 = cc.fadeOut(0.1);
        let finishFunc = cc.callFunc(function () {
            if (msg.isWin) // 孤注一掷赢了
            {
               this._playerInfoMap.forEach((infoObj, seat)=>{
                    if (seat != msg.allInSeat)
                        infoObj.state = PLAYER_STATE.STATE_FALI
                        this.onCardStateRec(seat)
                })
            }
            else{
               this._playerInfoMap.get(msg.allInSeat).state = PLAYER_STATE.STATE_FALI
                this.onCardStateRec(msg.allInSeat)
            }
        }.bind(this))
        actionNode.active = true
        actionNode.runAction(cc.sequence(action1,action2,action3,finishFunc))
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

    private onOver(){
        this.unscheduleAllCallbacks()
        this.node.getChildByName("btn_play").active = false
        this.node.getChildByName("btn_pause").active = false
        this.node.getChildByName("playback_left").active = false
        this.node.getChildByName("playback_right").active = false
        this.node.getChildByName("label_speed").active = false
        var winSeat = 0
        var mapScore = new Map()
        this._playerInfoMap.forEach((infoObj, seat)=>{
            if (infoObj.roundScore > 0)
                winSeat = seat
        })
        this._playerInfoMap.forEach((infoObj, seat)=>{
            var score = infoObj.roundMoney/100
            mapScore.set(seat, score)
        })
        let cbFunc = function () { // 显示每个人分数
            mapScore.forEach((score, seat)=>{
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
        }
        this.onRoundOverWinChips({winnerSeat:winSeat, callback:cbFunc.bind(this)})
    }


    private updateCardTyep(seat)
    {
        var typeNode = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("card_type")
        var cards =   this._playerInfoMap.get(seat).cards
        if (cards.length == 0 || cards[0] == 255)
        {
            typeNode.active = false
            return
        }
        var type = ZjhCheckCardType.checkZjhCardType(cards)
        typeNode.getComponent(cc.Sprite).spriteFrame = this.cardTypeSpf[type-1]
        typeNode.active = true
    }

    private onCardStateRec(seat)
    {
        var playerNode = this.node.getChildByName("node_player").getChildByName("player"+seat)
        var idx = -1
        if (this._playerInfoMap.get(seat).state == PLAYER_STATE.STATE_LOOK)
            idx = 0
        else if (this._playerInfoMap.get(seat).state == PLAYER_STATE.STATE_ABANDON)
        {
            playerNode.getChildByName("gray").active = true
            idx = 1
        }
        else if (this._playerInfoMap.get(seat).state == PLAYER_STATE.STATE_FALI)
        {
            idx = 2
            playerNode.getChildByName("gray").active = true
        }
        if (idx <= -1)
        {
            playerNode.getChildByName("state").active = false
            return
        }
        playerNode.getChildByName("state").getComponent(cc.Sprite).spriteFrame = this.stateSpf[idx]
        playerNode.getChildByName("state").active = true
    }

    private onDeskScoreChanged()
    {
        this.node.getChildByName("label_all_score").getComponent(cc.Label).string = "总分：" + this.totalDeskScore
    }

    private onPlayerScoreChanged(seat)
    {
        var labelScore = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("use_score").getChildByName("label_score").getComponent(cc.Label) 
        var score = this._playerInfoMap.get(seat).usedScore
        labelScore.string = score.toString();
    }

    private updateLunShu() {
        this.node.getChildByName("label_title_round").getComponent(cc.Label).string = "轮数：" + this.lun
    }


    private putChips(seat, score, action = true)
    {
        let beginPos = this.node.getChildByName("node_player").getChildByName("player"+seat).position;
        var difen = this.gameRule.play.base_score
        var chipsMap = this.gameRule.play.chip_score
        var nodeIdx = 0
        if(score <= chipsMap[0]*difen || score == difen)
            nodeIdx = 1
        else if (score <= chipsMap[1]*difen) 
            nodeIdx = 2
        else
            nodeIdx = 3
        let newchip = this.newChipNode(beginPos, score, nodeIdx);
        if (action)
            newchip.runAction(cc.moveTo(0.2, this.randomPos()));
        else
            newchip.position = cc.v3(this.randomPos().x, this.randomPos().y) 
    }


    private newChipNode(beginPos, score, nodeIdx)
    {
        var chipNode = this.node.getChildByName("chip_node").getChildByName("sp_addchips_bg").getChildByName("score"+nodeIdx); 
        let newchip = cc.instantiate(chipNode);
        newchip.getComponent(cc.Button).interactable = false
        newchip.parent = this.node.getChildByName("node_chips");
        this.chipsNodeList.push(newchip);
        newchip.active = true;
        newchip.x = beginPos.x;
        newchip.y = beginPos.y;
        newchip.scale = 0.5;
        newchip.getChildByName("label_score").getComponent(cc.Label).string = score.toString();
        return newchip;
    }

    private randomPos(): cc.Vec2 {
        var chips_node = this.node.getChildByName("node_chips")
        var size = chips_node.getContentSize();
        let x = Utils.reandomNumBoth(-size.width / 2, size.width / 2);
        let y = Utils.reandomNumBoth(-size.height / 2,size.height / 2);
        return cc.v2(x, y);
    }

    private onBiPaiResult(loserSeat, winnerSeat)
    {
        this.isInAction = true; // 比牌动画时暂停游戏
        var endPoslose = cc.v2(-420,15)
        var endPosWin = cc.v2(430,15)
        var startPoslose = this.node.getChildByName("bp_action").getChildByName("pos"+loserSeat).position
        var startPosWin = this.node.getChildByName("bp_action").getChildByName("pos"+winnerSeat).position

        var winnnerHeadNode = this.node.getChildByName("bp_action").getChildByName("sp_head_win")
        var loseHeadNode = this.node.getChildByName("bp_action").getChildByName("sp_head_lose")
        this.node.getChildByName("node_bp").active = false
        this.bpPlayerWin.getChildByName("name").active = false
        this.bpPlayerWin.getChildByName("cards").active = false
        this.bpPlayerLose.getChildByName("name").active = false
        this.bpPlayerLose.getChildByName("qiepai").active = false
        this.bpPlayerLose.getChildByName("cards").active = false
        this.bpPlayerLose.getChildByName("pai2").active = false
        this.bpPlayerLose.getChildByName("pai1").active = false
        this.bpPlayerWin.stopAllActions()
        this.bpPlayerLose.stopAllActions()
        this.node.getChildByName("bp_action").active = true
        this.node.getChildByName("bp_action").getChildByName("label_vs").active = false
        this.bpPlayerLose.position = cc.v3(-262,15)
        this.bpPlayerWin.position = cc.v3(273,15)
        var winnerHead =this._playerInfoMap.get(winnerSeat).head
        var winnnerName = this._playerInfoMap.get(winnerSeat).name
        var loseHead = this._playerInfoMap.get(loserSeat).head
        var loseName = this._playerInfoMap.get(loserSeat).name
        Utils.loadTextureFromNet(winnnerHeadNode.getComponent(cc.Sprite), winnerHead)
        Utils.loadTextureFromNet(loseHeadNode.getComponent(cc.Sprite),loseHead)

        var action1 = cc.moveTo(0.2, cc.v2(-211, 15));
        var action2 = cc.moveTo(0.2, cc.v2(222, 15));
        var action5 = cc.moveTo(0.3, endPoslose);
        var action6 = cc.moveTo(0.3, endPosWin);
        var action7 = cc.moveTo(0.3, cc.v2(startPoslose.x, startPoslose.y));
        var action8 = cc.moveTo(0.3, cc.v2(startPosWin.x, startPosWin.y));
        var moveFinish = cc.callFunc(function () {
            this.node.getChildByName("bp_action").active = false
            this.node.getChildByName("node_player").getChildByName("player"+loserSeat).active = true
            this.node.getChildByName("node_player").getChildByName("player"+winnerSeat).active = true
            this._playerInfoMap.get(loserSeat).state = PLAYER_STATE.STATE_FALI
            this.onCardStateRec(loserSeat)
            this.isInAction = false
            if (this.isGameOver) // 动画播完才执行 结算
                this.onOver()
        }.bind(this));

        var action3 = cc.callFunc(function () {
            loseHeadNode.position = startPoslose
            this.node.getChildByName("node_player").getChildByName("player"+loserSeat).active = false
            loseHeadNode.runAction(action5)

        }.bind(this));
        var action4 = cc.callFunc(function () {
            winnnerHeadNode.position = startPosWin
            this.node.getChildByName("node_player").getChildByName("player"+winnerSeat).active = false
            winnnerHeadNode.runAction(action6)
        }.bind(this));

        //切牌
        var qiepai_left = cc.callFunc(function () {
            this.bpPlayerWin.getChildByName("name").getComponent(cc.Label).string = winnnerName
            this.bpPlayerLose.getChildByName("name").getComponent(cc.Label).string = loseName
            this.bpPlayerWin.getChildByName("name").active = true
            this.bpPlayerWin.getChildByName("cards").active = true
            this.bpPlayerLose.getChildByName("name").active = true
            this.bpPlayerLose.getChildByName("cards").active = true
            this.bpPlayerLose.getChildByName("qiepai").active = true
            this.node.getChildByName("bp_action").getChildByName("label_vs").active = true
            this.animQiePaiLeft.play("qiepai");
        }.bind(this));

        var result = cc.callFunc(function () {
            this.bpPlayerLose.getChildByName("pai2").active = true
            this.bpPlayerLose.getChildByName("pai1").active = true
            this.bpPlayerLose.getChildByName("cards").active = false
        }.bind(this));

        var finish = cc.callFunc(function () {
            loseHeadNode.runAction(cc.sequence(action7,moveFinish))
            winnnerHeadNode.runAction(action8)
        }.bind(this));
        let delayAction1 = cc.delayTime(1);
        let delayAction2 = cc.delayTime(0.5);
        let delayAction3 = cc.delayTime(0.6);
        this.bpPlayerWin.runAction(cc.sequence(action2,action4,delayAction2,delayAction1,finish))
        this.bpPlayerLose.runAction(cc.sequence(action1,action3,delayAction2,qiepai_left,delayAction3,result))
    }

    // 音效
    private onActionVoiceRec(seat, type) {
        var voiceStr = ""
        if (this._playerInfoMap.get(seat).sex == 1) 
            voiceStr = "man/" + "man_"+type
        else
            voiceStr = "woman/" + "woman_"+type
        AudioManager.getInstance().playSFX(voiceStr)
    }

    // 小局结算赢筹码动画
    private onRoundOverWinChips(msg) {
        let allchips = this.chipsNodeList.length;
        if (allchips == 0) {
            this.chipsNodeList = [];
            if (msg.callback)
                msg.callback();
            return;
        }
        let endpos = this.node.getChildByName("node_player").getChildByName("player"+msg.winnerSeat).position;
        for (let i = 0; i < this.chipsNodeList.length; ++i) {
            let action0 = cc.moveTo(0.3, cc.v2(endpos.x, endpos.y));
            let action1 = cc.removeSelf();
            let finish = cc.callFunc(function (node) {
                allchips -= 1;
                if (allchips == 0) {
                    this.chipsNodeList = [];
                    if (msg.callback)
                        msg.callback();
                    return;
                }
            }, this);
            this.chipsNodeList[i].runAction(cc.sequence(action0, action1, finish));
        }
    }

     //设置一张牌的显示
     private setCardTexture(node, cardid) {
        if (cardid == 255) // 隐藏牌
        {
            this.loadTextureAddCache(node.getComponent(cc.Sprite), "/cards/card_0_0", function () { node.active = true; });
            return
        }
        var textureId = Utils.getPdkColorAndMjTextureId(cardid)
        Utils.loadTextureFromLocal(node.getComponent(cc.Sprite), "/cards/card_" + textureId, function () { node.active = true; });
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
        UIManager.getInstance().closeUI(PlayBackUI_ZJH);
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

    public loadTextureAddCache(loadnode, url: string, callback: any = null) {
        var sprite = loadnode.getComponent(cc.Sprite)
        if (url == null || url == "") {
            sprite.spriteFrame = null;
            if (callback != null)
                callback();
            return;
        }

        if (loadnode == null || sprite == null)
            return;
        if (this.cardCache.get(url))
        {
            sprite.spriteFrame = this.cardCache.get(url)
            if (callback != null)
                callback();
            return;
        }
        cc.loader.loadRes(url, cc.SpriteFrame,
            function (err, spriteFrame) {
                if (err) {
                    return;
                }
                sprite.spriteFrame = spriteFrame;
                this.cardCache.set(url, spriteFrame)
                if (callback != null)
                    callback();
            }.bind(this));
    }

}