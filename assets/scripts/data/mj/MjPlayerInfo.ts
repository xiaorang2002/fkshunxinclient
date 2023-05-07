import { Utils } from './../../../framework/Utils/Utils';
import { SECTION_TYPE } from './defines';
import { MessageManager } from "../../../framework/Manager/MessageManager";
import { ListenerType } from "../ListenerType";

export class MjPlayerInfo {



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
        MessageManager.getInstance().messagePost(ListenerType.mj_onTrusteeChanged, { id: this._id });
    }

    /**是否听牌 */
    private _istinged: boolean = false;
    public get istinged(): boolean {
        return this._istinged;
    }
    public set istinged(value: boolean) {
        this._istinged = value
        MessageManager.getInstance().messagePost(ListenerType.mj_playedTing, { id: this._id });
    }

    /**是否闷牌 */
    private _isMened: boolean = false;
    public get isMened(): boolean {
        return this._isMened;
    }
    public set isMened(value: boolean) {
        this._isMened = value
        MessageManager.getInstance().messagePost(ListenerType.mjzj_playedMen, { id: this._id });
    }

    //玩家分数(亲友群中表示输的分数，联盟中表示玩家当前拥有的积分)
    private _score: number = 0;
    public get score(): number {
        return this._score;
    }
    public set score(value: number) {
        this._score = value / 100;
        MessageManager.getInstance().messagePost(ListenerType.mj_playerScoreChanged, { id: this._id });

    }

    // 游戏分数，纯显示总用，用于给亲友群计分
    private _clubScore: number = 0
    public get clubScore(): number {
        return this._clubScore;
    }
    public set clubScore(value: number) {
        this._clubScore = value;
        MessageManager.getInstance().messagePost(ListenerType.mj_playerScoreChanged, { id: this._id });
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
        this._cards = Utils.sortHandCardByQue(this.dqType, value)
        MessageManager.getInstance().messagePost(ListenerType.mj_handMjChanged, { id: this._id })
    }

    //玩家出牌
    private _outCard: number[] = [];
    public get outCard(): number[] {
        return this._outCard;
    }
    public set outCard(value: number[]) {
        this._outCard = value
        MessageManager.getInstance().messagePost(ListenerType.mj_outMjChanged, { id: this._id })
    }

    /**碰杠数组 */
    private _mjpg: Array<any> = []
    public get mjpg(): Array<any> {
        return this._mjpg;
    }
    public set mjpg(value: Array<any>) {
        this._mjpg = value;
        MessageManager.getInstance().messagePost(ListenerType.mj_pgChanged, { id: this._id })
    }

    private _menCard: Array<any> = []
    public get menCard(): Array<any> {
        return this._menCard;
    }
    public set menCard(value: Array<any>) {
        this._menCard = value;
        MessageManager.getInstance().messagePost(ListenerType.mjzj_menChanged, { id: this._id })
    }

    // 胡的所有牌
    private _huPaiList = []
    public get huPaiList() {
        return this._huPaiList;
    }
    public set huPaiList(value) {
        this._huPaiList = value;

    }


    //---------------------------------------------血战属性-------------------------------
    //是否换牌
    private _exchanged: boolean = false;
    public get exchanged(): boolean {

        return this._exchanged;
    }
    public set exchanged(value: boolean) {
        if (value)
            this._exchanged = value;
        else
            this._exchanged = false
    }

    //选中的换牌
    private _selectHp = [];
    public get selectHp() {
        return this._selectHp;
    }
    public set selectHp(value) {
        this._selectHp = value;
    }

    //收到的换牌
    private _receiveHp = [];
    public get receiveHp() {
        return this._receiveHp;
    }
    public set receiveHp(value) {
        this._receiveHp = value;
    }

    //是否定缺
    private _isDq: boolean = false;
    public get isDq(): boolean {
        return this._isDq;
    }
    public set isDq(value: boolean) {
        if (value)
            this._isDq = value;
        else
            this._isDq = false
    }

    //是否已经操作飘了
    private _isPiao: boolean = false;
    public get isPiao(): boolean {
        return this._isPiao;
    }
    public set isPiao(value: boolean) {
        if (value)
            this._isPiao = value;
        else
            this._isPiao = false
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

    //定缺门
    public _dqType: number = -1;
    public get dqType(): number {
        return this._dqType;
    }
    public set dqType(value: number) {
        if (value)
            this._dqType = value;
        else
            this._dqType = 0
    }


    //----------------------------------------------------------------------------------------------------------

    public _guMaiScore = -1;
    public get guMaiScore() {
        return this._guMaiScore;
    }
    public set guMaiScore(value) {
        this._guMaiScore = value;
        MessageManager.getInstance().messagePost(ListenerType.mjzj_guMaiScoreChange, { id: this._id })
    }
    public _piaoScore = -1;
    public get piaoScore() {
        return this._piaoScore;
    }
    public set piaoScore(value) {
        this._piaoScore = value;
    }

    public _baoTingResult = false;
    public get baoTingResult() {
        return this._baoTingResult;
    }
    public set baoTingResult(value) {
        this._baoTingResult = value;
    }

    //是否可以报听
    public _canBaoTing = -1;
    public get canBaoTing() {
        return this._canBaoTing;
    }
    public set canBaoTing(value) {
        this._canBaoTing = value;
    }

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

    updatePlayerInfoOnStart(info, laiziValue) {
        this.istinged = info.isTing;
        if (info.deskPai.length != 0) {
            this._outCard = info.deskPai
        }
        else {
            this._outCard = [];
        }
        if (info.shouPai.length != 0) {
            var mopai = false
            if (info.moPai && info.shouPai.indexOf(info.moPai) != -1 && info.shouPai.length % 3 == 2) {
                mopai = true
                info.shouPai.splice(info.shouPai.indexOf(info.moPai), 1)
            }
            this._cards = Utils.sortHandCardByQue(this.dqType, info.shouPai)
            if (mopai)
                this._cards.push(info.moPai)
        }
        else {
            this._cards = [];
        }
        if (info.pbMingPai.length != 0) {
            for (var pbMjInfo of info.pbMingPai) {
                if (pbMjInfo.type === SECTION_TYPE.Peng) {
                    var peng = [pbMjInfo.tile, pbMjInfo.tile, pbMjInfo.tile, -1, this.realSeat, 1];
                    this._mjpg.push(peng);
                }
                else if (pbMjInfo.type === SECTION_TYPE.MingGang) {
                    var gang = [
                        pbMjInfo.tile, pbMjInfo.tile, pbMjInfo.tile, pbMjInfo.tile, this.realSeat, 2];
                    this._mjpg.push(gang);
                }
                else if (pbMjInfo.type === SECTION_TYPE.BaGang || pbMjInfo.type === SECTION_TYPE.FreeBaGang) {
                    var gang = [
                        pbMjInfo.tile, pbMjInfo.tile, pbMjInfo.tile, pbMjInfo.tile, this.realSeat, 5];
                    this._mjpg.push(gang);
                }
                else if (pbMjInfo.type === SECTION_TYPE.AnGang || pbMjInfo.type === SECTION_TYPE.FreeAnGang) {
                    var gang = [pbMjInfo.tile, pbMjInfo.tile, pbMjInfo.tile, pbMjInfo.tile, this.realSeat, 6];
                    this._mjpg.push(gang);
                }
                else if (pbMjInfo.type === SECTION_TYPE.RuanPeng) {
                    var raunPeng = [];
                    for (var i = 0; i < pbMjInfo.substituteNum; i++)
                        raunPeng.push(laiziValue)
                    for (var i = 0; i < 3 - pbMjInfo.substituteNum; i++)
                        raunPeng.push(pbMjInfo.tile)
                    raunPeng.push(-1)
                    raunPeng.push(this.realSeat)
                    raunPeng.push(13)
                    this._mjpg.push(raunPeng);

                }
                else if (pbMjInfo.type === SECTION_TYPE.RuanAnGang || pbMjInfo.type === SECTION_TYPE.RuanMingGang || pbMjInfo.type === SECTION_TYPE.RuanBaGang) {
                    var raunGang = [];
                    for (var i = 0; i < pbMjInfo.substituteNum; i++)
                        raunGang.push(laiziValue)
                    for (var i = 0; i < 4 - pbMjInfo.substituteNum; i++)
                        raunGang.push(pbMjInfo.tile)
                    var type = 0
                    if (pbMjInfo.type === SECTION_TYPE.RuanAnGang)
                        type = 15
                    else if (pbMjInfo.type === SECTION_TYPE.RuanMingGang)
                        type = 14
                    else
                        type = 16
                    raunGang.push(this.realSeat)
                    raunGang.push(type)
                    this._mjpg.push(raunGang);
                }
            }
        }
        else {
            this._mjpg = []
        }
        if (info.menPai.length != 0) {
            this._menCard = info.menPai
            this.isMened = true

        }
        else {
            this._menCard = [];
        }
    }


    updateGuMaiScore(score) {
        this.guMaiScore = score
    }

    clearCards() {
        this._cards = [];
        this._mjpg = [];
        this._outCard = [];
        this._menCard = [];
    }

    // ------------------------------------------------ 血战接口---------------------------------------------
    // 换牌之后更新手牌
    updateMjFromHp() {
        if (this._selectHp.length == 0 || this._receiveHp.length == 0)
            return
        for (var j = 0; j < this._selectHp.length; ++j) {
            var index = this._cards.indexOf(this._selectHp[j])
            this._cards.splice(index, 1)
        }
        this._selectHp = []
        this._cards = this._cards.concat(this._receiveHp)
        this._cards = Utils.sortHandCardByQue(this.dqType, this._cards)
        MessageManager.getInstance().messagePost(ListenerType.mj_handMjChanged, { id: this._id })
    }

    // 用于检查万筒条按钮会不会亮起
    checkCardColor() {
        var result = [0, 0, 0] // 0代表闪烁 1标识亮起 2标识变灰
        var num = [0, 0, 0]
        for (var mjid of this.cards) {
            if (mjid < 10) // 万
            {
                num[0] += 1
                result[0] = 1
            }
            else if (mjid < 20)// 筒
            {
                num[1] += 1
                result[1] = 1
            }
            else {
                num[2] += 1
                result[2] = 1
            }
        }
        var max = 0
        var type = 0
        for (var idx = 0; idx < num.length; idx++) {
            if (num[idx] > max) {
                max = num[idx]
                type = idx
            }
        }
        num[type] = 0
        var second = 0
        var typeSe = 0
        for (var idx = 0; idx < num.length; idx++) {
            if (num[idx] > second) {
                second = num[idx]
                typeSe = idx
            }
        }
        // if (max - second >= 2) // 最多的花色比第二多的花色多两张以上，则最多的花色按钮将会置灰
        // {
        //     result[type] = 2
        // }
        return result
    }




    onReconnect() {
        if (this._cards.length != 0)
            MessageManager.getInstance().messagePost(ListenerType.mj_handMjChanged, { id: this._id })
        if (this._outCard.length != 0)
            MessageManager.getInstance().messagePost(ListenerType.mj_outMjChanged, { id: this._id })
        if (this._mjpg.length != 0)
            MessageManager.getInstance().messagePost(ListenerType.mj_pgChanged, { id: this._id })
    }


}
