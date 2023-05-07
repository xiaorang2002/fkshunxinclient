import { GameDataManager } from './../../../framework/Manager/GameDataManager';
import { MJ_ACTION, GAME_TYPE } from './../GameConstValue';
import { GameManager } from './../../GameManager';
import { GAME_STATE_MJ } from './defines';
import { Utils } from './../../../framework/Utils/Utils';
import { MessageManager } from './../../../framework/Manager/MessageManager';
import { ListenerManager } from './../../../framework/Manager/ListenerManager';
import { GameData_Mj } from './GameData_Mj';
import * as Proto from "../../../proto/proto-min";
import { ListenerType } from "../ListenerType";

// 血战麻将的数据类
export class GameData_XZMJ extends GameData_Mj {
    public static className = "GameData_XZMJ";


    public huInfoMap = new Map()

    protected initListen() {
        super.initListen()

        ListenerManager.getInstance().add(Proto.SC_HuanPaiCommit.MsgID.ID, this, this.onCardExchanged);                   // 换牌结束后
        ListenerManager.getInstance().add(Proto.SC_HuanPaiStatus.MsgID.ID, this, this.onHuanPaiStatusRec);                // 收到玩家重连换牌状态
        ListenerManager.getInstance().add(Proto.SC_HuanPai.MsgID.ID, this, this.onHuanPaiSubmit);

        ListenerManager.getInstance().add(Proto.SC_DingQueCommit.MsgID.ID, this, this.onDefinited);                   // 定缺结束后
        ListenerManager.getInstance().add(Proto.SC_DingQueStatus.MsgID.ID, this, this.onDingQueStatusRec);                // 收到玩家重连定缺状态
        ListenerManager.getInstance().add(Proto.SC_DingQue.MsgID.ID, this, this.onDingQueSubmit);
        ListenerManager.getInstance().add(Proto.SC_PiaoFen.MsgID.ID, this, this.onPiaoFenSubmit);
        ListenerManager.getInstance().add(Proto.SC_PiaoFenCommit.MsgID.ID, this, this.onPiaoFenEnd);                  // 飘分结束后
        ListenerManager.getInstance().add(Proto.SC_PiaoFenStatus.MsgID.ID, this, this.onPiaoFenStatusRec);            // 收到玩家重连飘分状态 
        ListenerManager.getInstance().add(Proto.SC_Baoting.MsgID.ID, this, this.onBaoTingSubmit);
        ListenerManager.getInstance().add(Proto.SC_BaotingCommit.MsgID.ID, this, this.onBaoTingEnd);                  // 飘分结束后
        ListenerManager.getInstance().add(Proto.SC_BaotingStatus.MsgID.ID, this, this.onBaoTingStatusRec);            // 收到玩家重连飘分状态 
        ListenerManager.getInstance().add(Proto.SC_MaajanXueZhanGameFinish.MsgID.ID, this, this.setRoundOver);
        ListenerManager.getInstance().add(Proto.SC_MaajanZiGongGameFinish.MsgID.ID, this, this.setRoundOver);
        ListenerManager.getInstance().add(Proto.SC_HuStatus.MsgID.ID, this, this.onHuInfoRec);
        ListenerManager.getInstance().add(Proto.SC_MaajanXueZhanFinalGameOver.MsgID.ID, this, this.setGameOver);

    }

    // 换牌重连消息
    onHuanPaiStatusRec(msg) {
        if (msg.selfChoice.length != 0)
            this.playerInfoMap.get(0).selectHp = msg.selfChoice
        for (var huanPaiInfo of msg.status) {
            var realSeat = this.getRealSeatByRemoteSeat(huanPaiInfo.chairId)
            this.playerInfoMap.get(realSeat).exchanged = huanPaiInfo.done
        }

        MessageManager.getInstance().messagePost(ListenerType.mjxz_hpStatusChanged, {});
        MessageManager.getInstance().disposeMsg();
    }

    // 换牌成功后
    private onCardExchanged(msg) {
        this.playerInfoMap.get(0).receiveHp = msg.newShouPai
        this.playerInfoMap.get(0).updateMjFromHp()
        var order = 0
        if (msg.huanOrder)
            order = msg.huanOrder
        MessageManager.getInstance().messagePost(ListenerType.mjxz_recHpResult, { order: order });
        MessageManager.getInstance().disposeMsg();
    }

    // 玩家换牌结束改变状态
    private onHuanPaiSubmit(msg) {
        var realSeat = this.getRealSeatByRemoteSeat(msg.chairId)
        if (!this.playerInfoMap.get(realSeat)) {
            GameManager.getInstance().handReconnect()
            return
        }
        this.playerInfoMap.get(realSeat).exchanged = msg.done
        if (msg.selfChoice.length != 0)
            this.playerInfoMap.get(0).selectHp = msg.selfChoice
        MessageManager.getInstance().messagePost(ListenerType.mjxz_hpStatusChanged, {});
        MessageManager.getInstance().disposeMsg();
    }

    // 定缺后
    private onDefinited(msg) {
        try {
            for (var i = 0; i < msg.dingQues.length; ++i) {
                var realSeat = this.getRealSeatByRemoteSeat(msg.dingQues[i].chairId)
                this.playerInfoMap.get(realSeat).dqType = msg.dingQues[i].men
            }
            this.playerInfoMap.get(0).cards = this.playerInfoMap.get(0).cards
            MessageManager.getInstance().messagePost(ListenerType.mjxz_recDqResult, {});
            this.setGameState(GAME_STATE_MJ.XI_PAI)
            MessageManager.getInstance().disposeMsg();
        }
        catch (e) {
            GameManager.getInstance().handReconnect()
        }
    }

    // 飘分后
    onPiaoFenEnd(msg) {
        try {
            for (let i = 0; i < msg.piaoFens.length; ++i) {
                let realSeat = this.getRealSeatByRemoteSeat(msg.piaoFens[i].chairId)
                this.playerInfoMap.get(realSeat).piaoScore = msg.piaoFens[i].piao
            }
            MessageManager.getInstance().messagePost(ListenerType.mjxz_recPiaoResult, {});
            this.setGameState(GAME_STATE_MJ.XI_PAI)
            MessageManager.getInstance().disposeMsg();
        }
        catch (e) {
            GameManager.getInstance().handReconnect()
        }
    }
    onBaoTingEnd(msg) {
        try {
            for (let i = 0; i < msg.baotings.length; ++i) {
                let realSeat = this.getRealSeatByRemoteSeat(msg.baotings[i].chairId)
                this.playerInfoMap.get(realSeat).baoTingResult = msg.baotings[i].baoting
            }
            MessageManager.getInstance().messagePost(ListenerType.mjxz_recBaoTingResult, {});
            this.setGameState(GAME_STATE_MJ.XI_PAI)
            MessageManager.getInstance().disposeMsg();
        }
        catch (e) {
            GameManager.getInstance().handReconnect()
        }
    }
    private onDingQueStatusRec(msg) {
        for (var info of msg.queStatus) {
            var realSeat = this.getRealSeatByRemoteSeat(info.chairId)
            this.playerInfoMap.get(realSeat).isDq = info.done
        }
        for (var info of msg.queInfo) {
            var realSeat = this.getRealSeatByRemoteSeat(info.chairId)
            this.playerInfoMap.get(realSeat).dqType = info.men
        }
        if (this.gameinfo.gameState != GAME_STATE_MJ.DING_QUE && this.playerInfoMap.get(0).dqType >= 0)
            this.playerInfoMap.get(0).cards = this.playerInfoMap.get(0).cards
        MessageManager.getInstance().messagePost(ListenerType.mjxz_dqStatusChanged, {});
        MessageManager.getInstance().disposeMsg();
    }

    private onPiaoFenStatusRec(msg) {
        for (var info of msg.piaoStatus) {
            var realSeat = this.getRealSeatByRemoteSeat(info.chairId)
            this.playerInfoMap.get(realSeat).isPiao = info.done
        }
        for (var info of msg.piaoInfo) {
            var realSeat = this.getRealSeatByRemoteSeat(info.chairId)
            this.playerInfoMap.get(realSeat).piaoScore = info.piao
        }
        MessageManager.getInstance().messagePost(ListenerType.mjxz_piaoStatusChanged, {});
        MessageManager.getInstance().disposeMsg();
    }
    onBaoTingStatusRec(msg) {
        for (var info of msg.baotingStatus) {
            var realSeat = this.getRealSeatByRemoteSeat(info.chairId)
            this.playerInfoMap.get(realSeat).isBaoTing = info.done
        }
        for (var info of msg.baotingInfo) {
            var realSeat = this.getRealSeatByRemoteSeat(info.chairId)
            this.playerInfoMap.get(realSeat).baoTingResult = info.baoting
        }
        //this.setGameState(GAME_STATE_MJ.BAO_TING)
        MessageManager.getInstance().messagePost(ListenerType.mjxz_BaotingStatusChanged, {});
        this.playerInfoMap.forEach((infoObj, seat) => {
            infoObj.isready = false;
            MessageManager.getInstance().messagePost(ListenerType.mj_playerStateChanged, { playerSeat: seat, state: false, type: "ready" });
        })
        MessageManager.getInstance().disposeMsg();
    }
    // 玩家换牌结束改变状态
    private onDingQueSubmit(msg) {
        var realSeat = this.getRealSeatByRemoteSeat(msg.status.chairId)
        if (!this.playerInfoMap.get(realSeat)) {
            GameManager.getInstance().handReconnect()
            return
        }
        this.playerInfoMap.get(realSeat).isDq = msg.status.done
        MessageManager.getInstance().messagePost(ListenerType.mjxz_dqStatusChanged, {});
        MessageManager.getInstance().disposeMsg();
    }

    // 玩家飘分结束改变状态
    private onPiaoFenSubmit(msg) {
        var realSeat = this.getRealSeatByRemoteSeat(msg.status.chairId)
        if (!this.playerInfoMap.get(realSeat)) {
            GameManager.getInstance().handReconnect()
            return
        }
        this.playerInfoMap.get(realSeat).isPiao = msg.status.done
        MessageManager.getInstance().messagePost(ListenerType.mjxz_piaoStatusChanged, {});
        MessageManager.getInstance().disposeMsg();
    }
    private onBaoTingSubmit(msg) {
        var realSeat = this.getRealSeatByRemoteSeat(msg.status.chairId)
        if (!this.playerInfoMap.get(realSeat)) {
            GameManager.getInstance().handReconnect()
            return
        }
        this.playerInfoMap.get(realSeat).isBaoTing = msg.status.done
        MessageManager.getInstance().messagePost(ListenerType.mjxz_BaotingStatusChanged, {});
        MessageManager.getInstance().disposeMsg();
    }
    onHuInfoRec(msg) {
        for (var idx = 0; idx < msg.status.length; idx++) {
            var realSeat = this.getRealSeatByRemoteSeat(msg.status[idx].chairId)
            if (msg.status[idx].hu > 0) {

                var tempId = msg.status[idx].huTile
                if (msg.status[idx].hu == 2 && realSeat != 0)
                    tempId = 0
                var huInfo = {
                    huType: msg.status[idx].hu,
                    huTile: tempId,
                    index: msg.status[idx].huIndex
                }
                this.huInfoMap.set(realSeat, huInfo)
            }
        }
        MessageManager.getInstance().messagePost(ListenerType.mjxz_recHuInfo, {});
        MessageManager.getInstance().disposeMsg();
    }


    public setRoundOver(msg) {
        try {
            super.setRoundOver(msg)
            this.initOverPlayerData()
            MessageManager.getInstance().messagePost(ListenerType.mj_gameRoundOver, {});
            MessageManager.getInstance().disposeMsg();
        }
        catch (e) {
            GameManager.getInstance().handReconnect()
        }
    }
    getCardNumByType(type) {
        var cards = this.playerInfoMap.get(0).cards
        var num = 0
        for (var mjId of cards) {
            if (GameDataManager.getInstance().curGameType == GAME_TYPE.YJMJ && mjId == this.laiziValue) { }
            else if (Math.floor(mjId / 10) == type)
                num += 1
        }
        return num

    }

    getAutoHpResult() {
        if (this.gameinfo.rule.huan.count_opt == undefined || !this.gameinfo.rule.play.exchange_tips)
            return
        var numList = [3, 4]
        var num = numList[this.gameinfo.rule.huan.count_opt]
        var cards = this.playerInfoMap.get(0).cards
        var result = []
        if (this.gameinfo.rule.huan.type_opt == 0) // 单色换    
        {
            var temList = []
            var minNum = 12
            var selectType = 0
            for (var type = 0; type < 3; type++) {
                temList.push(this.getCardNumByType(type))

            }
            for (var idx = 0; idx < temList.length; idx++) {
                if (temList[idx] < minNum && temList[idx] >= num) {
                    selectType = idx
                    minNum = temList[idx]
                }
            }
            for (var idx = 0; idx < cards.length; idx++) {
                if (result.length == num)
                    break
                if (GameDataManager.getInstance().curGameType == GAME_TYPE.YJMJ && cards[idx] == this.laiziValue) { }
                else if (Math.floor(cards[idx] / 10) == selectType)
                    result.push(idx)
            }

        }
        else // 任意换
        {
            while (result.length != num) {
                var randomIdx = Utils.reandomNumBoth(0, cards.length - 1)
                if (GameDataManager.getInstance().curGameType == GAME_TYPE.YJMJ && cards[randomIdx] == this.laiziValue) { }
                else if (GameDataManager.getInstance().curGameType == GAME_TYPE.ZGMJ && cards[randomIdx] == this.laiziValue) { }
                else if (result.indexOf(randomIdx) < 0)
                    result.push(randomIdx)
            }
        }
        return result
    }

    getNeedSubstituteNumOfPeng(tile) {
        return 2 - this.getCardNumInHand(tile)
    }

    // 收到deskenter时再次清理数据
    clearDataOnStart() {
        super.clearDataOnStart()
        this.huInfoMap.clear()
    }


    cleanRoundOver() {
        this.playerInfoMap.forEach((infoObj, seat) => {
            infoObj.isDq = false;
            infoObj.isPiao = false;
            infoObj.isBaoTing = false;
            infoObj.exchanged = false;
            infoObj.dqType = -1
            infoObj.piaoScore = -1
            infoObj.canBaoTing = -1
            infoObj.baoTingResult = false
            infoObj.huPaiList = [];
            infoObj.selectHp = [];
            infoObj.receiveHp = [];
            infoObj.menCard = [];
            infoObj.canOutcards = [];
        })
        this.huInfoMap.clear()
        MessageManager.getInstance().messagePost(ListenerType.mjxz_dqStatusChanged, {});
        MessageManager.getInstance().messagePost(ListenerType.mjxz_piaoStatusChanged, {});
        MessageManager.getInstance().messagePost(ListenerType.mjxz_BaotingStatusChanged, {});
        MessageManager.getInstance().messagePost(ListenerType.mjxz_recBaoTingResult,{});
        super.cleanRoundOver()
    }

    setPGHResult(type, mjid, pinid, poutid, laiziNum) {
        super.setPGHResult(type, mjid, pinid, poutid, laiziNum)
        var pinseat = this.getSeatById(pinid);
        if (type == 3 || type == 12) {
            var index = this.huInfoMap.size + 1
            var huInfo = {
                huType: 1, // 1胡，2自摸
                huTile: mjid,
                index: index
            }
            this.huInfoMap.set(pinseat, huInfo)
        }
        else if (type == 4) {
            var tempId: any = 0
            tempId = mjid
            var index = this.huInfoMap.size + 1
            var huInfo = {
                huType: 2, // 1胡，2自摸
                huTile: tempId,
                index: index
            }
            this.huInfoMap.set(pinseat, huInfo)
        }
        MessageManager.getInstance().messagePost(ListenerType.mjxz_recHuInfo, {});

    }

    tileIsQue(tile) // 某张牌是不是缺牌
    {
        if (Math.floor(tile / 10) == this.playerInfoMap.get(0).dqType)
            return true
        return false
    }

    //查杠
    checkGang() {
        var gang = [];
        if (this.gameinfo.curOperateId === this.playerInfoMap.get(0).id) {
            //寻找补杠
            var inArray = this.playerInfoMap.get(0).cards;
            var pgArray = this.playerInfoMap.get(0).mjpg;
            var tempArry = [];
            // 找到所有的碰
            for (var i = 0; i < pgArray.length; ++i) {
                if (pgArray[i][5] == 1 || pgArray[i][5] == 13) {
                    var type = MJ_ACTION.ACTION_BA_GANG
                    if (inArray.indexOf(this.laiziValue) >= 0) {
                        if (inArray.indexOf(pgArray[i][2]) >= 0)
                            type = MJ_ACTION.ACTION_BA_GANG
                        else
                            type = MJ_ACTION.ACTION_RUAN_BA_GANG
                    }
                    else if (inArray.indexOf(pgArray[i][2]) >= 0)
                        type = MJ_ACTION.ACTION_BA_GANG
                    tempArry.push([type, pgArray[i][0], pgArray[i][1], pgArray[i][2]]);
                }
            }
            for (var curPeng of tempArry) {
                if (inArray.indexOf(this.laiziValue) >= 0) {
                    if (inArray.indexOf(curPeng[2]) >= 0)
                        curPeng.push(curPeng[2])
                    else
                        curPeng.push(this.laiziValue)
                    gang.push(curPeng)
                }
                else if (inArray.indexOf(curPeng[2]) >= 0) {
                    curPeng.push(curPeng[2])
                    gang.push(curPeng)
                }
            }

            // 寻找暗杠
            var hashInArry = []
            for (var i = 0; i < 38; i++) // 初始化麻将的哈希列表
                hashInArry[i] = []
            for (var mjId of inArray)
                hashInArry[mjId].push(mjId)
            var laiziLength = hashInArry[this.laiziValue].length
            for (var hashInfo of hashInArry) {
                var tempGangArry = []
                if (hashInfo[0] == this.laiziValue || this.tileIsQue(hashInfo[0])) { }
                else if (hashInfo.length == 4) {
                    tempGangArry = [MJ_ACTION.ACTION_AN_GANG, hashInfo[0], hashInfo[1], hashInfo[2], hashInfo[3]]
                    gang.push(tempGangArry)
                }
                else if (hashInfo.length + laiziLength >= 4) {
                    tempGangArry.push(MJ_ACTION.ACTION_RUAN_AN_GANG)
                    for (var j = 0; j < hashInfo.length; j++)
                        tempGangArry.push(hashInfo[0])
                    for (var k = 0; k < (4 - hashInfo.length); k++)
                        tempGangArry.push(this.laiziValue)
                    gang.push(tempGangArry)
                }
            }
        }

        //当报听以后自贡麻将的杠需要特殊处理
        if (GameDataManager.getInstance().curGameType == GAME_TYPE.ZGMJ && this.playerInfoMap.get(0).baoTingResult) {
            let newGang = []
            for (i = 0; i < gang.length; i++) {
                let tile = this.gameinfo.state.get(gang[i][0])
                if (tile > 0 && tile == gang[i][1]) {
                    newGang.push(gang[i])
                }
            }
            return newGang
        }
        return gang;
    }


}