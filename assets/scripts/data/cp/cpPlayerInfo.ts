import { Utils } from './../../../framework/Utils/Utils';
import { SECTION_TYPE } from './cpDefines';
import { MessageManager } from "../../../framework/Manager/MessageManager";
import { ListenerType } from "../ListenerType";

export class cpPlayerInfo {

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
    //性别
    private _sex: number = 1;
    public get sex(): number {
        return this._sex;
    }
    public set sex(value: number) {
        this._sex = value;
    }
    //座位
    private _seat: number = 0;
    public get seat(): number {
        return this._seat;
    }
    public set seat(value: number) {
        this._seat = value;
    }

    //真实用于确定玩家显示位置座位
    private _realSeat: number = 0;
    public get realSeat(): number {
        return this._realSeat;
    }
    public set realSeat(value: number) {
        this._realSeat = value;
    }

    //地址
    private _address: string = "";
    public get address(): string {
        return this._address;
    }
    public set address(value: string) {
        this._address = value;
    }

    //ip
    private _ip: string = "";
    public get ip(): string {
        return this._ip;
    }
    public set ip(value: string) {
        this._ip = value;
    }

    //经度
    private _longitude: string = "";
    public get longitude(): string {
        return this._longitude;
    }
    public set longitude(value: string) {
        this._longitude = value;
    }

    //纬度
    private _latitude: string = "";
    public get latitude(): string {
        return this._latitude;
    }
    public set latitude(value: string) {
        this._latitude = value;
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
    private _isready: boolean = false;
    public get isready(): boolean {
        return this._isready;
    }
    public set isready(value: boolean) {
        this._isready = value;
    }

    //是否托管中
    private _isTrustee: boolean = false;
    public get isTrustee(): boolean {
        return this._isTrustee;
    }
    public set isTrustee(value: boolean) {
        this._isTrustee = value;
        MessageManager.getInstance().messagePost(ListenerType.cp_onTrusteeChanged, { id: this._id });
    }
    //是否可以报听
    public _canBaoTing = -1;
    public get canBaoTing() {
        return this._canBaoTing;
    }
    public set canBaoTing(value) {
        this._canBaoTing = value;
    }
    //是否已经操作报听
    private _isBaoTing: boolean = false;
    public get isBaoTing(): boolean {
        return this._isBaoTing;
    }
    public set isBaoTing(value: boolean) {
        if (value)
            this._isBaoTing = value;
        else
            this._isBaoTing = false
    }

    public _baoTingResult = false;
    public get baoTingResult() {
        return this._baoTingResult;
    }
    public set baoTingResult(value) {
        this._baoTingResult = value;
    }

    //玩家分数(亲友群中表示输的分数，联盟中表示玩家当前拥有的积分)
    private _score: number = 0;
    public get score(): number {
        return this._score;
    }
    public set score(value: number) {
        this._score = value / 100;
        MessageManager.getInstance().messagePost(ListenerType.cp_playerScoreChanged, { id: this._id });

    }

    // 游戏分数，纯显示总用，用于给亲友群计分
    private _clubScore: number = 0
    public get clubScore(): number {
        return this._clubScore;
    }
    public set clubScore(value: number) {
        this._clubScore = value;
        MessageManager.getInstance().messagePost(ListenerType.cp_playerScoreChanged, { id: this._id });
    }
    //玩家听牌后可以打出的牌
    private _canOutcards: number[] = [];
    public get canOutcards(): number[] {
        return this._canOutcards;
    }
    public set canOutcards(value: number[]) {
        this._canOutcards = [...value]
    }
    //玩家手牌
    private _cards: number[] = [];
    public get cards(): number[] {
        return this._cards;
    }
    public set cards(value: number[]) {
        this._cards = value
        this._cards.sort(function (a, b) { return a - b });
        MessageManager.getInstance().messagePost(ListenerType.cp_handCpChanged, { id: this._id })
    }

    //玩家出牌
    private _outCard: number[] = [];
    public get outCard(): number[] {
        return this._outCard;
    }
    public set outCard(value: number[]) {
        this._outCard = value
        MessageManager.getInstance().messagePost(ListenerType.cp_outCpChanged, { id: this._id })
    }

    /**碰杠数组 */
    private _mjpg: Array<any> = []
    public get mjpg(): Array<any> {
        return this._mjpg;
    }
    public set mjpg(value: Array<any>) {
        this._mjpg = value;
        MessageManager.getInstance().messagePost(ListenerType.cp_pgChanged, { id: this._id })
    }

    //不可以打出的牌
    // private _unableCard: Array<any> = []
    // public get menCard(): Array<any> {
    //     return this._menCard;
    // }
    // public set menCard(value: Array<any>) {
    //     this._menCard = value;
    // }

    private _menCard: Array<any> = []
    public get menCard(): Array<any> {
        return this._menCard;
    }
    public set menCard(value: Array<any>) {
        this._menCard = value;
    }

    // 胡的所有牌
    private _huPaiList = []
    public get huPaiList() {
        return this._huPaiList;
    }
    public set huPaiList(value) {
        this._huPaiList = value;

    }
    //---------------------------------------------------------------------------------------------------------


    updatePlayerSimplyInfo(info) {
        this._seat = info.chairId;
        this._id = info.playerInfo.guid;
        // this._ip = info.loginIp;
        // this._address = info.ipArea;
        this._name = info.playerInfo.nickname;
        this._headurl = info.playerInfo.icon;
        this._sex = info.playerInfo.sex;
        this._isready = info.ready;
        this._isonline = info.online
        this.longitude = info.longitude
        this.latitude = info.latitude
        this._isTrustee = info.isTrustee
        if (info.money && info.money.moneyId != -1)
            this._score = info.money.count / 100;
    }

    updatePlayerInfoOnStart(info) {
        if (info.deskPai.length != 0) {
            this._outCard = info.deskPai
        }
        else {
            this._outCard = [];
        }

        if (info.shouPai.length != 0) {
            this._cards = [...info.shouPai]
            this._cards.sort(function (a, b) { return a - b });
        }
        else {
            this._cards = [];
        }

        if (info.pbMingPai.length != 0) {
            for (var pbMjInfo of info.pbMingPai) {
                if (pbMjInfo.type === SECTION_TYPE.Peng) {
                    //var peng = [pbMjInfo.tile, pbMjInfo.tile, pbMjInfo.tile, -1, this.realSeat, 1];
                    this._mjpg.push(pbMjInfo.tile, pbMjInfo.tile, pbMjInfo.tile);
                }
                else if (pbMjInfo.type === SECTION_TYPE.BaGang) {
                    //var gang = [pbMjInfo.tile, pbMjInfo.tile, pbMjInfo.tile, pbMjInfo.tile, this.realSeat, 5];
                    this._mjpg.push(pbMjInfo.tile, pbMjInfo.tile, pbMjInfo.tile, pbMjInfo.tile);
                }
                else if (pbMjInfo.type === SECTION_TYPE.Chi) {
                    this._mjpg.push(pbMjInfo.tile, pbMjInfo.othertile);
                }
                else if (pbMjInfo.type === SECTION_TYPE.Tou) {
                    this._mjpg.push(pbMjInfo.tile, pbMjInfo.tile, pbMjInfo.tile);
                }
            }
        }
        else {
            this._mjpg = []
        }
    }

    clearCards() {
        this.cards = [];
        this.mjpg = [];
        this.outCard = [];
        this.menCard = [];
    }

    onReconnect() {
        if (this._cards.length != 0)
            MessageManager.getInstance().messagePost(ListenerType.cp_handCpChanged, { id: this._id })
        if (this._outCard.length != 0)
            MessageManager.getInstance().messagePost(ListenerType.cp_outCpChanged, { id: this._id })
        if (this._mjpg.length != 0)
            MessageManager.getInstance().messagePost(ListenerType.cp_pgChanged, { id: this._id })
    }


}
