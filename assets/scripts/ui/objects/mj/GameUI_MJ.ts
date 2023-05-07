import { ListenerType } from './../../../data/ListenerType';
import { GameUIRepeatMsgManage } from './../../GameUIRepeatMsgManage';
import { VoteUI } from './../../VoteUI';
import { ShowRuleUI } from './../rule/ShowRuleUI';
import { GameSettingUI } from './../../GameSettingUI';
import { HallUI } from './../../HallUI';
import { GameManager } from './../../../GameManager';
import { StringData } from './../../../data/StringData';
import { GameUIController } from './../../GameUIController';
import { MJ_ACTION, GAME_TYPE, ConstValue } from './../../../data/GameConstValue';
import { GAME_STATE_MJ } from './../../../data/mj/defines';
import { BaseUI } from "../../../../framework/UI/BaseUI";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { MessageManager } from "../../../../framework/Manager/MessageManager";
import { ListenerManager } from "../../../../framework/Manager/ListenerManager";
import { Utils } from "../../../../framework/Utils/Utils";
import { GameApplyUI } from "../.././GameApplyUI";
import { AudioManager } from "../../../../framework/Manager/AudioManager";
import { ClubUI } from "../.././ClubUI";
import { ThirdSelectUI } from "../.././ThirdSelectUI";
import * as Proto from "../../../../proto/proto-min";
import MjGameOver_UI from './MjGameOver_UI';
import ZjScoreDetailPage_UI from './ZjScoreDetailPage_UI';
import ZjRoundOver_UI from './ZjRoundOver_UI';
import XzRoundOver_UI from './XzRoundOver_UI';
import ZgRoundOver_UI from './ZgRoundOver_UI';
import XzGameOver_UI from './XzGameOver_UI';
import TuoGuanUI from '../../TuoGuanUI';
import { MaajanZiGongBlanacePlayer } from '../../../../proto/proto';
import { LogWrap } from '../../../../framework/Utils/LogWrap';


const { ccclass, property } = cc._decorator;

@ccclass
export class GameUI_MJ extends BaseUI {
    protected static className = "GameUI_MJ";
    /*
    麻将的ui（通用）
    */

    @property(cc.Node)
    nodeMid: cc.Node = null;
    @property(cc.Node)
    btnThirdInvite: cc.Node = null;
    @property(cc.Node)
    btnInvite: cc.Node = null;
    @property(cc.Node)
    btnReady: cc.Node = null;
    @property([cc.SpriteFrame])
    spfGameBg: cc.SpriteFrame[] = [];
    @property([cc.SpriteFrame])
    chickSp: cc.SpriteFrame[] = [];
    @property([cc.SpriteFrame])
    huanpaiSp: cc.SpriteFrame[] = [];
    @property([cc.SpriteFrame])
    shuiyin_spf: cc.SpriteFrame[] = [];
    @property([cc.SpriteFrame])
    piaoSp: cc.SpriteFrame[] = [];
    @property(cc.Prefab)
    tip_item: cc.Prefab = null;
    @property(cc.Animation)
    nodeAnim: cc.Animation = null;
    @property(cc.Label)
    inviteTimeLabel: cc.Label = null;
    @property([cc.SpriteFrame])
    mjSpf: cc.SpriteFrame[] = [];
    @property(cc.Prefab)
    gangItem: cc.Prefab = null;
    @property(cc.Node)
    gangListContent: cc.Node = null;

    private m_mjData = null;
    private m_isAction = false // 是否正在播放动画
    private m_isOver = false
    private readonly effectPosList = [cc.v3(0, -125), cc.v3(292, 24), cc.v3(0, 174), cc.v3(-290, 24)] // 麻将pgh特效
    private m_isStartHuanPaByClient = false
    private m_isStartDingQueByClient = false
    private m_isStartPiaoFenByClient = false
    private m_isStartBaoTingByClient = false
    private m_isHpAction = false
    private m_inviteTimeout = 0
    private m_isQGH = false // 当前是不是抢杠胡状态
    private startTime = 0 // 准备倒计时
    private gangItemList = []

    private readonly mjUrlToIndex = {
        "mj_1": 0, "mj_2": 1, "mj_3": 2, "mj_4": 3, "mj_5": 4, "mj_6": 5, "mj_7": 6, "mj_8": 7, "mj_9": 8,  // 万
        "mj_11": 9, "mj_12": 10, "mj_13": 11, "mj_14": 12, "mj_15": 13, "mj_16": 14, "mj_17": 15, "mj_18": 16, "mj_19": 17,  //筒
        "mj_21": 18, "mj_22": 19, "mj_23": 20, "mj_24": 21, "mj_25": 22, "mj_26": 23, "mj_27": 24, "mj_28": 25, "mj_29": 26,  // 条
        "mj_in_0": 27, "mj_in_1": 28, "mj_in_2": 29, "mj_in_3": 30, "mj_out_0": 31, "mj_out_0_b": 32, "mj_out_1_3": 33,
        "mj_out_1_3_b": 34, "mj_out_2": 35, "mj_out_2_b": 36, "mj_pg_0": 37, "mj_pg_0_b": 38, "mj_pg_2": 39, "mj_pg_2_b": 40,
        "mj_in_0_black": 41, "mj_in_1_black": 42, "mj_in_2_black": 43, "mj_in_3_black": 44, "mj_out_1_3_black": 45,
        "mj_out_1_3_b_black": 46, "mj_out_2_black": 47, "mj_out_2_b_black": 48, "mj_pg_0_black": 49, "mj_pg_0_b_black": 50
        , "mj_pg_2_black": 51, "mj_pg_2_b_black": 52, "mj_37": 53,
    }
    private readonly shuiYinMap = { 200: 0, 201: 1, 202: 2, 203: 3, 204: 4, 205: 5, 230: 6, 350: 7, 260: 8 }

    onLoad() {

    }

    onDataRecv() {
        this.m_mjData = GameDataManager.getInstance().getDataByCurGameType();
        this.initListen()
        this.initCardControl()
        this.onGameBgChange()
        this.activeCardControl()
        this.onTimeChange()
        this.initShuiYin()
        this.setOverPlusNum();
        this.setRound();
    }

    public onEventHideRec() {
        this.unscheduleAllCallbacks() // 停止定时器
        this.node.getChildByName("node_begin").active = false
        this.node.getChildByName("node_dq").active = false
        this.node.getChildByName("game_button").active = false
        this.node.getChildByName("ganginfo").active = false
        this.node.getChildByName("btn_hp").active = false
        UIManager.getInstance().closeUI(GameApplyUI)
        UIManager.getInstance().closeUI(ZjScoreDetailPage_UI)
        UIManager.getInstance().closeUI(ZjRoundOver_UI)
        UIManager.getInstance().closeUI(XzGameOver_UI)
        UIManager.getInstance().closeUI(XzRoundOver_UI)
        UIManager.getInstance().closeUI(ZgRoundOver_UI)
        UIManager.getInstance().closeUI(MjGameOver_UI)
        UIManager.getInstance().closeUI(GameSettingUI);
        this.m_mjData = null
    }


    onShow() {
        this.m_mjData = GameDataManager.getInstance().getDataByCurGameType();
        this.initShuiYin()
        this.removeMark()
        this.setOverPlusNum();
        this.m_mjData.playerInfoMap.forEach((infoObj, seat) => {
            if (seat == 0)
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("SelfCardControl_MJ").onShow(seat)
            else
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("OtherCardCOntrol_MJ").onShow(seat)
        })
    }

    onDestroy() {
        super.onDestroy();
        this.m_mjData = null
        this.m_isOver = false
        this.m_isAction = false
        this.m_isHpAction = false
        this.m_isStartHuanPaByClient = false
        this.m_isStartDingQueByClient = false
        this.m_isStartPiaoFenByClient = false
        this.m_isStartBaoTingByClient = false
    }

    initCardControl() {
        for (let i = 0; i < 4; ++i) {
            if (i == 0) {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + i).getComponent("SelfCardControl_MJ").onDataRecv();
            }
            else {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + i).getComponent("OtherCardCOntrol_MJ").onDataRecv();
            }
        }
    }

    resetDataOnBack()// 切后台之后切回前台需要清理数据
    {
        this.m_mjData = GameDataManager.getInstance().getDataByCurGameType();
        this.initShuiYin()
        this.onGameStateChanged()
        this.startTime = 0
        this.node.getChildByName("start_time").active = false;
        this.unschedule(this.loop4)
        for (let i = 0; i < 4; ++i) {
            if (this.m_mjData.playerInfoMap.get(i))
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + i).active = true;
            else
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + i).active = false;
            if (i == 0) {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + i).getComponent("SelfCardControl_MJ").resetDataOnBack();
            }
            else {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + i).getComponent("OtherCardCOntrol_MJ").resetDataOnBack();
            }
        }
    }


    /**——————————————————————————————————初始化相关——————————————————————————————————*/

    onGameStart() {
        this.m_isOver = false
        this.m_isAction = false
        this.m_isHpAction = false
        this.m_isStartHuanPaByClient = false
        this.m_isStartDingQueByClient = false
        this.m_isStartPiaoFenByClient = false
        this.m_isStartBaoTingByClient = false
        this.mjSelfPGHTipsChange()
        this.updateMj()
        this.updateMid()
        this.clearMidTime()
        this.setOverPlusNum()
        UIManager.getInstance().closeUI(ZjScoreDetailPage_UI)
        UIManager.getInstance().closeUI(ZjRoundOver_UI)
        UIManager.getInstance().closeUI(XzGameOver_UI)
        UIManager.getInstance().closeUI(XzRoundOver_UI)
        UIManager.getInstance().closeUI(ZgRoundOver_UI)
        UIManager.getInstance().closeUI(MjGameOver_UI)
    }

    /**刷新牌数据 */
    private updateMj() {
        this.m_mjData.playerInfoMap.forEach((infoObj, seat) => {
            if (seat == 0) {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("SelfCardControl_MJ").setAll(seat)
            }
            else {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("OtherCardCOntrol_MJ").setAll(seat)
            }
        })
    }

    /**初始化监听 */
    private initListen() {
        // /*———————————————————————————————服务器消息——————————————————————————————————*/
        ListenerManager.getInstance().add(Proto.S2C_CLUBLIST_RES.MsgID.ID, this, this.onEnterClubResponse);
        ListenerManager.getInstance().add(Proto.SC_DismissTable.MsgID.ID, this, this.onRoomDissmissOver);
        ListenerManager.getInstance().add(Proto.SC_VoteTable.MsgID.ID, this, this.onVoteOver);
        ListenerManager.getInstance().add(Proto.SC_AllowHuanPai.MsgID.ID, this, this.onHpStart);
        ListenerManager.getInstance().add(Proto.SC_AllowDingQue.MsgID.ID, this, this.onDqStart);
        ListenerManager.getInstance().add(Proto.SC_AllowPiaoFen.MsgID.ID, this, this.onPfStart);
        ListenerManager.getInstance().add(Proto.SC_BaoTingInfos.MsgID.ID, this, this.onBtStart);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_INVITE_JOIN_ROOM.MsgID.ID, this, this.onInviteRec);
        ListenerManager.getInstance().add(Proto.SC_StartTimer.MsgID.ID, this, this.onStartTimeRec);
        ListenerManager.getInstance().add(Proto.SC_CancelTimer.MsgID.ID, this, this.onStartTimeCancel);
        ListenerManager.getInstance().add(Proto.SC_MaajanGetTingTilesInfo.MsgID.ID, this, this.onHuTipsRec);
        ListenerManager.getInstance().add(Proto.SC_ForceKickoutPlayer.MsgID.ID, this, this.onForceKickPlayer);

        ListenerManager.getInstance().add(ListenerType.mj_start, this, this.onGameStart);
        ListenerManager.getInstance().add(ListenerType.mj_gameState, this, this.onGameStateChanged);
        ListenerManager.getInstance().add(ListenerType.mj_pgChanged, this, this.onPgChanged);
        ListenerManager.getInstance().add(ListenerType.mj_getMj, this, this.onGetMj);
        ListenerManager.getInstance().add(ListenerType.mj_outMj, this, this.onOutMj);
        ListenerManager.getInstance().add(ListenerType.mj_PGHTipsRec, this, this.mjSelfPGHTipsChange);
        ListenerManager.getInstance().add(ListenerType.mj_curOperateChange, this, this.onCurOperateChanged);
        ListenerManager.getInstance().add(ListenerType.mj_removeMark, this, this.removeMark);
        ListenerManager.getInstance().add(ListenerType.mj_animationPlay, this, this.onAnimationPlay);
        ListenerManager.getInstance().add(ListenerType.mj_curMjSelectChanged, this, this.onCurSelectMjChanged);
        ListenerManager.getInstance().add(ListenerType.gameBgChange, this, this.onGameBgChange);
        ListenerManager.getInstance().add(ListenerType.mj_handMjChanged, this, this.onHandMjChanged);
        ListenerManager.getInstance().add(ListenerType.mj_outMjChanged, this, this.onOutMjChanged);
        ListenerManager.getInstance().add(ListenerType.mjzj_menChanged, this, this.onMenMjChanged);
        ListenerManager.getInstance().add(ListenerType.mj_gameRoundOver, this, this.onGameRoundOver);
        ListenerManager.getInstance().add(ListenerType.mj_playerNumChanged, this, this.onPlayerNumChanged);                     // 收到玩家人数改变
        ListenerManager.getInstance().add(ListenerType.mj_dismissResponse, this, this.onRoomDissmissResponse);                     // 收到解散请求
        ListenerManager.getInstance().add(ListenerType.mj_VoteResponse, this, this.onVoteResponse);
        ListenerManager.getInstance().add(ListenerType.mj_onGuoActionRec, this, this.onGuoActionRec);                     // 收到解散请求

        ListenerManager.getInstance().add(ListenerType.mjzj_chickAction, this, this.onChickActionRec);
        ListenerManager.getInstance().add(ListenerType.operateTimeChange, this, this.onTimeChange);
        // ListenerManager.getInstance().add(ListenerType.mj_huPaiTipsDisPlay, this, this.onCheckButtonDisPlay);
        ListenerManager.getInstance().add(ListenerType.mj_playerStateChanged, this, this.onPlayerStateChanged);                 // 收到玩家游戏状态改变
        ListenerManager.getInstance().add(ListenerType.mjzj_onMyGuMai, this, this.onMyGuMai);                 // 收到玩家游戏状态改变
        ListenerManager.getInstance().add(ListenerType.mjzj_guMaiScoreChange, this, this.onGuMaiScoreChange);                                 // 玩家ting了
        ListenerManager.getInstance().add(ListenerType.cardBgChange, this, this.onCardBgChange);
        ListenerManager.getInstance().add(ListenerType.mj_curOverPlusChange, this, this.onLeftMjNumChanged)
        ListenerManager.getInstance().add(ListenerType.mj_curRoundChange, this, this.setRound);

        //---------------------------血战消息-------------------------  
        if (Utils.isXzmj(GameDataManager.getInstance().curGameType)) {
            ListenerManager.getInstance().add(ListenerType.mjxz_hpStatusChanged, this, this.hpStatusChanged);
            ListenerManager.getInstance().add(ListenerType.mjxz_dqStatusChanged, this, this.dqStatusChanged);
            ListenerManager.getInstance().add(ListenerType.mjxz_recHpResult, this, this.recHpResult);
            ListenerManager.getInstance().add(ListenerType.mjxz_recHuInfo, this, this.recHuInfo);
            ListenerManager.getInstance().add(ListenerType.mjxz_recDqResult, this, this.recDqResult);
            ListenerManager.getInstance().add(ListenerType.mjxz_recBaoTingResult, this, this.recBaoTingResult);
            ListenerManager.getInstance().add(ListenerType.mjxz_piaoStatusChanged, this, this.piaoStatusChanged);
            ListenerManager.getInstance().add(ListenerType.mjxz_recPiaoResult, this, this.recPiaoResult);
            ListenerManager.getInstance().add(ListenerType.mjxz_BaotingStatusChanged, this, this.baoTingStatusChanged);
        }
    }

    // 飘分开始
    private onPfStart() {
        this.m_mjData._gameinfo.mBTableStarted = true
        if (!this.m_mjData) {
            MessageManager.getInstance().disposeMsg();
            return
        }
        this.m_isStartPiaoFenByClient = true
        if (this.m_isHpAction) // 如果还在播放动画就先等待
        {
            MessageManager.getInstance().disposeMsg();
            return            
        }    
        this.updateViewPiaoFen()
        this.m_mjData.setGameState(GAME_STATE_MJ.PIAO_FEN);
        MessageManager.getInstance().messagePost(ListenerType.mjxz_piaoStatusChanged, {});
        MessageManager.getInstance().disposeMsg();
    }
    private onBtStart(msg: any) {
        this.m_mjData._gameinfo.mBTableStarted = true
        if (!this.m_mjData) {
            MessageManager.getInstance().disposeMsg();
            return
        }
        this.m_isStartBaoTingByClient = true
        if (this.m_isHpAction) // 如果还在播放动画就先等待
        {
            MessageManager.getInstance().disposeMsg();
            return
        }
        this.m_mjData.playerInfoMap.get(0).canBaoTing = msg.canbaoting
        if (msg.canbaoting && msg.ting) {
            let canOutCards = [];
            msg.ting.forEach((element) => {
                canOutCards.push(element.discard)
            })
            this.m_mjData.playerInfoMap.get(0).canOutcards = canOutCards
        }

        //如果自己已经选择报听或者过了 说明此消息是重连补发的消息 只需要保存canOutCards就可以了
        if (this.m_mjData.playerInfoMap.get(0).isBaoTing) {
            //如果自己选择了报听 并且是庄家的时候第一次出牌的时候有限制  只能打服务器下发限制的牌
            let playerID = this.m_mjData.playerInfoMap.get(0).id
            if (this.m_mjData.playerInfoMap.get(0).baoTingResult
            && this.m_mjData.gameinfo.gameState > GAME_STATE_MJ.PER_BEGIN && this.m_mjData.gameinfo.gameState < GAME_STATE_MJ.GAME_BALANCE) 
            {
                this.node.getChildByName("node_cardsMgr").getChildByName("player0").getComponent("SelfCardControl_MJ").updateMjColorByBaoTing()
            }
            MessageManager.getInstance().disposeMsg();         
            return
        }
        this.updateViewBaoTing()
        this.m_mjData.setGameState(GAME_STATE_MJ.BAO_TING);
        MessageManager.getInstance().messagePost(ListenerType.mjxz_BaotingStatusChanged, {});
        MessageManager.getInstance().disposeMsg();
    }
    private piaoStatusChanged() {
        if (!this.m_mjData.playerInfoMap.get(0) || this.m_mjData.gameinfo.gameState != GAME_STATE_MJ.PIAO_FEN) {
            this.node.getChildByName("node_piao").active = false
            return
        }
        if (this.m_mjData.playerInfoMap.get(0).isPiao)
            this.node.getChildByName("node_piao").active = false
    }
    private baoTingStatusChanged() {
        if (!this.m_mjData.playerInfoMap.get(0) || (this.m_mjData.gameinfo.gameState > GAME_STATE_MJ.PER_BEGIN
            && this.m_mjData.gameinfo.gameState < GAME_STATE_MJ.GAME_BALANCE)) {
            //已经过了这个阶段 说明玩家都已经操作了
            //this.m_mjData.playerInfoMap.get(0).isBaoTing = true
            this.node.getChildByName("node_baoTing").active = false
            return
        }
        if (this.m_mjData.playerInfoMap.get(0).isBaoTing)
            this.node.getChildByName("node_baoTing").active = false
    }
    private recPiaoResult(msg) {
        this.node.getChildByName("node_piao").active = false
    }

    private updateMid() {
        if (this.m_mjData.gameinfo.curOperateId != 0)
            this.onCurOperateChanged({ id: this.m_mjData.gameinfo.curOperateId })
        else {
            let children = this.nodeMid.getChildByName("sp_mid_bg").children;
            for (let i = 0; i < children.length; i++) {
                children[i].active = false;
            }
        }
    }

    private clearMidTime() {
        var labelMidTime = this.node.getChildByName("mid_info").getChildByName("label_time").getComponent(cc.Label)
        labelMidTime.string = "";
        labelMidTime.node.active = false;
        this.unschedule(this.loop);
    }

    private onEnterClubResponse(msg: any) {
        GameDataManager.getInstance().clubData = msg.clubs;
        //发完消息转场
        var uiType = parseInt(cc.sys.localStorage.getItem("curClubType"));
        UIManager.getInstance().openUI(ClubUI, 0, () => {
            GameUIController.getInstance().closeCurGameUI()
            UIManager.getInstance().closeUI(GameApplyUI)
            UIManager.getInstance().closeUI(ZjScoreDetailPage_UI)
            UIManager.getInstance().closeUI(ZjRoundOver_UI)
            UIManager.getInstance().closeUI(XzGameOver_UI)
            UIManager.getInstance().closeUI(XzRoundOver_UI)
            UIManager.getInstance().closeUI(ZgRoundOver_UI)
            UIManager.getInstance().closeUI(MjGameOver_UI)
            UIManager.getInstance().closeUI(TuoGuanUI)
            UIManager.getInstance().getUI(ClubUI).getComponent("ClubUI").setOpenType(uiType);
            MessageManager.getInstance().disposeMsg();
        });
    }

    private onRoomDissmissResponse(msg) {
        UIManager.getInstance().openUI(GameApplyUI, 30,);
    }

    private onVoteResponse(msg) {
        UIManager.getInstance().openUI(VoteUI, 30,);
    }

    private onRoomDissmissOver(msg: any) {
        if (UIManager.getInstance().getUI(GameApplyUI) != null) {
            UIManager.getInstance().closeUI(GameApplyUI)
        }
        else {
            if (this.m_mjData && this.m_mjData.gameinfo && this.m_mjData.gameinfo.curRoundOverData != null) {
                MessageManager.getInstance().disposeMsg();
                return
            }
        }
        if (this.m_mjData && this.m_mjData.gameinfo && this.m_mjData.gameinfo.curGameOverData != null) { // 如果解散的时候有总结算数据，关闭界面之后弹出总结算
            GameManager.getInstance().openWeakTipsUI(StringData.getString(10036))
            this.m_mjData.gameinfo.isDismissed = true
            this.m_mjData.setGameState(GAME_STATE_MJ.GAME_CLOSE);
            MessageManager.getInstance().disposeMsg();
            return
        }
        if (msg.success) {
            var uiType = -1
            GameManager.getInstance().openWeakTipsUI(StringData.getString(10036))
            if (this.m_mjData && this.m_mjData.gameinfo && !this.m_mjData.gameinfo.clubId)
                uiType = -1
            else
                uiType = parseInt(cc.sys.localStorage.getItem("curClubType"));
            if (uiType != -1) {
                MessageManager.getInstance().messageSend(Proto.C2S_CLUBLIST_REQ.MsgID.ID, { type: uiType });
            }
            else
                UIManager.getInstance().openUI(HallUI, 1, () => {
                    GameUIController.getInstance().closeCurGameUI()
                    UIManager.getInstance().closeUI(ZjScoreDetailPage_UI)
                    UIManager.getInstance().closeUI(ZjRoundOver_UI)
                    UIManager.getInstance().closeUI(MjGameOver_UI)
                    UIManager.getInstance().closeUI(XzRoundOver_UI)
                    UIManager.getInstance().closeUI(ZgRoundOver_UI)
                    UIManager.getInstance().closeUI(XzGameOver_UI)
                    UIManager.getInstance().closeUI(TuoGuanUI)
                    MessageManager.getInstance().disposeMsg();
                });

        }
        MessageManager.getInstance().disposeMsg();
    }

    private onVoteOver(msg) {
        UIManager.getInstance().closeUI(VoteUI)
        MessageManager.getInstance().disposeMsg();

    }

    private onPlayerNumChanged(msg) {
        if (msg.tag == "remove") {
            // 自己离开房间
            if (msg.playerSeat == 0) {

                var uiType = -1
                if (!this.m_mjData.gameinfo.clubId)
                    uiType = -1
                else
                    uiType = parseInt(cc.sys.localStorage.getItem("curClubType"));
                if (uiType != -1) {
                    MessageManager.getInstance().messageSend(Proto.C2S_CLUBLIST_REQ.MsgID.ID, { type: uiType });
                }
                else
                    UIManager.getInstance().openUI(HallUI, 1, () => {
                        GameUIController.getInstance().closeCurGameUI()
                        UIManager.getInstance().closeUI(GameApplyUI)
                        UIManager.getInstance().closeUI(ZjScoreDetailPage_UI)
                        UIManager.getInstance().closeUI(MjGameOver_UI)
                        UIManager.getInstance().closeUI(XzRoundOver_UI)
                        UIManager.getInstance().closeUI(ZgRoundOver_UI)
                        UIManager.getInstance().closeUI(XzGameOver_UI)
                        UIManager.getInstance().closeUI(TuoGuanUI)
                        MessageManager.getInstance().disposeMsg();
                    });

            }
            else
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + msg.playerSeat).active = false
        }
        else {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + msg.playerSeat).active = true
        }
        this.btnInvite.active = this.m_mjData.playerInfoMap.size != this.m_mjData.getCurTypePlayerNum();
        this.btnThirdInvite.active = false;
        // if (this.m_mjData.gameinfo.clubId != 0 && this.m_mjData.playerInfoMap.size != this.m_mjData.getCurTypePlayerNum())
        //     this.btnThirdInvite.active = true;
        // else
        //     this.btnThirdInvite.active = false;
    }

    private onPlayerStateChanged(msg) {
        // 如果是本人准备
        if (msg.type == "ready") {
            this.btnReady.active = !this.m_mjData.playerInfoMap.get(0).isready;
            // this.checkFastGameButton() // 每当有一个准备状态发生改变都需要进行一遍检测
        }

    }

    /**手牌变化 */
    private onHandMjChanged(msg) {
        var seat = this.m_mjData.getSeatById(msg.id);
        if (seat == 0) {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("SelfCardControl_MJ").handMjChange(seat);
        }
        else {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("OtherCardCOntrol_MJ").handMjChange(seat);
        }
    }

    /**出牌变化 */
    private onOutMjChanged(msg) {
        var seat = this.m_mjData.getSeatById(msg.id);
        if (seat == 0) {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("SelfCardControl_MJ").outMjChange(seat);
        }
        else {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("OtherCardCOntrol_MJ").outMjChange(seat);
        }
    }

    /**出牌变化 */
    private onMenMjChanged(msg) {
        var seat = this.m_mjData.getSeatById(msg.id);
        if (seat == 0) {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("SelfCardControl_MJ").menArrayChange(seat);
        }
        else {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("OtherCardCOntrol_MJ").menArrayChange(seat);
        }
    }

    /**碰杠牌变化 */
    private onPgChanged(msg) {
        var seat = this.m_mjData.getSeatById(msg.id);
        if (seat == 0) {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("SelfCardControl_MJ").pgMjChange(seat);
        }
        else {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("OtherCardCOntrol_MJ").pgMjChange(seat);
        }
    }

    private onLeftMjNumChanged(msg) {
        this.setOverPlusNum()
    }

    /**剩余牌数 */
    private setOverPlusNum(num?) {
        if (this.m_mjData.gameinfo == null || this.m_mjData.gameinfo.gameState == GAME_STATE_MJ.PER_BEGIN)
            return
        var leftNumNode = this.node.getChildByName("sp_card_num").getChildByName("label_card_num").getComponent(cc.Label)

        if (num) {
            this.node.getChildByName("sp_card_num").active = true;
            this.node.getChildByName("sp_round").active = true;
            leftNumNode.string = "剩 " + num + " 张";
        }
        else {
            if (this.m_mjData.gameinfo.curOverplus > 0) {
                this.node.getChildByName("sp_card_num").active = true;
                this.node.getChildByName("sp_round").active = true;
                leftNumNode.string = "剩 " + this.m_mjData.gameinfo.curOverplus + " 张";
            }
            else {
                this.node.getChildByName("sp_card_num").active = false;
                this.node.getChildByName("sp_round").active = false;
            }
        }
    }

    //设置局数
    private setRound() {
        if (this.m_mjData == null)
            return
        var curRule = this.m_mjData.gameinfo.rule
        LogWrap.log("GameDataManager.getInstance().curGameType:",GameDataManager.getInstance().curGameType)
        var list = [8, 16];
        if (GameDataManager.getInstance().curGameType == GAME_TYPE.ZGMJ) {
            list = [4, 6, 10, 16]
        }else if ((GameDataManager.getInstance().curGameType >= GAME_TYPE.XZMJ && GameDataManager.getInstance().curGameType < GAME_TYPE.LRPDK)
            || GameDataManager.getInstance().curGameType >= GAME_TYPE.YJMJ) {
            list = [4, 8, 16]
        }
        
        var ruleJuShu = list[curRule.round.option];
        var roundNode = this.node.getChildByName("sp_round").getChildByName("label_round").getComponent(cc.Label)
        roundNode.string = "第" + this.m_mjData.gameinfo.curRound + "/" + ruleJuShu + "局";
    }

    /**删除提示 */
    private removeMark() {
        this.m_mjData.playerInfoMap.forEach((infoObj, seat) => {
            if (seat == 0) {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("SelfCardControl_MJ").removeMark();
            }
            else {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("OtherCardCOntrol_MJ").removeMark();
            }
        })
    }

    private onGameRoundOver() {
        this.m_isOver = true
        if (this.m_isAction)
            return
        var curGameType = GameDataManager.getInstance().curGameType
        this.node.getChildByName("node_cardsMgr").getChildByName("player" + 0).getComponent("SelfCardControl_MJ").hideGray();
        if (curGameType == GAME_TYPE.LFMJ || curGameType == GAME_TYPE.MHXL) {
            UIManager.getInstance().openUI(ZjScoreDetailPage_UI, 20, () => {
                UIManager.getInstance().getUI(ZjScoreDetailPage_UI).getComponent("ZjScoreDetailPage_UI").commonInitView();
                this.removEffect();
            })
        }
        else if (curGameType == GAME_TYPE.ZGMJ) {
           let _gameData = GameDataManager.getInstance().getDataByCurGameType()
           var info = _gameData.gameinfo.curRoundOverData;
           if (info.luobos != undefined && info.luobos.length > 0) {
                let luoBo_pai = this.node.getChildByName("luobo")
                luoBo_pai.active = true
                luoBo_pai.scaleX = 0
                luoBo_pai.runAction(cc.scaleTo(0.1,1,1))
                this.node.stopAllActions()
                this.node.runAction(cc.sequence(cc.delayTime(0.1),cc.callFunc(()=>{
                    this.showLuoBoPai(info.luobos)
                    this.showLuoBoValue(info.playerBalance)
                }),cc.delayTime(3),cc.callFunc(()=>{
                    this.hideLuobo();
                    this.openZgRoundOverUI()
                })))
            }else{
                this.openZgRoundOverUI()
            }
            
           
        }
        else if (Utils.isXzmj(curGameType)) {
            UIManager.getInstance().openUI(XzRoundOver_UI, 20, () => {
                UIManager.getInstance().getUI(XzRoundOver_UI).getComponent("XzRoundOver_UI").iniView()
            })
        }
    }

    private showLuoBoValue(msg:Array<MaajanZiGongBlanacePlayer>)
    {
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
        var oRule = gameData.gameinfo.rule
        let isUnion = false
        if (oRule.union)
        {
            isUnion = true
        } 
       
        for(let i = 0;i < msg.length;i++)
        {
            var seat = this.m_mjData.getRealSeatByRemoteSeat(msg[i].chairId);
            if (seat == 0) {
                let score = msg[i].roundScore
                if(isUnion)
                {
                    score = msg[i].roundMoney
                }
                if(score < 0)
                {

                }else{
                    this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("SelfCardControl_MJ").luoboActiveValue(msg[i].luoboCount);
                }
               
            }
            // else {
            //     this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("OtherCardCOntrol_MJ").luoboActiveValue(msg[i].luoboCount);
            // }
        }
       
    }

    //显示萝卜牌的麻将值
    private showLuoBoPai(mapais) {
        let luoBo_pai = this.node.getChildByName("luobo")
        luoBo_pai.active = true
        for (let i = 0; i < mapais.length; ++i) {
            let mjNode = luoBo_pai.getChildByName("mj_" + i)
            if (mapais[i].pai > 0) {
                Utils.loadTextureFromLocal(mjNode.getChildByName("sp").getComponent(cc.Sprite),
                    "/card_mj/mj_" + mapais[i].pai, function () { mjNode.active = true; });
            }
            else {
                mjNode.active = false;
            }
        }
        
    }

    private hideLuobo()
    {
        let luoBo_pai = this.node.getChildByName("luobo")
        luoBo_pai.active = true
        for (let i = 0; i < 2; ++i) {
            let mjNode = luoBo_pai.getChildByName("mj_" + i)
            mjNode.active = false;
        }
        luoBo_pai.active = false
        for(let i = 0;i<4;i++)
        {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + i).getChildByName("luobo").active = false
        }
        
    }

    private openZgRoundOverUI()
    {
        UIManager.getInstance().openUI(ZgRoundOver_UI, 20, () => {
            UIManager.getInstance().getUI(ZgRoundOver_UI).getComponent("ZgRoundOver_UI").iniView()
        })
    }

    private onMyGuMai(msg) {
        this.node.getChildByName("node_gu_mai").active = true;
    }

    private onGuMaiScoreChange(msg) {
        var seat = this.m_mjData.getSeatById(msg.id);
        if (seat == 0 && this.m_mjData.playerInfoMap.get(seat).guMaiScore >= 0)
            this.node.getChildByName("node_gu_mai").active = false
    }

    /**游戏状态改变 */
    private onGameStateChanged() {
        if (this.m_mjData.gameinfo.gameState == GAME_STATE_MJ.PER_BEGIN || this.m_mjData.gameinfo.gameState == 0) {
            if (this.m_mjData.playerInfoMap.get(0) == undefined)
                return;
            this.hideLuobo()
            this.node.getChildByName("node_begin").active = true
            this.node.getChildByName("node_hp").active = false
            this.node.getChildByName("node_dq").active = false
            this.node.getChildByName("node_piao").active = false
            this.node.getChildByName("node_baoTing").active = false
            this.node.getChildByName("node_gu_mai").active = false
            this.node.getChildByName("check_button").active = false
            this.inviteTimeLabel.string = "一键邀请"
            this.node.getChildByName("node_begin").getChildByName("btn_club_invite").getComponent(cc.Button).interactable = true;
            this.btnThirdInvite.active = false;
            if (this.m_mjData.gameinfo.mBTableStarted) {
                this.btnInvite.active = false;
            }
            else {
                this.nodeMid.active = false;
                this.btnInvite.active = this.m_mjData.playerInfoMap.size != this.m_mjData.getCurTypePlayerNum();
                // this.btnThirdInvite.active = false
                // if (this.m_mjData.gameinfo.clubId != 0 && this.m_mjData.playerInfoMap.size != this.m_mjData.getCurTypePlayerNum())
                //     this.btnThirdInvite.active = true;
            }
            this.btnReady.active = !this.m_mjData.playerInfoMap.get(0).isready;
            this.node.getChildByName("check_button").active = false;
            let children = this.nodeMid.getChildByName("sp_mid_bg").children;
            for (let i = 0; i < children.length; i++) {
                children[i].stopAllActions()
                children[i].active = true;
            }
            this.removEffect();
            this.node.getChildByName("node_cardsMgr").active = false
            this.checkAutoReady() // 检测是否需要自动准备
            // this.checkFastGameButton()
            this.updateMid()
        }
        else if (this.m_mjData.gameinfo.gameState == GAME_STATE_MJ.GU_MAI) {
            this.node.getChildByName("node_begin").active = false
            this.node.getChildByName("node_hp").active = false
            this.node.getChildByName("node_dq").active = false
            this.node.getChildByName("node_piao").active = false
            this.node.getChildByName("node_baoTing").active = false
            this.node.getChildByName("node_cardsMgr").active = false
            this.node.getChildByName("check_button").active = false;
            this.node.getChildByName("node_gu_mai").active = false
            this.removEffect();

        }
        else if (this.m_mjData.gameinfo.gameState == GAME_STATE_MJ.GAME_BALANCE) {
            this.nodeMid.active = false;
            this.node.getChildByName("node_begin").active = false
            this.node.getChildByName("check_button").active = false;
            this.node.getChildByName("layer_listen_tips").active = false;
            this.node.getChildByName("node_gu_mai").active = false

        }
        else if (this.m_mjData.gameinfo.gameState == GAME_STATE_MJ.GAME_CLOSE) {
            var curGameType = GameDataManager.getInstance().curGameType
            if (Utils.isXzmj(curGameType)) {
                UIManager.getInstance().openUI(XzGameOver_UI, 20, () => {
                    UIManager.getInstance().closeUI(GameSettingUI);
                    UIManager.getInstance().closeUI(ShowRuleUI);
                })
            }
            else {
                UIManager.getInstance().openUI(MjGameOver_UI, 20, () => {
                    UIManager.getInstance().closeUI(ZjScoreDetailPage_UI);
                    UIManager.getInstance().closeUI(GameSettingUI);
                    UIManager.getInstance().closeUI(ShowRuleUI);
                })
            }
        }
        else if (this.m_mjData.gameinfo.gameState > GAME_STATE_MJ.PER_BEGIN && this.m_mjData.gameinfo.gameState <= GAME_STATE_MJ.DING_QUE) {
            this.nodeMid.active = true;
            this.node.getChildByName("node_begin").active = false
            this.node.getChildByName("node_cardsMgr").active = true
            this.node.getChildByName("node_gu_mai").active = false
            var curGameType = GameDataManager.getInstance().curGameType
            if (this.m_mjData.gameinfo.rule.play.hu_tips)
                this.node.getChildByName("check_button").active = true
            this.m_mjData.playerInfoMap.forEach((infoObj, seat) => {
                if (infoObj != null) {
                    this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).active = true
                }
            })
            if (this.m_mjData.gameinfo.gameState == GAME_STATE_MJ.WAIT_QIANG_GANG_HU) // 抢杠胡状态
            {
                this.m_isQGH = true
            }
        }

        if (this.m_mjData.gameinfo.gameState == GAME_STATE_MJ.HUAN_PAI) {
            if (this.m_isStartHuanPaByClient)
                return
            this.updateViewHuanPai()
            this.node.getChildByName("node_cardsMgr").getChildByName("player0").getComponent("SelfCardControl_MJ").autoHpTips()

        }

        if (this.m_mjData.gameinfo.gameState == GAME_STATE_MJ.DING_QUE) {
            if (this.m_isStartDingQueByClient)
                return
            if (!this.m_mjData.playerInfoMap.get(0).exchanged)
                this.updateViewDingQue()
        }

        if (this.m_mjData.gameinfo.gameState == GAME_STATE_MJ.PIAO_FEN) {
            if (this.m_isStartPiaoFenByClient)
                return
            if (!this.m_mjData.playerInfoMap.get(0).exchanged)
                this.updateViewPiaoFen()
        }

        if (this.m_mjData.gameinfo.gameState == GAME_STATE_MJ.BAO_TING) {
            this.nodeMid.active = true;
            this.node.getChildByName("node_begin").active = false
            this.node.getChildByName("node_cardsMgr").active = true
            this.node.getChildByName("node_gu_mai").active = false
            var curGameType = GameDataManager.getInstance().curGameType
            if (this.m_mjData.gameinfo.rule.play.hu_tips)
                this.node.getChildByName("check_button").active = true
            this.m_mjData.playerInfoMap.forEach((infoObj, seat) => {
                if (infoObj != null) {
                    this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).active = true
                }
            })
            if (this.m_isStartBaoTingByClient)
                return
            if (!this.m_mjData.playerInfoMap.get(0).exchanged)
                this.updateViewBaoTing()
        }

    }

    updateViewPiaoFen() {
        if (this.m_mjData == null)
            return
        this.node.getChildByName("btn_hp").active = false
        this.node.getChildByName("node_piao").active = true
    }
    updateViewBaoTing() {
        if (this.m_mjData == null)
            return
        this.node.getChildByName("btn_hp").active = false
        this.node.getChildByName("node_piao").active = false
        this.node.getChildByName("node_baoTing").active = true
        cc.find("node_baoTing/btn_baoTing", this.node).getComponent(cc.Button).interactable = (this.m_mjData.playerInfoMap.get(0).canBaoTing > 0)
    }
    private checkAutoReady() {
        if (UIManager.getInstance().getUI(TuoGuanUI))
            return
        var curGameType = GameDataManager.getInstance().curGameType
        if (Utils.isXzmj(curGameType) || curGameType == GAME_TYPE.MHXL || curGameType == GAME_TYPE.LFMJ) {
            var isAutoReady = false
            if (!this.m_mjData.playerInfoMap.get(0).isready && this.m_mjData.gameinfo.rule.option && !this.m_mjData.gameinfo.rule.option.hand_ready)
                isAutoReady = true
            else if (this.m_mjData.gameinfo.rule.trustee)// 存在托管时
            {
                // 全托管，半托管时，除开第一局需要手动准备，其它时候需要自动准备
                if ((this.m_mjData.gameinfo.rule.trustee.type_opt == 0 || this.m_mjData.gameinfo.rule.trustee.type_opt == 1) && this.m_mjData.gameinfo.curRound >= 1)
                    isAutoReady = true
            }

            if (isAutoReady)
                MessageManager.getInstance().messageSend(Proto.CS_Ready.MsgID.ID, {});
        }

    }


    // 快速开始按钮显隐
    private checkFastGameButton() {
        this.node.getChildByName("node_begin").getChildByName("btn_fastGame").active = false
        return
        // if (GameDataManager.getInstance().curGameType != GAME_TYPE.XZMJ)
        // {
        //     this.node.getChildByName("node_begin").getChildByName("btn_fastGame").active = false
        //     return
        // }
        // var readyNum = 0
        // this.m_mjData.playerInfoMap.forEach((infoObj, seat)=>{
        //     if (infoObj && infoObj.isready)
        //         readyNum += 1
        // })
        // if (this.m_mjData.gameinfo.curRound == 0 && this.m_mjData.playerInfoMap.size < 4 && this.m_mjData.playerInfoMap.size > 1 && readyNum >= 2 && readyNum == this.m_mjData.playerInfoMap.size) // 第零局才显示
        //     this.node.getChildByName("node_begin").getChildByName("btn_fastGame").active = true
        // else
        //     this.node.getChildByName("node_begin").getChildByName("btn_fastGame").active = false
    }


    /**显示状态按钮 */
    private mjSelfPGHTipsChange() {
        if (this.m_mjData.gameinfo.state.size == 0) {
            this.node.getChildByName("game_button").active = false;
            this.node.getChildByName("ganginfo").active = false;
            return
        }
        if (Utils.isXzmj(GameDataManager.getInstance().curGameType)) {
            var info = this.m_mjData.huInfoMap.get(0) //已经胡牌后不进行此操作
            if (info)
                return
        }
        this.node.getChildByName("game_button").active = true;
        this.node.getChildByName("game_button").getChildByName("btn_guo").active = true;
        this.node.getChildByName("ganginfo").active = false;
        this.node.getChildByName("node_cardsMgr").getChildByName("player" + 0).getComponent("SelfCardControl_MJ").setCanOperate(false);

        var count = 1;
        if (this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_TING)) {
            this.node.getChildByName("game_button").getChildByName("btn_ting").active = true;
            this.node.getChildByName("game_button").getChildByName("btn_ting").position = cc.v3(-220 * count, 0);
            count += 1;
        }
        else
            this.node.getChildByName("game_button").getChildByName("btn_ting").active = false;


        if (this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_PENG) || this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_RUAN_PENG)) {
            this.node.getChildByName("game_button").getChildByName("btn_peng").active = true;
            this.node.getChildByName("game_button").getChildByName("btn_peng").position = cc.v3(-220 * count, 0);
            count += 1;
        }
        else
            this.node.getChildByName("game_button").getChildByName("btn_peng").active = false;

        if (this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_AN_GANG) || this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_MING_GANG) || this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_BA_GANG)
            || this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_FREE_BA_GANG) || this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_FREE_AN_GANG)
            || this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_RUAN_AN_GANG) || this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_RUAN_MING_GANG)
            || this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_RUAN_BA_GANG)) {
            this.node.getChildByName("game_button").getChildByName("btn_gang").active = true;
            this.node.getChildByName("game_button").getChildByName("btn_gang").position = cc.v3(-220 * count, 0);
            count += 1;
        }
        else
            this.node.getChildByName("game_button").getChildByName("btn_gang").active = false;

        if (this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_HU) || this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_ZI_MO) || this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_QIANG_GANG_HU)) {
            this.node.getChildByName("game_button").getChildByName("btn_hu").active = true;
            this.node.getChildByName("game_button").getChildByName("btn_hu").position = cc.v3(-220 * count, 0);
            count += 1;
            if (this.m_mjData.playerInfoMap.get(0).baoTingResult) {
                this.node.getChildByName("game_button").getChildByName("btn_guo").active = false
            }
        }
        else
            this.node.getChildByName("game_button").getChildByName("btn_hu").active = false;

        if (this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_MEN) || this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_MEN_ZI_MO)) {
            this.node.getChildByName("game_button").getChildByName("btn_men").active = true;
            this.node.getChildByName("game_button").getChildByName("btn_men").position = cc.v3(-220 * count, 0);
            count += 1;
        }
        else
            this.node.getChildByName("game_button").getChildByName("btn_men").active = false;
        if (this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_GANG_HUAN_PAI)) {
            this.node.getChildByName("game_button").getChildByName("btn_huan").active = true;
            this.node.getChildByName("game_button").getChildByName("btn_huan").position = cc.v3(-220 * count, 0);
            count += 1;
        }
        else
            this.node.getChildByName("game_button").getChildByName("btn_huan").active = false;
    }

    /**摸牌本地回调 播放动画 */
    private onGetMj(msg) {
        var seat = this.m_mjData.getSeatById(msg.id);
        if (seat == 0) {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("SelfCardControl_MJ").getMj(msg);
        }
        else {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("OtherCardCOntrol_MJ").getMj(msg);
        }
    }

    /**出牌本地回调 播放动画 */
    private onOutMj(msg) {
        var seat = this.m_mjData.getSeatById(msg.id);
        if (msg.outMjId != null && msg.outMjId > 0) {
            AudioManager.getInstance().playSFX("outmj")
            var path = "man"
            if (this.m_mjData.playerInfoMap.get(seat).sex == 1) {
                path = "man"
            }
            else {
                path = "woman"
            }
            if (Utils.isXzmj(GameDataManager.getInstance().curGameType)) {
                var vocieType = cc.sys.localStorage.getItem("xzmj_voice")
                if (vocieType && vocieType == "2")
                    path += "_sc"
            }
            AudioManager.getInstance().playSFX(path + "/sound_mj_" + msg.outMjId)

        }
        this.m_mjData.playerInfoMap.forEach((infoObj, tempSeat) => {
            if (seat != tempSeat) {
                if (tempSeat == 0)
                    this.node.getChildByName("node_cardsMgr").getChildByName("player" + tempSeat).getComponent("SelfCardControl_MJ").removeMark()
                else
                    this.node.getChildByName("node_cardsMgr").getChildByName("player" + tempSeat).getComponent("OtherCardCOntrol_MJ").removeMark()
            }
        })

        if (seat == 0) {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("SelfCardControl_MJ").outMj(msg);
        }
        else {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("OtherCardCOntrol_MJ").outMj(msg);
        }
    }

    /**当前操作人改变 */
    onCurOperateChanged(msg) {
        var curseat = this.m_mjData.getSeatById(msg.id);
        //调整箭头的方向
        let children = this.nodeMid.getChildByName("sp_mid_bg").children;
        for (let i = 0; i < children.length; i++) {
            children[i].active = false;
        }
        var midChildNode = this.nodeMid.getChildByName("sp_mid_bg").getChildByName("sp_" + curseat)
        midChildNode.active = true;
        midChildNode.stopAllActions();
        var action = cc.repeatForever(cc.blink(1, 1))
        midChildNode.runAction(action)
        if (this.m_isQGH) {
            this.m_isQGH = false
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + 0).getComponent("SelfCardControl_MJ").setCanOperate(false);
            return
        }
        this.node.getChildByName("node_cardsMgr").getChildByName("player" + 0).getComponent("SelfCardControl_MJ").setCanOperate(curseat == 0);
    }

    private onCurSelectMjChanged() {
        //出牌提示
        if (this.m_mjData.gameinfo.curSelectMj == null) {
            this.node.getChildByName("layer_listen_tips").active = false;
            this.m_mjData.playerInfoMap.forEach((infoObj, seat) => {
                if (seat == 0) {
                    this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("SelfCardControl_MJ").resetCardColor()
                }
                else {
                    this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("OtherCardCOntrol_MJ").resetCardColor()
                }
            })
            return;
        }

        this.m_mjData.playerInfoMap.forEach((infoObj, seat) => {
            if (seat == 0) {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("SelfCardControl_MJ").displaySelectCardInDesk(this.m_mjData.gameinfo.curSelectMj.attr)
            }
            else {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("OtherCardCOntrol_MJ").displaySelectCardInDesk(this.m_mjData.gameinfo.curSelectMj.attr)
            }
        })

        var isshow = false;
        if (this.m_mjData.gameinfo.curJiao.length != 0)
            isshow = true;
        if (isshow) {
            var jiaoArray = [];
            for (var i = 0; i < this.m_mjData.gameinfo.curJiao.length; ++i) {
                if (this.m_mjData.gameinfo.curJiao[i].discard === this.m_mjData.gameinfo.curSelectMj.attr) {
                    jiaoArray = this.m_mjData.gameinfo.curJiao[i].tiles;
                    break;
                }
            }
            if (jiaoArray.length == 0) {
                this.node.getChildByName("layer_listen_tips").active = false;
                return;
            }
            this.initTipsShow(this.node.getChildByName("layer_listen_tips"), jiaoArray);
        }
    }

    private onGameBgChange() {

        var bgid = cc.sys.localStorage.getItem("mjBgId");
        if (bgid === undefined || bgid === null || bgid >= this.spfGameBg.length)
            bgid = 0;
        this.node.getChildByName("sp_game_tdh_bg").getComponent(cc.Sprite).spriteFrame = this.spfGameBg[bgid];
    }

    // onCheckButtonDisPlay()
    // {
    //     if (this.m_mjData.gameinfo.curMjTips != null)
    //         this.node.getChildByName("check_button").active = true;
    //     else
    //         this.node.getChildByName("check_button").active = false;
    // }

    private initShuiYin() {

        var curGameType = GameDataManager.getInstance().curGameType
        var shuiYinIdx = this.shuiYinMap[curGameType]
        if (typeof shuiYinIdx != "number")
            return
        this.node.getChildByName("shuiyin").getComponent(cc.Sprite).spriteFrame = this.shuiyin_spf[shuiYinIdx]
        this.node.getChildByName("shuiyin").active = true
    }

    /**时间改变 */
    private onTimeChange() {
        if (this.m_mjData == null)
            return;
        if (this.m_mjData.gameinfo == null)
            return
        var labelMidTime = this.node.getChildByName("mid_info").getChildByName("label_time").getComponent(cc.Label)
        this.unscheduleAllCallbacks()
        if (this.m_mjData.gameinfo.time > 0) {
            labelMidTime.string = this.m_mjData.gameinfo.time.toString();
            labelMidTime.node.active = true;
            this.schedule(this.loop, 1);
        }
        else {
            labelMidTime.string = "";
            labelMidTime.node.active = false;
        }
    }

    private loop() {
        if (this.m_mjData == null)
            return;
        var labelMidTime = this.node.getChildByName("mid_info").getChildByName("label_time").getComponent(cc.Label)
        if (this.m_mjData.gameinfo == null) {
            this.unschedule(this.loop);
            labelMidTime.node.active = false;
            return
        }

        this.m_mjData.gameinfo._time -= 1
        labelMidTime.string = this.m_mjData.gameinfo.time.toString()
        labelMidTime.node.active = true;
        if (this.m_mjData.gameinfo.time <= 0) {
            if (labelMidTime)
                labelMidTime.node.active = false;
            this.unschedule(this.loop);
        }
    }

    private loop2() {
        if (this.m_inviteTimeout > 0) {
            this.m_inviteTimeout -= 1
            this.inviteTimeLabel.string = "已邀请" + this.m_inviteTimeout + "s"
        }
        else {
            this.unschedule(this.loop2)
            this.inviteTimeLabel.string = "一键邀请"
            this.node.getChildByName("node_begin").getChildByName("btn_club_invite").getComponent(cc.Button).interactable = true;
        }
    }

    private onInviteRec(msg) {
        if (msg.result != 0) {
            GameManager.getInstance().openWeakTipsUI(StringData.getString(msg.result));
        }
        this.unscheduleAllCallbacks()
        this.m_inviteTimeout = msg.timeout
        this.inviteTimeLabel.string = "已邀请" + this.m_inviteTimeout + "s"
        this.node.getChildByName("node_begin").getChildByName("btn_club_invite").getComponent(cc.Button).interactable = false;
        this.schedule(this.loop2, 1);
        MessageManager.getInstance().disposeMsg();
    }

    private onStartTimeRec(msg) {
        this.startTime = msg.leftTime
        this.node.getChildByName("start_time").active = true;
        this.node.getChildByName("start_time").getComponent(cc.Label).string = "准备倒计时：" + this.startTime + "s"
        this.schedule(this.loop4, 1);
        MessageManager.getInstance().disposeMsg();

    }

    private onStartTimeCancel(msg) {
        this.startTime = 0
        this.node.getChildByName("start_time").active = false;
        this.unschedule(this.loop4)
        MessageManager.getInstance().disposeMsg();
    }

    private loop4() {
        this.startTime -= 1
        this.node.getChildByName("start_time").getComponent(cc.Label).string = "准备倒计时：" + this.startTime + "s"
        if (this.startTime <= 0) {
            this.unschedule(this.loop4)
            this.node.getChildByName("start_time").active = false;
        }
    }

    private onHuTipsRec(msg) {
        if (msg.tilesInfo.length == 0) {
            GameManager.getInstance().openWeakTipsUI("当前手牌暂无叫牌")
            MessageManager.getInstance().disposeMsg();
            return
        }
        var jiaoArray = []
        for (var j = 0; j < msg.tilesInfo.length; j++) {
            var num = this.m_mjData.checkMjNum(msg.tilesInfo[j].tile)
            var tileInfo = {
                num: num,
                fan: msg.tilesInfo[j].fan,
                mjId: msg.tilesInfo[j].tile,
            }
            jiaoArray.push(tileInfo)
        }
        this.initTipsShow(this.node.getChildByName("layer_listen_tips"), jiaoArray);
        MessageManager.getInstance().disposeMsg();
    }

    private onForceKickPlayer(msg) {
        GameManager.getInstance().openWeakTipsUI("踢出玩家成功");
        MessageManager.getInstance().disposeMsg();
    }

    // /**—————————————————————————————————————————按钮事件———————————————————————————————————————————*/

    /**准备按钮(协议要换) */
    private button_ready() {
        AudioManager.getInstance().playSFX("button_click")
        GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_Ready.MsgID.ID, {});
    }

    /**一键邀请 */
    private button_invite_club() {
        AudioManager.getInstance().playSFX("button_click")
        GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.C2S_CLUB_INVITE_JOIN_ROOM.MsgID.ID, { clubId: this.m_mjData.gameinfo.clubId });
    }

    private button_third_invite() {
        AudioManager.getInstance().playSFX("button_click")
        var roomId = this.m_mjData.gameinfo.roomId
        var type = "joinroom"
        var id = GameDataManager.getInstance().userInfoData.userId
        var para = { type: type, room: roomId, guid: id }
        UIManager.getInstance().openUI(ThirdSelectUI, 98, () => {
            UIManager.getInstance().getUI(ThirdSelectUI).getComponent("ThirdSelectUI").initPara(para);
        })
    }

    /**过 */
    guo_button() {
        AudioManager.getInstance().playSFX("button_click")
        this.checkIsErrorTuoGuan()
        //如果听按钮按下
        if (this.m_mjData.gameinfo.isTingClick) {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + 0).getComponent("SelfCardControl_MJ").setCanOperate(false);
            this.m_mjData.setTingButtonChange(false);
            this.mjSelfPGHTipsChange()
            return;
        }
        if (this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_ZI_MO)) {
            let surefun = () => {
                this.onGuoConfirm()
            };
            let closefun = () => {
            };
            var content = "您当前可以自摸，确定要过牌吗？"
            GameManager.getInstance().openSelectTipsUI(content, surefun, closefun);
        }
        else {
            this.onGuoConfirm()
        }
    }

    onGuoActionRec() {
        if (this.m_mjData.gameinfo.curOperateId == this.m_mjData.playerInfoMap.get(0).id)
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + 0).getComponent("SelfCardControl_MJ").setCanOperate(true);
    }

    onGuoConfirm() {
        if (this.m_mjData && this.m_mjData.gameinfo) {
            var sessionId = this.m_mjData.getActionSessionId()
            MessageManager.getInstance().messageSend(Proto.CS_Maajan_Do_Action.MsgID.ID, { action: MJ_ACTION.ACTION_PASS, sessionId: sessionId });
            //清理状态数据
            this.m_mjData.gameinfo.curGang = [];
            this.m_mjData.gameinfo.curJiao = [];
            this.m_mjData.setPGHTips(null);
            if (this.m_mjData.gameinfo.curOperateId == this.m_mjData.playerInfoMap.get(0).id)
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + 0).getComponent("SelfCardControl_MJ").setCanOperate(true);
        }
    }

    //胡牌
    hu_button() {
        AudioManager.getInstance().playSFX("button_click")
        this.checkIsErrorTuoGuan()
        if (!this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_ZI_MO) && !this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_HU) && !this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_QIANG_GANG_HU))
            return;
        var tempAction = 0
        var tile = 0
        if (this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_ZI_MO)) {
            tempAction = MJ_ACTION.ACTION_ZI_MO
            tile = this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_ZI_MO)
        }
        else if (this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_HU)) {
            tempAction = MJ_ACTION.ACTION_HU
            tile = this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_HU)
        }
        else if (this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_QIANG_GANG_HU)) {
            tempAction = MJ_ACTION.ACTION_QIANG_GANG_HU
            tile = this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_QIANG_GANG_HU)
        }
        var sessionId = this.m_mjData.getActionSessionId()
        MessageManager.getInstance().messageSend(Proto.CS_Maajan_Do_Action.MsgID.ID, { action: tempAction, valueTile: tile, sessionId: sessionId });
    }

    //碰牌
    peng_button() {
        AudioManager.getInstance().playSFX("button_click")
        this.checkIsErrorTuoGuan()
        if (!this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_PENG) && !this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_RUAN_PENG))
            return;
        var sessionId = this.m_mjData.getActionSessionId()
        var temAction = 0
        var substituteNum = 0
        if (this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_PENG)) {
            var tile = this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_PENG)
            temAction = MJ_ACTION.ACTION_PENG
        }
        else {
            var tile = this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_RUAN_PENG)
            temAction = MJ_ACTION.ACTION_RUAN_PENG
            substituteNum = this.m_mjData.getNeedSubstituteNumOfPeng(tile)
        }
        MessageManager.getInstance().messageSend(Proto.CS_Maajan_Do_Action.MsgID.ID, { action: temAction, valueTile: tile, sessionId: sessionId, substituteNum: substituteNum });
    }

    //杠牌
    gang_button() {
        AudioManager.getInstance().playSFX("button_click")
        this.checkIsErrorTuoGuan()
        if (!this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_AN_GANG) && !this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_MING_GANG) && !this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_BA_GANG)
            && !this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_FREE_BA_GANG) && !this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_FREE_AN_GANG)
            && !this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_RUAN_AN_GANG) && !this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_RUAN_BA_GANG)
            && !this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_RUAN_MING_GANG))
            return;

        if (this.m_mjData.playerInfoMap.get(0).cards.length + this.m_mjData.playerInfoMap.get(0).mjpg.length * 3 == this.m_mjData.getCurTypeHandMjNum() + 1)
            this.m_mjData.gameinfo.curGang = this.m_mjData.checkGang();
        if (this.m_mjData.gameinfo.curGang.length <= 1 || this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_FREE_BA_GANG) || this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_FREE_AN_GANG)) {
            var temAction = 0
            var tile = 0
            var substituteNum = 0
            if (this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_AN_GANG)) {
                temAction = MJ_ACTION.ACTION_AN_GANG
                tile = this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_AN_GANG)
            }
            else if (this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_MING_GANG)) {
                temAction = MJ_ACTION.ACTION_MING_GANG
                tile = this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_MING_GANG)
            }
            else if (this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_BA_GANG)) {
                temAction = MJ_ACTION.ACTION_BA_GANG
                tile = this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_BA_GANG)
            }
            else if (this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_FREE_BA_GANG)) {
                temAction = MJ_ACTION.ACTION_FREE_BA_GANG
                tile = this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_FREE_BA_GANG)
            }
            else if (this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_FREE_AN_GANG)) {
                temAction = MJ_ACTION.ACTION_FREE_AN_GANG
                tile = this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_FREE_AN_GANG)
            }
            else if (this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_RUAN_AN_GANG)) {
                temAction = MJ_ACTION.ACTION_RUAN_AN_GANG
                tile = this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_RUAN_AN_GANG)
                substituteNum = 4 - this.m_mjData.getCardNumInHand(tile)
            }
            else if (this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_RUAN_MING_GANG)) {
                temAction = MJ_ACTION.ACTION_RUAN_MING_GANG
                tile = this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_RUAN_MING_GANG)
                substituteNum = 3 - this.m_mjData.getCardNumInHand(tile)
            }
            else if (this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_RUAN_BA_GANG)) {
                temAction = MJ_ACTION.ACTION_RUAN_BA_GANG
                tile = this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_RUAN_BA_GANG)
                var substituteNum = 0
                if (this.m_mjData.getCardNumInHand(tile) == 0)
                    substituteNum = 1
            }
            var sessionId = this.m_mjData.getActionSessionId()
            MessageManager.getInstance().messageSend(Proto.CS_Maajan_Do_Action.MsgID.ID, { action: temAction, valueTile: tile, sessionId: sessionId, substituteNum: substituteNum });
        }
        else {
            //多杠情况需要弹选择面板
            //寻找板子的位置
            var gangnode = this.node.getChildByName("ganginfo")
            gangnode.active = true;
            this.gangListContent.removeAllChildren()
            this.gangItemList = []
            var height = this.m_mjData.gameinfo.curGang.length * (85 + 15) + 30
            if (height < 370) {
                gangnode.getChildByName("gang_bg").height = height
                this.gangListContent.height = 349
            }
            else {
                this.gangListContent.height = height - 15
                gangnode.getChildByName("gang_bg").height = 380
            }
            for (var i = 0; i < this.m_mjData.gameinfo.curGang.length; i++) {
                let item = cc.instantiate(this.gangItem);
                this.gangListContent.addChild(item);
                item.setPosition(0, 60 + 95 * i)
                item.getComponent('Mj_Gang_Item').setInfo(i, this.m_mjData.gameinfo.curGang[i])
                this.gangItemList.push(item)
            }
        }
    }

    //用于回调的杠牌按钮
    duo_gang_click(tile, action, substituteNum) {
        var sessionId = this.m_mjData.getActionSessionId()
        if (action == MJ_ACTION.ACTION_RUAN_BA_GANG) {
            substituteNum = 0
            if (this.m_mjData.getCardNumInHand(tile) == 0)
                substituteNum = 1
        }
        MessageManager.getInstance().messageSend(Proto.CS_Maajan_Do_Action.MsgID.ID, { action: action, valueTile: tile, sessionId: sessionId, substituteNum: substituteNum });
    }

    //听牌
    ting_button() {
        AudioManager.getInstance().playSFX("button_click")
        this.checkIsErrorTuoGuan()
        if (this.m_mjData.gameinfo.curJiao.length != 0) {
            if (!this.m_mjData.gameinfo.curJiao[0].discard) {
                var sessionId = this.m_mjData.getActionSessionId()
                MessageManager.getInstance().messageSend(Proto.CS_Maajan_Do_Action.MsgID.ID, { action: MJ_ACTION.ACTION_TING, sessionId: sessionId });
            }

            else {
                this.m_mjData.setTingButtonChange(true);
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + 0).getComponent("SelfCardControl_MJ").setCanOperate(true);
                this.node.getChildByName("game_button").getChildByName("btn_hu").active = false;
                this.node.getChildByName("game_button").getChildByName("btn_gang").active = false;
                this.node.getChildByName("game_button").getChildByName("btn_peng").active = false;
                this.node.getChildByName("game_button").getChildByName("btn_ting").active = false;
                this.node.getChildByName("game_button").getChildByName("btn_men").active = false;
                this.removEffect();
            }
        }
    }

    huan_button() {
        AudioManager.getInstance().playSFX("button_click")
        this.checkIsErrorTuoGuan()
        if (!this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_GANG_HUAN_PAI))
            return;
        var sessionId = this.m_mjData.getActionSessionId()
        var tile = this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_GANG_HUAN_PAI)
        MessageManager.getInstance().messageSend(Proto.CS_Maajan_Do_Action.MsgID.ID, { action: MJ_ACTION.ACTION_GANG_HUAN_PAI, valueTile: tile, sessionId: sessionId });
    }

    men_button() {
        AudioManager.getInstance().playSFX("button_click")
        var tile = 0
        var action = 0
        if (this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_MEN)) {
            tile = this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_MEN)
            action = MJ_ACTION.ACTION_MEN
        }
        else if (this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_MEN_ZI_MO)) {
            tile = this.m_mjData.gameinfo.state.get(MJ_ACTION.ACTION_MEN_ZI_MO)
            action = MJ_ACTION.ACTION_MEN_ZI_MO
        }
        if (action == 0)
            return
        var sessionId = this.m_mjData.getActionSessionId()
        MessageManager.getInstance().messageSend(Proto.CS_Maajan_Do_Action.MsgID.ID, { action: action, valueTile: tile, sessionId: sessionId });
    }

    //显示查叫按钮提示模块
    btnCheckResponse() {
        AudioManager.getInstance().playSFX("button_click")
        if (this.m_mjData == null)
            return
        var isshow = this.node.getChildByName("layer_listen_tips").active
        if (this.m_mjData.playerInfoMap.get(0).cards && this.m_mjData.playerInfoMap.get(0).cards.length == this.m_mjData.getCurTypeHandMjNum() + 1) {
            GameManager.getInstance().openWeakTipsUI("当前手牌暂无叫牌")
            if (isshow)
                this.node.getChildByName("layer_listen_tips").active = false;
            return
        }
        if (!isshow)
            GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_MaajanGetTingTilesInfo.MsgID.ID, {});
        else
            this.node.getChildByName("layer_listen_tips").active = false;
    }

    //初始化提示显示
    initTipsShow(tipsnode, jiaoArray) {
        if (jiaoArray.length == 0)
            return;
        tipsnode.active = false;
        var contentNode = tipsnode.getChildByName("sp_layer_bg").getChildByName("view").getChildByName("content")
        var num = 0;
        var height = 0
        var wigth = 0
        if (jiaoArray.length <= 5) {
            wigth = 300 + 160 * (jiaoArray.length - 1)
            height = 160
        }
        else {
            wigth = 940
            height = 160 + Math.ceil((jiaoArray.length) / 5 - 1) * 110
        }
        this.node.getChildByName("layer_listen_tips").setContentSize(wigth, height)
        if (contentNode.childrenCount == 0) {
            for (var i = 0; i < 20; i++) {
                var mjnode = cc.instantiate(this.tip_item);
                mjnode.parent = contentNode
            }
        }
        for (var tempNode of contentNode.children)
            tempNode.active = false;
        for (var j = 0; j < jiaoArray.length; j++) {
            var mjNum = jiaoArray[j].num
            var fan = -1
            if (jiaoArray[j].fan >= 0)
                fan = jiaoArray[j].fan
            var mjNode = contentNode.children[j]
            mjNode.attr = jiaoArray[j].mjId
            num += mjNum;
            if (Utils.isXzmj(GameDataManager.getInstance().curGameType)) {
                mjNode.getChildByName("label_fan").getComponent(cc.Label).string = fan.toString();
            }
            else {
                mjNode.getChildByName("label_bei").active = false;
                mjNode.getChildByName("label_fan").active = false;
            }
            mjNode.getChildByName("sp_zhang").getChildByName("label").getComponent(cc.Label).string = mjNum;
            mjNode.getChildByName("sp_mj").getComponent(cc.Sprite).spriteFrame = this.getMjSpriteFrame("mj_" + jiaoArray[j].mjId)
            mjNode.active = true;
        }
        tipsnode.getChildByName("label_num").getComponent(cc.Label).string = num.toString();
        tipsnode.active = true;
    }

    /**动画改变 */
    onAnimationPlay(event) {
        var curGameType = GameDataManager.getInstance().curGameType

        if (event.type != 5 && event.type != 4 && event.type != 9) {
            if (event.audio == "angang" && Utils.isXzmj(curGameType)) {
                AudioManager.getInstance().playSFX("xiayu")
            }
            if (event.audio == "gang" && Utils.isXzmj(curGameType)) {
                AudioManager.getInstance().playSFX("guafeng")
            }
            var path = "man"
            if (this.m_mjData.playerInfoMap.get(event.seat).sex == 1) {
                path = "man"
            }
            else {
                path = "woman"
            }
            if (Utils.isXzmj(GameDataManager.getInstance().curGameType)) {
                var vocieType = cc.sys.localStorage.getItem("xzmj_voice")
                if (vocieType && vocieType == "2")
                    path += "_sc"
            }
            AudioManager.getInstance().playSFX(path + "/" + event.audio)

        }
        if (event.audio == "ting") {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + 0).getComponent("SelfCardControl_MJ").updateHandMjStateByTing();
        }
        // 收到过的消息
        if (event.type == 9) {
            this.m_mjData.gameinfo.curGang = [];
            this.m_mjData.gameinfo.curJiao = [];
            this.m_mjData.setPGHTips(null);
            if (this.m_mjData.gameinfo.curOperateId == this.m_mjData.playerInfoMap.get(0).id)
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + 0).getComponent("SelfCardControl_MJ").setCanOperate(true);
            return
        }
        else if (event.type == 0 && event.seat == 0) // 托管情况下，自己胡牌需要清理一下按钮状态
        {
            //清理状态数据
            this.m_mjData.gameinfo.curGang = [];
            this.m_mjData.gameinfo.curJiao = [];
            this.m_mjData.setPGHTips(null);
        }
        this.nodeAnim.node.position = this.effectPosList[event.seat]
        this.nodeAnim.node.active = true;
        var effect = ["hu", "peng", "gang", "ting", "dianpao", "men"];
        this.m_isAction = true
        this.nodeAnim.play(effect[event.type]);
        this.nodeAnim.on("finished", this.callBack, this)
    }

    private callBack() {
        this.nodeAnim.node.active = false
        this.m_isAction = false
        if (this.m_isOver)
            MessageManager.getInstance().messagePost(ListenerType.mj_gameRoundOver, {});
    }

    /**关闭所有动画 */
    private removEffect() {
        this.nodeAnim.node.active = false
    }

    // 收到鸡牌
    private onChickActionRec(msg) {
        var action = msg.actionType
        var acitonNode = this.node.getChildByName("chick_action_node")
        acitonNode.getComponent(cc.Sprite).spriteFrame = this.chickSp[action]
        acitonNode.stopAllActions();
        let action1 = cc.fadeIn(0.3);
        let action2 = cc.delayTime(1);
        let action3 = cc.fadeOut(0.3);
        let seq = cc.sequence(action1, action2, action3);
        acitonNode.runAction(seq);
    }



    // -----------------------------------------------血战麻将的相关接口----------------------------------------
    // 换牌开始
    private onHpStart() {
        if (this.m_mjData == null) {
            MessageManager.getInstance().disposeMsg();
            return;
        }
        this.updateViewHuanPai()
        this.m_isStartHuanPaByClient = true
        this.m_mjData.setGameState(GAME_STATE_MJ.HUAN_PAI);
        this.node.getChildByName("node_cardsMgr").getChildByName("player0").getComponent("SelfCardControl_MJ").hpStatusChanged()
        this.node.getChildByName("node_cardsMgr").getChildByName("player0").getComponent("SelfCardControl_MJ").autoHpTips()
        MessageManager.getInstance().disposeMsg();
        return;

    }

    updateViewHuanPai() {
        if (this.m_mjData == null)
            return
        if (this.m_mjData.gameinfo == null)
            return
        var oRule = this.m_mjData.gameinfo.rule
        var des = "选择以下"
        if (oRule.huan.type_opt == 0)
            des += "同种花色"
        else
            des += "任意"
        if (oRule.huan.count_opt == 0)
            des += "三张手牌"
        else
            des += "四张手牌"
        this.node.getChildByName("btn_hp").active = true
        this.node.getChildByName("btn_hp").getChildByName("label_type").getComponent(cc.Label).string = des
    }

    // 定缺开始
    private onDqStart() {
        if (!this.m_mjData) {
            MessageManager.getInstance().disposeMsg();
            return
        }
        this.m_isStartDingQueByClient = true
        if (this.m_isHpAction) // 如果还在播放动画就先等待
            return
        this.updateViewDingQue()
        this.m_mjData.setGameState(GAME_STATE_MJ.DING_QUE);
        MessageManager.getInstance().disposeMsg();

    }
    updateViewDingQue() {
        if (this.m_mjData == null)
            return
        this.node.getChildByName("btn_hp").active = false
        this.node.getChildByName("node_dq").active = true
        var btnState = this.m_mjData.playerInfoMap.get(0).checkCardColor()
        for (var idx = 0; idx < btnState.length; idx++) {
            var type = ""
            if (idx == 0)
                type = "wan"
            else if (idx == 2)
                type = "tiao"
            else
                type = "tong"

            if (btnState[idx] == 0) { // 闪烁
                this.node.getChildByName("node_dq").getChildByName("btn_" + type).getComponent(cc.Button).interactable = true
                var actionNode = this.node.getChildByName("node_dq").getChildByName("action_" + type)
                actionNode.active = true
                // var action1 = cc.scaleTo(0.4, 1.3);
                // var action2 = cc.scaleTo(0.4, 1.0);
                var action1 = cc.rotateBy(1.4, 360)

                // var seq = cc.sequence(action1);
                // actionNode.stopAllActions();
                actionNode.runAction(cc.repeatForever(action1));
            }
            else if (btnState[idx] == 1)//正常
            {
                this.node.getChildByName("node_dq").getChildByName("action_" + type).active = false
                this.node.getChildByName("node_dq").getChildByName("btn_" + type).getComponent(cc.Button).interactable = true

            }
            else// 变灰
            {
                this.node.getChildByName("node_dq").getChildByName("action_" + type).active = false
                this.node.getChildByName("node_dq").getChildByName("btn_" + type).getComponent(cc.Button).interactable = false

            }
        }
    }
    private hpStatusChanged() {
        if (this.m_mjData.playerInfoMap.get(0).exchanged)
            this.node.getChildByName("btn_hp").active = false
    }


    private dqStatusChanged() {
        if (!this.m_mjData.playerInfoMap.get(0)) {
            this.node.getChildByName("node_dq").active = false
            return
        }
        if (this.m_mjData.playerInfoMap.get(0).isDq)
            this.node.getChildByName("node_dq").active = false
    }

    private recHpResult(msg) {
        this.doHpAction(msg.order)
        this.m_isHpAction = true
    }

    private recDqResult(msg) {
        this.node.getChildByName("node_dq").active = false
    }
    private recBaoTingResult(msg) {
        this.node.getChildByName("node_baoTing").active = false
    }
    private recHuInfo() {
        this.m_mjData.playerInfoMap.forEach((infoObj, seat) => {
            if (seat == 0) {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("SelfCardControl_MJ").onHuPaiByXueZhan();
            }
            else {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("OtherCardCOntrol_MJ").onHuPaiByXueZhan();
            }
        })


    }

    // 播放换牌动画(顺时针0，逆时针1, 对角交换2)
    doHpAction(type) {
        this.node.getChildByName("node_hp").active = true
        // 文字动画
        var acitonNode = this.node.getChildByName("chick_action_node")
        acitonNode.getComponent(cc.Sprite).spriteFrame = this.chickSp[type + 6]
        acitonNode.stopAllActions();
        let action1 = cc.fadeIn(0.3);
        let action2 = cc.delayTime(0.8);
        let action3 = cc.fadeOut(0.3);
        let action4 = cc.callFunc(() => {
            this.m_isHpAction = false
            this.node.getChildByName("node_hp").getChildByName("action_hp").active = false
            this.node.getChildByName("node_cardsMgr").getChildByName("player0").getComponent("SelfCardControl_MJ").onRecHpResult()
            if (this.m_isStartDingQueByClient && this.m_mjData)
                this.onDqStart()
        }, this);
        let seq = cc.sequence(action1, action2, action4, action3);
        acitonNode.runAction(seq);
        // 箭头动画
        var actionNodeJT = this.node.getChildByName("node_hp").getChildByName("action_hp")
        actionNodeJT.active = true
        actionNodeJT.angle = 0
        actionNodeJT.getComponent(cc.Sprite).spriteFrame = this.huanpaiSp[type]
        if (type == 0) // 顺时针
        {
            var JtAction = cc.rotateTo(0.8, -90)
            actionNodeJT.runAction(JtAction)
        }
        else if (type == 1) {
            var JtAction = cc.rotateTo(0.8, 90)
            actionNodeJT.runAction(JtAction)
        }
        else {
            var JtAction = cc.fadeIn(0.2);
            let JtAction2 = cc.delayTime(0.2);
            var JtAction3 = cc.fadeOut(0.2);
            var JtSeq = cc.sequence(JtAction, JtAction2, JtAction3);
            actionNodeJT.runAction(cc.repeat(JtSeq, 2))
        }

    }

    // 该函数用于首次加载游戏时激活cardcontrol节点，防止进桌子直接退出，再进游戏时cardcontrol节点没有调用destroy导致的泄露
    activeCardControl() {
        this.node.getChildByName("node_cardsMgr").active = true
        for (var seat = 0; seat < 4; ++seat)
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).active = true

        this.node.getChildByName("node_cardsMgr").active = false
        for (var seat = 0; seat < 4; ++seat)
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).active = false

    }

    getMjSpriteFrame(url) {
        var idx = this.mjUrlToIndex[url]
        return this.mjSpf[idx]
    }

    // 出现错误的托管情况时，如果玩家点击了任意游戏按钮则取消托管
    checkIsErrorTuoGuan() {
        if (this.m_mjData && this.m_mjData.playerInfoMap.get(0)) {
            var isTrustee = this.m_mjData.playerInfoMap.get(0).isTrustee
            if (!isTrustee)
                return
            MessageManager.getInstance().messageSend(Proto.CS_Trustee.MsgID.ID, { isTrustee: false });
        }
    }

    onCardBgChange(msg) {
        this.m_mjData.playerInfoMap.forEach((infoObj, seat) => {
            if (seat == 0) {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("SelfCardControl_MJ").onCardBgChange();
            }
            else {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("OtherCardCOntrol_MJ").onCardBgChange();
            }
        })
    }

    // 换牌按钮
    btn_hp() {
        AudioManager.getInstance().playSFX("button_click")
        this.checkIsErrorTuoGuan()
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
        var oRule = gameData.gameinfo.rule
        var num = 3
        if (oRule.huan.count_opt == 1)
            num = 4
        if (this.m_mjData.playerInfoMap.get(0).selectHp.length != num) {
            GameManager.getInstance().openWeakTipsUI("请选择指定数量的牌进行交换")
            return
        }
        GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_HuanPai.MsgID.ID, { tiles: this.m_mjData.playerInfoMap.get(0).selectHp });
    }

    btn_dq(event, customEventData) {
        AudioManager.getInstance().playSFX("button_click")
        this.checkIsErrorTuoGuan()
        var type = parseInt(customEventData)
        GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_DingQue.MsgID.ID, { men: type });
    }

    btn_piao(event, customEventData) {
        AudioManager.getInstance().playSFX("button_click")
        this.checkIsErrorTuoGuan()
        var type = parseInt(customEventData)
        //let piaoOption = this.m_mjData._gameinfo.rule.piao.piao_option
        //飘分组合
        //let piaoArray = [[0, 1, 2, 3], [0, 2, 4, 6], [0, 2, 5, 8]]
        GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_PiaoFen.MsgID.ID, { piao: type });
    }
    btn_baoTing(event, customEventData) {
        AudioManager.getInstance().playSFX("button_click")
        this.checkIsErrorTuoGuan()
        var type = parseInt(customEventData)
        //let piaoOption = this.m_mjData._gameinfo.rule.piao.piao_option
        //飘分组合
        //let piaoArray = [[0, 1, 2, 3], [0, 2, 4, 6], [0, 2, 5, 8]]
        GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_Baoting.MsgID.ID, { baoting: type });
    }

    btn_fastGame() {
        AudioManager.getInstance().playSFX("button_click")
        var roomId = GameDataManager.getInstance().getDataByCurGameType().gameinfo.roomId
        GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_VoteTableReq.MsgID.ID, { tableId: roomId, voteType: "FAST_START" });
    }

    btn_close_huTips() {
        this.checkIsErrorTuoGuan()
        this.node.getChildByName("layer_listen_tips").active = false;
    }

    btn_gu_mai(event, customEventData) {
        AudioManager.getInstance().playSFX("button_click")
        var score = parseInt(customEventData)
        GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_MaajanZhuoJiGuMai.MsgID.ID, { score: score });
    }

    btn_gang_touch(event, customEventData) {
        this.node.getChildByName("ganginfo").active = false
    }

}
