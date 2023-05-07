import { GameUIRepeatMsgManage } from './../../GameUIRepeatMsgManage';
import { GameManager } from './../../../GameManager';
import { GAME_STATE_DDZ } from './../../../data/ddz/GameInfo_DDZ';
import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { GAME_TYPE,ConstValue } from './../../../data/GameConstValue';
import { GameChatUI } from './../../GameChatUI';
import { VoiceManager } from './../../../../framework/Utils/VoiceManager';
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
import { GameUI_PDK } from './GameUI_PDK';
import { LogWrap } from '../../../../framework/Utils/LogWrap';

const { ccclass, property } = cc._decorator;

@ccclass
export class GameUI_PlayerInfo_PDK extends BaseUI {
    protected static className = "GameUI_PlayerInfo_PDK";
    /*
    麻将玩家信息ui（通用）
    */

   public static getUrl(): string {
    return ConstValue.UI_PDK_DIR + this.className;
    }

   @property([cc.SpriteFrame])
   stageSp: cc.SpriteFrame[] = [];

    private m_gameType = 0; // 游戏类型
    private m_pdkData = null; // 麻将游戏数据
    private timeNodePos = [[0,79], [360,155], [179,262],[-360,155], [0,105]]
    private addSize = 0
    private m_isNoBig = false // 要不起

    onLoad() {
        
    }

    onDataRecv()
    {
        this.m_pdkData = GameDataManager.getInstance().getDataByCurGameType();
        infoGameUI.actionState = false
        this.initListen()
        this.setAll()
    }

    onShow(){
        this.m_pdkData = GameDataManager.getInstance().getDataByCurGameType();
        this.setAll()
    }

    onDestroy() {
        super.onDestroy();
        this.m_pdkData = null
        
    }

    public onEventHideRec(){
        this.unscheduleAllCallbacks()
        infoGameUI.actionState = false
        this.m_pdkData = null
        this.clearDuoXuan();
    }

    resetDataOnBack()
    {
        this.m_pdkData = GameDataManager.getInstance().getDataByCurGameType();
        for(var i = 0; i < 4; ++i)
        {
            if ( this.m_pdkData.playerInfoMap.get(i))
                this.node.getChildByName("player" + i).active = true;
            else
                this.node.getChildByName("player" + i).active = false;
        }
    }

    start()
    {
        var contentSize = this.node.getContentSize()
        this.addSize = contentSize.width - ConstValue.SCREEN_W
        this.node.getChildByName("player" + 0).getChildByName("stage").position = cc.v3(this.addSize/2,-131)
    }

     /**初始化监听 */
    private initListen() {
        ListenerManager.getInstance().add(Proto.S2CPlayerInteraction.MsgID.ID, this, this.onInteractionRec);

        ListenerManager.getInstance().add(ListenerType.pdk_playerNumChanged, this, this.onPlayerNumChanged);                     // 收到玩家人数改变
        ListenerManager.getInstance().add(ListenerType.pdk_playerStateChanged, this, this.onPlayerStateChanged);                 // 收到玩家游戏状态改变
        ListenerManager.getInstance().add(ListenerType.pdk_playerScoreChanged, this, this.onPlayerScoreChanged);                 // 玩家分数改变
        ListenerManager.getInstance().add(ListenerType.pdk_ownerChanged, this, this.onOwnerChanged);                             // 房主改变
        ListenerManager.getInstance().add(ListenerType.pdk_dealerChanged, this, this.onDealerChanged);                           // 庄家改变
        ListenerManager.getInstance().add(ListenerType.pdk_curOperateChange, this, this.onCurOperateChanged);
        ListenerManager.getInstance().add(ListenerType.pdk_handCardChanged, this, this.onHandCardChanged);
        ListenerManager.getInstance().add(ListenerType.operateTimeChange, this, this.onTimeChange);
        ListenerManager.getInstance().add(ListenerType.operateNoBigCard, this, this.onNoBigCard);
        ListenerManager.getInstance().add(ListenerType.pdk_onTrusteeChanged, this, this.onTrusteeChanged);   
        if (GameDataManager.getInstance().curGameType == GAME_TYPE.DDZ)
        {
            ListenerManager.getInstance().add(ListenerType.ddz_gameState, this, this.onDDZGameStateChanged);
            ListenerManager.getInstance().add(ListenerType.ddz_callLandlordInfoChange, this, this.onDDZCurCallInfoChange);
            ListenerManager.getInstance().add(ListenerType.ddz_callLandlordRoundChange, this, this.onDDZCurCallRoundChange);
            ListenerManager.getInstance().add(ListenerType.ddz_landlordIdChange, this, this.onDDZIdChange);
        }
        else
            ListenerManager.getInstance().add(ListenerType.pdk_gameState, this, this.onGameStateChanged);


    }


    public setAll()
    {
        this.m_pdkData.playerInfoMap.forEach((infoObj, seat)=>{
            this.node.getChildByName("player" + seat).active = true
            this.setPlayerHeadImg(seat)
            this.setPlayerReady(seat)
            this.setPlayerName(seat)
            this.setPlayerOnline(seat)
            this.setTrustee(seat)
            this.setScore(seat)
            this.setMaster(seat);
            this.setOwner(seat);
            this.setCardNum(seat)
        })
        this.onTimeChange()
        if (GameDataManager.getInstance().curGameType == GAME_TYPE.DDZ)
        {
            this.onDDZIdChange()
            this.onDDZCurCallInfoChange()
        }
    }

    private onTimeChange()
    {
        if (GameDataManager.getInstance().curGameType != GAME_TYPE.DDZ)
        {
            if (this.m_pdkData.gameinfo.gameState != 3) // 游戏进行中
                return
            var operatorSeat = this.m_pdkData.getSeatById(this.m_pdkData.gameinfo.curOperateId)
            if(this.m_isNoBig){
                if(this.m_pdkData.gameinfo._time>0){
                    this.m_pdkData.gameinfo._time = 2
                }
                this.m_isNoBig = false
            }
            var time = this.m_pdkData.gameinfo.time
        }
        else
        {
            // 既不是抢地主阶段也不是游戏阶段
            if (this.m_pdkData.gameinfo.gameState != GAME_STATE_DDZ.GAME_STATE_CALL &&  this.m_pdkData.gameinfo.gameState != GAME_STATE_DDZ.GAME_STATE_GAME)
                return
            var operatorSeat = this.m_pdkData.gameinfo.curCallSeat
            if (this.m_pdkData.gameinfo.gameState == GAME_STATE_DDZ.GAME_STATE_GAME)
                    operatorSeat =  this.m_pdkData.getSeatById(this.m_pdkData.gameinfo.curOperateId)
            var time = this.m_pdkData.gameinfo.time
            
        }
        if (time >= 0)
        {
            this.node.getChildByName("jishi").active = true
            this.node.getChildByName("jishi").getChildByName("time").getComponent(cc.Label).string = time.toString()
        }
        if (operatorSeat < 0)
            return
        if (time > 0)
        {
            this.schedule(this.loop, 1);
            var x = this.timeNodePos[operatorSeat][0]
            var y = this.timeNodePos[operatorSeat][1]
            if (operatorSeat == 1)
                x += this.addSize/2
            else if (operatorSeat == 3)
                x -= this.addSize/2
            this.node.getChildByName("jishi").position = cc.v3(x, y)
        }
    }

    private loop()
    {
        var labelTime = this.node.getChildByName("jishi").getChildByName("time").getComponent(cc.Label)
        this.m_pdkData.gameinfo._time -= 1
        labelTime.string = this.m_pdkData.gameinfo.time.toString()
        if (this.m_pdkData.gameinfo.time < 0) {
            this.m_pdkData.gameinfo.time = 0
            this.unschedule(this.loop);
        }
    }
    private onNoBigCard(){
        this.m_isNoBig = true
    }

    public hideTimeNode()
    {
        this.node.getChildByName("jishi").active = false
    }

    /**设置玩家头像 */
    public setPlayerHeadImg(index)
    {
        var seat = index;
        var headNode = this.node.getChildByName("player" + seat).getChildByName("sp").getComponent(cc.Sprite)     //得到头像节点
        Utils.loadTextureFromNet(headNode, this.m_pdkData.playerInfoMap.get(seat).headurl)
    }

    /**玩家是否准备 */
    public setPlayerReady(index)
    {
        var seat = index;
        var readyNode = this.node.getChildByName("player" + seat).getChildByName("stage")    //得到准备节点
        var gamingState = 3
        if(GameDataManager.getInstance().curGameType == GAME_TYPE.DDZ)
            gamingState = 4
        if (this.m_pdkData.gameinfo.gameState == gamingState) // 游戏进行中
        {
            readyNode.active = false
            return
        }
        readyNode.active = this.m_pdkData.playerInfoMap.get(seat).isready;
        if (this.m_pdkData.playerInfoMap.get(seat).isready)
            readyNode.getComponent(cc.Sprite).spriteFrame = this.stageSp[0]
    }

    public setYbq(index)
    {
        var stageNode = this.node.getChildByName("player" + index).getChildByName("stage")    
        stageNode.active = true
        stageNode.getComponent(cc.Sprite).spriteFrame = this.stageSp[1]
    }

    /**设置玩家名字 */
    public setPlayerName(index)
    {   
        var seat = index;
        var labelName = this.node.getChildByName("player" + seat).getChildByName("label_name").getComponent(cc.Label)     //得到名字label
        labelName.string = Utils.getShortName(this.m_pdkData.playerInfoMap.get(seat).name, 10);
        
    }   

    /**玩家是否在线 */
    public setPlayerOnline(index)
    {
        var seat = index;
        var onlineNode = this.node.getChildByName("player" + seat).getChildByName("online")
        onlineNode.active = !this.m_pdkData.playerInfoMap.get(seat).isonline;
    }

    public setTrustee(index)
    {
        var seat = index;
        var tuoguanNode = this.node.getChildByName("player" + seat).getChildByName("tuoguanTip")
        tuoguanNode.active = this.m_pdkData.playerInfoMap.get(seat).isTrustee;
    }

    /**设置分数 */
    public setScore(index) 
    {
        var seat = index;
        var labelScore = this.node.getChildByName("player" + seat).getChildByName("score").getComponent(cc.Label)     //得到准备节点
        // var score = this.m_pdkData.playerInfoMap.get(seat).score
        // var oRule = this.m_pdkData.gameinfo.rule
        // if (!oRule.union)
        var score = this.m_pdkData.playerInfoMap.get(seat).clubScore
        labelScore.string = score.toString();
        if (score < 0)
            labelScore.node.color = new cc.Color(255, 64, 64);
        else
            labelScore.node.color = new cc.Color(251, 224, 72);
    }

    /**设置庄家 */
    private setMaster(index) 
    {
        return
        if (this.m_pdkData.gameinfo.gameState <= 0 && this.m_pdkData.gameinfo.gameState >= 4) {
            masterNode.active = false;
            return
        }
        var seat = index;
        var playerID = this.m_pdkData.playerInfoMap.get(seat).id
        var masterNode = this.node.getChildByName("player" + seat).getChildByName("Layout").getChildByName("sp_master_bg") 
        masterNode.active = (playerID == this.m_pdkData.gameinfo.dealerId)

    }

    /**设置房主 */
    private setOwner(index) 
    {
        var seat = index;
        var playerID = this.m_pdkData.playerInfoMap.get(seat).id
        var ownerNode = this.node.getChildByName("player" + seat).getChildByName("sp_fang") 
        ownerNode.active = (playerID == this.m_pdkData.gameinfo.creator)
    }

    private onHandCardChanged(msg)
    {
        this.setCardNum(msg.seat, false)
    }

    private setCardNum(index, isMust = true)
    {
        if (index == 0 || (this.m_pdkData.playerInfoMap.get(index).cards.length == 0 && isMust))
        {
            this.node.getChildByName("player" + index).getChildByName("card_num").active = false
            this.node.getChildByName("player" + index).getChildByName("label_num").active = false
            return
        }
        this.node.getChildByName("player" + index).getChildByName("label_num").getComponent(cc.Label).string = this.m_pdkData.playerInfoMap.get(index).cards.length.toString()
        this.node.getChildByName("player" + index).getChildByName("card_num").active = true
        this.node.getChildByName("player" + index).getChildByName("label_num").active = true
    }

    /**房间人数变化 */
    private onPlayerNumChanged(msg) {
        var seat = msg.playerSeat;
        if (msg.tag == "add")
        {
            this.node.getChildByName("player" + seat).active = true
            this.setPlayerHeadImg(seat)
            this.setPlayerReady(seat)
            this.setPlayerName(seat)
            this.setTrustee(seat)
            this.setPlayerOnline(seat)
            this.setScore(seat)
            this.setMaster(seat);
            this.setOwner(seat);
        }
        else
            this.node.getChildByName("player" + seat).active = false
    }

    private onPlayerStateChanged(msg)
    {
        if(msg.type == "ready")
            this.setPlayerReady(msg.playerSeat)
        else if (msg.type == "ybq")
            this.setYbq(msg.playerSeat)
        else if (msg.type == "clear")
            this.node.getChildByName("player" + msg.playerSeat).getChildByName("stage").active = false
        else
            this.setPlayerOnline(msg.playerSeat) 
    }

    private onGameStateChanged(msg)
    {
        if (this.m_pdkData.gameinfo.gameState == 3) {
            this.m_pdkData.playerInfoMap.forEach((infoObj, seat)=>{
                this.setCardNum(seat)
                this.node.getChildByName("player" + seat).getChildByName("stage").active = false

            })
            this.node.getChildByName("jishi").active = true
        }
        else if (this.m_pdkData.gameinfo.gameState == 4 || this.m_pdkData.gameinfo.gameState == 1)
        {
            this.node.getChildByName("jishi").active = false
        }
    }

    
    private onDDZGameStateChanged(msg)
    {
        if (this.m_pdkData.gameinfo.gameState == 4 || this.m_pdkData.gameinfo.gameState == 3) {
            var landlordInfo = this.m_pdkData.gameinfo.landlordInfo
            if (this.m_pdkData.gameinfo.gameState == 3 && (landlordInfo[0] != 0 || landlordInfo[1] != 0 || landlordInfo[3] != 0))
                return
            this.m_pdkData.playerInfoMap.forEach((infoObj, seat)=>{
                this.setCardNum(seat)
                this.node.getChildByName("player" + seat).getChildByName("stage").active = false

            })
            this.node.getChildByName("jishi").active = true
        }
        else if (this.m_pdkData.gameinfo.gameState == 5 || this.m_pdkData.gameinfo.gameState == 1)
        {
            this.node.getChildByName("jishi").active = false
        }
    }


    private onPlayerScoreChanged(msg)
    {
        var index = this.m_pdkData.getSeatById(msg.id);
        this.setScore(index)
    }

    private onOwnerChanged(msg)
    {
        var index = this.m_pdkData.getSeatById(msg.id);
        if (index >= 0)
            this.setOwner(index)
    }

    private onTrusteeChanged(msg)
    {
        var index = this.m_pdkData.getSeatById(msg.id);
        this.setTrustee(index)
    }

    private onCurOperateChanged()
    {
        // 打开倒计时
    }

    private onDealerChanged(msg)
    {
        return
        if (msg.id < 0)
        {
            for (var i =0; i<4; i++)
            {
                if (this.m_pdkData.playerInfoMap.get(i))
                {
                    var masterNode = this.node.getChildByName("player" + i).getChildByName("Layout").getChildByName("sp_master_bg") 
                    masterNode.active = false
                }
            }
            return
        }
        var index = this.m_pdkData.getSeatById(msg.id);
        this.setMaster(index)
    }

    //设置表情
    onInteractionRec(msg) {
        var blockInteraction = cc.sys.localStorage.getItem("blockInteraction");
        if (parseInt(blockInteraction) == 1) // 屏蔽互动
        {
            MessageManager.getInstance().disposeMsg();
            return;
        }
        if (this.m_pdkData == null)
        {
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
            //快捷文字
            if (playerObj && playerObj.sex == 1)    
            var seat = this.m_pdkData.getRealSeatByRemoteSeat(msg.sender) 
            var playerObj = this.m_pdkData.playerInfoMap.get(seat)
            //快捷文字
            if (playerObj && playerObj.sex == 1)    
                AudioManager.getInstance().playSFX("man/man_"+ gameType + "_" + msg.contentIdx);
            else
                AudioManager.getInstance().playSFX("woman/woman_"+ gameType + "_" + msg.contentIdx);
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

    private clearDuoXuan(){
        this.node.getChildByName("duo_xuan").active = false;
        for (var i = 0; i < 3; i++)
            this.node.getChildByName("duo_xuan").getChildByName("select"+i).active = false
    }

    public updateDuanXuanView(cardList)
    {
        for (var i = 0; i < 3; i++)
            this.node.getChildByName("duo_xuan").getChildByName("select"+i).active = false
        this.node.getChildByName("duo_xuan").active = true;
        this.node.getChildByName("pinbi_duoxuan").active = true;
        for (var i = 0; i < cardList.length; i++)
        {
            var cardParent = this.node.getChildByName("duo_xuan").getChildByName("select"+i)
            cardParent.active = true;
            for (var j = 0; j <4; j++)
                cardParent.getChildByName("card"+j).active = false;
            for (var j =0;j<cardList[i].length;j++)
            {
                var textureId = Utils.getPdkColorAndMjTextureId(cardList[i][j])
                var cardNode = cardParent.getChildByName("card"+j)
                cardNode.attr = cardList[i][j]
                Utils.loadTextureFromLocal(cardNode.getComponent(cc.Sprite), "/cards/card_" + textureId);
                cardNode.active = true
            }
        }
    }

    //设置表情
    setemjio(msg) {
        var index = this.m_pdkData.getRealSeatByRemoteSeat(msg.sender);
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
        try{
            if (this.m_pdkData && this.m_pdkData.gameinfo)
            {
                var senderSeat = this.m_pdkData.getRealSeatByRemoteSeat(msg.sender);
                var receiverSeat = this.m_pdkData.getRealSeatByRemoteSeat(msg.receiver);
                var startNode = this.node.getChildByName("player" + senderSeat).getChildByName("info_emoji")
                var endNode = this.node.getChildByName("player" + receiverSeat).getChildByName("info_emoji")
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
        catch (e) {}
    }

    // 移动动画完成后播放animation
    setInfoEmoji(msg,receiverSeat) {
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
        var seat = this.m_pdkData.getRealSeatByRemoteSeat(msg.sender);
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
        var seat = this.m_pdkData.getSeatById(msg.playerId);
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
    

    /**玩家头像按钮 */
    private btn_info(event, CustomEvent) {
        var seat = parseInt(CustomEvent) 
        UIManager.getInstance().openUI(infoGameUI, 20, () => {
            UIManager.getInstance().getUI(infoGameUI).getComponent("infoGameUI").initData(seat)
        })
    }

    /**表情按钮 */
    private button_chat() {
        AudioManager.getInstance().playSFX("button_click")
        if (this.m_pdkData == null)
            return;
        if (this.m_pdkData.gameinfo == null)
            return;
        var oRule = this.m_pdkData.gameinfo.rule
        if (oRule.option.block_hu_dong)
        {
            GameManager.getInstance().openWeakTipsUI("本局禁止互动，详情请联系群主");
            return
        }
        UIManager.getInstance().openUI(GameChatUI, 98);
    }

    private button_pinbiDuoXuan(){
        this.node.getChildByName("duo_xuan").active = false;
        this.node.getChildByName("pinbi_duoxuan").active = false;
    }

    private button_duoxuan(event, customEventData)
    {
        if (this.m_pdkData == null)
        {
            this.node.getChildByName("duo_xuan").active = false;
            this.node.getChildByName("pinbi_duoxuan").active = false;
            return
        }
        var outCards = []
        var cardParent = this.node.getChildByName("duo_xuan").getChildByName("select"+customEventData)
        for (var j = 0; j <4; j++)
        {
            if (cardParent.getChildByName("card"+j).active)
            {
                outCards.push(cardParent.getChildByName("card"+j).attr)
            }
        }
        this.node.getChildByName("duo_xuan").active = false;
        this.node.getChildByName("pinbi_duoxuan").active = false;
        var replaceList = []
        var result = this.m_pdkData.checkSelctCardsVaild(outCards)
        if (typeof(result) === "number")
        {
            GameManager.getInstance().openWeakTipsUI(StringData.getString(result));
            return
        }
        for (var i = 0; i < outCards.length; ++i)
        {
            if (Math.floor(outCards[i]/20) == 4)
            {
                replaceList.push(outCards[i])
                outCards[i] = this.m_pdkData.laiZi + 80
            }
        }
        var msg = {action: 2,cards: outCards, laiziReplace:replaceList}
        GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_PdkDoAction.MsgID.ID, msg);
    }
    

    // -------------------------斗地主-------------------------------

    private onDDZCurCallInfoChange()
    {
        if (this.m_pdkData.gameinfo.gameState == 1 || this.m_pdkData.gameinfo.gameState == 0)
            return
        var action2Sp = {
            "-4":2,"-3":3,"1":4,"2":5,"3":6,"-2":7,"-1":8
        }
        var landlordInfo = this.m_pdkData.gameinfo.landlordInfo
        for (var seat of [0,1,2,3])
        {
            var stageNode = this.node.getChildByName("player" + seat).getChildByName("stage")    
            if (landlordInfo[seat] == 0)
                stageNode.active = false
            else
            {
                var action = landlordInfo[seat]
                stageNode.active = true
                stageNode.getComponent(cc.Sprite).spriteFrame = this.stageSp[action2Sp[action.toString()]]
            }
        }
        if (this.m_pdkData.gameinfo.curCallSeat == 0)
        {
            this.node.getChildByName("player" + 0).getChildByName("stage").active = false  
        }
    }

    private onDDZCurCallRoundChange(msg)
    {
        this.node.getChildByName("player" + msg.seat).getChildByName("stage").active = false

    }

    private onDDZIdChange()
    {
        var landlordId = this.m_pdkData.gameinfo.landlordId
        if (landlordId == 0)
        {
            this.m_pdkData.playerInfoMap.forEach((infoObj, seat)=>{
                this.node.getChildByName("player" + seat).getChildByName("ddz_dz").active = false
                this.node.getChildByName("player" + seat).getChildByName("ddz_nm").active = false
            })
            return
        }
        var landlordSeat = this.m_pdkData.getRealSeatByRemoteSeat(landlordId)
        this.m_pdkData.playerInfoMap.forEach((infoObj, seat)=>{
            this.node.getChildByName("player" + seat).getChildByName("ddz_dz").active = landlordSeat == seat
            this.node.getChildByName("player" + seat).getChildByName("ddz_nm").active = landlordSeat != seat
        })
    }

}