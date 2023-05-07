import { Utils } from './../../../framework/Utils/Utils';
import { DDZCheckCardType } from './DDZCheckCardType';
import { PDKCheckCanBet } from './../game_pdk/PDKCheckCanBet';

export class DDZCheckCanBet extends PDKCheckCanBet{

    //牌型 1:单张 2:对子 3:顺子 4:连对 5:三不带 6:三带一 7:三带对 8:四带对 9:四带三 10:飞机 11:飞机带单 12飞机带对 13:炸弹
    // 获取能够打上家的所有牌
    public static checkCanBet(cards, outCards, extraData = null) {
        //牌型数值排序
        var tempCards = JSON.parse(JSON.stringify(cards))
        tempCards = tempCards.sort(function (a, b) { return Utils.getPdkCardValue(a) - Utils.getPdkCardValue(b) })
        this.cardsArray = this.getCardsArray(tempCards);
        var outNum = outCards.length
        var oType = DDZCheckCardType.checkCardsType(outCards)
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
        else if (oType.type == 7)//三带对
            return this.getThreeAndTwo(oType.minValue);
         else if (oType.type == 8)//四带2单
            return this.getFourAndThree(oType.minValue, outNum, cards.length >= outNum);   
        else if (oType.type == 14)//四带对
            return this.getFourAndTwo(oType.minValue, outNum, cards.length >= outNum);
        else if (oType.type == 10)//飞机不带
            return this.getThreeContinue(oType.minValue, outNum, cards.length >= outNum)
        else if (oType.type == 11)//飞机带单
            return this.getFlyAndOne(oType.minValue, outNum, cards.length >= outNum);
        else if (oType.type == 12) //飞机带对
            return this.getFlyAndTwo(oType.minValue, outNum, cards.length >= outNum);
        else if (oType.type == 13)//炸弹
            return this.getBoom(oType.minValue,outNum);

        return [];
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

        var arrDouble = [];
        var arrNotDouble = []
        for (var i = 0; i < this.cardsArray.length; ++i) {
            var temp = []
            if (this.cardsArray[i].length == 2)
            {
                temp.push(this.cardsArray[i][0]);
                temp.push(this.cardsArray[i][1]);
                arrDouble.push(temp)
            }
            else if (this.cardsArray[i].length > 2)
            {
                temp.push(this.cardsArray[i][0]);
                temp.push(this.cardsArray[i][1]);
                arrNotDouble.push(temp)
            }
        }
        arrDouble = arrDouble.concat(arrNotDouble)
        this.outCardsArray = [];
        if (arrThree.length > 0) {
            for (var i = 0; i < arrThree.length; ++i) {
                for (var k = 0; k < arrDouble.length; k++) {
                    if (arrThree[i][0] != arrDouble[k][0]) {
                        let arrTemp = arrThree[i];
                        arrTemp = arrTemp.concat(arrDouble[k])
                        this.outCardsArray.push(arrTemp);
                    }
                }
            }
        }
        this.addCanBoom();
        return this.outCardsArray;
    }

    //得到四带2对
    public static getFourAndTwo(minValue, outNum, isNumCanBet) {
        //获取4张
        var arrFour = [];
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (this.cardsArray[i].length == 4 && this.cardsArray[i][0] > minValue)
                arrFour.push([this.cardsArray[i][0], this.cardsArray[i][1], this.cardsArray[i][2], this.cardsArray[i][3]]);
        }

        var arrDouble = [];
        var arrNotDouble = []
        for (var i = 0; i < this.cardsArray.length; ++i) {
            var temp = []
            if (this.cardsArray[i].length == 2)
            {
                temp.push(this.cardsArray[i][0]);
                temp.push(this.cardsArray[i][1]);
                arrDouble.push(temp)
            }
            else if (this.cardsArray[i].length == 3)
            {
                temp.push(this.cardsArray[i][0]);
                temp.push(this.cardsArray[i][1]);
                arrNotDouble.push(temp)
            }
        }
        arrDouble = arrDouble.concat(arrNotDouble)
        this.outCardsArray = [];
        if (arrFour.length > 0) {
            for (var i = 0; i < arrFour.length; ++i) {
                for (var k = 0; k < arrDouble.length; k+=2) {
                    if (arrFour[i][0] != arrDouble[k][0]) {
                        let arrTemp = arrFour[i];
                        arrTemp = arrTemp.concat(arrDouble[k])
                        arrTemp = arrTemp.concat(arrDouble[k+1])
                        this.outCardsArray.push(arrTemp);
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

        var arrDouble = [];
        var arrNotDouble = []
        for (var i = 0; i < this.cardsArray.length; ++i) {
            var temp = []
            if (this.cardsArray[i].length == 2)
            {
                temp.push(this.cardsArray[i][0]);
                temp.push(this.cardsArray[i][1]);
                arrDouble.push(temp)
            }
            else if (this.cardsArray[i].length == 3)
            {
                var canPush = true
                for (var j = 0; j < arrThreeContinue.length; ++j) {
                    if (arrThreeContinue[j].indexOf(this.cardsArray[i][0]) > 0)
                        canPush = false
                }
                if (canPush)
                {
                    temp.push(this.cardsArray[i][0]);
                    temp.push(this.cardsArray[i][1]);
                    arrNotDouble.push(temp)
                }
            }
        }
        arrDouble = arrDouble.concat(arrNotDouble)
        
        this.outCardsArray = [];

        if (arrThreeContinue.length > 0 && isNumCanBet) {
            for (var i = 0; i < arrThreeContinue.length; ++i) {
                for (var k = 0; k < arrDouble.length; k+=2) {
                        let arrTemp = arrThreeContinue[i];
                        arrTemp = arrTemp.concat(arrDouble[k])
                        arrTemp = arrTemp.concat(arrDouble[k+1])
                        this.outCardsArray.push(arrTemp);
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

}