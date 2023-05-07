import { SCPDKCheckCanBet } from './SCPDKCheckCanBet';
import { SCPDKCheckCardType } from './SCPDKCheckCardType';
import { GameManager } from './../../GameManager';
import { Utils } from './../../../framework/Utils/Utils';
import { AudioManager } from './../../../framework/Manager/AudioManager';
import { ListenerType } from './../ListenerType';
import { MessageManager } from './../../../framework/Manager/MessageManager';
import { GameData_PDK } from './../game_pdk/GameData_PDK';

export class GameData_SCPDK extends GameData_PDK{
    public static className = "GameData_SCPDK";

    protected initListen()
    {
        super.initListen()
    }

    
    public getRuleCardNum()
    {
        return 10
    }


    public getCurTypePlayerNum():number
    {
        var optionIndex = this.gameinfo.rule.room.player_count_option
        var playerNumList = [4,3,2]
        return playerNumList[optionIndex]
    }

    protected checkVoice(type, outCards, realSeat)
    {
        var cardType = SCPDKCheckCardType.checkCardsType(outCards)
        if (cardType == 15) // 四张没有音效
            return
        if (outCards.length > 0 && cardType == null)
        {
            var error = "出牌类型检测失败，牌："+ JSON.stringify(outCards) 
            console.log(error)
            GameManager.getInstance().onErrorHandler(null, null, "scpdk out card error",error, true);
            return
        }
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
        var cardType = SCPDKCheckCardType.checkCardsType(outCards)
        if (cardType == 15) //四张没有动画
            return
        if (cardType == null)
        {
            var error = "checkAni，出牌类型检测失败，牌："+ JSON.stringify(outCards) 
            console.log(error)
            GameManager.getInstance().onErrorHandler(null, null, "scpdk out card error",error, true);
            return
        }
        this.setEffect({ realSeat: seat, type: cardType.type })

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
                this.gameinfo.curTipsCardsArray = SCPDKCheckCanBet.checkCanBet(this.playerInfoMap.get(0).cards, this.gameinfo.lastOutCards,{laiZiValue:this.laiZi}) // 轮到自己出牌时更新提示牌型
        }

        MessageManager.getInstance().messagePost(ListenerType.pdk_playerStateChanged, { playerSeat: realSeat, state:true, type: "clear" });
        this.setCurOperatePlayer(realSeat); //设置当前玩家
        if (!(this.gameinfo.rule.trustee.second_opt >= 0))
            this.setTime(30)
        MessageManager.getInstance().disposeMsg();
    }


   
    public checkSelctCardsVaild(outCards)
    {
        if(this._gameinfo.lastOutSeat == 0 || this._gameinfo.lastOutSeat == -1) // 如果上一轮最后一个出牌的是自己或者首轮，直接出牌
        {
            var oType = SCPDKCheckCardType.checkCardsType(Utils.getOutLaiZiList(outCards, this.laiZi), {laizi:Utils.getLaiZiList(outCards, this.laiZi)}) // 符合出牌规则
            if (oType == null || (oType.type >= 6 && oType.type != 13 && oType.type != 15)) // 不允许3带1，3带2，4带2，4带3
                return 11001
            else if (this.playerInfoMap.size >= 3 && oType.type == 1 && this._playerInfoMap.get(1).cards.length == 1)
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
            else if (this.isFirstRound() && this.gameinfo.rule.play.first_discard && this.gameinfo.rule.play.first_discard.with_5 && outCards.indexOf(5) < 0)
            {
                return 11010
            }
            return oType
        }
        else
        {
            var oType = SCPDKCheckCardType.checkCardsType(Utils.getOutLaiZiList(outCards, this.laiZi), {laizi:Utils.getLaiZiList(outCards, this.laiZi)})
            var oOutType = SCPDKCheckCardType.checkCardsType(this.gameinfo.lastOutCards)
            if (oType == null || (oType.type >= 6 && oType.type != 13 && oType.type != 15)) // 不允许3带1，3带2，4带2，4带3
                return 11001
            if (oType.type != 13) // 自己出的不是炸弹
            {
                if (oType.type != oOutType.type || oType.minValue <= oOutType.minValue) // 两人牌型不同 或者 最大牌比对方小
                    return 11001
                else if (oType.type == 3 && outCards.length != this.gameinfo.lastOutCards.length)
                    return 11001
                else if (oType.type == 4 && outCards.length != this.gameinfo.lastOutCards.length)
                    return 11001
                else if (this.playerInfoMap.size >= 3 && oType.type == 1 && this._playerInfoMap.get(1).cards.length == 1)
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
            else if (oType.type == 13) // 需要判断纯癞子炸弹，软炸弹，硬炸弹大小
            {
                if (oOutType.type == 13 && !SCPDKCheckCardType.compareBomb(outCards,this.gameinfo.lastOutCards,oType.minValue,oOutType.minValue))
                    return 11001
            }
            
            return oType
        }
    }
    
    public checkNoOutValid()
    {
        if (this.playerInfoMap.size >= 3 &&  this._playerInfoMap.get(1).cards.length == 1 && this.gameinfo.lastOutCards.length == 1 && this.gameinfo.curTipsCardsArray.length != 0)
        {
            // 三人跑得快，勾选报单出最大，下家剩一张，且上一个出的是单牌，且有能够压住上家的牌
            return 2
        }
        return 0

    }


    public checkSpring()// 检测春天
    {
        // var landlordSeat = this.getRealSeatByRemoteSeat(this.gameinfo.landlordId)
        // if(landlordSeat == 0 && this.gameinfo.curRoundOverData.chunTian == 1) // 春天
        //     return true
        // else if (landlordSeat != 0 && this.gameinfo.curRoundOverData.chunTian == 2) // 反春
        //     return true
        // else
        //     return false
    }


}