import { StringData } from './../StringData';
import { GameManager } from './../../GameManager';
import { Utils } from './../../../framework/Utils/Utils';
import { GamePlayerInfo_ZJH, PLAYER_STATE } from './GamePlayerInfo_ZJH';
import { GameInfo_ZJH, GAME_STATE_ZJH } from './GameInfo_ZJH';
import { ListenerManager } from '../../../framework/Manager/ListenerManager';
import { ListenerType } from "../ListenerType";
import { MessageManager } from "../../../framework/Manager/MessageManager";
import { GameDataManager } from "../../../framework/Manager/GameDataManager";
import * as Proto from "../../../proto/proto-min";


enum ZHAJINHUA_PLAYER_STATUS{
    PS_WAHTER = 0,           //空闲
	PS_FREE = 1,		   //旁观
    PS_READY = 2,          //准备
    PS_WAIT = 3,          //等待下注
    PS_CONTROL = 4,        //准备操作
    PS_LOOK = 5,           //看牌
    PS_COMPARE = 6,        //比牌
    PS_DROP = 7,           //弃牌
    PS_LOSE = 8,           //淘汰
    PS_EXIT = 9,           //离开
}



export class GameData_ZJH {
    public static className = "GameData_ZJH";

    /**游戏信息 */
    protected _gameinfo:GameInfo_ZJH = null;
    public get gameinfo() {
        return this._gameinfo
    }
    /**玩家信息 */
    protected _playerInfoMap= new Map<number, GamePlayerInfo_ZJH>();
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
        ListenerManager.getInstance().add(Proto.SC_ZhaJinHuaStart.MsgID.ID, this, this.onGameStart);              // 游戏信息初始化
        ListenerManager.getInstance().add(Proto.SC_ZhaJinHuaTurn.MsgID.ID, this, this.onOperatePlayerChanged);                           // 该谁操作
        ListenerManager.getInstance().add(Proto.SC_DismissTableReq.MsgID.ID, this, this.onDisMissDataRec);      
        ListenerManager.getInstance().add(Proto.S2C_TRANSFER_ROOM_OWNER_RES.MsgID.ID, this, this.setOwner);
        ListenerManager.getInstance().add(Proto.SC_ZhaJinHuaAddScore.MsgID.ID, this, this.onAddScoreAction);
        ListenerManager.getInstance().add(Proto.SC_ZhaJinHuaLookCard.MsgID.ID, this, this.onLookCardAction);
        ListenerManager.getInstance().add(Proto.SC_ZhaJinHuaCompareCards.MsgID.ID, this, this.onCompareAction);
        ListenerManager.getInstance().add(Proto.SC_ZhaJinHuaRound.MsgID.ID, this, this.onLunChanged);
        ListenerManager.getInstance().add(Proto.SC_ZhaJinHuaGiveUp.MsgID.ID, this, this.onGiveUpAction);
        ListenerManager.getInstance().add(Proto.SC_ZhaJinHuaFollowBet.MsgID.ID, this, this.onFollowUpAction);
        ListenerManager.getInstance().add(Proto.SC_ZhaJinHuaAllIn.MsgID.ID, this, this.onGuzhuAction);
        ListenerManager.getInstance().add(Proto.SC_ZhaJinHuaReconnect.MsgID.ID, this, this.onReconnectDataRec);
        ListenerManager.getInstance().add(Proto.SC_ZhaJinHuaGameOver.MsgID.ID, this, this.setRoundOver);
        ListenerManager.getInstance().add(Proto.SC_TimeOutNotify.MsgID.ID, this, this.onOpTimechange);     
        ListenerManager.getInstance().add(Proto.SC_ZhaJinHuaFinalOver.MsgID.ID, this, this.setGameOver);                   // 换牌结束后
        ListenerManager.getInstance().add(Proto.SC_NotifyOnline.MsgID.ID, this, this.onPlayerOnlineRec);
        ListenerManager.getInstance().add(Proto.SC_PlayOnceAgain.MsgID.ID, this, this.onPlayOnceAgain);
        ListenerManager.getInstance().add(Proto.SC_ZhaJinHuaTableGamingInfo.MsgID.ID, this, this.onReconnectDataRec);

    }

    protected onGameStart(msg)
    {
        this.cleanRoundOver()
        for (var chairId of msg.allChairs)
        {
            var realSeat = this.getRealSeatByRemoteSeat(chairId)
            if (!this._playerInfoMap.get(realSeat))
            {
                GameManager.getInstance().handReconnect()
                return
            }
            this._playerInfoMap.get(realSeat).updatePlayerInfoOnStart()
            this.initBaseScoreByStart(realSeat)
        }
        this.setTableStart(true);
        this.setDealer(msg.banker)
        this.setCurRound(msg.curRound)
        this.setCurLun(1)
        this.gameinfo.baseScore = this.gameinfo.rule.play.base_score
        this.setGameState(GAME_STATE_ZJH.STATE_PLAY) // 数据填充完成时在推进游戏进度
        MessageManager.getInstance().messagePost(ListenerType.zjh_start, {});
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
                    if (playerStatus != ZHAJINHUA_PLAYER_STATUS.PS_DROP && playerStatus != ZHAJINHUA_PLAYER_STATUS.PS_LOSE)
                        playerStatus = 1
                    if (msg.players[chairId].isLookCards && playerStatus != ZHAJINHUA_PLAYER_STATUS.PS_DROP && playerStatus != ZHAJINHUA_PLAYER_STATUS.PS_LOSE)
                        playerStatus = ZHAJINHUA_PLAYER_STATUS.PS_LOOK
                }
                this.playerInfoMap.get(realSeat).updatePlayerInfoOnRec(playerStatus, msg.players[chairId].cards, isGameing, msg.players[chairId].betScore)
                this.playerInfoMap.get(realSeat).clubScore = msg.players[chairId].totalMoney/100
                this.playerInfoMap.get(realSeat).status = msg.players[chairId].pstatus
            }
        }

        this.gameinfo.allScore = msg.deskScore
        this.gameinfo.chipsArray = msg.deskChips
        this.gameinfo.baseScore = msg.curBetScore
        this.roundOverDataUesed = false
        this.setDealer(msg.banker)
        this.setCurRound(msg.round)
        this.setCurLun(msg.betRound)
        if (msg.round == 0 && msg.status == 0)
            this.setTableStart(false);
        else
            this.setTableStart(true);
        this.setGameState(msg.status)
        MessageManager.getInstance().messagePost(ListenerType.zjh_start, {});
        MessageManager.getInstance().disposeMsg();
        
    }

    // 操作玩家改变
    protected onOperatePlayerChanged(msg)
    {
        var realSeat = this.getRealSeatByRemoteSeat(msg.chairId)
        if (!this._playerInfoMap.get(realSeat))
        {
            GameManager.getInstance().handReconnect()
            return
        }
        this.updatePlayerControl(msg.actions)
        this.setCurOperatePlayer(realSeat); //设置当前玩家
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
                    MessageManager.getInstance().messagePost(ListenerType.zjh_playerNumChanged, { playerSeat: seat, tag: "remove" });
                    MessageManager.getInstance().disposeMsg();
                    return
                }
            })
            MessageManager.getInstance().disposeMsg();
        }
     }
    
    private onLunChanged(msg)
    {
        this._gameinfo.curLun = msg.round
        MessageManager.getInstance().disposeMsg();
    }

    private onAddScoreAction(msg)
    {
        var realSeat = this.getRealSeatByRemoteSeat(msg.chairId)
        if (!this._playerInfoMap.get(realSeat))
        {
            MessageManager.getInstance().disposeMsg();
            return
        }
        var times = 1
        if (this.playerInfoMap.get(realSeat).state == PLAYER_STATE.STATE_LOOK)
            times = 2
        this.gameinfo.baseScore = msg.score/times
        this._playerInfoMap.get(realSeat).usescore += msg.score
        this.gameinfo.allScore += msg.score
        // 甩筹码
        MessageManager.getInstance().messagePost(ListenerType.zjh_putChipsToTable, {seat: realSeat, score:msg.score});
        MessageManager.getInstance().messagePost(ListenerType.zjh_voice, {seat: realSeat, type:"jiazhu"});
        MessageManager.getInstance().disposeMsg();

    }

    private onFollowUpAction(msg)
    {
        var realSeat = this.getRealSeatByRemoteSeat(msg.chairId)
        if (!this._playerInfoMap.get(realSeat))
        {
            MessageManager.getInstance().disposeMsg();
            return
        }
        this._playerInfoMap.get(realSeat).usescore += msg.score
        this.gameinfo.allScore += msg.score
        MessageManager.getInstance().messagePost(ListenerType.zjh_putChipsToTable, {seat: realSeat, score:msg.score});
        MessageManager.getInstance().messagePost(ListenerType.zjh_voice, {seat: realSeat, type:"genzhu"});
        MessageManager.getInstance().disposeMsg();
    }

    private onGuzhuAction(msg)
    {
        var realSeat = this.getRealSeatByRemoteSeat(msg.chairId)
        if (!this._playerInfoMap.get(realSeat))
        {
            MessageManager.getInstance().disposeMsg();
            return
        }
        if (msg.score > 0)
        {
            this._playerInfoMap.get(realSeat).usescore += msg.score
            this.gameinfo.allScore += msg.score
            // 甩筹码
            MessageManager.getInstance().messagePost(ListenerType.zjh_putChipsToTable, {seat: realSeat, score:msg.score});
        }
        MessageManager.getInstance().messagePost(ListenerType.zjh_allInAction, {allInSeat: realSeat, isWin:msg.isWin});
        // 播放孤注一掷动画
        // MessageManager.getInstance().disposeMsg();

    }

    private onLookCardAction(msg)
    {
        var realSeat = this.getRealSeatByRemoteSeat(msg.chairId)
        if (!this._playerInfoMap.get(realSeat))
        {
            MessageManager.getInstance().disposeMsg();
            return
        }
        if (realSeat == 0)
            this._playerInfoMap.get(realSeat).cards = msg.cards
        this._playerInfoMap.get(realSeat).state = PLAYER_STATE.STATE_LOOK
        MessageManager.getInstance().messagePost(ListenerType.zjh_voice, {seat: realSeat, type:"kanpai"});
        MessageManager.getInstance().disposeMsg();
    }
    
    private onGiveUpAction(msg)
    {
        var realSeat = this.getRealSeatByRemoteSeat(msg.chairId)
        if (!this._playerInfoMap.get(realSeat))
        {
            MessageManager.getInstance().disposeMsg();
            return
        }
        this._playerInfoMap.get(realSeat).state = PLAYER_STATE.STATE_ABANDON
        MessageManager.getInstance().messagePost(ListenerType.zjh_voice, {seat: realSeat, type:"qipai"});
        MessageManager.getInstance().disposeMsg();
    }

    private onCompareAction(msg)
    {
        var sourceSeat = this.getRealSeatByRemoteSeat(msg.comparer)
        var targetSeat = this.getRealSeatByRemoteSeat(msg.compare_with)
        var winnerSeat = this.getRealSeatByRemoteSeat(msg.winner)
        var loserSeat = this.getRealSeatByRemoteSeat(msg.loser)
        if (!this._playerInfoMap.get(sourceSeat))
        {
            MessageManager.getInstance().disposeMsg();
            return
        }
        // 比牌动画
        this._playerInfoMap.get(sourceSeat).usescore += msg.score
        this.gameinfo.allScore += msg.score
        MessageManager.getInstance().messagePost(ListenerType.zjh_putChipsToTable, {seat: sourceSeat, score:msg.score});
        MessageManager.getInstance().messagePost(ListenerType.zjh_biPaiAction, {winnerSeat: winnerSeat, loserSeat:loserSeat});
        MessageManager.getInstance().messagePost(ListenerType.zjh_voice, {seat: sourceSeat, type:"bipai"});

    }
  

     protected onOpTimechange(msg)
     {
         this.setTime(msg.leftTime);
         MessageManager.getInstance().disposeMsg();
     }
     

     protected onDisMissDataRec(msg)
     {
         this.gameApplyData = msg
         MessageManager.getInstance().messagePost(ListenerType.zjh_dismissResponse, {})
     }
    
     private initBaseScoreByStart(seat){
        var menScore = this.gameinfo.rule.play.base_men_score
        if (!menScore)
            menScore = this.gameinfo.rule.play.base_score
        this._playerInfoMap.get(seat).usescore += menScore
        this.gameinfo.allScore += menScore
     }

     public updateTableInfo(msg)
     {
         if (this._gameinfo != null)
             return;
         this._gameinfo = new GameInfo_ZJH();
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
        
    /**设置当前操作玩家 */
    public setCurOperatePlayer(seat) {
        var nowId = this.playerInfoMap.get(seat).id
        this._gameinfo.curOperateId = nowId;
    }

    private updatePlayerControl(actions) {
        this._gameinfo.curOperateControl = [false, false, false, false, false, false]
        for(var action of actions)
            this._gameinfo.curOperateControl[action] = true;
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
        let playerInfo = new GamePlayerInfo_ZJH();
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
                    MessageManager.getInstance().messagePost(ListenerType.zjh_playerNumChanged, { playerSeat: tempInfo.realSeat, tag: "add" })
            }
            this.tempList = []
        }
        if (isPost)
            MessageManager.getInstance().messagePost(ListenerType.zjh_playerNumChanged, { playerSeat: playerInfo.realSeat, tag: "add" });
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
            MessageManager.getInstance().messagePost(ListenerType.zjh_playerNumChanged, { playerSeat: seat, tag: "remove" });
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
            MessageManager.getInstance().messagePost(ListenerType.zjh_playerStateChanged, { playerSeat: seat, state:msg.isOnline, type: "online" });
        }
    }

    /**设置当前局数 */
    public setCurRound(round) {
        this._gameinfo.curRound = round;
    }
    
    /**设置当前轮数 */
    public setCurLun(lun) {
    this._gameinfo.curLun = lun;
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
        MessageManager.getInstance().messagePost(ListenerType.zjh_playerStateChanged, { playerSeat: otherRealSeat, state:true, type: "ready" });
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
        this.setGameState(GAME_STATE_ZJH.STATE_GAMEOVER) 
        this._playerInfoMap.forEach((infoObj, seat)=>{
            infoObj.isready = false; 
        }) 
        MessageManager.getInstance().messagePost(ListenerType.zjh_gameRoundOver, {roundOverData:msg});
        MessageManager.getInstance().disposeMsg();
   }
  /**设置总结算 */
    public setGameOver(msg) {
        this._gameinfo.curGameOverData = msg;
        this.initOverPlayerData()
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
    public setDealer(seat) {
        if (seat == 0)
            return;
        var realSeat = this.getRealSeatByRemoteSeat(seat)
        if (this.playerInfoMap.get(realSeat))
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

    //清理玩家一局数据
    cleanRoundOver() {
        //玩家牌数据
        this._playerInfoMap.forEach((infoObj, seat)=>{
            infoObj.cards = [];
            infoObj.isGaming = false;
            infoObj.usescore = 0;
            infoObj.state = PLAYER_STATE.STATE_NULL
        })
        this.gameinfo.curOperateId = 0;
        this.GameStartState = -1
        this.gameinfo.allScore = 0
        this.gameinfo.dealerId = -1;
        this.gameinfo.curGameOverData = null
        this.gameinfo.chipsArray = []
        this.roundOverDataUesed = false
    }

    public clearDataByContinue(){
        this.cleanRoundOver()
        this.gameinfo.curRound = 0
        this.gameinfo.curLun = 0;
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

