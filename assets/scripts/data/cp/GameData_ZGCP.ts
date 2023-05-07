import { GameManager } from '../../GameManager';
import { GAME_TYPE, CP_ACTION } from '../GameConstValue';
import * as Proto from "../../../proto/proto-min";
import { cpGameInfo } from "./cpGameInfo";
import { cardChangPai, GAME_STATE_CP, SECTION_TYPE } from "./cpDefines"
import { cpPlayerInfo } from "./cpPlayerInfo";
import { MessageManager } from "../../../framework/Manager/MessageManager";
import { ListenerType } from "../ListenerType";
import { GameDataManager } from "../../../framework/Manager/GameDataManager";
import { Utils } from "../../../framework/Utils/Utils";
import { ListenerManager } from "../../../framework/Manager/ListenerManager";
import { ConstValue } from "../GameConstValue";
import { LogWrap } from '../../../framework/Utils/LogWrap';
import { PlayBackUI_CP } from '../../ui/objects/playback/PlayBackUI_CP';


export class GameData_ZGCP {

    public static className = "GameData_ZGCP";
    public laiziValue = 0 // 癞子值

    /**游戏信息 */
    public _gameinfo: cpGameInfo = null;
    public get gameinfo() {
        return this._gameinfo
    }
    /**玩家信息 */
    private _playerInfoMap = new Map<number, cpPlayerInfo>();
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

    // 不能被操作的牌(不能打出的牌)
    private _canNotOptCards: number[] = null;
    public get canNotOptCards(): number[] {
        return this._canNotOptCards;
    }
    public set canNotOptCards(value: number[]) {
        this._canNotOptCards = value;
    }

    public overTempPlayerInfo = new Map() // 用于在结算时临时存储的玩家数据

    private tempList = []
    private GameStartState = -1
    public huInfoMap = new Map()

    constructor() {
        this.initListen()
    }

    protected initListen() {   //  Changpai
        ListenerManager.getInstance().add(Proto.SC_StandUpAndExitRoom.MsgID.ID, this, this.onPlayerLeave);                        // 自己离开房间
        ListenerManager.getInstance().add(Proto.SC_NotifyStandUp.MsgID.ID, this, this.onPlayerLeave);                        // 玩家离开房间

        ListenerManager.getInstance().add(Proto.SC_NotifySitDown.MsgID.ID, this, this.onPlayerSit);                    // 新的玩家加入
        ListenerManager.getInstance().add(Proto.SC_Ready.MsgID.ID, this, this.setSomeOneReady);             // 准备
        ListenerManager.getInstance().add(Proto.SC_Changpai_Desk_Enter.MsgID.ID, this, this.onShowToujiaInAni);              // 游戏信息初始化
        ListenerManager.getInstance().add(Proto.Changpai_Toupaistate.MsgID.ID, this, this.onGameStateRec);
        ListenerManager.getInstance().add(Proto.SC_Changpai_Draw.MsgID.ID, this, this.onGetMj);                           // 摸牌
        ListenerManager.getInstance().add(Proto.SC_Changpai_Fan.MsgID.ID, this, this.onOpenMj);                           // 翻牌
        ListenerManager.getInstance().add(Proto.SC_Changpai_Discard_Round.MsgID.ID, this, this.onOperatePlayerChanged);                           // 该谁操作
        ListenerManager.getInstance().add(Proto.SC_Changpai_Action_Discard.MsgID.ID, this, this.onOutMj);                           // 出牌
        ListenerManager.getInstance().add(Proto.SC_Changpai_Tile_Left.MsgID.ID, this, this.onLeftMjNumChanged);                           // 剩余
        ListenerManager.getInstance().add(Proto.SC_CP_WaitingDoActions.MsgID.ID, this, this.onPGHTipsRec);                      // 剩余
        ListenerManager.getInstance().add(Proto.SC_Changpai_Do_Action.MsgID.ID, this, this.onActionRec);                      // 收到碰，杠，胡，报听完消息
        ListenerManager.getInstance().add(Proto.SC_Changpai_StopAction.MsgID.ID, this, this.onActionStop);
        ListenerManager.getInstance().add(Proto.SC_DismissTableReq.MsgID.ID, this, this.onDisMissDataRec);                 // 房间解散重连数据
        ListenerManager.getInstance().add(Proto.S2C_TRANSFER_ROOM_OWNER_RES.MsgID.ID, this, this.setOwner);                   // 房主更变
        ListenerManager.getInstance().add(Proto.SC_TimeOutNotify.MsgID.ID, this, this.onOpTimechange);             // 操作时间改变
        ListenerManager.getInstance().add(Proto.SC_VoteTableReq.MsgID.ID, this, this.onVoteDataRec);                 // 房间解散重连数据
        ListenerManager.getInstance().add(Proto.SC_PlayOnceAgain.MsgID.ID, this, this.onPlayOnceAgain);
        ListenerManager.getInstance().add(Proto.SC_NotifyOnline.MsgID.ID, this, this.onPlayerOnlineRec);
        ListenerManager.getInstance().add(Proto.SC_Changpai_Do_Action_Commit.MsgID.ID, this, this.onActionConfirmRec);
        ListenerManager.getInstance().add(Proto.SC_CP_HuStatus.MsgID.ID, this, this.onHuInfoRec);
        ListenerManager.getInstance().add(Proto.SC_ChangpaiGameFinish.MsgID.ID, this, this.isRoundOverHuangZhuang);
        ListenerManager.getInstance().add(Proto.SC_Changpai_Final_Game_Over.MsgID.ID, this, this.setGameOver);
        ListenerManager.getInstance().add(Proto.SC_CP_Baoting.MsgID.ID, this, this.onBaoTingSubmit);
        ListenerManager.getInstance().add(Proto.SC_CP_BaotingCommit.MsgID.ID, this, this.onBaoTingEnd);                  // 飘分结束后
        ListenerManager.getInstance().add(Proto.SC_CP_BaotingStatus.MsgID.ID, this, this.onBaoTingStatusRec);            // 收到玩家重连飘分状态    
    }

    private onBaoTingSubmit(msg) {
        var realSeat = this.getRealSeatByRemoteSeat(msg.status.chairId)
        if (!this.playerInfoMap.get(realSeat)) {
            GameManager.getInstance().handReconnect()
            return
        }
        this.playerInfoMap.get(realSeat).isBaoTing = msg.status.done
        MessageManager.getInstance().messagePost(ListenerType.cp_BaotingStatusChanged, {});
        MessageManager.getInstance().disposeMsg();
    }
    onBaoTingEnd(msg) {
        try {
            for (let i = 0; i < msg.baotings.length; ++i) {
                let realSeat = this.getRealSeatByRemoteSeat(msg.baotings[i].chairId)
                this.playerInfoMap.get(realSeat).baoTingResult = msg.baotings[i].baoting
            }
            MessageManager.getInstance().messagePost(ListenerType.cp_recBaoTingResult, {});
            this.setGameState(GAME_STATE_CP.WAIT_MO_PAI)
            MessageManager.getInstance().disposeMsg();
        }
        catch (e) {
            GameManager.getInstance().handReconnect()
        }
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
        MessageManager.getInstance().messagePost(ListenerType.cp_recBaoTingResult, {});
        this.playerInfoMap.forEach((infoObj, seat) => {
            infoObj.isready = false;
            MessageManager.getInstance().messagePost(ListenerType.cp_playerStateChanged, { playerSeat: seat, state: false, type: "ready" });
        })
        MessageManager.getInstance().disposeMsg();
    }
    /**
     *  1.展示头家扑克
     *  2.展示头家动画
     *  3.调用onGameDateInit处理数据
     *  4.播放手牌动画
     */
    private onShowToujiaInAni(msg) {
        this.clearDataOnStart()
        this.setGameState(msg.state) // 数据填充完成时在推进游戏进度
        this.GameStartState = msg.state
        this.setTableStart(true);
        this.gameinfo.qieCard = msg.qiePai
        this.setCurRound(msg.round)
        this.gameinfo.curRoundOverData = null
        this.gameinfo.curGameOverData = null
        if (!msg.isReconnect) {
            MessageManager.getInstance().messagePost(ListenerType.cp_play_toujia_ani, msg);
            MessageManager.getInstance().disposeMsg();
            return
        }
        this.onGameDateInit(msg)
        MessageManager.getInstance().disposeMsg();
    }

    public onGameDateInit(msg) {
        this.setDealer(msg.zhuang)
        if (msg.pbRecData) {
            if (msg.pbRecData.lastChuPaiChair) {
                var realSeat = this.getRealSeatByRemoteSeat(msg.pbRecData.lastChuPaiChair)
                if (this.playerInfoMap.get(realSeat)) {
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
            let tuosArray = [0, 0, 0]
            for (var pbPlayerInfo of msg.pbPlayers) {
                var realSeat = this.getRealSeatByRemoteSeat(pbPlayerInfo.chairId)
                if (!this.playerInfoMap.get(realSeat)) {
                    GameManager.getInstance().handReconnect()
                    return
                }
                //设置不可以出的牌
                this.onCanNotOptCards(pbPlayerInfo)
                this.playerInfoMap.get(realSeat).updatePlayerInfoOnStart(pbPlayerInfo)
                tuosArray[pbPlayerInfo.chairId - 1] = pbPlayerInfo.tuos
            }
            MessageManager.getInstance().messagePost(ListenerType.cp_tuosInfo, { tuos: tuosArray });
        }
        if (msg.isReconnect) {
            //重连的时候模拟翻一张牌或者玩家打一张牌
            if (msg.lastFanPai && msg.lastFanPai.chairId && msg.lastFanPai.card) {
                this.gameinfo.lastOutPid = 0
                this.gameinfo.lastOutMjId = -1
                this.onOpenMj({ chairId: msg.lastFanPai.chairId, tile: msg.lastFanPai.card })
            } else if (msg.lastChuPai && msg.lastChuPai.chairId && msg.lastChuPai.card) {
                let viewSeat = this.getRealSeatByRemoteSeat(msg.lastChuPai.chairId)
                if (this.playerInfoMap.get(viewSeat)) {
                    let userId = this.playerInfoMap.get(viewSeat).id
                    MessageManager.getInstance().messagePost(ListenerType.cp_outcp, { id: userId, outMjId: msg.lastChuPai.card })
                }
            }
        }
        MessageManager.getInstance().messagePost(ListenerType.cp_start, {});
    }

    private onGameStateRec(msg) {
        this.setGameState(msg.status);
        MessageManager.getInstance().disposeMsg();
    }

    private onGetMj(msg) {
        //关闭操作按钮
        var realSeat = this.getRealSeatByRemoteSeat(msg.chairId)
        if (!this._playerInfoMap.get(realSeat)) {
            GameManager.getInstance().handReconnect()
            return
        }
        // 如果是自己摸牌 清除不可出牌列表
        if (realSeat == 0) {
            this.canNotOptCards = []
        }
        this.setSomeOneGetMj(this.playerInfoMap.get(realSeat).id, msg.tile);
        MessageManager.getInstance().disposeMsg();
    }

    private onOpenMj(msg) {
        //关闭操作按钮
        var realSeat = this.getRealSeatByRemoteSeat(msg.chairId)
        if (!this._playerInfoMap.get(realSeat)) {
            GameManager.getInstance().handReconnect()
            return
        }
        MessageManager.getInstance().messagePost(ListenerType.cp_opencp, msg)
        MessageManager.getInstance().disposeMsg();
    }

    private onLeftMjNumChanged(msg) {
        //设置剩余牌数量
        this.setOverPlusNum(msg.tileLeft)
        MessageManager.getInstance().disposeMsg();
    }

    private onOperatePlayerChanged(msg) {
        //设置当前玩家
        if (this._gameinfo.gameState != GAME_STATE_CP.WAIT_CHU_PAI)
            this.setGameState(GAME_STATE_CP.WAIT_CHU_PAI)
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
                    this.removePlayer(seat)
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
        this.setPGHTips(null);
        MessageManager.getInstance().disposeMsg();
    }

    protected onActionRec(msg) {

        this.onCanNotOptCards(msg)

        //  吃1  碰:2, 巴:3,  偷4  胡:5,  吃来包牌:6,  天胡7  8 过  
        var realSeat = this.getRealSeatByRemoteSeat(msg.chairId)
        if (!this.playerInfoMap.get(realSeat)) {
            GameManager.getInstance().handReconnect()
            return
        }
        var myId = this._playerInfoMap.get(realSeat).id
        var type = 0
        var poutid = this.gameinfo.lastOutPid
        if (msg.action == CP_ACTION.ACTION_CHI)
            type = 1
        else if (msg.action == CP_ACTION.ACTION_PENG)
            type = 2
        else if (msg.action == CP_ACTION.ACTION_BA_GANG)
            type = 3
        else if (msg.action == CP_ACTION.ACTION_TOU)
            type = 4
        else if (msg.action == CP_ACTION.ACTION_HU || msg.action == CP_ACTION.ACTION_QIANG_GANG_HU || msg.action == CP_ACTION.ACTION_ZI_MO)
            type = 5
        else if (msg.action == CP_ACTION.ACTION_TIAN_HU)
            type = 7
        else if (msg.action == CP_ACTION.ACTION_PASS)
            type = 8
        else
            console.log("收到异常action------------------------------", msg)
        this.setPGHTips(null);
        this.setPGHResult(type, msg, myId, poutid);
        MessageManager.getInstance().disposeMsg();
    }

    // 不可以操作的牌(不能被打出的牌)
    private onCanNotOptCards(msg) {
        let viewID = this.getRealSeatByRemoteSeat(msg.chairId)
        if (!msg.unusablecard || viewID != 0) {
            return
        }
        //this.canNotOptCards = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]
        this.canNotOptCards = msg.unusablecard
    }

    private onActionStop(msg) {
        this.setPGHTips(null);
        MessageManager.getInstance().disposeMsg();
    }

    private onOpTimechange(msg) {
        this.gameinfo.totalTime = msg.totalTime
        this.setTime(msg.leftTime);
        MessageManager.getInstance().disposeMsg();
    }

    // 收到解散请求
    private onDisMissDataRec(msg) {
        this.gameApplyData = msg
        MessageManager.getInstance().messagePost(ListenerType.cp_dismissResponse, {})
    }


    private onVoteDataRec(msg) {
        this.voteData = msg
        MessageManager.getInstance().messagePost(ListenerType.cp_VoteResponse, {})
    }

    private onPlayOnceAgain(msg) {
        this.gameinfo.roundId = msg.roundInfo.roundId
        MessageManager.getInstance().disposeMsg();
    }

    public updateTableInfo(msg, roundId) {
        if (this._gameinfo != null)
            return;
        this._gameinfo = new cpGameInfo();
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
        let playerInfo = new cpPlayerInfo();
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
                    MessageManager.getInstance().messagePost(ListenerType.cp_playerNumChanged, { playerSeat: tempInfo.realSeat, tag: "add" })
            }
            this.tempList = []
        }
        if (isPost)
            MessageManager.getInstance().messagePost(ListenerType.cp_playerNumChanged, { playerSeat: playerInfo.realSeat, tag: "add" });
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
        if (GameDataManager.getInstance().curGameType == GAME_TYPE.ZGCP) {
            return ConstValue.ZGCP_PLAYER_NUM_LIST[optionIndex]
        }
        return 0
    }

    public getCurTypeHandMjNum() {
        if (GameDataManager.getInstance().curGameType == GAME_TYPE.ZGCP) {
            return 16
        }
        return 16
    }

    /**玩家移除 */
    public removePlayer(seat) {
        if (this._playerInfoMap.get(seat)) {
            this._playerInfoMap.delete(seat);
            MessageManager.getInstance().messagePost(ListenerType.cp_playerNumChanged, { playerSeat: seat, tag: "remove" });
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
        MessageManager.getInstance().messagePost(ListenerType.cp_playerStateChanged, { playerSeat: seat, state: msg.isOnline, type: "online" });
    }

    /**设置准备 */
    public setSomeOneReady(msg) {
        var otherRealSeat = this.getRealSeatByRemoteSeat(msg.readyChairId)
        if (!this.playerInfoMap.get(otherRealSeat)) {
            GameManager.getInstance().handReconnect()
            return
        }
        this._playerInfoMap.get(otherRealSeat).isready = true;
        MessageManager.getInstance().messagePost(ListenerType.cp_playerStateChanged, { playerSeat: otherRealSeat, state: true, type: "ready" });
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
    public setGameState(num: GAME_STATE_CP) {
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

    /**设置庄家 */
    public setDealer(seat) {
        var realSeat = this.getRealSeatByRemoteSeat(seat)
        if (this.playerInfoMap.get(realSeat))
            this._gameinfo.dealerId = this.playerInfoMap.get(realSeat).id;
    }
    /**设置当前选中的牌 */
    public setCurSelectMj(mj: cardChangPai) {
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
        let tempInfo = new Map()
        if (stage != null) {
            if (stage.actions.length == 0)
                return
            tempInfo.set(CP_ACTION.SESSION_ID, stage.sessionId);
            for (let action of stage.actions) {
                if (action.action == CP_ACTION.ACTION_CHI) //吃的时候需要知道两张牌的值  所以保存的是action
                {
                    if (!tempInfo.get(CP_ACTION.ACTION_CHI)) {
                        tempInfo.set(CP_ACTION.ACTION_CHI, [action])
                    } else {
                        tempInfo.get(CP_ACTION.ACTION_CHI).push(action)
                    }
                } else {
                    if (!tempInfo.get(action.action)) {
                        tempInfo.set(action.action, [action.tile])
                    } else {
                        tempInfo.get(action.action).push(action.tile)
                    }
                }
            }
        }
        this.gameinfo.state = tempInfo
    }

    public getActionSessionId() {
        var sessionId = 0
        if (this.gameinfo && this.gameinfo.state.get(CP_ACTION.SESSION_ID))
            sessionId = this.gameinfo.state.get(CP_ACTION.SESSION_ID)
        return sessionId
    }

    /**玩家出牌 */
    public setSomeOneOutMj(chairId, mjid) {
        //基本数据处理
        let realSeat = this.getRealSeatByRemoteSeat(chairId)
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
            if (this.playerInfoMap.get(realSeat).cards.length % 2 == 0)
                this.playerInfoMap.get(realSeat).cards.pop();
        }
        else {
            if (this.gameinfo.curSelectOutMj == null) {
                MessageManager.getInstance().messagePost(ListenerType.cp_selectOutCpNull, { id: this.gameinfo.lastOutPid, outMjId: mjid })
            }
            for (let i = 0; i < this.playerInfoMap.get(realSeat).cards.length; ++i) {
                if (this.playerInfoMap.get(realSeat).cards[i] === mjid) {
                    this.playerInfoMap.get(realSeat).cards.splice(i, 1);
                    break;
                }
                else if (this.gameinfo.curSelectOutMj != null && mjid == 0) {
                    if (this.playerInfoMap.get(realSeat).cards[i] == this.gameinfo.curSelectOutMj.cardIndex) {
                        this.playerInfoMap.get(realSeat).cards.splice(i, 1);
                        break;
                    }

                }
            }
        }

        //玩家已经报听而且出牌了 那么接下来所有的手牌都不可以出了
        if (this.playerInfoMap.get(0).baoTingResult) {
            this.playerInfoMap.get(0).canOutcards = []
        }

        //加入到出牌区域
        //this.playerInfoMap.get(realSeat).outCard.push(mjid);
        MessageManager.getInstance().messagePost(ListenerType.cp_outcp, { id: this.gameinfo.lastOutPid, outMjId: mjid })
        //出牌后关闭操作按钮
        if (this.gameinfo.lastOutPid == GameDataManager.getInstance().userInfoData.userId) {
            this.setPGHTips(null);

        }
    }
    /**某人摸牌 */
    public setSomeOneGetMj(pid, mjid) {
        var index = this.getSeatById(pid);
        this.playerInfoMap.get(index).cards.push(mjid);
        MessageManager.getInstance().messagePost(ListenerType.cp_getcp, { id: pid })
    }

    //胡碰杠听数据改变
    setPGHResult(type, msg, pinid, poutid) {
        var poutid = poutid
        var poutseat = this.getSeatById(poutid); // 上一个出牌的人
        var pinseat = this.getSeatById(pinid);   // 当前操作的玩家
        //  吃1  碰:2, 巴:3,  偷4  胡:5, 吃来包牌:6,,  过7 其他:过(保留)
        if (type == 1) {
            //吃牌
            this.removeHandMj(pinseat, msg.otherTile, 1);
            this.playerInfoMap.get(pinseat).mjpg.push(msg.valueTile, msg.otherTile);
            this.setPG(pinid, this.playerInfoMap.get(pinseat).mjpg)
            this.setHeadCard(pinid, this.playerInfoMap.get(pinseat).cards)
            let audioName = ["sn_zgcp_chi", "sn_zgcp_chi_cyzdyz"]
            let randIndex = Utils.reandomNumBoth(0, 1)
            let chiType = 1
            if (msg.substituteNum && msg.substituteNum > 0 && msg.substituteNum < 22) {
                chiType = 6
            }
            MessageManager.getInstance().messagePost(ListenerType.cp_animationPlay, { seat: pinseat, type: chiType, tile: msg.valueTile, audio: audioName[randIndex] });
        }
        else if (type == 2) {
            //碰牌人的数据
            this.removeHandMj(pinseat, msg.valueTile, 2);
            this.playerInfoMap.get(pinseat).mjpg.push(msg.valueTile, msg.valueTile, msg.valueTile);
            this.setPG(pinid, this.playerInfoMap.get(pinseat).mjpg)
            this.setHeadCard(pinid, this.playerInfoMap.get(pinseat).cards)
            let audioName = ["sn_zgcp_zhua", "sn_zgcp_zhua2", "sn_zgcp_pen", "sn_zgcp_pen_wyud"]
            let randIndex = Utils.reandomNumBoth(0, 1)
            MessageManager.getInstance().messagePost(ListenerType.cp_animationPlay, { seat: pinseat, type: 2, tile: msg.valueTile, audio: audioName[randIndex] });
        }
        else if (type == 3) {
            //巴 先判断手牌有几张巴的牌 有可能是碰牌或者偷牌转巴牌  也有可能是别人打出或翻出的牌  或者全部都是手牌
            let handCards = this.playerInfoMap.get(pinseat).cards
            let handCardCount = this.getCardCount(msg.valueTile, handCards)
            if (handCardCount > 0) {
                this.removeHandMj(pinseat, msg.valueTile, handCardCount);
                this.setHeadCard(pinid, this.playerInfoMap.get(pinseat).cards)
            }

            let pgCards = this.playerInfoMap.get(pinseat).mjpg
            let pgCardCount = this.getCardCount(msg.valueTile, pgCards)
            if (pgCardCount > 0) {
                let cardIndex = pgCards.indexOf(msg.valueTile)
                this.playerInfoMap.get(pinseat).mjpg.splice(cardIndex, 0, msg.valueTile)
            } else {
                this.playerInfoMap.get(pinseat).mjpg.push(msg.valueTile, msg.valueTile, msg.valueTile, msg.valueTile);
            }
            this.setPG(pinid, this.playerInfoMap.get(pinseat).mjpg)
            let audioName = ["sn_zgcp_ba", "sn_zgcp_ba_yyfan"]
            let randIndex = Utils.reandomNumBoth(0, 1)
            MessageManager.getInstance().messagePost(ListenerType.cp_animationPlay, { seat: pinseat, type: 3, tile: msg.valueTile, audio: audioName[randIndex] });
        }
        else if (type == 4) {
            //偷
            this.removeHandMj(pinseat, msg.valueTile, 3);
            this.playerInfoMap.get(pinseat).mjpg.push(msg.valueTile, msg.valueTile, msg.valueTile);
            this.setHeadCard(pinid, this.playerInfoMap.get(pinseat).cards)
            this.setPG(pinid, this.playerInfoMap.get(pinseat).mjpg)
            MessageManager.getInstance().messagePost(ListenerType.cp_animationPlay, { seat: pinseat, type: 4, audio: "sn_zgcp_wyt" });
        }
        else if (type == 5) {
            //有人胡牌 
            MessageManager.getInstance().messagePost(ListenerType.cp_animationPlay, { seat: pinseat, type: 5, audio: "sn_zgcp_hu" });
        }else if (type == 7) {
            //天胡
            MessageManager.getInstance().messagePost(ListenerType.cp_animationPlay, { seat: pinseat, type: 7, audio: "sn_zgcp_hu" });
        }
    }
    getCardCount(value, CardsArray) {
        let cardCount = 0
        CardsArray.forEach((card) => {
            if (value == card) {
                cardCount++
            }
        })
        return cardCount
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
        MessageManager.getInstance().messagePost(ListenerType.cp_recHuInfo, {});
        MessageManager.getInstance().disposeMsg();
    }

    // 播放慌庄动画 cp_round_over_hz
    private isRoundOverHuangZhuang(msg) {
        // 执行慌庄动画之后, 在设置结算数据setRoundOver
        MessageManager.getInstance().messagePost(ListenerType.cp_round_over_hz, msg);
        // this.setRoundOver(msg)
    }

    /**设置单局结算 */
    public setRoundOver(msg) {
        this._gameinfo.curRoundOverData = msg;
        for (var j = 0; j < msg.playerBalance.length; j++) {
            var tempSeat = this.getRealSeatByRemoteSeat(msg.playerBalance[j].chairId)
            if (this.gameinfo.rule.union) {
                this._playerInfoMap.get(tempSeat).clubScore = this._playerInfoMap.get(tempSeat).clubScore + msg.playerBalance[j].roundMoney / 100
            }
            else {
                this._playerInfoMap.get(tempSeat).clubScore = this._playerInfoMap.get(tempSeat).clubScore + msg.playerBalance[j].roundScore
            }
        }
        this._playerInfoMap.forEach((infoObj, seat) => {
            infoObj.isready = false;
            MessageManager.getInstance().messagePost(ListenerType.cp_playerStateChanged, { playerSeat: seat, state: false, type: "ready" });
        })

        this.initOverPlayerData()
        MessageManager.getInstance().messagePost(ListenerType.cp_gameRoundOver, {});
        MessageManager.getInstance().disposeMsg();
        // try {
        // }
        // catch (e) {
        //     GameManager.getInstance().handReconnect()
        // }

    }


    setOwner(msg) {
        this._gameinfo.creator = msg.newOwner;
        MessageManager.getInstance().disposeMsg();

    }

    // 收到deskenter时再次清理数据
    clearDataOnStart() {
        this._playerInfoMap.forEach((infoObj, seat) => {
            infoObj.clearCards()
            infoObj.baoTingResult = false
            infoObj.isBaoTing = false;
        })
        this.canNotOptCards = []
        this.gameinfo.curOperateId = 0;
        this.gameinfo.lastOutMjId = -1;
        this.gameinfo.lastOutPid = 0;
        this.setPGHTips(null)
        this.gameinfo.dealerId = -1;
        this.gameinfo.isTingClick = false;
        this.GameStartState = -1
        this.setOverPlusNum(0);
        this.huInfoMap.clear()
        this.setGameState(GAME_STATE_CP.PER_BEGIN)
        MessageManager.getInstance().messagePost(ListenerType.cp_tuosInfo, { tuos: [0, 0] })
        MessageManager.getInstance().messagePost(ListenerType.cp_recBaoTingResult,{});
    }

    //清理玩家一局数据
    cleanRoundOver() {
        //玩家牌数据
        this._playerInfoMap.forEach((infoObj, seat) => {
            infoObj.cards = [];
            infoObj.mjpg = [];
            infoObj.outCard = [];
            infoObj.menCard = [];
            infoObj.canOutcards = [];
            infoObj.isBaoTing = false;
            infoObj.baoTingResult = false
        })
        this.huInfoMap.clear()
        this.gameinfo.curOperateId = 0;
        this.gameinfo.lastOutMjId = -1;
        this.gameinfo.lastOutPid = 0;
        this.setPGHTips(null)
        this.gameinfo.dealerId = -1;
        this.gameinfo.isTingClick = false;
        this.GameStartState = -1
        this.setOverPlusNum(0);

        this.canNotOptCards = []

        MessageManager.getInstance().messagePost(ListenerType.cp_tuosInfo, { tuos: [0, 0] });
        MessageManager.getInstance().messagePost(ListenerType.cp_recBaoTingResult,{});
    }

    public clearDataByContinue(): void {
        this.gameinfo.curRound = 0
        this._gameinfo.curRoundOverData = null
        this._gameinfo.curGameOverData = null
        this._gameinfo.mBTableStarted = false
        this._playerInfoMap.forEach((infoObj, seat) => {
            infoObj.clubScore = 0;
            infoObj.cards = [];
            infoObj.mjpg = [];
            infoObj.outCard = [];
            infoObj.menCard = [];
            infoObj.baoTingResult = false
            infoObj.isBaoTing = false;
        })
        this.gameinfo.curOperateId = 0;
        this.gameinfo.lastOutMjId = -1;
        this.gameinfo.lastOutPid = 0;
        this.setPGHTips(null)
        this.gameinfo.dealerId = -1;
        this.gameinfo.isTingClick = false;
        MessageManager.getInstance().messagePost(ListenerType.cp_recBaoTingResult,{});
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