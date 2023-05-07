import { GameManager } from './../../../GameManager';
import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { ConstValue, GAME_TYPE } from './../../../data/GameConstValue';
import { GameChatUI } from './../../GameChatUI';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { StringData } from './../../../data/StringData';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { Utils } from './../../../../framework/Utils/Utils';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { ListenerType } from './../../../data/ListenerType';
import { ListenerManager } from '../../../../framework/Manager/ListenerManager';
import infoGameUI from '../info/infoGameUI';
import * as Proto from "../../../../proto/proto-min";
import { BaseUI } from '../../../../framework/UI/BaseUI';
import { GameData_ZGCP } from '../../../data/cp/GameData_ZGCP';
import { GAME_STATE_CP } from '../../../data/cp/cpDefines';

const { ccclass, property } = cc._decorator;

@ccclass
export class GameUI_PlayerInfo_CP extends BaseUI {
    protected static className = "GameUI_PlayerInfo_CP";
    /*
    长牌玩家信息ui（通用）
    */
    public static getUrl(): string {
        return ConstValue.UI_CP_DIR + this.className;
    }
    @property([cc.SpriteFrame])
    stageSp: cc.SpriteFrame[] = [];

    @property([cc.Sprite])
    spTime: cc.Sprite[] = [];

    private m_gameType = 0; // 游戏类型
    //private m_cpData:GameData_ZGCP = null; // 长牌游戏数据
    private yyPlay: boolean = false; // 语音状态
    private addSize = 0
    private _isTurn: boolean = false
    private _cdTime = 0
    private totalTurnTime = 0
    private curSeat = -1

    onLoad() {

    }

    onDataRecv() {
        let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        infoGameUI.actionState = false
        this.initListen()
        this.setAll()
    }


    public onEventHideRec() {
        infoGameUI.actionState = false
    }

    onShow() {
        let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        this.setAll()
    }

    onDestroy() {
        super.onDestroy();
    }

    resetDataOnBack() {
        let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        for (var i = 0; i < 4; ++i) {
            if (m_cpData.playerInfoMap.get(i))
                this.node.getChildByName("player" + i).active = true;
            else
                this.node.getChildByName("player" + i).active = false;
        }
    }

    start() {
        var contentSize = this.node.getContentSize()
        this.addSize = contentSize.width - ConstValue.SCREEN_W
        this.node.getChildByName("player" + 0).getChildByName("hu_stage").position = cc.v3(this.addSize / 2, -222)
        this.node.getChildByName("player" + 0).getChildByName("stage").position = cc.v3(this.addSize / 2, -167)
    }

    /**初始化监听 */
    private initListen() {
        ListenerManager.getInstance().add(Proto.S2CPlayerInteraction.MsgID.ID, this, this.onInteractionRec);
        ListenerManager.getInstance().add(Proto.SC_CP_Tuo_Num.MsgID.ID, this, this.onTuoNum);    // 坨数

        ListenerManager.getInstance().add(ListenerType.cp_playerNumChanged, this, this.onPlayerNumChanged);                     // 收到玩家人数改变
        ListenerManager.getInstance().add(ListenerType.cp_playerStateChanged, this, this.onPlayerStateChanged);                 // 收到玩家游戏状态改变
        ListenerManager.getInstance().add(ListenerType.cp_playerScoreChanged, this, this.onPlayerScoreChanged);                 // 玩家分数改变
        ListenerManager.getInstance().add(ListenerType.cp_playedTing, this, this.onPlayedTing);                                 // 玩家ting了
        ListenerManager.getInstance().add(ListenerType.cp_ownerChanged, this, this.onOwnerChanged);                             // 房主改变
        ListenerManager.getInstance().add(ListenerType.cp_dealerChanged, this, this.onDealerChanged);                           // 庄家改变
        ListenerManager.getInstance().add(ListenerType.cp_gameState, this, this.onGameStateChanged);                                // 玩家ting了   
        ListenerManager.getInstance().add(ListenerType.cp_onTrusteeChanged, this, this.onTrusteeChanged);
        ListenerManager.getInstance().add(ListenerType.cp_recHuInfo, this, this.recHuInfo);
        ListenerManager.getInstance().add(ListenerType.cp_tuosInfo, this, this.onTuoNum);
        //ListenerManager.getInstance().add(ListenerType.cp_BaotingStatusChanged, this, this.baoTingStatusChanged);
        ListenerManager.getInstance().add(ListenerType.cp_recBaoTingResult, this, this.recBaoTingResult);
    }

    public setAll() {
        let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        m_cpData.playerInfoMap.forEach((infoObj, seat) => {
            this.node.getChildByName("player" + seat).active = true
            this.setPlayerHeadImg(seat)
            this.setPlayerReady(seat)
            this.setPlayerName(seat)
            this.setPlayerOnline(seat)
            this.setTrustee(seat)
            this.setScore(seat)
            this.setMaster(seat);
            this.setOwner(seat);
            this.setTing(seat);
            this.setBaoTing(seat)
        })
    }

    /**设置玩家头像 */
    public setPlayerHeadImg(index) {
        let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        var seat = index;
        var headNode = this.node.getChildByName("player" + seat).getChildByName("sp").getComponent(cc.Sprite)     //得到头像节点
        Utils.loadTextureFromNet(headNode, m_cpData.playerInfoMap.get(seat).headurl)
    }

    /**玩家是否准备 */
    public setPlayerReady(index) {
        let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        if (m_cpData.gameinfo.gameState != GAME_STATE_CP.PER_BEGIN) {
            this.node.getChildByName("player" + index).getChildByName("stage").active = false
            return
        }
        var seat = index;
        var readyNode = this.node.getChildByName("player" + seat).getChildByName("stage")    //得到准备节点
        readyNode.active = m_cpData.playerInfoMap.get(seat).isready;
        if (m_cpData.playerInfoMap.get(seat).isready)
            readyNode.getComponent(cc.Sprite).spriteFrame = this.stageSp[0]
    }

    /**设置玩家名字 */
    public setPlayerName(index) {
        let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        var seat = index;
        var labelName = this.node.getChildByName("player" + seat).getChildByName("label_name").getComponent(cc.Label)     //得到名字label
        labelName.string = Utils.getShortName(m_cpData.playerInfoMap.get(seat).name, 10);
    }

    /**玩家是否在线 */
    public setPlayerOnline(index) {
        let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        var seat = index;
        var onlineNode = this.node.getChildByName("player" + seat).getChildByName("online")
        onlineNode.active = !m_cpData.playerInfoMap.get(seat).isonline;
    }

    public setTrustee(index) {
        let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        var seat = index;
        var tuoguanNode = this.node.getChildByName("player" + seat).getChildByName("tuoguanTip")
        tuoguanNode.active = m_cpData.playerInfoMap.get(seat).isTrustee;
    }

    //报听结果
    recBaoTingResult() {
        let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        m_cpData.playerInfoMap.forEach((infoObj, seat) => {
            this.node.getChildByName("player" + seat).getChildByName("stage").active = false
            this.setBaoTing(seat)
        })
    }
    setBaoTing(index) {
        let seat = index;
        let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        if (!m_cpData.playerInfoMap.get(seat))
            return
        let isBaoTing = m_cpData.playerInfoMap.get(index).baoTingResult
        //var stageNode = this.node.getChildByName("player" + index).getChildByName("stage") 
        this.node.getChildByName("player" + index).getChildByName("sp_baoTing").active = isBaoTing
    }
    /**设置分数 */
    public setScore(index) {
        let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        var seat = index;
        var labelScore = this.node.getChildByName("player" + seat).getChildByName("score").getComponent(cc.Label)     //得到准备节点
        console.log("------------public setScore(index)--------------------", m_cpData.playerInfoMap.get(seat).clubScore)
        var score = m_cpData.playerInfoMap.get(seat).clubScore || 0
        labelScore.string = score.toString();
        if (score < 0)
            labelScore.node.color = new cc.Color(255, 64, 64);
        else
            labelScore.node.color = new cc.Color(251, 224, 72);
    }

    /**设置庄家 */
    private setMaster(index) {
        let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        if (m_cpData.gameinfo.gameState <= GAME_STATE_CP.PER_BEGIN && m_cpData.gameinfo.gameState >= GAME_STATE_CP.GAME_BALANCE) {
            masterNode.active = false;
            return
        }
        var seat = index;
        var playerID = m_cpData.playerInfoMap.get(seat).id
        var masterNode = this.node.getChildByName("player" + seat).getChildByName("sp_master_bg")
        masterNode.active = (playerID == m_cpData.gameinfo.dealerId)

    }

    /**设置房主 */
    private setOwner(index) {
        let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        var seat = index;
        var playerID = m_cpData.playerInfoMap.get(seat).id
        var ownerNode = this.node.getChildByName("player" + seat).getChildByName("sp_fang")
        ownerNode.active = false
        // ownerNode.active = (playerID == m_cpData.gameinfo.creator)
    }

    //设置是否听牌
    setTing(index) {
        // var seat = index;
        // var tingNode = this.node.getChildByName("player" + seat).getChildByName("Layout").getChildByName("sp_ting")
        // tingNode.active = m_cpData.playerInfoMap.get(seat).istinged;
    }
    /**房间人数变化 */
    private onPlayerNumChanged(msg) {
        var seat = msg.playerSeat;
        if (msg.tag == "add") {
            this.node.getChildByName("player" + seat).active = true
            this.setPlayerHeadImg(seat)
            this.setPlayerReady(seat)
            this.setPlayerName(seat)
            this.setPlayerOnline(seat)
            this.setTrustee(seat)
            this.setScore(seat)
            this.setMaster(seat);
            this.setOwner(seat);
            this.setTing(seat);
            this.setBaoTing(seat)
        }
        else
            this.node.getChildByName("player" + seat).active = false
    }


    private onPlayerStateChanged(msg) {
        if (msg.type == "ready")
            this.setPlayerReady(msg.playerSeat)
        else
            this.setPlayerOnline(msg.playerSeat)
    }

    private onPlayerScoreChanged(msg) {
        let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        var index = m_cpData.getSeatById(msg.id);
        this.setScore(index)
    }

    private onPlayedTing(msg) {
        let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        var index = m_cpData.getSeatById(msg.id);
        this.setTing(index)
    }

    private onOwnerChanged(msg) {
        let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        var index = m_cpData.getSeatById(msg.id);
        if (index >= 0)
            this.setOwner(index)
    }

    private onTrusteeChanged(msg) {
        let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        var index = m_cpData.getSeatById(msg.id);
        this.setTrustee(index)
    }

    private onDealerChanged(msg) {
        let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        if (msg.id < 0) {
            for (var i = 0; i < 4; i++) {
                if (m_cpData.playerInfoMap.get(i)) {
                    var masterNode = this.node.getChildByName("player" + i).getChildByName("sp_master_bg")
                    masterNode.active = false
                }
            }
            return
        }
        var index = m_cpData.getSeatById(msg.id);
        this.setMaster(index)
    }

    private onGameStateChanged(msg) {
        let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        if (m_cpData.gameinfo.gameState == GAME_STATE_CP.PER_BEGIN) {
            for (var i = 0; i < 4; i++) {
                this.node.getChildByName("player" + i).getChildByName("hu_stage").active = false
                if (m_cpData.playerInfoMap.get(i))
                    this.setPlayerReady(i)
            }
        }
        else if (m_cpData.gameinfo.gameState > GAME_STATE_CP.PER_BEGIN && m_cpData.gameinfo.gameState < GAME_STATE_CP.GAME_BALANCE) {
            for (var i = 0; i < 4; i++) {
                this.node.getChildByName("player" + i).getChildByName("stage").active = false
                this.node.getChildByName("player" + i).getChildByName("hu_stage").active = false
            }
        }
    }

    //设置表情
    onInteractionRec(msg) {
        let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        var blockInteraction = cc.sys.localStorage.getItem("blockInteraction");
        if (parseInt(blockInteraction) == 1) // 屏蔽互动
        {
            MessageManager.getInstance().disposeMsg();
            return;
        }
        if (m_cpData == null) {
            MessageManager.getInstance().disposeMsg();
            return;
        }
        if (msg.type == 2) { // 魔法表情
            this.onReceiveMagicEmoji(msg);
            MessageManager.getInstance().disposeMsg();

            return;
        }
        if (msg.type == 0) {
            //表情
            this.setemjio(msg);
        }
        else if (msg.type == 1) {
            var gameType = "mj"
            this.setchat(msg, StringData.getString(msg.contentIdx + 9000));

            var seat = m_cpData.getRealSeatByRemoteSeat(msg.sender)
            var playerObj = m_cpData.playerInfoMap.get(seat)
            //快捷文字
            if (playerObj && playerObj.sex == 1)
                AudioManager.getInstance().playSFX("man/man_" + gameType + "_" + msg.contentIdx);
            else
                AudioManager.getInstance().playSFX("woman/woman_" + gameType + "_" + msg.contentIdx);
        }
        MessageManager.getInstance().disposeMsg();

    }
    //设置表情
    setemjio(msg) {
        let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        var index = m_cpData.getRealSeatByRemoteSeat(msg.sender);
        var seat = index;
        var nodeEmjio = this.node.getChildByName("player" + seat).getChildByName("emjio")
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
        let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        try {
            if (m_cpData && m_cpData.gameinfo) {
                var senderSeat = m_cpData.getRealSeatByRemoteSeat(msg.sender);
                var receiverSeat = m_cpData.getRealSeatByRemoteSeat(msg.receiver);
                var startNode = this.node.getChildByName("player" + senderSeat).getChildByName("info_emoji")
                var endNode = this.node.getChildByName("player" + receiverSeat).getChildByName("info_emoji")
                var startPos = startNode.parent.convertToWorldSpaceAR(startNode.position);
                var endPos = endNode.parent.convertToWorldSpaceAR(endNode.position);
                var parent = startNode.parent.parent;
                startPos = parent.convertToNodeSpaceAR(startPos);
                endPos = parent.convertToNodeSpaceAR(endPos);
                infoGameUI.actionState = true;
                let callbackFunc = () => {
                    this.setInfoEmoji(msg, receiverSeat);
                }
                infoGameUI.playeMoveAction(parent, cc.v2(startPos.x, startPos.y), cc.v2(endPos.x, endPos.y), msg.contentIdx, callbackFunc);                  // 播放移动动画
            }
        }
        catch (e) { }
    }

    // 移动动画完成后播放animation
    setInfoEmoji(msg, receiverSeat) {
        var endNode = this.node.getChildByName("player" + receiverSeat).getChildByName("info_emoji")
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

    //设置文字聊天
    private setchat(msg, str: string) {
        let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        var seat = m_cpData.getRealSeatByRemoteSeat(msg.sender);
        var nodeChat = this.node.getChildByName("player" + seat).getChildByName("chat_bg")
        let labelchat = nodeChat.getChildByName("label_text");
        labelchat.active = true;
        //内容设置
        labelchat.getComponent(cc.Label).string = str;
        nodeChat.width = Utils.getByteLen(str) * 13 + 28;//  labelchat.width + 50;
        let action1 = cc.fadeIn(0.1);
        let action2 = cc.delayTime(2.0);
        let action3 = cc.fadeOut(0.1);
        let seq = cc.sequence(action1, action2, action3);
        nodeChat.stopAllActions();
        nodeChat.runAction(seq);
    }

    //更新显示aa
    setyy(msg) {
        let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        var seat = m_cpData.getSeatById(msg.playerId);
        var nodeChat = this.node.getChildByName("player" + seat).getChildByName("chat_bg")
        //显示屏蔽
        let labelchat = nodeChat.getChildByName("label_text");
        let yychat = nodeChat.getChildByName("yy");
        labelchat.active = false;
        yychat.active = true;

        //内容设置
        nodeChat.width = 100;
        let action1 = cc.fadeIn(0.1);
        let action2 = cc.delayTime(msg.contentTime / 1000);
        let action3 = cc.fadeOut(0.1);
        let action4 = cc.callFunc(function () {
            this.yyPlay = false;
            AudioManager.getInstance().resumeAll();
        }.bind(this));
        let seq = cc.sequence(action1, action2, action3, action4);
        nodeChat.stopAllActions();
        nodeChat.runAction(seq);
    }
    private onTuoNum(msg) {
        try {
            let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
            let playerNum = m_cpData.getCurTypePlayerNum()
            for (let seat = 1; seat <= playerNum; seat++) {
                let realSeat = m_cpData.getRealSeatByRemoteSeat(seat)
                cc.find(`player${realSeat}/label_tuo`, this.node).getComponent(cc.Label).string = "坨数:" + msg.tuos[seat - 1]
            }
            MessageManager.getInstance().disposeMsg();
        }
        catch (e) {
            GameManager.getInstance().handReconnect()
        }
    }
    private recHuInfo() {
        let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        m_cpData.playerInfoMap.forEach((infoObj, seat) => {
            var info = m_cpData.huInfoMap.get(seat)
            var stageNode = this.node.getChildByName("player" + seat).getChildByName("hu_stage")
            if (m_cpData.playerInfoMap.size <= 2)
                return
            if (info) {
                stageNode.getComponent(cc.Sprite).spriteFrame = this.stageSp[1]
                stageNode.active = true
            }
            else
                stageNode.active = false
        })
    }

    /**玩家头像按钮 */
    private btn_info(event, CustomEvent) {
        let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        if (m_cpData == null)
            return;
        var seat = parseInt(CustomEvent)
        UIManager.getInstance().openUI(infoGameUI, 20, () => {
            UIManager.getInstance().getUI(infoGameUI).getComponent("infoGameUI").initData(seat)
        })
    }

    /**表情按钮 */
    private button_chat() {
        let m_cpData = GameDataManager.getInstance().getDataByCurGameType();
        AudioManager.getInstance().playSFX("button_click")
        if (m_cpData == null)
            return;
        if (m_cpData.gameinfo == null)
            return;
        var oRule = m_cpData.gameinfo.rule
        if (oRule.option.block_hu_dong) {
            GameManager.getInstance().openWeakTipsUI("本局禁止互动，详情请联系群主");
            return
        }
        UIManager.getInstance().openUI(GameChatUI, 98);
    }
    /**进入玩家的操作伦 */
    enterTurn(cd: number, totalTime: number, seat: number): void {
        this.curSeat = seat
        this.spTime.forEach((element) => { element.node.active = false; })
        this.spTime[seat].node.active = true;
        this._cdTime = cd;
        this.totalTurnTime = totalTime;
        this._isTurn = true;
    }
    /**离开玩家的操作伦 */
    leaveTurn(): void {
        this._isTurn = false;
        this.spTime.forEach((element) => { element.node.active = false; })
    }
    /**帧更新 */
    update(dt: number): void {
        if (this._isTurn) {
            this._cdTime -= dt;
            if (this._cdTime > 0)
                this.spTime[this.curSeat].fillRange = this._cdTime / this.totalTurnTime;
            else {
                this.spTime[this.curSeat].fillRange = 0;
                this.leaveTurn();
            }
        }
    }
}