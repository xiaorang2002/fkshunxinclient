import { GameDataManager } from './../../../framework/Manager/GameDataManager';
import { Utils } from './../../../framework/Utils/Utils';
import { SCPDKCheckCardType } from './SCPDKCheckCardType';
import { PDKCheckCanBet } from './../game_pdk/PDKCheckCanBet';

export class SCPDKCheckCanBet extends PDKCheckCanBet{
    
    protected static laiZiCardValue = 0             // 癞子牌的值
    protected static laiZiCardNum = 0               // 癞子牌的数量
    protected static cardsHashArry = []
    protected static outCardsList = []

    //牌型 1:单张 2:对子 3:顺子 4:连对 5:三张
    // 获取能够打上家的所有牌
    public static checkCanBet(cards, outCards, extraData = null) {
        //牌型数值排序
        var tempCards = JSON.parse(JSON.stringify(cards))
        tempCards = tempCards.sort(function (a, b) { return Utils.getPdkCardValue(a) - Utils.getPdkCardValue(b) })
        this.cardsArray = this.getCardsArray(tempCards);
        this.cardsHashArry = this.getHashArry(tempCards)
        this.outCardsList = JSON.parse(JSON.stringify(outCards))
        var outNum = outCards.length
        var oType = SCPDKCheckCardType.checkCardsType(outCards)
        this.laiZiCardValue = 0
        this.laiZiCardNum = 0
        if (extraData)
            this.laiZiCardValue = extraData.laiZiValue
        if (this.cardsHashArry[this.laiZiCardValue])
            this.laiZiCardNum = this.cardsHashArry[this.laiZiCardValue].length
        if (oType.type != 13 && cards.length < outCards.length) // 如果对方的牌不是炸弹，并且自己的牌还没有别人多不用检测，肯定要不起
        {
            this.outCardsArray = []
            this.addCanBoom();
            return this.outCardsArray
        }
        if (oType.type == 1) //单张
            return this.getSigles(oType.minValue);
        else if (oType.type == 2) //对子
            return this.getDoubles(oType.minValue);
        else if (oType.type == 3) //顺子
            return this.getSingleContinue(oType.minValue, outNum, cards.length >= outNum);
        else if (oType.type == 4) //连对
            return this.getTwoContinue(oType.minValue, outNum, cards.length >= outNum);
        else if (oType.type == 5)//三不带
            return this.getThrees(oType.minValue);
        else if (oType.type == 15)//四张
            return this.getFour(oType.minValue);
        else if (oType.type == 13)//炸弹
            return this.getBoomBySCPDK(oType.minValue, outNum, outCards);

        return [];
    }
    

      //得到对子
      public static getDoubles(minValue) {
        this.outCardsArray = [];

        //纯癞子特殊处理（对子最大）
        var isPureLaiZi = true;
        for (var cardId of this.outCardsList)
        {
            if (Math.floor(cardId/20) != 4)
                isPureLaiZi = false;
        }
        if (isPureLaiZi)
        {
            this.addCanBoom();
            return this.outCardsArray;
        }

        //获取对子中能打的牌
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 2 && this.cardsArray[i][0] > minValue)
                this.outCardsArray.push(this.cardsArray[i]);
        }

       if(this.laiZiCardNum != 0)
       {
           //获取单牌+癞子
            for (var i = 0; i < this.cardsArray.length; ++i) {
                if (this.cardsArray[i].length == 1 && this.cardsArray[i][0] > minValue && this.laiZiCardValue != this.cardsArray[i][0])
                    this.outCardsArray.push([this.cardsArray[i][0], this.laiZiCardValue]);
            }
       }

        //获取三张中能打的牌
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 3 && this.cardsArray[i][0] > minValue)
                this.outCardsArray.push([this.cardsArray[i][0], this.cardsArray[i][1]]);
        }

        //获取四张中能打的牌
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 4 && this.cardsArray[i][0] > minValue) {
                this.outCardsArray.push([this.cardsArray[i][0], this.cardsArray[i][1]]);
                this.outCardsArray.push([this.cardsArray[i][2], this.cardsArray[i][3]]);
            }
        }
        this.addCanBoom();
        return this.outCardsArray;
    }

     //得到单张
     public static getSigles(minValue) {
        this.outCardsArray = [];

        // 纯癞子特殊处理
        if(minValue == this.laiZiCardValue)
        {
            this.addCanBoom();
            return this.outCardsArray;
        }

        //获取单张中能打的牌
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 1 && this.cardsArray[i][0] > minValue)
                this.outCardsArray.push(this.cardsArray[i]);
        }

        //获取对子中能打的牌
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 2 && this.cardsArray[i][0] > minValue)
                this.outCardsArray.push([this.cardsArray[i][0]]);
        }

        //获取三张中能打的牌
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 3 && this.cardsArray[i][0] > minValue)
                this.outCardsArray.push([this.cardsArray[i][0]]);
        }

        //获取四张中能打的牌
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 4 && this.cardsArray[i][0] > minValue)
                this.outCardsArray.push([this.cardsArray[i][0]]);
        }
        this.addCanBoom();
        return this.outCardsArray;
    }

    //得到单顺子
    public static getSingleContinue(minValue, outNum, isNumCanBet) {
        this.outCardsArray = [];
        if (!isNumCanBet || minValue+outNum-1 >= 14) // 牌的数量不够 或者已经封顶的顺子
        {
            this.addCanBoom();
            return this.outCardsArray;
        }
        var endValue = 14+1-outNum // 最大的起始顺子牌
        for(var startValue = (minValue+1); startValue <= endValue; startValue++)
        {
            var standStraight = []
            for (var i = 0; i <outNum; i++)
                standStraight.push(startValue+i)
            var needReplaceList = this.getNeedLaiZi(standStraight)
            if (needReplaceList.length == outNum) // 纯癞子不能组合顺子
                continue
            if (needReplaceList.length <= this.laiZiCardNum)
            {
                for (var replaceCard of needReplaceList)
                {
                    if (replaceCard == this.laiZiCardValue)
                        continue
                    var index = standStraight.indexOf(replaceCard)
                    if (index >= 0)
                        standStraight[index] = this.laiZiCardValue
                }
                this.outCardsArray.push(standStraight)
            }
        }
        this.addCanBoom();
        return this.outCardsArray;
    }

    //得到双顺子
    public static getTwoContinue(minValue, outNum, isNumCanBet) {
        this.outCardsArray = [];
        if (!isNumCanBet || minValue+outNum/2-1 >= 14) // 牌的数量不够 或者已经封顶的双顺子
        {
            this.addCanBoom();
            return this.outCardsArray;
        }
        var endValue = 14+1-outNum/2 
        for(var startValue = (minValue+1); startValue <= endValue; startValue++)
        {
            var standDoubleStraight = []
            for (var i = 0; i <outNum/2; i++){
                standDoubleStraight.push(startValue+i)
                standDoubleStraight.push(startValue+i)
            }
            var needReplaceList = this.getNeedLaiZiOfDouble(standDoubleStraight)
            if (needReplaceList.length == outNum) // 纯癞子不能组合顺子
                continue
            if (needReplaceList.length <= this.laiZiCardNum)
            {
                for (var replaceCard of needReplaceList)
                {
                    if (replaceCard == this.laiZiCardValue)
                        continue
                    var index = standDoubleStraight.indexOf(replaceCard)
                    if (index >= 0)
                        standDoubleStraight[index] = this.laiZiCardValue
                }
                this.outCardsArray.push(standDoubleStraight)
            }
        }
        this.addCanBoom();
        return this.outCardsArray;
    }

    public static getNeedLaiZi(targetList) // 得到指定牌列表中所需的癞子
    {
        var replaceList = []
        for(var card of targetList)
        {
            if (this.cardsHashArry[card].length > 0 && card != this.laiZiCardValue){}
            else
                replaceList.push(card)
        }
        return replaceList
    }
    
    public static getNeedLaiZiOfDouble(targetList)
    {
        var replaceList = []
        for(var index = 0; index < targetList.length/2; index++)
        {
            var card = targetList[index*2]
            if (this.cardsHashArry[card].length >= 2 && card != this.laiZiCardValue){}
            else if (this.cardsHashArry[card].length == 1 && card != this.laiZiCardValue)
            {
                replaceList.push(card)
            }
            else
            {
                replaceList.push(card)
                replaceList.push(card)
            }
        }
        return replaceList
    }

    //得到三张
    public static getThrees(minValue) {
        this.outCardsArray = [];

        //纯癞子特殊处理（三张最大）
        var isPureLaiZi = true;
        for (var cardId of this.outCardsList)
        {
            if (Math.floor(cardId/20) != 4)
                isPureLaiZi = false;
        }
        if (isPureLaiZi)
        {
            this.addCanBoom();
            return this.outCardsArray;
        }

        //获取三张中能打的牌
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 3 && this.cardsArray[i][0] > minValue)
                this.outCardsArray.push(this.cardsArray[i]);
        }

        if(this.laiZiCardNum != 0)
        {
            // 超过1张癞子
            if(this.laiZiCardNum > 0)
            {
                for (var i = 0; i < this.cardsArray.length; ++i) {
                    if (this.cardsArray[i].length == 2 && this.cardsArray[i][0] > minValue && this.laiZiCardValue != this.cardsArray[i][0])
                        this.outCardsArray.push([this.cardsArray[i][0], this.cardsArray[i][1], this.laiZiCardValue]);
                }
            }
            // 超过两张癞子
            if(this.laiZiCardNum > 1)
            {
                for (var i = 0; i < this.cardsArray.length; ++i) {
                    if (this.cardsArray[i].length == 1 && this.cardsArray[i][0] > minValue && this.laiZiCardValue != this.cardsArray[i][0])
                        this.outCardsArray.push([this.cardsArray[i][0], this.laiZiCardValue, this.laiZiCardValue]);
                }
            }
             
        }

        //获取四张中能打的牌
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 4 && this.cardsArray[i][0] > minValue)
                this.outCardsArray.push([this.cardsArray[i][0], this.cardsArray[i][1], this.cardsArray[i][2]]);
        }
        this.addCanBoom();
        return this.outCardsArray;
    }


     public static getFour(minValue){
        //纯癞子特殊处理（四张最大）
        var isPureLaiZi = true;
        for (var cardId of this.outCardsList)
        {
            if (Math.floor(cardId/20) != 4)
                isPureLaiZi = false;
        }
        if (isPureLaiZi)
        {
            this.addCanBoom();
            return this.outCardsArray;
        }

        //获取四张中能打的牌
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 4 && this.cardsArray[i][0] > minValue)
                this.outCardsArray.push(this.cardsArray[i]);
        }
        if(this.laiZiCardNum != 0)
        {
            // 超过1张癞子
            if(this.laiZiCardNum > 0)
            {
                for (var i = 0; i < this.cardsArray.length; ++i) {
                    if (this.cardsArray[i].length == 3 && this.cardsArray[i][0] > minValue)
                        this.outCardsArray.push([this.cardsArray[i][0], this.cardsArray[i][1], this.cardsArray[i][2], this.laiZiCardValue]);
                }
            }
            // 超过两张癞子
            if(this.laiZiCardNum > 1)
            {
                for (var i = 0; i < this.cardsArray.length; ++i) {
                    if (this.cardsArray[i].length == 2 && this.cardsArray[i][0] > minValue)
                        this.outCardsArray.push([this.cardsArray[i][0],this.cardsArray[i][1],, this.laiZiCardValue, this.laiZiCardValue]);
                }
            }
             // 超过三张癞子
             if(this.laiZiCardNum > 2)
             {
                 for (var i = 0; i < this.cardsArray.length; ++i) {
                     if (this.cardsArray[i].length == 1 && this.cardsArray[i][0] > minValue)
                         this.outCardsArray.push([this.cardsArray[i][0], this.laiZiCardValue, this.laiZiCardValue, this.laiZiCardValue]);
                 }
             }
        }
        this.addCanBoom();
        return this.outCardsArray;
    }

    //得到炸弹
    public static getBoomBySCPDK(minValue, outNum, outcards) {
        this.outCardsArray = [];
        this.addCanBoom();
        var arrTempBoom = this.outCardsArray.slice();
        this.outCardsArray = [];
        var outBombType = this.checkBombTypeOfOutCards(outcards)
        for (var i = 0; i < arrTempBoom.length; ++i) {
            if (arrTempBoom[i].length > outNum) {  // 牌数多的炸弹大于牌数小的
                this.outCardsArray.push(arrTempBoom[i]);
            }
            else if (arrTempBoom[i].length == outNum) // 牌数量相等的炸弹需要看类型
            {
                var myType = this.checkBombType(arrTempBoom[i])
                if (myType > outBombType) // 纯癞子 > 硬炸弹 > 软炸弹
                    this.outCardsArray.push(arrTempBoom[i]);
                else if (myType == outBombType && arrTempBoom[i][0] > minValue) // 同种类型比较炸弹牌面大小
                    this.outCardsArray.push(arrTempBoom[i]);
            }
        }
        return this.outCardsArray;
    }

    // 软炸弹type 1 硬炸弹type 2 纯癞子炸弹 type 3
    public static checkBombType(cards)
    {
        var count = 0
        for (var cardValue of cards)
        {
            if (cardValue == this.laiZiCardValue)
                count += 1
        }
        if (count == cards.length)
            return 3
        else if(count == 0)
            return 2
        else
            return 1
    }

    public static checkBombTypeOfOutCards(cards)
    {
        var count = 0
        for (var cardId of cards)
        {
            if (Math.floor(cardId/20) == 4) // 颜色4是癞子炸弹颜色
                count += 1
        }
        if (count == cards.length) // 纯癞子炸弹
            return 3
        else if(count == 0) // 没有癞子，硬炸弹
            return 2
        else // 有癞子，但不是纯癞子，软炸弹
            return 1
    }

    // 检测有没有炸弹
    public static checkHaveBoom(cards){
        var tempCards = JSON.parse(JSON.stringify(cards))
        tempCards = tempCards.sort(function (a, b) { return Utils.getPdkCardValue(a) - Utils.getPdkCardValue(b) })
        this.cardsArray = this.getCardsArray(tempCards);
        this.outCardsArray = []
        this.addCanBoom()
        var boomList = this.outCardsArray;
        this.outCardsArray = []
        return boomList.length > 0
    }

    //加入炸弹
    public static addCanBoom() {
        if (!GameDataManager.getInstance().getDataByCurGameType())
            return;
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
        if (bomb_4)
        {
            for (var i = 0; i < this.cardsArray.length; ++i) {
                if (this.cardsArray[i].length == 4)
                    this.outCardsArray.push(this.cardsArray[i]);
            }
            if(this.laiZiCardNum != 0)
            {
                if(this.laiZiCardNum > 0)
                {
                    for (var i = 0; i < this.cardsArray.length; ++i) {
                        if (this.cardsArray[i].length == 3 && this.laiZiCardValue != this.cardsArray[i][0])
                            this.outCardsArray.push([this.cardsArray[i][0], this.cardsArray[i][1], this.cardsArray[i][2], this.laiZiCardValue]);
                    }
                }
                if(this.laiZiCardNum > 1)
                {
                    for (var i = 0; i < this.cardsArray.length; ++i) {
                        if (this.cardsArray[i].length == 2 && this.laiZiCardValue != this.cardsArray[i][0])
                            this.outCardsArray.push([this.cardsArray[i][0],this.cardsArray[i][1], this.laiZiCardValue, this.laiZiCardValue]);
                    }
                }
                if(this.laiZiCardNum > 2)
                {
                    for (var i = 0; i < this.cardsArray.length; ++i) {
                        if (this.cardsArray[i].length == 1 && this.laiZiCardValue != this.cardsArray[i][0])
                            this.outCardsArray.push([this.cardsArray[i][0], this.laiZiCardValue, this.laiZiCardValue, this.laiZiCardValue]);
                    }
                }
                if (this.laiZiCardNum == 4)
                {
                    this.outCardsArray.push(this.laiZiCardValue,this.laiZiCardValue,this.laiZiCardValue,this.laiZiCardValue)
                }
            }
        }
       if (bomb_3)
       {
            for (var i = 0; i < this.cardsArray.length; ++i) {
                if (this.cardsArray[i].length == 3)
                    this.outCardsArray.push(this.cardsArray[i]);
            }
            if(this.laiZiCardNum != 0)
            {
                if(this.laiZiCardNum > 0)
                {
                    for (var i = 0; i < this.cardsArray.length; ++i) {
                        if (this.cardsArray[i].length == 2 && this.laiZiCardValue != this.cardsArray[i][0])
                            this.outCardsArray.push([this.cardsArray[i][0], this.cardsArray[i][1], this.laiZiCardValue]);
                    }
                }
                if(this.laiZiCardNum > 1)
                {
                    for (var i = 0; i < this.cardsArray.length; ++i) {
                        if (this.cardsArray[i].length == 1 && this.laiZiCardValue != this.cardsArray[i][0])
                            this.outCardsArray.push([this.cardsArray[i][0], this.laiZiCardValue, this.laiZiCardValue]);
                    }
                }
                if (this.laiZiCardNum >= 3)
                {
                    this.outCardsArray.push(this.laiZiCardValue,this.laiZiCardValue,this.laiZiCardValue)
                }
            }
            for (var i = 0; i < this.cardsArray.length; ++i) {
                if (this.cardsArray[i].length == 4 && this.laiZiCardValue != this.cardsArray[i][0])
                    this.outCardsArray.push([this.cardsArray[i][0], this.cardsArray[i][1], this.cardsArray[i][2]]);
            }
       }
    }

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
    

}