import { GAME_TYPE } from './../GameConstValue';
import { Utils } from "../../../framework/Utils/Utils";
import { GameDataManager } from "../../../framework/Manager/GameDataManager";

export class PDKCheckCardType {


    protected static cardsArray = [];               //逻辑形式手牌
    protected static cardType = null;               //牌型数据包
    protected static handsCardsArray = [];          //当前的手上的牌
    protected static hansUPCards = [];              //抬起来的牌
    protected static lastAutoTips = [];             //上次提牌的牌

    //检测牌型
    //牌型 1:单张 2:对子 3:顺子 4:连对 5:三不带 6:三带一 7:三带二 8:四带二 9:四带三 10:飞机 11:飞机带单 12飞机带对 13:炸弹 15:混合飞机
    public static checkCardsType(cards, extraData = null) {
        this.cardsArray = JSON.parse(JSON.stringify(cards)) 
        this.cardsArray = this.getSortedOutCards(this.cardsArray)
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
        else if (this.isThreeAndOne())//检测三带一
            return this.cardType;
        else if (this.isThreeAndTwo())//检测三带二
            return this.cardType;
        else if (this.isFourAndTwo())//四带二
            return this.cardType;
        else if (this.isFourAndDoubles())//四带一对
            return this.cardType;
        else if (this.isFourAndThree()) // 四带三
            return this.cardType
        else if (this.isThreeContinue())//飞机
            return this.cardType;
        // else if (this.isFlyAndOne())//飞机带单翅膀
        //     return this.cardType;
        else if (this.isFlyAndTwo())//飞机带2张牌
            return this.cardType;
        else if (this.isMixFly())
            return this.cardType;
        return null;
    }

    //检测单张
    protected static isSigles() {
        var flag = false;
        this.cardType = null;
        if (this.cardsArray.length != 1)
            return flag;

        this.cardType = {
            type: 1,
            minValue: this.cardsArray[0]
        };
        flag = true;
        return flag;
    }

    //检测对子
    protected static isDoubles() {
        var flag = false;
        this.cardType = null;
        if (this.cardsArray.length != 2)
            return flag;

        if (this.cardsArray[0] == this.cardsArray[1]) {
            this.cardType = {
                type: 2,
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
        /*if (GameDataManager.getInstance().ddzData.gameinfo.rule.) {
            return flag;
        }*/
        if (this.cardsArray.length != 3)
            return flag;

        if (this.cardsArray.length == 3 && this.cardsArray[0] == this.cardsArray[1] && this.cardsArray[0] == this.cardsArray[2]) {
            this.cardType = {
                type: 5,
                minValue: this.cardsArray[0]
            };
            flag = true;
        }

        return flag;
    }
    //检测三带一
    protected static isThreeAndOne() {
        var flag = false;
        this.cardType = null;
        if (this.cardsArray.length != 4)
            return flag;

        if (this.cardsArray[0] == this.cardsArray[1] && this.cardsArray[0] == this.cardsArray[2]) {
            this.cardType = {
                type: 6,
                minValue: this.cardsArray[0]
            };
            flag = true;
        }
        else if (this.cardsArray[1] == this.cardsArray[2] && this.cardsArray[1] == this.cardsArray[3]) {
            this.cardType = {
                type: 6,
                minValue: this.cardsArray[3]
            };
            flag = true;
        }

        return flag;
    }

    //得到三带对
    protected static isThreeAndTwo() {
        var flag = false;
        this.cardType = null;
        if (this.cardsArray.length != 5)
            return flag;
        if (this.cardsArray[0] == this.cardsArray[1]&&this.cardsArray[0] == this.cardsArray[2]&&this.cardsArray[0] == this.cardsArray[3])
            return flag;
        if (this.cardsArray[0] == this.cardsArray[1] &&
            this.cardsArray[0] == this.cardsArray[2]) {
            this.cardType = {
                type: 7,
                minValue: this.cardsArray[0]
            };
            flag = true;
        }
        else if (this.cardsArray[2] == this.cardsArray[3] &&
            this.cardsArray[2] == this.cardsArray[4]) {
            this.cardType = {
                type: 7,
                minValue: this.cardsArray[2]
            };
            flag = true;
        }

        return flag;
    }

    //检测单顺子
    protected static isSingleContinue() {
        var flag = true;
        this.cardType = null;
        if (this.cardsArray.length < 5 || this.cardsArray.length > 12)
            return !flag;

        for (var i = 0; i < this.cardsArray.length; ++i) {
            //不能有2大小王
            if (this.cardsArray[i] == 15 || this.cardsArray[i] == 16 || this.cardsArray[i] == 17) {
                flag = false;
                break;
            }

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

    //检测双顺子
    protected static isTwoContinue() {
        var flag = true;
        this.cardType = null;
        var lDLimit = 6
        var gameType = GameDataManager.getInstance().curGameType
        if (gameType == GAME_TYPE.LRPDK || gameType == GAME_TYPE.PDK) // 跑得快支持2连队
            lDLimit = 4
        if (this.cardsArray.length < lDLimit || this.cardsArray.length % 2 != 0)
            return !flag;

        for (var i = 0; i < this.cardsArray.length; i = i + 2) {
            //不能有2大小王
            if (this.cardsArray[i] == 15 || this.cardsArray[i] == 16 || this.cardsArray[i] == 17) {
                flag = false;
                break;
            }

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

        return flag;
    }
    //飞机不带翅膀
    protected static isThreeContinue() {
        var flag = true;
        this.cardType = null;
        if (this.cardsArray.length < 6 || this.cardsArray.length % 3 != 0)
            return !flag;

        for (var i = 0; i < this.cardsArray.length; i = i + 3) {
            //不能有2大小王
            if (this.cardsArray[i] == 15 || this.cardsArray[i] == 16 || this.cardsArray[i] == 17) {
                flag = false;
                break;
            }

            //两张是否相等
            if (this.cardsArray[i] != this.cardsArray[i + 1] || this.cardsArray[i] != this.cardsArray[i + 2]) {
                flag = false;
                break;
            }

            //连续性检测
            if (i < this.cardsArray.length - 3 && this.cardsArray[i] - this.cardsArray[i + 3] != 1) {
                flag = false;
                break;
            }
        }

        if (flag) {
            this.cardType = {
                type: 10,
                minValue: this.cardsArray[0]
            };
        }

        return flag;
    }

    //飞机带单翅膀
    protected static isFlyAndOne() {
        var flag = false;
        this.cardType = null;
        if (this.cardsArray.length < 8 || this.cardsArray.length % 4 != 0)
            return flag;

        //找到飞机主体
        var flynum = this.cardsArray.length / 4;
        var temp = [];
        for (var i = 0; i < this.cardsArray.length - 2; ++i) {
            if (this.cardsArray[i] == this.cardsArray[i + 1] && this.cardsArray[i] == this.cardsArray[i + 2]) {
                temp.push(this.cardsArray[i]);
                temp.push(this.cardsArray[i]);
                temp.push(this.cardsArray[i]);
                i += 2;
            }
        }

        //交换顺序
        //如果找出来了多组3张牌，需要将前后3张分别移除后再做检测
        var tempother = [];
        if (temp.length > flynum * 3) {
            //先移除前三张
            tempother = temp.splice(0, 3);
            var tempArray = temp;
            temp = this.cardsArray;
            this.cardsArray = tempArray;
            if (this.isThreeContinue() && temp.length - this.cardsArray.length == flynum) {
                this.cardType = {
                    type: 11,
                    minValue: this.cardsArray[0]
                };
                flag = true;
            }
            var tempArray = temp;
            temp = this.cardsArray;
            this.cardsArray = tempArray;
            temp.splice(0, 0, tempother[0], tempother[1], tempother[2]);
            if (!flag) {
                //前三张不行移除后三张
                temp.splice(temp.length - 3, 3);
                var tempArray = temp;
                temp = this.cardsArray;
                this.cardsArray = tempArray;
                if (this.isThreeContinue() && temp.length - this.cardsArray.length == flynum) {
                    this.cardType = {
                        type: 11,
                        minValue: this.cardsArray[0]
                    };
                    flag = true;
                }
                var tempArray = temp;
                temp = this.cardsArray;
                this.cardsArray = tempArray;
                temp.splice(temp.length - 3, 0, tempother[0], tempother[1], tempother[2]);
            }
        }
        else {
            var tempArray = temp;
            temp = this.cardsArray;
            this.cardsArray = tempArray;
            if (this.isThreeContinue() && temp.length - this.cardsArray.length == flynum) {
                this.cardType = {
                    type: 11,
                    minValue: this.cardsArray[0]
                };
                flag = true;
            }
            var tempArray = temp;
            temp = this.cardsArray;
            this.cardsArray = tempArray;
        }

        if (!flag)
            this.cardType = null;

        return flag;
    }

    //飞机带对翅膀
    protected static isFlyAndTwo() {
        var flag = false;
        this.cardType = null;
        if (this.cardsArray.length < 10 || this.cardsArray.length % 5 != 0)
            return flag;

        var flyNum = this.cardsArray.length / 5
        var tResult = []
        var tPlane = []
        var iTempCard = 0
        var tCardNumArry = this.getHashArry(this.cardsArray)
        for (let iCard = tCardNumArry.length - 1; iCard >= 0; iCard--) {
            if (iCard > 14 || iCard < 3 || tCardNumArry[iCard].length < 3) {
                if (tPlane.length / 2 >= 2) {
                    tResult.push(tPlane)
                    tPlane = []
                }
                continue
            }
            if (tPlane.length == 0 || iTempCard - iCard != 1) {
                tPlane = []
                iTempCard = iCard
                tPlane.push(tCardNumArry[iCard][0])
                tPlane.push(tCardNumArry[iCard][1])
                tPlane.push(tCardNumArry[iCard][2])
            }
            else if (iTempCard - iCard == 1 && tCardNumArry[iCard].length >= 3) {
                iTempCard = iCard
                tPlane.push(tCardNumArry[iCard][0])
                tPlane.push(tCardNumArry[iCard][1])
                tPlane.push(tCardNumArry[iCard][2])
            }
        }
        var finalPlane = []
        for (let iIndex in tResult) {
            if (flyNum == tResult[iIndex].length/3)
                finalPlane = tResult[iIndex]
        }
        if (flyNum*2+finalPlane.length == this.cardsArray.length) {
            this.cardType = {
                type: 12,
                minValue: finalPlane[finalPlane.length - 1]
            };
            flag = true;
        }
        if (!flag)
            this.cardType = null;

        return flag;
    }

    // 混合飞机，用于跑得快最后一手
    protected static isMixFly() {
        var flag = false;
        this.cardType = null;
        if (this.cardsArray.length < 6)
            return flag;

        var tResult = []
        var tPlane = []
        var iTempCard = 0
        var tCardNumArry = this.getHashArry(this.cardsArray)
        for (let iCard = tCardNumArry.length - 1; iCard >= 0; iCard--) {
            if (iCard > 14 || iCard < 3 || tCardNumArry[iCard].length < 3) {
                if (tPlane.length / 2 >= 2) {
                    tResult.push(tPlane)
                    tPlane = []
                }
                continue
            }
            if (tPlane.length == 0 || iTempCard - iCard != 1) {
                tPlane = []
                iTempCard = iCard
                tPlane.push(tCardNumArry[iCard][0])
                tPlane.push(tCardNumArry[iCard][1])
                tPlane.push(tCardNumArry[iCard][2])
            }
            else if (iTempCard - iCard == 1 && tCardNumArry[iCard].length >= 3) {
                iTempCard = iCard
                tPlane.push(tCardNumArry[iCard][0])
                tPlane.push(tCardNumArry[iCard][1])
                tPlane.push(tCardNumArry[iCard][2])
            }
        }
        if (tResult.length == 0)
            return flag
        var finalPlane = []
        for (let iIndex in tResult) {
            if (finalPlane.length < tResult[iIndex].length)
                finalPlane = tResult[iIndex]
        }
        var flyNum = finalPlane.length/3
        if (flyNum*2+finalPlane.length >= this.cardsArray.length) {
            this.cardType = {
                type: 15,
                minValue: finalPlane[finalPlane.length - 1]
            };
            flag = true;
        }
        if (!flag)
            this.cardType = null;

        return flag;
    }

    //得到四带二
    protected static isFourAndTwo() {
        var flag = false;
        this.cardType = null;
        /*if (GameDataManager.getInstance().ddzData.gameinfo.rule.) {
        return flag;
    }*/
        if (this.cardsArray.length != 6)
            return flag;

        for (var i = 0; i < 3; ++i) {
            if (this.cardsArray[i] == this.cardsArray[i + 1] && this.cardsArray[i] == this.cardsArray[i + 2] && this.cardsArray[i] == this.cardsArray[i + 3]) {
                this.cardType = {
                    type: 8,
                    minValue: this.cardsArray[i]
                };
                flag = true;
                break;
            }
        }

        return flag;
    }

    //得到四带两对
    protected static isFourAndDoubles() {
        var flag = false;
        this.cardType = null;
        if (this.cardsArray.length != 8)
            return flag;

        var doublesNum = 0;
        var fourIndex = -1;
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if ((i + 3 < this.cardsArray.length) && this.cardsArray[i] == this.cardsArray[i + 1] &&
                this.cardsArray[i] == this.cardsArray[i + 2] && this.cardsArray[i] == this.cardsArray[i + 3]) {
                //如果已经找到一个4张，那么取第二个四张的位置，并返回前两对
                if (fourIndex != -1)
                    doublesNum += 2;
                fourIndex = i;
                i += 3;
            }
            else if (this.cardsArray[i] == this.cardsArray[i + 1]) {
                doublesNum += 1;
                i += 1;
            }
        }

        if (fourIndex != -1 && doublesNum == 2) {
            this.cardType = {
                type: 9,
                minValue: this.cardsArray[fourIndex]
            };
            flag = true;
        }
        return flag;
    }

    protected static isFourAndThree()
    {
        var flag = false;
        this.cardType = null;
        if (this.cardsArray.length != 7)
            return flag;
        var tempList = []
        var minValue = 0
        for(var cardId of this.cardsArray)
        {
            if (!tempList[cardId])
                tempList[cardId] = 0
            tempList[cardId] += 1
        }
        for (var i = 0; i < tempList.length; ++i)
        {
            if (tempList[i] == 4)
                minValue = i
        }
        if (minValue == 0)
            return flag
        this.cardType = {
            type: 9,
            minValue: minValue
        };
        flag = true;
        return flag;
    }

    //是否为炸弹
    protected static isBoom() {
        var flag = false;
        this.cardType = null;

        var rule = GameDataManager.getInstance().getDataByCurGameType().gameinfo.rule;
        if (rule.play.AAA_is_bomb && this.cardsArray.length == 3 && 
            this.cardsArray[0] == this.cardsArray[1] && this.cardsArray[0] == this.cardsArray[2]&& this.cardsArray[0] == 14)
        {
            this.cardType = {
                type: 13,
                minValue: this.cardsArray[0]
            }; 
            flag = true;
            return flag;
        }
        
        if (this.cardsArray.length == 4) {

            if (this.cardsArray[0] == this.cardsArray[1] && this.cardsArray[0] == this.cardsArray[2] && this.cardsArray[0] == this.cardsArray[3]) {
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


    // 自动提牌tUpCards：当前抬起的牌 tHansCards：手牌
    public static autoGetPlayCard(tUpCards, tHansCards, gameType, laiZiValue = 0) {
        if (tUpCards.length == 0)
            this.clearAutoCardData()
        this.hansUPCards = tUpCards;
        var tResult = []
        var resultLength = 0
        var groupLength = this.getGroup(tUpCards, 1).length
        var threeLength = this.getGroup(tUpCards, 2).length
        if (threeLength > 0) {
            var planeList = this.getPlane(gameType);
            if (planeList.length > 0)
            {
                resultLength = planeList[0].length
                tResult = planeList[0]
            }
        }
        if (tResult.length > 0)
            return tResult
        if (groupLength > 0) // 玩家选中的牌中存在对子
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
        if (threeLength > 0) // 得到三带二
        {
            var threeWithTwoList = this.getThreeWithTwo(gameType)  
            if (threeWithTwoList.length > 0 && threeWithTwoList[0].length > resultLength)
            {
                resultLength = threeWithTwoList[0].length
                tResult = threeWithTwoList[0]
            }
        }

        if (tResult.length > 0)
            return tResult;
        else
            return tUpCards;
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

    // 清理提牌器的数据
    public static clearAutoCardData() {
        this.hansUPCards = [];
        this.handsCardsArray = [];
        this.lastAutoTips = [];
    }

    //判断将要自动提起的牌是否包含现在提起的牌
    protected static getResult(tUpCards, tCards) {

        var tResult = []
        var iMaxCount = 0;
        for (let idx = 0; idx < tCards.length; idx++) {
            var iCount = 0;
            for (let idx1 = 0; idx1 < tCards[idx].length; idx1++) {
                for (let idx2 = 0; idx2 < tUpCards.length; idx2++) {
                    if (tUpCards[idx2] == tCards[idx][idx1])
                        iCount += 1;
                }
            }
            if (iCount > iMaxCount) {
                iMaxCount = iCount;
                tResult = tCards[idx];
            }
        }
        if (iMaxCount == 0 || this.lastAutoTips.toString() == tResult.toString())
            return [];
        else {
            this.lastAutoTips = tResult;
            return tResult;
        }
    }

    // 得到手牌中所有顺子
    protected static getStraight() {
        var tResult = []
        var tStraight = []
        var iTempCard = 0
        var tCardNumArry = this.getHashArry(this.hansUPCards)
        for (let iCard = tCardNumArry.length - 1; iCard >= 0; iCard--) {
            if (iCard > 14 || iCard < 3 || tCardNumArry[iCard].length == 0) {
                if (tStraight.length >= 5) {
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
            if (tResult[iIndex].length <= 5)
                continue;

            for (let iLength = 5; iLength < tResult[iIndex].length; iLength++)
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
        if (gameType == GAME_TYPE.LRPDK || gameType == GAME_TYPE.PDK)
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

    // 得到手牌中的飞机
    protected static getPlane(gameType) // 得到飞机
    {
        var tResult = []
        var tPlane = []
        var iTempCard = 0
        var tCardNumArry = this.getHashArry(this.hansUPCards)
        for (let iCard = tCardNumArry.length - 1; iCard >= 0; iCard--) {
            if (iCard > 14 || iCard < 3 || tCardNumArry[iCard].length < 3) {
                if (tPlane.length / 2 >= 2) {
                    tResult.push(tPlane)
                    tPlane = []
                }
                continue
            }
            if (tPlane.length == 0 || iTempCard - iCard != 1) {
                tPlane = []
                iTempCard = iCard
                tPlane.push(tCardNumArry[iCard][0])
                tPlane.push(tCardNumArry[iCard][1])
                tPlane.push(tCardNumArry[iCard][2])
            }
            else if (iTempCard - iCard == 1 && tCardNumArry[iCard].length >= 3) {
                iTempCard = iCard
                tPlane.push(tCardNumArry[iCard][0])
                tPlane.push(tCardNumArry[iCard][1])
                tPlane.push(tCardNumArry[iCard][2])
            }
        }
        if (tResult.length == 0)
            return tResult
        for (let iIndex in tResult) {
            var plane = tResult[iIndex]
            var iLen = plane.length / 3 // 飞机可以带的单牌数量
            if (gameType == GAME_TYPE.LRPDK || gameType == GAME_TYPE.PDK)
                iLen = plane.length / 3 *2 //
            var tTail = [] // 尾巴
            if (gameType == GAME_TYPE.DDZ) // 斗地主要么带x对,要么带x张
            {
                for (let iCard = 0; iCard < tCardNumArry.length; iCard++) {
                    if (iCard > 14 || tCardNumArry[iCard].length != 1)
                        continue
                    if (tTail.length < iLen)
                        tTail.push(tCardNumArry[iCard][0])
                }
                if (tTail.length == iLen) {
                    plane = plane.concat(tTail)
                }
                else {
                    for (let iCard = 0; iCard < tCardNumArry.length; iCard++) {
                        if (iCard > 14 || (tCardNumArry[iCard].length != 2))
                            continue
                        if (tTail.length / 2 < iLen) {
                            tTail.push(tCardNumArry[iCard][0])
                            tTail.push(tCardNumArry[iCard][1])
                        }
                    }
                    if (tTail.length / 2 == iLen) {
                        plane = plane.concat(tTail)
                    }
                }
            }
            else
            {
                for (let iCard = 0; iCard < tCardNumArry.length; iCard++) {
                    if (iCard > 14 || tCardNumArry[iCard].length != 1)
                        continue
                    if (tTail.length < iLen)
                        tTail.push(tCardNumArry[iCard][0])
                }
                for (let iCard = 0; iCard < tCardNumArry.length; iCard++) {
                    if (iCard > 14 || (tCardNumArry[iCard].length != 2))
                        continue
                    if (tTail.length < iLen) {
                        tTail.push(tCardNumArry[iCard][0])
                    }
                    if (tTail.length < iLen) {
                        tTail.push(tCardNumArry[iCard][1])
                    }
                }
                plane = plane.concat(tTail)
            }
            tResult[iIndex] = plane
        }
        return tResult
    }

    public static getThreeWithTwo(gameType)
    {
        //获取三张
        var arrThree = [];
        var result = []
        var tCardNumArry = this.getHashArry(this.hansUPCards)
        //获取三张中能打的牌
        for (var i = 0; i < tCardNumArry.length; ++i) {
            if (tCardNumArry[i].length == 3)
                arrThree.push(tCardNumArry[i]);
        }
        if (arrThree.length == 0)
            return
        if (gameType == GAME_TYPE.LRPDK || gameType == GAME_TYPE.PDK)
        {
            var arrSingle = [];
            var arrDouble = [];
            for (var i = 0; i < tCardNumArry.length; ++i) {
                var temp = []
                if (tCardNumArry[i].length == 1)
                    arrSingle.push(tCardNumArry[i][0]);
                else if (tCardNumArry[i].length == 2)
                {
                    temp.push(tCardNumArry[i][0]);
                    temp.push(tCardNumArry[i][1]);
                    arrDouble.push(temp)
                }
            }
            if (arrSingle.length >= 2)
            {
                for (var threeList of arrThree)
                {
                    threeList.push(arrSingle[0]);
                    threeList.push(arrSingle[1]);
                    result.push(threeList);
                }
            }
            else if (arrDouble.length > 0)
            {
                for (var threeList of arrThree)
                {
                    result.push(threeList.concat(arrDouble[0]));
                }
            }
            else
                return []
        }
        else
        {
            var arrDouble = [];
            for (var i = 0; i < tCardNumArry.length; ++i) {
                var temp = []
                if (tCardNumArry[i].length == 2)
                {
                    temp.push(tCardNumArry[i][0]);
                    temp.push(tCardNumArry[i][1]);
                    arrDouble.push(temp)
                }
            }
            console.log(arrDouble, arrThree)
            if (arrDouble.length == 0)
                return []
            for (var threeList of arrThree)
            {
                result.push(threeList.concat(arrDouble[0]));
            }
        }
        return result;
    }

    public static getSortedOutCards(cards, reverse = false) // 将打出去的牌排序
    {
        var isThreeForward = false
        if (cards.length > 7) // 大于7张的出牌，不可能有4张排前面
            isThreeForward = true
        var tTemp = [[], [], [], []] // 按照从多到少，从大到小的顺序
        var tType = [];
        for (let iIndex = 0; iIndex < cards.length; iIndex++)
        {
            if (tType.length != 0 && Utils.getPdkCardValue(tType[0]) != Utils.getPdkCardValue(cards[iIndex]))
            {
                tTemp[tType.length - 1].push(tType);
                tType = [];
            }
            // 如果大于7张的出牌，里面有4张牌，此时把他当3张处理，最后那张放到单牌里面
            if (isThreeForward && tType.length == 3 && Utils.getPdkCardValue(tType[0]) == Utils.getPdkCardValue(cards[iIndex]))
            {
                tTemp[0].push([cards[iIndex]])
            }
            else
                tType.push(cards[iIndex]) 
            if (iIndex + 1 == cards.length)
                tTemp[tType.length - 1].push(tType);
        }
        var result = []
        if (reverse)
        {
            for (var i = 0; i < tTemp.length; i++)
            {
                for (var tCard of tTemp[i])
                    result = result.concat(tCard)
            }
        }
        else
        {
            for (var i = tTemp.length-1; i >= 0; i--)
            {
                for (var tCard of tTemp[i])
                    result = result.concat(tCard)
            }
        }
        return result
    }

}
