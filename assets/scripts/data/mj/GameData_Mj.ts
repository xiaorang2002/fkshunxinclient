import { GameManager } from './../../GameManager';
import { GAME_TYPE, MJ_ACTION } from './../GameConstValue';
import * as Proto from "../../../proto/proto-min";
import { MjGameInfo } from "./MjGameInfo";
import { GAME_STATE_MJ, SECTION_TYPE } from "./defines"
import { MjPlayerInfo } from "./MjPlayerInfo";
import { MessageManager } from "../../../framework/Manager/MessageManager";
import { ListenerType } from "../ListenerType";
import { GameDataManager } from "../../../framework/Manager/GameDataManager";
import { Utils } from "../../../framework/Utils/Utils";
import { ListenerManager } from "../../../framework/Manager/ListenerManager";
import { ConstValue } from "../GameConstValue";
import { LogWrap } from '../../../framework/Utils/LogWrap';


export class GameData_Mj {

    public static className = "GameData_Mj";
    public laiziValue = 0 // 癞子值

    /**游戏信息 */
    private _gameinfo = null;
    public get gameinfo() {
        return this._gameinfo
    }
    /**玩家信息 */
    private _playerInfoMap = new Map<number, MjPlayerInfo>();
    public get playerInfoMap() {
        return this._playerInfoMap;
    }
    //游戏申请解散信息
    private _gameApplyData: any = null;
    public get gameApplyData(): any {
        return this._gameApplyData;
    }
    public set gameApplyData(value: any) {
        this._gameApplyData = value;
    }

    //游戏投票信息
    private _voteData: any = null;
    public get voteData(): any {
        return this._voteData;
    }
    public set voteData(value: any) {
        this._voteData = value;
    }

    public overTempPlayerInfo = new Map() // 用于在结算时临时存储的玩家数据

    private tempList = []
    private GameStartState = -1

    constructor() {
        this.initListen()
    }

    protected initListen() {
        ListenerManager.getInstance().add(Proto.SC_StandUpAndExitRoom.MsgID.ID, this, this.onPlayerLeave);                        // 自己离开房间
        ListenerManager.getInstance().add(Proto.SC_NotifyStandUp.MsgID.ID, this, this.onPlayerLeave);                        // 玩家离开房间

        ListenerManager.getInstance().add(Proto.SC_NotifySitDown.MsgID.ID, this, this.onPlayerSit);                    // 新的玩家加入
        ListenerManager.getInstance().add(Proto.SC_Ready.MsgID.ID, this, this.setSomeOneReady);             // 准备
        ListenerManager.getInstance().add(Proto.SC_Maajan_Desk_Enter.MsgID.ID, this, this.onGameDateInit);              // 游戏信息初始化
        ListenerManager.getInstance().add(Proto.SC_Maajan_Desk_State.MsgID.ID, this, this.onGameStateRec);
        ListenerManager.getInstance().add(Proto.SC_Maajan_Draw.MsgID.ID, this, this.onGetMj);                           // 摸牌
        ListenerManager.getInstance().add(Proto.SC_Maajan_Discard_Round.MsgID.ID, this, this.onOperatePlayerChanged);                           // 该谁操作
        ListenerManager.getInstance().add(Proto.SC_Maajan_Action_Discard.MsgID.ID, this, this.onOutMj);                           // 出牌
        ListenerManager.getInstance().add(Proto.SC_Maajan_Tile_Left.MsgID.ID, this, this.onLeftMjNumChanged);                           // 剩余
        ListenerManager.getInstance().add(Proto.SC_WaitingDoActions.MsgID.ID, this, this.onPGHTipsRec);                      // 剩余
        ListenerManager.getInstance().add(Proto.SC_Maajan_Do_Action.MsgID.ID, this, this.onActionRec);                      // 收到碰，杠，胡，报听完消息
        ListenerManager.getInstance().add(Proto.SC_Maajan_StopAction.MsgID.ID, this, this.onActionStop);
        ListenerManager.getInstance().add(Proto.SC_DismissTableReq.MsgID.ID, this, this.onDisMissDataRec);                 // 房间解散重连数据
        ListenerManager.getInstance().add(Proto.S2C_TRANSFER_ROOM_OWNER_RES.MsgID.ID, this, this.setOwner);                   // 房主更变
        ListenerManager.getInstance().add(Proto.SC_WaitingTing.MsgID.ID, this, this.onTingInfoRec);                  // 游戏结束
        ListenerManager.getInstance().add(Proto.SC_TimeOutNotify.MsgID.ID, this, this.onOpTimechange);             // 操作时间改变
        ListenerManager.getInstance().add(Proto.SC_TingTips.MsgID.ID, this, this.onHuTipsRec);             // 操作时间改变
        ListenerManager.getInstance().add(Proto.SC_VoteTableReq.MsgID.ID, this, this.onVoteDataRec);                 // 房间解散重连数据
        ListenerManager.getInstance().add(Proto.SC_PlayOnceAgain.MsgID.ID, this, this.onPlayOnceAgain);
        ListenerManager.getInstance().add(Proto.SC_NotifyOnline.MsgID.ID, this, this.onPlayerOnlineRec);
        ListenerManager.getInstance().add(Proto.SC_Maajan_Do_Action_Commit.MsgID.ID, this, this.onActionConfirmRec);

    }

    private onGameDateInit(msg) {
        if (GameDataManager.getInstance().curGameType == GAME_TYPE.YJMJ) // 幺鸡麻将的癞子是1条
            this.laiziValue = 21
        if (GameDataManager.getInstance().curGameType == GAME_TYPE.ZGMJ) // 自贡麻将的癞子是白板
            this.laiziValue = 37
        this.clearDataOnStart()
        this.setDealer(msg.zhuang)
        if (msg.pbRecData) {
            if (msg.pbRecData.lastChuPaiChair) {
                var realSeat = this.getRealSeatByRemoteSeat(msg.pbRecData.lastChuPaiChair)
                if(this.playerInfoMap.get(realSeat))
                {
                    var nowId = this.playerInfoMap.get(realSeat).id
                    this.gameinfo.lastOutPid = nowId
                }
              
                this.gameinfo.lastOutMjId = msg.pbRecData.lastChuPai;
            }

            if (this.gameinfo.rule.union) // 联盟重连是totalmoney
            {
                if (msg.pbRecData.totalMoney) {
                    for (var chairId in msg.pbRecData.totalMoney) {
                        var tempSeat = this.getRealSeatByRemoteSeat(parseInt(chairId))
                        var clubScore = parseInt(msg.pbRecData.totalMoney[chairId]) / 100
                        this.playerInfoMap.get(tempSeat).clubScore = clubScore
                    }
                }
            }
            else {
                if (msg.pbRecData.totalScores) {
                    for (var chairId in msg.pbRecData.totalScores) {
                        var tempSeat = this.getRealSeatByRemoteSeat(parseInt(chairId))
                        var clubScore = parseInt(msg.pbRecData.totalScores[chairId])
                        this.playerInfoMap.get(tempSeat).clubScore = clubScore
                    }
                }
            }
        }
        if (msg.pbPlayers.length > 0) {
            for (var pbPlayerInfo of msg.pbPlayers) {
                var realSeat = this.getRealSeatByRemoteSeat(pbPlayerInfo.chairId)
                if (!this.playerInfoMap.get(realSeat)) {
                    GameManager.getInstance().handReconnect()
                    return
                }
                this.playerInfoMap.get(realSeat).updatePlayerInfoOnStart(pbPlayerInfo, this.laiziValue)
                if (this.gameinfo.rule.play.gu_mai)
                    this.playerInfoMap.get(realSeat).updateGuMaiScore(pbPlayerInfo.guMaiScore)
            }
        }
        this.setTableStart(true);
        this.setCurRound(msg.round)
        MessageManager.getInstance().messagePost(ListenerType.mj_start, {});
        this.setGameState(msg.state) // 数据填充完成时在推进游戏进度
        this.GameStartState = msg.state
        this.gameinfo.curRoundOverData = null
        this.gameinfo.curGameOverData = null
        MessageManager.getInstance().disposeMsg();
    }

    private onGameStateRec(msg) {
        this.setGameState(msg.state);
        MessageManager.getInstance().disposeMsg();
    }

    private onGetMj(msg) {
        //关闭操作按钮
        var realSeat = this.getRealSeatByRemoteSeat(msg.chairId)
        if (!this._playerInfoMap.get(realSeat)) {
            GameManager.getInstance().handReconnect()
            return
        }
        this.setSomeOneGetMj(this.playerInfoMap.get(realSeat).id, msg.tile);
        MessageManager.getInstance().disposeMsg();
    }

    private onLeftMjNumChanged(msg) {
        //设置剩余牌数量
        this.setOverPlusNum(msg.tileLeft)
        MessageManager.getInstance().disposeMsg();
    }

    private onOperatePlayerChanged(msg) {
        //设置当前玩家
        if (this._gameinfo.gameState != GAME_STATE_MJ.WAIT_CHU_PAI)
            this.setGameState(GAME_STATE_MJ.WAIT_CHU_PAI)
        this.setCurOperatePlayer(msg.chairId);
        MessageManager.getInstance().disposeMsg();
    }

    // 离开房间
    private onPlayerLeave(msg) {
        if (msg.tableId != this.gameinfo.roomId) {
            MessageManager.getInstance().disposeMsg();
            return;
        }
        try {
            var realSeat = this.getRealSeatByRemoteSeat(msg.chairId)
            if (realSeat == 0) //离开房间的原因
                Utils.standupByReason(msg.reason)
            if (this._gameinfo.curGameOverData != null && this._gameinfo.isDismissed) {
                MessageManager.getInstance().disposeMsg();
                return
            }
            if (realSeat == 0 && this.checkScoreMenKan() && this._gameinfo.curGameOverData != null) {// 检测是否是由于积分门槛导致玩家无法再来一局
                this._gameinfo.isDismissed = true
                MessageManager.getInstance().disposeMsg();
                return
            }
            if (realSeat == 0 && (msg.reason == 6 || msg.reason == 12 || msg.reason == 13 || msg.reason == 15)) {
                this._gameinfo.isDismissed = true
                MessageManager.getInstance().disposeMsg();
                return
            }
            this.removePlayer(realSeat)
            MessageManager.getInstance().disposeMsg();
        }
        catch (e) {
            this._playerInfoMap.forEach((infoObj, seat) => {
                if (infoObj && infoObj.seat == msg.chairId) {
                    this._playerInfoMap.delete(seat);
                    MessageManager.getInstance().messagePost(ListenerType.nn_playerNumChanged, { playerSeat: seat, tag: "remove" });
                    MessageManager.getInstance().disposeMsg();
                    return
                }
            })
            MessageManager.getInstance().disposeMsg();
        }
    }

    private onPlayerOnlineRec(msg) {
        var info = {
            playerId: msg.guid,
            isOnline: msg.isOnline
        }
        this.setSomeoneOnline(info)
        MessageManager.getInstance().disposeMsg();
    }


    protected onOutMj(msg) {
        this.setSomeOneOutMj(msg.chairId, msg.tile)
        MessageManager.getInstance().disposeMsg();
    }

    private onPGHTipsRec(msg) {
        this.setPGHTips(msg);
        MessageManager.getInstance().disposeMsg();
    }

    protected onActionConfirmRec(msg) {
        var realSeat = this.getRealSeatByRemoteSeat(msg.chairId)
        if (!this._playerInfoMap.get(realSeat)) {
            MessageManager.getInstance().disposeMsg();
            return
        }
        this.gameinfo.curGang = [];
        this.gameinfo.curJiao = [];
        this.setPGHTips(null);
        this.setTingBtnChange(false);
        if (msg.action == MJ_ACTION.ACTION_PASS && realSeat == 0)
            MessageManager.getInstance().messagePost(ListenerType.mj_onGuoActionRec);
        MessageManager.getInstance().disposeMsg();
    }

    protected onActionRec(msg) {
        //  碰:1, 直杠:2,  点炮:3,  自摸:4,  补杠:5,   暗杠:6,  慌庄:7,  其他:过(保留)
        var realSeat = this.getRealSeatByRemoteSeat(msg.chairId)
        if (!this.playerInfoMap.get(realSeat)) {
            GameManager.getInstance().handReconnect()
            return
        }
        var myId = this._playerInfoMap.get(realSeat).id
        var type = 0
        var poutid = this.gameinfo.lastOutPid
        if (msg.action == MJ_ACTION.ACTION_PENG)
            type = 1
        else if (msg.action == MJ_ACTION.ACTION_MING_GANG)
            type = 2
        else if (msg.action == MJ_ACTION.ACTION_AN_GANG)
            type = 6
        else if (msg.action == MJ_ACTION.ACTION_BA_GANG)
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
        else if (msg.action == MJ_ACTION.ACTION_RUAN_BA_GANG) // 带癞子的巴杠
            type = 16
        else if (msg.action == MJ_ACTION.ACTION_RUAN_AN_GANG) // 带癞子的暗杠
            type = 15
        else if (msg.action == MJ_ACTION.ACTION_RUAN_MING_GANG) // 带癞子的明杠
            type = 14
        else if (msg.action == MJ_ACTION.ACTION_RUAN_PENG) // 带癞子的碰
            type = 13
        else if (msg.action == MJ_ACTION.ACTION_GANG_HUAN_PAI)
            type = 17
        else
            console.log("收到异常action------------------------------", msg)
        var laiziNum = 0
        this.gameinfo.curGang = [];
        this.gameinfo.curJiao = [];
        this.setPGHTips(null);
        this.setTingBtnChange(false);
        if (msg.substituteNum)
            laiziNum = msg.substituteNum
        this.setPGHResult(type, msg.valueTile, myId, poutid, laiziNum);
        MessageManager.getInstance().disposeMsg();
    }


    private onActionStop(msg) {
        this.setPGHTips(null);
        MessageManager.getInstance().disposeMsg();
    }

    private onTingInfoRec(msg) {
        var tempInfo = new Map()
        var ting = []
        var mostHuNum = 0
        for (var i = 0; i < msg.ting.length; ++i) {
            var tiles = []
            var curHuMjNum = 0 // 打某张牌可以胡的牌张数

            for (var j = 0; j < msg.ting[i].tiles.length; j++) {
                var num = this.checkMjNum(msg.ting[i].tiles[j])
                curHuMjNum += num
                var tileInfo = {
                    num: num,
                    fan: 0,
                    mjId: msg.ting[i].tiles[j],
                }
                tiles.push(tileInfo)
            }
            if (curHuMjNum > mostHuNum)
                mostHuNum = curHuMjNum
            var data = {
                discard: msg.ting[i].discard,
                tiles: tiles,
                curHuMjNum: curHuMjNum,
                curHuMaxFan: 0,
                maxHuFan: 0,
                mostHuNum: mostHuNum,
            }
            ting.push(data)
        }
        this.gameinfo.curJiao = ting
        tempInfo.set(MJ_ACTION.ACTION_TING, 0);
        tempInfo.set(MJ_ACTION.SESSION_ID, 0);
        this.gameinfo.state = tempInfo
        MessageManager.getInstance().messagePost(ListenerType.mj_PGHTipsRec, {});
        MessageManager.getInstance().disposeMsg();
    }

    // 胡牌提示
    private onHuTipsRec(msg) {
        var ting = []
        var sortList = []
        var maxHuFan = 0
        var mostHuNum = 0
        for (var i = 0; i < msg.ting.length; ++i) {
            var tiles = []
            var curHuMjNum = 0 // 打某张牌可以胡的牌张数
            var curHuMaxFan = 0 // 打某张牌可以胡最大番

            for (var j = 0; j < msg.ting[i].tilesInfo.length; j++) {
                var num = this.checkMjNum(msg.ting[i].tilesInfo[j].tile)
                curHuMjNum += num
                if (msg.ting[i].tilesInfo[j].fan > curHuMaxFan)
                    curHuMaxFan = msg.ting[i].tilesInfo[j].fan
                var tileInfo = {
                    num: num,
                    fan: msg.ting[i].tilesInfo[j].fan,
                    mjId: msg.ting[i].tilesInfo[j].tile,
                }
                tiles.push(tileInfo)
            }
            if (curHuMaxFan > maxHuFan)
                maxHuFan = curHuMaxFan
            if (curHuMjNum > mostHuNum)
                mostHuNum = curHuMjNum
            var info = {
                discard: msg.ting[i].discard,
                tiles: tiles,
                curHuMjNum: curHuMjNum,
                curHuMaxFan: curHuMaxFan,
                maxHuFan: maxHuFan,
                mostHuNum: mostHuNum,
            }
            ting.push(info)
        }
        this.gameinfo.curJiao = ting
        this.gameinfo.tingSortList = sortList
        MessageManager.getInstance().messagePost(ListenerType.mj_huPaiTipsRec, {});
        MessageManager.getInstance().disposeMsg();

    }

    private onOpTimechange(msg) {
        this.setTime(msg.leftTime);
        MessageManager.getInstance().disposeMsg();
    }

    // 收到解散请求
    private onDisMissDataRec(msg) {
        this.gameApplyData = msg
        MessageManager.getInstance().messagePost(ListenerType.mj_dismissResponse, {})
    }


    private onVoteDataRec(msg) {
        this.voteData = msg
        MessageManager.getInstance().messagePost(ListenerType.mj_VoteResponse, {})
    }

    private onPlayOnceAgain(msg) {
        this.gameinfo.roundId = msg.roundInfo.roundId
        MessageManager.getInstance().disposeMsg();
    }

    public updateTableInfo(msg, roundId) {
        if (this._gameinfo != null)
            return;
        this._gameinfo = new MjGameInfo();
        this._gameinfo.roundId = roundId
        this._gameinfo.updateTableInfo(msg)
    }

    public checkScoreMenKan() {
        if (this.gameinfo.rule.union == undefined)
            return false
        if (this.playerInfoMap.get(0).score < this.gameinfo.rule.union.entry_score / 100)
            return true
        return false
    }

    // 如果数据先收到ui还没打开，就需要走这个方法
    public onReconnect() {
        this._playerInfoMap.forEach((infoObj, seat) => {
            infoObj.onReconnect()
        })
        if (this.GameStartState > 0)
            this.setGameState(this.GameStartState)
        this._gameinfo.onReconnect()
    }

    private onPlayerSit(msg) {
        if (msg.tableId != this.gameinfo.roomId) {
            MessageManager.getInstance().disposeMsg();
            return;
        }
        this.addPlayer(msg.seat)
        MessageManager.getInstance().disposeMsg();
    }

    /**玩家加入  ispost用于在切后台重连时，由于ui存在，避免model还没加载完报错*/
    public addPlayer(msg, isPost = true) {
        let playerInfo = new MjPlayerInfo();
        playerInfo.updatePlayerSimplyInfo(msg)
        if (!playerInfo.seat)
            return
        if (playerInfo.id == GameDataManager.getInstance().userInfoData.userId) {
            this._playerInfoMap.set(0, playerInfo);
            playerInfo.realSeat = 0
        }
        else if (this._playerInfoMap.size == 0) {
            this.tempList.push(playerInfo)
            return
        }
        else {
            this.initPlayerSeat(playerInfo)
        }
        if (this.tempList.length != 0) {
            for (var tempInfo of this.tempList) {
                this.initPlayerSeat(tempInfo)
                if (isPost)
                    MessageManager.getInstance().messagePost(ListenerType.mj_playerNumChanged, { playerSeat: tempInfo.realSeat, tag: "add" })
            }
            this.tempList = []
        }
        if (isPost)
            MessageManager.getInstance().messagePost(ListenerType.mj_playerNumChanged, { playerSeat: playerInfo.realSeat, tag: "add" });
    }

    private initPlayerSeat(playerInfo) {
        var otherRealSeat = this.getRealSeatByRemoteSeat(playerInfo.seat)
        this._playerInfoMap.set(otherRealSeat, playerInfo);
        playerInfo.realSeat = otherRealSeat
    }

    public getRealSeatByRemoteSeat(seat) {
        try {
            var playerNum = this.getCurTypePlayerNum()
            var myInfo = this._playerInfoMap.get(0)
            var offset = myInfo.realSeat - myInfo.seat
            var otherRealSeat = (seat + offset + playerNum) % playerNum
            var seatMap = []
            if (playerNum == 2) // 2人坐0,2
                seatMap = [0, 2]
            else if (playerNum == 3) // 3人坐0,1,3号位
                seatMap = [0, 1, 3]
            else
                seatMap = [0, 1, 2, 3]
            return seatMap[otherRealSeat]
        }
        catch (e) {
            GameManager.getInstance().handReconnect()
        }
    }

    public getCurTypePlayerNum() {
        var optionIndex = this.gameinfo.rule.room.player_count_option
        if (GameDataManager.getInstance().curGameType == GAME_TYPE.MHXL)
            return ConstValue.MHXL_PLAYER_NUM_LIST[optionIndex]
        else if (GameDataManager.getInstance().curGameType == GAME_TYPE.LFMJ)
            return ConstValue.LFMJ_PLAYER_NUM_LIST[optionIndex]
        else if (GameDataManager.getInstance().curGameType == GAME_TYPE.XZMJ || GameDataManager.getInstance().curGameType == GAME_TYPE.FR2F)
            return 4
        else if (GameDataManager.getInstance().curGameType == GAME_TYPE.SR2F)
            return 3
        else if (GameDataManager.getInstance().curGameType == GAME_TYPE.TR3F || GameDataManager.getInstance().curGameType == GAME_TYPE.TR2F ||
            GameDataManager.getInstance().curGameType == GAME_TYPE.TR1F)
            return 2
        else if (GameDataManager.getInstance().curGameType == GAME_TYPE.YJMJ)
            return ConstValue.MHXL_PLAYER_NUM_LIST[optionIndex]
        else if (GameDataManager.getInstance().curGameType == GAME_TYPE.ZGMJ)
            return ConstValue.ZGMJ_PLAYER_NUM_LIST[optionIndex]
        return 0
    }

    public getCurTypeHandMjNum() {
        if (GameDataManager.getInstance().curGameType == GAME_TYPE.FR2F || GameDataManager.getInstance().curGameType == GAME_TYPE.TR1F)
            return this.gameinfo.rule.play.tile_count
        else
            return 13
    }

    /**玩家移除 */
    public removePlayer(seat) {
        if (this._playerInfoMap.get(seat)) {
            this._playerInfoMap.delete(seat);
            MessageManager.getInstance().messagePost(ListenerType.mj_playerNumChanged, { playerSeat: seat, tag: "remove" });
        }
    }

    /**通过id寻找到index */
    public getSeatById(id) {
        var tempSeat = -1
        this._playerInfoMap.forEach((infoObj, seat) => {
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
        if (!this._playerInfoMap.get(seat))
            return
        this._playerInfoMap.get(seat).isonline = msg.isOnline;
        MessageManager.getInstance().messagePost(ListenerType.mj_playerStateChanged, { playerSeat: seat, state: msg.isOnline, type: "online" });
    }

    /**设置准备 */
    public setSomeOneReady(msg) {
        var otherRealSeat = this.getRealSeatByRemoteSeat(msg.readyChairId)
        if (!this.playerInfoMap.get(otherRealSeat)) {
            GameManager.getInstance().handReconnect()
            return
        }
        this._playerInfoMap.get(otherRealSeat).isready = true;
        MessageManager.getInstance().messagePost(ListenerType.mj_playerStateChanged, { playerSeat: otherRealSeat, state: true, type: "ready" });
        MessageManager.getInstance().disposeMsg();
    }

    /**设置剩余牌数量 */
    public setOverPlusNum(num) {
        this.gameinfo.curOverplus = num;
    }
    /**设置当前局数 */
    public setCurRound(round) {
        this._gameinfo.curRound = round;

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
    /**变更游戏状态 */
    public setGameState(num: GAME_STATE_MJ) {
        this._gameinfo.gameState = num;
    }

    public setTrustee(seat, isTrustee) {
        if (!this._playerInfoMap.get(seat))
            return;
        this._playerInfoMap.get(seat).isTrustee = isTrustee
    }

    /**设置当前操作玩家 */
    public setCurOperatePlayer(seat) {
        var realSeat = this.getRealSeatByRemoteSeat(seat)
        if (!this.playerInfoMap.get(realSeat)) {
            GameManager.getInstance().handReconnect()
            return
        }
        var nowId = this.playerInfoMap.get(realSeat).id
        this._gameinfo.curOperateId = nowId;
    }
    /**设置手牌 */
    public setHeadCard(pid, nowcards) {
        let seat = this.getSeatById(pid);
        this._playerInfoMap.get(seat).cards = nowcards
    }
    /**设置出牌 */
    public setOutCards(pid, nowcards) {
        let seat = this.getSeatById(pid);
        this._playerInfoMap.get(seat).outCard = nowcards
    }
    /**设置碰杠 */
    public setPG(pid, nowcards) {
        let seat = this.getSeatById(pid);
        this._playerInfoMap.get(seat).mjpg = nowcards
    }

    public setMen(pid, menCards) {
        let seat = this.getSeatById(pid);
        this._playerInfoMap.get(seat).menCard = menCards
    }

    /**设置庄家 */
    public setDealer(seat) {
        var realSeat = this.getRealSeatByRemoteSeat(seat)
        if (this.playerInfoMap.get(realSeat))
            this._gameinfo.dealerId = this.playerInfoMap.get(realSeat).id;
    }
    /**设置当前选中的牌 */
    public setCurSelectMj(mj, isSendEvent = true) {
        if (!isSendEvent) // 是否发送消息通知选牌
            this._gameinfo._curSelectMj = mj
        else
            this._gameinfo.curSelectMj = mj;
    }
    /**设置游戏开始 */
    public setTableStart(bool) {
        this._gameinfo.mBTableStarted = bool;
    }

    /**查询麻将张数 */
    public checkMjNum(mjid) {
        var mjnum = 0;
        this._playerInfoMap.forEach((infoObj, seat) => {
            if (infoObj != null) {
                //碰杠区
                for (var j = 0; j < infoObj.mjpg.length; ++j) {
                    for (var k = 0; k < 4; ++k) {
                        if (infoObj.mjpg[j][k] === mjid ||
                            (infoObj.mjpg[j][0] === mjid && infoObj.mjpg[j][3] === 0))
                            mjnum += 1;
                    }
                }

                //出牌区
                for (j = 0; j < infoObj.outCard.length; ++j) {
                    if (infoObj.outCard[j] === mjid)
                        mjnum += 1;
                }

                //如果是自己需要计算手牌
                if (seat == 0) {
                    for (j = 0; j < infoObj.cards.length; ++j) {
                        if (infoObj.cards[j] === mjid)
                            mjnum += 1;
                    }
                }
            }
        })
        return (4 - mjnum);
    }

    /**设置状态 */
    public setPGHTips(stage) {
        var tempInfo = new Map()
        if (stage != null) {
            if (stage.actions.length == 0)
                return
            tempInfo.set(MJ_ACTION.SESSION_ID, stage.sessionId);
            for (var action of stage.actions) {
                if (action.action == MJ_ACTION.ACTION_HU)
                    tempInfo.set(MJ_ACTION.ACTION_HU, action.tile);
                if (action.action == MJ_ACTION.ACTION_QIANG_GANG_HU)
                    tempInfo.set(MJ_ACTION.ACTION_QIANG_GANG_HU, action.tile);
                if (action.action == MJ_ACTION.ACTION_PENG)
                    tempInfo.set(MJ_ACTION.ACTION_PENG, action.tile);
                if (action.action == MJ_ACTION.ACTION_AN_GANG)
                    tempInfo.set(MJ_ACTION.ACTION_AN_GANG, action.tile);
                if (action.action == MJ_ACTION.ACTION_MING_GANG)
                    tempInfo.set(MJ_ACTION.ACTION_MING_GANG, action.tile);
                if (action.action == MJ_ACTION.ACTION_BA_GANG)
                    tempInfo.set(MJ_ACTION.ACTION_BA_GANG, action.tile);
                if (action.action == MJ_ACTION.ACTION_MEN)
                    tempInfo.set(MJ_ACTION.ACTION_MEN, action.tile);
                if (action.action == MJ_ACTION.ACTION_ZI_MO)
                    tempInfo.set(MJ_ACTION.ACTION_ZI_MO, action.tile);
                if (action.action == MJ_ACTION.ACTION_MEN_ZI_MO)
                    tempInfo.set(MJ_ACTION.ACTION_MEN_ZI_MO, action.tile);
                if (action.action == MJ_ACTION.ACTION_FREE_BA_GANG)
                    tempInfo.set(MJ_ACTION.ACTION_FREE_BA_GANG, action.tile);
                if (action.action == MJ_ACTION.ACTION_FREE_AN_GANG)
                    tempInfo.set(MJ_ACTION.ACTION_FREE_AN_GANG, action.tile);
                if (action.action == MJ_ACTION.ACTION_RUAN_AN_GANG) //癞子aciton
                    tempInfo.set(MJ_ACTION.ACTION_RUAN_AN_GANG, action.tile);
                if (action.action == MJ_ACTION.ACTION_RUAN_MING_GANG) //癞子aciton
                    tempInfo.set(MJ_ACTION.ACTION_RUAN_MING_GANG, action.tile);
                if (action.action == MJ_ACTION.ACTION_RUAN_BA_GANG) //癞子aciton
                    tempInfo.set(MJ_ACTION.ACTION_RUAN_BA_GANG, action.tile);
                if (action.action == MJ_ACTION.ACTION_RUAN_PENG) //癞子aciton
                    tempInfo.set(MJ_ACTION.ACTION_RUAN_PENG, action.tile);
                if (action.action == MJ_ACTION.ACTION_GANG_HUAN_PAI)
                    tempInfo.set(MJ_ACTION.ACTION_GANG_HUAN_PAI, action.tile);
            }

        }
        this.gameinfo.state = tempInfo
    }

    public getActionSessionId() {
        var sessionId = 0
        if (this.gameinfo && this.gameinfo.state.get(MJ_ACTION.SESSION_ID))
            sessionId = this.gameinfo.state.get(MJ_ACTION.SESSION_ID)
        return sessionId
    }

    /**癞子牌 */
    public setLaiziCard(laiziArray) {
        var laizi = [];
        for (var i = 0; i < laiziArray.length; i++) {
            var one = Utils.getClientMjId(laiziArray[i]);
            laizi.push(one);
        }
        this.gameinfo.laiZhiCards = laizi;
    }

    /**玩家出牌 */
    public setSomeOneOutMj(chairId, mjid) {
        //基本数据处理
        var realSeat = this.getRealSeatByRemoteSeat(chairId)
        if (!this.playerInfoMap.get(realSeat)) {
            GameManager.getInstance().handReconnect()
            return
        }
        this.gameinfo.lastOutMjId = mjid;
        this.gameinfo.lastOutPid = this.playerInfoMap.get(realSeat).id;
        //将出牌从手牌中移除
        if (this.gameinfo.lastOutPid != GameDataManager.getInstance().userInfoData.userId) {
            //关闭操作按钮
            this.setPGHTips(null);
            if (this.playerInfoMap.get(realSeat).cards.length % 3 == 2)
                this.playerInfoMap.get(realSeat).cards.pop();
        }
        else {
            if (this.gameinfo.curSelectOutMj == null) {
                MessageManager.getInstance().messagePost(ListenerType.mj_selectOutMjNull, { id: this.gameinfo.lastOutPid, outMjId: mjid })
            }
            for (var i = 0; i < this.playerInfoMap.get(realSeat).cards.length; ++i) {
                if (this.playerInfoMap.get(realSeat).cards[i] === mjid) {
                    this.playerInfoMap.get(realSeat).cards.splice(i, 1);
                    break;
                }
                else if (this.gameinfo.curSelectOutMj != null && mjid == 0) {
                    if (this.playerInfoMap.get(realSeat).cards[i] == this.gameinfo.curSelectOutMj.attr) {
                        this.playerInfoMap.get(realSeat).cards.splice(i, 1);
                        break;
                    }

                }
            }
            if (this.gameinfo.curJiao.length != 0) {
                if (this.gameinfo.curSelectOutMj == null) {
                    MessageManager.getInstance().messagePost(ListenerType.mj_selectOutMjNull, { id: this.gameinfo.lastOutPid, outMjId: mjid })
                }
                //听牌提示数据更新
                for (var i = 0; i < this.gameinfo.curJiao.length; ++i) {
                    if (this.gameinfo.curJiao[i].discard === mjid) {
                        this.gameinfo.curMjTips = this.gameinfo.curJiao[i].tiles;
                        break;
                    }
                }
            }
            MessageManager.getInstance().messagePost(ListenerType.mj_huPaiTipsDisPlay, {})
        }
        //加入到出牌区域
        this.playerInfoMap.get(realSeat).outCard.push(mjid);
        MessageManager.getInstance().messagePost(ListenerType.mj_outMj, { id: this.gameinfo.lastOutPid, outMjId: mjid })
        //出牌后关闭操作按钮
        if (this.gameinfo.lastOutPid == GameDataManager.getInstance().userInfoData.userId) {
            this.gameinfo.curJiao = []
            this.setTingBtnChange(false);
            this.setPGHTips(null);

        }
    }

    /**设置听按钮状态 */
    public setTingBtnChange(isclick) {
        this.gameinfo.isTingClick = isclick;
    }
    /**听按钮按下状态改变 */
    public setTingButtonChange(isclick) {
        this.gameinfo.isTingClick = isclick;
        MessageManager.getInstance().messagePost(ListenerType.mj_tingPaiTipsRec, {})
    }
    /**某人摸牌 */
    public setSomeOneGetMj(pid, mjid) {
        var index = this.getSeatById(pid);
        this.playerInfoMap.get(index).cards.push(mjid);
        MessageManager.getInstance().messagePost(ListenerType.mj_getMj, { id: pid })
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
                if (hashInfo[0] == this.laiziValue) { }
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

        return gang
    }

    //胡碰杠听数据改变
    setPGHResult(type, mjid, pinid, poutid, laiziNum) {
        var poutid = poutid
        var poutseat = this.getSeatById(poutid); // 上一个出牌的人
        var pinseat = this.getSeatById(pinid);
        //  碰:1, 直杠:2,  点炮:3,  自摸:4,  补杠:5,   暗杠:6
        if (type == 8) {
            //听牌
            this.playerInfoMap.get(pinseat).istinged = true;
            MessageManager.getInstance().messagePost(ListenerType.mj_animationPlay, { seat: pinseat, type: 3, audio: "ting" });
        }
        else if (type == 1) {
            //出牌人的数据
            this.gameinfo.lastOutMjId = -1;
            if (this.playerInfoMap.get(poutseat) && poutseat >= 0) {
                this.playerInfoMap.get(poutseat).outCard.pop();
                this.setOutCards(poutid, this.playerInfoMap.get(poutseat).outCard)
            }
            //碰牌人的数据
            this.removeHandMj(pinseat, mjid, 2);
            var pginfo = [mjid, mjid, mjid, -1, poutseat, type];
            this.playerInfoMap.get(pinseat).mjpg.push(pginfo);
            this.setPG(pinid, this.playerInfoMap.get(pinseat).mjpg)
            this.setHeadCard(pinid, this.playerInfoMap.get(pinseat).cards)
            MessageManager.getInstance().messagePost(ListenerType.mj_animationPlay, { seat: pinseat, type: 1, audio: "peng" });
        }
        else if (type == 5) {
            //补杠
            //出牌人的数据
            //杠牌人的数据
            this.removeHandMj(pinseat, mjid, 1);
            for (var i = 0; i < this.playerInfoMap.get(pinseat).mjpg.length; ++i) {
                if (this.playerInfoMap.get(pinseat).mjpg[i][0] === mjid) {
                    this.playerInfoMap.get(pinseat).mjpg[i][3] = mjid;
                    this.playerInfoMap.get(pinseat).mjpg[i][5] = type
                    break;
                }
            }
            this.gameinfo.isTingClick = false;
            this.setHeadCard(pinid, this.playerInfoMap.get(pinseat).cards)
            this.setPG(pinid, this.playerInfoMap.get(pinseat).mjpg)
            MessageManager.getInstance().messagePost(ListenerType.mj_animationPlay, { seat: pinseat, type: 2, audio: "gang" });
        }
        else if (type == 6) {
            //暗杠
            //杠牌人的数据
            this.removeHandMj(pinseat, mjid, 4);
            var pginfo = [mjid, mjid, mjid, mjid, pinseat, type];
            this.playerInfoMap.get(pinseat).mjpg.push(pginfo);
            this.gameinfo.isTingClick = false;
            this.setHeadCard(pinid, this.playerInfoMap.get(pinseat).cards)
            this.setPG(pinid, this.playerInfoMap.get(pinseat).mjpg)
            MessageManager.getInstance().messagePost(ListenerType.mj_animationPlay, { seat: pinseat, type: 2, audio: "angang" });
        }
        else if (type == 2) {
            //明杠
            //出牌人的数据
            this.gameinfo.lastOutMjId = -1;
            if (this.playerInfoMap.get(poutseat)) {
                this.playerInfoMap.get(poutseat).outCard.pop();
                this.setOutCards(poutid, this.playerInfoMap.get(poutseat).outCard)
            }
            //杠牌人的数据
            this.removeHandMj(pinseat, mjid, 3);
            var pginfo = [mjid, mjid, mjid, mjid, poutseat, type];
            this.playerInfoMap.get(pinseat).mjpg.push(pginfo);
            this.gameinfo.isTingClick = false;
            this.setHeadCard(pinid, this.playerInfoMap.get(pinseat).cards)
            this.setPG(pinid, this.playerInfoMap.get(pinseat).mjpg)
            MessageManager.getInstance().messagePost(ListenerType.mj_animationPlay, { seat: pinseat, type: 2, audio: "gang" });
        }
        else if (type == 3) {
            //有人胡牌 
            if (this.playerInfoMap.get(poutseat) && poutseat >= 0) {
                var poutOutCardLength = this.playerInfoMap.get(poutseat).outCard.length
                if (poutOutCardLength > 0 && this.playerInfoMap.get(poutseat).outCard[poutOutCardLength - 1] == mjid) {
                    this.playerInfoMap.get(poutseat).outCard.pop();
                }
                this.setOutCards(poutid, this.playerInfoMap.get(poutseat).outCard)
                MessageManager.getInstance().messagePost(ListenerType.mj_animationPlay, { seat: poutseat, type: 4, audio: "dianpao" });
            }
            this.playerInfoMap.get(pinseat).huPaiList.push(mjid)
            MessageManager.getInstance().messagePost(ListenerType.mj_huPaiNumChanged, { seat: pinseat, huPaiList: this.playerInfoMap.get(pinseat).huPaiList })
            MessageManager.getInstance().messagePost(ListenerType.mj_animationPlay, { seat: pinseat, type: 0, audio: "hu" });

        }
        else if (type == 12) {
            var qiangMj = mjid
            if (laiziNum > 0)
                qiangMj = this.laiziValue
            //有人抢杠胡牌 
            if (this.playerInfoMap.get(poutseat).cards.length % 3 == 2)   // 抢的扒杠
            {
                var poutCards = this.playerInfoMap.get(poutseat).cards
                if (poutseat != 0) // 抢杠的不是我
                {
                    poutCards.pop();
                    this.setHeadCard(poutid, poutCards)
                }
                else // 抢杠的是我手中的牌
                {

                    var qgCardIdx = poutCards.indexOf(qiangMj)
                    if (qgCardIdx >= 0)
                        poutCards.splice(qgCardIdx, 1)
                    this.setHeadCard(poutid, poutCards)
                }
            }
            else {
                var poutOutCardLength = this.playerInfoMap.get(poutseat).outCard.length
                if (poutOutCardLength > 0 && this.playerInfoMap.get(poutseat).outCard[poutOutCardLength - 1] == qiangMj)
                    this.playerInfoMap.get(poutseat).outCard.pop();
                this.setOutCards(poutid, this.playerInfoMap.get(poutseat).outCard)
            }
            this.playerInfoMap.get(pinseat).huPaiList.push(qiangMj)
            MessageManager.getInstance().messagePost(ListenerType.mj_huPaiNumChanged, { seat: pinseat, huPaiList: this.playerInfoMap.get(pinseat).huPaiList })
            MessageManager.getInstance().messagePost(ListenerType.mj_animationPlay, { seat: pinseat, type: 0, audio: "hu" });
            MessageManager.getInstance().messagePost(ListenerType.mj_animationPlay, { seat: poutseat, type: 4, audio: "dianpao" });

        }
        else if (type == 4) {
            //有人自摸
            if (pinseat == 0)
                this.playerInfoMap.get(pinseat).huPaiList.push(mjid)
            else
                this.playerInfoMap.get(pinseat).huPaiList.push(0)
            MessageManager.getInstance().messagePost(ListenerType.mj_huPaiNumChanged, { seat: pinseat, huPaiList: this.playerInfoMap.get(pinseat).huPaiList })
            MessageManager.getInstance().messagePost(ListenerType.mj_animationPlay, { seat: pinseat, type: 0, audio: "zimo" });
        }
        else if (type == 10 || type == 11) {
            this.gameinfo.lastOutMjId = -1;
            this.playerInfoMap.get(pinseat).isMened = true
            if (type == 10) {
                this.playerInfoMap.get(poutseat).outCard.pop();
                this.setOutCards(poutid, this.playerInfoMap.get(poutseat).outCard)
                this.playerInfoMap.get(pinseat).menCard.push(mjid);
            }
            else {
                this.playerInfoMap.get(pinseat).cards.pop()
                this.setHeadCard(pinid, this.playerInfoMap.get(pinseat).cards)
                this.playerInfoMap.get(pinseat).menCard.push(0);
            }
            this.setMen(pinid, this.playerInfoMap.get(pinseat).menCard)
            MessageManager.getInstance().messagePost(ListenerType.mj_handMjChanged, { id: this.playerInfoMap.get(pinseat).id })
            MessageManager.getInstance().messagePost(ListenerType.mj_animationPlay, { seat: pinseat, type: 5, audio: "menhu" });
        }
        else if (type == 9) {
            if (pinseat == 0)
                MessageManager.getInstance().messagePost(ListenerType.mj_onGuoActionRec);
        }
        else if (type == 13) // 带癞子的碰
        {
            this.gameinfo.lastOutMjId = -1;
            if (this.playerInfoMap.get(poutseat) && poutseat >= 0) {
                this.playerInfoMap.get(poutseat).outCard.pop();
                this.setOutCards(poutid, this.playerInfoMap.get(poutseat).outCard)
            }
            //碰牌人的数据
            if (pinseat != 0) {
                this.removeHandMj(pinseat, mjid, 2);
            }
            else {
                var cardNum = this.getCardNumInHand(mjid)
                this.removeHandMj(pinseat, mjid, cardNum);
                this.removeHandMj(pinseat, this.laiziValue, laiziNum);
            }
            var pginfo = [];
            for (var k = 0; k < laiziNum; k++)
                pginfo.push(this.laiziValue) //手中的癞子牌
            pginfo.push(mjid) // 被碰的牌
            for (var j = 0; j < (2 - laiziNum); j++)
                pginfo.push(mjid) //手中的牌
            pginfo.push(-1) // 填充
            pginfo.push(poutseat)
            pginfo.push(type)
            this.playerInfoMap.get(pinseat).mjpg.push(pginfo);
            this.setPG(pinid, this.playerInfoMap.get(pinseat).mjpg)
            this.setHeadCard(pinid, this.playerInfoMap.get(pinseat).cards)
            MessageManager.getInstance().messagePost(ListenerType.mj_animationPlay, { seat: pinseat, type: 1, audio: "peng" });
        }
        else if (type == 14) // 带癞子的明杠
        {
            this.gameinfo.lastOutMjId = -1;
            if (this.playerInfoMap.get(poutseat)) {
                this.playerInfoMap.get(poutseat).outCard.pop();
                this.setOutCards(poutid, this.playerInfoMap.get(poutseat).outCard)
            }
            if (pinseat != 0) {
                var cardNum = 3 - laiziNum
                this.removeHandMj(pinseat, mjid, 3);
            }
            else {
                var cardNum = this.getCardNumInHand(mjid)
                this.removeHandMj(pinseat, mjid, cardNum);
                this.removeHandMj(pinseat, this.laiziValue, laiziNum);
            }
            var pginfo = [];
            for (var k = 0; k < laiziNum; k++)
                pginfo.push(this.laiziValue) //手中的癞子牌
            pginfo.push(mjid) // 被杠的牌
            for (var j = 0; j < cardNum; j++)
                pginfo.push(mjid) //手中的牌
            pginfo.push(poutseat)
            pginfo.push(type)
            this.playerInfoMap.get(pinseat).mjpg.push(pginfo);
            this.gameinfo.isTingClick = false;
            this.setHeadCard(pinid, this.playerInfoMap.get(pinseat).cards)
            this.setPG(pinid, this.playerInfoMap.get(pinseat).mjpg)
            MessageManager.getInstance().messagePost(ListenerType.mj_animationPlay, { seat: pinseat, type: 2, audio: "gang" });
        }
        else if (type == 15) //带癞子的暗杠
        {
            if (pinseat != 0) {
                this.removeHandMj(pinseat, mjid, 4);
            }
            else {
                var cardNum = this.getCardNumInHand(mjid)
                this.removeHandMj(pinseat, mjid, cardNum);
                this.removeHandMj(pinseat, this.laiziValue, laiziNum);
            }

            var pginfo = [];
            for (var k = 0; k < laiziNum; k++)
                pginfo.push(this.laiziValue) //手中的癞子牌
            for (var j = 0; j < 4 - laiziNum; j++)
                pginfo.push(mjid) //手中的牌
            pginfo.push(poutseat)
            pginfo.push(type)
            this.playerInfoMap.get(pinseat).mjpg.push(pginfo);
            this.gameinfo.isTingClick = false;
            this.setHeadCard(pinid, this.playerInfoMap.get(pinseat).cards)
            this.setPG(pinid, this.playerInfoMap.get(pinseat).mjpg)
            MessageManager.getInstance().messagePost(ListenerType.mj_animationPlay, { seat: pinseat, type: 2, audio: "angang" });
        }
        else if (type == 16) //带癞子的补杠
        {
            var target = mjid
            if (pinseat == 0) {
                var cardNum = this.getCardNumInHand(mjid)
                if (cardNum == 0)
                    target = this.laiziValue
            }
            else {
                if (laiziNum > 0)
                    target = this.laiziValue
            }
            this.removeHandMj(pinseat, target, 1);
            for (var i = 0; i < this.playerInfoMap.get(pinseat).mjpg.length; ++i) {
                if (this.playerInfoMap.get(pinseat).mjpg[i][2] === mjid) {
                    var result = [];
                    for (var j = 0; j < 3; j++) {
                        if (this.playerInfoMap.get(pinseat).mjpg[i][j] == this.laiziValue)
                            result.push(this.laiziValue)
                    }
                    result.push(target)
                    var lastNum = 4 - result.length
                    for (var k = 0; k < lastNum; k++)
                        result.push(mjid)
                    result.push(this.playerInfoMap.get(pinseat).mjpg[i][4])
                    result.push(16)
                    this.playerInfoMap.get(pinseat).mjpg[i] = result;
                    break;
                }
            }
            this.gameinfo.isTingClick = false;
            this.setHeadCard(pinid, this.playerInfoMap.get(pinseat).cards)
            this.setPG(pinid, this.playerInfoMap.get(pinseat).mjpg)
            MessageManager.getInstance().messagePost(ListenerType.mj_animationPlay, { seat: pinseat, type: 2, audio: "gang" });
        }
        else if (type == 17) //换牌
        {
            if (pinseat == 0) {
                var length = this.playerInfoMap.get(pinseat).cards.length
                this.playerInfoMap.get(pinseat).cards[length - 1] = this.laiziValue
            }
            for (var i = 0; i < this.playerInfoMap.get(pinseat).mjpg.length; ++i) {
                if (this.playerInfoMap.get(pinseat).mjpg[i][3] === mjid) {
                    for (var j = 3; j >= 0; j--) {
                        if (this.playerInfoMap.get(pinseat).mjpg[i][j] == this.laiziValue) {
                            this.playerInfoMap.get(pinseat).mjpg[i][j] = mjid
                            break
                        }
                    }
                }
            }
            this.setHeadCard(pinid, this.playerInfoMap.get(pinseat).cards)
            this.setPG(pinid, this.playerInfoMap.get(pinseat).mjpg)

        }
    }

    getCardNumInHand(tile, isContainPG = false): number {
        var handTileCount = 0
        var playerObj = this.playerInfoMap.get(0)
        for (var cardId of playerObj.cards) {
            if (tile == cardId)
                handTileCount += 1
        }
        if (isContainPG) // 要计算碰杠中的牌
        {
            for (var j = 0; j < playerObj.mjpg.length; ++j) {
                for (var k = 0; k < 4; ++k) {
                    if (playerObj.mjpg[j][k] === tile)
                        handTileCount += 1;
                }
            }
        }

        return handTileCount
    }

    //移除手牌
    removeHandMj(seat, mjid, num) {
        if (seat === 0) {
            for (var i = 0; i < num; ++i) {
                for (var j = 0; j < this.playerInfoMap.get(seat).cards.length; ++j) {
                    if (this.playerInfoMap.get(seat).cards[j] === mjid) {
                        this.playerInfoMap.get(seat).cards.splice(j, 1);
                        break;
                    }
                }
            }
        }
        else {
            for (var i = 0; i < num; ++i)
                this.playerInfoMap.get(seat).cards.pop();
        }
    }

    public initOverPlayerData() {
        this.overTempPlayerInfo.clear()
        this.playerInfoMap.forEach((infoObj, seat) => {
            var info = {
                id: infoObj.id,
                name: infoObj.name,
                headurl: infoObj.headurl,
                seat: infoObj.seat,
                realSeat: infoObj.realSeat,
            }
            this.overTempPlayerInfo.set(seat, info)
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

    /**设置单局结算 */
    public setRoundOver(msg) {
        this._gameinfo.curRoundOverData = msg;

        for (var i = 0; i < msg.players.length; i++) {
            var realSeat = this.getRealSeatByRemoteSeat(msg.players[i].chairId)
            msg.players[i].guid = this._playerInfoMap.get(realSeat).id

            /**数据转换 */
            var pgArray = [];
            var pgmjArray = msg.players[i].pbMingPai;
            for (var j = 0; j < pgmjArray.length; ++j) {
                if (pgmjArray[j].type === SECTION_TYPE.Peng) {
                    var realSeat = this.getRealSeatByRemoteSeat(msg.players[i].chairId)
                    var peng = [pgmjArray[j].tile, pgmjArray[j].tile, pgmjArray[j].tile, -1, realSeat, 1];
                    pgArray.push(peng);
                }
                else if (pgmjArray[j].type === SECTION_TYPE.BaGang || pgmjArray[j].type === SECTION_TYPE.MingGang || pgmjArray[j].type === SECTION_TYPE.FreeBaGang) {
                    var type = 5
                    var gang = [pgmjArray[j].tile, pgmjArray[j].tile, pgmjArray[j].tile, pgmjArray[j].tile, realSeat, type];
                    pgArray.push(gang);
                }
                else if (pgmjArray[j].type === SECTION_TYPE.AnGang || pgmjArray[j].type === SECTION_TYPE.FreeAnGang) {
                    var gang = [pgmjArray[j].tile, pgmjArray[j].tile, pgmjArray[j].tile, pgmjArray[j].tile, realSeat, 6];
                    pgArray.push(gang);
                }
                else if (pgmjArray[j].type === SECTION_TYPE.RuanPeng) {
                    var realSeat = this.getRealSeatByRemoteSeat(msg.players[i].chairId)
                    var peng = [];
                    for (var k = 0; k < pgmjArray[j].substituteNum; k++)
                        peng.push(this.laiziValue) //手中的癞子牌
                    for (var m = 0; m < 3 - pgmjArray[j].substituteNum; m++)
                        peng.push(pgmjArray[j].tile) //手中的牌
                    peng.push(-1)
                    peng.push(realSeat)
                    peng.push(13)
                    pgArray.push(peng);
                }
                else if (pgmjArray[j].type === SECTION_TYPE.RuanAnGang || pgmjArray[j].type === SECTION_TYPE.RuanMingGang ||
                    pgmjArray[j].type === SECTION_TYPE.RuanBaGang) {
                    var gang = [];
                    for (var k = 0; k < pgmjArray[j].substituteNum; k++)
                        gang.push(this.laiziValue) //癞子牌
                    for (var m = 0; m < 4 - pgmjArray[j].substituteNum; m++)
                        gang.push(pgmjArray[j].tile)
                    gang.push(realSeat)
                    if (pgmjArray[j].type === SECTION_TYPE.RuanAnGang)
                        gang.push(15)
                    else if (pgmjArray[j].type === SECTION_TYPE.RuanMingGang)
                        gang.push(14)
                    else
                        gang.push(16)
                    pgArray.push(gang);
                }
            }
            msg.players[i].pbMingPai = pgArray;
        }
        for (var j = 0; j < msg.playerBalance.length; j++) {
            var tempSeat = this.getRealSeatByRemoteSeat(msg.playerBalance[j].chairId)
            if (this.gameinfo.rule.union)
                this._playerInfoMap.get(tempSeat).clubScore = this._playerInfoMap.get(tempSeat).clubScore + msg.playerBalance[j].roundMoney / 100
            else
                this._playerInfoMap.get(tempSeat).clubScore = this._playerInfoMap.get(tempSeat).clubScore + msg.playerBalance[j].roundScore
        }
        this._playerInfoMap.forEach((infoObj, seat) => {
            infoObj.isready = false;
            MessageManager.getInstance().messagePost(ListenerType.mj_playerStateChanged, { playerSeat: seat, state: false, type: "ready" });
        })

    }


    setOwner(msg) {
        this._gameinfo.creator = msg.newOwner;
        MessageManager.getInstance().disposeMsg();

    }

    // 收到deskenter时再次清理数据
    clearDataOnStart() {
        this._playerInfoMap.forEach((infoObj, seat) => {
            infoObj.clearCards()
        })
        this.gameinfo.curOperateId = 0;
        this.gameinfo.lastOutMjId = -1;
        this.gameinfo.lastOutPid = 0;
        this.gameinfo.curJiao = [];
        this.setPGHTips(null)
    }

    //清理玩家一局数据
    cleanRoundOver() {
        //玩家牌数据
        this._playerInfoMap.forEach((infoObj, seat) => {
            infoObj.istinged = false;
            infoObj.isMened = false;
            infoObj.cards = [];
            infoObj.mjpg = [];
            infoObj.outCard = [];
            infoObj.menCard = [];
            infoObj.guMaiScore = -1
        })
        this.gameinfo.curOperateId = 0;
        this.gameinfo.lastOutMjId = -1;
        this.gameinfo.lastOutPid = 0;
        this.gameinfo.curJiao = [];
        this.gameinfo.tingSortList = [];
        this.setPGHTips(null)
        this.gameinfo.laiZhiCards = [];
        this.gameinfo.curMjTips = null;
        this.gameinfo.dealerId = -1;
        this.gameinfo.isTingClick = false;
        this.GameStartState = -1
        this.setOverPlusNum(0);
    }

    public clearDataByContinue(): void {
        this.gameinfo.curRound = 0
        this._gameinfo.curRoundOverData = null
        this._gameinfo.curGameOverData = null
        this._gameinfo.mBTableStarted = false
        this._playerInfoMap.forEach((infoObj, seat) => {
            infoObj.clubScore = 0;
            infoObj.guMaiScore = -1
            infoObj.istinged = false;
            infoObj.isMened = false;
            infoObj.cards = [];
            infoObj.mjpg = [];
            infoObj.outCard = [];
            infoObj.menCard = [];
        })
        this.gameinfo.curOperateId = 0;
        this.gameinfo.lastOutMjId = -1;
        this.gameinfo.lastOutPid = 0;
        this.gameinfo.curJiao = [];
        this.gameinfo.tingSortList = [];
        this.setPGHTips(null)
        this.gameinfo.laiZhiCards = [];
        this.gameinfo.curMjTips = null;
        this.gameinfo.dealerId = -1;
        this.gameinfo.isTingClick = false;
    }

    public clear() {
        this.GameStartState = -1
        this._gameinfo = null
        this._playerInfoMap.clear()
        this._gameApplyData = null
        this._voteData = null
        ListenerManager.getInstance().removeAll(this)
    }

}