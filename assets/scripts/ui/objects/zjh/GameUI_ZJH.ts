import { SelectTipsUI } from './../../SelectTipsUI';
import { GameUIRepeatMsgManage } from './../../GameUIRepeatMsgManage';
import { GameChatUI } from './../../GameChatUI';
import { VoiceManager } from './../../../../framework/Utils/VoiceManager';
import { SdkManager } from './../../../../framework/Utils/SdkManager';
import { PLAYER_STATE } from './../../../data/zjh/GamePlayerInfo_ZJH';
import { Utils } from './../../../../framework/Utils/Utils';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { ShowRuleUI } from './../rule/ShowRuleUI';
import { GameSettingUI } from './../../GameSettingUI';
import { ClubUI } from './../../ClubUI';
import { StringData } from './../../../data/StringData';
import { GameManager } from './../../../GameManager';
import { GameUIController } from './../../GameUIController';
import { HallUI } from './../../HallUI';
import { GAME_STATE_ZJH } from './../../../data/zjh/GameInfo_ZJH';
import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { GameApplyUI } from './../../GameApplyUI';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { ListenerType } from './../../../data/ListenerType';
import { ListenerManager } from './../../../../framework/Manager/ListenerManager';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { BaseUI } from "../../../../framework/UI/BaseUI";
import * as Proto from "../../../../proto/proto-min";
import { ZjhCheckCardType } from '../../../data/zjh/ZjhCheckCardType';
import infoGameUI from '../info/infoGameUI';
import ZjhGameOver_UI from './ZjhGameOver_UI';
import { SelectTipsUI2 } from '../../SelectTipsUI2';

const { ccclass, property } = cc._decorator;

@ccclass
export class GameUI_ZJH extends BaseUI {
    protected static className = "GameUI_ZJH";

    @property([cc.SpriteFrame])
    stateSpf: cc.SpriteFrame[] = [];
    @property(cc.Label)
    labelRoom: cc.Label = null;
    @property(cc.Label)
    labelRound: cc.Label = null;
    @property(cc.Label)
    labelLun: cc.Label = null;
    @property(cc.ProgressBar)
    battleProgress: cc.ProgressBar = null;
    @property(cc.Label)
    labelSigle: cc.Label = null;
    @property(cc.Label)
    labelTime: cc.Label = null;
    @property(cc.Node)
    bpPlayerWin: cc.Node = null;
    @property(cc.Node)
    bpPlayerLose: cc.Node = null;
    @property(cc.Animation)
    animQiePaiLeft: cc.Animation = null;
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
    @property(cc.Sprite)
    ping: cc.Sprite = null;
    @property({ type: [cc.SpriteFrame] })
    pingLvArg: Array<cc.SpriteFrame> = [];


    private _zjhData = null;
    private m_isOver = false
    private m_curUpdateTime = 1; // 两秒更新一次电量和时间
    private chipsNodeList = []
    private loopEndTime = 0
    private m_inviteTimeout = 0
    private startTime = 0 // 准备倒计时
    private voicePlaying = false
    private cardCache = new Map()

    onLoad() {
        
    }
    
    onDataRecv() // 只有首次ui打开，加载完成才会执行该流程
    {
        this._zjhData = GameDataManager.getInstance().getDataByCurGameType();
        infoGameUI.actionState = false
        this.initListen()
        this.initPlayerView()
        this.onRoundChanged()
        this.onLunChanged()
        this.setRoomId()
    }

    onDestroy() {
        super.onDestroy();
        this._zjhData = null;
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
        this._zjhData = GameDataManager.getInstance().getDataByCurGameType();
    }

    resetDataOnBack()// 切后台之后切回前台需要清理数据
    {
        this._zjhData = GameDataManager.getInstance().getDataByCurGameType();
        this.resetPlayerView()
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
        ListenerManager.getInstance().add(Proto.SC_ZhaJinHuaStartGame.MsgID.ID, this, this.onOwnerStart);

        ListenerManager.getInstance().add(ListenerType.zjh_start, this, this.onGameStart);
        ListenerManager.getInstance().add(ListenerType.zjh_curOperateChange, this, this.onCurOperateChanged);
        ListenerManager.getInstance().add(ListenerType.zjh_handCardChanged, this, this.onHandCardChanged);
        ListenerManager.getInstance().add(ListenerType.zjh_playerNumChanged, this, this.onPlayerNumChanged);                     // 收到玩家人数改变
        ListenerManager.getInstance().add(ListenerType.zjh_dismissResponse, this, this.onRoomDissmissResponse);                     // 收到解散请求
        ListenerManager.getInstance().add(ListenerType.zjh_playerStateChanged, this, this.onPlayerStateChanged);                 // 收到玩家游戏状态改变
        ListenerManager.getInstance().add(ListenerType.zjh_ownerChanged, this, this.onOwnerChanged);                             // 房主改变
        ListenerManager.getInstance().add(ListenerType.zjh_dealerChanged, this, this.onDealerChanged);                           // 庄家改变
        ListenerManager.getInstance().add(ListenerType.zjh_curRoundChange, this, this.onRoundChanged);
        ListenerManager.getInstance().add(ListenerType.zjh_LunChanged, this, this.onLunChanged);
        ListenerManager.getInstance().add(ListenerType.zjh_gameState, this, this.onGameStateChanged);
        ListenerManager.getInstance().add(ListenerType.zjh_playerScoreChanged, this, this.onPlayerScoreChanged);                 // 玩家分数改变
        ListenerManager.getInstance().add(ListenerType.zjh_playerAllUseScoreChanged, this, this.onUsedScoreChange);
        ListenerManager.getInstance().add(ListenerType.zjh_putChipsToTable, this, this.onPutChipsRec);
        ListenerManager.getInstance().add(ListenerType.zjh_cardStateChanged, this, this.onCardStateRec);
        ListenerManager.getInstance().add(ListenerType.zjh_allScoreChanged, this, this.onDeskScoreChanged);
        ListenerManager.getInstance().add(ListenerType.zjh_baseScoreChanged, this, this.onBaseScoreChanged);
        ListenerManager.getInstance().add(ListenerType.zjh_biPaiAction, this, this.onBiPaiResult);
        ListenerManager.getInstance().add(ListenerType.operateTimeChange, this, this.onTimeChange);
        ListenerManager.getInstance().add(ListenerType.zjh_voice, this, this.onActionVoiceRec);
        ListenerManager.getInstance().add(ListenerType.zjh_gameRoundOver, this, this.onGameRoundOver);
        ListenerManager.getInstance().add(ListenerType.zjh_allInAction, this, this.onPlayerAllIn);
        ListenerManager.getInstance().add(ListenerType.zjh_onStatusChanged, this, this.onPlayerStatusChanged);

    }

    /**更新所有显示 */
    public onGameStart() {
        this.m_isOver = false
        this.resetPlayerView()
        this.updatePlayerCard()
        this.updateChips()
        this.updatePlayerState()
        this.onDeskScoreChanged(null)
        this.onBaseScoreChanged(null)
        this.initDeskBaseScore()
        this.updateVoiceBtn()
    }

    private initPlayerView()
    {
        this.node.getChildByName("node_player").active = true
        this._zjhData.playerInfoMap.forEach((infoObj, seat)=>{
            this.node.getChildByName("node_player").getChildByName("player"+seat).active = true
            this.setPlayerHeadImg(seat)
            this.setPlayerReady(seat)
            this.setPlayerName(seat)
            this.setPlayerOnline(seat)
            this.setScore(seat)
            this.setMaster(seat);
            this.setOwner(seat);
            this.setUsedScore(seat);
        })
    }

    private resetPlayerView()
    {
        for (var i = 0; i < 8; i++)
        {
            if (this._zjhData.playerInfoMap.get(i))
            {
                this.node.getChildByName("node_player").getChildByName("player" + i).getChildByName("gray").active =false
                this.node.getChildByName("node_player").getChildByName("player" + i).getChildByName("round_over_score").active =false
                this.node.getChildByName("node_player").getChildByName("player" + i).getChildByName("round_over_score_union").active =false
                this.node.getChildByName("node_player").getChildByName("player" + i).getChildByName("all_in_label").active =false
                this.node.getChildByName("node_player").getChildByName("player" + i).getChildByName("timer").getComponent(cc.ProgressBar).progress = 0
                this.updatePlayerView(i)
            }
            else
            {
                for (var j = 0; j < 3; j++)
                {
                    var cardNode =  this.node.getChildByName("node_player").getChildByName("player"+i).getChildByName("card"+i+"_"+j)
                    cardNode.active = false
                }
                this.node.getChildByName("node_player").getChildByName("player" + i).getChildByName("round_over_score").active =false
                this.node.getChildByName("node_player").getChildByName("player" + i).getChildByName("round_over_score_union").active =false
                this.node.getChildByName("node_player").getChildByName("player" + i).getChildByName("card_type").active = false
                this.node.getChildByName("node_player").getChildByName("player" + i).getChildByName("gray").active =false
                this.node.getChildByName("node_player").getChildByName("player" + i).getChildByName("state").active =false
                this.node.getChildByName("node_player").getChildByName("player" + i).getChildByName("all_in_label").active =false
                var labelScore = this.node.getChildByName("node_player").getChildByName("player" + i).getChildByName("use_score").getChildByName("label_score").getComponent(cc.Label) 
                labelScore.string = "0"
                this.node.getChildByName("node_player").getChildByName("player" + i).active = false
            }
        }
    }

    private initDeskBaseScore()
    {
        var menZhu = this._zjhData.gameinfo.rule.play.base_men_score
        if (!menZhu)
            menZhu = this._zjhData.gameinfo.rule.play.base_score
        var playerNum = 0
        this._zjhData.playerInfoMap.forEach((infoObj, seat)=>{
            if (infoObj.isGaming)
                playerNum += 1
        })
        for (var child of this.chipsNodeList)
            child.removeFromParent()
        this.chipsNodeList = []
        if (this._zjhData.gameinfo.chipsArray.length != 0)
        {
            for (var score of this._zjhData.gameinfo.chipsArray)
                this.onPutChipsRec({seat:0, score:score}, false)
            return
        }
        if (this._zjhData.gameinfo.allScore != playerNum * menZhu)
            return
        this._zjhData.playerInfoMap.forEach((infoObj, seat)=>{
            if (infoObj.isGaming)
                this.onPutChipsRec({seat:seat, score:infoObj.usescore})
        })
    }


    private updateVoiceBtn()
    {
        var oRule = this._zjhData.gameinfo.rule
        this.node.getChildByName("yy_button").active = true
    }

    /**刷新所有玩家牌相关 */
    private updatePlayerCard(hide = false) {
        this._zjhData.playerInfoMap.forEach((infoObj, seat)=>{
            for (var i = 0; i < 3; i++)
            {
                var cardNode =  this.node.getChildByName("node_player").getChildByName("player"+seat).getChildByName("card"+seat+"_"+i)
                if (hide)
                    cardNode.active = false
                else
                {
                    cardNode.active = infoObj.isGaming && GAME_STATE_ZJH.PER_BEGIN != this._zjhData.gameinfo.gameState && infoObj.status != 10
                    if (infoObj.cards.length > 0)
                        this.setCardTexture(cardNode,infoObj.cards[i])
                }
            }
            this.updateCardTyep(seat)
        })
    }

    private updatePlayerState()
    {
        this._zjhData.playerInfoMap.forEach((infoObj, seat)=>{
            var stateIdx = 0
            if (infoObj.state == PLAYER_STATE.STATE_LOOK)
                stateIdx = 0
            else if (infoObj.state == PLAYER_STATE.STATE_ABANDON)
            {
                this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("gray").active = true
                stateIdx = 1
            }
            else if (infoObj.state == PLAYER_STATE.STATE_FALI)
            {
                this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("gray").active = true
                stateIdx = 2
            }
            else
                stateIdx = -1
            var stateNode = this.node.getChildByName("node_player").getChildByName("player"+seat).getChildByName("state")
            if (seat== 0 && infoObj.state == PLAYER_STATE.STATE_LOOK)
            {
                stateNode.active = false
                return
            }
            stateNode.active = stateIdx != -1
            if (stateIdx >= 0)
                stateNode.getComponent(cc.Sprite).spriteFrame = this.stateSpf[stateIdx]
        })
        
    }

    // 更新当前的筹码
    private updateChips()
    {
        var chipsList = this._zjhData.gameinfo.rule.play.chip_score
        var curBaseScore = this._zjhData.gameinfo.baseScore
        var difen = this._zjhData.gameinfo.rule.play.base_score
        var times = 1
        var chipsNode = this.node.getChildByName("chip_node").getChildByName("sp_addchips_bg")
        chipsList.sort(function (a, b) { return a - b});
        if (this._zjhData.playerInfoMap.get(0).state == PLAYER_STATE.STATE_LOOK)
            times = 2 // 看牌翻倍
        for (var i=1; i<4; i++)
        {
            chipsNode.getChildByName("score"+i).active = chipsList[i - 1] != 0
            if (curBaseScore >= difen*chipsList[i-1])
                chipsNode.getChildByName("score"+i).active = false
            chipsNode.getChildByName("score"+i).getChildByName("label_score").getComponent(cc.Label).string = (difen*chipsList[i-1]*times).toString()
        }
    }

    private updateCardTyep(seat)
    {
        var typeNode = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("card_type")
        var cards =  this._zjhData.playerInfoMap.get(seat).cards
        if (cards.length == 0 || cards[0] == 255)
        {
            typeNode.active = false
            return
        }
        var type = ZjhCheckCardType.checkZjhCardType(cards)
        typeNode.getComponent(cc.Sprite).spriteFrame = this.cardTypeSpf[type-1]
        typeNode.active = true
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
        if (this._zjhData && this._zjhData.gameinfo&&this._zjhData.gameinfo.curGameOverData != null){ // 如果解散的时候有总结算数据，关闭界面之后弹出总结算
            this._zjhData.gameinfo.isDismissed = true
            this._zjhData.setGameState(GAME_STATE_ZJH.STATE_FINAL_OVER);
            MessageManager.getInstance().disposeMsg();
            return
        }
        if (msg.success){
            GameManager.getInstance().openWeakTipsUI(StringData.getString(10036))
            var uiType = -1
            if (this._zjhData && !this._zjhData.gameinfo.clubId)
                uiType = -1
            else 
                uiType = parseInt(cc.sys.localStorage.getItem("curClubType")) ;
            if (uiType != -1)
                MessageManager.getInstance().messageSend(Proto.C2S_CLUBLIST_REQ.MsgID.ID, {type: uiType});
            else
                UIManager.getInstance().openUI(HallUI, 1, () => {
                    GameUIController.getInstance().closeCurGameUI()
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
            UIManager.getInstance().closeUI(ZjhGameOver_UI);
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
                if (!this._zjhData.gameinfo.clubId)
                    uiType = -1
                else 
                    uiType = parseInt(cc.sys.localStorage.getItem("curClubType")) ;
                if (uiType != -1)
                    MessageManager.getInstance().messageSend(Proto.C2S_CLUBLIST_REQ.MsgID.ID, {type: uiType});
                else
                    UIManager.getInstance().openUI(HallUI, 1, () => {
                        GameUIController.getInstance().closeCurGameUI()
                        UIManager.getInstance().closeUI(ZjhGameOver_UI)
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
        if (this._zjhData.gameinfo.gameState == GAME_STATE_ZJH.PER_BEGIN)
        {
            if (this._zjhData.gameinfo.clubId != 0 && this._zjhData.playerInfoMap.size != this._zjhData.getCurTypePlayerNum())
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
        Utils.loadTextureFromNet(headNode, this._zjhData.playerInfoMap.get(seat).headurl)
    }

    private setPlayerName(seat)
    {
        var labelName = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("label_name").getComponent(cc.Label)     //得到名字label
        labelName.string = Utils.getShortName(this._zjhData.playerInfoMap.get(seat).name, 10);
    }

    private setPlayerReady(seat)
    {
        var readyNode = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("ready")    //得到准备节点
        if (this._zjhData.gameinfo.gameState ==  GAME_STATE_ZJH.STATE_PLAY)
        {
            readyNode.active = false
            return
        }
        readyNode.active = this._zjhData.playerInfoMap.get(seat).isready;
        if (seat == 0)
            this.node.getChildByName("node_begin").getChildByName("btn_mid_ready").active = !readyNode.active && this._zjhData.playerInfoMap.get(seat).status != 10
        this.checkStartButton()
    }

    /**设置分数 */
    public setScore(seat) 
    {
        var labelScore = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("score").getComponent(cc.Label) 
        // var score = this._zjhData.playerInfoMap.get(seat).score
        // var oRule = this._zjhData.gameinfo.rule
        // if (!oRule.union)
        var score = this._zjhData.playerInfoMap.get(seat).clubScore
        labelScore.string = score.toString();
        if (score < 0)
            labelScore.node.color = new cc.Color(255, 64, 64);
        else
            labelScore.node.color = new cc.Color(251, 224, 72);
    }

    public setUsedScore(seat)
    {
        var labelScore = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("use_score").getChildByName("label_score").getComponent(cc.Label)
        var score = this._zjhData.playerInfoMap.get(seat).usescore
        labelScore.string = score.toString();
    }

    /**玩家是否在线 */
    public setPlayerOnline(seat)
    {
        var onlineNode = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("online")
        onlineNode.active = !this._zjhData.playerInfoMap.get(seat).isonline;
    }

     /**设置庄家 */
     private setMaster(index) 
     {
         var seat = index;
         var playerID = this._zjhData.playerInfoMap.get(seat).id
         var masterNode = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("sp_master_bg") 
         masterNode.active = (playerID == this._zjhData.gameinfo.dealerId)
     }

    /**设置房主 */
    private setOwner(seat)
    {
        if (this._zjhData.playerInfoMap.get(seat))
        {
            var playerID = this._zjhData.playerInfoMap.get(seat).id
            var ownerNode = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("sp_fang") 
            ownerNode.active = (playerID == this._zjhData.gameinfo.creator)
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
        var index = this._zjhData.getSeatById(msg.id);
        if (index >= 0)
            this.setScore(index)
    }

    private onUsedScoreChange(msg)
    {
        var index = this._zjhData.getSeatById(msg.id);
        if (index >= 0)
            this.setUsedScore(index)
    }

    private onDeskScoreChanged(msg)
    {
        this.node.getChildByName("label_all_score").getComponent(cc.Label).string = "总分：" + this._zjhData.gameinfo.allScore
    }

    private onBaseScoreChanged(msg)
    {
        // this.node.getChildByName("label_base_score").getComponent(cc.Label).string = "单注：" + this._zjhData.gameinfo.baseScore
        this.updateChips()
    }

    private onOwnerChanged(msg)
    {
        var index = this._zjhData.getSeatById(msg.id);
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
            this._zjhData.playerInfoMap.forEach((infoObj, seat)=>{
                var masterNode = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("sp_master_bg") 
                masterNode.active = false
            })
            return
        }
        var index = this._zjhData.getSeatById(msg.id);
        this.setMaster(index)
    }

    private onPlayerStatusChanged(msg)
    {
        var index = this._zjhData.getSeatById(msg.id);
        if (index >= 0) //破产了
        {
            var labelStatus = this.node.getChildByName("node_player").getChildByName("player" + index).getChildByName("label_status")
            if (msg.status == 10)
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
        var curRule = this._zjhData.gameinfo.rule
        var list = [8, 12, 16, 20];
        var ruleJuShu = list[curRule.round.option];
        this.labelRound.string = this._zjhData.gameinfo.curRound + "/" + ruleJuShu
        // if (this._zjhData.gameinfo.curRound > 0)
            // this.node.getChildByName("gps").active = false
    }

    private onLunChanged()
    {
        var curRule = this._zjhData.gameinfo.rule
        var list = [8, 10, 12];
        var ruleLun = list[curRule.play.max_turn_option];
        this.labelLun.string = this._zjhData.gameinfo.curLun + "/" + ruleLun
    }

    private onCardStateRec(msg)
    {
        var playerNode = this.node.getChildByName("node_player").getChildByName("player"+msg.seat)
        var idx = -1
        if (msg.state == PLAYER_STATE.STATE_LOOK)
            idx = 0
        else if (msg.state == PLAYER_STATE.STATE_ABANDON)
        {
            playerNode.getChildByName("gray").active = true
            idx = 1
        }
        else if (msg.state == PLAYER_STATE.STATE_FALI)
        {
            idx = 2
            playerNode.getChildByName("gray").active = true
        }
        if (idx <= -1)
        {
            playerNode.getChildByName("state").active = false
            return
        }
        if (msg.seat == 0 && msg.state == PLAYER_STATE.STATE_LOOK)
        {
            this.updateChips()
            return
        }
        playerNode.getChildByName("state").getComponent(cc.Sprite).spriteFrame = this.stateSpf[idx]
        playerNode.getChildByName("state").active = true
    }

    //设置房间号
    private setRoomId(room?) {
        if (room) {
            this.labelRoom.string = room;
        }
        else {
            this.labelRoom.string = this._zjhData.gameinfo.roomId.toString();
        }

    }

    /**手牌变化 */
    private onHandCardChanged(msg) {
        var playerObj = this._zjhData.playerInfoMap.get(msg.seat)
        var playerNode = this.node.getChildByName("node_player").getChildByName("player"+msg.seat)
        for (var i = 0; i < 3; i++)
        {
            var cardNode =  playerNode.getChildByName("card"+msg.seat+"_"+i)
            cardNode.active = playerObj.isGaming
            if (playerObj.cards.length > 0)
                this.setCardTexture(cardNode,playerObj.cards[i])
        }
        this.updateCardTyep(msg.seat)
    }

    private onPlayerAllIn(msg)
    {
        if (!this._zjhData)
            return
        if (msg.allInSeat == 0)
            this.node.getChildByName("node_zjh_button").active = false
        var actionNode = this.node.getChildByName("node_player").getChildByName("player"+msg.allInSeat).getChildByName("all_in_label")
        actionNode.opacity = 0
        let action1 = cc.fadeIn(0.1);
        let action2 = cc.delayTime(1);
        let action3 = cc.fadeOut(0.1);
        let finishFunc = cc.callFunc(function () {
            MessageManager.getInstance().disposeMsg();
            if (!this._zjhData)
                return
            if (msg.isWin) // 孤注一掷赢了
            {
                this._zjhData.playerInfoMap.forEach((infoObj, seat)=>{
                    if (seat != msg.allInSeat)
                        infoObj.state = PLAYER_STATE.STATE_FALI
                })
            }
            else{
                this._zjhData.playerInfoMap.get(msg.allInSeat).state = PLAYER_STATE.STATE_FALI
            }
        }.bind(this))
        actionNode.active = true
        actionNode.runAction(cc.sequence(action1,action2,action3,finishFunc))
    }

    private stopBpaction()
    {
        this.node.getChildByName("bp_action").getChildByName("sp_head_win").stopAllActions()
        this.node.getChildByName("bp_action").getChildByName("sp_head_lose").stopAllActions()
        this.bpPlayerWin.stopAllActions()
        this.bpPlayerLose.stopAllActions()
        this.node.getChildByName("bp_action").active = false
    }

    private onBiPaiResult(msg)
    {
        var endPoslose = cc.v2(-420,15)
        var endPosWin = cc.v2(430,15)
        var startPoslose = this.node.getChildByName("bp_action").getChildByName("pos"+msg.loserSeat).position
        var startPosWin = this.node.getChildByName("bp_action").getChildByName("pos"+msg.winnerSeat).position

        var winnnerHeadNode = this.node.getChildByName("bp_action").getChildByName("sp_head_win")
        var loseHeadNode = this.node.getChildByName("bp_action").getChildByName("sp_head_lose")
        this.node.getChildByName("node_zjh_button").active = false
        this.node.getChildByName("node_bp").active = false
        this.bpPlayerWin.getChildByName("name").active = false
        this.bpPlayerWin.getChildByName("cards").active = false
        this.bpPlayerLose.getChildByName("name").active = false
        this.bpPlayerLose.getChildByName("qiepai").active = false
        this.bpPlayerLose.getChildByName("cards").active = false
        this.bpPlayerLose.getChildByName("pai2").active = false
        this.bpPlayerLose.getChildByName("pai1").active = false
        this.bpPlayerWin.stopAllActions()
        this.bpPlayerLose.stopAllActions()
        this.node.getChildByName("bp_action").active = true
        this.node.getChildByName("bp_action").getChildByName("label_vs").active = false
        this.bpPlayerLose.position = cc.v3(-262,15)
        this.bpPlayerWin.position = cc.v3(273,15)
        var winnerHead = this._zjhData.playerInfoMap.get(msg.winnerSeat).headurl
        var winnnerName = this._zjhData.playerInfoMap.get(msg.winnerSeat).name
        var loseHead = this._zjhData.playerInfoMap.get(msg.loserSeat).headurl
        var loseName = this._zjhData.playerInfoMap.get(msg.loserSeat).name
        Utils.loadTextureFromNet(winnnerHeadNode.getComponent(cc.Sprite), winnerHead)
        Utils.loadTextureFromNet(loseHeadNode.getComponent(cc.Sprite),loseHead)

        var action1 = cc.moveTo(0.2, cc.v2(-211, 15));
        var action2 = cc.moveTo(0.2, cc.v2(222, 15));
        var action5 = cc.moveTo(0.3, endPoslose);
        var action6 = cc.moveTo(0.3, endPosWin);
        var action7 = cc.moveTo(0.3, cc.v2(startPoslose.x, startPoslose.y));
        var action8 = cc.moveTo(0.3, cc.v2(startPosWin.x, startPosWin.y));
        var moveFinish = cc.callFunc(function () {
            this.node.getChildByName("bp_action").active = false
            this.node.getChildByName("node_player").getChildByName("player"+msg.loserSeat).active = true
            this.node.getChildByName("node_player").getChildByName("player"+msg.winnerSeat).active = true
            this._zjhData.playerInfoMap.get(msg.loserSeat).state = PLAYER_STATE.STATE_FALI
            MessageManager.getInstance().disposeMsg();
        }.bind(this));

        var action3 = cc.callFunc(function () {
            loseHeadNode.position = startPoslose
            this.node.getChildByName("node_player").getChildByName("player"+msg.loserSeat).active = false
            loseHeadNode.runAction(action5)

        }.bind(this));
        var action4 = cc.callFunc(function () {
            winnnerHeadNode.position = startPosWin
            this.node.getChildByName("node_player").getChildByName("player"+msg.winnerSeat).active = false
            winnnerHeadNode.runAction(action6)
        }.bind(this));

        //切牌
        var qiepai_left = cc.callFunc(function () {
            this.bpPlayerWin.getChildByName("name").getComponent(cc.Label).string = winnnerName
            this.bpPlayerLose.getChildByName("name").getComponent(cc.Label).string = loseName
            this.bpPlayerWin.getChildByName("name").active = true
            this.bpPlayerWin.getChildByName("cards").active = true
            this.bpPlayerLose.getChildByName("name").active = true
            this.bpPlayerLose.getChildByName("cards").active = true
            this.bpPlayerLose.getChildByName("qiepai").active = true
            this.node.getChildByName("bp_action").getChildByName("label_vs").active = true
            this.animQiePaiLeft.play("qiepai");
        }.bind(this));

        var result = cc.callFunc(function () {
            this.bpPlayerLose.getChildByName("pai2").active = true
            this.bpPlayerLose.getChildByName("pai1").active = true
            this.bpPlayerLose.getChildByName("cards").active = false
        }.bind(this));

        var finish = cc.callFunc(function () {
            loseHeadNode.runAction(cc.sequence(action7,moveFinish))
            winnnerHeadNode.runAction(action8)
        }.bind(this));
        let delayAction1 = cc.delayTime(1);
        let delayAction2 = cc.delayTime(0.5);
        let delayAction3 = cc.delayTime(0.6);
        this.bpPlayerWin.runAction(cc.sequence(action2,action4,delayAction2,delayAction1,finish))
        this.bpPlayerLose.runAction(cc.sequence(action1,action3,delayAction2,qiepai_left,delayAction3,result))
    }


    private onPutChipsRec(msg, action = true)
    {
        let beginPos = this.node.getChildByName("node_player").getChildByName("player"+msg.seat).position;
        var difen = this._zjhData.gameinfo.rule.play.base_score
        var chipsMap = this._zjhData.gameinfo.rule.play.chip_score
        var nodeIdx = 0
        if(msg.score <= chipsMap[0]*difen || msg.score == difen)
            nodeIdx = 1
        else if (msg.score <= chipsMap[1]*difen) 
            nodeIdx = 2
        else
            nodeIdx = 3
        let newchip = this.newChipNode(beginPos, msg.score, nodeIdx);
        if (action)
            newchip.runAction(cc.sequence(cc.moveTo(0.2, cc.v2(this.randomPos().x,this.randomPos().y)), cc.callFunc(msg.callback)));
        else
            newchip.position = this.randomPos()
    }


    private newChipNode(beginPos, score, nodeIdx)
    {
        var chipNode = this.node.getChildByName("chip_node").getChildByName("sp_addchips_bg").getChildByName("score"+nodeIdx); 
        let newchip = cc.instantiate(chipNode);
        newchip.getComponent(cc.Button).interactable = false
        newchip.parent = this.node.getChildByName("node_chips");
        this.chipsNodeList.push(newchip);
        newchip.active = true;
        newchip.x = beginPos.x;
        newchip.y = beginPos.y;
        newchip.scale = 0.5;
        newchip.getChildByName("label_score").getComponent(cc.Label).string = score.toString();
        return newchip;
    }

    private randomPos(): cc.Vec3 {
        var chips_node = this.node.getChildByName("node_chips")
        var size = chips_node.getContentSize();
        let x = Utils.reandomNumBoth(-size.width / 2, size.width / 2);
        let y = Utils.reandomNumBoth(-size.height / 2,size.height / 2);
        return cc.v3(x, y);
    }

    
    private onStartTimeRec(msg)
    {
        this.startTime = msg.leftTime
        this.node.getChildByName("time").active = true;
        this.node.getChildByName("time").getComponent(cc.Label).string = "游戏即将开始（"+this.startTime+"s）"
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

    private onVoiceRec(msg)
    {
        if(this._zjhData == null)
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
        var senderSeat = this._zjhData.getSeatById(msg.sender);
        if (senderSeat >= 0)
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
        if (!this._zjhData)
            return;
        this._zjhData.playerInfoMap.forEach((infoObj, seat)=>{
            var tempVoiceNode = this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("yy_icon")
            tempVoiceNode.stopAllActions();
            tempVoiceNode.active = false;
        }) 
    }

    private onTimeChange(msg)
    {
        this.unscheduleAllCallbacks()
        var timeList = [5,10,15,30,45]
        var time = this._zjhData.gameinfo.time
        var operatorSeat = this._zjhData.getSeatById(this._zjhData.gameinfo.curOperateId)
        var allTime = timeList[this._zjhData.gameinfo.rule.trustee.second_opt]
        var percent = (allTime -  time) / allTime
        if (operatorSeat >= 0) // 容错处理
            this.node.getChildByName("node_player").getChildByName("player" + operatorSeat).getChildByName("timer").getComponent(cc.ProgressBar).progress = percent
        this.loopEndTime = new Date().getTime() + time*1000
        this.schedule(this.loop, 0.05);
    }

    private loop() {
        if (new Date().getTime() <  this.loopEndTime)
        {
            var timeList = [5,10,15,30,45]
            var allTime = timeList[this._zjhData.gameinfo.rule.trustee.second_opt]
            var leftTime = (this.loopEndTime -new Date().getTime())/1000
            var percent = (allTime -  leftTime) / allTime
            var operatorSeat = this._zjhData.getSeatById(this._zjhData.gameinfo.curOperateId)
            if (operatorSeat >= 0) // 容错处理
                this.node.getChildByName("node_player").getChildByName("player" + operatorSeat).getChildByName("timer").getComponent(cc.ProgressBar).progress = percent
        }
        else
            this.unschedule(this.loop);
    }

    private loop1()
    {
        if (this.startTime > 0)
        {
            this.startTime -= 1
            this.node.getChildByName("time").getComponent(cc.Label).string = "游戏即将开始（"+this.startTime+"s）"
        }
        else
        {
            this.node.getChildByName("time").active = false;
            this.unschedule(this.loop1);
        }
    }

    // 小局结算赢筹码动画
    private onRoundOverWinChips(msg) {
        let allchips = this.chipsNodeList.length;
        if (allchips == 0) {
            this.chipsNodeList = [];
            if (msg.callback)
                msg.callback();
            return;
        }
        let endpos = this.node.getChildByName("node_player").getChildByName("player"+msg.winnerSeat).position;
        for (let i = 0; i < this.chipsNodeList.length; ++i) {
            let action0 = cc.moveTo(0.3, cc.v2(endpos.x, endpos.y));
            let action1 = cc.removeSelf();
            let finish = cc.callFunc(function (node) {
                allchips -= 1;
                if (allchips == 0) {
                    this.chipsNodeList = [];
                    if (msg.callback)
                        msg.callback();
                    return;
                }
            }, this);
            this.chipsNodeList[i].runAction(cc.sequence(action0, action1, finish));
        }
    }

    
    //单局结束
    private onGameRoundOver(msg)
    {
        var mapScore = new Map()
        this.m_isOver = true
        var data = msg.roundOverData
        var winnerSeat = this._zjhData.getRealSeatByRemoteSeat(data.winner)
        this.unschedule(this.loop);
        this._zjhData.playerInfoMap.forEach((infoObj, seat)=>{
            this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("timer").getComponent(cc.ProgressBar).progress = 0
        })
        for (var balanceInfo of data.balances)
        {
            var seat = this._zjhData.getRealSeatByRemoteSeat(balanceInfo.chairId)
            if(this._zjhData.playerInfoMap.get(seat))
            {
                var score = balanceInfo.money/100
                mapScore.set(seat, score)
                if (seat == 0)
                {
                    this._zjhData.playerInfoMap.get(0).cards = balanceInfo.cards
                }
                else
                {
                    if (this._zjhData.gameinfo.rule.play.show_card)
                        this._zjhData.playerInfoMap.get(seat).cards = balanceInfo.cards
                    else
                        this._zjhData.playerInfoMap.get(seat).cards = [255,255,255]
                }
                this._zjhData.playerInfoMap.get(seat).state = balanceInfo.status
                this._zjhData.playerInfoMap.get(seat).status = balanceInfo.pstatus
            }
        }
        let cbFunc = function () { // 显示每个人分数
            mapScore.forEach((score, seat)=>{
                var isUnion = true
                if (this._zjhData)
                {
                    var oRule = this._zjhData.gameinfo.rule
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
                if (this._zjhData && this._zjhData.playerInfoMap.get(seat))
                    this._zjhData.playerInfoMap.get(seat).clubScore += score
                if (this._zjhData && this._zjhData.gameinfo.curGameOverData != null) // 有总结算数据
                {
                    this.unscheduleAllCallbacks()
                    this._zjhData.setGameState(GAME_STATE_ZJH.STATE_FINAL_OVER);
                }
            })
        }

        this.onRoundOverWinChips({winnerSeat:winnerSeat, callback:cbFunc.bind(this)})
        this._zjhData.playerInfoMap.forEach((infoObj, seat)=>{
            this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("timer").getComponent(cc.ProgressBar).progress = 0
            this.setPlayerReady(seat)
        })
    }

   
    /**游戏状态改变 */
    private onGameStateChanged() {
        if (this._zjhData.gameinfo.gameState == GAME_STATE_ZJH.PER_BEGIN || this._zjhData.gameinfo.gameState == 0) {
            this.node.getChildByName("node_begin").active = true
            this.node.getChildByName("node_zjh_button").active = false
            this.node.getChildByName("chip_node").active = false
            this.node.getChildByName("label_all_score").active = false
            this.updatePlayerCard()
            this.resetPlayerView()
            this.inviteTimeLabel.string = "一键邀请"
            this.node.getChildByName("node_begin").getChildByName("btn_club_invite").getComponent(cc.Button).interactable = true;
            if (this._zjhData.gameinfo.mBTableStarted) {
                this.btnInvite.active = false;
            }
            else {
                this.btnInvite.active = false;
                if (this._zjhData.gameinfo.clubId != 0 && this._zjhData.playerInfoMap.size != this._zjhData.getCurTypePlayerNum())
                {
                    this.btnInvite.active = true;
                }
            }
        }
        else if (this._zjhData.gameinfo.gameState == GAME_STATE_ZJH.STATE_PLAY) {
            this.node.getChildByName("node_begin").active = false
            this.node.getChildByName("node_zjh_button").active = false
            this.node.getChildByName("label_all_score").active = true
            this.node.getChildByName("time").active = false;
            // this.node.getChildByName("label_base_score").active = true

        }
        else if (this._zjhData.gameinfo.gameState == GAME_STATE_ZJH.STATE_GAMEOVER )
        {
            this.inviteTimeLabel.string = "一键邀请"
            this.node.getChildByName("node_begin").getChildByName("btn_club_invite").getComponent(cc.Button).interactable = true;
            this.node.getChildByName("node_begin").active = true
            this.node.getChildByName("node_zjh_button").active = false
            this.node.getChildByName("chip_node").active = false
            this.node.getChildByName("label_all_score").active = true
        }
        else if (this._zjhData.gameinfo.gameState == GAME_STATE_ZJH.STATE_FINAL_OVER)
        {
            this.node.getChildByName("node_begin").active = false
            this.node.getChildByName("node_zjh_button").active = false
            this.node.getChildByName("chip_node").active = false
            this.node.getChildByName("label_all_score").active = true
            this.node.getChildByName("label_base_score").active = true
            UIManager.getInstance().openUI(ZjhGameOver_UI, 20, () => {
                UIManager.getInstance().closeUI(GameSettingUI);
                UIManager.getInstance().closeUI(SelectTipsUI);
                UIManager.getInstance().closeUI(SelectTipsUI2);
                UIManager.getInstance().closeUI(ShowRuleUI);
            })
            // var action_1 = cc.delayTime(2);
            // var action_2 = cc.callFunc(function () {
            //     UIManager.getInstance().openUI(ZjhGameOver_UI, 20, () => {
            //         UIManager.getInstance().closeUI(GameSettingUI);
            //         UIManager.getInstance().closeUI(ShowRuleUI);
            //     })
            // }.bind(this));
            // this.node.runAction(cc.sequence(action_1, action_2));
          
        }
        
    }

    private checkAutoReady() // 是否自动准备
    {
        // var isAutoReady = false
        // if (!this._zjhData.playerInfoMap.get(0).isready && this._zjhData.gameinfo.rule.option && !this._zjhData.gameinfo.rule.option.hand_ready)
        //     isAutoReady = true
        // else if (this._zjhData.gameinfo.rule.trustee)// 存在托管时
        // {
        //     // 全托管，半托管时，除开第一局需要手动准备，其它时候需要自动准备
        //     if ((this._zjhData.gameinfo.rule.trustee.type_opt == 0 || this._zjhData.gameinfo.rule.trustee.type_opt == 1) && this._zjhData.gameinfo.curRound >= 1) 
        //         isAutoReady = true
        // }

        // if (isAutoReady)
        //     MessageManager.getInstance().messageSend(Proto.CS_Ready.MsgID.ID, {});

    }

    public isBlockVocie()
    {
        var result = false;
        if (this._zjhData == null || this._zjhData.gameinfo == null)
            return;
        var oRule = this._zjhData.gameinfo.rule
        if (oRule.option.block_voice)
            result = true
        return result
    } 

    private checkStartButton(){
        if (this._zjhData == null)
            return;
        
        var oRule = this._zjhData.gameinfo.rule
        var myId = this._zjhData.playerInfoMap.get(0).id
        this.node.getChildByName("node_begin").getChildByName("btn_start").active = false
        var allReady = true
        this._zjhData.playerInfoMap.forEach((infoObj, seat)=>{
            if (!infoObj.isready)
                allReady = false
        })
        var num = this._zjhData.playerInfoMap.size
        // 我是房主，并且选了房主开桌的规则，并且所有人都准备
        if (this._zjhData.gameinfo.creator == myId && oRule.room.owner_start == true && allReady && num >= 2 && this._zjhData.gameinfo.curRound == 0)
        {
            this.node.getChildByName("node_begin").getChildByName("btn_start").active = true
        }
    }

    // 音效
    private onActionVoiceRec(msg) {
        var voiceStr = ""
        if (this._zjhData.playerInfoMap.get(msg.seat).sex == 1) 
            voiceStr = "man/" + "man_"+msg.type
        else
            voiceStr = "woman/" + "woman_"+msg.type
        AudioManager.getInstance().playSFX(voiceStr)
    }

    setOpBtnStyle(btnName, enabled) {
        var gameNode = this.node.getChildByName("node_zjh_button").getChildByName("node_button")
        gameNode.getChildByName(btnName).getComponent(cc.Button).interactable = enabled
       // gameNode.getChildByName(btnName).getChildByName("label_btn").getComponent(cc.LabelOutline).enabled = enabled
    }

    // 轮到谁操作
    onCurOperateChanged(msg) {
        
        var curseat = this._zjhData.getSeatById(this._zjhData.gameinfo.curOperateId);
        this.node.getChildByName("node_zjh_button").active = curseat == 0 // 轮到我出牌了
        this.node.getChildByName("chip_node").active = false
        this.node.getChildByName("node_bp").active = false
        if (curseat == 0) // 如果是自己，那么需要检测按钮
        {  
            GameUIRepeatMsgManage.getInstance().clearMsgLimitMap()
            var power = this._zjhData.gameinfo.curOperateControl
            var gameNode = this.node.getChildByName("node_zjh_button").getChildByName("node_button")
            this.setOpBtnStyle("btn_qi", power[2])
            this.setOpBtnStyle("btn_bi", power[5])
            this.setOpBtnStyle("btn_kan", power[3])
            this.setOpBtnStyle("btn_jia", power[1])
            this.setOpBtnStyle("btn_gen", power[6])
            if (power[4])
            {
                gameNode.getChildByName("btn_guzhu").active = true
                gameNode.getChildByName("btn_gen").active = false
            }
            else if (power[6])
            {
                gameNode.getChildByName("btn_gen").active = true
                gameNode.getChildByName("btn_guzhu").active = false
            }
        }
        this._zjhData.playerInfoMap.forEach((infoObj, seat)=>{
            if (infoObj.isGaming && curseat != seat)
            {
                this.node.getChildByName("node_player").getChildByName("player" + seat).getChildByName("timer").getComponent(cc.ProgressBar).progress = 0
            }
        })
    }

     //设置一张牌的显示
     private setCardTexture(node, cardid) {
        if (cardid == 255) // 隐藏牌
        {
            this.loadTextureAddCache(node.getComponent(cc.Sprite), "/cards/card_0_0");
            return
        }
        var textureId = Utils.getPdkColorAndMjTextureId(cardid)
        this.loadTextureAddCache(node.getComponent(cc.Sprite), "/cards/card_" + textureId);
    }


    //设置表情
    onInteractionRec(msg) {
        if (this._zjhData == null)
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
        var index = this._zjhData.getRealSeatByRemoteSeat(msg.sender);
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
        if (this._zjhData && this._zjhData.gameinfo){
            var senderSeat = this._zjhData.getRealSeatByRemoteSeat(msg.sender);
            var receiverSeat = this._zjhData.getRealSeatByRemoteSeat(msg.receiver);
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
        this.node.getChildByName("node_zjh_button").active = false
        this.node.getChildByName("chip_node").active = false
        this.node.getChildByName("VoiceUI").getChildByName("root").active = false
        this.node.getChildByName("node_bp").active = false
        this.node.getChildByName("node_begin").active = false
        UIManager.getInstance().closeUI(GameApplyUI)
        UIManager.getInstance().closeUI(ZjhGameOver_UI);
        UIManager.getInstance().closeUI(GameSettingUI);
        this.voicePlaying = false
        VoiceManager.getInstance().cancel();
        this.stopAllVoiceAction()
        infoGameUI.actionState = false
        this.stopBpaction() // 停止所有的动画
        this.unscheduleAllCallbacks() // 停止定时器
        this._zjhData = null // 切换后台后view层数据同步清理
        AudioManager.getInstance().resumeAll();
    }


    public loadTextureAddCache(loadnode, url: string, callback: any = null) {
        var sprite = loadnode.getComponent(cc.Sprite)
        if (url == null || url == "") {
            sprite.spriteFrame = null;
            if (callback != null)
                callback();
            return;
        }

        if (loadnode == null || sprite == null)
            return;
        if (this.cardCache.get(url))
        {
            sprite.spriteFrame = this.cardCache.get(url)
            if (callback != null)
                callback();
            return;
        }
        cc.loader.loadRes(url, cc.SpriteFrame,
            function (err, spriteFrame) {
                if (err) {
                    return;
                }
                sprite.spriteFrame = spriteFrame;
                this.cardCache.set(url, spriteFrame)
                if (callback != null)
                    callback();
            }.bind(this));
    }



    // /*——————————————————————————————————按钮事件————————————————————————————————————*/

    private button_invite_club() {
        AudioManager.getInstance().playSFX("button_click")
        if (this._zjhData == null)
            return;
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_INVITE_JOIN_ROOM.MsgID.ID, {clubId: this._zjhData.gameinfo.clubId});
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
        this.ping.spriteFrame = this.pingLvArg[GameDataManager.getInstance().getNetLevel()]
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

    private updateBiPaiView()
    {
        var num = 0
        var biPaiSeat = 0
        var parentNode = this.node.getChildByName("node_bp")
        for (var i = 1; i < 8; i++)
            parentNode.getChildByName("player"+i).active = false
        this._zjhData.playerInfoMap.forEach((infoObj, seat)=>{
            if (infoObj.status != 10 && infoObj.isGaming && seat != 0 && (infoObj.state == PLAYER_STATE.STATE_LOOK || infoObj.state == PLAYER_STATE.STATE_NORMAL))
            {
                num += 1
                biPaiSeat = seat
                parentNode.getChildByName("player"+seat).active = true
            }
            else if (seat != 0)
                parentNode.getChildByName("player"+seat).active = false
        })
        if (num == 1)// 只剩下一个能比牌的玩家自动选择这个玩家
        {
            parentNode.active = false;
            MessageManager.getInstance().messageSend(Proto.CS_ZhaJinHuaCompareCards.MsgID.ID, {compareWith:this._zjhData.playerInfoMap.get(biPaiSeat).seat});
        }
        else
            parentNode.active = true;
    }


    /**设置按钮 */
    private button_set() {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().openUI(GameSettingUI, 4,() => {
            if(this._zjhData && this._zjhData.playerInfoMap.get(0))
                UIManager.getInstance().getUI(GameSettingUI).getComponent("GameSettingUI").updateBtnByZjh(this._zjhData.playerInfoMap.get(0).isGaming, this._zjhData.playerInfoMap.get(0).status == 10)
        });
    }

    /**规则按钮 */
    private button_rule() {
        AudioManager.getInstance().playSFX("button_click")
        if (this._zjhData == null)
            return;
        let info =
        {
            rule: JSON.stringify(this._zjhData.gameinfo.rule),
            gameType: GameDataManager.getInstance().curGameType,
        }
        UIManager.getInstance().openUI(ShowRuleUI, 5, () => {
            UIManager.getInstance().getUI(ShowRuleUI).getComponent("ShowRuleUI").initUI(info, 1);
        })
    }

    /**表情按钮 */
    private button_chat() {
        AudioManager.getInstance().playSFX("button_click")
        if (this._zjhData == null)
            return;
        var oRule = this._zjhData.gameinfo.rule
        if (oRule.option.block_hu_dong)
        {
            GameManager.getInstance().openWeakTipsUI("本局禁止互动，详情请联系群主");
            return
        }
        UIManager.getInstance().openUI(GameChatUI, 2);
    }

    private button_qi() {
        AudioManager.getInstance().playSFX("button_click")
        var power = this._zjhData.gameinfo.curOperateControl
        if (power[2])
            GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_ZhaJinHuaGiveUp.MsgID.ID, {});
    }

    
    private button_bi() {
        AudioManager.getInstance().playSFX("button_click")
        var power = this._zjhData.gameinfo.curOperateControl
        if (power[5])
            this.updateBiPaiView()
    }

    private button_cancel() {
        AudioManager.getInstance().playSFX("button_click")
        this.node.getChildByName("node_bp").active = false
        this.onCurOperateChanged(null)
    }

    private button_selectBp(event,customEventData) {
        AudioManager.getInstance().playSFX("button_click")
        var seat = parseInt(customEventData)
        GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_ZhaJinHuaCompareCards.MsgID.ID, {compareWith:this._zjhData.playerInfoMap.get(seat).seat});
    }

    private button_kan() {
        AudioManager.getInstance().playSFX("button_click")
        var power = this._zjhData.gameinfo.curOperateControl
        if (power[3])
            GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_ZhaJinHuaLookCard.MsgID.ID, {});
        
    }

    private button_gen() {
        AudioManager.getInstance().playSFX("button_click")
        var power = this._zjhData.gameinfo.curOperateControl
        if(power[6] || power[4])
            GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_ZhaJinHuaFollowBet.MsgID.ID, {});
    }
    
    private button_guzhu() {
        AudioManager.getInstance().playSFX("button_click")
        var power = this._zjhData.gameinfo.curOperateControl
        if(power[4])
            GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_ZhaJinHuaAllIn.MsgID.ID, {});
    }


    private button_jia() {
        AudioManager.getInstance().playSFX("button_click")
        var power = this._zjhData.gameinfo.curOperateControl
        var active = this.node.getChildByName("chip_node").active
        if (power[1])
            this.node.getChildByName("chip_node").active = !active
            
        
    }

    private button_chips_bg() {
        AudioManager.getInstance().playSFX("button_click")
        this.node.getChildByName("chip_node").active = false
    }

    private button_chips(event, customEventData)
    {
        AudioManager.getInstance().playSFX("button_click")
        var chipNode = this.node.getChildByName("chip_node").getChildByName("sp_addchips_bg").getChildByName("score"+customEventData);
        var score = parseInt(chipNode.getChildByName("label_score").getComponent(cc.Label).string) 
        if (this._zjhData.playerInfoMap.get(0).state == PLAYER_STATE.STATE_LOOK)
            score /= 2
        GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_ZhaJinHuaAddScore.MsgID.ID, {score:score});
    }

     /**玩家头像按钮 */
     private btn_info(event, CustomEvent) {
        if (this._zjhData == null)
            return;
        var seat = parseInt(CustomEvent) 
        UIManager.getInstance().openUI(infoGameUI, 20, () => {
            UIManager.getInstance().getUI(infoGameUI).getComponent("infoGameUI").initData(seat)
        })
    }

    private btn_owner_start()
    {
        AudioManager.getInstance().playSFX("button_click")
        GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_ZhaJinHuaStartGame.MsgID.ID, {});
    }

}