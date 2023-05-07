import { Utils } from './../../../framework/Utils/Utils';
import { CARD_TYPE_ZJH } from './GamePlayerInfo_ZJH';

export class  ZjhCheckCardType{

    public static checkZjhCardType(cards){
        if (cards.length != 3)
            return -1;
        if (ZjhCheckCardType.isBaoZi(cards)) // 豹子
            return CARD_TYPE_ZJH.CARD_TYPE_BZ
        else if (ZjhCheckCardType.isShunJin(cards)) // 顺金
            return CARD_TYPE_ZJH.CARD_TYPE_SJ
        else if (ZjhCheckCardType.isJinHua(cards)) // 金花
            return CARD_TYPE_ZJH.CARD_TYPE_JH
        else if(ZjhCheckCardType.isShunZi(cards)) // 顺子
            return CARD_TYPE_ZJH.CARD_TYPE_SZ
        else if (ZjhCheckCardType.isDuiZi(cards)) // 对子
            return CARD_TYPE_ZJH.CARD_TYPE_DZ
        else
            return CARD_TYPE_ZJH.CARD_TYPE_SP // 散牌
    }

    public static isBaoZi(cards){
        if (Utils.getPdkCardValue(cards[0]) == Utils.getPdkCardValue(cards[1]) && Utils.getPdkCardValue(cards[1]) == Utils.getPdkCardValue(cards[2]))
            return true;
        return false;
    }

    public static isJinHua(cards){
        var color = Math.floor(cards[0] / 20)  // 黑红梅方 0,1,2,3
        for (var cardId of cards)
        {
            var cardColor = Math.floor(cardId / 20)
            if (cardColor != color)
                return false
        }
        return true
    }

    public static isShunZi(cards)
    {
        cards = cards.sort(function (a, b) {return a - b})
        Utils.pdkWenDingSort(cards)
        if (Utils.getPdkCardValue(cards[0]) == 14 && Utils.getPdkCardValue(cards[1]) == 3 && Utils.getPdkCardValue(cards[2]) == 2)
            return true
        if (Utils.getPdkCardValue(cards[0]) - Utils.getPdkCardValue(cards[1]) == 1 && Utils.getPdkCardValue(cards[1]) - Utils.getPdkCardValue(cards[2]) == 1)
            return true;
        return false
    }
    
    public static isShunJin(cards)
    {
        if (ZjhCheckCardType.isShunZi(cards) && ZjhCheckCardType.isJinHua(cards))
            return true;
        return false;
    }

    public static isDuiZi(cards)
    {
        if (Utils.getPdkCardValue(cards[0]) == Utils.getPdkCardValue(cards[1]))
            return true;
        else if (Utils.getPdkCardValue(cards[1]) == Utils.getPdkCardValue(cards[2]))
            return true;
        else if (Utils.getPdkCardValue(cards[0]) == Utils.getPdkCardValue(cards[2]))
            return true;
        else
            return false;
    }

}

