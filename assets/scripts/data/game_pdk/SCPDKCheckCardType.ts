import { GameDataManager } from './../../../framework/Manager/GameDataManager';
import { Utils } from './../../../framework/Utils/Utils';
import { PDKCheckCardType } from './../game_pdk/PDKCheckCardType';

export class SCPDKCheckCardType extends PDKCheckCardType{

    protected static laiZiCardValue = 0             // 癞子牌的值
    protected static laiZiCardNum = 0               // 癞子牌的数量
    //检测牌型
    //牌型 1:单张 2:对子 3:顺子 4:连对 5:三不带 13:炸弹
    public static checkCardsType(cards, extraData = null) {
        try{
            this.cardsArray = JSON.parse(JSON.stringify(cards)) 
            this.cardsArray = this.getSortedOutCards(this.cardsArray)
            this.laiZiCardNum = 0
            this.laiZiCardValue = 0
            if (extraData && extraData.laizi.length > 0)
            {
                this.laiZiCardValue = Utils.getPdkCardValue(extraData.laizi[0])
                this.laiZiCardNum = extraData.laizi.length
            }
            for (var i = 0; i < this.cardsArray.length; ++i)
                this.cardsArray[i] = Utils.getPdkCardValue(this.cardsArray[i]);
            //判断牌型
            if (this.isSigles())//检测单张
                return this.cardType;
            else if (this.isDoubles())//检测对子
                return this.cardType;
            else if (this.isBoom())//判断炸弹和王炸
                return this.cardType;
            else if (this.isSingleContinue())//单顺
                return this.cardType;
            else if (this.isTwoContinue())//连对
                return this.cardType;
            else if (this.isThrees())//检测三张
                return this.cardType;
            else if (this.isFour())//检测四张
                return this.cardType;
            return null;
        }
        catch (e)
        {
            return null;
        }
    }
    
    private static getRealLength(): number {
        return this.cardsArray.length + this.laiZiCardNum
    }

    private static getMinValueOfCards(cards): number {
        var minValue = cards[0]
        for (var card of cards)
        {
            if (card < minValue)
                minValue = card
        }
        return minValue
    }

    //检测单张
    protected static isSigles() {
        var flag = false;
        this.cardType = null;
        if (this.getRealLength() != 1)
            return flag;
        if (this.laiZiCardNum != 0)
        {
            //纯癞子特殊处理
            this.cardType = {
                type: 1,
                minValue: 14
            };
            // this.cardType = {
            //     type: 1,
            //     minValue: this.laiZiCardValue
            // };
        }
        else
        {
            this.cardType = {
                type: 1,
                minValue: this.cardsArray[0]
            };
        }
        flag = true;
        return flag;
    }


    //检测对子
    protected static isDoubles() {
        var flag = false;
        this.cardType = null;
        if (this.getRealLength() != 2)
            return flag;
        if (this.laiZiCardNum != 0)
        {
            var replaceList = []
            if (this.laiZiCardNum == 1)
            {
                replaceList.push(this.cardsArray[0])
                this.cardType = {
                    type: 2,
                    minValue: this.cardsArray[0],
                    replace:replaceList
                };
            }
            else
            {
                //纯癞子特殊处理
                this.cardType = {
                    type: 2,
                    minValue: 14
                };
                // this.cardType = {
                //     type: 2,
                //     minValue: this.laiZiCardValue
                // };
            }
            flag = true;
        }
        else if (this.cardsArray[0] == this.cardsArray[1])
        {
            this.cardType = {
                type: 2,
                minValue: this.cardsArray[0]
            };
            flag = true;
        }
        return flag;
    }

    //检测单顺子
    protected static isSingleContinue() {
        var flag = true;
        this.cardType = null;
        if (this.getRealLength() < 3 || this.cardsArray.length == 0)
            return !flag;
        if (this.laiZiCardNum != 0)
        {
            var straightLength = this.getRealLength() // 顺子总长度
            var minValue = this.getMinValueOfCards(this.cardsArray)   // 整个顺子中最小的牌
            var curStraightValue = 0 // 当前顺子连接值
            var needLaiZiNum = 0
            var replaceList = []
            if (minValue + straightLength -1 > 14) // 总顺子最大值不能超过A
            {
                needLaiZiNum += 1
                minValue = 14+1-straightLength // 实际顺子中最小值
                replaceList.push(minValue)

            }
            for(var i = 1; i < straightLength; i++)
            {
                curStraightValue = minValue + i
                if (this.cardsArray.indexOf(curStraightValue) < 0)
                {
                    needLaiZiNum += 1
                    replaceList.push(curStraightValue)
                }
            }
            if (needLaiZiNum != this.laiZiCardNum) // 实际需要的癞子数量等于打出的癞子数量则是正确的顺子
                flag = false
            if (flag) {
                this.cardType = {
                    type: 3,
                    minValue: minValue,
                    replace:replaceList
                };
            }
            return flag;
        }
        else
        {
            for (var i = 0; i < this.cardsArray.length; ++i) {
                //连续性检测
                if (i < this.cardsArray.length - 1 && this.cardsArray[i] - this.cardsArray[i + 1] != 1) {
                    flag = false;
                    break;
                }
            }
            if (flag) {
                this.cardType = {
                    type: 3,
                    minValue: this.cardsArray[this.cardsArray.length - 1]
                };
            }
            return flag;
        }
    }

    //检测连队
    protected static isTwoContinue() {
        var flag = true;
        this.cardType = null;
        var lDLimit = 6
        var rule = GameDataManager.getInstance().getDataByCurGameType().gameinfo.rule;
        if (rule.play.zi_mei_dui) // 姊妹对支持2连队
            lDLimit = 4
        if (this.cardsArray.length == 0)
            return !flag;
        if (this.getRealLength() < lDLimit || this.getRealLength() % 2 != 0)
            return !flag;

        if (this.laiZiCardNum != 0)
        {
            var doubleStraightLength = this.getRealLength()/2 // 双顺子总长度
            var minValue = this.getMinValueOfCards(this.cardsArray)
            var curStraightValue = 0 // 当前顺子连接值
            var needLaiZiNum = 0
            var replaceList = []
            if (minValue + doubleStraightLength -1 > 14) // 总顺子最大值不能超过A
            {
                minValue = 14+1-doubleStraightLength // 实际顺子中最小值
            }
            var minValueCount = 0
            for(let tempValue1 of this.cardsArray)
            {
                if (tempValue1 == minValue)
                    minValueCount += 1
            }
            if (2 - minValueCount == 2)
            {
                needLaiZiNum += 2
                replaceList.push(minValue)
                replaceList.push(minValue) 
            }
            else if(2 - minValueCount == 1)
            {
                needLaiZiNum += 1
                replaceList.push(minValue)
            }
            for(var i = 1; i < doubleStraightLength; i++)
            {
                curStraightValue = minValue + i
                var count = 0
                for(var tempValue of this.cardsArray)
                {
                    if (tempValue == curStraightValue)
                        count += 1
                }
                if (count > 2)
                {
                    flag = false
                    return flag
                }
                needLaiZiNum = needLaiZiNum+(2- count)
                if (2 - count == 2)
                {
                    replaceList.push(curStraightValue)
                    replaceList.push(curStraightValue) 
                }
                else if(2 - count == 1)
                {
                    replaceList.push(curStraightValue)
                }
            }
            if (needLaiZiNum != this.laiZiCardNum) // 实际需要的癞子数量等于打出的癞子数量则是正确的顺子
                flag = false
            if (flag) {
                this.cardType = {
                    type: 4,
                    minValue: minValue,
                    replace:replaceList
                };
            }
        }
        else
        {
            for (var i = 0; i < this.cardsArray.length; i = i + 2) {
                //两张是否相等
                if (this.cardsArray[i] != this.cardsArray[i + 1]) {
                    flag = false;
                    break;
                }
                //连续性检测
                if (i < this.cardsArray.length - 2 && this.cardsArray[i] - this.cardsArray[i + 2] != 1) {
                    flag = false;
                    break;
                }
            }
    
            if (flag) {
                this.cardType = {
                    type: 4,
                    minValue: this.cardsArray[this.cardsArray.length - 1]
                };
            }
        }
        return flag;
    }

    
    protected static isFour() {
        var flag = false;
        this.cardType = null;
        if (this.getRealLength() != 4)
            return flag;
        if (this.laiZiCardNum != 0)
        {
            flag = true;
            if (this.laiZiCardNum == 4)
            {
                 //纯癞子特殊处理
                 this.cardType = {
                    type: 15,
                    minValue: 14
                };
                // this.cardType = {
                //     type: 15,
                //     minValue: this.laiZiCardValue
                // };
            }
            else
            {
                var standValue = 0
                for (var value of this.cardsArray)
                {
                    if (standValue != 0 && value != standValue){
                        flag = false;
                    }
                    else
                        standValue = value
                }
                if (flag)
                {
                    var replaceList = []
                    for (var i = 0; i < this.laiZiCardNum; i++)
                        replaceList.push(this.cardsArray[0])
    
                    this.cardType = {
                        type: 15,
                        minValue: this.cardsArray[0],
                        replace:replaceList
                    };
                }
            }
        }
        else if (this.getRealLength() == 4 && this.cardsArray[0] == this.cardsArray[1] && this.cardsArray[0] == this.cardsArray[2] && this.cardsArray[0] == this.cardsArray[3]) {
            this.cardType = {
                type: 15,
                minValue: this.cardsArray[0]
            };
            flag = true;
        }
        return flag;
    
    }
    
    //检测三张
    protected static isThrees() {
        var flag = false;
        this.cardType = null;
        if (this.getRealLength() != 3)
            return flag;
        
        if (this.laiZiCardNum != 0)
        {
            flag = true;
            if (this.laiZiCardNum == 3)
            {
                //纯癞子特殊处理
                this.cardType = {
                    type: 5,
                    minValue: 14
                };
                // this.cardType = {
                //     type: 5,
                //     minValue: this.laiZiCardValue
                // };
            }
            else
            {
                var standValue = 0
                for (var value of this.cardsArray)
                {
                    if (standValue != 0 && value != standValue){
                        flag = false;
                    }
                    else
                        standValue = value
                }
                if (flag)
                {
                    var replaceList = []
                    for (var i = 0; i < this.laiZiCardNum; i++)
                        replaceList.push(this.cardsArray[0])
    
                    this.cardType = {
                        type: 5,
                        minValue: this.cardsArray[0],
                        replace:replaceList
                    };
                }
            }
        }
        else if (this.getRealLength() == 3 && this.cardsArray[0] == this.cardsArray[1] && this.cardsArray[0] == this.cardsArray[2]) {
            this.cardType = {
                type: 5,
                minValue: this.cardsArray[0]
            };
            flag = true;
        }
        return flag;
    }


    protected static isBoom() {
        var flag = false;
        this.cardType = null;
        var rule = GameDataManager.getInstance().getDataByCurGameType().gameinfo.rule;
        var bomb_3 = false;
        var bomb_4 = false;
        if(rule.play.bomb_type_option == 0)
        {
            bomb_3 = true;
            bomb_4 = true;
        }
        else if (rule.play.bomb_type_option == 1)
            bomb_4 = true;
        if (bomb_4 && this.getRealLength() == 4) {
            if (this.laiZiCardNum != 0)
            {
                flag = true;
                if (this.laiZiCardNum == 4)
                {
                    this.cardType = {
                        type: 13,
                        minValue: this.laiZiCardValue
                    };
                }
                else
                {
                    var standValue = 0
                    for (var value of this.cardsArray)
                    {
                        if (standValue != 0 && value != standValue){
                            flag = false;
                        }
                        else
                            standValue = value
                    }
                    if (flag)
                    {
                        var replaceList = []
                        for (var i = 0; i < this.laiZiCardNum; i++)
                            replaceList.push(this.cardsArray[0])
        
                        this.cardType = {
                            type: 13,
                            minValue: this.cardsArray[0],
                            replace:replaceList
                        };
                    }
                }
            }
            else if (this.cardsArray[0] == this.cardsArray[1] && this.cardsArray[0] == this.cardsArray[2] && this.cardsArray[0] == this.cardsArray[3]) {
                this.cardType = {
                    type: 13,
                    minValue: this.cardsArray[0]
                };
                flag = true;
                return flag;
            }
        }
        else if (bomb_3 && this.getRealLength() == 3)
        {
            if (this.laiZiCardNum != 0)
            {
                flag = true;
                if (this.laiZiCardNum == 3)
                {
                    this.cardType = {
                        type: 13,
                        minValue: this.laiZiCardValue
                    };
                }
                else
                {
                    var standValue = 0
                    for (var value of this.cardsArray)
                    {
                        if (standValue != 0 && value != standValue){
                            flag = false;
                        }
                        else
                            standValue = value
                    }
                    if (flag)
                    {
                        var replaceList = []
                        for (var i = 0; i < this.laiZiCardNum; i++)
                            replaceList.push(this.cardsArray[0])
        
                        this.cardType = {
                            type: 13,
                            minValue: this.cardsArray[0],
                            replace:replaceList
                        };
                    }
                }
            }
            else if (this.cardsArray[0] == this.cardsArray[1] && this.cardsArray[0] == this.cardsArray[2]) {
                this.cardType = {
                    type: 13,
                    minValue: this.cardsArray[0]
                };
                flag = true;
                return flag;
            }
        }
        return flag;
    }
    
    public static getMultiCardsSelect(cards, laiZiValue,extraData){
        //目前只有3张，4张，才有多选
        if (cards.length != 3 && cards.length != 4)
            return []
        var outLaiZiList = Utils.getOutLaiZiList(cards, laiZiValue)
        this.cardsArray = outLaiZiList
        this.cardsArray = this.getSortedOutCards(this.cardsArray)
        this.laiZiCardValue = laiZiValue
        this.laiZiCardNum = 0
        var result = []
        if (extraData.laizi.length > 0)
        {
            this.laiZiCardValue = Utils.getPdkCardValue(extraData.laizi[0])
            this.laiZiCardNum = extraData.laizi.length
        }
        if (this.laiZiCardNum < 2) // 小于2个癞子不构成多选条件
            return []
        for (var i = 0; i < this.cardsArray.length; ++i)
            this.cardsArray[i] = Utils.getPdkCardValue(this.cardsArray[i]);
        if(this.isBoom()) // 能构成炸弹，没有多选
        {
            return []
        }
        if (cards.length == 3) //3张牌可能是顺子或者三张
        {
            var straightList = []
            if (this.isSingleContinue()) 
            {
                let replaceList = this.cardType.replace
                for (var cardId of cards)
                {
                    if (Utils.getPdkCardValue(cardId) == this.laiZiCardValue && replaceList != null && replaceList.length > 0)
                        straightList.push(replaceList.pop()+80) // 发癞子的特殊花色
                    else
                        straightList.push(cardId)
                }
            }
            var threeList = []
            if (this.isThrees())
            {
                let replaceList = this.cardType.replace
                for (var cardId of cards)
                {
                    if (Utils.getPdkCardValue(cardId) == this.laiZiCardValue && replaceList != null &&replaceList.length > 0)
                        threeList.push(replaceList.pop()+80) // 发癞子的特殊花色
                    else
                        threeList.push(cardId)
                }
            }
            if (straightList.length != 0 && threeList.length != 0)
            {
                return [threeList, straightList]
            }

        }
        if (cards.length == 4) //4张牌可能是姊妹对，四张，顺子
        {
            var straightList = []
            if (this.isSingleContinue()) 
            {
                let replaceList = this.cardType.replace
                for (var cardId of cards)
                {
                    if (Utils.getPdkCardValue(cardId) == this.laiZiCardValue && replaceList != null && replaceList.length > 0)
                        straightList.push(replaceList.pop()+80) // 发癞子的特殊花色
                    else
                        straightList.push(cardId)
                }
            }
            var forList = []
            if (this.isFour())
            {
                let replaceList = this.cardType.replace
                for (var cardId of cards)
                {
                    if (Utils.getPdkCardValue(cardId) == this.laiZiCardValue && replaceList != null && replaceList.length > 0)
                        forList.push(replaceList.pop()+80) // 发癞子的特殊花色
                    else
                        forList.push(cardId)
                }
            }
            var doubleStraightList = []
            if (this.isTwoContinue()) 
            {
                let replaceList = this.cardType.replace
                for (var cardId of cards)
                {
                    if (Utils.getPdkCardValue(cardId) == this.laiZiCardValue && replaceList != null && replaceList.length > 0)
                        doubleStraightList.push(replaceList.pop()+80) // 发癞子的特殊花色
                    else
                        doubleStraightList.push(cardId)
                }
            }
            if (forList.length != 0)
                result.push(forList)
            if (straightList.length != 0)
                result.push(straightList)
            if (doubleStraightList.length != 0)
                result.push(doubleStraightList)
            if (result.length > 1)
                return result

        }
        return []

        
    }

     public static autoGetPlayCard(tUpCards, tHansCards, gameType, laiZiValue = 0) {
        if (tUpCards.length == 0)
            this.clearAutoCardData()
        this.hansUPCards = tUpCards;
        var tResult = []
        var resultLength = 0
        var groupLength = this.getGroup(tUpCards, 1).length
        var laiZiLength = this.getLaiZiList(tUpCards).length
        if (laiZiLength != 0) // 如果抬起来的牌有癞子，暂时不进行提牌操作
            return tUpCards
        if (groupLength > 0 || laiZiLength > 1) // 玩家选中的牌中存在对子
        {
            var doubleStraightList = this.getDoubleStraight(gameType);
            if (doubleStraightList.length > 0)
            {
                var tagetList = this.getMaxLenthCardsList(doubleStraightList)
                if (tagetList.length > 0 && resultLength < tagetList.length)
                {
                    resultLength = tagetList.length
                    tResult = tagetList
                }
            }
        }
        if (true) {
            var straightList = this.getStraight();
            if (straightList.length > 0)
            {
                var tagetList = this.getMaxLenthCardsList(straightList)
                if (tagetList.length > 0 && resultLength < tagetList.length)
                {
                    resultLength = tagetList.length
                    tResult = tagetList
                }
            }
        }

        if (tResult.length > 0)
            return tResult;
        else
            return tUpCards;
    }

    public static getLaiZiList(cards)
    {
        var result = []
        for (var cardId of cards)
        {
            if (Math.floor(cardId/20) == 4)
                result.push(cardId)
        }
        return result
    }

    public static getMaxLenthCardsList(targetList)
    {
        var maxLength = 0
        var result = []
        for (var tempList of targetList)
        {
            if (maxLength < tempList.length)
            {
                result = tempList
                maxLength = tempList.length
            }
        }
        return result
    }

    // 得到手牌中所有顺子
    protected static getStraight() {
        var tResult = []
        var tStraight = []
        var iTempCard = 0
        var tCardNumArry = this.getHashArry(this.hansUPCards)
        for (let iCard = tCardNumArry.length - 1; iCard >= 0; iCard--) {
            if (iCard > 14 || iCard < 3 || tCardNumArry[iCard].length == 0) {
                if (tStraight.length >= 3) {
                    tResult.push(tStraight)
                    tStraight = []
                }
                continue
            }
            if (tStraight.length == 0 || iTempCard - iCard != 1) {
                tStraight = []
                iTempCard = iCard
                tStraight.push(tCardNumArry[iCard][0])
            }
            else if (iTempCard - iCard == 1) {
                iTempCard = iCard
                tStraight.push(tCardNumArry[iCard][0])
            }
        }
        if (tResult.length == 0)
            return tResult
        for (let iIndex in tResult) {
            if (tResult[iIndex].length <= 3)
                continue;

            for (let iLength = 3; iLength < tResult[iIndex].length; iLength++)
                for (let iNum = 0; iNum <= tResult[iIndex].length - iLength; iNum++) {
                    var tStraight2 = []
                    for (let iStartIndex = iNum; iStartIndex < iNum + iLength; iStartIndex++)
                        tStraight2.push(tResult[iIndex][iStartIndex]);
                    tResult.push(tStraight2)
                }
        }
        return tResult
    }

    // 传入一个牌的arry并转换成hash数组
    protected static getHashArry(tCard) {
        var tHashArry = [];
        for (let iCard = 0; iCard <= 17; iCard++) {
            tHashArry[iCard] = [];
        }
        for (let iIndex = 0; iIndex < tCard.length; iIndex++) {
            var hashIndex = Utils.getPdkCardValue(tCard[iIndex])
            if (hashIndex == 53 || hashIndex == 54){}
            else
                tHashArry[hashIndex].push(tCard[iIndex]);
        }
        return tHashArry;
    }

    // 得到手牌中所有对子
    protected static getGroup(tCard, target) // 1是对子，2是三个的
    {
        var tTemp = [[], [], [], []]
        var tType = []
        for (let iIndex = 0; iIndex < tCard.length; iIndex++) {
            if (tType.length != 0 && Utils.getPdkCardValue(tType[0]) != Utils.getPdkCardValue(tCard[iIndex])) {
                tTemp[tType.length - 1].push(tType);
                tType = [];
            }
            tType.push(tCard[iIndex])
            if (iIndex + 1 == tCard.length)
                tTemp[tType.length - 1].push(tType);
        }
        if (tTemp[target].length == 0)
            return []
        return tTemp[target]
    }

    // 得到手牌中所有连对
    protected static getDoubleStraight(gameType) {
        var tResult = []
        var tStraight = []
        var iTempCard = 0
        var tCardNumArry = this.getHashArry(this.hansUPCards)
        var minLianDui = 3
        var rule = GameDataManager.getInstance().getDataByCurGameType().gameinfo.rule;
        if (rule.play.zi_mei_dui) // 姊妹对支持2连队
            minLianDui = 2
        for (let iCard = tCardNumArry.length - 1; iCard >= 0; iCard--) {
            if (iCard > 14 || iCard < 3 || tCardNumArry[iCard].length < 2) {
                if (tStraight.length / 2 >= minLianDui) {
                    tResult.push(tStraight)
                    tStraight = []
                }
                continue
            }
            if (tStraight.length == 0 || iTempCard - iCard != 1) {
                tStraight = []
                iTempCard = iCard
                tStraight.push(tCardNumArry[iCard][0])
                tStraight.push(tCardNumArry[iCard][1])
            }
            else if (iTempCard - iCard == 1 && tCardNumArry[iCard].length >= 2 && tCardNumArry[iCard].length <= 3) {
                iTempCard = iCard
                tStraight.push(tCardNumArry[iCard][0])
                tStraight.push(tCardNumArry[iCard][1])
            }
        }
        if (tResult.length == 0)
            return tResult
        for (let iIndex in tResult) {
            if (tResult[iIndex].length / 3 <= 3)
                continue;

            for (let iLength = 3; iLength < tResult[iIndex].length / 2; iLength++)
                for (let iNum = 0; iNum <= tResult[iIndex].length / 2 - iLength; iNum++) {
                    var tStraight2 = []
                    for (let iStartIndex = iNum; iStartIndex < (iNum + iLength) * 2; iStartIndex++)
                        tStraight2.push(tResult[iIndex][iStartIndex]);
                    tResult.push(tStraight2)
                }
        }
        return tResult
    }

    // 用于比较炸弹大小参数《炸弹1，炸弹2，炸弹1最大牌，炸弹2最大牌》
    public static compareBomb(bomb1, bomb2, value1, value2)
    {
        var type1 = this.getBombType(bomb1)
        var type2 = this.getBombType(bomb2)
        if (bomb1.length != bomb2.length)
            return bomb1.length > bomb2.length
        else
        {
            if (type1 != type2)
                return type1 > type2
            else
                return value1 > value2
        }
        
    }

    public static getBombType(cards)
    {
        var count = 0
        for (var cardId of cards)
        {
            if (Math.floor(cardId/20) == 4) // 颜色4是癞子炸弹颜色
                count += 1
        }
        if (count == cards.length)
            return 3
        else if(count == 0)
            return 2
        else
            return 1
    }

}