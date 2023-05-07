import { MessageManager } from "../../../framework/Manager/MessageManager";
import { LogWrap } from "../../../framework/Utils/LogWrap";
import { ListenerType } from "../ListenerType";

export enum GAME_STATE_PDK {
    PER_BEGIN = 1,
    GAME_STATE_QIEPAI,
    GAME_STATE_GAME,
    GAME_BALANCE,
    GAME_CLOSE
}

//游戏信息
export class GameInfo_PDK {
    //亲友群id
    protected _clubId: number = 0;
    public get clubId(): number {
        return this._clubId;
    }
    public set clubId(value: number) {
        this._clubId = value;
    }
    //房间id
    protected _roomId: number = 0;
    public get roomId(): number {
        return this._roomId;
    }
    public set roomId(value: number) {
        this._roomId = value;
    }
    //房主id
    protected _creator: number = 0;
    public get creator(): number {
        return this._creator;
    }
    public set creator(value: number) {
        this._creator = value;
        MessageManager.getInstance().messagePost(ListenerType.pdk_ownerChanged, { id: this._creator })
    }

    //庄家id
    protected _dealerId: number = 0;
    public get dealerId(): number {
        return this._dealerId;
    }
    public set dealerId(value: number) {
        this._dealerId = value;
        MessageManager.getInstance().messagePost(ListenerType.pdk_dealerChanged, {id:this._dealerId})
    }

    //游戏是否开始
    protected _tableStarted: boolean = false;
    public get tableStarted(): boolean {
        return this._tableStarted;
    }
    public set tableStarted(value: boolean) {
        this._tableStarted = value;
    }
    //当前局数
    protected _curRound: number = 0;
    public get curRound(): number {
        return this._curRound;
    }
    public set curRound(value: number) {
        this._curRound = value;
        MessageManager.getInstance().messagePost(ListenerType.pdk_curRoundChange)
    }

    //当前操作玩家
    protected _curOperateId: number = 0;
    /**当前操作玩家 */
    public get curOperateId(): number {
        return this._curOperateId;
    }
    public set curOperateId(value: number) {
        this._curOperateId = value;
        if (value != 0) {
            MessageManager.getInstance().messagePost(ListenerType.pdk_curOperateChange, {id:this._curOperateId});
        }
    }

   //游戏状态
   protected _gameState = 0;
   /**游戏状态 */
   public get gameState() {
       return this._gameState;
   }
   public set gameState(value) {
       this._gameState = value;
       MessageManager.getInstance().messagePost(ListenerType.pdk_gameState);
   }

    //游戏规则
    protected _rule: any = null;
    public get rule() {
        return this._rule;
    }
    public set rule(value) {
        this._rule = value;
    }

    //上个操作玩家
    protected _lastPlayId: number = 0;
    public get lastPlayId(): number {
        return this._lastPlayId;
    }
    public set lastPlayId(value: number) {
        this._lastPlayId = value;
    }
    //提示牌型下标
    protected _curTipsIndex: number = -1;
    public get curTipsIndex(): number {
        return this._curTipsIndex;
    }
    public set curTipsIndex(value: number) {
        this._curTipsIndex = value;
    }
    //提示牌型数组
    protected _curTipsCardsArray: number[] = [];
    public get curTipsCardsArray(): number[] {
        return this._curTipsCardsArray;
    }
    public set curTipsCardsArray(value: number[]) {
        this._curTipsCardsArray = value;
    }
    /**单局结算数据 */
    protected _curRoundOverData: any = null;
    public get curRoundOverData(): any {
        return this._curRoundOverData;
    }
    public set curRoundOverData(value: any) {
        this._curRoundOverData = value;
    }
    /**游戏结束数据 */
    protected _curGameOverData: any = null;
    public get curGameOverData(): any {
        return this._curGameOverData;
    }
    public set curGameOverData(value: any) {
        this._curGameOverData = value;
    }

    protected _magicEmojiCost: any = null;
    public get magicEmojiCost(): any {
        return this._magicEmojiCost;
    }
    public set magicEmojiCost(value: any) {
        this._magicEmojiCost = value;
    }

    /**上个玩家id */
    protected _lastOutSeat: number = -1;
    public get lastOutSeat(): number {
        return this._lastOutSeat;
    }
    public set lastOutSeat(value: number) {
        this._lastOutSeat = value;
    }

    /**上玩家个出的牌 */
    protected _lastOutCards = [];
    public get lastOutCards() {
        return this._lastOutCards;
    }
    public set lastOutCards(value) {
        this._lastOutCards = value;
    }

    //玩家倒计时
    public _time: number = -1;
    public get time(): number {
        return this._time
    }
    public set time(value: number) {
        this._time = value;
        LogWrap.log("_time:",this._time)
        MessageManager.getInstance().messagePost(ListenerType.operateTimeChange);
    }

    /**是否开始过游戏 */
    protected _mBTableStarted: boolean = false;
    public get mBTableStarted(): boolean {
        return this._mBTableStarted;
    }
    public set mBTableStarted(value: boolean) {
        this._mBTableStarted = value;
    }

    //大局id
    private _roundId: number = 0;
    public get roundId(): number {
        return this._roundId;
    }
    public set roundId(value: number) {
        this._roundId = value;
    }

    public isDismissed = false;

    updateTableInfo(info)
    {
        this._clubId = info.clubId;
        this._roomId = info.tableId;
        this.rule = JSON.parse(info.rule);
        this._creator = info.owner
    }

    onReconnect()
    {
        if (this._curOperateId != 0)
            MessageManager.getInstance().messagePost(ListenerType.pdk_curOperateChange, {id:this._curOperateId});
    }

}


