import { ListenerType } from './../../../data/ListenerType';
import { GameUIRepeatMsgManage } from './../../GameUIRepeatMsgManage';
import { VoteUI } from './../../VoteUI';
import { ShowRuleUI } from './../rule/ShowRuleUI';
import { GameSettingUI } from './../../GameSettingUI';
import { HallUI } from './../../HallUI';
import { GameManager } from './../../../GameManager';
import { StringData } from './../../../data/StringData';
import { GameUIController } from './../../GameUIController';
import { CP_ACTION, GAME_TYPE, ConstValue } from './../../../data/GameConstValue';
import { GAME_STATE_CP } from './../../../data/cp/cpDefines';
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
import CpRoundOver_UI from './CpRoundOver_UI';
import CpGameOver_UI from './CpGameOver_UI';
import TuoGuanUI from '../../TuoGuanUI';
import { GameUI_PlayerInfo_CP } from './GameUI_PlayerInfo_CP';
import { GameData_ZGCP } from '../../../data/cp/GameData_ZGCP';


const { ccclass, property } = cc._decorator;

@ccclass
export class GameUI_CP extends BaseUI {
    protected static className = "GameUI_CP";
    /*
    长牌的ui（通用)
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
    shuiyin_spf: cc.SpriteFrame[] = [];
    @property(sp.Skeleton)
    nodeAnim: sp.Skeleton = null;
    @property(cc.Label)
    inviteTimeLabel: cc.Label = null;
    @property([cc.SpriteFrame])
    mjSpf: cc.SpriteFrame[] = [];
    @property(cc.Prefab)
    cardItem: cc.Prefab = null;
    @property(cc.Node)
    gangListContent: cc.Node = null;

    @property(sp.Skeleton)
    nodeToujiaAnim: sp.Skeleton= null;

    @property(sp.Skeleton)
    nodeHuangZhuangAnim: sp.Skeleton= null;

    @property(cc.Node)
    mj_toujia: cc.Node = null;

    // private m_cpData: GameData_ZGCP = null;
    private m_isAction = false // 是否正在播放动画
    private m_isOver = false
    private readonly effectPosList = [cc.v3(0, -125), cc.v3(292, 24), cc.v3(0, 174), cc.v3(-290, 24)] //长牌pgh特效
    private m_inviteTimeout = 0
    private m_isQGH = false // 当前是不是抢杠胡状态
    private m_isStartBaoTingByClient = false
    private startTime = 0 // 准备倒计时  
    private showTimeSeat = 0 // 倒计时指示的玩家
    private cardItemList = []

    private readonly mjUrlToIndex = {
        "bg": 0, "bg_yellow": 1, "di": 2, "di_yellow": 3, "card1": 4, "card2": 5, "card3": 6, "card4": 7, "card5": 8,
        "card6": 9, "card7": 10, "card8": 11, "card9": 12, "card10": 13, "card11": 14, "card12": 15, "card13": 16, "card14": 17,
        "card15": 18, "card16": 19, "card17": 20, "card18": 21, "card19": 22, "card20": 23, "card21": 24, "cptb1": 25, "cptb2": 26,
        "cptb3": 27, "cptb4": 28, "cptb5": 29, "cptb6": 30, "cptb7": 31, "cptb8": 32, "cptb9": 33, "cptb10": 34, "cptb11": 35,
        "cptb12": 36, "cptb13": 37, "cptb14": 38, "cptb15": 39, "cptb16": 40, "cptb17": 41, "cptb18": 42, "cptb19": 43,
        "cptb20": 44, "cptb21": 45, "remain1": 46, "remain2": 47, "remain3": 48, "remain4": 49, "remain5": 50, "remain6": 51, "remain7": 52,
        "remain8": 53, "remain9": 54, "remain10": 55, "remain11": 56, "remain12": 57, "remain13": 58, "remain14": 59, "remain15": 60, "remain16": 61,
        "remain17": 62, "remain18": 63, "remain19": 64, "remain20": 65, "remain21": 66, "zgcp_bapai": 67, "zgcp_chipai": 68, "zgcp_toupai": 69,
    }
    private readonly shuiYinMap = { 350: 0, }

    onLoad() {
        this.nodeAnim.setCompleteListener(() => {
            this.nodeAnim.node.active = false
            this.m_isAction = false
            if (this.m_isOver)
                MessageManager.getInstance().messagePost(ListenerType.cp_gameRoundOver, {});
        });
        //初始化牌堆的牌
        let remainCardsNode = cc.find("node_cardsMgr/remainCards", this.node)
        let firstCard = remainCardsNode.getChildByName("mj_0")
        for (let i = 1; i < 60; i++) {
            let newCard = cc.instantiate(firstCard)
            newCard.name = "mj_" + i
            newCard.parent = firstCard.parent
        }
        remainCardsNode.getChildByName("firstMark").zIndex = 5
    }

    onDataRecv() {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
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
        this.node.getChildByName("game_button").active = false
        this.node.getChildByName("ganginfo").active = false
        UIManager.getInstance().closeUI(GameApplyUI)
        UIManager.getInstance().closeUI(CpGameOver_UI)
        UIManager.getInstance().closeUI(CpRoundOver_UI)
        UIManager.getInstance().closeUI(GameSettingUI);
    }


    onShow() {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        this.initShuiYin()
        this.setOverPlusNum();
        m_cpData.playerInfoMap.forEach((infoObj, seat) => {
            if (seat == 0)
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("SelfCardControl_Cp").onShow(seat)
            else
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("OtherCardCOntrol_Cp").onShow(seat)
        })
    }

    onDestroy() {
        super.onDestroy();
        this.m_isOver = false
        this.m_isAction = false
        this.m_isStartBaoTingByClient = false
    }

    initCardControl() {
        for (let i = 0; i < 4; ++i) {
            if (i == 0) {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + i).getComponent("SelfCardControl_Cp").onDataRecv();
            }
            else {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + i).getComponent("OtherCardCOntrol_Cp").onDataRecv();
            }
        }
    }

    resetDataOnBack()// 切后台之后切回前台需要清理数据
    {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        this.initShuiYin()
        this.onGameStateChanged()
        this.startTime = 0
        this.node.getChildByName("start_time").active = false;
        this.unschedule(this.loop4)
        this.nodeToujiaAnim.node.stopAllActions()
        for (let i = 0; i < 4; ++i) {
            if (m_cpData.playerInfoMap.get(i))
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + i).active = true;
            else
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + i).active = false;
            if (i == 0) {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + i).getComponent("SelfCardControl_Cp").resetDataOnBack();
            }
            else {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + i).getComponent("OtherCardCOntrol_Cp").resetDataOnBack();
            }
        }
    }


    /**——————————————————————————————————初始化相关——————————————————————————————————*/

    onGameStart() {
        this.m_isOver = false
        this.m_isAction = false
        this.m_isStartBaoTingByClient = false
        this.showTimeSeat = 0
        //this.takeOutOneHandCards()
        this.cpSelfPGHTipsChange()
        this.updateCp()
        this.updateMid()
        this.clearMidTime()
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        if (!m_cpData._gameinfo.isDismissed) {
            UIManager.getInstance().closeUI(CpGameOver_UI)
        }
        UIManager.getInstance().closeUI(CpRoundOver_UI)
    }

    /**刷新牌数据 */
    private updateCp() {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        m_cpData.playerInfoMap.forEach((infoObj, seat) => {
            if (seat == 0) {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("SelfCardControl_Cp").setAll(seat)
            }
            else {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("OtherCardCOntrol_Cp").setAll(seat)
            }
        })
    }

    /**初始化监听 */
    private initListen() {
        // /*———————————————————————————————服务器消息——————————————————————————————————*/
        ListenerManager.getInstance().add(Proto.S2C_CLUBLIST_RES.MsgID.ID, this, this.onEnterClubResponse);
        ListenerManager.getInstance().add(Proto.SC_DismissTable.MsgID.ID, this, this.onRoomDissmissOver);
        ListenerManager.getInstance().add(Proto.SC_VoteTable.MsgID.ID, this, this.onVoteOver);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_INVITE_JOIN_ROOM.MsgID.ID, this, this.onInviteRec);
        ListenerManager.getInstance().add(Proto.SC_StartTimer.MsgID.ID, this, this.onStartTimeRec);
        ListenerManager.getInstance().add(Proto.SC_CancelTimer.MsgID.ID, this, this.onStartTimeCancel);
        ListenerManager.getInstance().add(Proto.SC_ForceKickoutPlayer.MsgID.ID, this, this.onForceKickPlayer);
        ListenerManager.getInstance().add(Proto.SC_CP_Canbe_Baopai.MsgID.ID, this, this.onBaoPai);
        ListenerManager.getInstance().add(Proto.SC_CP_BaoTingInfos.MsgID.ID, this, this.onBtStart);
        ListenerManager.getInstance().add(Proto.SC_CP_AllowBaoting.MsgID.ID, this, this.onAllowBt);


        ListenerManager.getInstance().add(ListenerType.cp_start, this, this.onGameStart);
        ListenerManager.getInstance().add(ListenerType.cp_gameState, this, this.onGameStateChanged);
        ListenerManager.getInstance().add(ListenerType.cp_pgChanged, this, this.onPgChanged);
        ListenerManager.getInstance().add(ListenerType.cp_getcp, this, this.onGetMj);
        ListenerManager.getInstance().add(ListenerType.cp_outcp, this, this.onOutMj);
        ListenerManager.getInstance().add(ListenerType.cp_opencp, this, this.onOpenMj);
        ListenerManager.getInstance().add(ListenerType.cp_PGHTipsRec, this, this.cpSelfPGHTipsChange);
        ListenerManager.getInstance().add(ListenerType.cp_curOperateChange, this, this.onCurOperateChanged);
        ListenerManager.getInstance().add(ListenerType.cp_animationPlay, this, this.onAnimationPlay);
        ListenerManager.getInstance().add(ListenerType.gameBgChange, this, this.onGameBgChange);
        ListenerManager.getInstance().add(ListenerType.cp_handCpChanged, this, this.onHandMjChanged);
        ListenerManager.getInstance().add(ListenerType.cp_outCpChanged, this, this.onOutMjChanged);
        ListenerManager.getInstance().add(ListenerType.cp_gameRoundOver, this, this.onGameRoundOver);
        ListenerManager.getInstance().add(ListenerType.cp_playerNumChanged, this, this.onPlayerNumChanged);                     // 收到玩家人数改变
        ListenerManager.getInstance().add(ListenerType.cp_dismissResponse, this, this.onRoomDissmissResponse);                     // 收到解散请求
        ListenerManager.getInstance().add(ListenerType.cp_VoteResponse, this, this.onVoteResponse);

        ListenerManager.getInstance().add(ListenerType.operateTimeChange, this, this.onTimeChange);
        ListenerManager.getInstance().add(ListenerType.cp_playerStateChanged, this, this.onPlayerStateChanged);                 // 收到玩家游戏状态改变
        ListenerManager.getInstance().add(ListenerType.cardBgChange, this, this.onCardBgChange);
        ListenerManager.getInstance().add(ListenerType.cp_curOverPlusChange, this, this.onLeftMjNumChanged)
        //ListenerManager.getInstance().add(ListenerType.cp_curRoundChange, this, this.setRound);
        ListenerManager.getInstance().add(ListenerType.cp_play_toujia_ani, this, this.onPlayToujiaAni)
        ListenerManager.getInstance().add(ListenerType.cp_round_over_hz, this, this.onPlayHuangZhuangAni) // 荒庄
        ListenerManager.getInstance().add(ListenerType.tuoGuanOver, this, this.onGameOver); //大结算的数据来了 最后一局需要显示 显示结算按钮
        ListenerManager.getInstance().add(ListenerType.cp_BaotingStatusChanged, this, this.baoTingStatusChanged);
        //ListenerManager.getInstance().add(ListenerType.cp_recBaoTingResult, this, this.recBaoTingResult);
    }

    /**
     * @func 播放荒庄动画
     */
    private onPlayHuangZhuangAni(msg) {
        // 判断是否荒庄
        // 慌庄判断, 遍历所有玩家 所有玩家都没有胡 就是慌庄
        let isHuangZhuang = true
        let playerBalance = msg.playerBalance
        for (let index = 0; index < playerBalance.length; index++) {
            if (playerBalance[index].hu) {
                isHuangZhuang = false
                break
            }
        }

        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        let _this = this
        // 荒庄
        if (isHuangZhuang) {
            AudioManager.getInstance().playSFX("zgcp/sn_zgcp_huangzhuang")
            _this.nodeHuangZhuangAnim.node.active = true
            _this.nodeHuangZhuangAnim.setAnimation(0, "hj", false)

            let callBack = cc.tween().call(() => {
                m_cpData.setRoundOver(msg)
                _this.nodeHuangZhuangAnim.node.active = false
            })
            cc.tween(_this.nodeHuangZhuangAnim).then(cc.tween().delay(3)).then(callBack).start()
        }
        else {

            m_cpData.setRoundOver(msg)
        }
    }

    /**
     *  1.展示头家扑克
     *  2.展示头家动画
     *  3.调用onGameDateInit处理数据
     *  4.播放手牌动画
     */
    private onPlayToujiaAni(msg) {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        let delayShowTJ = cc.tween().delay(0.2)
        let delayShowTJStart = cc.tween().delay(1)

        this.nodeToujiaAnim.node.position = cc.v3(0, 0)
        this.nodeToujiaAnim.node.scale = 1
        var realSeat = m_cpData.getRealSeatByRemoteSeat(msg.zhuang)

        // 显示头家扑克, 并为其赋值
        let callbackShowTJ = cc.tween().call(() => {
            this.mj_toujia.active = true
            this.node.getChildByName("node_cardsMgr").getChildByName("player0").getComponent("SelfCardControl_Cp").setMjTexture(this.mj_toujia, msg.zhuangPai, 0)
        })

        let callbackShowTJAni = cc.tween().call(() => {
            this.mj_toujia.active = false
            this.nodeToujiaAnim.node.active = true
            this.nodeToujiaAnim.setAnimation(0, "animation", false)
        }) //播放头家动画

        let callbackShowData = cc.tween().call(() => {
            // 创建手牌
            // 播放手牌动画
            // 手牌动画结束后 再调用onGameDateInit 更新数据
            let myChairID: number = -1
            let cards: number[] = null
            for (let index = 0; index < msg.pbPlayers.length; index++) {
                // 自己
                if (m_cpData.getRealSeatByRemoteSeat(parseInt(msg.pbPlayers[index].chairId)) == 0) {
                    myChairID = msg.pbPlayers.chairId
                    cards = msg.pbPlayers[index].shouPai
                    break
                }
            }

            this.node.getChildByName("node_cardsMgr").getChildByName("player" + 0).getComponent("SelfCardControl_Cp").arrangeHandCards(cards);
            // 播放手牌动画
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + 0).getComponent("SelfCardControl_Cp").gameStartAni(function () {
                this.nodeToujiaAnim.node.active = false
                m_cpData.onGameDateInit(msg)
            }.bind(this));
        })

        this.nodeToujiaAnim.setCompleteListener(null);
        this.nodeToujiaAnim.setCompleteListener(() => {
            //this.nodeToujiaAnim.node.active = false  player1/sp_master_bg
            //两个玩家的时候需要切出一手牌
            //this.takeOutOneHandCards()
            this.m_isAction = false

            let PlayerInfoCpNode = UIManager.getInstance().getUI(GameUI_PlayerInfo_CP).node
            let headNode = cc.find(`player${realSeat}/sp_master_bg`, PlayerInfoCpNode)
            let destPos = cc.v3(headNode.getPosition().x, headNode.getPosition().y)

            this.nodeToujiaAnim.node.stopAllActions()
            let moveTime = 0.8
            let parallel = cc.tween().parallel(
                cc.tween().to(moveTime, { position: destPos }),
                cc.tween().to(moveTime, { scale: 0.2 })
            )
            cc.tween(this.nodeToujiaAnim.node).then(parallel).then(callbackShowData).start()
        });

        //  有庄牌 则需要播放头家动画
        if (msg.zhuangPai && msg.zhuangPai > 0) {
            cc.tween(this.node).then(callbackShowTJ).then(delayShowTJStart).then(callbackShowTJAni).start()
        }
        // 没有庄牌 不需要播放头家动画
        else {
            cc.tween(this.node).then(callbackShowData).start()
        }
    }
    takeOutOneHandCards() {
        try {
            let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
            let qiePai = m_cpData.gameinfo.qieCard
            if (m_cpData.getCurTypePlayerNum() == 2 && qiePai && qiePai.length > 0) {
                cc.find("node_cardsMgr/takeOutCards", this.node).active = true
                let firstCard = cc.find("node_cardsMgr/takeOutCards/mj_0", this.node)
                let children = firstCard.parent.children
                for (let i = 0; i < qiePai.length; i++) {
                    if (i < children.length) {
                        this.node.getChildByName("node_cardsMgr").getChildByName("player0").getComponent("SelfCardControl_Cp").setMjTexture(children[i], qiePai[i], 1)
                    } else {
                        let newCard = cc.instantiate(firstCard)
                        newCard.parent = firstCard.parent
                        this.node.getChildByName("node_cardsMgr").getChildByName("player0").getComponent("SelfCardControl_Cp").setMjTexture(newCard, qiePai[i], 1)
                    }
                }
            }
        }
        catch (e) {
            GameManager.getInstance().handReconnect()
        }
    }
    private updateMid() {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        let curseat = m_cpData.getSeatById(m_cpData.gameinfo.curOperateId);
        if (m_cpData.gameinfo.curOperateId != 0 && curseat != -1)
            this.onCurOperateChanged({ id: m_cpData.gameinfo.curOperateId })
        else {
            UIManager.getInstance().getUI(GameUI_PlayerInfo_CP).getComponent(GameUI_PlayerInfo_CP).leaveTurn()
            this.nodeMid.active = false
        }
    }

    private clearMidTime() {
        UIManager.getInstance().getUI(GameUI_PlayerInfo_CP).getComponent(GameUI_PlayerInfo_CP).leaveTurn()
    }

    private onEnterClubResponse(msg: any) {
        GameDataManager.getInstance().clubData = msg.clubs;
        //发完消息转场
        var uiType = parseInt(cc.sys.localStorage.getItem("curClubType"));
        UIManager.getInstance().openUI(ClubUI, 0, () => {
            GameUIController.getInstance().closeCurGameUI()
            UIManager.getInstance().closeUI(GameApplyUI)
            UIManager.getInstance().closeUI(CpGameOver_UI)
            UIManager.getInstance().closeUI(CpRoundOver_UI)
            UIManager.getInstance().closeUI(TuoGuanUI)
            UIManager.getInstance().getUI(ClubUI).getComponent("ClubUI").setOpenType(uiType);
            MessageManager.getInstance().disposeMsg();
        });
    }

    private onRoomDissmissResponse(msg) {
        UIManager.getInstance().openUI(GameApplyUI, 30,);
        MessageManager.getInstance().disposeMsg();
    }

    private onVoteResponse(msg) {
        UIManager.getInstance().openUI(VoteUI, 30,);
        MessageManager.getInstance().disposeMsg();
    }

    private onRoomDissmissOver(msg: any) {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        if (UIManager.getInstance().getUI(GameApplyUI) != null) {
            UIManager.getInstance().closeUI(GameApplyUI)
        }
        else {
            if (m_cpData && m_cpData.gameinfo && m_cpData.gameinfo.curRoundOverData != null) {
                MessageManager.getInstance().disposeMsg();
                return
            }
        }
        if (m_cpData && m_cpData.gameinfo && m_cpData.gameinfo.curGameOverData != null) { // 如果解散的时候有总结算数据，关闭界面之后弹出总结算
            GameManager.getInstance().openWeakTipsUI(StringData.getString(10036))
            m_cpData.gameinfo.isDismissed = true
            m_cpData.setGameState(GAME_STATE_CP.GAME_CLOSE);
            MessageManager.getInstance().disposeMsg();
            return
        }
        if (msg.success) {
            var uiType = -1
            GameManager.getInstance().openWeakTipsUI(StringData.getString(10036))
            if (m_cpData && m_cpData.gameinfo && !m_cpData.gameinfo.clubId)
                uiType = -1
            else
                uiType = parseInt(cc.sys.localStorage.getItem("curClubType"));
            if (uiType != -1) {
                MessageManager.getInstance().messageSend(Proto.C2S_CLUBLIST_REQ.MsgID.ID, { type: uiType });
            }
            else
                UIManager.getInstance().openUI(HallUI, 1, () => {
                    GameUIController.getInstance().closeCurGameUI()
                    UIManager.getInstance().closeUI(CpRoundOver_UI)
                    UIManager.getInstance().closeUI(CpGameOver_UI)
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
    private onAllowBt(msg: any) {
        cc.find("node_cardsMgr/spTouPai", this.node).active = false
        MessageManager.getInstance().disposeMsg();
    }
    private onBtStart(msg: any) {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        m_cpData._gameinfo.mBTableStarted = true
        if (!m_cpData) {
            MessageManager.getInstance().disposeMsg();
            return
        }
        this.m_isStartBaoTingByClient = true
        m_cpData.playerInfoMap.get(0).canBaoTing = msg.canbaoting
        if (msg.canbaoting && msg.ting) {
            let canOutCards = [];
            msg.ting.forEach((element) => {
                canOutCards.push(element.discard)
            })
            m_cpData.playerInfoMap.get(0).canOutcards = canOutCards
        }

        //如果自己已经选择报听或者过了 说明此消息是重连补发的消息 只需要保存canOutCards就可以了
        if (m_cpData.playerInfoMap.get(0).isBaoTing) {
            //如果自己选择了报听 并且是庄家的时候第一次出牌的时候有限制  只能打服务器下发限制的牌
            if (m_cpData.playerInfoMap.get(0).baoTingResult /*&& playerID == this.m_mjData.gameinfo.dealerId*/) {
                this.node.getChildByName("node_cardsMgr").getChildByName("player0").getComponent("SelfCardControl_Cp").handMjChange(0)
            }
            MessageManager.getInstance().disposeMsg();
            return
        }
        this.updateViewBaoTing()
        m_cpData.setGameState(GAME_STATE_CP.BAO_TING);
        MessageManager.getInstance().messagePost(ListenerType.cp_BaotingStatusChanged, {});
        MessageManager.getInstance().disposeMsg();
    }
    updateViewBaoTing() {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        if (m_cpData == null)
            return
        this.node.getChildByName("node_baoTing").active = true
        cc.find("node_cardsMgr/spTouPai", this.node).active = false
        cc.find("node_baoTing/btn_baoTing", this.node).getComponent(cc.Button).interactable = (m_cpData.playerInfoMap.get(0).canBaoTing > 0)
    }
    private onPlayerNumChanged(msg) {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        if (msg.tag == "remove") {
            // 自己离开房间
            if (msg.playerSeat == 0) {
                var uiType = -1
                if (!m_cpData.gameinfo.clubId)
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
                        UIManager.getInstance().closeUI(CpRoundOver_UI)
                        UIManager.getInstance().closeUI(CpGameOver_UI)
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
        this.btnInvite.active = m_cpData.playerInfoMap.size != m_cpData.getCurTypePlayerNum();
        this.btnThirdInvite.active = false;
    }

    private onPlayerStateChanged(msg) {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        // 如果是本人准备
        if (msg.type == "ready") {
            this.btnReady.active = !m_cpData.playerInfoMap.get(0).isready;
        }
    }

    /**手牌变化 */
    private onHandMjChanged(msg) {
        try {
            let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
            var seat = m_cpData.getSeatById(msg.id);
            if (seat == 0) {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("SelfCardControl_Cp").handMjChange(seat);
            }
            else {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("OtherCardCOntrol_Cp").handMjChange(seat);
            }
        }
        catch (e) {
            GameManager.getInstance().handReconnect()
        }
    }

    /**出牌变化 */
    private onOutMjChanged(msg) {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        var seat = m_cpData.getSeatById(msg.id);
        if (seat == 0) {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("SelfCardControl_Cp").outMjChange(seat);
        }
        else {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("OtherCardCOntrol_Cp").outMjChange(seat);
        }
    }

    /**出牌变化 */
    private onMenMjChanged(msg) {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        var seat = m_cpData.getSeatById(msg.id);
        if (seat == 0) {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("SelfCardControl_Cp").menArrayChange(seat);
        }
        else {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("OtherCardCOntrol_Cp").menArrayChange(seat);
        }
    }

    /**碰杠牌变化 */
    private onPgChanged(msg) {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        var seat = m_cpData.getSeatById(msg.id);
        if (seat == 0) {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("SelfCardControl_Cp").pgMjChange(seat);
        }
        else {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("OtherCardCOntrol_Cp").pgMjChange(seat);
        }
    }

    private onLeftMjNumChanged(msg) {
        this.setOverPlusNum(msg.num)
    }

    /**剩余牌数 */
    private setOverPlusNum(num?) {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        // if (m_cpData.gameinfo == null || m_cpData.gameinfo.gameState == GAME_STATE_CP.PER_BEGIN)
        //     return
        let leftNumNode = this.node.getChildByName("sp_card_num").getChildByName("label_card_num").getComponent(cc.Label)

        if (num) {
            this.node.getChildByName("sp_card_num").active = true;
            //this.node.getChildByName("sp_round").active = true;
            leftNumNode.string = "" + num + " 张";
        }
        else {
            if (m_cpData.gameinfo.curOverplus > 0) {
                this.node.getChildByName("sp_card_num").active = true;
                //this.node.getChildByName("sp_round").active = true;
                leftNumNode.string = "" + m_cpData.gameinfo.curOverplus + " 张";
            }
            else {
                this.node.getChildByName("sp_card_num").active = false;
                //this.node.getChildByName("sp_round").active = false;
            }
        }
    }
    //设置局数
    private setRound() {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        if (m_cpData == null)
            return
        var curRule = m_cpData.gameinfo.rule
        var list = [8, 16];
        if (GameDataManager.getInstance().curGameType == GAME_TYPE.ZGCP) {
            list = [4, 6, 8, 10]
        }

        var ruleJuShu = list[curRule.round.option];
        var roundNode = this.node.getChildByName("sp_round").getChildByName("label_round").getComponent(cc.Label)
        roundNode.string = "第" + m_cpData.gameinfo.curRound + "/" + ruleJuShu + "局";
    }

    private onGameRoundOver() {
        this.m_isOver = true
        if (this.m_isAction)
            return
        let curGameType = GameDataManager.getInstance().curGameType
        this.nodeMid.active = false
        this.node.getChildByName("node_cardsMgr").getChildByName("player0").getComponent("SelfCardControl_Cp").hideGray();
        cc.find("node_cardsMgr/spTouPai", this.node).active = false
        this.takeOutOneHandCards()
        if (curGameType == GAME_TYPE.ZGCP) {
            //显示牌堆所有的牌
            this.showLeftCards()
            UIManager.getInstance().openUI(CpRoundOver_UI, 20, () => {
                UIManager.getInstance().getUI(CpRoundOver_UI).getComponent("CpRoundOver_UI").iniView()
            })
        }
    }
    showLeftCards() {
        try {
            let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
            let remainCardsNode = cc.find("node_cardsMgr/remainCards", this.node)
            remainCardsNode.active = true
            this.node.getChildByName("sp_card_num").active = false
            for (let i = 0; i < 60; i++) {
                remainCardsNode.getChildByName("mj_" + i).active = false
            }
            let remainCount = m_cpData._gameinfo.curRoundOverData.leftpai.length
            for (let j = 0; j < remainCount; j++) {
                let cardNode = remainCardsNode.getChildByName("mj_" + j)
                cardNode.active = true
                let value = m_cpData._gameinfo.curRoundOverData.leftpai[j]
                this.node.getChildByName("node_cardsMgr").getChildByName("player0").getComponent("SelfCardControl_Cp").setMjTexture(cardNode, value, 1)
            }
        }
        catch (e) {
            GameManager.getInstance().handReconnect()
        }
    }
    /**游戏状态改变 */
    private onGameStateChanged() {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        if (m_cpData.gameinfo.gameState == GAME_STATE_CP.PER_BEGIN) {
            if (m_cpData.playerInfoMap.get(0) == undefined)
                return;
            this.node.getChildByName("node_begin").active = true
            this.node.getChildByName("check_button").active = false
            cc.find("node_cardsMgr/takeOutCards", this.node).active = false
            cc.find("node_cardsMgr/remainCards", this.node).active = false
            this.node.getChildByName("btn_roundover").active = false
            this.nodeMid.active = false
            this.inviteTimeLabel.string = "一键邀请"
            this.node.getChildByName("node_begin").getChildByName("btn_club_invite").getComponent(cc.Button).interactable = true;
            this.btnThirdInvite.active = false;
            if (m_cpData.gameinfo.mBTableStarted) {
                this.btnInvite.active = false;
            }
            else {
                this.btnInvite.active = m_cpData.playerInfoMap.size != m_cpData.getCurTypePlayerNum();
            }
            this.btnReady.active = !m_cpData.playerInfoMap.get(0).isready;
            this.node.getChildByName("check_button").active = false;
            UIManager.getInstance().getUI(GameUI_PlayerInfo_CP).getComponent(GameUI_PlayerInfo_CP).leaveTurn()
            this.removEffect();
            this.node.getChildByName("node_cardsMgr").active = false
            this.checkAutoReady() // 检测是否需要自动准备
            this.updateMid()
            for (let i = 0; i < 4; i++) {
                cc.find(`node_cardsMgr/player${i}/mj_show/mj_0`, this.node).active = false
            }
        }
        else if (m_cpData.gameinfo.gameState == GAME_STATE_CP.GAME_BALANCE) {
            UIManager.getInstance().getUI(GameUI_PlayerInfo_CP).getComponent(GameUI_PlayerInfo_CP).leaveTurn()
            this.node.getChildByName("node_begin").active = false
            this.node.getChildByName("check_button").active = false;
            this.nodeMid.active = false
        }
        else if (m_cpData.gameinfo.gameState == GAME_STATE_CP.GAME_CLOSE) {
            this.nodeMid.active = false
            var curGameType = GameDataManager.getInstance().curGameType
            if (curGameType == GAME_TYPE.ZGCP) {
                UIManager.getInstance().openUI(CpGameOver_UI, 20, () => {
                    UIManager.getInstance().closeUI(GameSettingUI);
                    UIManager.getInstance().closeUI(ShowRuleUI);
                })
            }
        }
        else if (m_cpData.gameinfo.gameState > GAME_STATE_CP.PER_BEGIN && m_cpData.gameinfo.gameState < GAME_STATE_CP.GAME_BALANCE) {
            this.nodeMid.active = true;
            this.node.getChildByName("check_button").active = true
            this.node.getChildByName("node_begin").active = false
            this.node.getChildByName("node_cardsMgr").active = true
            cc.find("node_cardsMgr/spTouPai", this.node).active = (m_cpData.gameinfo.gameState == GAME_STATE_CP.WAIT_ACTION_AFTER_FIRSTFIRST_TOU_PAI)
            var curGameType = GameDataManager.getInstance().curGameType
            m_cpData.playerInfoMap.forEach((infoObj, seat) => {
                if (infoObj != null) {
                    this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).active = true
                }
            })
            if (m_cpData.gameinfo.gameState == GAME_STATE_CP.WAIT_QIANG_GANG_HU) // 抢杠胡状态
            {
                this.m_isQGH = true
            }
        }
        else if (m_cpData.gameinfo.gameState == GAME_STATE_CP.BAO_TING) {
            this.nodeMid.active = true;
            this.node.getChildByName("node_begin").active = false
            cc.find("node_cardsMgr/spTouPai", this.node).active = false
            this.node.getChildByName("node_cardsMgr").active = true
            var curGameType = GameDataManager.getInstance().curGameType
            m_cpData.playerInfoMap.forEach((infoObj, seat) => {
                if (infoObj != null) {
                    this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).active = true
                }
            })
            if (this.m_isStartBaoTingByClient)
                return
            this.updateViewBaoTing()
            if (m_cpData.playerInfoMap.get(0).baoTingResult) {
                this.node.getChildByName("node_cardsMgr").getChildByName("player0").getComponent("SelfCardControl_Cp").handMjChange(0)
            }
        }
    }

    private checkAutoReady() {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        if (UIManager.getInstance().getUI(TuoGuanUI))
            return
        var curGameType = GameDataManager.getInstance().curGameType
        if (curGameType == GAME_TYPE.ZGCP) {
            var isAutoReady = false
            if (!m_cpData.playerInfoMap.get(0).isready && m_cpData.gameinfo.rule.option && !m_cpData.gameinfo.rule.option.hand_ready)
                isAutoReady = true
            else if (m_cpData.gameinfo.rule.trustee)// 存在托管时
            {
                // 全托管，半托管时，除开第一局需要手动准备，其它时候需要自动准备
                if ((m_cpData.gameinfo.rule.trustee.type_opt == 0 || m_cpData.gameinfo.rule.trustee.type_opt == 1) && m_cpData.gameinfo.curRound >= 1)
                    isAutoReady = true
            }
            if (isAutoReady)
                MessageManager.getInstance().messageSend(Proto.CS_Ready.MsgID.ID, {});
        }
    }
    /**显示状态按钮 */
    private cpSelfPGHTipsChange() {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        if (m_cpData.gameinfo.state.size == 0) {
            this.node.getChildByName("game_button").active = false;
            this.node.getChildByName("ganginfo").active = false;
            return
        }
        this.node.getChildByName("game_button").active = true;
        this.node.getChildByName("game_button").getChildByName("btn_guo").active = true
        this.node.getChildByName("ganginfo").active = false;
        this.node.getChildByName("node_cardsMgr").getChildByName("player" + 0).getComponent("SelfCardControl_Cp").setCanOperate(false);

        var count = 1;
        if (m_cpData.gameinfo.state.get(CP_ACTION.ACTION_CHI)) {
            this.node.getChildByName("game_button").getChildByName("btn_chi").active = true;
            this.node.getChildByName("game_button").getChildByName("btn_chi").position = cc.v3(-180 * count, 0);
            count += 1;
        }
        else
            this.node.getChildByName("game_button").getChildByName("btn_chi").active = false;

        if (m_cpData.gameinfo.state.get(CP_ACTION.ACTION_PENG)) {
            this.node.getChildByName("game_button").getChildByName("btn_peng").active = true;
            this.node.getChildByName("game_button").getChildByName("btn_peng").position = cc.v3(-180 * count, 0);
            count += 1;
        }
        else
            this.node.getChildByName("game_button").getChildByName("btn_peng").active = false;

        if (m_cpData.gameinfo.state.get(CP_ACTION.ACTION_TOU)) {
            this.node.getChildByName("game_button").getChildByName("btn_tou").active = true;
            this.node.getChildByName("game_button").getChildByName("btn_tou").position = cc.v3(-180 * count, 0);
            count += 1;
        }
        else
            this.node.getChildByName("game_button").getChildByName("btn_tou").active = false;

        if (m_cpData.gameinfo.state.get(CP_ACTION.ACTION_BA_GANG)) {
            this.node.getChildByName("game_button").getChildByName("btn_gang").active = true;
            this.node.getChildByName("game_button").getChildByName("btn_gang").position = cc.v3(-180 * count, 0);
            count += 1;
        }
        else
            this.node.getChildByName("game_button").getChildByName("btn_gang").active = false;

        if (m_cpData.gameinfo.state.get(CP_ACTION.ACTION_HU) || m_cpData.gameinfo.state.get(CP_ACTION.ACTION_TIAN_HU) || m_cpData.gameinfo.state.get(CP_ACTION.ACTION_QIANG_GANG_HU)) {
            this.node.getChildByName("game_button").getChildByName("btn_hu").active = true;
            this.node.getChildByName("game_button").getChildByName("btn_hu").position = cc.v3(-180 * count, 0);
            count += 1;
            if (m_cpData.playerInfoMap.get(0).baoTingResult) {
                this.node.getChildByName("game_button").getChildByName("btn_guo").active = false
            }
        }
        else
            this.node.getChildByName("game_button").getChildByName("btn_hu").active = false;
    }

    /**摸牌本地回调 播放动画 */
    private onGetMj(msg) {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        var seat = m_cpData.getSeatById(msg.id);
        if (seat == 0) {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("SelfCardControl_Cp").getMj(msg);
        }
        else {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("OtherCardCOntrol_Cp").getMj(msg);
        }
    }

    /**出牌本地回调 播放动画 */
    private onOutMj(msg) {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        var seat = m_cpData.getSeatById(msg.id);
        if (msg.outMjId != null && msg.outMjId > 0 && msg.outMjId < 22) {
            AudioManager.getInstance().playSFX("outmj")
            AudioManager.getInstance().playSFX("zgcp/sn_zgcp_" + msg.outMjId)
        }
        if (seat == 0) {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("SelfCardControl_Cp").outMj(msg);
        }
        else {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("OtherCardCOntrol_Cp").outMj(msg);
        }
        UIManager.getInstance().getUI(GameUI_PlayerInfo_CP).getComponent(GameUI_PlayerInfo_CP).leaveTurn()
    }

    //翻牌
    private onOpenMj(msg) {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        if (msg.tile != null && msg.tile > 0 && msg.tile < 22) {
            AudioManager.getInstance().playSFX("zgcp/sn_zgcp_" + msg.tile)
        }

        //先隐藏上一次亮出的牌
        if (m_cpData.gameinfo.lastOutMjId > 0 && m_cpData.gameinfo.lastOutMjId < 22 && m_cpData.gameinfo.lastOutPid != 0) {
            var realSeat = m_cpData.getSeatById(m_cpData.gameinfo.lastOutPid)
            //将上一次翻出的牌放入弃牌区
            m_cpData.playerInfoMap.get(realSeat).outCard.push(m_cpData.gameinfo.lastOutMjId);

            // 弃牌 牌堆 动画播放结束才 刷新牌堆
            if (realSeat == 0) {
                let callback = function () {
                    this.node.getChildByName("node_cardsMgr").getChildByName("player" + realSeat).getComponent("SelfCardControl_Cp").outMjChange(realSeat);
                }.bind(this)

                this.node.getChildByName("node_cardsMgr").getChildByName("player" + realSeat).getComponent("SelfCardControl_Cp").showOutOrOpenCard(false, false, callback);
            }
            else {
                let callback = function () {
                    this.node.getChildByName("node_cardsMgr").getChildByName("player" + realSeat).getComponent("OtherCardCOntrol_Cp").outMjChange(realSeat);
                }.bind(this)

                this.node.getChildByName("node_cardsMgr").getChildByName("player" + realSeat).getComponent("OtherCardCOntrol_Cp").showOutOrOpenCard(false, false, callback);
            }
        }

        //再显示这一次翻出的牌
        var seat = m_cpData.getRealSeatByRemoteSeat(msg.chairId);
        this.showTimeSeat = seat;
        m_cpData.gameinfo.lastOutMjId = msg.tile;
        m_cpData.gameinfo.lastOutPid = m_cpData.playerInfoMap.get(seat).id;
        if (seat == 0) {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("SelfCardControl_Cp").showOutOrOpenCard(true, false);
        }
        else {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("OtherCardCOntrol_Cp").showOutOrOpenCard(true, false);
        }

        //调整箭头的方向
        let children = this.nodeMid.getChildByName("sp_mid_bg").children;
        for (let i = 0; i < children.length; i++) {
            children[i].active = false;
        }
        let midChildNode = this.nodeMid.getChildByName("sp_mid_bg").getChildByName("sp_" + seat)
        midChildNode.active = true;

    }

    /**当前操作人改变 */
    onCurOperateChanged(msg) {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        var curseat = m_cpData.getSeatById(msg.id);
        this.showTimeSeat = curseat;
        //UIManager.getInstance().getUI(GameUI_PlayerInfo_CP).getComponent(GameUI_PlayerInfo_CP).enterTurn(m_cpData.gameinfo.time,m_cpData.gameinfo.totalTime,curseat)
        UIManager.getInstance().getUI(GameUI_PlayerInfo_CP).getComponent(GameUI_PlayerInfo_CP).enterTurn(8, 8, curseat)
        //调整箭头的方向
        let children = this.nodeMid.getChildByName("sp_mid_bg").children;
        for (let i = 0; i < children.length; i++) {
            children[i].active = false;
        }

        this.nodeMid.active = true
        var midChildNode = this.nodeMid.getChildByName("sp_mid_bg").getChildByName("sp_" + curseat)
        midChildNode.active = true;
        // midChildNode.stopAllActions();
        // var action = cc.repeatForever(cc.blink(1, 1))
        // midChildNode.runAction(action)
        if (this.m_isQGH) {
            this.m_isQGH = false
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + 0).getComponent("SelfCardControl_Cp").setCanOperate(false);
            return
        }
        this.node.getChildByName("node_cardsMgr").getChildByName("player" + 0).getComponent("SelfCardControl_Cp").setCanOperate(curseat == 0);
    }

    private onGameBgChange() {

        var bgid = cc.sys.localStorage.getItem("mjBgId");
        if (bgid === undefined || bgid === null || bgid >= this.spfGameBg.length)
            bgid = 0;
        this.node.getChildByName("sp_game_tdh_bg").getComponent(cc.Sprite).spriteFrame = this.spfGameBg[bgid];
    }

    private initShuiYin() {
        return
        var curGameType = GameDataManager.getInstance().curGameType
        var shuiYinIdx = this.shuiYinMap[curGameType]
        if (typeof shuiYinIdx != "number")
            return
        this.node.getChildByName("shuiyin").getComponent(cc.Sprite).spriteFrame = this.shuiyin_spf[shuiYinIdx]
        this.node.getChildByName("shuiyin").active = true
    }

    /**时间改变 */
    private onTimeChange() {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        if (m_cpData == null)
            return;
        if (m_cpData.gameinfo == null)
            return
        if (m_cpData.gameinfo.time > 0) {
            UIManager.getInstance().getUI(GameUI_PlayerInfo_CP).getComponent(GameUI_PlayerInfo_CP).enterTurn(m_cpData.gameinfo.time, m_cpData.gameinfo.totalTime, this.showTimeSeat)
        }
        else {
            UIManager.getInstance().getUI(GameUI_PlayerInfo_CP).getComponent(GameUI_PlayerInfo_CP).leaveTurn()
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
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        AudioManager.getInstance().playSFX("button_click")
        GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.C2S_CLUB_INVITE_JOIN_ROOM.MsgID.ID, { clubId: m_cpData.gameinfo.clubId });
    }

    private button_third_invite() {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        AudioManager.getInstance().playSFX("button_click")
        var roomId = m_cpData.gameinfo.roomId
        var type = "joinroom"
        var id = GameDataManager.getInstance().userInfoData.userId
        var para = { type: type, room: roomId, guid: id }
        UIManager.getInstance().openUI(ThirdSelectUI, 98, () => {
            UIManager.getInstance().getUI(ThirdSelectUI).getComponent("ThirdSelectUI").initPara(para);
        })
    }

    /**过 */
    guo_button() {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        AudioManager.getInstance().playSFX("button_click")
        this.checkIsErrorTuoGuan()
        //如果听按钮按下
        if (m_cpData.gameinfo.isTingClick) {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + 0).getComponent("SelfCardControl_Cp").setCanOperate(false);
            this.cpSelfPGHTipsChange()
            return;
        }
        if (m_cpData.gameinfo.state.get(CP_ACTION.ACTION_TIAN_HU) || m_cpData.gameinfo.state.get(CP_ACTION.ACTION_HU) || m_cpData.gameinfo.state.get(CP_ACTION.ACTION_QIANG_GANG_HU)) {
            let surefun = () => {
                this.onGuoConfirm()
            };
            let closefun = () => {
            };
            var content = "确定放弃胡牌吗？"
            GameManager.getInstance().openSelectTipsUI(content, surefun, closefun);
        }
        else {
            this.onGuoConfirm()
        }
    }
    onBaoPai(msg) {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        /*
            message SC_CP_Canbe_Baopai
            {
                enum MsgID { Nil = 0; ID = 33146; }
                int32 tile = 1;
                int32 number = 2; // 包牌来源(1 是出牌， 2 是点pass 的)
            }
        */

        /*
            message CS_Changpai_Action_Discard{
                enum MsgID { Nil = 0; ID = 33003;}
                int32 tile = 1;
                bool  is_sure = 2;  // 这张牌是包牌还确认出
            }
         */
        let surefun = () => {
            if (msg.number == 2) {
                if (m_cpData && m_cpData.gameinfo) {
                    var sessionId = m_cpData.getActionSessionId()
                    MessageManager.getInstance().messageSend(Proto.CS_Changpai_Do_Action.MsgID.ID, { action: CP_ACTION.ACTION_PASS, sessionId: sessionId, isSure: true });
                    //清理状态数据
                    m_cpData.setPGHTips(null);
                }
            }
            else {
                MessageManager.getInstance().messageSend(Proto.CS_Changpai_Action_Discard.MsgID.ID, { tile: msg.tile, isSure: true });
            }
        };
        let closefun = () => {
            if (msg.number == 1) {
                if (m_cpData && m_cpData.gameinfo) {
                    let mjData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
                    this.node.getChildByName("node_cardsMgr").getChildByName("player0").getComponent("SelfCardControl_Cp").setCanOperate(true);
                    if (mjData.gameinfo.curSelectMj) {
                        mjData.gameinfo.curSelectMj.cardNode.active = true;
                    }
                    this.node.getChildByName("node_cardsMgr").getChildByName("player0").getComponent("SelfCardControl_Cp").handMjChange(0);
                    mjData.gameinfo.curSelectOutMj = null;
                }
            }
        };
        var content = "这张牌可能包牌，确定打出吗?"
        if (msg.number == 2) {
            content = "过这张牌会包牌，确定过吗?"
        }
        GameManager.getInstance().openSelectTipsUI(content, surefun, closefun);
        MessageManager.getInstance().disposeMsg()
    }
    onGuoActionRec() {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        if (m_cpData.gameinfo.curOperateId == m_cpData.playerInfoMap.get(0).id)
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + 0).getComponent("SelfCardControl_Cp").setCanOperate(true);
    }

    onGuoConfirm() {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        if (m_cpData && m_cpData.gameinfo) {
            var sessionId = m_cpData.getActionSessionId()
            MessageManager.getInstance().messageSend(Proto.CS_Changpai_Do_Action.MsgID.ID, { action: CP_ACTION.ACTION_PASS, sessionId: sessionId });
            //清理状态数据
            //m_cpData.setPGHTips(null);
        }
    }

    //胡牌
    hu_button() {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        AudioManager.getInstance().playSFX("button_click")
        this.checkIsErrorTuoGuan()
        if (!m_cpData.gameinfo.state.get(CP_ACTION.ACTION_TIAN_HU) && !m_cpData.gameinfo.state.get(CP_ACTION.ACTION_HU) && !m_cpData.gameinfo.state.get(CP_ACTION.ACTION_QIANG_GANG_HU))
            return;
        var tempAction = 0
        var tile = 0
        if (m_cpData.gameinfo.state.get(CP_ACTION.ACTION_TIAN_HU)) {
            tempAction = CP_ACTION.ACTION_TIAN_HU
            tile = m_cpData.gameinfo.state.get(CP_ACTION.ACTION_TIAN_HU)[0]
        }
        else if (m_cpData.gameinfo.state.get(CP_ACTION.ACTION_HU)) {
            tempAction = CP_ACTION.ACTION_HU
            tile = m_cpData.gameinfo.state.get(CP_ACTION.ACTION_HU)[0]
        }
        else if (m_cpData.gameinfo.state.get(CP_ACTION.ACTION_QIANG_GANG_HU)) {
            tempAction = CP_ACTION.ACTION_QIANG_GANG_HU
            tile = m_cpData.gameinfo.state.get(CP_ACTION.ACTION_QIANG_GANG_HU)[0]
        }
        var sessionId = m_cpData.getActionSessionId()
        MessageManager.getInstance().messageSend(Proto.CS_Changpai_Do_Action.MsgID.ID, { action: tempAction, valueTile: tile, sessionId: sessionId });
    }

    //碰牌
    peng_button() {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        AudioManager.getInstance().playSFX("button_click")
        this.checkIsErrorTuoGuan()
        if (!m_cpData.gameinfo.state.get(CP_ACTION.ACTION_PENG))
            return;
        var sessionId = m_cpData.getActionSessionId()
        var temAction = 0
        var substituteNum = 0
        if (m_cpData.gameinfo.state.get(CP_ACTION.ACTION_PENG)) {
            var tile = (m_cpData.gameinfo.state.get(CP_ACTION.ACTION_PENG))[0]
            temAction = CP_ACTION.ACTION_PENG
        }
        MessageManager.getInstance().messageSend(Proto.CS_Changpai_Do_Action.MsgID.ID, { action: temAction, valueTile: tile, sessionId: sessionId, substituteNum: substituteNum });
    }

    //吃牌
    chi_button() {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        AudioManager.getInstance().playSFX("button_click")
        this.checkIsErrorTuoGuan()
        if (!m_cpData.gameinfo.state.get(CP_ACTION.ACTION_CHI))
            return;

        if (m_cpData.gameinfo.state.get(CP_ACTION.ACTION_CHI).length == 1) {
            var temAction = CP_ACTION.ACTION_CHI
            var action = (m_cpData.gameinfo.state.get(CP_ACTION.ACTION_CHI))[0]
            var sessionId = m_cpData.getActionSessionId()
            MessageManager.getInstance().messageSend(Proto.CS_Changpai_Do_Action.MsgID.ID, { action: temAction, valueTile: action.tile, sessionId: sessionId, otherTile: action.otherTile });
        }
        else {
            //多吃情况需要弹选择面板
            var gangnode = this.node.getChildByName("ganginfo")
            gangnode.active = true
            let childAll = this.gangListContent.children
            childAll.forEach((childNode) => {
                if (childNode.name != "closeNode" && childNode.name != "sp_title") {
                    childNode.destroy()
                } else if (childNode.name == "sp_title") {
                    childNode.getComponent(cc.Sprite).spriteFrame = this.getMjSpriteFrame("zgcp_chipai");
                }
            })

            let chiArray = m_cpData.gameinfo.state.get(CP_ACTION.ACTION_CHI)
            for (let i = 0; i < chiArray.length; i++) {
                let item = cc.instantiate(this.cardItem);
                this.gangListContent.addChild(item);
                item.getComponent('cp_Card_Item').setInfo(CP_ACTION.ACTION_CHI, chiArray[i].tile, chiArray[i].otherTile)
            }
        }
    }

    //偷牌
    tou_button() {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        AudioManager.getInstance().playSFX("button_click")
        this.checkIsErrorTuoGuan()
        if (!m_cpData.gameinfo.state.get(CP_ACTION.ACTION_TOU))
            return;

        if (m_cpData.gameinfo.state.get(CP_ACTION.ACTION_TOU).length == 1) {
            var temAction = CP_ACTION.ACTION_TOU
            var tile = m_cpData.gameinfo.state.get(CP_ACTION.ACTION_TOU)[0]
            var substituteNum = 0
            var sessionId = m_cpData.getActionSessionId()
            MessageManager.getInstance().messageSend(Proto.CS_Changpai_Do_Action.MsgID.ID, { action: temAction, valueTile: tile, sessionId: sessionId, substituteNum: substituteNum });
        }
        else {
            //多杠情况需要弹选择面板
            var gangnode = this.node.getChildByName("ganginfo")
            gangnode.active = true
            let childAll = this.gangListContent.children
            childAll.forEach((childNode) => {
                if (childNode.name != "closeNode" && childNode.name != "sp_title") {
                    childNode.destroy()
                } else if (childNode.name == "sp_title") {
                    childNode.getComponent(cc.Sprite).spriteFrame = this.getMjSpriteFrame("zgcp_toupai");
                }
            })

            let touArray = m_cpData.gameinfo.state.get(CP_ACTION.ACTION_TOU)
            for (let i = 0; i < touArray.length; i++) {
                let item = cc.instantiate(this.cardItem);
                this.gangListContent.addChild(item);
                item.getComponent('cp_Card_Item').setInfo(CP_ACTION.ACTION_TOU, touArray[i])
            }
        }
    }
    btn_baoTing(event, customEventData) {
        AudioManager.getInstance().playSFX("button_click")
        this.checkIsErrorTuoGuan()
        var type = parseInt(customEventData)
        GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_CP_Baoting.MsgID.ID, { baoting: type });
    }
    //巴牌
    gang_button() {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        AudioManager.getInstance().playSFX("button_click")
        this.checkIsErrorTuoGuan()
        if (!m_cpData.gameinfo.state.get(CP_ACTION.ACTION_BA_GANG))
            return;

        if (m_cpData.gameinfo.state.get(CP_ACTION.ACTION_BA_GANG).length == 1) {
            var temAction = CP_ACTION.ACTION_BA_GANG
            var tile = m_cpData.gameinfo.state.get(CP_ACTION.ACTION_BA_GANG)[0]
            var substituteNum = 0
            var sessionId = m_cpData.getActionSessionId()
            MessageManager.getInstance().messageSend(Proto.CS_Changpai_Do_Action.MsgID.ID, { action: temAction, valueTile: tile, sessionId: sessionId, substituteNum: substituteNum });
        }
        else {
            //多杠情况需要弹选择面板
            var gangnode = this.node.getChildByName("ganginfo")
            gangnode.active = true
            let childAll = this.gangListContent.children
            childAll.forEach((childNode) => {
                if (childNode.name != "closeNode" && childNode.name != "sp_title") {
                    childNode.destroy()
                } else if (childNode.name == "sp_title") {
                    childNode.getComponent(cc.Sprite).spriteFrame = this.getMjSpriteFrame("zgcp_bapai");
                }
            })

            let baArray = m_cpData.gameinfo.state.get(CP_ACTION.ACTION_BA_GANG)
            for (let i = 0; i < baArray.length; i++) {
                let item = cc.instantiate(this.cardItem);
                this.gangListContent.addChild(item);
                item.getComponent('cp_Card_Item').setInfo(CP_ACTION.ACTION_BA_GANG, baArray[i])
            }
        }
    }

    //用于 吃 巴 偷 的牌操作按钮
    duo_CBG_click(action, tile, otherTitle) {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        var sessionId = m_cpData.getActionSessionId()
        MessageManager.getInstance().messageSend(Proto.CS_Changpai_Do_Action.MsgID.ID, { action: action, valueTile: tile, sessionId: sessionId, otherTile: otherTitle });
    }

    //理牌事件
    btnCheckResponse() {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        AudioManager.getInstance().playSFX("button_click")
        AudioManager.getInstance().playSFX("zgcp/sn_zgcp_lipai")
        if (m_cpData == null)
            return
        this.node.getChildByName("node_cardsMgr").getChildByName("player0").getComponent("SelfCardControl_Cp").handMjChange(0);
    }

    /**动画改变 */ //  吃1  碰:2, 巴:3,  偷4  胡:5,  吃来包牌:6,  天胡7  8 过 
    onAnimationPlay(event) {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        if (event.type != 8) {
            AudioManager.getInstance().playSFX("zgcp/" + event.audio)
        }
        // 收到过的消息
        if (event.type == 8) {
            m_cpData.setPGHTips(null);
            return
        }
        else if (event.type == 0 && event.seat == 0) // 托管情况下，自己胡牌需要清理一下按钮状态
        {
            //清理状态数据
            m_cpData.setPGHTips(null);
            return
        } else if (event.type == 1 || event.type == 2 || event.type == 3 || event.type == 6) {
            //如果上一次打出或者翻出的牌存在 并且等于当前吃碰巴的牌
            if (m_cpData.gameinfo.lastOutMjId > 0 && m_cpData.gameinfo.lastOutMjId < 22
                && m_cpData.gameinfo.lastOutPid != 0 && m_cpData.gameinfo.lastOutMjId == event.tile) {
                var realSeat = m_cpData.getSeatById(m_cpData.gameinfo.lastOutPid)
                if (realSeat == 0) {
                    this.node.getChildByName("node_cardsMgr").getChildByName("player" + realSeat).getComponent("SelfCardControl_Cp").showOutOrOpenCard(false);
                }
                else {
                    this.node.getChildByName("node_cardsMgr").getChildByName("player" + realSeat).getComponent("OtherCardCOntrol_Cp").showOutOrOpenCard(false);
                }
                m_cpData.gameinfo.lastOutMjId = -1
                m_cpData.gameinfo.lastOutPid = 0
            }
        }

        //let rotation = [0,90,180,270]
        this.nodeAnim.node.position = this.effectPosList[event.seat]
        this.nodeAnim.node.active = true
        //this.nodeAnim.node.rotation = rotation[event.seat]
        var effect = ["chi", "peng", "ba", "tou", "hu", "clbq", "thu"]
        this.m_isAction = true
        this.nodeAnim.setAnimation(0, effect[event.type - 1], false);
    }

    /**关闭所有动画 */
    private removEffect() {
        this.nodeAnim.node.active = false
        this.nodeToujiaAnim.node.stopAllActions()
    }

    // ---------------------------------------------------------------------------------------

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
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        if (m_cpData && m_cpData.playerInfoMap.get(0)) {
            var isTrustee = m_cpData.playerInfoMap.get(0).isTrustee
            if (!isTrustee)
                return
            MessageManager.getInstance().messageSend(Proto.CS_Trustee.MsgID.ID, { isTrustee: false });
        }
    }
    onCardBgChange(msg) {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        m_cpData.playerInfoMap.forEach((infoObj, seat) => {
            if (seat == 0) {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("SelfCardControl_Cp").onCardBgChange();
            }
            else {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("OtherCardCOntrol_Cp").onCardBgChange();
            }
        })
    }
    btn_gang_touch(event, customEventData) {
        this.node.getChildByName("ganginfo").active = false
    }
    btn_roundOver(event, customEventData) {
        UIManager.getInstance().openUI(CpRoundOver_UI, 20, () => {
            UIManager.getInstance().getUI(CpRoundOver_UI).getComponent("CpRoundOver_UI").iniView()
        })
    }
    onGameOver() {
        this.node.getChildByName("btn_roundover").active = true
    }
    private baoTingStatusChanged() {
        let m_cpData: GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType();
        if (!m_cpData.playerInfoMap.get(0) || (m_cpData.gameinfo.gameState >= GAME_STATE_CP.WAIT_CHU_PAI
            && m_cpData.gameinfo.gameState < GAME_STATE_CP.GAME_BALANCE && m_cpData.gameinfo.gameState != GAME_STATE_CP.WAIT_ACTION_AFTER_FIRSTFIRST_TOU_PAI)) {
            //已经过了这个阶段 说明玩家都已经操作了
            m_cpData.playerInfoMap.get(0).isBaoTing = true
            this.node.getChildByName("node_baoTing").active = false
            return
        }
        if (m_cpData.playerInfoMap.get(0).isBaoTing)
            this.node.getChildByName("node_baoTing").active = false
    }
}
