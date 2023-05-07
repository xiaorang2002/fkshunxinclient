import { MessageManager } from "../../../framework/Manager/MessageManager";
import { ListenerType } from "../ListenerType";
import { Utils } from "../../../framework/Utils/Utils";
import { GameDataManager } from "../../../framework/Manager/GameDataManager";
import { GAME_STATE_MJ } from "./defines"

export class MjGameInfo {


    //亲友群id
    private _clubId: number = 0;
    /**亲友群id */
    public get clubId(): number {
        return this._clubId;
    }
    public set clubId(value: number) {
        this._clubId = value;
    }
    //房间id
    private _roomId: number = 0;
    /**房间id */
    public get roomId(): number {
        return this._roomId;
    }
    public set roomId(value: number) {
        this._roomId = value;
    }
    //房主id
    private _creator: number = 0;
    /**房主id */
    public get creator(): number {
        return this._creator;
    }
    public set creator(value: number) {
        this._creator = value;
        MessageManager.getInstance().messagePost(ListenerType.mj_ownerChanged, {id:this._creator})
    }
    //当前局数
    private _curRound: number = 0;
    /**当前局数 */
    public get curRound(): number {
        return this._curRound;
    }
    public set curRound(value: number) {
        this._curRound = value;
        MessageManager.getInstance().messagePost(ListenerType.mj_curRoundChange)
    }
    //庄家id
    private _dealerId: number = 0;
    public get dealerId(): number {
        return this._dealerId;
    }
    public set dealerId(value: number) {
        this._dealerId = value;
        MessageManager.getInstance().messagePost(ListenerType.mj_dealerChanged, {id:this._dealerId})
    }
    //当前操作玩家
    private _curOperateId: number = 0;
    /**当前操作玩家 */
    public get curOperateId(): number {
        return this._curOperateId;
    }
    public set curOperateId(value: number) {
        this._curOperateId = value;
        if (value != 0) {
            MessageManager.getInstance().messagePost(ListenerType.mj_curOperateChange, {id:this._curOperateId});
        }
    }
    //游戏状态
    private _gameState: GAME_STATE_MJ = 0;
    /**游戏状态 */
    public get gameState(): GAME_STATE_MJ {
        return this._gameState;
    }
    public set gameState(value: GAME_STATE_MJ) {
        this._gameState = value;
        MessageManager.getInstance().messagePost(ListenerType.mj_gameState);
    }
    /**剩余张数 */
    private _curOverplus: number = 0;
    /**剩余张数 */
    public get curOverplus(): number {
        return this._curOverplus;
    }
    public set curOverplus(value: number) {
        this._curOverplus = value;
        MessageManager.getInstance().messagePost(ListenerType.mj_curOverPlusChange, {num:this._curOverplus});
    }

    /**上个玩家id */
    private _lastOutPid: number = 0;
    public get lastOutPid(): number {
        return this._lastOutPid;
    }
    public set lastOutPid(value: number) {
        this._lastOutPid = value;
    }

    /**上玩家个出的牌 */
    private _lastOutMjId: number = 0;
    public get lastOutMjId(): number {
        return this._lastOutMjId;
    }
    public set lastOutMjId(value: number) {
        this._lastOutMjId = value;
    }
    /**上次摸得牌 */
    private _getMj: number = 0;
    public get getMj(): number {
        return this._getMj;
    }
    public set getMj(value: number) {
        this._getMj = value;
    }

    //游戏规则
    private _rule: any = null;
    /**游戏规则 */
    public get rule(): any {
        return this._rule;
    }
    public set rule(value: any) {
        this._rule = value;
    }

    /**游戏权限  碰什么的按钮 */
    private _state = new Map();
    /**游戏权限 */
    public get state(): any {
        return this._state;
    }
    public set state(value: any) {
        this._state = value;
        MessageManager.getInstance().messagePost(ListenerType.mj_PGHTipsRec);
    }
    
    private _isTingRule = true;
    public get isTingRule(): any {
        return this._isTingRule;
    }
    public set isTingRule(value: any) {
        this._isTingRule = value;
    }
    
    private _curRoundOverData: any = null;
    public get curRoundOverData(): any {
        return this._curRoundOverData;
    }
    public set curRoundOverData(value: any) {
        this._curRoundOverData = value;
    }

    private _curGameOverData: any = null;
    public get curGameOverData(): any {
        return this._curGameOverData;
    }
    public set curGameOverData(value: any) {
        this._curGameOverData = value;
    }

    /**当前选中的牌 */
    public _curSelectMj: any = null;
    public get curSelectMj(): any {
        return this._curSelectMj;
    }
    public set curSelectMj(value: any) {
        this._curSelectMj = value;
        MessageManager.getInstance().messagePost(ListenerType.mj_curMjSelectChanged, { selectId: this._curSelectMj });
    }

    /**当前已经选的牌 */
    private _curSelectOutMj: any = null;
    public get curSelectOutMj(): any {
        return this._curSelectOutMj;
    }
    public set curSelectOutMj(value: any) {
        this._curSelectOutMj = value;
    }
    
    /**当前的叫 */
    private _curJiao: any[] = [];
    public get curJiao(): any[] {
        return this._curJiao;
    }
    public set curJiao(value: any[]) {
        this._curJiao = value;
    }

    private _curJiaoTips: any[] = [];
    public get curJiaoTips(): any[] {
        return this._curJiaoTips;
    }
    public set curJiaoTips(value: any[]) {
        this._curJiaoTips = value;
    }

    /**是否点击听牌按钮 */
    private _isTingClick: boolean = false;
    public get isTingClick(): boolean {
        return this._isTingClick;
    }
    public set isTingClick(value: boolean) {
        this._isTingClick = value;
    }
    /**当前胡的牌的提示 */
    private _curMjTips = null;
    public get curMjTips() {
        return this._curMjTips;
    }
    public set curMjTips(value) {
        this._curMjTips = value;
    }
    /**杠牌检测数组 */
    public _curGang: any[] = [];
    public get curGang(): any[] {
        return this._curGang;
    }
    public set curGang(value: any[]) {
        this._curGang = value;
    }
    /**是否开始过游戏 */
    private _mBTableStarted: boolean = false;
    public get mBTableStarted(): boolean {
        return this._mBTableStarted;
    }
    public set mBTableStarted(value: boolean) {
        this._mBTableStarted = value;
    }
    //玩家倒计时
    public _time: number = 0;
    public get time(): number {
        return this._time
    }
    public set time(value: number) {
        this._time = value;
        MessageManager.getInstance().messagePost(ListenerType.operateTimeChange);
    }
   
    private _magicEmojiCost: any = null;
    public get magicEmojiCost(): any {
        return this._magicEmojiCost;
    }
    public set magicEmojiCost(value: any) {
        this._magicEmojiCost = value;
    }

    
    //大局id
    private _roundId = null;
    public get roundId() {
        return this._roundId;
    }
    public set roundId(value) {
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
            MessageManager.getInstance().messagePost(ListenerType.mj_curOperateChange, {id:this._curOperateId});
    }

}