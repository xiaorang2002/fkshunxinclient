import { SCPDKCheckCardType } from './../../../data/game_pdk/SCPDKCheckCardType';
import { DDZCheckCardType } from './../../../data/ddz/DDZCheckCardType';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { GAME_TYPE } from './../../../data/GameConstValue';
import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { ListenerType } from './../../../data/ListenerType';
import { GAME_STATE_PDK } from '../../../data/game_pdk/GameInfo_PDK';
import { Utils } from './../../../../framework/Utils/Utils';
import { PDKCheckCardType } from './../../../data/game_pdk/PDKCheckCardType';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { ListenerManager } from './../../../../framework/Manager/ListenerManager';
import * as Proto from "../../../../proto/proto-min";
import TuoGuanUI from '../../TuoGuanUI';
import {GameUI_PlayerInfo_PDK}  from './GameUI_PlayerInfo_PDK';

const { ccclass, property } = cc._decorator;

@ccclass
export default class SelfCardControl_PDK extends cc.Component {

    @property(cc.Integer)
    seat: number = 0;
    @property(cc.Node)
    node_cant: cc.Node = null;


    private pdkData = null;
    private handCards: cc.Node[]  = []
    private outCards: cc.Node[] = [];
    private touchSelectArray: cc.Node[] = [];
    private isPlayAnimation = false


    onDataRecv()
    {
        this.pdkData = GameDataManager.getInstance().getDataByCurGameType();
        this.initArray()
        this.initCardsListen();
    }

    onDestroy(){
        ListenerManager.getInstance().removeAll(this);
        this.pdkData = null;
    }

    onShow(){
        this.pdkData = GameDataManager.getInstance().getDataByCurGameType();
    }

    resetDataOnBack()
    {
        this.pdkData = GameDataManager.getInstance().getDataByCurGameType();
    }

    private initListen()
    {
        ListenerManager.getInstance().add(ListenerType.pdk_curTipsCardsChanged, this, this.onCurSelectTipsChanged);
    }


    private initArray()
    {
        this.initListen()
        this.handCards = [];
        this.outCards = [];
        for (var i = 0; i < 20; i++) {
            this.handCards.push(this.node.getChildByName("cards").getChildByName("card" + i));
            this.handCards[i].active = false;
        }
        for (var i = 0; i < 20; i++) {
            this.outCards.push(this.node.getChildByName("outcards").getChildByName("card" + i));
            this.outCards[i].active = false;
        }
    }

    private initCardsListen() {
        function addListen(cardnode, index, _this) {
            //开启点击
            cardnode.on(cc.Node.EventType.TOUCH_START, function (event) {
                this.touchSelectArray = [];
                this.startTouchIndex = index;
                this.endTouchIndex = index;
                this.touchSelectArray.push(this.handCards[index]);
            }.bind(_this));

            //抬起
            cardnode.on(cc.Node.EventType.TOUCH_END, function (event) {
                for (var i = 0; i < this.touchSelectArray.length; ++i) {
                    this.touchSelectArray[i].color = cc.Color.WHITE;
                    this.touchSelectArray[i].y = (this.touchSelectArray[i].y == 0 ? 30 : 0);
                }
                if (this.touchSelectArray.length > 3 && this.pdkData && this.pdkData.gameinfo && (this.pdkData.gameinfo.lastOutSeat == 0 || this.pdkData.gameinfo.lastOutSeat == -1))
                {
                    if (GameDataManager.getInstance().curGameType == GAME_TYPE.SCPDK && this.touchSelectArray.length > 3)
                    {
                        var result = SCPDKCheckCardType.autoGetPlayCard(this.getUpCards(), this.pdkData.playerInfoMap.get(0).cards,GameDataManager.getInstance().curGameType)
                        this.setAutoPlayCard(result);
                    }
                    else if (GameDataManager.getInstance().curGameType != GAME_TYPE.SCPDK && this.touchSelectArray.length > 4)
                    {
                        if (GameDataManager.getInstance().curGameType == GAME_TYPE.DDZ)
                            var result = DDZCheckCardType.autoGetPlayCard(this.getUpCards(), this.pdkData.playerInfoMap.get(0).cards,GameDataManager.getInstance().curGameType)
                        else
                            var result = PDKCheckCardType.autoGetPlayCard(this.getUpCards(), this.pdkData.playerInfoMap.get(0).cards,GameDataManager.getInstance().curGameType)
                        this.setAutoPlayCard(result);
                    }
                }
            }.bind(_this));

            //按钮取消
            cardnode.on(cc.Node.EventType.TOUCH_CANCEL, function (event) {
                for (var i = 0; i < this.touchSelectArray.length; ++i) {
                    this.touchSelectArray[i].color = cc.Color.WHITE;
                    this.touchSelectArray[i].y = (this.touchSelectArray[i].y == 0 ? 30 : 0);
                }
                if (this.touchSelectArray.length > 3 && this.pdkData && this.pdkData.gameinfo && (this.pdkData.gameinfo.lastOutSeat == 0 || this.pdkData.gameinfo.lastOutSeat == -1))
                {
                    if (GameDataManager.getInstance().curGameType == GAME_TYPE.SCPDK && this.touchSelectArray.length > 3)
                    {
                        var result = SCPDKCheckCardType.autoGetPlayCard(this.getUpCards(), this.pdkData.playerInfoMap.get(0).cards,GameDataManager.getInstance().curGameType)
                        this.setAutoPlayCard(result);
                    }
                    else if (GameDataManager.getInstance().curGameType != GAME_TYPE.SCPDK && this.touchSelectArray.length > 4)
                    {
                        if (GameDataManager.getInstance().curGameType == GAME_TYPE.DDZ)
                            var result = DDZCheckCardType.autoGetPlayCard(this.getUpCards(), this.pdkData.playerInfoMap.get(0).cards,GameDataManager.getInstance().curGameType)
                        else
                            var result = PDKCheckCardType.autoGetPlayCard(this.getUpCards(), this.pdkData.playerInfoMap.get(0).cards,GameDataManager.getInstance().curGameType)
                        this.setAutoPlayCard(result);
                    }
                }
            }.bind(_this));

            //开启拖拽
            cardnode.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
                var pos = event.touch.getPreviousLocation();
                if (Math.abs(event.touch.getStartLocation().x - pos.x) < 10)
                    return;
                //拖拽特效
                for (var i = 0; i < this.handCards.length; ++i) {
                    if (!this.handCards[i].activeInHierarchy)
                        continue;
                    this.handCards[i].color = cc.Color.WHITE;
                    var box = this.handCards[i].getBoundingBoxToWorld();
                    if (pos.x > box.xMin && pos.x < box.xMax - 100 && pos.y > box.yMin - 30 && pos.y < box.yMax) {
                        if (i < this.startTouchIndex) {
                            this.endTouchIndex = i;
                            break;
                        }
                        else
                            this.endTouchIndex = i;
                    }
                }
                var b = 0, e = 0;
                if (this.startTouchIndex > this.endTouchIndex) {
                    b = this.endTouchIndex;
                    e = this.startTouchIndex;
                }
                else {
                    e = this.endTouchIndex;
                    b = this.startTouchIndex;
                }
                this.touchSelectArray = [];
                for (var i = b; i <= e; ++i) {
                    this.touchSelectArray.push(this.handCards[i]);
                    this.handCards[i].color = cc.Color.GRAY;
                }
            }.bind(_this));
        }
        for (var i = 0; i < this.handCards.length; ++i)
            addListen(this.handCards[i], i, this)
    }

    setAll()
    {
        this.pdkData = GameDataManager.getInstance().getDataByCurGameType();
        this.handCardsChange();
        this.outCardsChange();
    }

    //刷新手牌
    private handCardsChange() {
        if (GameDataManager.getInstance().curGameType == GAME_TYPE.DDZ)
            DDZCheckCardType.clearAutoCardData()
        else
            PDKCheckCardType.clearAutoCardData()
        var isNeedPlayAni = true
        this.pdkData = GameDataManager.getInstance().getDataByCurGameType();
        this.pdkData.playerInfoMap.forEach((infoObj, seat)=>{
            if (infoObj.cards.length != this.pdkData.getRuleCardNum())
                isNeedPlayAni = false
        })
        if (isNeedPlayAni && !UIManager.getInstance().getUI(TuoGuanUI))
        {
            this.PlayGetCardsAni()
            return
        }
        if (this.pdkData.gameinfo.gameState != GAME_STATE_PDK.GAME_STATE_QIEPAI) {
            var cardsArray = this.pdkData.playerInfoMap.get(0).cards;
            for (var i = 0; i < this.handCards.length; ++i) {
                this.handCards[i].y = 0;
                this.handCards[i].color = cc.Color.WHITE;
                this.handCards[i].removeAllChildren();
                if (i < cardsArray.length)
                    this.setCardTexture(this.handCards[i], cardsArray[i]);
                else
                    this.setCardTexture(this.handCards[i], -1);
            }
        }
    }

    // 播放摸牌动画
    private PlayGetCardsAni()
    {
        var k = 0;
        for (var i = 0; i < this.handCards.length; ++i) {
            this.setCardTexture(this.handCards[i], -1);
        }
        this.isPlayAnimation = true
        var callback = function () {
            AudioManager.getInstance().playSFX("xipai")
            if (!this.pdkData.playerInfoMap.get(0))
            {
                this.isPlayAnimation = false
                this.unschedule(callback)
                return
            }
            if (k == this.pdkData.playerInfoMap.get(0).cards.length) {
                this.isPlayAnimation = false
                this.unschedule(callback)
            }
            var cardsArray = this.pdkData.playerInfoMap.get(0).cards.slice(0, k);
            if (this.handCards[k - 1] != null) {
                this.handCards[k - 1].y = 0;
                this.handCards[k - 1].color = cc.Color.WHITE;
                this.handCards[k - 1].removeAllChildren();
                this.setCardTexture(this.handCards[k - 1], cardsArray[k - 1]);
            }
            k++;
        }
        this.schedule(callback, 0.08);
    }

    public isPlayingAni()
    {
        return this.isPlayAnimation
    }

    //刷新出牌
    private outCardsChange() {
        this.pdkData = GameDataManager.getInstance().getDataByCurGameType();
        var cardsArray = this.pdkData.playerInfoMap.get(0).outCard;
        for (var i = 0; i < this.outCards.length; ++i) {
            if (i < cardsArray.length)
                this.setCardTexture(this.outCards[i], cardsArray[i]);
            else
                this.setCardTexture(this.outCards[i], -1);

            this.outCards[i].removeAllChildren();
        }
    }

    //设置一张牌的显示
    private setCardTexture(node, cardid) {
        if (cardid <= 0) {
            //id非法并隐藏该节点
            node.active = false;
            node.attr = -1;
            return;
        }
        node.attr = cardid;
        var textureId = Utils.getPdkColorAndMjTextureId(cardid)
        var spriteFrame = this.getSpriteFrameFromParent(textureId)
        if (spriteFrame)
        {
            node.getComponent(cc.Sprite).spriteFrame = spriteFrame
            node.active = true;
        }
        else
        {
            Utils.loadTextureFromLocal(node.getComponent(cc.Sprite), "/cards/card_" + textureId, function () { node.active = true; });
        }
    }

    //所有抬起牌复位
    setCardsReset() {
        for (var i = 0; i < this.handCards.length; ++i)
            this.handCards[i].y = 0;
    }

    //得到抬起的牌
    getUpCards() {
        var cards = [];
        for (var i = 0; i < this.handCards.length; ++i) {
            var cardId = this.handCards[i].attr
            if (typeof(cardId) == "number" && cardId > 0 &&this.handCards[i].y == 30)
                cards.push(this.handCards[i].attr);
        }
        return cards;
    }

    //设置提示牌型
    onCurSelectTipsChanged() {
        this.pdkData = GameDataManager.getInstance().getDataByCurGameType();
        var cards = JSON.parse(JSON.stringify(this.pdkData.gameinfo.curTipsCardsArray[this.pdkData.gameinfo.curTipsIndex])) 
        cards = cards.sort(function (a, b) { return b - a });
        if (this.pdkData.laiZi != 0)
        {
            var cardList1 = []
            var cardList2 = []
            for (var cardValue of cards)
            {
                if (cardValue == this.pdkData.laiZi)
                    cardList1.push(cardValue)
                else
                    cardList2.push(cardValue)
            }
            cards = cardList1.concat(cardList2)
        }
        var j = 0;
        for (var i = 0; i < this.handCards.length; ++i) {
            this.handCards[i].y = 0;
            if (j >= cards.length)
                continue;
            if (Utils.getPdkCardValue(this.handCards[i].attr) == cards[j]) {
                j += 1;
                this.handCards[i].y = 30;
            }
        }
    }

    //设置提牌
    setAutoPlayCard(cards) {
        cards.sort(function (a, b) { return Utils.getPdkCardValue(b) - Utils.getPdkCardValue(a) });
        if (this.pdkData.laiZi != 0)
        {
            var cardList1 = []
            var cardList2 = []
            for (var cardId of cards)
            {
                if (Utils.getPdkCardValue(cardId) == this.pdkData.laiZi)
                    cardList1.push(cardId)
                else
                    cardList2.push(cardId)
            }
            cards = cardList1.concat(cardList2)
        }
        var j = 0;
        for (var i = 0; i < this.handCards.length; ++i) {
            this.handCards[i].y = 0;
            if (j >= cards.length)
                continue;
            if (this.handCards[i].attr == cards[j]) {
                j += 1;
                this.handCards[i].y = 30;
            }
        }
    }

    checkCanBetMask()
    {
        if (this.pdkData.gameinfo.lastOutSeat == -1 || this.pdkData.gameinfo.lastOutSeat == 0) // 轮到我出牌，并且大牌之后
            this.setNoCanBetCards(false)
        else if (this.pdkData.gameinfo.curTipsCardsArray.length == 0 && this.pdkData.gameinfo.curOperateId == this.pdkData.playerInfoMap.get(0).id) // 当前没有能够大过别人的牌平切轮到自己才屏蔽
            this.setNoCanBetCards(true)
        else
            this.setNoCanBetCards(false)
    }

    /**设置要不起遮罩 */
    private setNoCanBetCards(isshow) {
        this.node.stopAllActions()
        // if (isshow) {
        //     this.setCardsReset();
        //     this.node_cant.width = this.node.getChildByName("cards").width;
        //     if (this.pdkData.playerInfoMap.get(0).cards.length <= 4)
        //         this.node_cant.width = 500
        // }
        // this.node_cant.active = isshow;
        this.node_cant.active = false;
        if (isshow && !UIManager.getInstance().getUI(TuoGuanUI)) //如果要不起
        {   
            MessageManager.getInstance().messagePost(ListenerType.operateNoBigCard);
            var action0 = cc.delayTime(2);
            var action1 = cc.callFunc(function () {
                if (this.pdkData&&this.pdkData.gameinfo){
                    if (this.pdkData.gameinfo.curOperateId != this.pdkData.playerInfoMap.get(0).id)
                        return
                    this.setCardsReset()
                    // if (GameDataManager.getInstance().curGameType == GAME_TYPE.DDZ && this.pdkData.gameinfo.gameState == 4)
                    //     MessageManager.getInstance().messageSend(Proto.CS_DdzDoAction.MsgID.ID, {action: 1,});
                    if ((GameDataManager.getInstance().curGameType ==211 || GameDataManager.getInstance().curGameType ==210 || GameDataManager.getInstance().curGameType ==212) && this.pdkData.gameinfo.gameState == 3)
                        MessageManager.getInstance().messageSend(Proto.CS_PdkDoAction.MsgID.ID, {action: 1,});
                }
               
            }.bind(this))
            this.node.runAction(cc.sequence(action0,action1));
        }

    }

     // 从父节点保存的缓存纹理列表获取指定纹理
     public getSpriteFrameFromParent(cardId){
        var gameUIPdk = this.node.getParent().getParent().getComponent("GameUI_PDK")
        return gameUIPdk.getCardSpriteFrame(cardId)
    }

}
