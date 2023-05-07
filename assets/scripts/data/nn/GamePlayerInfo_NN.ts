import { MessageManager } from "../../../framework/Manager/MessageManager";
import { ListenerType } from "../ListenerType";

export enum CARD_TYPE_NN {
    CARD_TYPE_235 = 0,          //235散牌
    CARD_TYPE_SP,               //散牌   
    CARD_TYPE_DZ,               //对子
    CARD_TYPE_SZ,               //顺子
    CARD_TYPE_JH,               //金花
    CARD_TYPE_SJ,               //顺金
    CARD_TYPE_BZ                //豹子
}

export enum PLAYER_STATE {
    STATE_NULL = 0,     //观战
    STATE_NORMAL,       //正常游戏
    STATE_FALI = 8,         //失败
}

export var CARD_NN_NAME = {
    1 : "散牌",
    2 : "对子",
    3 : "顺子",
    4 : "金花",
    5 : "顺金",
    6 : "豹子",
}

//游戏信息
export class GamePlayerInfo_NN {
    //头像
    private _headurl: string = "";
    public get headurl(): string {
        return this._headurl;
    }
    public set headurl(value: string) {
        this._headurl = value;
    }

    //名字
    private _name: string = "";
    public get name(): string {
        return this._name;
    }
    public set name(value: string) {
        this._name = value;
    }

    //id
    private _id: number = 0;
    public get id(): number {
        return this._id;
    }
    public set id(value: number) {
        this._id = value;
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

    //性别
    private _sex: boolean = true;
    public get sex(): boolean {
        return this._sex;
    }
    public set sex(value: boolean) {
        this._sex = value;
    }

    //在线离线
    private _isonline: boolean = true;
    public get isonline(): boolean {
        return this._isonline;
    }
    public set isonline(value: boolean) {
        this._isonline = value;
    }

    //准备
    private _isready: boolean = true;
    public get isready(): boolean {
        return this._isready;
    }
    public set isready(value: boolean) {
        this._isready = value;
    }

    //玩家下注分数
    private _usescore: number = 0;
    public get usescore(): number {
        return this._usescore;
    }
    public set usescore(value: number) {
        this._usescore = value;
        MessageManager.getInstance().messagePost(ListenerType.nn_playerAllUseScoreChanged, { id: this._id });
    }

    //玩家抢庄倍数
    private _robBankerTimes: number = 0;
    public get robBankerTimes(): number {
        return this._robBankerTimes;
    }
    public set robBankerTimes(value: number) {
        this._robBankerTimes = value;
        MessageManager.getInstance().messagePost(ListenerType.nn_playerRobBankerTimesChanged, { id: this._id });
    }

    //玩家手牌
    private _cards: number[] = [];
    public get cards(): number[] {
        return this._cards;
    }
    public set cards(value: number[]) {
        this._cards = value;
        MessageManager.getInstance().messagePost(ListenerType.nn_handCardChanged, { seat: this.realSeat });
    }

    //玩家手牌
    private _cardsType: number = 0;
    public get cardsType(): number {
        return this._cardsType;
    }
    public set cardsType(value: number) {
        this._cardsType = value;
        MessageManager.getInstance().messagePost(ListenerType.nn_handCardTypeChanged, { seat: this.realSeat });
    }

    //玩家分数
    protected _score: number = 0;
    public get score(): number {
        return this._score;
    }
    public set score(value: number) {
        this._score = value/100;
        MessageManager.getInstance().messagePost(ListenerType.nn_playerScoreChanged, { id: this._id });
    }
    
    // 游戏分数，纯显示总用，用于给亲友群计分
    protected _clubScore = 0
    public get clubScore(): number {
        return this._clubScore;
    }
    public set clubScore(value: number) {
        this._clubScore = value;
        MessageManager.getInstance().messagePost(ListenerType.nn_playerScoreChanged, { id: this._id });
    }

   //玩家状态（观战，游戏中，破产）
    protected _status: number = 0;
    public get status(): number {
        return this._status;
    }
    public set status(value: number) {
    this._status= value;
        MessageManager.getInstance().messagePost(ListenerType.nn_onStatusChanged, { id: this._id, status: this._status });
    }

    public isDisplayedCards = false; // 是否已经摊牌
    public isCallBanker = false; // 是否已经抢庄
    public isUseScore = false;  // 是否已经下注
    public isGaming = false;

    // 开始的时候初始化玩家牌
    updatePlayerInfoOnStart(cards)
    {
        if (cards.length != 0)
            this._cards = cards
        else
            this._cards = [0,0,0,0,0]
        this._usescore = 0
        this.isGaming = true
    }

    updatePlayerInfoOnRec(state, isGaming, info)
    {
        if (state != PLAYER_STATE.STATE_NULL && info.cards.length == 0)
            this._cards = [0,0,0,0,0]
        else
            this._cards = info.cards
        if (info.score && info.score >0)
        {
            this.isUseScore = true
            this.usescore = info.score
        }
        this.isGaming = isGaming
        if (info.callBankerTimes >= 0)
        {
            this.isCallBanker = true
            this.robBankerTimes = info.callBankerTimes
        }
        if (info.type && info.type >= 1)
        {
            this.cardsType = info.type
            this.isDisplayedCards = true
        }

        if (info.cardsPair.length == 2)
        {
            if (info.cardsPair[0].cards.length > info.cardsPair[1].cards.length)
                this._cards = info.cardsPair[0].cards.concat(info.cardsPair[1].cards)
            else
                this._cards = info.cardsPair[1].cards.concat(info.cardsPair[0].cards)
        }
        else if (info.cardsPair.length == 1)
        {
            this._cards = info.cardsPair[0].cards
        }
        else
            this._cards = info.cards
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
        if (info.money && info.money.moneyId != -1)
            this._score = info.money.count/100;
    }

    onReconnect()
    {
        if (this._cards.length != 0)
            MessageManager.getInstance().messagePost(ListenerType.nn_handCardChanged, { seat: this.realSeat })

    }
}