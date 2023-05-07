import { MessageManager } from "../../../framework/Manager/MessageManager";
import { ListenerType } from "../ListenerType";

export enum GAME_STATE_NN {
    PER_BEGIN = 1,  //初始准备阶段
    STATE_ROB_BANKER,
    STATE_BIT,
    STATE_PLAY,
    STATE_GAMEOVER,
    STATE_FINAL_OVER
}

// 牌类型
export enum OX_CARD_TYPE {
	OX_CARD_TYPE_NIL						= 0,
	OX_CARD_TYPE_OX_NONE                    = 1,  //无牛
	OX_CARD_TYPE_OX_1                     	= 2,  //牛1
	OX_CARD_TYPE_OX_2 						= 3,  //牛2
	OX_CARD_TYPE_OX_3                     	= 4,  //牛3
	OX_CARD_TYPE_OX_4 						= 5,  //牛4
	OX_CARD_TYPE_OX_5                     	= 6,  //牛5
	OX_CARD_TYPE_OX_6 						= 7,  //牛6
	OX_CARD_TYPE_OX_7                     	= 8,  //牛7
	OX_CARD_TYPE_OX_8 						= 9,  //牛8
	OX_CARD_TYPE_OX_9                     	= 10,  //牛9
	OX_CARD_TYPE_OX_10                     	= 11,  //牛牛
	OX_CARD_TYPE_OX_SHUNZI					= 21,  //顺子牛
	OX_CARD_TYPE_OX_TONGHUA					= 22,  //同花牛
	OX_CARD_TYPE_OX_YINHUA					= 23,  //银花牛
	OX_CARD_TYPE_OX_JINHUA					= 24,  //金花牛 五花牛
	OX_CARD_TYPE_OX_HULU					= 25,  //胡芦牛
	OX_CARD_TYPE_OX_BOMB					= 26,  //炸弹牛
	OX_CARD_TYPE_OX_SMALL_5					= 27,  //5小牛
	OX_CARD_TYPE_OX_TONGHUASHUN				= 28,  //同花顺
}

export var OX_CARD_TYPE_TO_NAME  = {
	1                    : "没牛",  //无牛
	2                     	: "牛一",  //牛1
	3 						: "牛二",  //牛2
	5                     	: "牛三",  //牛3
	4 						: "牛四",  //牛4
	6                     	: "牛五",  //牛5
	7 						: "牛六",  //牛6
	8                     	: "牛七",  //牛7
	9 						: "牛八",  //牛8
	10                     	: "牛九",  //牛9
	11                     	: "牛牛",  //牛牛
	21					: "顺子牛",  //顺子牛
	22					: "同花牛",  //同花牛
	23					: "银花牛",  //银花牛
	24					: "金花牛",  //金花牛 五花牛
	25					: "胡芦牛",  //胡芦牛
	26					: "炸弹牛",  //炸弹牛
	27					: "5小牛",  //5小牛
	28				: "同花顺牛",  //同花顺
}


//游戏信息
export class GameInfo_NN {
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
        MessageManager.getInstance().messagePost(ListenerType.nn_ownerChanged, { id: this._creator })
    }

    //庄家id
    protected _dealerId: number = -1;
    public get dealerId(): number {
        return this._dealerId;
    }
    public set dealerId(value: number) {
        this._dealerId = value;
        MessageManager.getInstance().messagePost(ListenerType.nn_dealerChanged, {id:this._dealerId})
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
        MessageManager.getInstance().messagePost(ListenerType.nn_curRoundChange)
    }


    // //当前操作玩家
    // protected _curOperateId: number = 0;
    // /**当前操作玩家 */
    // public get curOperateId(): number {
    //     return this._curOperateId;
    // }
    // public set curOperateId(value: number) {
    //     this._curOperateId = value;
    //     if (value != 0) {
    //         MessageManager.getInstance().messagePost(ListenerType.nn_curOperateChange, {id:this._curOperateId});
    //     }
    // }

   //游戏状态
   protected _gameState = 0;
   /**游戏状态 */
   public get gameState() {
       return this._gameState;
   }
   public set gameState(value) {
       this._gameState = value;
       MessageManager.getInstance().messagePost(ListenerType.nn_gameState);
   }

    //游戏规则
    protected _rule: any = null;
    public get rule() {
        return this._rule;
    }
    public set rule(value) {
        this._rule = value;
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
        // if (this._curOperateId != 0)
        //     MessageManager.getInstance().messagePost(ListenerType.zjh_curOperateChange, {id:this._curOperateId});
    }

}


