import { GameManager } from './../../../GameManager';
import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { ConstValue, GAME_TYPE } from './../../../data/GameConstValue';
import { GameChatUI } from './../../GameChatUI';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { StringData } from './../../../data/StringData';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { GAME_STATE_MJ } from './../../../data/mj/defines';
import { Utils } from './../../../../framework/Utils/Utils';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { ListenerType } from './../../../data/ListenerType';
import { ListenerManager } from '../../../../framework/Manager/ListenerManager';
import infoGameUI from '../info/infoGameUI';
import * as Proto from "../../../../proto/proto-min";
import { BaseUI } from '../../../../framework/UI/BaseUI';

const { ccclass, property } = cc._decorator;

@ccclass
export class GameUI_PlayerInfo extends BaseUI {
    protected static className = "GameUI_PlayerInfo";
    /*
    麻将玩家信息ui（通用）
    */

    @property([cc.SpriteFrame])
    stageSp: cc.SpriteFrame[] = [];
    piaoSp: cc.SpriteFrame[] = [];

    private m_gameType = 0; // 游戏类型
    private m_mjData = null; // 麻将游戏数据
    private yyPlay: boolean = false; // 语音状态
    private addSize = 0

    onLoad() {

    }

    onDataRecv() {
        this.m_mjData = GameDataManager.getInstance().getDataByCurGameType();
        infoGameUI.actionState = false
        this.initListen()
        this.setAll()
    }


    public onEventHideRec() {
        this.m_mjData = null
        infoGameUI.actionState = false
    }

    onShow() {
        this.m_mjData = GameDataManager.getInstance().getDataByCurGameType();
        this.setAll()
    }

    onDestroy() {
        super.onDestroy();
        this.m_mjData = null

    }

    resetDataOnBack() {
        this.m_mjData = GameDataManager.getInstance().getDataByCurGameType();
        for (var i = 0; i < 4; ++i) {
            if (this.m_mjData.playerInfoMap.get(i))
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

        ListenerManager.getInstance().add(ListenerType.mj_playerNumChanged, this, this.onPlayerNumChanged);                     // 收到玩家人数改变
        ListenerManager.getInstance().add(ListenerType.mj_playerStateChanged, this, this.onPlayerStateChanged);                 // 收到玩家游戏状态改变
        ListenerManager.getInstance().add(ListenerType.mj_playerScoreChanged, this, this.onPlayerScoreChanged);                 // 玩家分数改变
        ListenerManager.getInstance().add(ListenerType.mj_playedTing, this, this.onPlayedTing);                                 // 玩家ting了
        ListenerManager.getInstance().add(ListenerType.mj_ownerChanged, this, this.onOwnerChanged);                             // 房主改变
        ListenerManager.getInstance().add(ListenerType.mj_dealerChanged, this, this.onDealerChanged);                           // 庄家改变
        ListenerManager.getInstance().add(ListenerType.mj_gameState, this, this.onGameStateChanged);
        ListenerManager.getInstance().add(ListenerType.mjzj_playedMen, this, this.onPlayedMen);                                 // 玩家ting了
        ListenerManager.getInstance().add(ListenerType.mjzj_guMaiScoreChange, this, this.onGuMaiScoreChange);
        ListenerManager.getInstance().add(ListenerType.mj_onTrusteeChanged, this, this.onTrusteeChanged);

        if (Utils.isXzmj(GameDataManager.getInstance().curGameType)) {
            ListenerManager.getInstance().add(ListenerType.mjxz_recDqResult, this, this.recDqResult);
            ListenerManager.getInstance().add(ListenerType.mjxz_hpStatusChanged, this, this.hpStatusChanged);
            ListenerManager.getInstance().add(ListenerType.mjxz_dqStatusChanged, this, this.dqStatusChanged);
            ListenerManager.getInstance().add(ListenerType.mjxz_piaoStatusChanged, this, this.piaoStatusChanged);
            ListenerManager.getInstance().add(ListenerType.mjxz_BaotingStatusChanged, this, this.baoTingStatusChanged);
            ListenerManager.getInstance().add(ListenerType.mjxz_recPiaoResult, this, this.recPiaoResult);
            ListenerManager.getInstance().add(ListenerType.mjxz_recBaoTingResult, this, this.recBaoTingResult);
            ListenerManager.getInstance().add(ListenerType.mjxz_recHuInfo, this, this.recHuInfo);
            ListenerManager.getInstance().add(ListenerType.mjxz_recHpResult, this, this.recHpResult);

        }

    }


    public setAll() {
        this.m_mjData.playerInfoMap.forEach((infoObj, seat) => {
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
            this.setMen(seat);
            this.setDingQue(seat)
            this.setPiaoFen(seat)
            this.setBaoTing(seat)
        })
    }

    /**设置玩家头像 */
    public setPlayerHeadImg(index) {
        var seat = index;
        var headNode = this.node.getChildByName("player" + seat).getChildByName("sp").getComponent(cc.Sprite)     //得到头像节点
        Utils.loadTextureFromNet(headNode, this.m_mjData.playerInfoMap.get(seat).headurl)
    }

    /**玩家是否准备 */
    public setPlayerReady(index) {
        if (this.m_mjData.gameinfo.gameState != GAME_STATE_MJ.PER_BEGIN) {
            this.node.getChildByName("player" + index).getChildByName("stage").active = false
            return
        }
        var seat = index;
        var readyNode = this.node.getChildByName("player" + seat).getChildByName("stage")    //得到准备节点
        readyNode.active = this.m_mjData.playerInfoMap.get(seat).isready;
        if (this.m_mjData.playerInfoMap.get(seat).isready)
            readyNode.getComponent(cc.Sprite).spriteFrame = this.stageSp[0]
    }

    /**设置玩家名字 */
    public setPlayerName(index) {
        var seat = index;
        var labelName = this.node.getChildByName("player" + seat).getChildByName("label_name").getComponent(cc.Label)     //得到名字label
        labelName.string = Utils.getShortName(this.m_mjData.playerInfoMap.get(seat).name, 10);
    }

    /**玩家是否在线 */
    public setPlayerOnline(index) {
        var seat = index;
        var onlineNode = this.node.getChildByName("player" + seat).getChildByName("online")
        onlineNode.active = !this.m_mjData.playerInfoMap.get(seat).isonline;
    }

    public setTrustee(index) {
        var seat = index;
        var tuoguanNode = this.node.getChildByName("player" + seat).getChildByName("tuoguanTip")
        tuoguanNode.active = this.m_mjData.playerInfoMap.get(seat).isTrustee;
    }

    /**设置分数 */
    public setScore(index) {
        var seat = index;
        var labelScore = this.node.getChildByName("player" + seat).getChildByName("score").getComponent(cc.Label)     //得到准备节点
        // var score = this.m_mjData.playerInfoMap.get(seat).score
        // var oRule = this.m_mjData.gameinfo.rule
        // if (!oRule.union)
        var score = this.m_mjData.playerInfoMap.get(seat).clubScore
        labelScore.string = score.toString();
        if (score < 0)
            labelScore.node.color = new cc.Color(255, 64, 64);
        else
            labelScore.node.color = new cc.Color(251, 224, 72);
    }

    /**设置庄家 */
    private setMaster(index) {
        if (this.m_mjData.gameinfo.gameState <= GAME_STATE_MJ.PER_BEGIN && this.m_mjData.gameinfo.gameState >= GAME_STATE_MJ.GAME_BALANCE) {
            masterNode.active = false;
            return
        }
        var seat = index;
        var playerID = this.m_mjData.playerInfoMap.get(seat).id
        var masterNode = this.node.getChildByName("player" + seat).getChildByName("sp_master_bg")
        masterNode.active = (playerID == this.m_mjData.gameinfo.dealerId)

    }

    /**设置房主 */
    private setOwner(index) {
        var seat = index;
        var playerID = this.m_mjData.playerInfoMap.get(seat).id
        var ownerNode = this.node.getChildByName("player" + seat).getChildByName("sp_fang")
        ownerNode.active = false
        // ownerNode.active = (playerID == this.m_mjData.gameinfo.creator)
    }

    //设置是否听牌
    setTing(index) {
        var seat = index;
        var tingNode = this.node.getChildByName("player" + seat).getChildByName("Layout").getChildByName("sp_ting")
        tingNode.active = this.m_mjData.playerInfoMap.get(seat).istinged;
    }

    // 设置闷
    setMen(index) {
        var seat = index;
        var tingNode = this.node.getChildByName("player" + seat).getChildByName("Layout").getChildByName("sp_men_bg")
        tingNode.active = this.m_mjData.playerInfoMap.get(seat).isMened;
    }

    setGuMai(index) {
        var score = this.m_mjData.playerInfoMap.get(index).guMaiScore
        var stageNode = this.node.getChildByName("player" + index).getChildByName("stage")
        if (score < 0) {
            stageNode.active = false
            this.node.getChildByName("player" + index).getChildByName("label_mai").getComponent(cc.Label).string = ""
            return
        }
        this.node.getChildByName("player" + index).getChildByName("label_mai").getComponent(cc.Label).string = "估卖（" + score + ")"
        if (this.m_mjData.gameinfo.gameState == GAME_STATE_MJ.GU_MAI) {
            stageNode.active = true
            stageNode.getComponent(cc.Sprite).spriteFrame = this.stageSp[11]
        }
    }

    // 设置定缺
    setDingQue(index) {
        var seat = index;
        if (!this.m_mjData.playerInfoMap.get(seat))
            return
        var type = this.m_mjData.playerInfoMap.get(seat).dqType
        var str = ""
        if (type == 0)
            str = "sp_wan"
        else if (type == 1)
            str = "sp_tong"
        else if (type == 2)
            str = "sp_tiao"
        else // 没有type
        {
            this.node.getChildByName("player" + seat).getChildByName("Layout").getChildByName("sp_wan").active = false
            this.node.getChildByName("player" + seat).getChildByName("Layout").getChildByName("sp_tong").active = false
            this.node.getChildByName("player" + seat).getChildByName("Layout").getChildByName("sp_tiao").active = false
            return
        }
        this.node.getChildByName("player" + seat).getChildByName("Layout").getChildByName("sp_wan").active = false
        this.node.getChildByName("player" + seat).getChildByName("Layout").getChildByName("sp_tong").active = false
        this.node.getChildByName("player" + seat).getChildByName("Layout").getChildByName("sp_tiao").active = false
        this.node.getChildByName("player" + seat).getChildByName("Layout").getChildByName(str).active = true
    }

    // 设置飘分
    setPiaoFen(index) {
        let seat = index;
        if (!this.m_mjData.playerInfoMap.get(seat) || seat < 0 || seat>3)
            return
        let score = this.m_mjData.playerInfoMap.get(index).piaoScore
        //var stageNode = this.node.getChildByName("player" + index).getChildByName("stage") 
        if (score <= 0) {
            this.node.getChildByName("player" + seat).getChildByName("sp_piao").active = false
        } else {
            this.node.getChildByName("player" + seat).getChildByName("sp_piao").active = true
        }
    }
    setBaoTing(index) {
        let seat = index;
        if (!this.m_mjData.playerInfoMap.get(seat))
            return
        let isBaoTing = this.m_mjData.playerInfoMap.get(index).baoTingResult
        //var stageNode = this.node.getChildByName("player" + index).getChildByName("stage") 
        this.node.getChildByName("player" + index).getChildByName("sp_baoTing").active = isBaoTing
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
            this.setMen(seat)
            this.setPiaoFen(seat)
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
        var index = this.m_mjData.getSeatById(msg.id);
        this.setScore(index)
    }

    private onPlayedTing(msg) {
        var index = this.m_mjData.getSeatById(msg.id);
        this.setTing(index)
    }

    private onPlayedMen(msg) {
        var index = this.m_mjData.getSeatById(msg.id);
        this.setMen(index)
    }

    private onGuMaiScoreChange(msg) {
        var index = this.m_mjData.getSeatById(msg.id);
        this.setGuMai(index)
    }

    private onOwnerChanged(msg) {
        var index = this.m_mjData.getSeatById(msg.id);
        if (index >= 0)
            this.setOwner(index)
    }

    private onTrusteeChanged(msg) {
        var index = this.m_mjData.getSeatById(msg.id);
        this.setTrustee(index)
    }

    private onDealerChanged(msg) {
        if (msg.id < 0) {
            for (var i = 0; i < 4; i++) {
                if (this.m_mjData.playerInfoMap.get(i)) {
                    var masterNode = this.node.getChildByName("player" + i).getChildByName("sp_master_bg")
                    masterNode.active = false
                }
            }
            return
        }
        var index = this.m_mjData.getSeatById(msg.id);
        this.setMaster(index)
    }

    private onGameStateChanged(msg) {
        if (this.m_mjData.gameinfo.gameState == GAME_STATE_MJ.PER_BEGIN) {
            for (var i = 0; i < 4; i++) {
                this.node.getChildByName("player" + i).getChildByName("hu_stage").active = false
                this.setDingQue(i)
                if (this.m_mjData.playerInfoMap.get(i))
                    this.setPlayerReady(i)
            }
        }
        else if ((this.m_mjData.gameinfo.gameState == GAME_STATE_MJ.GU_MAI)) {
            this.m_mjData.playerInfoMap.forEach((infoObj, seat) => {
                this.setGuMai(seat)
            })
        }
        else if (this.m_mjData.gameinfo.gameState > GAME_STATE_MJ.PER_BEGIN && this.m_mjData.gameinfo.gameState < GAME_STATE_MJ.WAIT_QIANG_GANG_HU) {
            for (var i = 0; i < 4; i++) {
                this.node.getChildByName("player" + i).getChildByName("stage").active = false
                this.node.getChildByName("player" + i).getChildByName("hu_stage").active = false
            }
        }
    }

    //设置表情
    onInteractionRec(msg) {
        var blockInteraction = cc.sys.localStorage.getItem("blockInteraction");
        if (parseInt(blockInteraction) == 1) // 屏蔽互动
        {
            MessageManager.getInstance().disposeMsg();
            return;
        }
        if (this.m_mjData == null) {
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
            var gameType = ""
            if (GameDataManager.getInstance().curGameType == GAME_TYPE.PDK || GameDataManager.getInstance().curGameType == GAME_TYPE.LRPDK
                || GameDataManager.getInstance().curGameType == GAME_TYPE.DDZ || GameDataManager.getInstance().curGameType == GAME_TYPE.SCPDK)
                gameType = "ddz"
            else
                gameType = "mj"
            if (gameType == "mj")
                this.setchat(msg, StringData.getString(msg.contentIdx + 9000));
            else
                this.setchat(msg, StringData.getString(msg.contentIdx + 9100));

            var seat = this.m_mjData.getRealSeatByRemoteSeat(msg.sender)
            var playerObj = this.m_mjData.playerInfoMap.get(seat)
            //快捷文字
            if (playerObj && playerObj.sex == 1)
                AudioManager.getInstance().playSFX("man/man_" + gameType + "_" + msg.contentIdx);
            else
                AudioManager.getInstance().playSFX("woman/woman_" + gameType + "_" + msg.contentIdx);
        }
        // else if (msg.type == 2) {
        //     //语音
        //     if (this.yyPlay)
        //         VoiceManager.getInstance().stop();

        //     var msgfile = "voicemsg.amr";
        //     VoiceManager.getInstance().writeAndPlay(msgfile, msg.content, function () {
        //         //开始播放录音
        //         AudioManager.getInstance().pauseAll();
        //     });
        //     this.yyPlay = true;
        //     this.setyy(msg);
        // }
        // else if (msg.type == 3) {
        //     this.setchat(msg, msg.content);
        // }
        MessageManager.getInstance().disposeMsg();

    }
    //设置表情
    setemjio(msg) {
        var index = this.m_mjData.getRealSeatByRemoteSeat(msg.sender);
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
        try {
            if (this.m_mjData && this.m_mjData.gameinfo) {
                var senderSeat = this.m_mjData.getRealSeatByRemoteSeat(msg.sender);
                var receiverSeat = this.m_mjData.getRealSeatByRemoteSeat(msg.receiver);
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
        var seat = this.m_mjData.getRealSeatByRemoteSeat(msg.sender);
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

    //更新显示
    setyy(msg) {
        var seat = this.m_mjData.getSeatById(msg.playerId);
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

    private recHuInfo() {
        this.m_mjData.playerInfoMap.forEach((infoObj, seat) => {
            var info = this.m_mjData.huInfoMap.get(seat)
            var stageNode = this.node.getChildByName("player" + seat).getChildByName("hu_stage")
            if (this.m_mjData.playerInfoMap.size <= 2)
                return
            if (this.m_mjData.gameinfo.gameState == GAME_STATE_MJ.DING_QUE || this.m_mjData.gameinfo.gameState == GAME_STATE_MJ.HUAN_PAI)
                return
            if (info) {
                stageNode.getComponent(cc.Sprite).spriteFrame = this.stageSp[(info.index - 1) + (info.huType - 1) * 3 + 5]
                stageNode.active = true
            }
            else
                stageNode.active = false
        })
    }


    // 收到定缺结果
    recDqResult() {
        this.m_mjData.playerInfoMap.forEach((infoObj, seat) => {
            this.node.getChildByName("player" + seat).getChildByName("stage").active = false
            this.setDingQue(seat)
        })
    }
    // 收到飘结果
    recPiaoResult() {
        this.m_mjData.playerInfoMap.forEach((infoObj, seat) => {
            this.node.getChildByName("player" + seat).getChildByName("stage").active = false
            this.setPiaoFen(seat)
        })
    }
    //报听结果
    recBaoTingResult() {
        this.m_mjData.playerInfoMap.forEach((infoObj, seat) => {
            this.node.getChildByName("player" + seat).getChildByName("stage").active = false
            this.setBaoTing(seat)
        })
    }
    recHpResult() {
        this.m_mjData.playerInfoMap.forEach((infoObj, seat) => {
            this.node.getChildByName("player" + seat).getChildByName("stage").active = false
        })
        if (GameDataManager.getInstance().curGameType != GAME_TYPE.XZMJ && GameDataManager.getInstance().curGameType != GAME_TYPE.TR3F &&
            GameDataManager.getInstance().curGameType != GAME_TYPE.ZGMJ) {
            this.m_mjData.playerInfoMap.forEach((infoObj, seat) => {
                this.setDingQue(seat)
            })
        }
    }


    hpStatusChanged() {
        if (this.m_mjData == null)
            return;
        if (this.m_mjData.gameinfo.gameState != GAME_STATE_MJ.HUAN_PAI)
            return
        for (var i = 0; i < 4; i++) {
            var playerInfo = this.m_mjData.playerInfoMap.get(i)
            if (playerInfo) {
                var spIdx = -1
                if (playerInfo.exchanged) {
                    if (i == 0)
                        spIdx = 1
                    else
                        spIdx = 2
                }
                if (spIdx < 0)
                    this.node.getChildByName("player" + i).getChildByName("stage").active = false
                else {
                    this.node.getChildByName("player" + i).getChildByName("stage").active = true
                    this.node.getChildByName("player" + i).getChildByName("stage").getComponent(cc.Sprite).spriteFrame = this.stageSp[spIdx]
                }

            }
        }
    }

    dqStatusChanged() {
        // 不在定缺的进程内时，收到这个消息多半是重连
        if (this.m_mjData == null)
            return
        if (this.m_mjData.gameinfo.gameState != GAME_STATE_MJ.DING_QUE) {
            for (var i = 0; i < 4; i++) {
                this.node.getChildByName("player" + i).getChildByName("stage").active = false
                this.setDingQue(i)
            }
            return
        }
        for (var i = 0; i < 4; i++) {
            var playerInfo = this.m_mjData.playerInfoMap.get(i)
            if (playerInfo) {
                var spIdx = -1

                if (playerInfo.isDq) {
                    if (i == 0)
                        spIdx = 3
                    else
                        spIdx = 4
                }
                if (spIdx < 0)
                    this.node.getChildByName("player" + i).getChildByName("stage").active = false
                else {
                    this.node.getChildByName("player" + i).getChildByName("stage").active = true
                    this.node.getChildByName("player" + i).getChildByName("stage").getComponent(cc.Sprite).spriteFrame = this.stageSp[spIdx]
                }
            }
        }
    }

    piaoStatusChanged() {
        // 不在飘的进程内时，收到这个消息多半是重连
        if (this.m_mjData == null)
            return
        if (this.m_mjData.gameinfo.gameState != GAME_STATE_MJ.PIAO_FEN) {
            for (var i = 0; i < 4; i++) {
                this.node.getChildByName("player" + i).getChildByName("stage").active = false
                this.setPiaoFen(i)
            }
            return
        }
        for (var i = 0; i < 4; i++) {
            var playerInfo = this.m_mjData.playerInfoMap.get(i)
            if (playerInfo) {
                var spIdx = -1
                if (playerInfo.isPiao) {
                    if (i == 0)
                        spIdx = 12
                    else
                        spIdx = 13
                }
                if (spIdx < 0)
                    this.node.getChildByName("player" + i).getChildByName("stage").active = false
                else {
                    this.node.getChildByName("player" + i).getChildByName("stage").active = true
                    this.node.getChildByName("player" + i).getChildByName("stage").getComponent(cc.Sprite).spriteFrame = this.stageSp[spIdx]
                }
            }
        }
    }

    baoTingStatusChanged() {
        let mjData = GameDataManager.getInstance().getDataByCurGameType();
        if (mjData && mjData.gameinfo.gameState > GAME_STATE_MJ.PER_BEGIN && mjData.gameinfo.gameState < GAME_STATE_MJ.GAME_BALANCE) {
            this.recBaoTingResult()
        }
        
        // 不在报听的进程内时，收到这个消息多半是重连
        /*if (this.m_mjData == null)
            return
        if (this.m_mjData.gameinfo.gameState != GAME_STATE_MJ.BAO_TING) {
            for (var i = 0; i < 4; i++) {
                this.node.getChildByName("player" + i).getChildByName("stage").active = false
                this.setBaoTing(i)
            }
            return
        }
        for (var i = 0; i < 4; i++) {
            var playerInfo = this.m_mjData.playerInfoMap.get(i)
            if (playerInfo) {
                var spIdx = -1
                if (playerInfo.isBaoTing) {
                    if (i == 0)
                        spIdx = 14
                    else
                        spIdx = 15
                }
                if (spIdx < 0)
                    this.node.getChildByName("player" + i).getChildByName("stage").active = false
                else if(this.m_gameType != GAME_TYPE.ZGMJ) {
                    this.node.getChildByName("player" + i).getChildByName("stage").active = true
                    this.node.getChildByName("player" + i).getChildByName("stage").getComponent(cc.Sprite).spriteFrame = this.stageSp[spIdx]
                }
            }
        }*/
    }

    /**玩家头像按钮 */
    private btn_info(event, CustomEvent) {
        if (this.m_mjData == null)
            return;
        var seat = parseInt(CustomEvent)
        UIManager.getInstance().openUI(infoGameUI, 20, () => {
            UIManager.getInstance().getUI(infoGameUI).getComponent("infoGameUI").initData(seat)
        })
    }

    /**表情按钮 */
    private button_chat() {
        AudioManager.getInstance().playSFX("button_click")
        if (this.m_mjData == null)
            return;
        if (this.m_mjData.gameinfo == null)
            return;
        var oRule = this.m_mjData.gameinfo.rule
        if (oRule.option.block_hu_dong) {
            GameManager.getInstance().openWeakTipsUI("本局禁止互动，详情请联系群主");
            return
        }
        UIManager.getInstance().openUI(GameChatUI, 98);
    }

}