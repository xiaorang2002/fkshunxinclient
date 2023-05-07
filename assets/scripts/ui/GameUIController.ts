import { GAME_STATE_NN } from './../data/nn/GameInfo_NN';
import { TimeOutUI } from './TimeOutUI';
import { GameUIRepeatMsgManage } from './GameUIRepeatMsgManage';
import { Wait2UI } from './Wait2UI';
import { MessageManager } from './../../framework/Manager/MessageManager';
import { GAME_STATE_ZJH } from './../data/zjh/GameInfo_ZJH';
import { GameUI_ZJH } from './objects/zjh/GameUI_ZJH';
import { GAME_STATE_DDZ } from './../data/ddz/GameInfo_DDZ';
import { GAME_STATE_PDK } from './../data/game_pdk/GameInfo_PDK';
import { CardEffect } from './objects/pdk/CardEffect';
import { GameUI_PDK } from './objects/pdk/GameUI_PDK';
import { GameUI_PlayerInfo_PDK } from './objects/pdk/GameUI_PlayerInfo_PDK';
import { GAME_TYPE } from './../data/GameConstValue';
import { GAME_STATE_MJ } from './../data/mj/defines';
import { GameDataManager } from './../../framework/Manager/GameDataManager';
import { UIManager } from './../../framework/Manager/UIManager';
import { GameUI_TopInfo } from './GameUI_TopInfo';
import { GameUI_PlayerInfo } from './objects/mj/GameUI_PlayerInfo';
import { GameUI_MJ } from './objects/mj/GameUI_MJ';
import { GameUI_NN } from './objects/nn/GameUI_NN';
import { GameUI_CP } from './objects/cp/GameUI_CP';
import { GAME_STATE_CP } from './../data/cp/cpDefines';
import { GameUI_PlayerInfo_CP } from './objects/cp/GameUI_PlayerInfo_CP';



/*
游戏ui管理器
*/
export class GameUIController {

    private static instance: GameUIController;
    public static getInstance(): GameUIController {
        if (this.instance == null)
            this.instance = new GameUIController();

        return this.instance;
    }

    private gameObjDict = {
        0: [GameUI_MJ, GameUI_PlayerInfo, GameUI_TopInfo],  // 麻将ui的组成主体，包含顶部ui，玩家ui，牌桌ui
        1: [GameUI_PDK, GameUI_PlayerInfo_PDK, GameUI_TopInfo],  // PDkui的组成主体，包含顶部ui，玩家ui，牌桌ui
        2: [GameUI_ZJH],    // zjh主体
        3: [GameUI_NN],   // nn主体
        4: [GameUI_CP, GameUI_PlayerInfo_CP, GameUI_TopInfo],  // 长牌ui的组成主体，包含顶部ui，玩家ui，牌桌ui
    }
    private _gameType = 0           // 游戏类型
    private _loadFinishCount = 0    // 是否ui加载完毕
    private _isReconnect = false    // 是否是重连
    private _firstStartGame = false    // 是否是首次加载场景
    private _loadSuccess = false

    public startGameByType(gameType, isReconnect = false, isFirstStartGame = true) {
        GameUIRepeatMsgManage.getInstance().clearMsgLimitMap()
        this._gameType = gameType
        this._firstStartGame = isFirstStartGame
        this._loadSuccess = false
        this._loadFinishCount = 0
        var uiList = this.gameObjDict[this.getUIIdxByType(gameType)]
        var zOrder = 1
        this._isReconnect = isReconnect
        UIManager.getInstance().openUI(TimeOutUI, 99)

        for (var uiClass of uiList) {
            UIManager.getInstance().openUI(uiClass, zOrder, this.onLoadFinish.bind(this))
            zOrder += 1
        }
    }

    private onLoadFinish() {
        this._loadFinishCount += 1
        var uiList = this.gameObjDict[this.getUIIdxByType(this._gameType)]
        var uiCount = uiList.length
        if (this._loadFinishCount == uiCount) {
            try {
                for (var uiClass of uiList) {
                    var ui = UIManager.getInstance().getUI(uiClass)
                    ui.getComponent(ui.tag.className).onDataRecv()
                }
            }
            catch (e) // 初始化失败
            {
                // 重新加载
                UIManager.getInstance().closeUIExceptWhiteList([TimeOutUI]);
                this.startGameByType(this._gameType, this._isReconnect, this._firstStartGame)
            }
            this._loadFinishCount = 0
            this._loadSuccess = true
            UIManager.getInstance().closeUI(TimeOutUI)
            if (this._firstStartGame) {
                if (this._gameType == GAME_TYPE.LRPDK || this._gameType == GAME_TYPE.PDK)
                    GameDataManager.getInstance().getDataByCurGameType().setGameState(GAME_STATE_PDK.PER_BEGIN) // 刷新一遍当前的游戏状态
                else if (this._gameType == GAME_TYPE.DDZ)
                    GameDataManager.getInstance().getDataByCurGameType().setGameState(GAME_STATE_DDZ.PER_BEGIN)
                else if (this._gameType == GAME_TYPE.ZJH)
                    GameDataManager.getInstance().getDataByCurGameType().setGameState(GAME_STATE_ZJH.PER_BEGIN)
                else if (this._gameType == GAME_TYPE.NN)
                    GameDataManager.getInstance().getDataByCurGameType().setGameState(GAME_STATE_NN.PER_BEGIN)
                else if (this._gameType == GAME_TYPE.ZGCP)
                    GameDataManager.getInstance().getDataByCurGameType().setGameState(GAME_STATE_CP.PER_BEGIN)
                else
                    GameDataManager.getInstance().getDataByCurGameType().setGameState(GAME_STATE_MJ.PER_BEGIN)
                this._firstStartGame = false

            }
            // 重连需要model层通知view更新数据
            if (this._isReconnect) {
                GameDataManager.getInstance().getDataByCurGameType().onReconnect()
                this._isReconnect = false
            }
            MessageManager.getInstance().disposeMsg();
        }
    }

    public closeCurGameUI() {
        if (this._gameType <= 0)
            return
        var uiList = this.gameObjDict[this.getUIIdxByType(this._gameType)]
        this._gameType = 0
        GameDataManager.getInstance().clearCurGameData()
        for (var uiClass of uiList)
            UIManager.getInstance().closeUI(uiClass)
    }

    public preloadGameUIByType(gameType) {
        // var uiList = this.gameObjDict[0]
        // for (var uiClass of uiList)
        // {
        //     UIManager.getInstance().preLoadUI(uiClass)
        // }
        UIManager.getInstance().preLoadUI(CardEffect)
        UIManager.getInstance().preLoadUI(Wait2UI)
        UIManager.getInstance().preLoadUI(TimeOutUI)
    }

    // 是否当前游戏开始
    public isGameStart(gameType) {
        var count = 0
        var uiList = this.gameObjDict[this.getUIIdxByType(gameType)]
        for (var index = 0; index < uiList.length; index++) {
            if (UIManager.getInstance().getUI(uiList[index]))
                count += 1
        }
        return count == uiList.length && this._loadSuccess
    }

    // 关闭其它所有ui，保留游戏ui
    public closeOtherUIshowCurGameUI(gameType) {
        this._gameType = gameType
        var uiList = this.gameObjDict[this.getUIIdxByType(gameType)]
        UIManager.getInstance().closeUIExceptWhiteList(uiList)
        for (var uiClass of uiList)
            UIManager.getInstance().showUI(uiClass)
    }

    // 在切后台重连回来之后需要重新加载数据
    public resetDataOnBack() {
        if (this._gameType <= 0)
            return
        var uiList = this.gameObjDict[this.getUIIdxByType(this._gameType)]
        for (var uiClass of uiList) {
            var ui = UIManager.getInstance().getUI(uiClass)
            ui.getComponent(ui.tag.className).resetDataOnBack()
        }
    }

    private getUIIdxByType(gameType) {
        if (gameType == GAME_TYPE.LRPDK || gameType == GAME_TYPE.PDK || gameType == GAME_TYPE.DDZ || gameType == GAME_TYPE.SCPDK)
            return 1
        else if (gameType == GAME_TYPE.ZJH)
            return 2
        else if (gameType == GAME_TYPE.NN)
            return 3
        else if (gameType == GAME_TYPE.ZGCP)
            return 4
        else
            return 0
    }

    // 收到切换后台的事件
    public onEventHideRec() {
        this._loadFinishCount = -1

        if (this._gameType <= 0)
            return
        var uiList = this.gameObjDict[this.getUIIdxByType(this._gameType)]
        for (var index = 0; index < uiList.length; index++) {
            var ui = UIManager.getInstance().getUI(uiList[index])
            if (ui)
                ui.getComponent(ui.tag.className).onEventHideRec()
        }
    }

}