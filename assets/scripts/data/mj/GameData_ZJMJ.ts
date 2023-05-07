import { GAME_STATE_MJ } from './defines';
import { GameDataManager } from './../../../framework/Manager/GameDataManager';
import { MJ_ACTION, GAME_TYPE } from './../GameConstValue';
import { MessageManager } from './../../../framework/Manager/MessageManager';
import { ListenerManager } from './../../../framework/Manager/ListenerManager';
import { GameData_Mj } from './GameData_Mj';
import * as Proto from "../../../proto/proto-min";
import { ListenerType } from "../ListenerType";


// 捉鸡麻将的数据类
export class GameData_ZJMJ extends GameData_Mj {
    public static className = "GameData_ZJMJ";

    protected initListen()
    {
        super.initListen()
        ListenerManager.getInstance().add(Proto.SC_Maajan_Game_Finish.MsgID.ID, this, this.setRoundOver);        
        ListenerManager.getInstance().add(Proto.SC_Maajan_Final_Game_Over.MsgID.ID, this, this.setGameOver);                  // 游戏结束
        ListenerManager.getInstance().add(Proto.SC_MaajanZhuoJiGuMai.MsgID.ID, this, this.onGuMaiScoreRec);                  // 游戏结束
        ListenerManager.getInstance().add(Proto.SC_MaajanZhuoJiBeginGuMai.MsgID.ID, this, this.onGuMaiStart);                 
        
    }

    private onGuMaiStart(msg) {
        this.setTableStart(true);
        if (this.gameinfo.gameState != GAME_STATE_MJ.GU_MAI)
            this.setGameState(GAME_STATE_MJ.GU_MAI) // 估卖阶段
        MessageManager.getInstance().messagePost(ListenerType.mjzj_onMyGuMai, {})
        MessageManager.getInstance().disposeMsg();
    }

    private onGuMaiScoreRec(msg)
    {
        var seat = this.getRealSeatByRemoteSeat(msg.chairId)
        this.playerInfoMap.get(seat).guMaiScore = msg.score
        MessageManager.getInstance().disposeMsg();
    }

    protected onOutMj(msg) {
        if (GameDataManager.getInstance().curGameType == GAME_TYPE.MHXL || GameDataManager.getInstance().curGameType == GAME_TYPE.LFMJ)
            this.chekChickActionByOutMj(msg.tile)
        this.setSomeOneOutMj(msg.chairId, msg.tile)
        MessageManager.getInstance().disposeMsg();
    }

    protected onActionRec(msg)
    {
        //  碰:1, 直杠:2,  点炮:3,  自摸:4,  补杠:5,   暗杠:6,  慌庄:7,  其他:过(保留)
        var realSeat = this.getRealSeatByRemoteSeat(msg.chairId)
        var poutid = this.gameinfo.lastOutPid
        var myId = this.playerInfoMap.get(realSeat).id
        var type = 0
        if (msg.action == MJ_ACTION.ACTION_PENG)
            type = 1
        else if (msg.action == MJ_ACTION.ACTION_MING_GANG)
            type = 2
        else if (msg.action == MJ_ACTION.ACTION_AN_GANG)
            type = 6
        else if  (msg.action == MJ_ACTION.ACTION_BA_GANG)
            type = 5
        else if (msg.action == MJ_ACTION.ACTION_HU)
            type = 3
        else if (msg.action == MJ_ACTION.ACTION_QIANG_GANG_HU) // 抢杠胡
        {
            var poutSeat = this.getRealSeatByRemoteSeat(msg.targetChairId)
            poutid = this.playerInfoMap.get(poutSeat).id
            type = 12
        }
        else if (msg.action == MJ_ACTION.ACTION_ZI_MO)
            type = 4
        else if (msg.action == MJ_ACTION.ACTION_TING)
            type = 8 
        else if (msg.action == MJ_ACTION.ACTION_PASS)
            type = 9
        else if (msg.action == MJ_ACTION.ACTION_MEN)
            type = 10
        else if (msg.action == MJ_ACTION.ACTION_MEN_ZI_MO)
            type = 11
        else if (msg.action == MJ_ACTION.ACTION_FREE_BA_GANG)
            type = 5
        else if (msg.action == MJ_ACTION.ACTION_FREE_AN_GANG)
            type = 6
        else
            console.log("收到异常action------------------------------",msg)

        if (type == 1 || type == 2)
            this.checkChickActionByPg(msg.valueTile)
        if (type == 8)
            this.checkChickActionByTing(realSeat)
        if (type == 4)
            this.checkChickActionByZimo(realSeat)
        this.setTingBtnChange(false);
        var laiziNum = 0
        if (msg.substituteNum)
            laiziNum = msg.substituteNum
        this.setPGHResult(type, msg.valueTile, myId, poutid, laiziNum);
        MessageManager.getInstance().disposeMsg();
    }

    public setRoundOver(msg)
    {
        super.setRoundOver(msg)
        this.initOverPlayerData()
        MessageManager.getInstance().messagePost(ListenerType.mj_gameRoundOver, {});
        MessageManager.getInstance().disposeMsg();
    }

    private chekChickActionByOutMj(tile)
    {
        var actionType = -1
        if (tile == 21)
            actionType = 0
        else if (tile == 18)
            actionType = 1
        else
            actionType = -1
        if (actionType < 0 || (!this.gameinfo.rule.play.wu_gu_ji && actionType == 1)) // 八筒但是没有乌骨鸡规则不检测
            return
        this.playerInfoMap.forEach((infoObj, seat)=>{
            if (infoObj.outCard.indexOf(tile) != -1)
            {
                actionType = -1
            }
            for (var pgInfo of infoObj.mjpg)
            {
                if (pgInfo[0] == tile)
                    actionType = -1
            }
        })
        if (actionType < 0)
            return
        MessageManager.getInstance().messagePost(ListenerType.mjzj_chickAction, {actionType: actionType});
    }

    private checkChickActionByPg(tile)
    {
        var actionType = -1
        if (tile == 21)
            actionType = 2
        else if (tile == 18)
            actionType = 3
        else
            actionType = -1
        if (actionType < 0 || (!this.gameinfo.rule.play.wu_gu_ji && actionType == 3)) // 八筒但是没有乌骨鸡规则不检测
            return
        MessageManager.getInstance().messagePost(ListenerType.mjzj_chickAction, {actionType: actionType});
    }

    private checkChickActionByTing(realSeat)
    {
        var actionType = -1
        var infoObj = this.playerInfoMap.get(realSeat)
        if (this.gameinfo.dealerId == infoObj.id)
             actionType = 4
        this.playerInfoMap.forEach((infoObj, seat)=>{
            if (infoObj.outCard.length >= 1)
                actionType = 4
        })
        if (actionType < 0)
            actionType = 5
        MessageManager.getInstance().messagePost(ListenerType.mjzj_chickAction, {actionType: actionType});
    }

    private checkChickActionByZimo(realSeat)
    {
        var condition1 = false
        var condition2 = true
        var infoObj = this.playerInfoMap.get(realSeat)
        if (infoObj.cards.length == 14 && this.gameinfo.dealerId == infoObj.id)
            condition1 = true
        this.playerInfoMap.forEach((infoObj, seat)=>{
            if (infoObj.outCard.length >= 1)
                condition2 = false
        })
        if (infoObj.outCard.length >= 1)
            condition2 = false
        if (condition2 && condition1)
            MessageManager.getInstance().messagePost(ListenerType.mjzj_chickAction, {actionType: 5});
            
    }


}