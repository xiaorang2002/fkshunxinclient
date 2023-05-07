import { GameInfo_PDK } from './../game_pdk/GameInfo_PDK';
import { MessageManager } from "../../../framework/Manager/MessageManager";
import { ListenerType } from "../ListenerType";

export enum GAME_STATE_DDZ {
    PER_BEGIN = 1,
    GAME_STATE_QIEPAI,
    GAME_STATE_CALL,
    GAME_STATE_GAME,
    GAME_BALANCE,
    GAME_CLOSE
}

//游戏信息
export class GameInfo_DDZ extends GameInfo_PDK {

    //游戏状态
    protected _gameState = 0;
    /**游戏状态 */
    public get gameState() {
        return this._gameState;
    }
    public set gameState(value) {
        this._gameState = value;
        MessageManager.getInstance().messagePost(ListenerType.ddz_gameState);
    }

    // 3张底牌
    protected _landlordIdCards = []
    public get landlordIdCards() {
        return this._landlordIdCards;
    }
    public set landlordIdCards(value) {
        this._landlordIdCards = value;
        MessageManager.getInstance().messagePost(ListenerType.ddz_landlordCardsChange);
    }

    //游戏倍数
    protected _multiple: number = 1;
    public get multiple(): number {
        return this._multiple;
    }
    public set multiple(value: number) {
        this._multiple = value;
        MessageManager.getInstance().messagePost(ListenerType.ddz_multipleChange);
    }

    //游戏底分
    protected _baseScore: number = 1;
    public get baseScore(): number {
        return this._baseScore;
    }
    public set baseScore(value: number) {
        this._baseScore = value;
        MessageManager.getInstance().messagePost(ListenerType.ddz_baseScoreChange);
    }

    //地主chai_id
    protected _landlordId: number = 0;
    public get landlordId(): number {
        return this._landlordId;
    }
    public set landlordId(value: number) {
        this._landlordId = value;
        MessageManager.getInstance().messagePost(ListenerType.ddz_landlordIdChange, {});
    }

    protected _landlordInfo = {0:0,1:0,2:0,3:0} // 叫地主信息
    public get landlordInfo(): any {
        return this._landlordInfo;
    }
    public set landlordInfo(value: any) {
        this._landlordInfo = value;
    }

    //当前叫地主的座位
    protected _curCallSeat: number = -1;
    public get curCallSeat(): number {
        return this._curCallSeat;
    }
    public set curCallSeat(value: number) {
        this._curCallSeat = value;
    }

}