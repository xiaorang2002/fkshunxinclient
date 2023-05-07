import { StringData } from './../StringData';
import { GameManager } from './../../GameManager';
import { Utils } from './../../../framework/Utils/Utils';
import { GamePlayerInfo_NN, PLAYER_STATE } from './GamePlayerInfo_NN';
import { GameInfo_NN, GAME_STATE_NN } from './GameInfo_NN';
import { ListenerManager } from '../../../framework/Manager/ListenerManager';
import { ListenerType } from "../ListenerType";
import { MessageManager } from "../../../framework/Manager/MessageManager";
import { GameDataManager } from "../../../framework/Manager/GameDataManager";
import * as Proto from "../../../proto/proto-min";

export class GameData_NN {
    public static className = "GameData_NN";

    /**游戏信息 */
    protected _gameinfo:GameInfo_NN = null;
    public get gameinfo() {
        return this._gameinfo
    }
    /**玩家信息 */
    protected _playerInfoMap= new Map<number, GamePlayerInfo_NN>();
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

   protected tempList = []
   protected GameStartState = -1
   public overTempPlayerInfo =  new Map() // 用于在结算时临时存储的玩家数据
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
        ListenerManager.getInstance().add(Proto.SC_OxStart.MsgID.ID, this, this.onGameStart);              // 游戏信息初始化
        ListenerManager.getInstance().add(Proto.SC_DismissTableReq.MsgID.ID, this, this.onDisMissDataRec);      
        ListenerManager.getInstance().add(Proto.S2C_TRANSFER_ROOM_OWNER_RES.MsgID.ID, this, this.setOwner);
        ListenerManager.getInstance().add(Proto.SC_OxTableInfo.MsgID.ID, this, this.onReconnectDataRec);
        ListenerManager.getInstance().add(Proto.SC_OxBalance.MsgID.ID, this, this.setRoundOver);
        ListenerManager.getInstance().add(Proto.SC_TimeOutNotify.MsgID.ID, this, this.onOpTimechange);     
        ListenerManager.getInstance().add(Proto.SC_OxFinalOver.MsgID.ID, this, this.setGameOver);                   // 换牌结束后
        ListenerManager.getInstance().add(Proto.SC_NotifyOnline.MsgID.ID, this, this.onPlayerOnlineRec);
        ListenerManager.getInstance().add(Proto.SC_PlayOnceAgain.MsgID.ID, this, this.onPlayOnceAgain);
        ListenerManager.getInstance().add(Proto.SC_OxDealCard.MsgID.ID, this, this.onCardRec);
        ListenerManager.getInstance().add(Proto.SC_AllowCallBanker.MsgID.ID, this, this.onCallBankerStateRec);
        ListenerManager.getInstance().add(Proto.SC_OxCallBanker.MsgID.ID, this, this.onCallBankerInfoRec);
        ListenerManager.getInstance().add(Proto.SC_OxAddScore.MsgID.ID, this, this.onAddScorerec);
        ListenerManager.getInstance().add(Proto.SC_OxSplitCards.MsgID.ID, this, this.onOpenCardsRec);
        ListenerManager.getInstance().add(Proto.SC_AllowAddScore.MsgID.ID, this, this.onAddScoreStateRec);
        ListenerManager.getInstance().add(Proto.SC_OxBankerInfo.MsgID.ID, this, this.onCallBankerEnd);
        ListenerManager.getInstance().add(Proto.SC_AllowSplitCards.MsgID.ID, this, this.onOpenCardStateRec);
        
    }

    protected onGameStart(msg)
    {
        this.cleanRoundOver()
        for (var chairId = 1; chairId < 9; chairId++)
        {
            if (msg.players[chairId])
            {
                var realSeat = this.getRealSeatByRemoteSeat(chairId)
                if (!this._playerInfoMap.get(realSeat))
                {
                    GameManager.getInstance().handReconnect()
                    return
                }
                this._playerInfoMap.get(realSeat).updatePlayerInfoOnStart(msg.players[chairId].cards)
            }
        }
        this.setTableStart(true);
        this.setCurRound(msg.curRound)
        if(this._gameinfo.rule.play.call_banker)
            this.setGameState(GAME_STATE_NN.STATE_ROB_BANKER)
        else
            this.setGameState(GAME_STATE_NN.STATE_BIT)
        MessageManager.getInstance().messagePost(ListenerType.nn_start, {});
        MessageManager.getInstance().disposeMsg();
    }

    private onReconnectDataRec(msg)
    {
        for(var chairId = 1; chairId < 9; chairId++)
        {
            var realSeat = this.getRealSeatByRemoteSeat(chairId)
            if (msg.players[chairId])
            {   
                if (!this.playerInfoMap.get(realSeat))
                {
                    GameManager.getInstance().handReconnect()
                    return
                }
                var playerStatus = msg.players[chairId].status
                if (playerStatus == 0) // 旁观状态
                {
                    var isGameing = false
                }
                else
                {
                    var isGameing = true
                    playerStatus = 1
                }
                this.playerInfoMap.get(realSeat).updatePlayerInfoOnRec(playerStatus, isGameing, msg.players[chairId])
                this.playerInfoMap.get(realSeat).clubScore = msg.players[chairId].totalMoney/100
            }
            if (msg.pstatusList)
            {
                if (msg.pstatusList[chairId])
                {
                    this.playerInfoMap.get(realSeat).status = msg.pstatusList[chairId]
                }
            }
        }
       
        if (msg.banker)
        {
            var bankerSeat = this.getRealSeatByRemoteSeat(msg.banker)
            this.setDealer(bankerSeat)
        }
        this.setCurRound(msg.round)
        if (msg.round == 0 && msg.status == 0)
            this.setTableStart(false);
        else
            this.setTableStart(true);
        this.setGameState(msg.status)
        this.roundOverDataUesed = false
        if (msg.status == GAME_STATE_NN.STATE_GAMEOVER) // 如果当前结算阶段，需要清理玩家的准备状态
        {
            this._playerInfoMap.forEach((infoObj, seat)=>{
                infoObj.isready = false; 
            })
        }
        MessageManager.getInstance().messagePost(ListenerType.nn_start, {});
        MessageManager.getInstance().disposeMsg();
        
    }

    public onCardRec(msg){
        if (!this._playerInfoMap.get(0))
        {
            MessageManager.getInstance().disposeMsg();
            return
        }
        this.playerInfoMap.get(0).cards = msg.cards
        MessageManager.getInstance().disposeMsg();
    }

    public onCallBankerStateRec(msg)
    {
        if (this._playerInfoMap.get(0))
        {
            this._playerInfoMap.get(0).isCallBanker = false
            this._playerInfoMap.get(0).robBankerTimes = 0
        }
        this.setGameState(GAME_STATE_NN.STATE_ROB_BANKER)
        // if (msg.timeout)
        //     this.setTime(msg.timeout);
        // else
        //     this.setTime(0);
        MessageManager.getInstance().disposeMsg();
    }

    public onAddScoreStateRec(msg)
    {
        this.setGameState(GAME_STATE_NN.STATE_BIT)
        MessageManager.getInstance().disposeMsg();
    }

    public onOpenCardStateRec(msg)
    {
        this.setGameState(GAME_STATE_NN.STATE_PLAY)
        this._playerInfoMap.get(0).cards = msg.cards
        MessageManager.getInstance().disposeMsg();
    }

    public onCallBankerInfoRec(msg)
    {
        var realSeat = this.getRealSeatByRemoteSeat(msg.chairId)
        if (!this._playerInfoMap.get(realSeat))
        {
            MessageManager.getInstance().disposeMsg();
            return
        }
        this.playerInfoMap.get(realSeat).isCallBanker = true
        this.playerInfoMap.get(realSeat).robBankerTimes = msg.times
        MessageManager.getInstance().disposeMsg();
    }

    public onAddScorerec(msg)
    {
        var realSeat = this.getRealSeatByRemoteSeat(msg.chairId)
        if (!this._playerInfoMap.get(realSeat))
        {
            MessageManager.getInstance().disposeMsg();
            return
        }
        this._playerInfoMap.get(realSeat).isUseScore = true
        this._playerInfoMap.get(realSeat).usescore += msg.score
        MessageManager.getInstance().disposeMsg();
    }

    public onOpenCardsRec(msg)
    {
        var realSeat = this.getRealSeatByRemoteSeat(msg.chairId)
        if (!this._playerInfoMap.get(realSeat))
        {
            MessageManager.getInstance().disposeMsg();
            return
        }
        var display= true
        // this.gameinfo.rule.trustee.second_opt >= 0 && 
        if (this.gameinfo.time < 1.5)
        {  
            display = false
        }
        if (display)
        {
            this._playerInfoMap.get(realSeat).isDisplayedCards = true
            if (msg.cardsPair.length == 2)
            {
                if (msg.cardsPair[0].cards.length > msg.cardsPair[1].cards.length)
                    this._playerInfoMap.get(realSeat).cards = msg.cardsPair[0].cards.concat(msg.cardsPair[1].cards)
                else
                    this._playerInfoMap.get(realSeat).cards = msg.cardsPair[1].cards.concat(msg.cardsPair[0].cards)
            }
            else if (msg.cardsPair.length == 1)
            {
                if (realSeat != 0 || msg.type != 1)
                    this._playerInfoMap.get(realSeat).cards = msg.cardsPair[0].cards
            }
            this._playerInfoMap.get(realSeat).cardsType = msg.type
            if (msg.type != 21 && msg.type != 23 && msg.type != 24 && msg.type != 28)
            {
                var voiceStr = this.getVoiceStringByType(msg.type)
                MessageManager.getInstance().messagePost(ListenerType.nn_voice, {seat: realSeat, type:voiceStr});
            }
        }
        MessageManager.getInstance().disposeMsg();
    }

    public getVoiceStringByType(type) // 获取音效
    {
        var voiceMap = {1:"no_niu", 2:"niu_1", 3:"niu_2", 4:"niu_3", 5:"niu_4", 6:"niu_5", 7:"niu_6", 8:"niu_7"
        , 9:"niu_8", 10:"niu_9", 11:"niu_niu", 21:"shunzi_niu", 22:"tonghua_niu", 23:"yinhua_niu", 24:"jinhua_niu",
        25:"hulu_niu", 26:"boom_niu", 27:"wuxiao_niu", 28:"tonghaushun_niu"}
        return voiceMap[type]
    }

    public onCallBankerEnd(msg)
    {
        var realSeat = this.getRealSeatByRemoteSeat(msg.bankerInfo.chairId)
        if (!this._playerInfoMap.get(realSeat))
        {
            MessageManager.getInstance().disposeMsg();
            return
        }
        // 做动画
        // MessageManager.getInstance().messagePost(ListenerType.nn_onCallBankerEnd, {bankerSeat:realSeat});
        //不做动画
        this.setDealer(realSeat)
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
             {// 检测是否是由于积分门槛导致玩家无法再来一局
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
    

     protected onOpTimechange(msg)
     {
         this.setTime(msg.leftTime);
         MessageManager.getInstance().disposeMsg();
     }
     

     protected onDisMissDataRec(msg)
     {
         this.gameApplyData = msg
         MessageManager.getInstance().messagePost(ListenerType.nn_dismissResponse, {})
     }
    

     public updateTableInfo(msg)
     {
         if (this._gameinfo != null)
             return;
         this._gameinfo = new GameInfo_NN();
         this._gameinfo.updateTableInfo(msg)
     }

      // 如果数据先收到ui还没打开，就需要走这个方法
    public onReconnect()
    {
        this._playerInfoMap.forEach((infoObj, seat)=>{
            infoObj.onReconnect()
        })
        if (this.GameStartState > 0)
            this.setGameState(this.GameStartState)
        this._gameinfo.onReconnect()
        
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
    
    private onPlayerOnlineRec(msg)
    {
       var info = {
           playerId: msg.guid,
           isOnline: msg.isOnline
       }
       this.setSomeoneOnline(info)
       MessageManager.getInstance().disposeMsg();
    }

    public checkScoreMenKan(){
        if (this.gameinfo.rule.union == undefined)
            return false
        if (this.playerInfoMap.get(0).score < this.gameinfo.rule.union.entry_score/100)
            return true
        return false
     }

     private onPlayOnceAgain(msg)
     {
        if (msg.result != 0)
        {
            GameManager.getInstance().openWeakTipsUI(StringData.getString(msg.result));
            MessageManager.getInstance().messageSend(Proto.CS_StandUpAndExitRoom.MsgID.ID, {});
            MessageManager.getInstance().disposeMsg();
            return
        }
        this.gameinfo.roundId = msg.roundInfo.roundId
        MessageManager.getInstance().disposeMsg();
     }

    /**玩家加入  ispost用于在切后台重连时，由于ui存在，避免model还没加载完报错*/
    public addPlayer(msg, isPost = true) {
        let playerInfo = new GamePlayerInfo_NN();
        playerInfo.updatePlayerSimplyInfo(msg)
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
                    MessageManager.getInstance().messagePost(ListenerType.nn_playerNumChanged, { playerSeat: tempInfo.realSeat, tag: "add" })
            }
            this.tempList = []
        }
        if (isPost)
            MessageManager.getInstance().messagePost(ListenerType.nn_playerNumChanged, { playerSeat: playerInfo.realSeat, tag: "add" });
    }

    private initPlayerSeat(playerInfo)
    {
        var otherRealSeat = this.getRealSeatByRemoteSeat(playerInfo.seat)
        playerInfo.realSeat = otherRealSeat
        this._playerInfoMap.set(otherRealSeat, playerInfo);
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
        return list[this.gameinfo.rule.room.player_count_option]
    }

    /**玩家移除 */
    public removePlayer(seat) {
        if (this._playerInfoMap.get(seat))
        {
            this._playerInfoMap.delete(seat);
            MessageManager.getInstance().messagePost(ListenerType.nn_playerNumChanged, { playerSeat: seat, tag: "remove" });
        }
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
        if(seat >= 0 && this._playerInfoMap.get(seat))
        {
            this._playerInfoMap.get(seat).isonline = msg.isOnline;
            MessageManager.getInstance().messagePost(ListenerType.nn_playerStateChanged, { playerSeat: seat, state:msg.isOnline, type: "online" });
        }
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
            return
        }
        this._playerInfoMap.get(otherRealSeat).isready = true;
        MessageManager.getInstance().messagePost(ListenerType.nn_playerStateChanged, { playerSeat: otherRealSeat, state:true, type: "ready" });
        MessageManager.getInstance().disposeMsg();
    }

    /**设置玩家分数 */
    public setPlyerScore(seat, score) {
        this._playerInfoMap.get(seat).score = score;
    }

    // 结算时更新积分
    public updatePlayerScore(seat, score) {
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
        this._gameinfo.curRoundOverData = msg;
        this._playerInfoMap.forEach((infoObj, seat)=>{
            infoObj.isready = false; 
        }) 
        MessageManager.getInstance().messagePost(ListenerType.nn_gameRoundOver, {roundOverData:msg});
        MessageManager.getInstance().disposeMsg();
   }
  /**设置总结算 */
    public setGameOver(msg) {
        this._gameinfo.curGameOverData = msg;
        this.initOverPlayerData()
        this.setGameState(GAME_STATE_NN.STATE_FINAL_OVER)
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

    /**检测是否为房主 */
    public checkMaster(pid) {
        if (pid == this._gameinfo.creator) {
            return true;
        }
        else {
            return false;
        }
    }
    
    /**设置庄家 */
    public setDealer(realSeat) {
        this._gameinfo.dealerId = this.playerInfoMap.get(realSeat).id;
    }

     /**设置手牌 */
     public setHeadCard(realSeat, nowcards) {
        this._playerInfoMap.get(realSeat).cards = nowcards
    }
   
    setOwner(msg) {
        this._gameinfo.creator = msg.newOwner;
        MessageManager.getInstance().disposeMsg();
    }

    setPlayerCardsByPair(seat, pair)
    {
        if (pair)
        {
            if (pair.length == 2)
            {
                if (pair[0].cards.length > pair[1].cards.length)
                    this._playerInfoMap.get(seat).cards = pair[0].cards.concat(pair[1].cards)
                else
                    this._playerInfoMap.get(seat).cards = pair[1].cards.concat(pair[0].cards)
            }
            else if (pair.length == 1)
            {
                if (seat != 0)
                    this._playerInfoMap.get(seat).cards = pair[0].cards
            }
        }
    }

    //清理玩家一局数据
    cleanRoundOver() {
        //玩家牌数据
        this._playerInfoMap.forEach((infoObj, seat)=>{
            infoObj.isGaming = false;
            infoObj.isDisplayedCards = false;
            infoObj.isCallBanker = false;
            infoObj.isUseScore = false;
            infoObj.cards = [];
            infoObj.usescore = 0;
            infoObj.cardsType = 0;
            infoObj.robBankerTimes = 0;
        })
        this.GameStartState = -1
        this.gameinfo.dealerId = -1;
        this.gameinfo.curGameOverData = null
        this.roundOverDataUesed = false
    }

    public clearDataByContinue(){
        this.cleanRoundOver()
        this.gameinfo.curRound = 0
        this.gameinfo.dealerId = -1;
        this._gameinfo.curRoundOverData = null
        this._gameinfo.curGameOverData = null
        this._gameinfo.mBTableStarted = false
        this._playerInfoMap.forEach((infoObj, seat)=>{
            infoObj.clubScore = 0;
            infoObj.status = 0;
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

