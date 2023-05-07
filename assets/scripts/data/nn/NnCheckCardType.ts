import { OX_CARD_TYPE } from './GameInfo_NN';
import { Utils } from './../../../framework/Utils/Utils';

export class NnCheckCardType{


    public static checkNnCardType(cards){
        var copyCards = JSON.parse(JSON.stringify(cards))
        var sortedCards = copyCards.sort(function (a, b) { return Utils.getNnCardSortValue(a) - Utils.getNnCardSortValue(b) })
        if (NnCheckCardType.getTongHuaShunNiu(sortedCards) > 0)
            return OX_CARD_TYPE.OX_CARD_TYPE_OX_TONGHUASHUN
        else if (NnCheckCardType.getWuXiaoNiu(sortedCards) > 0)
            return OX_CARD_TYPE.OX_CARD_TYPE_OX_SMALL_5
        else if (NnCheckCardType.getBoomNiu(sortedCards) > 0)
            return OX_CARD_TYPE.OX_CARD_TYPE_OX_BOMB
        else if (NnCheckCardType.getHuLuNiu(sortedCards) > 0)
            return OX_CARD_TYPE.OX_CARD_TYPE_OX_HULU
        else if (NnCheckCardType.getJinHuaNiu(sortedCards) > 0)
            return OX_CARD_TYPE.OX_CARD_TYPE_OX_JINHUA
        else if (NnCheckCardType.getYinHuaNiu(sortedCards) > 0)
            return OX_CARD_TYPE.OX_CARD_TYPE_OX_YINHUA
        else if (NnCheckCardType.getTongHuaNiu(sortedCards) > 0)
            return OX_CARD_TYPE.OX_CARD_TYPE_OX_TONGHUA
        else if (NnCheckCardType.getShunZiNiu(sortedCards) > 0)
            return OX_CARD_TYPE.OX_CARD_TYPE_OX_SHUNZI
        else
            return NnCheckCardType.getCommonNnTypeFromCards(sortedCards)
    }   

    public static getTongHuaShunNiu(cards) // 同花顺牛
    {

        var color = Math.floor(cards[0] / 20)
        for (let cardId of cards)
        {
            if (Math.floor(cardId[0] / 20) != color)
                return 0
        }
        var tempCard = 0
        for (var i = 0; i < cards.length; i++)
        {
            if (tempCard = 0)
            {
                tempCard = cards[i]
                continue
            }
            if (Utils.getNnCardSortValue(cards[i]) - Utils.getNnCardSortValue(tempCard) != 1)
                return 0
            else
                tempCard = cards[i]
        }
        if (NnCheckCardType.isHaveNiu(cards))
            return OX_CARD_TYPE.OX_CARD_TYPE_OX_TONGHUASHUN
        return 0
    }

    public static getWuXiaoNiu(cards) // 五小牛
    {
        var account = 0
        for (let cardId of cards)
        {
            var realCardValue = Utils.getNnCardRealValue(cardId)
            if ( realCardValue >= 5)
                return 0
            account += realCardValue
        }
        if (account < 10)
            return  OX_CARD_TYPE.OX_CARD_TYPE_OX_SMALL_5
        return 0
    }

    
    public static getBoomNiu(cards) // 炸弹牛
    {
        var tempCard = 0
        var count = 0
        for (var i = 0; i < cards.length; i++)
        {
            if (tempCard = 0)
            {
                tempCard = cards[i]
                count = 1
                continue
            }
            if (Utils.getNnCardSortValue(cards[i]) == Utils.getNnCardSortValue(tempCard))
                count += 1
            else
            {
                tempCard = cards[i]
                count = 1
            }
        }
        if (count == 4)
            return OX_CARD_TYPE.OX_CARD_TYPE_OX_BOMB
        else
            return 0
    }

    public static getHuLuNiu(cards) // 葫芦牛
    {
        return 0
    }

    public static getJinHuaNiu(cards) // 金花牛
    {
        for (var cardId of cards)
        {
            if (Utils.getNnCardSortValue(cardId) < 11)
                return 0
        }
        return OX_CARD_TYPE.OX_CARD_TYPE_OX_JINHUA
    }
    
    public static getYinHuaNiu(cards) // 银花牛
    {
        for (var cardId of cards)
        {
            if (Utils.getNnCardSortValue(cardId) < 10)
                return 0
        }
        return OX_CARD_TYPE.OX_CARD_TYPE_OX_YINHUA
    }

    public static getTongHuaNiu(cards) // 同花牛
    {
        var color = Math.floor(cards[0] / 20)
        for (let cardId of cards)
        {
            if (Math.floor(cardId[0] / 20) != color)
                return 0
        }
        if (NnCheckCardType.isHaveNiu(cards))
            return OX_CARD_TYPE.OX_CARD_TYPE_OX_TONGHUA
        return 0
    }

    public static getShunZiNiu(cards) // 顺子牛
    {
        var tempCard = 0
        for (var i = 0; i < cards.length; i++)
        {
            if (tempCard = 0)
            {
                tempCard = cards[i]
                continue
            }
            if (Utils.getNnCardSortValue(cards[i]) - Utils.getNnCardSortValue(tempCard) != 1)
                return 0
            else
                tempCard = cards[i]
        }
        if (NnCheckCardType.isHaveNiu(cards))
            return OX_CARD_TYPE.OX_CARD_TYPE_OX_SHUNZI
        return 0
    }

    public static isHaveNiu(cards)
    {
        var rangeList = []
        var templateList = []
        NnCheckCardType.getXCardsFromY(cards, cards.length, 3, 0, 3, templateList, 0, rangeList)
        for (var cardList of rangeList)
        {
            var account = 0
            for (var cardId of cardList)
                account += Utils.getNnCardRealValue(cardId)
            if (account%10 == 0)
                return true
        }
        return false
    }

    public static getCommonNnTypeFromCards(cards){
        cards = [13,3,7,10,11]
        var rangeList = []
        var templateList = []
        NnCheckCardType.getXCardsFromY(cards, cards.length, 2, 0, 2, templateList, 0, rangeList)
        var dataMap = new Map();
        var maxNiu = 0
        for (var pairList of rangeList)
        {
            var valueList = []
            for (var card of cards)
            {
                if (pairList.indexOf(card) < 0)
                    valueList.push(card)
            }
            var niu = NnCheckCardType.getNiuFromPair(pairList,valueList)
            if (niu > maxNiu)
                maxNiu = niu
            dataMap.set(pairList, [valueList, niu])
        }
        return maxNiu
    }

    public static getNiuFromPair(pairList,valueList){
        var account = 0
        for(var card of valueList)
            account += Utils.getNnCardRealValue(card)
        if (account%10 != 0) // 没牛
            return OX_CARD_TYPE.OX_CARD_TYPE_OX_NONE
        else{
            var pariAccount = 0
            for (var pairCard of pairList)
                pariAccount += Utils.getNnCardRealValue(pairCard)
            if (pariAccount%10 == 0)
                return OX_CARD_TYPE.OX_CARD_TYPE_OX_10
            else
            {
                var niuValueList = [0,2,3,4,5,6,7,8,9]
                return niuValueList[pariAccount%10]
            }
        }
    }

    public static getXCardsFromY(dataList, x, outLen, startIndex, y, templateList, templateListIndex,rangeList)
    {
        if(y == 0)
        {   
            rangeList.push(JSON.parse(JSON.stringify(templateList)))
            return;
        }

        var endIndex = x - y;
        for(let i=startIndex; i<=endIndex; i++)
        {
            templateList[templateListIndex] = dataList[i];
            NnCheckCardType.getXCardsFromY(dataList, x, outLen, i+1, y-1, templateList, templateListIndex+1,rangeList);
        }
    }

}

