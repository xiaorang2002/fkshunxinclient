import { GameManager } from './../../GameManager';
import { Utils } from './../../../framework/Utils/Utils';
import { DDZCheckCanBet } from './DDZCheckCanBet';
import { DDZCheckCardType } from './DDZCheckCardType';
import { AudioManager } from './../../../framework/Manager/AudioManager';
import { ListenerType } from './../ListenerType';
import { MessageManager } from './../../../framework/Manager/MessageManager';
import { GAME_TYPE } from './../GameConstValue';
import { GameDataManager } from './../../../framework/Manager/GameDataManager';
import { ListenerManager } from './../../../framework/Manager/ListenerManager';
import { GameData_PDK } from './../game_pdk/GameData_PDK';
import * as Proto from "../../../proto/proto-min";
import { GameInfo_DDZ, GAME_STATE_DDZ } from './GameInfo_DDZ';

export class GameData_DDZ extends GameData_PDK{
    public static className = "GameData_DDZ";

    /**游戏信息 */
    protected _gameinfo:GameInfo_DDZ = null;
    public get gameinfo() {
        return this._gameinfo
    }

    protected initListen()
    {
        ListenerManager.getInstance().add(Proto.SC_StandUpAndExitRoom.MsgID.ID, this, this.onPlayerLeave);  
        ListenerManager.getInstance().add(Proto.SC_NotifyStandUp.MsgID.ID, this, this.onPlayerLeave);     
        ListenerManager.getInstance().add(Proto.SC_NotifySitDown.MsgID.ID, this, this.onPlayerSit);           
        ListenerManager.getInstance().add(Proto.SC_Ready.MsgID.ID, this, this.setSomeOneReady);   
        ListenerManager.getInstance().add(Proto.SC_DdzDeskEnter.MsgID.ID, this, this.onGameDateInit);              // 游戏信息初始化
        ListenerManager.getInstance().add(Proto.SC_DdzDiscardRound.MsgID.ID, this, this.onOperatePlayerChanged);                           // 该谁操作
        ListenerManager.getInstance().add(Proto.SC_DismissTableReq.MsgID.ID, this, this.onDisMissDataRec);      
        ListenerManager.getInstance().add(Proto.S2C_TRANSFER_ROOM_OWNER_RES.MsgID.ID, this, this.setOwner);   
        ListenerManager.getInstance().add(Proto.SC_TimeOutNotify.MsgID.ID, this, this.onOpTimechange);     
        ListenerManager.getInstance().add(Proto.SC_DdzDoAction.MsgID.ID, this, this.onOutCard);                           // 出牌
        ListenerManager.getInstance().add(Proto.SC_DdzGameOver.MsgID.ID, this, this.setRoundOver); 
        ListenerManager.getInstance().add(Proto.SC_DdzFinalGameOver.MsgID.ID, this, this.setGameOver);                   // 换牌结束后
        
        ListenerManager.getInstance().add(Proto.SC_DdzCallLandlordRound.MsgID.ID, this, this.onCallRoundChange);   
        ListenerManager.getInstance().add(Proto.SC_DdzCallLandlord.MsgID.ID, this, this.onLandlordInfoChg);      
        ListenerManager.getInstance().add(Proto.SC_DdzCallLandlordOver.MsgID.ID, this, this.onLandlordOver);                           // 该谁操作
        ListenerManager.getInstance().add(Proto.SC_DdzCallLandlordInfo.MsgID.ID, this, this.onLandlordInfoRec);                        //  收到重连的叫地主信息
        ListenerManager.getInstance().add(Proto.SC_DdzRestart.MsgID.ID, this, this.onRestart);                        //  收到重连的叫地主信息
        ListenerManager.getInstance().add(Proto.SC_NotifyOnline.MsgID.ID, this, this.onPlayerOnlineRec);
        
    }

    protected onGameDateInit(msg)
    {
        // 有重连数据
        if (msg.pbRecData)
        {
            if (msg.pbRecData.lastDiscardChair > 0)
            {
                var realSeat = this.getRealSeatByRemoteSeat(msg.pbRecData.lastDiscardChair)
                this.gameinfo.lastOutSeat = realSeat
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
            if (msg.pbRecData.landlordCards.length != 0)
            {
                this._gameinfo.landlordIdCards = msg.pbRecData.landlordCards
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
        this._gameinfo.landlordId = msg.landlord
        this.setMultiple(msg.times)
        this.setBaseScore(msg.baseScore)
        this.setCurRound(msg.round)
        MessageManager.getInstance().messagePost(ListenerType.pdk_start, {});
        this.setGameState(msg.status) // 数据填充完成时在推进游戏进度
        MessageManager.getInstance().disposeMsg();
    }


    public onCallRoundChange(msg)
    {
        var realSeat = this.getRealSeatByRemoteSeat(msg.chairId)
        this._gameinfo.curCallSeat = realSeat
        this.setGameState(GAME_STATE_DDZ.GAME_STATE_CALL)
        if (!(this.gameinfo.rule.trustee.second_opt >= 0))
            this.setTime(30)
        MessageManager.getInstance().messagePost(ListenerType.ddz_callLandlordRoundChange, { seat: realSeat});
        MessageManager.getInstance().disposeMsg();
    }

    public onLandlordInfoChg(msg)
    {
        this.setMultiple(msg.times)
        this.setBaseScore(msg.baseScore)
        var realSeat = this.getRealSeatByRemoteSeat(msg.chairId)
        this._gameinfo.landlordInfo[realSeat] = msg.aciton
        this._gameinfo.curCallSeat = -1
        MessageManager.getInstance().messagePost(ListenerType.ddz_callLandlordInfoChange);
        MessageManager.getInstance().messagePost(ListenerType.ddz_landlordVoice, {seat:realSeat, action:msg.aciton});
        MessageManager.getInstance().disposeMsg();
    }

    public getRuleCardNum()
    {
        return 17
    }

    public onLandlordOver(msg)
    {
        this._gameinfo.landlordId = msg.landlord
        this._gameinfo.landlordIdCards = msg.cards
        var realSeat = this.getRealSeatByRemoteSeat(msg.landlord)
        this._playerInfoMap.get(realSeat).cards = this._playerInfoMap.get(realSeat).cards.concat(msg.cards)
        this.setGameState(GAME_STATE_DDZ.GAME_STATE_GAME)
        MessageManager.getInstance().messagePost(ListenerType.ddz_landLordOver, {});
        MessageManager.getInstance().disposeMsg();
    }

    public onLandlordInfoRec(msg)
    {
        if (msg.info == null)
            return
        this._playerInfoMap.forEach((infoObj, seat)=>{
            var action = msg.info[infoObj.seat]
            if (action)
                this._gameinfo.landlordInfo[seat] = action
        })
        MessageManager.getInstance().messagePost(ListenerType.ddz_callLandlordInfoChange);
        MessageManager.getInstance().disposeMsg();
    }

    private onRestart()
    {

        this.gameinfo.landlordInfo = {0:0,1:0,2:0,3:0}
        this.gameinfo.curCallSeat = -1
        MessageManager.getInstance().messagePost(ListenerType.ddz_callLandlordInfoChange);
        MessageManager.getInstance().disposeMsg();
    }

    public updateTableInfo(msg, roundId)
    {
        if (this._gameinfo != null)
            return;
        this._gameinfo = new GameInfo_DDZ();
        this._gameinfo.roundId = roundId
        this._gameinfo.updateTableInfo(msg)
    }

    public getCurTypePlayerNum():number
    {
        try{
            var optionIndex = this.gameinfo.rule.room.player_count_option
            var tempList = [3,2]
            return tempList[optionIndex]
        }
        catch (e)
        {
            return 0
        }
    }

    /**变更游戏状态 */
    public setGameState(num) {
        this._gameinfo.gameState = num;
    }
    
    /**设置倍数 */
    public setMultiple(num) {
        if (num == 0)
            num = 1
        this._gameinfo.multiple = num;
    }
    
    /**设置倍数 */
    public setBaseScore(num) {
        this._gameinfo.baseScore = num;
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
        MessageManager.getInstance().messagePost(ListenerType.ddz_gameRoundOver, {});
        MessageManager.getInstance().disposeMsg();
    }

    // 操作玩家改变
    protected onOperatePlayerChanged(msg)
    {
        var realSeat = this.getRealSeatByRemoteSeat(msg.chairId)
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
                this.gameinfo.curTipsCardsArray = DDZCheckCanBet.checkCanBet(this.playerInfoMap.get(0).cards, this.gameinfo.lastOutCards) // 轮到自己出牌时更新提示牌型
        }

        MessageManager.getInstance().messagePost(ListenerType.pdk_playerStateChanged, { playerSeat: realSeat, state:true, type: "clear" });
        this.setCurOperatePlayer(realSeat); //设置当前玩家
        if (!(this.gameinfo.rule.trustee.second_opt >= 0))
            this.setTime(30)
        MessageManager.getInstance().disposeMsg();
    }

    public checkSelctCardsVaild(outCards)
    {
        var oType = DDZCheckCardType.checkCardsType(outCards) // 符合出牌规则
        if(this._gameinfo.lastOutSeat == 0 || this._gameinfo.lastOutSeat == -1) // 如果上一轮最后一个出牌的是自己或者首轮，直接出牌
        {
            if (oType == null)
                return 11001
            else if ((oType.type == 8 || oType.type == 14) && !this.gameinfo.rule.play.si_dai_er) // 四带二
                return 11002            
            else if(oType.type == 7 && !this.gameinfo.rule.play.san_dai_er) // 三带二
                return 11008
            else if (oType.type == 5  && !this.gameinfo.rule.play.san_zhang) // 三张
                return 11009
            else
                return oType
        }
        else
        {
            var oType = DDZCheckCardType.checkCardsType(outCards)
            var oOutType = DDZCheckCardType.checkCardsType(this.gameinfo.lastOutCards)
            if (oType == null)
                return 11001
            else if (oType.type == 3 && outCards.length != this.gameinfo.lastOutCards.length)
                return 11001
            else if (oType.type == 4 && outCards.length != this.gameinfo.lastOutCards.length)
                return 11001
            if (oType.type != 13) // 自己出的不是炸弹
            {
                if (oType.type != oOutType.type || oType.minValue <= oOutType.minValue) // 两人牌型不同 或者 最大牌比对方小
                    return 11001
            }
            else if (oType.type == 13)
            {
                if (oOutType.type == 13 && oType.minValue < oOutType.minValue)
                    return 11001
            }
            return oType
        }
    }
    
    /**玩家出牌 */
    public setSomeOneOutCard(chairId, cards, laiziMap){
        super.setSomeOneOutCard(chairId, cards, laiziMap)
        this.checkTimes(cards) // 检测当前是否需要加倍
    }

    private checkTimes(outCards)
    {
        var cardType = DDZCheckCardType.checkCardsType(outCards)
        if (cardType.type == 13)
        {
            this.setMultiple(this._gameinfo.multiple * 2)
        }
    }


    protected checkVoice(type, outCards, realSeat)
    {
        var cardType = DDZCheckCardType.checkCardsType(outCards)
        MessageManager.getInstance().messagePost(ListenerType.ddz_voice, {type:type, oType:cardType, cards:outCards, seat:realSeat});
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
        var cardType = DDZCheckCardType.checkCardsType(outCards)
        this.setEffect({ realSeat: seat, type: cardType.type })

    }

    public checkMustCall() // 检测三大必抓
    {
        var isMustcall = this.gameinfo.rule.play.san_da_must_call
        if (!isMustcall)
            return false
        var cards = this.playerInfoMap.get(0).cards
        var count = 0
        for (var cardId of cards)
        {
            if (Utils.getPdkCardValue(cardId) > 14)
                count++
        }
        return count > 2
    }

    public checkSpring()// 检测春天
    {
        var landlordSeat = this.getRealSeatByRemoteSeat(this.gameinfo.landlordId)
        if(landlordSeat == 0 && this.gameinfo.curRoundOverData.chunTian == 1) // 春天
            return true
        else if (landlordSeat != 0 && this.gameinfo.curRoundOverData.chunTian == 2) // 反春
            return true
        else
            return false
    }

    
    /**设置动画*/
    //牌型 1:单张 2:对子 3:顺子 4:连对 5:三不带 6:三带一 7:三带二 8:四带二 9:四带三 10:飞机 11:飞机带单 12飞机带对 13:炸弹
    public setEffect(msg) {
        if (msg.type == 3 || msg.type == 4 || msg.type == 10 || msg.type == 11 || msg.type == 12 || msg.type == 13) {
            MessageManager.getInstance().messagePost(ListenerType.ddz_animationPlay, msg);
        }
        if (msg.type == 20) {
            MessageManager.getInstance().messagePost(ListenerType.ddz_animationPlay, msg);
        }
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
        this.gameinfo.landlordIdCards = []
        this.gameinfo.multiple = 1
        this.gameinfo.baseScore = 1
        this.gameinfo.baseScore = 1
        this.gameinfo.landlordId = 0
        this.gameinfo.landlordInfo = {0:0,1:0,2:0,3:0}
        this.gameinfo.curTipsCardsArray = []
        this.gameinfo.curTipsIndex = -1
        this.gameinfo.curCallSeat = -1
        this.GameStartState = -1
    }


}