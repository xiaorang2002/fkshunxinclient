import { PDKCheckCardType } from './PDKCheckCardType';
import { MessageManager } from "../../../framework/Manager/MessageManager";
import { ListenerType } from "../ListenerType";
import { Utils } from "../../../framework/Utils/Utils";

export enum CARD_TYPE {
    //1:单张 2:对子 3:三不带 4:三带单 5:三带对 6:单顺子 7:对顺子 8:飞机不带 9:飞机带单 10:飞机带对 11:四带单 12:四带对 13:炸弹 14:火箭
    CARD_TYPE_SP = 0,
    CARD_TYPE_ONE,
    CARD_TYPE_TWO,
    CARD_TYPE_THREE,
    CARD_TYPE_THREE_ONE,
    CARD_TYPE_THREE_TWO,
    CARD_TYPE_ARR_ONE,
    CARD_TYPE_ARR_TWO,
    CARD_TYPE_PLANE,
    CARD_TYPE_PLANE_ONE,
    CARD_TYPE_PLANE_TWO,
    CARD_TYPE_FOUR_ONE,
    CARD_TYPE_FOUR_TWO,
    CARD_TYPE_FOUR,
    CARD_TYPE_ROCKET,

}

export class GamePlayerInfo_PDK {

    //头像
    protected _headurl: string = "";
    public get headurl(): string {
        return this._headurl;
    }
    public set headurl(value: string) {
        this._headurl = value;
    }

    //名字
    protected _name: string = "";
    public get name(): string {
        return this._name;
    }
    public set name(value: string) {
        this._name = value;
    }

    //id
    protected _id: number = 0;
    public get id(): number {
        return this._id;
    }
    public set id(value: number) {
        this._id = value;
    }
    //性别
    protected _sex: number = 1;
    public get sex(): number {
        return this._sex;
    }
    public set sex(value: number) {
        this._sex = value;
    }
    //座位
    protected _seat: number = 0;
    public get seat(): number {
        return this._seat;
    }
    public set seat(value: number) {
        this._seat = value;
    }

    //真实用于确定玩家显示位置座位
    protected _realSeat: number = 0;
    public get realSeat(): number {
        return this._realSeat;
    }
    public set realSeat(value: number) {
        this._realSeat = value;
    }

    //经度
    protected _longitude: string = "";
    public get longitude(): string {
        return this._longitude;
    }
    public set longitude(value: string) {
        this._longitude = value;
    }

    //纬度
    protected _latitude: string = "";
    public get latitude(): string {
        return this._latitude;
    }
    public set latitude(value: string) {
        this._latitude = value;
    }
    //在线离线
    protected _isonline: boolean = true;
    public get isonline(): boolean {
        return this._isonline;
    }
    public set isonline(value: boolean) {
        this._isonline = value;
    }

    //准备
    protected _isready: boolean = false;
    public get isready(): boolean {
        return this._isready;
    }
    public set isready(value: boolean) {
        this._isready = value;
    }

    //是否托管中
    protected _isTrustee: boolean = false;
    public get isTrustee(): boolean {
        return this._isTrustee;
    }
    public set isTrustee(value: boolean) {
        this._isTrustee = value;
        MessageManager.getInstance().messagePost(ListenerType.pdk_onTrusteeChanged, { id: this._id });
    }
    

    //玩家分数
    protected _score: number = 0;
    public get score(): number {
        return this._score;
    }
    public set score(value: number) {
        this._score = value/100;
        MessageManager.getInstance().messagePost(ListenerType.pdk_playerScoreChanged, { id: this._id });
    }
    
    // 游戏分数，纯显示总用，用于给亲友群计分
    protected _clubScore:number = 0
    public get clubScore(): number {
        return this._clubScore;
    }
    public set clubScore(value: number) {
        this._clubScore = value;
        MessageManager.getInstance().messagePost(ListenerType.pdk_playerScoreChanged, { id: this._id });
    }
    

    //玩家手牌
    protected _cards: number[] = [];
    public get cards(): number[] {
        return this._cards
    }
    public set cards(value: number[]) {
        this._cards = value.sort(function (a, b) {return a - b})
        this.pdkWenDingSort(this._cards)
        this._cards = Utils.sortWithLaiZi(this._cards)
        MessageManager.getInstance().messagePost(ListenerType.pdk_handCardChanged, { seat: this.realSeat })

    }
     
    //玩家手牌
    public _outCard: number[] = [];
    public get outCard(): number[] {
        return this._outCard
    }
    public set outCard(value: number[]) {
        this._outCard = value.sort(function (a, b) { return Utils.getPdkCardValue(b) - Utils.getPdkCardValue(a) }) // 按从大到小排序
        this._outCard = PDKCheckCardType.getSortedOutCards(this._outCard)
        MessageManager.getInstance().messagePost(ListenerType.pdk_outCardChanged, { seat: this.realSeat })
    }
    

    //牌类型
    protected _cardtype: CARD_TYPE;
    public get cardtype(): CARD_TYPE {
        return this._cardtype;
    }
    public set cardtype(value: CARD_TYPE) {
        this._cardtype = value;
    }
 
   
    // 更新玩家基本数据
    updatePlayerSimplyInfo(info)
    {
        this._seat = info.chairId;
        this._id = info.playerInfo.guid;
        this._name = info.playerInfo.nickname;
        this._headurl = info.playerInfo.icon;
        this._sex = info.playerInfo.sex;
        this._isready = info.ready;
        this._isonline = info.online
        this.longitude = info.longitude
        this.latitude = info.latitude
        this._isTrustee = info.isTrustee
        if (info.money && info.money.moneyId != -1)
            this._score = info.money.count/100;
    }

    // 更新玩家游戏数据
    updatePlayerInfoOnStart(info)
    {
        this._cards = info.handCards.sort(function (a, b) {return a - b})
        this.pdkWenDingSort(this._cards)
        this._cards = Utils.sortWithLaiZi(this._cards)
    }

    pdkWenDingSort(cards)
    {
        //接下来我们用冒泡排序的方法来给这个数组排序
        for(let i=0;i<cards.length-1;i++){
            for(let j=0;j<cards.length-1-i;j++){
                if(Utils.getPdkCardValue(cards[j]) < Utils.getPdkCardValue(cards[j+1])){
                //如果这一项比后一项大就交换位置了
                let tmp = cards[j]
                cards[j] = cards[j+1]
                cards[j+1] = tmp
                }
            }
        }
    }
    onReconnect()
    {
        if (this._cards.length != 0)
            MessageManager.getInstance().messagePost(ListenerType.pdk_handCardChanged, { seat: this.realSeat })
        if (this._outCard.length != 0)
            MessageManager.getInstance().messagePost(ListenerType.pdk_outCardChanged, { seat: this.realSeat })

    }

    clearCards()
    {
        this._cards = []
        this._outCard = []
    }

}

