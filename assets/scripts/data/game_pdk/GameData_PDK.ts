import { GameManager } from './../../GameManager';
import { Utils } from './../../../framework/Utils/Utils';
import { GAME_TYPE } from '../GameConstValue';
import { ListenerManager } from '../../../framework/Manager/ListenerManager';
import { ListenerType } from "../ListenerType";
import { MessageManager } from "../../../framework/Manager/MessageManager";
import { GameDataManager } from "../../../framework/Manager/GameDataManager";
import { AudioManager } from "../../../framework/Manager/AudioManager";
import { GamePlayerInfo_PDK } from "./GamePlayerInfo_PDK";
import { GameInfo_PDK, GAME_STATE_PDK } from "./GameInfo_PDK";
import { PDKCheckCanBet } from "./PDKCheckCanBet";
import * as Proto from "../../../proto/proto-min";
import { PDKCheckCardType } from './PDKCheckCardType';



export class GameData_PDK {
    public static className = "GameData_PDK";

    /**游戏信息 */
    protected _gameinfo:GameInfo_PDK = null;
    public get gameinfo() {
        return this._gameinfo
    }
    /**玩家信息 */
    protected _playerInfoMap= new Map<number, GamePlayerInfo_PDK>();
    public get playerInfoMap() {
        return this._playerInfoMap;
    }
   //游戏申请解散信息
   protected _gameApplyData: any = null;
   public get gameApplyData(): any {
       return this._gameApplyData;
   }
   public set gameApplyData(value: any) {
       this._gameApplyData = value;
   }

   //游戏投票信息
   protected _voteData: any = null;
   public get voteData(): any {
       return this._voteData;
   }
   public set voteData(value: any) {
       this._voteData = value;
   }

   protected _laiZi: any = 0;
   public get laiZi(): any {
       return this._laiZi;
   }
   public set laiZi(value: any) {
       this._laiZi = value;
   }

   public overTempPlayerInfo =  new Map() // 用于在结算时临时存储的玩家数据
   protected tempList = []
   protected GameStartState = -1
   public roundOverDataUesed = false

   constructor(){
       this.initListen()
   }

   protected initListen()
    {
        ListenerManager.getInstance().add(Proto.SC_StandUpAndExitRoom.MsgID.ID, this, this.onPlayerLeave);  
        ListenerManager.getInstance().add(Proto.SC_NotifyStandUp.MsgID.ID, this, this.onPlayerLeave);     
        ListenerManager.getInstance().add(Proto.SC_NotifySitDown.MsgID.ID, this, this.onPlayerSit);           
        ListenerManager.getInstance().add(Proto.SC_Ready.MsgID.ID, this, this.setSomeOneReady);   
        ListenerManager.getInstance().add(Proto.SC_PdkDeskEnter.MsgID.ID, this, this.onGameDateInit);              // 游戏信息初始化
        ListenerManager.getInstance().add(Proto.SC_PdkDiscardRound.MsgID.ID, this, this.onOperatePlayerChanged);                           // 该谁操作
        ListenerManager.getInstance().add(Proto.SC_DismissTableReq.MsgID.ID, this, this.onDisMissDataRec);      
        ListenerManager.getInstance().add(Proto.S2C_TRANSFER_ROOM_OWNER_RES.MsgID.ID, this, this.setOwner);   
        ListenerManager.getInstance().add(Proto.SC_TimeOutNotify.MsgID.ID, this, this.onOpTimechange);     
        ListenerManager.getInstance().add(Proto.SC_PdkDoAction.MsgID.ID, this, this.onOutCard);                           // 出牌
        ListenerManager.getInstance().add(Proto.SC_PdkGameOver.MsgID.ID, this, this.setRoundOver); 
        ListenerManager.getInstance().add(Proto.SC_PdkFinalGameOver.MsgID.ID, this, this.setGameOver);                   // 换牌结束后
        ListenerManager.getInstance().add(Proto.SC_PlayOnceAgain.MsgID.ID, this, this.onPlayOnceAgain);
        ListenerManager.getInstance().add(Proto.SC_NotifyOnline.MsgID.ID, this, this.onPlayerOnlineRec);
    }

    protected onGameDateInit(msg)
    {
        this.clearDataOnStart()
        this.laiZi = Utils.getPdkCardValue(msg.laizi) 
        // 有重连数据
        if (msg.pbRecData)
        {
            if (msg.pbRecData.lastDiscardChair > 0)
            {
                var realSeat = this.getRealSeatByRemoteSeat(msg.pbRecData.lastDiscardChair)
                this.gameinfo.lastOutSeat = realSeat
                if (msg.pbRecData.laiziReplace)
                {
                    for (var i = 0; i < msg.pbRecData.lastDiscard.length; i++)
                    {
                        if (this.laiZi == Utils.getPdkCardValue(msg.pbRecData.lastDiscard[i]) && msg.pbRecData.laiziReplace.length > 0)
                            msg.pbRecData.lastDiscard[i] = msg.pbRecData.laiziReplace.pop()
                    }
                }
                this.gameinfo.lastOutCards = msg.pbRecData.lastDiscard;
                this.playerInfoMap.get(realSeat).outCard = msg.pbRecData.lastDiscard
            }
            if (this.gameinfo.rule.union) // 联盟重连是totalmoney
            {
                if (msg.pbRecData.totalMoney)
                {
                    for (var chairId in msg.pbRecData.totalMoney)
                    {
                        var tempSeat = this.getRealSeatByRemoteSeat(parseInt(chairId))
                        var clubScore = parseInt(msg.pbRecData.totalMoney[chairId])/100
                        this.playerInfoMap.get(tempSeat).clubScore = clubScore
                    }
                }
            }
            else
            {
                if (msg.pbRecData.totalScores)
                {
                    for (var chairId in msg.pbRecData.totalScores)
                    {
                        var tempSeat = this.getRealSeatByRemoteSeat(parseInt(chairId))
                        var clubScore = parseInt(msg.pbRecData.totalScores[chairId]) 
                        this.playerInfoMap.get(tempSeat).clubScore = clubScore
                    }
                }
            }
            
        }
        if (msg.pbPlayers.length > 0)
        {
            for (var pbPlayerInfo of msg.pbPlayers)
            {
                var realSeat = this.getRealSeatByRemoteSeat(pbPlayerInfo.chairId)
                if (!this.playerInfoMap.get(realSeat))
                {
                    GameManager.getInstance().handReconnect()
                    return
                }
                this.playerInfoMap.get(realSeat).updatePlayerInfoOnStart(pbPlayerInfo)
            }
        }
        this.setTableStart(true);
        this.GameStartState = msg.status
        this.setCurRound(msg.round)
        MessageManager.getInstance().messagePost(ListenerType.pdk_start, {});
        this.setGameState(msg.status) // 数据填充完成时在推进游戏进度
        this.gameinfo.curRoundOverData = null
        this.gameinfo.curGameOverData = null
        this.roundOverDataUesed = false
        MessageManager.getInstance().disposeMsg();
    }

    // 操作玩家改变
    protected onOperatePlayerChanged(msg)
    {
        var realSeat = this.getRealSeatByRemoteSeat(msg.chairId)
        if (!this._playerInfoMap.get(realSeat))
        {
            GameManager.getInstance().handReconnect()
            return;
        }
        if (this.gameinfo.lastOutSeat == -1 || this.gameinfo.lastOutSeat == realSeat)// 首次出牌或者，出牌的人大牌了
        {
            this._playerInfoMap.forEach((infoObj, seat)=>{
                infoObj.outCard = [] // 清空出牌区
            })
        }
        else
        {
            this.gameinfo.curTipsIndex = -1 // 轮到自己出牌时清理提示的下标
            if (realSeat == 0) // 轮到自己出牌时，检测自己所有能够比别人大的牌
                this.gameinfo.curTipsCardsArray = PDKCheckCanBet.checkCanBet(this.playerInfoMap.get(0).cards, this.gameinfo.lastOutCards) // 轮到自己出牌时更新提示牌型
        }

        MessageManager.getInstance().messagePost(ListenerType.pdk_playerStateChanged, { playerSeat: realSeat, state:true, type: "clear" });
        this.setCurOperatePlayer(realSeat); //设置当前玩家
        if (!(this.gameinfo.rule.trustee.second_opt >= 0))
            this.setTime(30)
        MessageManager.getInstance().disposeMsg();
    }

     // 离开房间
     public onPlayerLeave(msg)
     {
        if (msg.tableId != this.gameinfo.roomId)
        {
            MessageManager.getInstance().disposeMsg();
            return;
        }
        try{
            var realSeat = this.getRealSeatByRemoteSeat(msg.chairId)
            if (realSeat == 0) //离开房间的原因
            Utils.standupByReason(msg.reason)
            if ((this._gameinfo.curGameOverData != null || this.roundOverDataUesed) && this._gameinfo.isDismissed)
            {
                MessageManager.getInstance().disposeMsg();
                return
            }
            if (realSeat == 0 && this.checkScoreMenKan() && this._gameinfo.curGameOverData != null)
            {
                this._gameinfo.isDismissed = true
                MessageManager.getInstance().disposeMsg();
                return
            }
            if (realSeat == 0 && (msg.reason == 6 || msg.reason == 12|| msg.reason == 13|| msg.reason == 15))
            {
                this._gameinfo.isDismissed = true
                MessageManager.getInstance().disposeMsg();
                return
            }
            this.removePlayer(realSeat)
            MessageManager.getInstance().disposeMsg();
        }
        catch (e)
        {
            this._playerInfoMap.forEach((infoObj, seat)=>{
                if (infoObj && infoObj.seat == msg.chairId)
                {
                    this._playerInfoMap.delete(seat);
                    MessageManager.getInstance().messagePost(ListenerType.nn_playerNumChanged, { playerSeat: seat, tag: "remove" });
                    MessageManager.getInstance().disposeMsg();
                    return
                }
            })
            MessageManager.getInstance().disposeMsg();
        }
     }
     
     protected onPlayerOnlineRec(msg)
     {
        var info = {
            playerId: msg.guid,
            isOnline: msg.isOnline
        }
        this.setSomeoneOnline(info)
        MessageManager.getInstance().disposeMsg();
     }


     onOutCard(msg)
     {
        if(msg.action == 1) // 要不起或者不要
        {
            var realSeat = this.getRealSeatByRemoteSeat(msg.chairId)
            this.checkVoice(1, [], realSeat)
            MessageManager.getInstance().messagePost(ListenerType.pdk_playerStateChanged, { playerSeat: realSeat, state:true, type: "ybq" });
        }
        else
            this.setSomeOneOutCard(msg.chairId, msg.cards, msg.laiziReplace)
        MessageManager.getInstance().disposeMsg();
     }


     protected onOpTimechange(msg)
     {
         this.setTime(msg.leftTime);
         MessageManager.getInstance().disposeMsg();
     }

    protected onDisMissDataRec(msg)
     {
         this.gameApplyData = msg
         MessageManager.getInstance().messagePost(ListenerType.pdk_dismissResponse, {})
     }
     
     private onPlayOnceAgain(msg)
     {
         this.gameinfo.roundId = msg.roundInfo.roundId
         MessageManager.getInstance().disposeMsg();
     }
 
     public updateTableInfo(msg, roundId)
     {
        if (this._gameinfo != null)
            return;
        this._gameinfo = new GameInfo_PDK();
        this._gameinfo.roundId = roundId
        this._gameinfo.updateTableInfo(msg)
     }

     public checkScoreMenKan(){
        if (this.gameinfo.rule.union == undefined)
            return false
        if (this.playerInfoMap.get(0).score < this.gameinfo.rule.union.entry_score/100)
            return true
        return false
     }

      // 如果数据先收到ui还没打开，就需要走这个方法
    public onReconnect()
    {
        this._playerInfoMap.forEach((infoObj, seat)=>{
            infoObj.onReconnect()
            var cardNum = this.playerInfoMap.get(seat).cards.length
            if (cardNum<= 2 && this.gameinfo.gameState == GAME_STATE_PDK.GAME_STATE_GAME)
            {
                if (cardNum == 1) { AudioManager.getInstance().playSFX("female_voice/female_25") }
                if (cardNum == 2) { AudioManager.getInstance().playSFX("female_voice/female_26") }
                this.setEffect({ realSeat: seat, type: 20 }) // 警报
            }
        })
        if (this.GameStartState > 0)
            this.setGameState(this.GameStartState)
        this._gameinfo.onReconnect()
        
        
    }

        
    /**设置当前操作玩家 */
    public setCurOperatePlayer(seat) {
        var nowId = this.playerInfoMap.get(seat).id
        this._gameinfo.curOperateId = nowId;
    }

    public onPlayerSit(msg)
    {
        if (msg.tableId != this.gameinfo.roomId)
        {
            MessageManager.getInstance().disposeMsg();
            return;
        }
        this.addPlayer(msg.seat)
        MessageManager.getInstance().disposeMsg();
    }

    public getRuleCardNum()
    {
        if (this.gameinfo.rule.play.card_num > 0)
            return this.gameinfo.rule.play.card_num
        return 16
    }

    /**玩家加入  ispost用于在切后台重连时，由于ui存在，避免model还没加载完报错*/
    public addPlayer(msg, isPost = true) {
        let playerInfo = new GamePlayerInfo_PDK();
        playerInfo.updatePlayerSimplyInfo(msg)
        if (!playerInfo.seat)
            return
        if (playerInfo.id == GameDataManager.getInstance().userInfoData.userId){
            this._playerInfoMap.set(0, playerInfo);
            playerInfo.realSeat = 0
        }
        else if (this._playerInfoMap.size == 0){
            this.tempList.push(playerInfo)
            return
        }
        else{
            this.initPlayerSeat(playerInfo)
        }
        if (this.tempList.length != 0){
            for (var tempInfo of this.tempList){
                this.initPlayerSeat(tempInfo)
                if (isPost)
                    MessageManager.getInstance().messagePost(ListenerType.pdk_playerNumChanged, { playerSeat: tempInfo.realSeat, tag: "add" })
            }
            this.tempList = []
        }
        if (isPost)
            MessageManager.getInstance().messagePost(ListenerType.pdk_playerNumChanged, { playerSeat: playerInfo.realSeat, tag: "add" });
    }

    private initPlayerSeat(playerInfo)
    {
        var otherRealSeat = this.getRealSeatByRemoteSeat(playerInfo.seat)
        this._playerInfoMap.set(otherRealSeat, playerInfo);
        playerInfo.realSeat = otherRealSeat
    }

    public getRealSeatByRemoteSeat(seat)
    {
        try{
            var playerNum = this.getCurTypePlayerNum()
            var myInfo = this._playerInfoMap.get(0)
            var offset = myInfo.realSeat - myInfo.seat
            var otherRealSeat = (seat + offset + playerNum)%playerNum
            var seatMap = []
            if (playerNum == 3) // 3人坐0,1,3号位
                seatMap = [0,1,3]
            else if (playerNum == 2) // 2人坐0,2
                seatMap = [0,2]
            else if (playerNum == 4)
                seatMap = [0,1,2,3]
            return seatMap[otherRealSeat]
        }
        catch (e) {
            GameManager.getInstance().handReconnect()
        }
    }

    public getCurTypePlayerNum():number
    {
        if (GameDataManager.getInstance().curGameType == GAME_TYPE.LRPDK)
            return 2
        else if (GameDataManager.getInstance().curGameType == GAME_TYPE.PDK)
            return 3
        return 0
    }

    /**玩家移除 */
    public removePlayer(seat) {
        if (this._playerInfoMap.get(seat))
        {
            this._playerInfoMap.delete(seat);
            MessageManager.getInstance().messagePost(ListenerType.pdk_playerNumChanged, { playerSeat: seat, tag: "remove" });
        }
    }

    /**玩家出牌 */
    public setSomeOneOutCard(chairId, cards, laiziReplace) {
        //基本数据处理
        var beforeReplaceList = JSON.parse(JSON.stringify(cards)) 
        if (laiziReplace) // 如果存在癞子，则进行替换
        {
            for (var i = 0; i < cards.length; i++)
            {
                if (this.laiZi == Utils.getPdkCardValue(cards[i]) && laiziReplace.length > 0)
                    cards[i] = laiziReplace.pop()
            }
        }
        //基本数据处理
        var realSeat = this.getRealSeatByRemoteSeat(chairId)
        cards = cards.sort(function (a, b) {return a - b})
        Utils.pdkWenDingSort(cards) // 收到的牌排个序
        if (this.gameinfo.lastOutSeat == -1 || this._gameinfo.lastOutSeat == realSeat) // 如果是那个人大牌或者首轮出牌
            this.checkVoice(3, cards, realSeat)
        else
            this.checkVoice(2, cards, realSeat)
        cards = Utils.sortWithLaiZi(cards) // 收到的牌排个序
        this.gameinfo.lastOutCards = cards;
        this.gameinfo.lastOutSeat = realSeat;
        var handCards = this.playerInfoMap.get(realSeat).cards
        //将出牌从手牌中移除
        if (realSeat != 0) { // 出牌的是别人
            for (var cardId of cards)
            {
                handCards.pop();
            }
        }
        else {
            for(var cardId of beforeReplaceList)
            {
                var idx = handCards.indexOf(cardId)
                if (idx >= 0)
                    this.playerInfoMap.get(realSeat).cards.splice(idx, 1);
                else    
                    console.log("error:出的牌没在手牌中")
            }
        }
        this._playerInfoMap.forEach((infoObj, seat)=>{
            if (infoObj.outCard.length != 0 && seat != realSeat) // 清理上一轮桌面上的牌
                infoObj.outCard = []
        })
        this.playerInfoMap.get(realSeat).outCard = cards; //加入到出牌区域
        this.setHeadCard(realSeat, handCards) // 刷新手牌
        this.checkAni(realSeat, cards)
    }

    /**通过id寻找到index */
    public getSeatById(id) {
        var tempSeat = -1
        this._playerInfoMap.forEach((infoObj, seat)=>{
            if (infoObj && infoObj.id == id)
                tempSeat = seat
        })
        return tempSeat;
    }

    /**查找自己 */
    public getSeatForSelf() {
        return this.getSeatById(GameDataManager.getInstance().userInfoData.userId)
    }

    /**操作时间改变 */
    public setTime(num) {
        this.gameinfo.time = num;
    }

    /**玩家上线离线 */
    public setSomeoneOnline(msg) {
        let seat = this.getSeatById(msg.playerId);
        if (seat < 0)
            return;
        this._playerInfoMap.get(seat).isonline = msg.isOnline;
        MessageManager.getInstance().messagePost(ListenerType.pdk_playerStateChanged, { playerSeat: seat, state:msg.isOnline, type: "online" });
    }

    /**设置当前局数 */
    public setCurRound(round) {
        this._gameinfo.curRound = round;
    }
    
    /**设置准备 */
    public setSomeOneReady(msg) {
        var otherRealSeat = this.getRealSeatByRemoteSeat(msg.readyChairId)
        if (!this._playerInfoMap.get(otherRealSeat))
        {
            GameManager.getInstance().handReconnect()
            return;
        }
        this._playerInfoMap.get(otherRealSeat).isready = true;
        MessageManager.getInstance().messagePost(ListenerType.pdk_playerStateChanged, { playerSeat: otherRealSeat, state:true, type: "ready" });
        MessageManager.getInstance().disposeMsg();
    }

    public setTrustee(seat, isTrustee)
    {
        if (!this._playerInfoMap.get(seat))
            return;
        this._playerInfoMap.get(seat).isTrustee = isTrustee
    }

    /**设置玩家分数 */
    public setPlyerScore(seat, score) {
        this._playerInfoMap.get(seat).score = score;
    }

    // 结算时更新积分
    public updatePlayerScore(seat, score) {
        if (!this._playerInfoMap.get(seat))
            return;
        this._playerInfoMap.get(seat).score = score;

    }

    /**设置游戏开始 */
    public setTableStart(bool) {
        this._gameinfo.mBTableStarted = bool;
    }
    
    /**变更游戏状态 */
    public setGameState(num) {
        this._gameinfo.gameState = num;
    }

   /**设置单局结算 */
   public setRoundOver(msg) {
        this.initOverPlayerData()
        this._gameinfo.curRoundOverData = msg;
         for (var j = 0; j < msg.playerBalance.length; j++)
        {
            var tempSeat = this.getRealSeatByRemoteSeat(msg.playerBalance[j].chairId)
            if (this.gameinfo.rule.union)
                this._playerInfoMap.get(tempSeat).clubScore = this._playerInfoMap.get(tempSeat).clubScore+msg.playerBalance[j].roundMoney/100
            else
                this._playerInfoMap.get(tempSeat).clubScore = this._playerInfoMap.get(tempSeat).clubScore+msg.playerBalance[j].roundScore
        }
        this._playerInfoMap.forEach((infoObj, seat)=>{
            infoObj.isready = false;
            MessageManager.getInstance().messagePost(ListenerType.pdk_playerStateChanged, { playerSeat: seat, state:false, type: "ready" });
            })
        MessageManager.getInstance().messagePost(ListenerType.pdk_gameRoundOver, {});
        MessageManager.getInstance().disposeMsg();
   }

   public initOverPlayerData() {
    this.overTempPlayerInfo.clear()
    this.playerInfoMap.forEach((infoObj, seat)=>{
        var info = {
            id: infoObj.id,
            name:infoObj.name,
            headurl:infoObj.headurl,
            seat: infoObj.seat,
            realSeat:infoObj.realSeat,
        }
        this.overTempPlayerInfo.set(seat,info)
    })
}

    /**设置总结算 */
    public setGameOver(msg) {
        this._gameinfo.curGameOverData = msg;
        if (this._gameinfo.curRoundOverData == null)
            this.initOverPlayerData()
        MessageManager.getInstance().messagePost(ListenerType.tuoGuanOver);
        MessageManager.getInstance().disposeMsg();
    }
    
    /**检测是否为房主 */
    public checkMaster(pid) {
        if (pid == this._gameinfo.creator) {
            return true;
        }
        else {
            return false;
        }
    }
   
     /**设置手牌 */
     public setHeadCard(realSeat, nowcards) {
        this._playerInfoMap.get(realSeat).cards = nowcards
    }
    
    public isFirstRound()
    {
        var result = true
        this._playerInfoMap.forEach((infoObj, seat)=>{
            if (infoObj.cards.length != this.getRuleCardNum())
                result = false
            })
        return result
    }

    //牌型 1:单张 2:对子 3:顺子 4:连对 5:三不带 6:三带一 7:三带二 8:四带二 9:四带三 10:飞机 11:飞机带单 12飞机带对 13:炸弹
    // 检测出的牌是否合法
    public checkSelctCardsVaild(outCards)
    {
        if(this._gameinfo.lastOutSeat == 0 || this._gameinfo.lastOutSeat == -1) // 如果上一轮最后一个出牌的是自己或者首轮，直接出牌
        {
            var oType = PDKCheckCardType.checkCardsType(outCards) // 符合出牌规则
            if (oType == null)
                return 11001
            if (oType.type == 8 && !this.gameinfo.rule.play.si_dai_er) // 四带二
                return 11002            
            else if(oType.type == 9 && !this.gameinfo.rule.play.si_dai_san) // 四带三
                return 11003
            else if(oType.type == 5 && this.playerInfoMap.get(0).cards.length != 3)
                return 11011
            else if (oType.type == 6) // 三带一
            {
                if(!this.gameinfo.rule.play.san_dai_yi) // 手中的牌不等于4张，或者没有勾选三带一 
                    return 11004
                else if (this.playerInfoMap.get(0).cards.length != 4)
                    return 11005
            }
            else if (oType.type == 15)
            {
                if (this.gameinfo.rule.play.plane_with_mix == false)
                    return 11013
                else if (outCards.length != this.playerInfoMap.get(0).cards.length)
                    return 11012
            }
            else if (this.playerInfoMap.size == 3 && oType.type == 1 && this._playerInfoMap.get(1).cards.length == 1 && this.gameinfo.rule.play.bao_dan_discard_max)// 三人跑的快，选择的是单牌，下家只有一张牌
            {
                if (Utils.getPdkCardValue(outCards[0])  < Utils.getPdkCardValue(this.playerInfoMap.get(0).cards[0]))
                {
                    return 11006
                }
            }
            else if (this.playerInfoMap.size == 2 && oType.type == 1 && this._playerInfoMap.get(2).cards.length == 1)
            {
                if (Utils.getPdkCardValue(outCards[0])  < Utils.getPdkCardValue(this.playerInfoMap.get(0).cards[0]))
                {
                    return 11006
                }
            }

            // 3人，首轮，勾选了必出黑桃3
            else if (this.playerInfoMap.size == 3 && this.isFirstRound() && this.gameinfo.rule.play.first_discard.with_3 && outCards.indexOf(3) < 0)
            {
                return 11007
            }

            return oType
        }
        else
        {
            var oType = PDKCheckCardType.checkCardsType(outCards)
            var oOutType = PDKCheckCardType.checkCardsType(this.gameinfo.lastOutCards)
            if (oType == null || oType.type == 15) // 最后一手才允许飞机少带
                return 11001
            if (oType.type != 13) // 自己出的不是炸弹
            {
                if (oType.type != oOutType.type || oType.minValue <= oOutType.minValue) // 两人牌型不同 或者 最大牌比对方小
                    return 11001
                else if (oType.type == 3 && outCards.length != this.gameinfo.lastOutCards.length)
                    return 11001
                else if (oType.type == 4 && outCards.length != this.gameinfo.lastOutCards.length)
                    return 11001
                else if (this.playerInfoMap.size == 3 && oType.type == 1 && this._playerInfoMap.get(1).cards.length == 1 && this.gameinfo.rule.play.bao_dan_discard_max)
                {
                    if (Utils.getPdkCardValue(outCards[0])  < Utils.getPdkCardValue(this.playerInfoMap.get(0).cards[0]))
                    {
                        return 11006
                    }
                }
                else if (this.playerInfoMap.size == 2 && oType.type == 1 && this._playerInfoMap.get(2).cards.length == 1)
                {
                    if (Utils.getPdkCardValue(outCards[0])  < Utils.getPdkCardValue(this.playerInfoMap.get(0).cards[0]))
                    {
                        return 11006
                    }
                }
            }
            else if (oType.type == 13)
            {
                if (oOutType.type == 13 && oType.minValue < oOutType.minValue)
                    return 11001
            }
            
            return oType
        }
    }

    public checkNoOutValid()
    {
        if (this.gameinfo.rule.play.must_discard && this.gameinfo.curTipsCardsArray.length != 0) // 勾选了能出必出
            return 1
        else if (this.playerInfoMap.size == 3 && this.gameinfo.rule.play.bao_dan_discard_max && this._playerInfoMap.get(1).cards.length == 1 && this.gameinfo.lastOutCards.length == 1 && this.gameinfo.curTipsCardsArray.length != 0)
        {
            // 三人跑得快，勾选报单出最大，下家剩一张，且上一个出的是单牌，且有能够压住上家的牌
            return 2
        }
        return 0

    }

    /** 设置提示牌型*/
    public setCurTipsOutCards() {
        if (this.gameinfo.curTipsIndex < this.gameinfo.curTipsCardsArray.length - 1)
            this.gameinfo.curTipsIndex += 1;
        else
            this.gameinfo.curTipsIndex = 0;
        MessageManager.getInstance().messagePost(ListenerType.pdk_curTipsCardsChanged);
        
    }

    protected checkVoice(type, outCards, realSeat)
    {

        var cardType = PDKCheckCardType.checkCardsType(outCards)
        MessageManager.getInstance().messagePost(ListenerType.pdk_voice, {type:type, oType:cardType, cards:outCards, seat:realSeat});
        
    }

    protected checkAni(seat, outCards)
    {
        var cardNum = this.playerInfoMap.get(seat).cards.length
        var voiceStr = ""
        if (cardNum<= 2 && cardNum > 0)
        {
            if (this.playerInfoMap.get(seat).sex == 1)
            {
                if (cardNum == 1) { voiceStr = "male_voice/baojing1" }
                if (cardNum == 2) { voiceStr = "male_voice/baojing2" }
            }
            else
            {
                if (cardNum == 1) { voiceStr = "female_voice/baojing1" }
                if (cardNum == 2) { voiceStr = "female_voice/baojing2" }
            }     
            AudioManager.getInstance().playSFX(voiceStr)
            this.setEffect({ realSeat: seat, type: 20 }) // 警报
        }
        var cardType = PDKCheckCardType.checkCardsType(outCards)
        this.setEffect({ realSeat: seat, type: cardType.type })

    }

    /**设置动画*/
    //牌型 1:单张 2:对子 3:顺子 4:连对 5:三不带 6:三带一 7:三带二 8:四带二 9:四带三 10:飞机 11:飞机带单 12飞机带对 13:炸弹
    public setEffect(msg) {
        if (msg.type == 3 || msg.type == 4 || msg.type == 10 || msg.type == 11 || msg.type == 12 || msg.type == 13 || msg.type == 15) {
            MessageManager.getInstance().messagePost(ListenerType.pdk_animationPlay, msg);
        }
        if (msg.type == 20) {
            MessageManager.getInstance().messagePost(ListenerType.pdk_animationPlay, msg);
        }
    }
   
    setOwner(msg) {
        this._gameinfo.creator = msg.newOwner;
        MessageManager.getInstance().disposeMsg();
    }

    // 收到deskenter时再次清理数据
    clearDataOnStart(){
        this._playerInfoMap.forEach((infoObj, seat)=>{
            infoObj.clearCards()
        })
        this.gameinfo.lastOutCards = [];
        this.gameinfo.lastOutSeat = -1;
        this.gameinfo.curTipsCardsArray = []
        this.gameinfo.curTipsIndex = -1
    }


    //清理玩家一局数据
    cleanRoundOver() {
        //玩家牌数据
        this._playerInfoMap.forEach((infoObj, seat)=>{
            infoObj.cards = [];
            infoObj.outCard = [];
        })
        this.gameinfo.curOperateId = 0;
        this.gameinfo.lastOutCards = [];
        this.gameinfo.lastOutSeat = -1;
        this.gameinfo.dealerId = -1;
        this.gameinfo.curTipsCardsArray = []
        this.gameinfo.curTipsIndex = -1
        this.GameStartState = -1
        this.roundOverDataUesed = false
        this._laiZi = 0
    }

    public clearDataByContinue(): void {
        this.gameinfo.curRound = 0
        this.gameinfo.time = -1
        this._gameinfo.curRoundOverData = null
        this._gameinfo.curGameOverData = null
        this._gameinfo.mBTableStarted = false
        this._playerInfoMap.forEach((infoObj, seat)=>{
            infoObj.clubScore = 0;
        })
    }

    public clear(){
        this.GameStartState = -1
        this._gameinfo = null
        this._playerInfoMap.clear()
        this._gameApplyData = null
        this._voteData = null
        ListenerManager.getInstance().removeAll(this)
    }

}

