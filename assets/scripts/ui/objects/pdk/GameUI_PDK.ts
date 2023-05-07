import { ListenerType } from './../../../data/ListenerType';
import { GameUI_PlayerInfo_PDK } from './GameUI_PlayerInfo_PDK';
import { SCPDKCheckCardType } from './../../../data/game_pdk/SCPDKCheckCardType';
import { SCPDKCheckCanBet } from './../../../data/game_pdk/SCPDKCheckCanBet';
import { SelectTipsUI } from './../../SelectTipsUI';
import { GameUIRepeatMsgManage } from './../../GameUIRepeatMsgManage';
import { PDKCheckCanBet } from './../../../data/game_pdk/PDKCheckCanBet';
import { ThirdSelectUI } from './../../ThirdSelectUI';
import { GAME_STATE_DDZ } from './../../../data/ddz/GameInfo_DDZ';
import { GAME_TYPE,ConstValue } from './../../../data/GameConstValue';
import { CardEffect } from './CardEffect';
import { ShowRuleUI } from './../rule/ShowRuleUI';
import { ClubUI } from './../../ClubUI';
import { GameUIController } from '../../GameUIController';
import { GAME_STATE_PDK } from '../../../data/game_pdk/GameInfo_PDK';
import * as Proto from "../../../../proto/proto-min";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import { ListenerManager } from "../../../../framework/Manager/ListenerManager";
import { MessageManager } from "../../../../framework/Manager/MessageManager";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { GameManager } from "../../../GameManager";
import { StringData } from "../../../data/StringData";
import { GameApplyUI } from "../../GameApplyUI";
import { AudioManager } from "../../../../framework/Manager/AudioManager";;
import { HallUI } from "../../HallUI";
import { Utils } from "../../../../framework/Utils/Utils";
import { GameSettingUI } from '../.././GameSettingUI';
import { BaseUI } from '../../../../framework/UI/BaseUI';
import PdkGameOver_UI from './PdkGameOver_UI';
import PdkRoundOver_UI from './PdkRoundOver_UI';
import TuoGuanUI from '../../TuoGuanUI';
import { SelectTipsUI2 } from '../../SelectTipsUI2';


const { ccclass, property } = cc._decorator;

@ccclass
export class GameUI_PDK extends BaseUI {
    protected static className = "GameUI_PDK";

    @property([cc.SpriteFrame])
    spfGameBg: cc.SpriteFrame[] = [];
    @property(cc.Node)
    btnInvite: cc.Node = null;
    @property(cc.Node)
    btnThirdInvite: cc.Node = null;
    @property(cc.Node)
    btnReady: cc.Node = null;
    @property(cc.Layout)
    myCardsLayout: cc.Layout = null;
    @property(cc.Label)
    inviteTimeLabel: cc.Label = null;
    @property(cc.Label)
    jsTimer: cc.Label = null;    // 结算倒计时
    @property([cc.SpriteFrame])
    shuiyin_spf: cc.SpriteFrame[] = [];
    @property([cc.SpriteFrame])
    cardsSpf: cc.SpriteFrame[] = [];
    


    private _pdkData = null;
    private m_isOver = false
    private m_inviteTimeout = 0
    private startTime = 0 // 准备倒计时
    private readonly shuiYinMap = {210:0, 211:1, 212:2, 220:3}

    onLoad() {
        
    }

    onDataRecv() // 只有首次ui打开，加载完成才会执行该流程
    {
        this._pdkData = GameDataManager.getInstance().getDataByCurGameType();
        this.initShuiYin()
        this.initListen()
        this.initCardControl()
        this.onGameBgChange()
        this.activeCardControl()
        if (GameDataManager.getInstance().curGameType == GAME_TYPE.DDZ && this._pdkData.gameinfo.curCallSeat != -1)
            this.onDDZCurCallRoundChange({seat:this._pdkData.gameinfo.curCallSeat})
    }

    onShow() {
        this.updateOtherCardSize()
        this.updateSelfCardSize()
        this._pdkData = GameDataManager.getInstance().getDataByCurGameType();
        this.initShuiYin()
        this._pdkData.playerInfoMap.forEach((infoObj, seat)=>{
            if (seat == 0)
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("SelfCardControl_PDK").onShow(seat)
            else
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("OtherCardControl_PDK").onShow(seat)
        })
    }

    start() {
        this.updateOtherCardSize()
        this.updateSelfCardSize()
    }

    onDestroy() {
        super.onDestroy();
        this._pdkData = null;
    }

    initCardControl()
    {
        for (let i = 0; i < 4; ++i) {
            if (i == 0) {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + i).getComponent("SelfCardControl_PDK").onDataRecv();
            }
            else {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + i).getComponent("OtherCardControl_PDK").onDataRecv();
            }
        }
    }

    resetDataOnBack()// 切后台之后切回前台需要清理数据
    {
        this._pdkData = GameDataManager.getInstance().getDataByCurGameType();
        this.initShuiYin()

        this.onGameStateChanged()
        this.startTime = 0
        this.node.getChildByName("start_time").active = false;
        this.unschedule(this.loop4)
        for (let i = 0; i < 4; ++i) {
            if ( this._pdkData.playerInfoMap.get(i))
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + i).active = true;
            else
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + i).active = false;
            if (i == 0) {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + i).getComponent("SelfCardControl_PDK").resetDataOnBack();
            }
            else {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + i).getComponent("OtherCardControl_PDK").resetDataOnBack();
            }
        }
    }

    //初始化监听
    private initListen() {
        // /*———————————————————————————————服务器消息——————————————————————————————————*/
        ListenerManager.getInstance().add(Proto.S2C_CLUBLIST_RES.MsgID.ID, this, this.onEnterClubResponse);
        ListenerManager.getInstance().add(Proto.SC_DismissTable.MsgID.ID, this, this.onRoomDissmissOver);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_INVITE_JOIN_ROOM.MsgID.ID, this, this.onInviteRec);
        ListenerManager.getInstance().add(Proto.SC_StartTimer.MsgID.ID, this, this.onStartTimeRec);
        ListenerManager.getInstance().add(Proto.SC_CancelTimer.MsgID.ID, this, this.onStartTimeCancel);
        ListenerManager.getInstance().add(Proto.SC_ForceKickoutPlayer.MsgID.ID, this, this.onForceKickPlayer);
        
        ListenerManager.getInstance().add(ListenerType.pdk_start, this, this.onGameStart);
        ListenerManager.getInstance().add(ListenerType.pdk_curOperateChange, this, this.onCurOperateChanged);
        ListenerManager.getInstance().add(ListenerType.gameBgChange, this, this.onGameBgChange);
        ListenerManager.getInstance().add(ListenerType.pdk_handCardChanged, this, this.onHandCardChanged);
        ListenerManager.getInstance().add(ListenerType.pdk_outCardChanged, this, this.onOutCardChanged);
        ListenerManager.getInstance().add(ListenerType.pdk_playerNumChanged, this, this.onPlayerNumChanged);                     // 收到玩家人数改变
        ListenerManager.getInstance().add(ListenerType.pdk_dismissResponse, this, this.onRoomDissmissResponse);                     // 收到解散请求
        ListenerManager.getInstance().add(ListenerType.pdk_playerStateChanged, this, this.onPlayerStateChanged);                 // 收到玩家游戏状态改变
        ListenerManager.getInstance().add(ListenerType.operateTimeChange, this, this.onTimeChange);

    
        if (GameDataManager.getInstance().curGameType == GAME_TYPE.DDZ)
        {
            ListenerManager.getInstance().add(ListenerType.ddz_animationPlay, this, this.onAnimationPlay);
            ListenerManager.getInstance().add(ListenerType.ddz_voice, this, this.onPlayCardsVoice);
            ListenerManager.getInstance().add(ListenerType.ddz_gameState, this, this.onDDZGameStateChanged);
            ListenerManager.getInstance().add(ListenerType.ddz_gameRoundOver, this, this.onGameRoundOver);
            ListenerManager.getInstance().add(ListenerType.ddz_callLandlordRoundChange, this, this.onDDZCurCallRoundChange);
            ListenerManager.getInstance().add(ListenerType.ddz_landLordOver, this, this.onDDZlandlordOver);
            ListenerManager.getInstance().add(ListenerType.ddz_landlordVoice, this, this.onLandlordVocieRec);

        }
        else
        {
            ListenerManager.getInstance().add(ListenerType.pdk_animationPlay, this, this.onAnimationPlay);
            ListenerManager.getInstance().add(ListenerType.pdk_voice, this, this.onPlayCardsVoice);
            ListenerManager.getInstance().add(ListenerType.pdk_gameState, this, this.onGameStateChanged);
            ListenerManager.getInstance().add(ListenerType.pdk_gameRoundOver, this, this.onGameRoundOver);
        }
    
    }

    /*———————————————————————————————————————————————————服务器回调———————————————————————————————————————————————————*/
    
    /**更新所有显示 */
    public onGameStart() {
        this.m_isOver = false
        this.updateCard()
        this.unscheduleAllCallbacks()
        UIManager.getInstance().closeUI(PdkGameOver_UI)
        UIManager.getInstance().closeUI(PdkRoundOver_UI)
    }

    /**刷新所有玩家牌相关 */
    private updateCard() {
        this._pdkData.playerInfoMap.forEach((infoObj, seat)=>{
            if (seat == 0) {
            this.updatePlayerCardLayout(this._pdkData.playerInfoMap.get(0).cards.length)
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("SelfCardControl_PDK").setAll()
            }
            else {
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("OtherCardControl_PDK").setAll()
            }
        })
    }

    private onRoomDissmissResponse(msg) {
        UIManager.getInstance().openUI(GameApplyUI, 30,);
    }

    private onRoomDissmissOver(msg: any) {
        if (UIManager.getInstance().getUI(GameApplyUI) != null)
        {
            UIManager.getInstance().closeUI(GameApplyUI)
        }
        else{
            if (this._pdkData && this._pdkData.gameinfo && this._pdkData.gameinfo.curRoundOverData != null)
            {
                MessageManager.getInstance().disposeMsg();
                return
            }
        }
        this.removeEffect()
        if (this._pdkData && this._pdkData.gameinfo && this._pdkData.gameinfo.curGameOverData != null){ // 如果解散的时候有总结算数据，关闭界面之后弹出总结算
            var curGameType = GameDataManager.getInstance().curGameType
            this._pdkData.gameinfo.isDismissed = true
            if (curGameType == GAME_TYPE.DDZ)
                this._pdkData.setGameState(GAME_STATE_DDZ.GAME_CLOSE);
            else
                this._pdkData.setGameState(GAME_STATE_PDK.GAME_CLOSE);
            MessageManager.getInstance().disposeMsg();
            return
        }
        if (msg.success){
            var uiType = -1
            if (this._pdkData && !this._pdkData.gameinfo.clubId)
                uiType = -1
            else 
                uiType = parseInt(cc.sys.localStorage.getItem("curClubType")) ;
            if (uiType != -1)
            {
                MessageManager.getInstance().messageSend(Proto.C2S_CLUBLIST_REQ.MsgID.ID, {type: uiType});
            }
            else
                UIManager.getInstance().openUI(HallUI, 1, () => {
                    GameUIController.getInstance().closeCurGameUI()
                    GameManager.getInstance().openWeakTipsUI(StringData.getString(10036))
                    UIManager.getInstance().closeUI(PdkGameOver_UI)
                    UIManager.getInstance().closeUI(PdkRoundOver_UI)
                    UIManager.getInstance().closeUI(TuoGuanUI)
                    UIManager.getInstance().closeUI(CardEffect)  // 游戏结束时关闭特效界面
                    MessageManager.getInstance().disposeMsg();
                });
            
        }
        MessageManager.getInstance().disposeMsg();
    }

    private onEnterClubResponse(msg: any) {
        this.removeEffect()
        GameDataManager.getInstance().clubData = msg.clubs;
        //发完消息转场
        var uiType = parseInt(cc.sys.localStorage.getItem("curClubType")) ;
        UIManager.getInstance().openUI(ClubUI, 0, () => {
            GameUIController.getInstance().closeCurGameUI()
            UIManager.getInstance().closeUI(GameApplyUI)
            UIManager.getInstance().closeUI(PdkGameOver_UI)
            UIManager.getInstance().closeUI(PdkRoundOver_UI)
            UIManager.getInstance().closeUI(TuoGuanUI)
            UIManager.getInstance().closeUI(CardEffect)  // 游戏结束时关闭特效界面
            UIManager.getInstance().getUI(ClubUI).getComponent("ClubUI").setOpenType(uiType);
            MessageManager.getInstance().disposeMsg();
        });
    }

    private onPlayerNumChanged(msg){
        if (msg.tag == "remove")
        {
            // 自己离开房间
            if (msg.playerSeat == 0)
            {
                this.removeEffect()
                var uiType = -1
                if (!this._pdkData.gameinfo.clubId)
                    uiType = -1
                else 
                    uiType = parseInt(cc.sys.localStorage.getItem("curClubType")) ;
                if (uiType != -1)
                {
                    MessageManager.getInstance().messageSend(Proto.C2S_CLUBLIST_REQ.MsgID.ID, {type: uiType});
                }
                else
                    UIManager.getInstance().openUI(HallUI, 1, () => {
                        GameUIController.getInstance().closeCurGameUI()
                        UIManager.getInstance().closeUI(GameApplyUI)
                        UIManager.getInstance().closeUI(PdkRoundOver_UI)
                        UIManager.getInstance().closeUI(PdkGameOver_UI)
                        UIManager.getInstance().closeUI(TuoGuanUI)
                        UIManager.getInstance().closeUI(CardEffect)  // 游戏结束时关闭特效界面
                        MessageManager.getInstance().disposeMsg();
                    });
            }
            else
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + msg.playerSeat).active = false
        }
        else{
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + msg.playerSeat).active = true
        }
        this.btnInvite.active = this._pdkData.playerInfoMap.size != this._pdkData.getCurTypePlayerNum();
        this.btnThirdInvite.active = false;
        // if (this._pdkData.gameinfo.clubId != 0 && this._pdkData.playerInfoMap.size != this._pdkData.getCurTypePlayerNum())
        //     this.btnThirdInvite.active = true;
        // else
        //     this.btnThirdInvite.active = false;
    }

    private onPlayerStateChanged(msg)
    {
        // 如果是本人准备
        if(msg.type == "ready"){
            this.btnReady.active = !this._pdkData.playerInfoMap.get(0).isready;
        }
    }

    private initShuiYin() {

        var curGameType = GameDataManager.getInstance().curGameType
        var shuiYinIdx = this.shuiYinMap[curGameType]
        if (typeof shuiYinIdx != "number")
            return
        this.node.getChildByName("shuiyin").getComponent(cc.Sprite).spriteFrame = this.shuiyin_spf[shuiYinIdx]
        this.node.getChildByName("shuiyin").active = true
    }

    private onTimeChange(msg)
    {
        if (this._pdkData == null)
            return;
        var time = this._pdkData.gameinfo.time
        var state = 4
        if (GameDataManager.getInstance().curGameType == GAME_TYPE.DDZ)
            state = 5
        if (this._pdkData.gameinfo.gameState == state && time > 0)
        {
            this.jsTimer.string = (this._pdkData.gameinfo.time - 2) + "s"
            this.schedule(this.loop3, 1);
        }

    }

    private loop3() {
        this.jsTimer.string = (this._pdkData.gameinfo.time - 2) + "s"
        if(this._pdkData.gameinfo.time - 2 <= 0)
        {
            if (!UIManager.getInstance().getUI(PdkRoundOver_UI))
                this.button_continue()
            else
                UIManager.getInstance().getUI(PdkRoundOver_UI).getComponent("PdkRoundOver_UI").continue_button()
            this.unschedule(this.loop3)
        }
    }


     /**手牌变化 */
     private onHandCardChanged(msg) {
        if (msg.seat == 0) {
            this.updatePlayerCardLayout(this._pdkData.playerInfoMap.get(0).cards.length)
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + msg.seat).getComponent("SelfCardControl_PDK").handCardsChange();
        }
        else {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + msg.seat).getComponent("OtherCardControl_PDK").handCardsChange();
        }
    }

    /**出牌变化 */
    private onOutCardChanged(msg) {
        if (msg.seat == 0) {
            this.node.getChildByName("game_button").active = false
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + msg.seat).getComponent("SelfCardControl_PDK").outCardsChange();
        }
        else {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + msg.seat).getComponent("OtherCardControl_PDK").outCardsChange();
        }
    }

    private onGameRoundOver()
    {
        this.m_isOver = true
        var delaySecond = 1
        if(GameDataManager.getInstance().curGameType == GAME_TYPE.DDZ)
        {
            var isPlayAni = this._pdkData.checkSpring() // 检测春天
            if (isPlayAni)
            {
                var msg = {
                    realSeat:0,
                    type:22
                }
                UIManager.getInstance().openUI(CardEffect, 5, () => {
                    UIManager.getInstance().getUI(CardEffect).getComponent("CardEffect").playeEffect(msg)
                })
                delaySecond = 2
            }
        }
        var info = this._pdkData.gameinfo.curRoundOverData;
        for (var balanceInfo of info.playerBalance)
        {
            var seat = this._pdkData.getRealSeatByRemoteSeat(balanceInfo.chairId)
            if (seat != 0 && balanceInfo.handCards.length > 0)
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getComponent("OtherCardControl_PDK").showHandCardsOnOver(balanceInfo.handCards)
        }
        if (info.leftCards && info.leftCards.length > 0) {
            this.node.getChildByName("left_cards").active = true;
            this.initLeftCards(info.leftCards)
        }
        // 收到单局结算后，先延迟两秒才打开界面
        var action_1 = cc.delayTime(delaySecond);
        var action_2 = cc.callFunc(function () {
            if (this._pdkData && this._pdkData.gameinfo)
            {
                if (GameDataManager.getInstance().curGameType == GAME_TYPE.DDZ)
                    this._pdkData.setGameState(GAME_STATE_DDZ.GAME_BALANCE)
                else
                    this._pdkData.setGameState(GAME_STATE_PDK.GAME_BALANCE)

                UIManager.getInstance().openUI(PdkRoundOver_UI, 20, () => { 
                    UIManager.getInstance().getUI(PdkRoundOver_UI).getComponent("PdkRoundOver_UI").commonInitView();
                    this.removeEffect(); })
            }
           
        }.bind(this));
        this.node.runAction(cc.sequence(action_1, action_2));
    }
 
    // 加载第三方牌
    initLeftCards(cards) {
        cards = cards.sort(function (a, b) {return a - b})
        Utils.pdkWenDingSort(cards)
        for (var i = 0; i < cards.length; i++)
        {
            var textureId = Utils.getPdkColorAndMjTextureId(cards[i])
            var cardNode = this.node.getChildByName("left_cards").getChildByName("cards").getChildByName("card"+i)
            Utils.loadTextureFromLocal(cardNode.getComponent(cc.Sprite), "/cards/card_s_" + textureId);
            cardNode.active = true
        }
        
    }
   
    /**游戏状态改变 */
    private onGameStateChanged() {
        if (this._pdkData.gameinfo.gameState == GAME_STATE_PDK.PER_BEGIN || this._pdkData.gameinfo.gameState == 0) {
            if (this._pdkData.playerInfoMap.get(0) == undefined)
                return;
            this.unscheduleAllCallbacks()
            this.node.getChildByName("node_begin").active = true
            this.node.getChildByName("game_button").active = false
            this.node.getChildByName("btn_jiesuan").active = false
            this.node.getChildByName("btn_continue").active = false
            this.node.getChildByName("left_cards").active = false;
            this.inviteTimeLabel.string = "一键邀请"
            this.node.getChildByName("node_begin").getChildByName("btn_club_invite").getComponent(cc.Button).interactable = true;
            this.btnThirdInvite.active = false;
            this.jsTimer.node.active = false
            if (this._pdkData.gameinfo.mBTableStarted) {
                this.btnInvite.active = false;
            }
            else {
                this.btnInvite.active = false;
                // this.btnThirdInvite.active = false
                if (this._pdkData.gameinfo.clubId != 0 && this._pdkData.playerInfoMap.size != this._pdkData.getCurTypePlayerNum())
                {
                    this.btnInvite.active = true;
                    // this.btnThirdInvite.active = true;
                }
            }
            this.btnReady.active = !this._pdkData.playerInfoMap.get(0).isready;
            this.removeEffect();
            this.node.getChildByName("node_cardsMgr").active = false
            this.checkAutoReady() // 检测是否需要自动准备
        }
        else if (this._pdkData.gameinfo.gameState == GAME_STATE_PDK.GAME_BALANCE) {
            this.node.getChildByName("node_begin").active = false
            this.node.getChildByName("game_button").active = false
            if (!UIManager.getInstance().getUI(TuoGuanUI))
            {
                this.node.getChildByName("btn_continue").active = true
                this.node.getChildByName("btn_jiesuan").active = true
                this.onTimeChange(null)
                this.jsTimer.node.active = true
            }
            this.removeEffect()
        }
        else if (this._pdkData.gameinfo.gameState == GAME_STATE_PDK.GAME_CLOSE)
        {
            this.unscheduleAllCallbacks()
            UIManager.getInstance().openUI(PdkGameOver_UI, 20, () => {
                UIManager.getInstance().closeUI(SelectTipsUI);
                UIManager.getInstance().closeUI(SelectTipsUI2);
                UIManager.getInstance().closeUI(GameSettingUI);
                UIManager.getInstance().closeUI(ShowRuleUI);
            })
        }
        else if (this._pdkData.gameinfo.gameState == GAME_STATE_PDK.GAME_STATE_QIEPAI || this._pdkData.gameinfo.gameState == GAME_STATE_PDK.GAME_STATE_GAME) {
            this.node.getChildByName("node_begin").active = false
            this.node.getChildByName("node_cardsMgr").active = true
            this.node.getChildByName("btn_continue").active = false
            this.node.getChildByName("btn_jiesuan").active = false
            this.node.getChildByName("left_cards").active = false;
            this.jsTimer.node.active = false
            this._pdkData.playerInfoMap.forEach((infoObj, seat)=>{
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).active = infoObj != null
            })
        }
    }

    /**游戏状态改变 */
    private onDDZGameStateChanged() {
        if (this._pdkData.gameinfo.gameState == GAME_STATE_DDZ.PER_BEGIN || this._pdkData.gameinfo.gameState == 0) {
            this.node.getChildByName("node_begin").active = true
            this.node.getChildByName("game_button").active = false
            this.node.getChildByName("rob_button").active = false
            this.node.getChildByName("btn_jiesuan").active = false
            this.node.getChildByName("btn_continue").active = false
            this.node.getChildByName("left_cards").active = false;
            this.inviteTimeLabel.string = "一键邀请"
            this.node.getChildByName("node_begin").getChildByName("btn_club_invite").getComponent(cc.Button).interactable = true;
            this.jsTimer.node.active = false
            this.btnThirdInvite.active = false;
            if (this._pdkData.gameinfo.mBTableStarted) {
                this.btnInvite.active = false;
            }
            else {
                this.btnInvite.active = false;
                // this.btnThirdInvite.active = false
                if (this._pdkData.gameinfo.clubId != 0 && this._pdkData.playerInfoMap.size != 3)
                {
                    this.btnInvite.active = true;
                    // this.btnThirdInvite.active = true;
                }
            }
            this.btnReady.active = !this._pdkData.playerInfoMap.get(0).isready;

            this.removeEffect();
            this.node.getChildByName("node_cardsMgr").active = false
            this.checkAutoReady() // 检测是否需要自动准备
        }
        else if (this._pdkData.gameinfo.gameState > GAME_STATE_DDZ.PER_BEGIN && this._pdkData.gameinfo.gameState <= GAME_STATE_DDZ.GAME_CLOSE) {
            this.node.getChildByName("node_begin").active = false
            this.node.getChildByName("node_cardsMgr").active = true
            this.node.getChildByName("btn_continue").active = false
            this.node.getChildByName("btn_jiesuan").active = false
            this.jsTimer.node.active = false
            if (this._pdkData.gameinfo.gameState == GAME_STATE_DDZ.GAME_STATE_CALL && this._pdkData.gameinfo.curCallSeat == 0)
                this.node.getChildByName("rob_button").active = true
            else
                this.node.getChildByName("rob_button").active = false
            this._pdkData.playerInfoMap.forEach((infoObj, seat)=>{
                this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).active = infoObj != null
            })
            if (this._pdkData.gameinfo.gameState == GAME_STATE_DDZ.GAME_CLOSE)
            {
                UIManager.getInstance().openUI(PdkGameOver_UI, 20, () => {
                    UIManager.getInstance().closeUI(GameSettingUI);
                    UIManager.getInstance().closeUI(SelectTipsUI);
                    UIManager.getInstance().closeUI(SelectTipsUI2);
                    UIManager.getInstance().closeUI(ShowRuleUI);
                })
            }
            else if (this._pdkData.gameinfo.gameState == GAME_STATE_DDZ.GAME_BALANCE)
            {            
                this.node.getChildByName("node_begin").active = false
                this.node.getChildByName("game_button").active = false
                if (!UIManager.getInstance().getUI(TuoGuanUI))
                {
                    this.node.getChildByName("btn_continue").active = true
                    this.jsTimer.node.active = true;
                    this.node.getChildByName("btn_jiesuan").active = true
                    this.onTimeChange(null)
                }
                this.removeEffect()
            }
            else
            {
                this.node.getChildByName("left_cards").active = false;
            }
        }
    }



    private checkAutoReady()
    {
        if (UIManager.getInstance().getUI(TuoGuanUI))
            return
        var isAutoReady = false
        if (!this._pdkData.playerInfoMap.get(0).isready && this._pdkData.gameinfo.rule.option && !this._pdkData.gameinfo.rule.option.hand_ready)
            isAutoReady = true
        else if (this._pdkData.gameinfo.rule.trustee)// 存在托管时
        {
            // 全托管，半托管时，除开第一局需要手动准备，其它时候需要自动准备
            if ((this._pdkData.gameinfo.rule.trustee.type_opt == 0 || this._pdkData.gameinfo.rule.trustee.type_opt == 1) && this._pdkData.gameinfo.curRound >= 1) 
                isAutoReady = true
        }

        if (isAutoReady)
            MessageManager.getInstance().messageSend(Proto.CS_Ready.MsgID.ID, {});

    }
 
    /**出牌本地回调 播放动画  type : 1：不要 2：管别人牌 3：轮到自己出牌*/
    private onPlayCardsVoice(msg) {
        //检测是否出牌
        //牌型 1:单张 2:对子 3:顺子 4:连对 5:三不带 6:三带一 7:三带二 8:四带二 9:四带三 10:飞机 11:飞机带单 12飞机带2张 13:炸弹
        var type2Voice = {
            3:"shunzi", 4:"liandui", 6:"sandaiyi", 7: "sandaier",10:"feiji", 11:"feiji", 12:"feiji", 8:"sidaier", 13:"zhadan"
        ,9:"sidaisan", 14: "sidaier", 15:"feiji"}
        var voiceStr = ""
        var sex = 1
        if(this._pdkData.playerInfoMap.get(msg.seat))
            sex = this._pdkData.playerInfoMap.get(msg.seat).sex
        if (msg.type == 1) {
            var num = Utils.reandomNumBoth(1,4)
            if (sex == 1)
                voiceStr = "male_voice/buyao" + num
            else
                voiceStr = "female_voice/buyao" + num
        }
        else if (msg.type == 2) {
            if (msg.oType.type != 1 && msg.oType.type != 2 && msg.oType.type != 5 && !type2Voice[msg.oType.type])
                return
            if (sex == 1) {
                if (msg.oType.type == 1 || msg.oType.type == 2)
                    voiceStr = "male_voice/man_" + msg.oType.type + "_" + Utils.getPdkCardValue(msg.cards[0])
                else if (msg.oType.type == 5)
                    voiceStr = "male_voice/man_" + 3 + "_" + Utils.getPdkCardValue(msg.cards[0])
                else if (msg.oType.type == 13)
                    voiceStr = "male_voice/" + type2Voice[msg.oType.type]
                else {
                    var num = Utils.reandomNumBoth(1,3)
                    voiceStr = "male_voice/dani" + num
                }
            }
            else {
                if (msg.oType.type == 1 || msg.oType.type == 2)
                    voiceStr = "female_voice/female_" + msg.oType.type + "_" + Utils.getPdkCardValue(msg.cards[0])
                else if (msg.oType.type == 5)
                    voiceStr = "female_voice/female_" + 3 + "_" + Utils.getPdkCardValue(msg.cards[0])
                else if (msg.oType.type == 13)
                    voiceStr = "female_voice/" + type2Voice[msg.oType.type]
                else {
                    var num = Utils.reandomNumBoth(1,3)
                    voiceStr = "female_voice/dani" + num
                }
            }
            AudioManager.getInstance().playSFX("chupai")
        }
        else // type == 3
        {
            if (msg.oType.type != 1 && msg.oType.type != 2 && msg.oType.type != 5 && !type2Voice[msg.oType.type])
                return
            if (sex == 1) {
                if (msg.oType.type == 1 || msg.oType.type == 2)
                    voiceStr = "male_voice/man_" + msg.oType.type + "_" + Utils.getPdkCardValue(msg.cards[0])
                else if (msg.oType.type == 5)
                    voiceStr = "male_voice/man_" + 3 + "_" + Utils.getPdkCardValue(msg.cards[0])
                else
                    voiceStr = "male_voice/" + type2Voice[msg.oType.type]
            }
            else {
                if (msg.oType.type == 1 || msg.oType.type == 2)
                    voiceStr = "female_voice/female_" + msg.oType.type + "_" + Utils.getPdkCardValue(msg.cards[0])
                else if (msg.oType.type == 5)
                    voiceStr = "female_voice/female_" + 3 + "_" + Utils.getPdkCardValue(msg.cards[0])
                else {
                    voiceStr = "female_voice/" + type2Voice[msg.oType.type]
                }
            }
            AudioManager.getInstance().playSFX("chupai")
        }
        AudioManager.getInstance().playSFX(voiceStr)
    }

    onLandlordVocieRec(msg)
    {
        var action2Voice = {
            "-4":"bujiao","-3":"buqiang","1":"ScoreOrder1","2":"ScoreOrder2","3":"ScoreOrder3","-2":"jiaodizhu","-1":"qiangdizhu"
        }
        var voiceStr = ""
        if (this._pdkData.playerInfoMap.get(msg.seat).sex == 1)
            voiceStr = "male_voice/" + action2Voice[msg.action.toString()]
        else
            voiceStr = "female_voice/" + action2Voice[msg.action.toString()]
        AudioManager.getInstance().playSFX(voiceStr)
        
    }


    onCurOperateChanged(msg) {
        var curseat = this._pdkData.getSeatById(msg.id);
        this.node.getChildByName("game_button").active = curseat == 0 // 轮到我出牌了
        this.node.getChildByName("game_button").stopAllActions()
        if (curseat == 0) // 如果是自己，那么需要检测按钮
        {
            GameUIRepeatMsgManage.getInstance().clearMsgLimitMap()
            var tipsActive = false
            var outCardActive = false
            var ybqActive = false
            var byActive = false
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + 0).getComponent("SelfCardControl_PDK").checkCanBetMask();
            if (this._pdkData.gameinfo.lastOutSeat == -1 || this._pdkData.gameinfo.lastOutSeat == 0)
            {
                outCardActive = true
            }
            else if (this._pdkData.gameinfo.curTipsCardsArray.length != 0)
            {
                tipsActive = true
                outCardActive = true
                var mustDiscard = this._pdkData.gameinfo.rule.play.must_discard
                if (GameDataManager.getInstance().curGameType == GAME_TYPE.SCPDK)
                    mustDiscard = true
                byActive =  !mustDiscard// 如果是必须出牌, 不显示不要
            }
            else
                ybqActive = true
            this.node.getChildByName("game_button").getChildByName("btn_ybq").active = ybqActive
            this.node.getChildByName("game_button").getChildByName("btn_by").active = byActive
            this.node.getChildByName("game_button").getChildByName("btn_ts").active = tipsActive
            this.node.getChildByName("game_button").getChildByName("btn_cp").active = outCardActive
            if (outCardActive && !UIManager.getInstance().getUI(TuoGuanUI)) // 能够出牌且当前只剩下一手牌,切没有被托管，自动出牌
            {
                var outcards = this._pdkData.playerInfoMap.get(0).cards
                if (GameDataManager.getInstance().curGameType != GAME_TYPE.SCPDK && PDKCheckCanBet.checkHaveBoom(outcards))
                    return
                if (GameDataManager.getInstance().curGameType == GAME_TYPE.SCPDK && SCPDKCheckCanBet.checkHaveBoom(outcards))
                    return
                var auto = false
                if (tipsActive && this._pdkData.gameinfo.curTipsCardsArray.length == 1 && this._pdkData.gameinfo.curTipsCardsArray[0].length == outcards.length)
                    auto = true
                else
                {
                    if(!tipsActive && typeof(this._pdkData.checkSelctCardsVaild(outcards)) != "number") // 轮到自己大牌
                        auto = true
                }
                if (!auto)
                    return
                var action0 = cc.delayTime(0.5);
                var action1 = cc.callFunc(function () {
                    if (this._pdkData.gameinfo.curOperateId != this._pdkData.playerInfoMap.get(0).id)
                        return
                    this.sendDisCardAction(outcards, "auto_card")
                }.bind(this))
                this.node.getChildByName("game_button").runAction(cc.sequence(action0,action1));
            }
        }
        else
        {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + 0).getComponent("SelfCardControl_PDK").setNoCanBetCards(false)
        }
           
    }

    private onGameBgChange() {

        var bgid = cc.sys.localStorage.getItem("pdkBgId");
        if (bgid === undefined || bgid === null)
            bgid = 0;
        this.node.getChildByName("sp_game_ddz_bg").getComponent(cc.Sprite).spriteFrame = this.spfGameBg[bgid];
    }

    private removeEffect()
    {
        var effectUI = UIManager.getInstance().getUI(CardEffect)
        if (effectUI != null)
            effectUI.getComponent("CardEffect").removeEffect()
    }

    onAnimationPlay(msg)
    {
        UIManager.getInstance().openUI(CardEffect, 5, () => {
            UIManager.getInstance().getUI(CardEffect).getComponent("CardEffect").playeEffect(msg, GameDataManager.getInstance().curGameType)
        })
    }

    // 该函数用于首次加载游戏时激活cardcontrol节点，防止进桌子直接退出，再进游戏时cardcontrol节点没有调用destroy导致的泄露
    activeCardControl()
    {
        this.node.getChildByName("node_cardsMgr").active = true
        for (var seat = 0; seat < 4; ++seat)
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).active = true
            
        this.node.getChildByName("node_cardsMgr").active = false
        for (var seat = 0; seat < 4; ++seat)
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).active = false
    }

    updatePlayerCardLayout(cardNum)
    {
        var parentSize = this.node.getContentSize()
        var addSize = parentSize.width - ConstValue.SCREEN_W
        var cardWith = 186
        if(addSize > 250)
            cardWith = 193.8
        var width = this.node.getContentSize().width
        if (cardNum < 15)
            cardNum = 15
        var spacing = cardWith - (width - cardWith) /(cardNum - 1) 
        if (this.myCardsLayout.spacingX == spacing)
            return
        this.myCardsLayout.spacingX = -1*spacing
        this.myCardsLayout.updateLayout()
    }

    updateOtherCardSize()
    {
        var parentSize = this.node.getContentSize()
        var addSize = parentSize.width - ConstValue.SCREEN_W
        if(addSize>250)
        {
            this.node.getChildByName("node_cardsMgr").getChildByName("player1").getChildByName("outcards").scale = 1.3
            this.node.getChildByName("node_cardsMgr").getChildByName("player1").getChildByName("outcards_10").scale = 1.3
            this.node.getChildByName("node_cardsMgr").getChildByName("player2").getChildByName("outcards").scale = 0.9
            this.node.getChildByName("node_cardsMgr").getChildByName("player3").getChildByName("outcards").scale = 1.3
            this.node.getChildByName("node_cardsMgr").getChildByName("player3").getChildByName("outcards_10").scale = 1.3
        }
    }

    updateSelfCardSize() {
        
        var parentSize = this.node.getContentSize()
        var addSize = parentSize.width - ConstValue.SCREEN_W
        if(addSize>250)
        {
            var cardsNode = this.node.getChildByName("node_cardsMgr").getChildByName("player0").getChildByName("cards")
            for (var child of cardsNode.children)
            {
                child.scale = 1.25
            }
        }
    }

    private loop2() {
        if (this.m_inviteTimeout > 0)
        {
            this.m_inviteTimeout -= 1
            this.inviteTimeLabel.string =  "已邀请" + this.m_inviteTimeout + "s"
        }
        else
        {
            this.unschedule(this.loop2)
            this.inviteTimeLabel.string = "一键邀请"
            this.node.getChildByName("node_begin").getChildByName("btn_club_invite").getComponent(cc.Button).interactable = true;
        }
    }

    private onInviteRec(msg)
    {
        if (msg.result != 0)
        {
            GameManager.getInstance().openWeakTipsUI(StringData.getString(msg.result));
        }
        this.unscheduleAllCallbacks()
        this.m_inviteTimeout = msg.timeout
        this.inviteTimeLabel.string =  "已邀请" + this.m_inviteTimeout + "s"
        this.node.getChildByName("node_begin").getChildByName("btn_club_invite").getComponent(cc.Button).interactable = false;
        this.schedule(this.loop2, 1);
        MessageManager.getInstance().disposeMsg();
    }

    private onStartTimeRec(msg)
    {
        this.startTime = msg.leftTime
        this.node.getChildByName("start_time").active = true;
        this.node.getChildByName("start_time").getComponent(cc.Label).string = "准备倒计时："+this.startTime+"s"
        this.schedule(this.loop4, 1);
        MessageManager.getInstance().disposeMsg();

    }

    private onStartTimeCancel(msg)
    {
        this.startTime = 0
        this.node.getChildByName("start_time").active = false;
        this.unschedule(this.loop4)
        MessageManager.getInstance().disposeMsg();
    }

    private loop4() {
        this.startTime -= 1
        this.node.getChildByName("start_time").getComponent(cc.Label).string = "准备倒计时："+this.startTime+"s"
        if(this.startTime <= 0)
        {
            this.unschedule(this.loop4)
            this.node.getChildByName("start_time").active = false;
        }
    }

    // 收到切后台的消息
    public onEventHideRec()
    {
        this.unscheduleAllCallbacks() // 停止定时器
        this.node.getChildByName("rob_button").active = false
        this.node.getChildByName("node_begin").active = false
        this.node.getChildByName("game_button").active = false
        this.node.getChildByName("btn_continue").active = false
        this.node.getChildByName("btn_jiesuan").active = false
        this.node.stopAllActions()
        this.node.getChildByName("game_button").stopAllActions()
        this.jsTimer.node.active = false;
        UIManager.getInstance().closeUI(GameApplyUI)
        UIManager.getInstance().closeUI(PdkGameOver_UI)
        UIManager.getInstance().closeUI(PdkRoundOver_UI)
        UIManager.getInstance().closeUI(GameSettingUI);
        this._pdkData = null
    }
    
    private onForceKickPlayer(msg)
    {
        GameManager.getInstance().openWeakTipsUI("踢出玩家成功");
        MessageManager.getInstance().disposeMsg();
    }

    private sendDisCardAction(outcards, type = "auto_card")
    {
        var result = this._pdkData.checkSelctCardsVaild(outcards)
        if (typeof(result) === "number")
        {
            if (type == "hand_card")
                GameManager.getInstance().openWeakTipsUI(StringData.getString(result));
            return
        }
        var msg = null
        if (result != null && result.replace)
        {
            var replaceList = []
            var laizi = this._pdkData.laiZi
        for (var cardId of outcards)
            {
                if (Utils.getPdkCardValue(cardId) == laizi && result.replace.length > 0)
                    replaceList.push(result.replace.pop()+80) // 发癞子的特殊花色
            }
            msg = {action: 2,cards: outcards, laiziReplace:replaceList}
        }
        else
        {
            msg = {action: 2,cards: outcards}
        }
        if (outcards.length != 0)
        {
            if (GameDataManager.getInstance().curGameType == GAME_TYPE.DDZ)
                GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_DdzDoAction.MsgID.ID, msg);
            else
                GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_PdkDoAction.MsgID.ID, msg);
        }
    }

      // 出现错误的托管情况时，如果玩家点击了任意游戏按钮则取消托管
      checkIsErrorTuoGuan(){
        if (this._pdkData && this._pdkData.playerInfoMap.get(0))
        {
            var isTrustee = this._pdkData.playerInfoMap.get(0).isTrustee
            if (!isTrustee)
                return
            MessageManager.getInstance().messageSend(Proto.CS_Trustee.MsgID.ID, {isTrustee: false});
        }
    }

    getCardSpriteFrame(cardId)
    {
        if (cardId < this.cardsSpf.length)
            return this.cardsSpf[cardId]
        else
            return null
    }

    // /*——————————————————————————————————按钮事件————————————————————————————————————*/
    private button_invite_club() {
        AudioManager.getInstance().playSFX("button_click")
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_INVITE_JOIN_ROOM.MsgID.ID, {clubId: this._pdkData.gameinfo.clubId});
    }

    private button_third_invite() {
        AudioManager.getInstance().playSFX("button_click")
        var roomId = this._pdkData.gameinfo.roomId
        var type = "joinroom"
        var id = GameDataManager.getInstance().userInfoData.userId
        var para = {type : type, room: roomId, guid: id}
        UIManager.getInstance().openUI(ThirdSelectUI, 98, () => {
            UIManager.getInstance().getUI(ThirdSelectUI).getComponent("ThirdSelectUI").initPara(para);
        })
    }

    /**准备按钮 */
    private buttonReady() {
        AudioManager.getInstance().playSFX("button_click")
        GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_Ready.MsgID.ID, {});
    }

    /**出牌 */
    private out_cards_button(event) {
        AudioManager.getInstance().playSFX("button_click")
        this.checkIsErrorTuoGuan()
        //得到当前出牌的数据
        if (this._pdkData == null)
        {
            GameManager.getInstance().handReconnect()
            return;
        }
        var outcards = this.node.getChildByName("node_cardsMgr").getChildByName("player" + 0).getComponent("SelfCardControl_PDK").getUpCards();
        if (GameDataManager.getInstance().curGameType == GAME_TYPE.SCPDK && this._pdkData.laiZi != 0)
        {
            var duoXuanList = SCPDKCheckCardType.getMultiCardsSelect(outcards, this._pdkData.laiZi,{laizi:Utils.getLaiZiList(outcards, this._pdkData.laiZi)})
            if (duoXuanList.length > 0)
            {
                UIManager.getInstance().getUI(GameUI_PlayerInfo_PDK).getComponent("GameUI_PlayerInfo_PDK").updateDuanXuanView(duoXuanList)
                return
            }
        }
        this.sendDisCardAction(outcards,"hand_card")
    }
    
    //不要按钮
    private no_out_button(event) {
        AudioManager.getInstance().playSFX("button_click")
        this.checkIsErrorTuoGuan()
        var resultNum = this._pdkData.checkNoOutValid()
        if (resultNum != 0)
        {
            var str = "操作错误"
            if (resultNum == 2)
                str = "操作不符合规则报单出最大"
            GameManager.getInstance().openWeakTipsUI(str);
            return
        }
        this.node.getChildByName("node_cardsMgr").getChildByName("player" + 0).getComponent("SelfCardControl_PDK").setCardsReset();
        if (GameDataManager.getInstance().curGameType == GAME_TYPE.DDZ)
            GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_DdzDoAction.MsgID.ID, {action: 1,});
        else
            GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_PdkDoAction.MsgID.ID, {action: 1,});
    }

    //提示按钮
    private tips_button() {
        AudioManager.getInstance().playSFX("button_click")
        this.checkIsErrorTuoGuan()
        this._pdkData.setCurTipsOutCards();
    }

    /**设置按钮 */
    private button_set() {
        AudioManager.getInstance().playSFX("button_click")
        this.checkIsErrorTuoGuan()
        UIManager.getInstance().openUI(GameSettingUI, 20);
    }
    /**表情按钮 */
    private button_chat() {
        AudioManager.getInstance().playSFX("button_click")
        this.checkIsErrorTuoGuan()
        // UIManager.getInstance().openUI(GameChatUI, 2);
    }

    // 结算界面
    private button_jiesuan()
    {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().openUI(PdkRoundOver_UI, 20, () => { 
            UIManager.getInstance().getUI(PdkRoundOver_UI).getComponent("PdkRoundOver_UI").commonInitView();
        })
    }

    private button_continue()
    {
        AudioManager.getInstance().playSFX("button_click")
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
        if (gameData == null)
        {
            GameManager.getInstance().handReconnect()
            return
        }
        gameData.cleanRoundOver();
        if(GameDataManager.getInstance().curGameType == GAME_TYPE.DDZ){
            if (gameData.gameinfo.curGameOverData == null)
                gameData.setGameState(GAME_STATE_DDZ.PER_BEGIN);
            else 
                gameData.setGameState(GAME_STATE_DDZ.GAME_CLOSE);
        }
        else
        {
            if (gameData.gameinfo.curGameOverData == null)
                gameData.setGameState(GAME_STATE_PDK.PER_BEGIN);
            else 
                gameData.setGameState(GAME_STATE_PDK.GAME_CLOSE);
        }
    }

    //-------------------------------------------斗地主-----------------------------

    // 收到叫地主轮次改变
    onDDZCurCallRoundChange(msg)
    {
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
        if (msg.seat == 0) // 抢地主阶段轮到自己
        {
            this.node.getChildByName("rob_button").active = true
            var btn1fen = false
            var btn2fen = false
            var btn3fen = false
            var btnbj = false // 不叫
            var btnbq = false // 不抢
            var btnjdz = false // 叫地主
            var btnqdz = false // 抢地主
            var landlordInfo = this._pdkData.gameinfo.landlordInfo
            var isCallScore = this._pdkData.gameinfo.rule.play.call_score
            var isMustCall = this._pdkData.gameinfo.rule.play.san_da_must_call
            var playerNum = gameData.getCurTypePlayerNum()
            var isFirstTurn = false
            if (playerNum == 3 && landlordInfo[0] == 0 && landlordInfo[1] == 0 && landlordInfo[3] == 0)
                isFirstTurn = true
            else if (playerNum == 2 && landlordInfo[0] == 0 && landlordInfo[2] == 0)
                isFirstTurn = true
            if (isFirstTurn) // 首轮
            {
                var a = []
                
                if (isCallScore)
                {
                    btn1fen = true
                    btn2fen = true
                    btn3fen = true
                    btnbj = true
                    btnjdz = false
                    btnqdz = false
                }
                else
                {
                    btnbj = true
                    btnjdz = true
                }
            }
            else // 次轮
            {
                if (isCallScore) // 叫分模式
                {
                    btn1fen = true
                    btn2fen = true
                    btn3fen = true
                    for (var seat of [0,1,2,3])
                    {
                        if (landlordInfo[seat] > 0)
                            btn1fen = false
                        if (landlordInfo[seat] > 1)
                            btn2fen = false
                        if (landlordInfo[seat] > 2)
                            btn3fen = false
                    }
                    btnbj = true
                    btnbq = false
                    btnjdz = false
                    btnqdz = false
                }
                else // 叫地主模式
                {
                    btnbj = true
                    btnbq = false
                    btnjdz = true
                    btnqdz = false
                    for (var seat of [0,1,2,3])
                    {
                        if (landlordInfo[seat] == -2){
                            btnbj = false
                            btnbq = true
                            btnjdz = false
                            btnqdz = true
                        }
                    }
                }
            }
            var isMustCall = this._pdkData.checkMustCall()
            if (isMustCall)
            {
                if (isCallScore)
                {
                    btn1fen = false
                    btn2fen = false
                    btn3fen = true
                }
                if (btnbj)
                    btnbj = false
            }
            this.node.getChildByName("rob_button").getChildByName("btn_1fen").active = btn1fen
            this.node.getChildByName("rob_button").getChildByName("btn_2fen").active = btn2fen
            this.node.getChildByName("rob_button").getChildByName("btn_3fen").active = btn3fen
            this.node.getChildByName("rob_button").getChildByName("btn_bj").active = btnbj
            this.node.getChildByName("rob_button").getChildByName("btn_bq").active = btnbq
            this.node.getChildByName("rob_button").getChildByName("btn_jdz").active = btnjdz
            this.node.getChildByName("rob_button").getChildByName("btn_qdz").active = btnqdz
        }
        else
            this.node.getChildByName("rob_button").active = false
    }

    private onDDZlandlordOver()
    {
        this.node.getChildByName("rob_button").active = false
    }

    private button_ddz_action(event, customEventData)
    {   
        this.checkIsErrorTuoGuan()
        var action = parseInt(customEventData)
        MessageManager.getInstance().messageSend(Proto.CS_DdzCallLandlord.MsgID.ID, {action: action,});
    }


}
