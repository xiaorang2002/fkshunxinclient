import { GAME_TYPE } from './../../../data/GameConstValue';
import { GAME_STATE_PDK } from '../../../data/game_pdk/GameInfo_PDK';
import { Utils } from './../../../../framework/Utils/Utils';
import { PDKCheckCardType } from './../../../data/game_pdk/PDKCheckCardType';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { ListenerManager } from './../../../../framework/Manager/ListenerManager';
const { ccclass, property } = cc._decorator;

@ccclass
export default class OtherCardControl_PDK extends cc.Component {

    @property(cc.Integer)
    seat: number = 0;

    private pdkData = null;
    private outCards: cc.Node[] = [];

    onDataRecv()
    {
        this.pdkData = GameDataManager.getInstance().getDataByCurGameType();
        this.initArray()
        this.updateOutCardsByGameType()
    }

    onDestroy(){
        ListenerManager.getInstance().removeAll(this);
        this.pdkData = null;
    }

    onShow(){
        this.pdkData = GameDataManager.getInstance().getDataByCurGameType();
        this.updateOutCardsByGameType()
    }

    resetDataOnBack()
    {
        this.pdkData = GameDataManager.getInstance().getDataByCurGameType();
        this.updateOutCardsByGameType()
    }

    private initArray()
    {
        this.outCards = [];
        if (GameDataManager.getInstance().curGameType == GAME_TYPE.SCPDK && (this.seat == 1 || this.seat ==3)) // 四川跑得快
        {
            for (var i = 0; i < 10; i++) {
                this.outCards.push(this.node.getChildByName("outcards_10").getChildByName("card" + i));
                this.outCards[i].active = false;
            }
        }
        else{
            for (var i = 0; i < 20; i++) {
                this.outCards.push(this.node.getChildByName("outcards").getChildByName("card" + i));
                this.outCards[i].active = false;
            }
        }
    }

    private updateOutCardsByGameType()
    {
        this.node.getChildByName("outcards").active = true
        if (this.seat == 1 || this.seat ==3)
        {
            if (GameDataManager.getInstance().curGameType == GAME_TYPE.SCPDK)
            {
                this.node.getChildByName("outcards_10").active = true
                this.node.getChildByName("outcards").active = false
            }
            else
            {
                this.node.getChildByName("outcards_10").active = false
                this.node.getChildByName("outcards").active = true
            }
        }
    }

    setAll()
    {
        this.pdkData = GameDataManager.getInstance().getDataByCurGameType();
        this.outCardsChange();
    }

    //刷新手牌
    private handCardsChange() {
        return
    }

    public showHandCardsOnOver(cards) {
        cards = cards.sort(function (a, b) {return b - a})
        Utils.pdkWenDingSort(cards)
        cards = Utils.sortWithLaiZi(cards)
        for (var i = 0; i < this.outCards.length; ++i) {
            if (i < cards.length)
                this.setCardTexture(this.outCards[i], cards[i]);
            else
                this.setCardTexture(this.outCards[i], -1);
        }
    }


    //刷新出牌
    private outCardsChange() {
        var cardsArray = JSON.parse(JSON.stringify(this.pdkData.playerInfoMap.get(this.seat).outCard));
        if (cardsArray.length == 0) {
            for (let i = 0; i < this.outCards.length; i++) {
                this.setCardTexture(this.outCards[i], -1);
            }
        }
        for (var i = 0; i < this.outCards.length; ++i) {
            if (i < cardsArray.length)
                this.setCardTexture(this.outCards[i], cardsArray[i]);
            else
                this.setCardTexture(this.outCards[i], -1);
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

    // 从父节点保存的缓存纹理列表获取指定纹理
    public getSpriteFrameFromParent(cardId){
        var gameUIPdk = this.node.getParent().getParent().getComponent("GameUI_PDK")
        return gameUIPdk.getCardSpriteFrame(cardId)
    }
    
}
