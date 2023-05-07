import { GAME_STATE_NN } from './../../../data/nn/GameInfo_NN';
import { NnCheckCardType } from './../../../data/nn/NnCheckCardType';
import { SelectTipsUI } from './../../SelectTipsUI';
import { GameUIRepeatMsgManage } from './../../GameUIRepeatMsgManage';
import { GameChatUI } from './../../GameChatUI';
import { VoiceManager } from './../../../../framework/Utils/VoiceManager';
import { SdkManager } from './../../../../framework/Utils/SdkManager';
import { Utils } from './../../../../framework/Utils/Utils';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { ShowRuleUI } from './../rule/ShowRuleUI';
import { GameSettingUI } from './../../GameSettingUI';
import { ClubUI } from './../../ClubUI';
import { StringData } from './../../../data/StringData';
import { GameManager } from './../../../GameManager';
import { GameUIController } from './../../GameUIController';
import { HallUI } from './../../HallUI';
import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { GameApplyUI } from './../../GameApplyUI';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { ListenerType } from './../../../data/ListenerType';
import { ListenerManager } from './../../../../framework/Manager/ListenerManager';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { BaseUI } from "../../../../framework/UI/BaseUI";
import * as Proto from "../../../../proto/proto-min";
import infoGameUI from '../info/infoGameUI';
import NnGameOver_UI from './NnGameOver_UI';
import { SelectTipsUI2 } from '../../SelectTipsUI2';

const { ccclass, property } = cc._decorator;

@ccclass
export class GameUI_NN extends BaseUI {
    protected static className = "GameUI_NN";

    @property([cc.SpriteFrame])
    stateSpf: cc.SpriteFrame[] = [];
    @property(cc.Label)
    labelRoom: cc.Label = null;
    @property(cc.Label)
    labelRound: cc.Label = null;
    @property(cc.ProgressBar)
    battleProgress: cc.ProgressBar = null;
    @property(cc.Label)
    labelSigle: cc.Label = null;
    @property(cc.Label)
    labelTime: cc.Label = null;
    @property(cc.Font)
    fontNumZ: cc.Font = null
    @property(cc.Font)
    fontNumF: cc.Font = null
    @property(cc.Node)
    btnInvite: cc.Node = null;
    @property(cc.Label)
    inviteTimeLabel: cc.Label = null;
    @property([cc.SpriteFrame])
    cardTypeSpf: cc.SpriteFrame[] = [];
    @property([cc.SpriteFrame])
    callBankerSpf: cc.SpriteFrame[] = [];
    @property(cc.Sprite)
    pingLv: cc.Sprite = null;

    @property({ type: [cc.SpriteFrame] })
    pingLvArg: Array<cc.SpriteFrame> = [];

    private _nnData = null;
    private m_curUpdateTime = 1; // 两秒更新一次电量和时间
    private loopEndTime = 0
    private m_inviteTimeout = 0
    private startTime = 0 // 准备倒计时
    private voicePlaying = false
    private unUseGoldList = []
    private usedGoldList = []

    onLoad() {
        
    }

    onDataRecv() // 只有首次ui打开，加载完成才会执行该流程
    {
        this.unUseGoldList = []
        this.usedGoldList = []
        this._nnData = GameDataManager.getInstance().getDataByCurGameType();
        infoGameUI.actionState = false
        this.initListen()
        this.initPlayerView()
        this.onRoundChanged()
        this.setRoomId()
        this.initGoldObject()
    }

    onDestroy() {
        super.onDestroy();
        this._nnData = null;
    }

    update(dt) {
        this.m_curUpdateTime -= dt;
        if (this.m_curUpdateTime < 0) {
            this.m_curUpdateTime = 3;
            this.updatePhoneInfo();
        }
    }

    updatePhoneInfo() {
        this.setTime();
        this.setBattle();
        this.setSignal();
    }

    onShow() {
        this._nnData = GameDataManager.getInstance().getDataByCurGameType();
        this.resetPlayerView()
    }

    resetDataOnBack()// 切后台之后切回前台需要清理数据
    {
        this._nnData = GameDataManager.getInstance().getDataByCurGameType();
    }

    //初始化监听
    private initListen() {
        ListenerManager.getInstance().add(Proto.S2C_CLUBLIST_RES.MsgID.ID, this, this.onEnterClubResponse);
        ListenerManager.getInstance().add(Proto.SC_DismissTable.MsgID.ID, this, this.onRoomDissmissOver);
        ListenerManager.getInstance().add(Proto.S2CPlayerInteraction.MsgID.ID, this, this.onInteractionRec);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_INVITE_JOIN_ROOM.MsgID.ID, this, this.onInviteRec);
        ListenerManager.getInstance().add(Proto.SC_StartTimer.MsgID.ID, this, this.onStartTimeRec);
        ListenerManager.getInstance().add(Proto.SC_CancelTimer.MsgID.ID, this, this.onStartTimeCancel);
        ListenerManager.getInstance().add(Proto.SC_ForceKickoutPlayer.MsgID.ID, this, this.onForceKickPlayer);
        ListenerManager.getInstance().add(Proto.S2C_VoiceInteractive.MsgID.ID, this, this.onVoiceRec);
        ListenerManager.getInstance().add(Proto.SC_OxStartGame.MsgID.ID, this, this.onOwnerStart);
        
        ListenerManager.getInstance().add(ListenerType.nn_start, this, this.onGameStart);
        ListenerManager.getInstance().add(ListenerType.nn_handCardChanged, this, this.onHandCardChanged);
        ListenerManager.getInstance().add(ListenerType.nn_playerNumChanged, this, this.onPlayerNumChanged);                     // 收到玩家人数改变
        ListenerManager.getInstance().add(ListenerType.nn_dismissResponse, this, this.onRoomDissmissResponse);                     // 收到解散请求
        ListenerManager.getInstance().add(ListenerType.nn_playerStateChanged, this, this.onPlayerStateChanged);                 // 收到玩家游戏状态改变
        ListenerManager.getInstance().add(ListenerType.nn_ownerChanged, this, this.onOwnerChanged);                             // 房主改变
        ListenerManager.getInstance().add(ListenerType.nn_dealerChanged, this, this.onDealerChanged);                           // 庄家改变
        ListenerManager.getInstance().add(ListenerType.nn_curRoundChange, this, this.onRoundChanged);
        ListenerManager.getInstance().add(ListenerType.nn_playerRobBankerTimesChanged, this, this.onRobBankerTiemsChanged);
        ListenerManager.getInstance().add(ListenerType.nn_handCardTypeChanged, this, this.onCardsTypeChanged);
        ListenerManager.getInstance().add(ListenerType.nn_onCallBankerEnd, this, this.onCallBankerEnd);
        
        ListenerManager.getInstance().add(ListenerType.nn_gameState, this, this.onGameStateChanged);
        ListenerManager.getInstance().add(ListenerType.nn_playerScoreChanged, this, this.onPlayerScoreChanged);                 // 玩家分数改变
        ListenerManager.getInstance().add(ListenerType.nn_playerAllUseScoreChanged, this, this.onUsedScoreChange);
        ListenerManager.getInstance().add(ListenerType.operateTimeChange, this, this.onTimeChange);
        ListenerManager.getInstance().add(ListenerType.nn_voice, this, this.onActionVoiceRec);
        ListenerManager.getInstance().add(ListenerType.nn_gameRoundOver, this, this.onGameRoundOver);
        ListenerManager.getInstance().add(ListenerType.nn_onStatusChanged, this, this.onPlayerStatusChanged);

    }

    /**更新所有显示 */
    public onGameStart() {
        this.node.stopAllActions()
        this.resetPlayerView()
        this.updatePlayerCard()
        this.updateVoiceBtn()
        this.updateQzButton()
        this.updateDfButton()
        this.resetPlayerCards()
        this.resetUnUseGoldList()
        this._nnData.playerInfoMap.forEach((infoObj, seat)=>{
            this.setUsedScore(seat);
            this.setMaster(seat);
            this.setRobBankerTimes(seat);
        })

    }

    private initPlayerView()
    {
        this.node.getChildByName("node_player").active = true
        this._nnData.playerInfoMap.forEach((infoObj, seat)=>{
            this.node.getChildByName("node_player").getChildByName("player"+seat).active = true
            this.setPlayerHeadImg(seat)
            this.setPlayerReady(seat)
            this.setPlayerName(seat)
            this.setPlayerOnline(seat)
            this.setScore(seat)
            this.setOwner(seat);
        })
    }

    private resetPlayerView()
    {
        for (var i = 0; i < 8; i++)
        {
            if (this._nnData.playerInfoMap.get(i))
            {
                this.node.getChildByName("node_player").getChildByName("player" + i).getChildByName("gray").active =false
                this.node.getChildByName("node_player").getChildByName("player" + i).getChildByName("round_over_score").active =false
                this.node.getChildByName("node_player").getChildByName("player" + i).getChildByName("round_over_score_union").active =false
                this.updatePlayerView(i)
            }
            else
            {
                for (var j = 0; j < 5; j++)
                {
                    var cardNode =  this.node.getChildByName("node_player").getChildByName("player"+i).getChildByName("card"+i+"_"+j)
                    cardNode.active = false
                }
                this.node.getChildByName("node_player").getChildByName("player" + i).getChildByName("round_over_score").active =false
                this.node.getChildByName("node_player").getChildByName("player" + i).getChildByName("round_over_score_union").active =false
                this.node.getChildByName("node_player").getChildByName("player" + i).getChildByName("card_type").active = false
                var labelScore = this.node.getChildByName("node_player").getChildByName("player" + i).getChildByName("use_score").getChildByName("label_score").getComponent(cc.Label) 
                labelScore.string = "0"
                this.node.getChildByName("node_player").getChildByName("player" + i).active = false
            }
        }
    }


    private updateVoiceBtn()
    {
        var oRule = this._nnData.gameinfo.rule
        this.node.getChildByName("yy_button").active = true
    }

    /**刷新所有玩家牌相关 */
    private updatePlayerCard(hide = false) {
        this._nnData.playerInfoMap.forEach((infoObj, seat)=>{
            for (var i = 0; i < 5; i++)
            {
                var cardNode =  this.node.getChildByName("node_player").getChildByName("player"+seat).getChildByName("card"+seat+"_"+i)
                if (hide)
                    cardNode.active = false
                else
                {
                    cardNode.active = infoObj.isGaming && GAME_STATE_NN.PER_BEGIN != this._nnData.gameinfo.gameState
                    if (infoObj.cards.length > 0)
                        this.setCardTexture(cardNode,infoObj.cards[i])
                }
            }
        })
    }

    private onCardsTypeChanged(msg)
    {
        var typeNode = this.node.getChildByName("node_player").getChildByName("player" + msg.seat).getChildByName("card_type")
        var type =  this._nnData.playerInfoMap.get(msg.seat).cardsType
        if (type == 0 || (this._nnData.gameinfo.gameState != GAME_STATE_NN.STATE_PLAY && this._nnData.gameinfo.gameState != GAME_STATE_NN.STATE_GAMEOVER))
        {
            typeNode.active = false
            return
        }
        if (type < 21)
            typeNode.getComponent(cc.Sprite).spriteFrame = this.cardTypeSpf[type-1]
        else
            typeNode.getComponent(cc.Sprite).spriteFrame = this.cardTypeSpf[type-10]  
        typeNode.active = true
        this.splitCardOnDisplayed(msg.seat)
        if (msg.seat == 0)
            this.node.getChildByName("btn_display").active = false
    }

    private onRoomDissmissResponse(msg) {
        UIManager.getInstance().openUI(GameApplyUI, 30,);
    }

    private onRoomDissmissOver(msg: any) {
        if (UIManager.getInstance().getUI(GameApplyUI) != null)
        {
            UIManager.getInstance().closeUI(GameApplyUI)
        }
        UIManager.getInstance().closeUI(GameApplyUI)
        if (this._nnData && this._nnData.gameinfo&&this._nnData.gameinfo.curGameOverData != null){ // 如果解散的时候有总结算数据，关闭界面之后弹出总结算
            this._nnData.gameinfo.isDismissed = true
            this._nnData.setGameState(GAME_STATE_NN.STATE_FINAL_OVER);
            MessageManager.getInstance().disposeMsg();
            return
        }
        if (msg.success){
            GameManager.getInstance().openWeakTipsUI(StringData.getString(10036))
            var uiType = -1
            if (this._nnData && !this._nnData.gameinfo.clubId)
                uiType = -1
            else 
                uiType = parseInt(cc.sys.localStorage.getItem("curClubType")) ;
            if (uiType != -1)
                MessageManager.getInstance().messageSend(Proto.C2S_CLUBLIST_REQ.MsgID.ID, {type: uiType});
            else
                UIManager.getInstance().openUI(HallUI, 1, () => {
                    GameUIController.getInstance().closeCurGameUI()
                    UIManager.getInstance().closeUI(NnGameOver_UI)
                    UIManager.getInstance().closeUI(GameApplyUI)
                });
        }
        MessageManager.getInstance().disposeMsg();
    }

    private onEnterClubResponse(msg: any) {
        GameDataManager.getInstance().clubData = msg.clubs;
        //发完消息转场
        var uiType = parseInt(cc.sys.localStorage.getItem("curClubType")) ;
        UIManager.getInstance().openUI(ClubUI, 0, () => {
            GameUIController.getInstance().closeCurGameUI()
            UIManager.getInstance().closeUI(GameApplyUI)
            UIManager.getInstance().closeUI(NnGameOver_UI);
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
                var uiType = -1
                if (!this._nnData.gameinfo.clubId)
                    uiType = -1
                else 
                    uiType = parseInt(cc.sys.localStorage.getItem("curClubType")) ;
                if (uiType != -1)
                    MessageManager.getInstance().messageSend(Proto.C2S_CLUBLIST_REQ.MsgID.ID, {type: uiType});
                else
                    UIManager.getInstance().openUI(HallUI, 1, () => {
                        GameUIController.getInstance().closeCurGameUI()
                        UIManager.getInstance().closeUI(NnGameOver_UI)
                        UIManager.getInstance().closeUI(GameApplyUI)
                    });
            }
            else
            {
                // 隐藏该玩家
                this.node.getChildByName("node_player").getChildByName("player"+msg.playerSeat).active = false
            }
        }
        else{
            // 显示该玩家
           this.updatePlayerView(msg.playerSeat)
        }
        if (this._nnData.gameinfo.gameState == GAME_STATE_NN.PER_BEGIN)
        {
            if (this._nnData.gameinfo.clubId != 0 && this._nnData.playerInfoMap.size != this._nnData.getCurTypePlayerNum())
                this.btnInvite.active = true;
            else
                this.btnInvite.active = false;
        }
    }

    private updatePlayerView(seat){
        this.node.getChildByName("node_player").getChildByName("player"+seat).active = true
        this.setPlayerHeadImg(seat)
        this.setPlayerReady(seat)
        this.setPlayerName(seat)
        this.setPlayerOnline(seat)
        this.setScore(seat)
        this.setMaster(seat);
        this.setOwner(seat);
    }

    private setPlayerHeadImg(seat)
    {
        var headNode = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("sp").getComponent(cc.Sprite)     //得到头像节点
        Utils.loadTextureFromNet(headNode, this._nnData.playerInfoMap.get(seat).headurl)
    }

    private setPlayerName(seat)
    {
        var labelName = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("label_name").getComponent(cc.Label)     //得到名字label
        labelName.string = this._nnData.playerInfoMap.get(seat).name;
    }

    private setPlayerReady(seat)
    {
        if (this._nnData == null)
            return
        var readyNode = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("ready")    //得到准备节点
        if (this._nnData.gameinfo.gameState == GAME_STATE_NN.STATE_PLAY || this._nnData.gameinfo.gameState == GAME_STATE_NN.STATE_BIT
            || this._nnData.gameinfo.gameState == GAME_STATE_NN.STATE_ROB_BANKER)
        {
            readyNode.active = false
            return
        }
        if (!this._nnData.playerInfoMap.get(seat))
            return
        readyNode.active = this._nnData.playerInfoMap.get(seat).isready;
        if (seat == 0)
            this.node.getChildByName("node_begin").getChildByName("btn_mid_ready").active = !readyNode.active && this._nnData.playerInfoMap.get(seat).status != 3
        this.checkStartButton()
    }

    /**设置分数 */
    public setScore(seat) 
    {
        var labelScore = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("score").getComponent(cc.Label) 
        // var score = this._nnData.playerInfoMap.get(seat).score
        // var oRule = this._nnData.gameinfo.rule
        // if (!oRule.union)
        var score = this._nnData.playerInfoMap.get(seat).clubScore
        labelScore.string = score.toString();
        if (score < 0)
            labelScore.node.color = new cc.Color(255, 64, 64);
        else
            labelScore.node.color = new cc.Color(251, 224, 72);
    }

    public setUsedScore(seat)
    {
        var labelScore = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("use_score").getChildByName("label_score").getComponent(cc.Label) 
        var score = this._nnData.playerInfoMap.get(seat).usescore
        labelScore.string = score.toString();
    }

    public setRobBankerTimes(seat)
    {
        var spCallTimer = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("rob_times").getComponent(cc.Sprite) 
        var score = this._nnData.playerInfoMap.get(seat).robBankerTimes
        if (this._nnData.gameinfo.gameState == GAME_STATE_NN.PER_BEGIN || this._nnData.gameinfo.gameState == 0 || !this._nnData.playerInfoMap.get(seat).isCallBanker) {
            spCallTimer.node.active = false
            return
        }
        if (score == 0)
            spCallTimer.spriteFrame = this.callBankerSpf[1]
        else
            spCallTimer.spriteFrame = this.callBankerSpf[score]
        spCallTimer.node.active = true
    }

    public hideCommonCallTime()
    {
        this._nnData.playerInfoMap.forEach((infoObj, seat)=>{
            if (infoObj.id != this._nnData.gameinfo.dealerId)
                this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("rob_times").active = false
        })
    }

    /**玩家是否在线 */
    public setPlayerOnline(seat)
    {
        var onlineNode = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("online")
        onlineNode.active = !this._nnData.playerInfoMap.get(seat).isonline;
    }

     /**设置庄家 */
     private setMaster(index) 
     {
         var seat = index;
         var playerID = this._nnData.playerInfoMap.get(seat).id
         var masterNode = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("sp_master_bg") 
         masterNode.active = (playerID == this._nnData.gameinfo.dealerId)
     }

    /**设置房主 */
    private setOwner(seat) 
    {
        if (this._nnData.playerInfoMap.get(seat))
        {
            var playerID = this._nnData.playerInfoMap.get(seat).id
            var ownerNode = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("sp_fang") 
            ownerNode.active = (playerID == this._nnData.gameinfo.creator)
        }
    }

    public splitCardOnDisplayed(seat)
    {
        if (this._nnData && this._nnData.playerInfoMap.get(seat))
        {
            var cardsType = this._nnData.playerInfoMap.get(seat).cardsType
            var isDisPlayCards = this._nnData.playerInfoMap.get(seat).isDisplayedCards
            if (cardsType > 1 && isDisPlayCards && cardsType != 23 && cardsType != 24 && cardsType != 26 && cardsType != 27)
            {
                var playerNode = this.node.getChildByName("node_player").getChildByName("player"+seat)
                for (var i = 0; i < 5; i++)
                {
                    if (seat == 0)
                    {
                        if (i == 1)
                            playerNode.getChildByName("card"+seat+"_"+i).x -= 10
                        else if (i ==2)
                            playerNode.getChildByName("card"+seat+"_"+i).x -= 20
                        else if (i == 3)
                            playerNode.getChildByName("card"+seat+"_"+i).x += 10
                    }
                    else if (seat == 1 || seat == 2)
                    {
                        if (i == 0 || i == 1 || i == 2)
                            playerNode.getChildByName("card"+seat+"_"+i).x -= 10
                    }
                    else
                    {
                        if (i == 3 || i == 4)
                            playerNode.getChildByName("card"+seat+"_"+i).x += 10
                    }
                }
            }
        }
    }

    public resetPlayerCards()
    {
        for (var seat = 0; seat < 8; seat++)
        {
            var playerNode = this.node.getChildByName("node_player").getChildByName("player"+seat)
            if (seat == 0)
            {
                let firstPosx = playerNode.getChildByName("card"+seat+"_"+0).x
                for (var i = 0; i < 5; i++)
                {
                    playerNode.getChildByName("card"+seat+"_"+i).x = firstPosx+i*75
                }
            }
            else if(seat == 1 || seat == 2)
            {
                let firstPosx = playerNode.getChildByName("card"+seat+"_"+4).x
                for (var i = 0; i < 5; i++)
                {
                    playerNode.getChildByName("card"+seat+"_"+i).x = firstPosx+(i-4)*28
                }
            }
            else
            {
                let firstPosx = playerNode.getChildByName("card"+seat+"_"+0).x
                for (var i = 0; i < 5; i++)
                {
                    playerNode.getChildByName("card"+seat+"_"+i).x = firstPosx+i*28
                }
            }
        }
    }

    private onPlayerStateChanged(msg)
    {
        if(msg.type == "ready")
            this.setPlayerReady(msg.playerSeat)
        else if (msg.type == "clear")
            this.node.getChildByName("node_player").getChildByName("player" + msg.playerSeat).getChildByName("stage").active = false
        else
            this.setPlayerOnline(msg.playerSeat) 
    }

    private onPlayerScoreChanged(msg)
    {
        var index = this._nnData.getSeatById(msg.id);
        if (index >= 0)
            this.setScore(index)
    }

    private onUsedScoreChange(msg)
    {
        var index = this._nnData.getSeatById(msg.id);
        if (index >= 0)
            this.setUsedScore(index)
        if (index == 0 && (this._nnData.playerInfoMap.get(index).isCallBanker || !this._nnData.gameinfo.rule.play.call_banker))
        {
            this.node.getChildByName("node_button").active = false
            this.node.getChildByName("node_button").getChildByName("node_qz_button").active = true;
        }
    }

    // 抢庄倍数改变
    private onRobBankerTiemsChanged(msg)
    {
        var index = this._nnData.getSeatById(msg.id);
        if (index >= 0)
            this.setRobBankerTimes(index)
        if (index == 0 && this._nnData.playerInfoMap.get(index).isCallBanker)
        {
            this.node.getChildByName("node_button").active = false
            this.node.getChildByName("node_button").getChildByName("node_qz_button").active = false;
        }
    }


    private onOwnerChanged(msg)
    {
        var index = this._nnData.getSeatById(msg.id);
        if (index >= 0)
            this.setOwner(index)
        // 房主变成自己才检查
        if (index == 0)
            this.checkStartButton()
    }

    private onDealerChanged(msg)
    {
        if (msg.id < 0)
        {
            this._nnData.playerInfoMap.forEach((infoObj, seat)=>{
                var masterNode = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("sp_master_bg") 
                masterNode.active = false
            })
            return
        }
        var index = this._nnData.getSeatById(msg.id);
        this.setMaster(index)
    }

    private onPlayerStatusChanged(msg)
    {
        var index = this._nnData.getSeatById(msg.id);
        if (index >= 0) //破产了
        {
            var labelStatus = this.node.getChildByName("node_player").getChildByName("player" + index).getChildByName("label_status")
            if (msg.status == 3)
            {
                labelStatus.getComponent(cc.Label).string = "积分不足"
                labelStatus.active = true
            }
            else    
            {
                labelStatus.getComponent(cc.Label).string = ""
                labelStatus.active = false
            }
        }
    }

    private onRoundChanged()
    {
        var curRule = this._nnData.gameinfo.rule
        var list = [8, 12, 16, 20];
        var ruleJuShu = list[curRule.round.option];
        this.labelRound.string = this._nnData.gameinfo.curRound + "/" + ruleJuShu
    }

    // 抢庄结束，如果存在随机抢庄需要播放动画
    private onCallBankerEnd(msg)
    {
        if (!this._nnData)
            return
        var times = this._nnData.playerInfoMap.get(msg.bankerSeat).robBankerTimes
        var actionSeatList = []
        this._nnData.playerInfoMap.forEach((infoObj, seat)=>{
            if (infoObj.isGaming && infoObj.isCallBanker && infoObj.robBankerTimes == times)
            {   
                actionSeatList.push(seat)
            }
        })
        if(actionSeatList.length == 0) // 没有其他人和你抢
        {
            this._nnData.setDealer(msg.bankerSeat)
            MessageManager.getInstance().disposeMsg();
        }
        else
        {
            for (var seat of actionSeatList)
            {
                if (seat != msg.bankerSeat)
                    actionSeatList.push(seat)
                else
                {
                    actionSeatList.push(seat)
                    break
                }
            }
            var actionList = []
            for (var i = 0; i < actionSeatList.length; i++)
            {
                var pos = this.node.getChildByName("node_player").getChildByName("player"+actionSeatList[i]).position
                var actionNode = this.node.getChildByName("call_select")
                actionNode.active = true
                let action1 = cc.callFunc(function (target,data) {
                    data.actionNode.position = data.pos
                },this,{actionNode:actionNode, pos:pos});
                let delayAction = cc.delayTime(0.2)
                actionList.push(action1, delayAction)
            }
            let delayAction2 = cc.delayTime(0.4)
            let finishFunc =  cc.callFunc(function () {
                if (this._nnData)
                {
                    this._nnData.setDealer(seat)
                }
                this.node.getChildByName("call_select").active = false
                MessageManager.getInstance().disposeMsg();
            }.bind(this));
            actionList.push(delayAction2)
            actionList.push(finishFunc)
            let seq = cc.sequence(actionList);
            this.node.runAction(seq);
        }
        
    }

    public updateQzButton()
    {
        if (this._nnData.gameinfo.rule.play.call_banker) // 明牌抢庄才有抢庄按钮
        {
            var qzMaxTimes = this._nnData.gameinfo.rule.play.call_banker_times
            this.node.getChildByName("node_button").getChildByName("node_qz_button").getChildByName("btn_dq").active = true;
            for (var i = 2; i < 5; i++)
            {
                if (i <= qzMaxTimes)
                    this.node.getChildByName("node_button").getChildByName("node_qz_button").getChildByName("btn_"+i).active = true
                else
                    this.node.getChildByName("node_button").getChildByName("node_qz_button").getChildByName("btn_"+i).active = false
            }
        }
    }

    public updateDfButton()
    {
        var dfList = this._nnData.gameinfo.rule.play.base_score
        for (var i = 0; i < 4; i++)
        {
            if (i < dfList.length)
            {
                this.node.getChildByName("node_button").getChildByName("node_df_button").getChildByName("btn_"+(i+1)).active = true
                var labelDf = this.node.getChildByName("node_button").getChildByName("node_df_button").getChildByName("btn_"+(i+1)).getChildByName("label_df").getComponent(cc.Label)
                labelDf.string = dfList[i]+" 分"
            }
            else
                this.node.getChildByName("node_button").getChildByName("node_df_button").getChildByName("btn_"+(i+1)).active = false
        }
    }

    //设置房间号
    private setRoomId(room?) {
        if (room) {
            this.labelRoom.string = room;
        }
        else {
            this.labelRoom.string = this._nnData.gameinfo.roomId.toString();
        }

    }

    /**手牌变化 */
    private onHandCardChanged(msg) {
        var playerObj = this._nnData.playerInfoMap.get(msg.seat)
        var playerNode = this.node.getChildByName("node_player").getChildByName("player"+msg.seat)
        for (var i = 0; i < 5; i++)
        {
            var cardNode =  playerNode.getChildByName("card"+msg.seat+"_"+i)
            cardNode.active = playerObj.isGaming
            if (playerObj.cards.length > 0)
                this.setCardTexture(cardNode,playerObj.cards[i])
        }
    }

    
    private onStartTimeRec(msg)
    {
        if (!this._nnData)
            return
        this.startTime = msg.leftTime
        this.node.getChildByName("time").active = true;
        this.node.getChildByName("time").getComponent(cc.Label).string = "游戏即将开始("+this.startTime+"s)"
        this._nnData.playerInfoMap.forEach((infoObj, seat)=>{
            this.setPlayerReady(seat)
        })
        this.schedule(this.loop1, 1);
        MessageManager.getInstance().disposeMsg();

    }

    private onStartTimeCancel(msg)
    {
        this.startTime = 0
        this.node.getChildByName("time").active = false;
        this.unschedule(this.loop1)
        MessageManager.getInstance().disposeMsg();
    }

    private onForceKickPlayer(msg)
    {
        GameManager.getInstance().openWeakTipsUI("踢出玩家成功");
        MessageManager.getInstance().disposeMsg();
    }

    private onOwnerStart()
    {
        MessageManager.getInstance().disposeMsg();
    }
    
    public isBlockVocie()
    {
        var result = false;
        if (this._nnData == null || this._nnData.gameinfo == null)
            return;
        var oRule = this._nnData.gameinfo.rule
        if (oRule.option.block_voice)
            result = true
        return result
    } 

    private onVoiceRec(msg)
    {
        if(this._nnData == null)
        {
            MessageManager.getInstance().disposeMsg();
            return
        }
        //语音
        if (this.voicePlaying)
            VoiceManager.getInstance().stop();
        var msgfile = "voicemsg.amr";
        VoiceManager.getInstance().writeAndPlay(msgfile, msg.content, function () {
            //开始播放录音
            AudioManager.getInstance().pauseAll();
        });
        this.voicePlaying = true;
        var senderSeat = this._nnData.getSeatById(msg.sender);
        this.setVoiceAction(senderSeat,msg.time);
        MessageManager.getInstance().disposeMsg();

    }

    private setVoiceAction(targetSeat, time){
        this.stopAllVoiceAction()
        let yychat =  this.node.getChildByName("node_player").getChildByName("player" + targetSeat).getChildByName("yy_icon")
        yychat.active = true;
        let action1 = cc.fadeIn(0.1);
        let action2 = cc.delayTime(time / 1000);
        let action3 = cc.fadeOut(0.1);
        let action4 = cc.callFunc(function () {
            this.voicePlaying = false;
            AudioManager.getInstance().resumeAll();
        }.bind(this));
        let seq = cc.sequence(action1, action2, action3, action4);
        yychat.runAction(seq);
    }

    private stopAllVoiceAction() {
        if (!this._nnData)
            return;
        this._nnData.playerInfoMap.forEach((infoObj, seat)=>{
            var tempVoiceNode = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("yy_icon")
            tempVoiceNode.stopAllActions();
            tempVoiceNode.active = false;
        }) 
    }

    private onTimeChange(msg)
    {
        var time = this._nnData.gameinfo.time
        var desc = ""
        if (this._nnData.gameinfo.gameState == GAME_STATE_NN.STATE_ROB_BANKER)
        {
            desc = "抢庄..."
        }
        else if (this._nnData.gameinfo.gameState == GAME_STATE_NN.STATE_BIT)
        {
            desc = "选择下注分数..."
        }
        else if (this._nnData.gameinfo.gameState == GAME_STATE_NN.STATE_PLAY)
        {
            desc = "算牛..."
        }
        else
            desc = "准备倒计时..."
        if(time > 0)
        {
            this.node.getChildByName("time").getComponent(cc.Label).string = desc + time +"秒"
            this.unscheduleAllCallbacks()
            this.loopEndTime = new Date().getTime() + time*1000
            this.schedule(this.loop, 1);
        }
    }

    private loop() {
        if (new Date().getTime() <  this.loopEndTime)
        {
            var leftTime = Math.ceil((this.loopEndTime -new Date().getTime())/1000)
            var desc = ""
            if (this._nnData.gameinfo.gameState == GAME_STATE_NN.STATE_ROB_BANKER)
            {
                desc = "抢庄..."
            }
            else if (this._nnData.gameinfo.gameState == GAME_STATE_NN.STATE_BIT)
            {
                desc = "选择下注分数..."
            }
            else if (this._nnData.gameinfo.gameState == GAME_STATE_NN.STATE_PLAY)
            {
                desc = "算牛..."
            }
            else
                desc = "准备倒计时..."
            this.node.getChildByName("time").getComponent(cc.Label).string = desc + leftTime +"秒"
        }
        else
        {
            this.unschedule(this.loop);
            this.node.getChildByName("time").getComponent(cc.Label).string = ""
        }
    }

    private loop1()
    {
        if (this.startTime > 0)
        {
            this.startTime -= 1
            this.node.getChildByName("time").getComponent(cc.Label).string = "游戏即将开始("+this.startTime+"s)"
            this.setPlayerReady(0)
        }
        else
        {
            this.node.getChildByName("time").active = false;
            this.unschedule(this.loop1);
        }
    }

    private initGoldObject()
    {
        // 初始化用来做结算动画的金币
        for (var i = 0; i < 10; i++)
        {
            var goldList = []
            for (var j = 0; j < 5; j++)
            {
                var goldObj = cc.instantiate(this.node.getChildByName("gold_node").getChildByName("gold"))
                goldObj.active = false
                goldObj.parent = this.node.getChildByName("gold_node")
                goldList.push(goldObj)
            }
            this.unUseGoldList.push(goldList)
        }
    }

    public resetUnUseGoldList()
    {
        for (var usedList of this.usedGoldList)
            this.unUseGoldList.push(usedList)
        this.usedGoldList = []
    }

    // 小局结算赢筹码动画
    public onRoundOverWinGold(winInfo) {
        if (this._nnData == null)
            return
        var bankerId = this._nnData.gameinfo.dealerId
        var bankerSeat = this._nnData.getSeatById(bankerId);
        var winLoseInfoMap = winInfo
        var winList = []
        var loseList = []
        winLoseInfoMap.forEach((score, seat)=>{
            if (score > 0)
                winList.push(seat)
            else if (score < 0)
                loseList.push(seat)
        })
        if(this._nnData.gameinfo.rule.play.no_banker_compare)
            bankerSeat = winList[0]
        if (loseList.length + winList.length > this.unUseGoldList.length)
            this.resetUnUseGoldList()
        for (let i = 0; i < loseList.length; i++)
            this.doGoldAction(bankerSeat, loseList[i])
        for (let i = 0; i < winList.length; i++)
            this.doGoldAction(winList[i], bankerSeat)   
    }

    private doGoldAction(winSeat, loseSeat)
    {
        try{
            var goldList = this.unUseGoldList.pop();
            this.usedGoldList.push(goldList)
            var delayTime = 0
            if (goldList.length <= 0)
                return
            for(var goldObj of goldList)
            {
                goldObj.position = this.node.getChildByName("node_player").getChildByName("player" +loseSeat).position
                let endpos = this.node.getChildByName("node_player").getChildByName("player"+winSeat).position;
                goldObj.active = true
                let action0 = cc.delayTime(delayTime);
                let action1 = cc.moveTo(0.5, cc.v2(endpos.x,endpos.y));
                let finish = cc.callFunc(function (node, actionNode) {
                    actionNode.active= false
                }, this, goldObj);
                goldObj.runAction(cc.sequence(action0, action1, finish));
                delayTime += 0.08
            }
        }
        catch (e) {}
    }
    
    //单局结束
    private onGameRoundOver(msg)
    {
        if (!msg.roundOverData.balances)
            return;
        this.node.getChildByName("node_begin").getChildByName("btn_start").active = false
        var mapScore = new Map()
        var actionList = []
        this.unschedule(this.loop);
        this.node.getChildByName("time").getComponent(cc.Label).string = ""
        for (var balanceInfo of msg.roundOverData.balances)
        {
            var seat = this._nnData.getRealSeatByRemoteSeat(balanceInfo.chairId)
            if(this._nnData.playerInfoMap.get(seat))
            {
                var score = balanceInfo.money/100
                mapScore.set(seat, score)
                if (!this._nnData.playerInfoMap.get(seat).isDisplayedCards) // 没有展示牌的时候
                {
                    let action1 = cc.callFunc(function (target, data) {
                        if(this._nnData)
                        {
                            this._nnData.setPlayerCardsByPair(data.curSeat, data.cardsPair)
                            this._nnData.playerInfoMap.get(data.curSeat).isDisplayedCards = true
                            this._nnData.playerInfoMap.get(data.curSeat).cardsType = data.cardsType
                            this._nnData.playerInfoMap.get(data.curSeat).status = data.status
                            if (data.cardsType != 21 && data.cardsType != 23 && data.cardsType != 24 && data.cardsType != 28)
                            {
                                // 缺失的语音不播报
                                var voiceStr = this._nnData.getVoiceStringByType(data.cardsType)
                                MessageManager.getInstance().messagePost(ListenerType.nn_voice, {seat: data.curSeat, type:voiceStr});
                            }
                        }
                    }, this, {curSeat:seat, cardsPair:balanceInfo.cardsPair, cardsType:balanceInfo.type, status:balanceInfo.pstatus})
                    let action2 = cc.delayTime(0.9);
                    actionList.push(action1,action2) 
                }
                else
                {
                    this._nnData.playerInfoMap.get(seat).status = balanceInfo.pstatus
                }
            }
        }
        let goldAction = cc.callFunc(function (target) {
            this.onRoundOverWinGold(mapScore)
        },this)
        let goldActionDelay = cc.delayTime(1.0);
        let finishFunc = cc.callFunc(function (node) {
            mapScore.forEach((score, seat)=>{
                var isUnion = true
                if (this._nnData)
                {
                    var oRule = this._nnData.gameinfo.rule
                    if (oRule.union)
                        isUnion = true
                    else
                        isUnion = false
                }
                if (isUnion)
                {
                    var fuhao = ""
                    var labelScore = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("round_over_score_union").getComponent(cc.Label)
                    if (score < 0) 
                        var color = new cc.Color(120,206,255)
                    else
                    {
                        fuhao = "+"
                        var color = new cc.Color(255,172,115)
                    }
                    labelScore.string = fuhao+score.toString();
                    labelScore.node.color = color
                    labelScore.node.active = true;
                }
                else
                {
                    var labelScore = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("round_over_score").getComponent(cc.Label)
                    if (score < 0) {
                        labelScore.font = this.fontNumF;
                        labelScore.string = "/" + score;
                    }
                    else {
                        labelScore.font = this.fontNumZ;
                        labelScore.string = "/" + score;
                    }
                    labelScore.node.active = true;
                }
                if (this._nnData && this._nnData.playerInfoMap.get(seat))
                    this._nnData.playerInfoMap.get(seat).clubScore += score

            })
            if (this._nnData) // 有总结算数据
            {
                if (this._nnData.gameinfo.curGameOverData != null)
                {
                   
                    this._nnData.setGameState(GAME_STATE_NN.STATE_FINAL_OVER);
                }
                else
                    this._nnData.setGameState(GAME_STATE_NN.STATE_GAMEOVER) 
            }
        }, this)
        actionList.push(goldAction) 
        actionList.push(goldActionDelay) 
        actionList.push(finishFunc) 
        this.node.runAction(cc.sequence(actionList));
    }
   
    /**游戏状态改变 */
    private onGameStateChanged() {
        if (this._nnData.gameinfo.gameState == GAME_STATE_NN.PER_BEGIN || this._nnData.gameinfo.gameState == 0) {
            this.node.getChildByName("node_begin").active = true
            this.node.getChildByName("node_button").active = false
            this.node.getChildByName("btn_display").active = false
            this.clearQzTimes()
            this.clearCardsType()
            this.resetPlayerView()
            this.inviteTimeLabel.string = "一键邀请"
            this.node.getChildByName("node_begin").getChildByName("btn_club_invite").getComponent(cc.Button).interactable = true;
            if (this._nnData.gameinfo.mBTableStarted) {
                this.btnInvite.active = false;
            }
            else {
                this.btnInvite.active = false;
                if (this._nnData.gameinfo.clubId != 0 && this._nnData.playerInfoMap.size != this._nnData.getCurTypePlayerNum())
                {
                    this.btnInvite.active = true;
                }
            }
        }
        else if (this._nnData.gameinfo.gameState == GAME_STATE_NN.STATE_ROB_BANKER) {//抢庄阶段
            this.node.getChildByName("node_begin").active = false
            this.node.getChildByName("btn_display").active = false
            this.node.getChildByName("node_button").getChildByName("node_df_button").active = false; // 不显示底分按钮
            this.node.getChildByName("node_button").getChildByName("node_qz_button").active = false;
            this.node.getChildByName("time").active = true
            if (!this._nnData.playerInfoMap.get(0).isCallBanker && this._nnData.playerInfoMap.get(0).isGaming)
            {
                this.node.getChildByName("node_button").active = true
                this.node.getChildByName("node_button").getChildByName("node_qz_button").active = true;
            }
        }
        else if (this._nnData.gameinfo.gameState == GAME_STATE_NN.STATE_BIT) {//下底阶段
            this.node.getChildByName("node_begin").active = false
            this.node.getChildByName("btn_display").active = false
            this.node.getChildByName("node_button").getChildByName("node_df_button").active = false;
            this.node.getChildByName("node_button").getChildByName("node_qz_button").active = false;
            this.node.getChildByName("time").active = true
            this.hideCommonCallTime()
            var masterId = this._nnData.gameinfo.dealerId
            if (!this._nnData.playerInfoMap.get(0).isUseScore && this._nnData.playerInfoMap.get(0).isGaming && this._nnData.playerInfoMap.get(0).id != masterId)
            {
                this.node.getChildByName("node_button").active = true
                this.node.getChildByName("node_button").getChildByName("node_df_button").active = true;
            }
        }
        else if (this._nnData.gameinfo.gameState == GAME_STATE_NN.STATE_PLAY) {// 算牛阶段
            this.node.getChildByName("node_begin").active = false
            this.node.getChildByName("btn_display").active = false
            this.node.getChildByName("node_button").active = false
            this.node.getChildByName("time").active = true
            if (!this._nnData.playerInfoMap.get(0).isDisplayedCards && this._nnData.playerInfoMap.get(0).isGaming)
            {
                this.node.getChildByName("btn_display").active = true;
            }
        }
        else if (this._nnData.gameinfo.gameState == GAME_STATE_NN.STATE_GAMEOVER)
        {
            this.inviteTimeLabel.string = "一键邀请"
            this.node.getChildByName("node_begin").getChildByName("btn_club_invite").getComponent(cc.Button).interactable = true;
            this.node.getChildByName("node_begin").active = true
            this.node.getChildByName("node_button").active = false
            this.node.getChildByName("btn_display").active = false
            this.node.getChildByName("time").active = true
            this.resetUnUseGoldList()
            this.hideCommonCallTime()
            this._nnData.playerInfoMap.forEach((infoObj, seat)=>{
                infoObj.isready = false; 
            }) 
            this.node.getChildByName("node_begin").getChildByName("btn_mid_ready").active = false
            this.btnInvite.active = false;
        }
        else if (this._nnData.gameinfo.gameState == GAME_STATE_NN.STATE_FINAL_OVER)
        {
            this.node.stopAllActions()
            this.unscheduleAllCallbacks()
            this.node.getChildByName("node_begin").active = false
            this.node.getChildByName("node_button").active = false
            this.node.getChildByName("btn_display").active = false
            this.clearQzTimes()
            this.clearCardsType()
            this.node.getChildByName("time").active = false
            UIManager.getInstance().openUI(NnGameOver_UI, 20, () => {
                UIManager.getInstance().closeUI(SelectTipsUI);
                UIManager.getInstance().closeUI(SelectTipsUI2)
                UIManager.getInstance().closeUI(GameSettingUI);
                UIManager.getInstance().closeUI(ShowRuleUI);
            })
        }
    }

    public clearQzTimes()
    {
        for (var seat = 0; seat < 8; seat++)
            this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("rob_times").active = false
    }

    public clearCardsType()
    {
        for (var seat = 0; seat < 8; seat++)
            this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("card_type").active = false
    }

    private checkStartButton(){
        if (this._nnData == null)
            return;
        var oRule = this._nnData.gameinfo.rule
        var myId = this._nnData.playerInfoMap.get(0).id
        this.node.getChildByName("node_begin").getChildByName("btn_start").active = false
        var allReady = true
        this._nnData.playerInfoMap.forEach((infoObj, seat)=>{
            if (!infoObj.isready)
                allReady = false
        })
        var num = this._nnData.playerInfoMap.size
        // 我是房主，并且选了房主开桌的规则，并且所有人都准备
        if (this._nnData.gameinfo.creator == myId && oRule.room.owner_start == true && allReady && num >= 2 && this._nnData.gameinfo.curRound == 0)
        {
            this.node.getChildByName("node_begin").getChildByName("btn_start").active = true
        }
    }


    // 音效
    private onActionVoiceRec(msg) {
        var voiceStr = ""
        if (this._nnData.playerInfoMap.get(msg.seat).sex == 1) 
            voiceStr = "man_nn/" + msg.type + "_man"
        else
            voiceStr = "woman_nn/" + msg.type + "_woman"
        AudioManager.getInstance().playSFX(voiceStr)
    }

    //设置一张牌的显示
    private setCardTexture(node, cardid) {
        if (cardid == 255 || cardid == 0) // 隐藏牌
        {
            Utils.loadTextureFromLocal(node.getComponent(cc.Sprite), "/cards/card_0_0");
            return
        }
        var textureId = Utils.getPdkColorAndMjTextureId(cardid)
        Utils.loadTextureFromLocal(node.getComponent(cc.Sprite), "/cards/card_" + textureId);
    }


    //设置表情
    onInteractionRec(msg) {
        if (this._nnData == null)
        {
            MessageManager.getInstance().disposeMsg();
            return;
        }
        if (msg.type == 2) { // 魔法表情
            this.onReceiveMagicEmoji(msg);
        }
        if (msg.type == 0) {
            //表情
            this.setemjio(msg);
        }
        MessageManager.getInstance().disposeMsg();
    }

    //设置表情
    setemjio(msg) {
        var index = this._nnData.getRealSeatByRemoteSeat(msg.sender);
        var seat = index;
        var nodeEmjio = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("emjio")
        let anim = nodeEmjio.getComponent(cc.Animation);
        anim.play("emjio_" + msg.contentIdx);
        nodeEmjio.stopAllActions();
        let action1 = cc.fadeIn(0.1);
        let action2 = cc.delayTime(2.0);
        let action3 = cc.fadeOut(0.1);
        let seq = cc.sequence(action1, action2, action3);
        nodeEmjio.runAction(seq);
    }

    // 收到魔法表情
    onReceiveMagicEmoji(msg) {
        if (this._nnData && this._nnData.gameinfo){
            var senderSeat = this._nnData.getRealSeatByRemoteSeat(msg.sender);
            var receiverSeat = this._nnData.getRealSeatByRemoteSeat(msg.receiver);
            var startNode = this.node.getChildByName("node_player").getChildByName("player" + senderSeat).getChildByName("info_emoji")
            var endNode = this.node.getChildByName("node_player").getChildByName("player" + receiverSeat).getChildByName("info_emoji")
            var startPos = startNode.parent.convertToWorldSpaceAR(startNode.position);
            var endPos = endNode.parent.convertToWorldSpaceAR(endNode.position);
            var parent = startNode.parent.parent;
            startPos = parent.convertToNodeSpaceAR(startPos);
            endPos = parent.convertToNodeSpaceAR(endPos);
            infoGameUI.actionState = true;
            let callbackFunc = () => {
                this.setInfoEmoji(msg,receiverSeat);
            }
            infoGameUI.playeMoveAction(parent, cc.v2(startPos.x, startPos.y), cc.v2(endPos.x, endPos.y), msg.contentIdx, callbackFunc);                  // 播放移动动画
        }
    }

     // 移动动画完成后播放animation
     setInfoEmoji(msg,receiverSeat) {
        var endNode = this.node.getChildByName("node_player").getChildByName("player" + receiverSeat).getChildByName("info_emoji")
        let anim = endNode.getComponent(cc.Animation);
        anim.play("emoji_" + msg.contentIdx);
        endNode.stopAllActions();
        let action1 = cc.fadeIn(0.1);
        let action2 = cc.delayTime(2.0);
        let action3 = cc.fadeOut(0.1);
        let finishCallFunc = cc.callFunc(function () {
            infoGameUI.actionState = false;
        }, this);
        let seq = cc.sequence(action1, action2, action3, finishCallFunc);
        endNode.runAction(seq);
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

    // 收到切后台的消息
    public onEventHideRec()
    {
        this.node.getChildByName("btn_display").active = false
        this.node.getChildByName("node_button").active = false
        this.node.getChildByName("VoiceUI").getChildByName("root").active = false
        this.node.getChildByName("node_begin").active = false
        this.node.stopAllActions()
        this.resetUnUseGoldList()
        UIManager.getInstance().closeUI(GameApplyUI)
        UIManager.getInstance().closeUI(NnGameOver_UI);
        UIManager.getInstance().closeUI(GameSettingUI);
        this.voicePlaying = false
        VoiceManager.getInstance().cancel();
        this.stopAllVoiceAction()
        infoGameUI.actionState = false
        this.unscheduleAllCallbacks() // 停止定时器
        this._nnData = null // 切换后台后view层数据同步清理
        AudioManager.getInstance().resumeAll();
    }


    // /*——————————————————————————————————按钮事件————————————————————————————————————*/

    private button_invite_club() {
        AudioManager.getInstance().playSFX("button_click")
        if (this._nnData == null)
            return;
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_INVITE_JOIN_ROOM.MsgID.ID, {clubId: this._nnData.gameinfo.clubId});
    }

    /**准备按钮 */
    private buttonReady() {
        AudioManager.getInstance().playSFX("button_click")
        GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_Ready.MsgID.ID, {});
    }

    //设置电量
    private setBattle() {

        this.battleProgress.progress = SdkManager.getInstance().doGetNativeBatteryLevel();
    }

    //设置信号
    private setSignal() {
        this.labelSigle.string = GameDataManager.getInstance().systemData.ping + "ms";
        this.pingLv.spriteFrame = this.pingLvArg[GameDataManager.getInstance().getNetLevel()];
    }

    //设置时间
    private setTime() {
        var dateTime = new Date(GameDataManager.getInstance().systemData.severTime);
        if (dateTime.getMinutes() < 10) {
            this.labelTime.string = dateTime.getHours() + ":0" + dateTime.getMinutes();
        }
        else {
            this.labelTime.string = dateTime.getHours() + ":" + dateTime.getMinutes();
        }
    }


    /**设置按钮 */
    private button_set() {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().openUI(GameSettingUI, 4,() => {
            if(this._nnData && this._nnData.playerInfoMap.get(0))
                UIManager.getInstance().getUI(GameSettingUI).getComponent("GameSettingUI").updateBtnByZjh(this._nnData.playerInfoMap.get(0).isGaming, this._nnData.playerInfoMap.get(0).status == 3)
        });
    }

    /**规则按钮 */
    private button_rule() {
        AudioManager.getInstance().playSFX("button_click")
        if (this._nnData == null)
            return;
        let info =
        {
            rule: JSON.stringify(this._nnData.gameinfo.rule),
            gameType: GameDataManager.getInstance().curGameType,
        }
        UIManager.getInstance().openUI(ShowRuleUI, 5, () => {
            UIManager.getInstance().getUI(ShowRuleUI).getComponent("ShowRuleUI").initUI(info, 1);
        })
    }

    /**表情按钮 */
    private button_chat() {
        AudioManager.getInstance().playSFX("button_click")
        if (this._nnData == null)
            return;
        var oRule = this._nnData.gameinfo.rule
        if (oRule.option.block_hu_dong)
        {
            GameManager.getInstance().openWeakTipsUI("本局禁止互动，详情请联系群主");
            return
        }
        UIManager.getInstance().openUI(GameChatUI, 2);
    }
   
     /**玩家头像按钮 */
     private btn_info(event, CustomEvent) {
        if (this._nnData == null)
            return;
        var seat = parseInt(CustomEvent) 
        UIManager.getInstance().openUI(infoGameUI, 20, () => {
            UIManager.getInstance().getUI(infoGameUI).getComponent("infoGameUI").initData(seat)
        })
    }

    private btn_owner_start()
    {
        AudioManager.getInstance().playSFX("button_click")
        // todo:
        GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_OxStartGame.MsgID.ID, {});
    }

    
    private btn_display()
    {
        if (this._nnData.gameinfo.gameState == GAME_STATE_NN.STATE_PLAY && !this._nnData.playerInfoMap.get(0).isDisplayedCards)
        {
            AudioManager.getInstance().playSFX("button_click")
            GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_OxSplitCards.MsgID.ID, {});
        }
    }

    private btn_call(event, customEventData) // 抢庄
    {
        if (this._nnData.gameinfo.gameState == GAME_STATE_NN.STATE_ROB_BANKER && !this._nnData.playerInfoMap.get(0).isCallBanker)
        {
            AudioManager.getInstance().playSFX("button_click")
            var times = parseInt(customEventData)
            GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_OxCallBanker.MsgID.ID, {times:times});
        }
    }

    private btn_df(event, customEventData) // 抢庄
    {
        if (this._nnData && this._nnData.gameinfo && this._nnData.gameinfo.gameState == GAME_STATE_NN.STATE_BIT && !this._nnData.playerInfoMap.get(0).isUseScore)
        {
            AudioManager.getInstance().playSFX("button_click")
            var dfList = this._nnData.gameinfo.rule.play.base_score
            var idx = parseInt(customEventData)
            GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_OxAddScore.MsgID.ID, {score:dfList[idx]});
        }
    }

}