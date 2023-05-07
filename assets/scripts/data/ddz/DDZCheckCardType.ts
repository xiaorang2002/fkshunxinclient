import { Utils } from './../../../framework/Utils/Utils';
import { PDKCheckCardType } from './../game_pdk/PDKCheckCardType';

export class DDZCheckCardType extends PDKCheckCardType{

    //检测牌型
    //牌型 1:单张 2:对子 3:顺子 4:连对 5:三不带 6:三带一 7:三带二 8:四带二 14:四带2对 10:飞机 11:飞机带单 12飞机带对 13:炸弹
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
        else if (this.isFourAndDoubles())//四带2对
            return this.cardType;
        else if (this.isThreeContinue())//飞机
            return this.cardType;
        else if (this.isFlyAndOne())//飞机带单翅膀
            return this.cardType;
        else if (this.isFlyAndTwo())//飞机带2对
            return this.cardType;

        return null;
    }
    
    //得到三带对
    protected static isThreeAndTwo() {
        var flag = false;
        this.cardType = null;
        if (this.cardsArray.length != 5)
            return flag;

        if (this.cardsArray[0] == this.cardsArray[1] &&
            this.cardsArray[0] == this.cardsArray[2] && this.cardsArray[3] == this.cardsArray[4]) {
            this.cardType = {
                type: 7,
                minValue: this.cardsArray[0]
            };
            flag = true;
        }
        return flag;
    }

    protected static isBoom() {
        var flag = false;
        this.cardType = null;

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
        else if (this.cardsArray.length == 2)
        {
            if (this.cardsArray[0] == 54 && this.cardsArray[1] == 53)
            {
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


     //得到四带两对
     protected static isFourAndDoubles() {
        var flag = false;
        this.cardType = null;
        if (this.cardsArray.length != 8)
            return flag;
        if (this.cardsArray[0] == this.cardsArray[1] && this.cardsArray[0] == this.cardsArray[2]
            && this.cardsArray[0] == this.cardsArray[3] && this.cardsArray[4] == this.cardsArray[5] && this.cardsArray[6] == this.cardsArray[7]) {
            this.cardType = {
                type: 14,
                minValue: this.cardsArray[0]
            };
            flag = true;
            return flag;
        }
    }

    //飞机带对翅膀
    protected static isFlyAndTwo() {
        var flag = false;
        this.cardType = null;
        if (this.cardsArray.length < 10 || this.cardsArray.length % 5 != 0)
            return flag;

        //找到飞机主体
        var flyNum = this.cardsArray.length / 5
        var temp = [];
        var doublesNum = 0;
        for (var i = 0; i < this.cardsArray.length; ++i) {
            if (temp.length / 3 != flyNum && this.cardsArray[i] == this.cardsArray[i+1] && this.cardsArray[i+1] == this.cardsArray[i+2])
            {
                temp.push(this.cardsArray[i]);
                temp.push(this.cardsArray[i]);
                temp.push(this.cardsArray[i]);
                i += 2;
            }
            else if (this.cardsArray[i] == this.cardsArray[i+1]){
                doublesNum += 1;
                i += 1;
            }
        }

        //交换顺序
        var tempArray = temp;
        temp = this.cardsArray;
        this.cardsArray = tempArray;
        if (this.isThreeContinue() && doublesNum == flyNum && flyNum == this.cardsArray.length / 3) {
            this.cardType = {
                type: 12,
                minValue: this.cardsArray[0]
            };
            flag = true;
        }
        var tempArray = temp;
        temp = this.cardsArray;
        this.cardsArray = tempArray;

        if (!flag)
            this.cardType = null;
        return flag;
    }


}