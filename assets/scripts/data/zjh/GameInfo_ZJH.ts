import { MessageManager } from "../../../framework/Manager/MessageManager";
import { ListenerType } from "../ListenerType";

export enum GAME_STATE_ZJH {
    PER_BEGIN = 1,  //初始准备阶段
    STATE_PLAY,
    STATE_GAMEOVER,
    STATE_FINAL_OVER
}

//游戏信息
export class GameInfo_ZJH {
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
        MessageManager.getInstance().messagePost(ListenerType.zjh_ownerChanged, { id: this._creator })
    }

    //庄家id
    protected _dealerId: number = -1;
    public get dealerId(): number {
        return this._dealerId;
    }
    public set dealerId(value: number) {
        this._dealerId = value;
        MessageManager.getInstance().messagePost(ListenerType.zjh_dealerChanged, {id:this._dealerId})
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
        MessageManager.getInstance().messagePost(ListenerType.zjh_curRoundChange)
    }

    //当前轮数
    private _curLun: number = 0;
    public get curLun(): number {
        return this._curLun;
    }
    public set curLun(value: number) {
        this._curLun = value;
        MessageManager.getInstance().messagePost(ListenerType.zjh_LunChanged);
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
            MessageManager.getInstance().messagePost(ListenerType.zjh_curOperateChange, {id:this._curOperateId});
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
       MessageManager.getInstance().messagePost(ListenerType.zjh_gameState);
   }

    //游戏规则
    protected _rule: any = null;
    public get rule() {
        return this._rule;
    }
    public set rule(value) {
        this._rule = value;
    }

    //当前筹码下标
    private _curChipsIndex: number = 0;
    public get curChipsIndex(): number {
        return this._curChipsIndex;
    }
    public set curChipsIndex(value: number) {
        this._curChipsIndex = value;
    }

    //玩家下注分数
    private _allScore: number = 0;
    public get allScore(): number {
        return this._allScore;
    }
    public set allScore(value: number) {
        this._allScore = value;
        MessageManager.getInstance().messagePost(ListenerType.zjh_allScoreChanged,{});
    }

    //底分
    private _baseScore: number = 0;
    public get baseScore(): number {
        return this._baseScore;
    }
    public set baseScore(value: number) {
        this._baseScore = value;
        MessageManager.getInstance().messagePost(ListenerType.zjh_baseScoreChanged,{});
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


    //当前操作权限 PS:弃比看加跟
    private _curOperateControl: boolean[] = [false, false, false, false, false, false];// 0号位占位 123456 加注，弃牌，看牌，孤注一掷，比牌，跟注
    public get curOperateControl(): boolean[] {
        return this._curOperateControl;
    }
    public set curOperateControl(value: boolean[]) {
        this._curOperateControl = value;
    }

    //房间筹码数组(用于重连)
    private _chipsArray= [];
    public get chipsArray() {
        return this._chipsArray;
    }
    public set chipsArray(value) {
        this._chipsArray = value;
    }

    /**单局结算数据 */
    protected _curRoundOverData: any = null;
    public get curRoundOverData(): any {
        return this._curRoundOverData;
    }
    public set curRoundOverData(value: any) {
        this._curRoundOverData = value;
    }

    //玩家倒计时
    public _time = -1;
    public get time() {
        return this._time
    }
    public set time(value) {
        this._time = value;
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
            MessageManager.getInstance().messagePost(ListenerType.zjh_curOperateChange, {id:this._curOperateId});
    }

}


