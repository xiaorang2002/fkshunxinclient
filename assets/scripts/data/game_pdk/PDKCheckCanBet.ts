import { PDKCheckCardType } from './PDKCheckCardType';
import { Utils } from './../../../framework/Utils/Utils';
import { GameDataManager } from "../../../framework/Manager/GameDataManager";

export class PDKCheckCanBet {

    protected static cardsArray = [];               //逻辑形式手牌
    protected static outCardsArray = [];               //牌型数据包

    //牌型 1:单张 2:对子 3:顺子 4:连对 5:三不带 6:三带一 7:三带二 8:四带二 9:四带三 10:飞机 11:飞机带单 12飞机带对 13:炸弹
    // 获取能够打上家的所有牌
    public static checkCanBet(cards, outCards, extraData = null) {
        //牌型数值排序
        var tempCards = JSON.parse(JSON.stringify(cards))
        tempCards = tempCards.sort(function (a, b) { return Utils.getPdkCardValue(a) - Utils.getPdkCardValue(b) })
        this.cardsArray = this.getCardsArray(tempCards);
        var outNum = outCards.length
        var oType = PDKCheckCardType.checkCardsType(outCards)
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
        else if (oType.type == 6)//三带一
            return this.getThreeAndOne(oType.minValue);
        else if (oType.type == 7)//三带二
            return this.getThreeAndTwo(oType.minValue);
        else if (oType.type == 14)//四带2对
            return this.getFourAndTwo(oType.minValue, outNum, cards.length >= outNum);
        else if (oType.type == 9 || oType.type == 8)//四带三 四带2单
            return this.getFourAndThree(oType.minValue, outNum, cards.length >= outNum);
        else if (oType.type == 10)//飞机不带
            return this.getThreeContinue(oType.minValue, outNum, cards.length >= outNum)
        else if (oType.type == 11)//飞机带单
            return this.getFlyAndOne(oType.minValue, outNum, cards.length >= outNum);
        else if (oType.type == 12) //飞机带张
            return this.getFlyAndTwo(oType.minValue, outNum, cards.length >= outNum);
        else if (oType.type == 13)//炸弹
            return this.getBoom(oType.minValue,outNum);

        return [];
    }

    public static checkHaveBoom(cards){
        var tempCards = JSON.parse(JSON.stringify(cards))
        tempCards = tempCards.sort(function (a, b) { return Utils.getPdkCardValue(a) - Utils.getPdkCardValue(b) })
        this.cardsArray = this.getCardsArray(tempCards);
        this.addCanBoom()
        var boomList = this.outCardsArray;
        this.outCardsArray = []
        return boomList.length > 0
    }

    //转换手牌到哈希数组
    public static getCardsArray(cards) {
        var cardsArray = [];
        var curCardNum = 0;
        var bag = [];
        for (var i = 0; i < cards.length; ++i) {
            var cardnum = Utils.getPdkCardValue(cards[i]);
            if (i == 0) {
                curCardNum = cardnum;
                bag.push(cardnum);
            }
            else {
                if (curCardNum != cardnum) {
                    cardsArray.push(bag);
                    bag = [];
                    curCardNum = cardnum;
                    bag.push(cardnum);
                }
                else
                    bag.push(cardnum);
            }
        }
        cardsArray.push(bag);
        return cardsArray;
    }

    //得到单张
    public static getSigles(minValue) {
        this.outCardsArray = [];

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

    //得到对子
    public static getDoubles(minValue) {
        this.outCardsArray = [];

        //获取对子中能打的牌
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 2 && this.cardsArray[i][0] > minValue)
                this.outCardsArray.push(this.cardsArray[i]);
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

    //得到三张
    public static getThrees(minValue) {
        this.outCardsArray = [];

        //获取三张中能打的牌
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 3 && this.cardsArray[i][0] > minValue)
                this.outCardsArray.push(this.cardsArray[i]);
        }

        //获取四张中能打的牌
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 4 && this.cardsArray[i][0] > minValue)
                this.outCardsArray.push([this.cardsArray[i][0], this.cardsArray[i][1], this.cardsArray[i][2]]);
        }
        this.addCanBoom();
        return this.outCardsArray;
    }

    //得到三带一
    public static getThreeAndOne(minValue) {
        //获取三张
        var arrThree = [];
        //获取三张中能打的牌
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 3 && this.cardsArray[i][0] > minValue)
                arrThree.push(this.cardsArray[i]);
        }
        //获取四张中能打的牌
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 4 && this.cardsArray[i][0] > minValue)
                arrThree.push([this.cardsArray[i][0], this.cardsArray[i][1], this.cardsArray[i][2]]);
        }

        //获取单张
        var arrSingle = [];
        var arrNotSingle = []
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 1)
                arrSingle.push(this.cardsArray[i][0]);
            else
                for (var j = 0; j < this.cardsArray[i].length; ++j)
                    arrNotSingle.push(this.cardsArray[i][j]);
        }
        arrSingle = arrSingle.concat(arrNotSingle)
        this.outCardsArray = [];
        if (arrThree.length > 0) {
            for (var i = 0; i < arrThree.length; ++i) {
                for (var j = 0; j < arrSingle.length; ++j) {
                    if (arrThree[i][0] != arrSingle[j]) {
                        let arrTemp = arrThree[i].slice();
                        arrTemp.push(arrSingle[j]);
                        this.outCardsArray.push(arrTemp);
                        break;
                    }
                }
            }
        }
        this.addCanBoom();
        return this.outCardsArray;
    }

    //得到三带对
    public static getThreeAndTwo(minValue) {
        //获取三张
        var arrThree = [];
        //获取三张中能打的牌
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 3 && this.cardsArray[i][0] > minValue)
                arrThree.push(this.cardsArray[i]);
        }

        //获取四张中能打的牌
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 4 && this.cardsArray[i][0] > minValue)
                arrThree.push([this.cardsArray[i][0], this.cardsArray[i][1], this.cardsArray[i][2]]);
        }

        var arrSingle = [];
        var arrNotSingle = []
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 1)
                arrSingle.push(this.cardsArray[i][0]);
            else
                for (var j = 0; j < this.cardsArray[i].length; ++j)
                    arrNotSingle.push(this.cardsArray[i][j]);
        }
        arrSingle = arrSingle.concat(arrNotSingle)
        this.outCardsArray = [];
        if (arrThree.length > 0) {
            for (var i = 0; i < arrThree.length; ++i) {
                dance:
                for (var j = 0; j < arrSingle.length; ++j) {
                    if (arrThree[i][0] != arrSingle[j]) {
                        if (j + 1 < arrSingle.length) {
                            for (var k = j + 1; k < arrSingle.length; ++k) {
                                if (arrThree[i][0] != arrSingle[k]) {
                                    let arrTemp = arrThree[i].slice();
                                    arrTemp.push(arrSingle[j]);
                                    arrTemp.push(arrSingle[k]);
                                    this.outCardsArray.push(arrTemp);
                                    break dance;
                                }
                            }
                        }

                    }
                }
            }
        }
        this.addCanBoom();
        return this.outCardsArray;
    }

    //得到飞机不带翅膀
    public static getThreeContinue(minValue, outNum, isNumCanBet) {
        //获取三张
        var arrThree = [];
        var tempArrThree = this.getThrees(0);
        for (var i = 0; i < tempArrThree.length; ++i) {
            if (tempArrThree[i].length == 3)
                arrThree.push(tempArrThree[i]);
        }
        this.outCardsArray = [];

        var maxValue = minValue + outNum / 3 - 1;
        if (maxValue < 14 && isNumCanBet) {
            var checkLen = 14 - maxValue;
            for (var endIndex = 1; endIndex <= checkLen; ++endIndex) {
                var arrLian = [];
                var findNum = maxValue + endIndex;
                for (var i = 0; i < outNum / 3; ++i) {
                    var findItem = this.whileFinLian(arrThree, findNum);
                    if (findItem != null) {
                        arrLian.push(findItem[0]);
                        arrLian.push(findItem[1]);
                        arrLian.push(findItem[2]);
                        findNum = findNum - 1
                    }
                    else
                        break;
                }
                if (arrLian.length == outNum)
                    this.outCardsArray.push(arrLian);
            }
        }
        this.addCanBoom();
        return this.outCardsArray;
    }

    //飞机带单翅膀
    public static getFlyAndOne(minValue, outNum, isNumCanBet) {
        //获取飞机
        var arrThreeContinue = [];
        var arrTempThreeContinue = this.getThreeContinue(minValue, (outNum / 4) * 3, isNumCanBet)
        for (var i = 0; i < arrTempThreeContinue.length; ++i) {
            if (arrTempThreeContinue[i].length > 4)
                arrThreeContinue.push(arrTempThreeContinue[i]);
        }

        //获取单张
        var arrSingle = [];
        var arrNotSingle = []
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 1)
                arrSingle.push(this.cardsArray[i][0]);
            else
                for (var j = 0; j < this.cardsArray[i].length; ++j)
                    arrNotSingle.push(this.cardsArray[i][j]);
        }
        arrSingle = arrSingle.concat(arrNotSingle)
        this.outCardsArray = [];

        if (arrThreeContinue.length > 0 && isNumCanBet) {
            for (var i = 0; i < arrThreeContinue.length; ++i) {
                let temp = arrThreeContinue[i].slice();
                for (var j = 0; j < arrSingle.length; ++j) {
                    var len = arrThreeContinue[i].length / 3;
                    var isIn = false;
                    for (var k = 0; k < len; ++k) {
                        if (arrSingle[j] == arrThreeContinue[i][3 * k] ||
                            arrSingle[j] == arrThreeContinue[i][3 * k + 1] ||
                            arrSingle[j] == arrThreeContinue[i][3 * k + 2])
                            isIn = true;
                    }

                    if (!isIn) {
                        temp.push(arrSingle[j]);
                        if (temp.length == outNum) {
                            this.outCardsArray.push(temp);
                            break;
                        }
                    }
                }
            }
        }
        this.addCanBoom();
        return this.outCardsArray;
    }

    //得到飞机带对翅膀
    public static getFlyAndTwo(minValue, outNum, isNumCanBet) {
        //获取飞机
        var arrThreeContinue = [];
        var arrTempThreeContinue = this.getThreeContinue(minValue, (outNum / 5) * 3, isNumCanBet)
        for (var i = 0; i < arrTempThreeContinue.length; ++i) {
            if (arrTempThreeContinue[i].length > 4)
                arrThreeContinue.push(arrTempThreeContinue[i]);
        }

        //获取单张
        var arrSingle = [];
        var arrNotSingle = []
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 1)
                arrSingle.push(this.cardsArray[i][0]);
            else
                for (var j = 0; j < this.cardsArray[i].length; ++j)
                    arrNotSingle.push(this.cardsArray[i][j]);
        }
        arrSingle = arrSingle.concat(arrNotSingle)
        this.outCardsArray = [];

        if (arrThreeContinue.length > 0 && isNumCanBet) {
            for (var i = 0; i < arrThreeContinue.length; ++i) {
                let temp = arrThreeContinue[i].slice();
                for (var j = 0; j < (arrSingle.length * 2); ++j) {
                    var len = arrThreeContinue[i].length / 3;
                    var isIn = false;
                    for (var k = 0; k < len; ++k) {
                        if (arrSingle[j] == arrThreeContinue[i][3 * k] ||
                            arrSingle[j] == arrThreeContinue[i][3 * k + 1] ||
                            arrSingle[j] == arrThreeContinue[i][3 * k + 2])
                            isIn = true;
                    }

                    if (!isIn) {
                        temp.push(arrSingle[j]);
                        if (temp.length == outNum) {
                            this.outCardsArray.push(temp);
                            break;
                        }
                    }
                }
            }
        }
        this.addCanBoom();
        return this.outCardsArray;
    }

    //得到四带二
    public static getFourAndTwo(minValue, outNum, isNumCanBet) {
        //获取4张
        var arrFour = [];
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 4 && this.cardsArray[i][0] > minValue)
                arrFour.push([this.cardsArray[i][0], this.cardsArray[i][1], this.cardsArray[i][2], this.cardsArray[i][3]]);
        }

        var arrSingle = [];
        var arrNotSingle = []
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 1)
                arrSingle.push(this.cardsArray[i][0]);
            else
                for (var j = 0; j < this.cardsArray[i].length; ++j)
                    arrNotSingle.push(this.cardsArray[i][j]);
        }
        arrSingle = arrSingle.concat(arrNotSingle)
        this.outCardsArray = [];

        if (arrFour.length > 0 && isNumCanBet) {
            for (var i = 0; i < arrFour.length; ++i) {
                let temp = arrFour[i].slice();
                for (var j = 0; j < arrSingle.length; ++j) {
                    if (arrSingle[j] != arrFour[i][0]) {
                        temp.push(arrSingle[j]);
                        if (temp.length == outNum) {
                            this.outCardsArray.push(temp);
                            break;
                        }
                    }
                }
            }
        }
        this.addCanBoom();
        return this.outCardsArray;
    }
    //得到四带三
    public static getFourAndThree(minValue, outNum, isNumCanBet) {
        //获取4张
        var arrFour = [];
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 4 && this.cardsArray[i][0] > minValue)
                arrFour.push([this.cardsArray[i][0], this.cardsArray[i][1], this.cardsArray[i][2], this.cardsArray[i][3]]);
        }
        this.outCardsArray = []
        if (arrFour.length == 0)
        {
            this.addCanBoom();
            return this.outCardsArray;
        }
        var arrSingle = [];
        var arrNotSingle = []
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 1)
                arrSingle.push(this.cardsArray[i][0]);
            else
                for (var j = 0; j < this.cardsArray[i].length; ++j)
                    arrNotSingle.push(this.cardsArray[i][j]);
        }
        arrSingle = arrSingle.concat(arrNotSingle)

        if (arrFour.length > 0 && isNumCanBet) {
            for (var i = 0; i < arrFour.length; ++i) {
                let temp = arrFour[i].slice();
                for (var j = 0; j < arrSingle.length; ++j) {
                    if (arrSingle[j] != arrFour[i][0]) {
                        temp.push(arrSingle[j]);
                        if (temp.length == outNum) {
                            this.outCardsArray.push(temp);
                            break;
                        }
                    }
                }
            }
        }
        return this.outCardsArray;
    }
    
    //得到炸弹
    public static getBoom(minValue, outNum) {
        this.outCardsArray = [];
        this.addCanBoom();
        var arrTempBoom = this.outCardsArray.slice();
        this.outCardsArray = [];
        for (var i = 0; i < arrTempBoom.length; ++i) {
            if (arrTempBoom[i][0] > minValue)
                this.outCardsArray.push(arrTempBoom[i]);
        }
        return this.outCardsArray;
    }

    //得到单顺子
    public static getSingleContinue(minValue, outNum, isNumCanBet) {
        this.outCardsArray = [];
        var maxValue = minValue;
        if (maxValue < 14 && isNumCanBet) {
            var checkLen = 14 - maxValue;
            for (var endIndex = 1; endIndex <= checkLen; ++endIndex) {
                var arrLian = [];
                var findNum = maxValue + endIndex;
                for (var i = 0; i < outNum; ++i) {
                    var findItem = this.whileFinLian(this.cardsArray, findNum);
                    if (findItem != null) {
                        arrLian.push(findItem[0]);
                        findNum = findNum - 1
                    }
                    else
                        break;
                }
                if (arrLian.length == outNum && arrLian[arrLian.length -1] > minValue)
                    this.outCardsArray.push(arrLian);
            }
        }
        this.addCanBoom();
        return this.outCardsArray;
    }
    //得到双顺子
    public static getTwoContinue(minValue, outNum, isNumCanBet) {
        //获取三张
        var arrTwo = [];
        var tempArrTwo = this.getDoubles(0)
        for (var i = 0; i < tempArrTwo.length; ++i) {
            if (tempArrTwo[i].length == 2 && tempArrTwo[i][0] < 16)
                arrTwo.push(tempArrTwo[i]);
        }
        this.outCardsArray = [];

        var maxValue = minValue;
        if (maxValue < 14 && isNumCanBet) {
            var checkLen = 14 - maxValue;
            for (var endIndex = 1; endIndex <= checkLen; ++endIndex) {
                var arrLian = [];
                var findNum = maxValue + endIndex;
                for (var i = 0; i < outNum / 2; ++i) {
                    var findItem = this.whileFinLian(arrTwo, findNum);
                    if (findItem != null) {
                        arrLian.push(findItem[0]);
                        arrLian.push(findItem[1]);
                        findNum = findNum - 1
                    }
                    else
                        break;
                }
                if (arrLian.length == outNum && arrLian[arrLian.length -1] > minValue)
                    this.outCardsArray.push(arrLian);
            }
        }
        this.addCanBoom();
        return this.outCardsArray;
    }


    //循环寻找连子
    public static whileFinLian(arrTypes, findNum) {
        for (var i = 0; i < arrTypes.length; ++i) {
            if (arrTypes[i][0] == findNum)
                return arrTypes[i];
        }
        return null;
    }

    //加入炸弹
    public static addCanBoom() {
        //获取炸弹中能打的牌
        var wangzha = []
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 4)
                this.outCardsArray.push(this.cardsArray[i]);
            if (this.cardsArray[i].length == 1 && (this.cardsArray[i][0] == 53 || this.cardsArray[i][0] == 54))
                wangzha.push(this.cardsArray[i][0])
        }
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 4)
                this.outCardsArray.push(this.cardsArray[i]);
        }
        var arrThree = [];
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 3)
                arrThree.push(this.cardsArray[i]);
        }
        if (wangzha.length == 2)
            this.outCardsArray.push(wangzha)
        if (GameDataManager.getInstance().getDataByCurGameType() != null) {
            if (GameDataManager.getInstance().getDataByCurGameType().gameinfo.rule.play.AAA_is_bomb) {
                if (arrThree.length > 0) {
                    for (var j = 0; j < arrThree.length; j++) {
                        if (arrThree[j][0] == 14) {
                            this.outCardsArray.push(arrThree[j]);
                        }
                    }
                }
            }
        }
    }
    
}
