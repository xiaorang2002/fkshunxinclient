import { GameManager } from './../../../GameManager';
import { ReddotData } from './../../../data/ReddotData';
import { GAME_STATE_DDZ } from './../../../data/ddz/GameInfo_DDZ';
import { GAME_TYPE } from './../../../data/GameConstValue';
import { GAME_STATE_PDK } from '../../../data/game_pdk/GameInfo_PDK';
import { Utils } from '../../../../framework/Utils/Utils';
import { BaseUI } from "../../../../framework/UI/BaseUI";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { AudioManager } from "../../../../framework/Manager/AudioManager";
import TuoGuanUI from '../../TuoGuanUI';

const { ccclass, property } = cc._decorator;

@ccclass
export default class PdkRoundOver_UI extends BaseUI {

    protected static className = "PdkRoundOver_UI";

    private _gameData = null;   
    private isUnion = false
    private time = 15
    private isPlayBackUI = false
    @property({ type: [cc.Color] })
    colorArg: Array<cc.Color> = [];
    @property({ type: [cc.Color] })
    totoalScoreArg: Array<cc.Color> = [];
    @property({ type: [cc.SpriteFrame] })
    spArg: Array<cc.SpriteFrame> = [];
    private win_index = 0
    private lose_index = 2
    private win_title_index = 4
    private lost_title_index = 5
    private _index = 0

    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_PDK_DIR + this.className;
    }

    onLoad() {
        
    }

    start() {

    }
    
    onDestroy() {
        super.onDestroy();
    }


    loop()
    {   
        if (this.time > 0)
        {
            this.time -= 1
            this.node.getChildByName("time").getComponent(cc.Label).string =  this.time + "s"
        }
        else
        {
            this.unschedule(this.loop)
        }
    }

    commonInitView()
    {
        try{
            var gameData = GameDataManager.getInstance().getDataByCurGameType()
            if (gameData == null)
            {
                GameManager.getInstance().handReconnect()
                return
            }
            var info = gameData.gameinfo.curRoundOverData;
            this.updateViewByGameType()
            var gameType =  GameDataManager.getInstance().curGameType
            this.initLayer(info.playerBalance, gameData.overTempPlayerInfo, gameData.gameinfo.rule, gameType)
            this.initRule(gameData.gameinfo.rule, gameType)
            if (UIManager.getInstance().getUI(TuoGuanUI) && gameData.gameinfo.curGameOverData == null)
            {
                this.continue_button()
                return
            }
            if (UIManager.getInstance().getUI(TuoGuanUI) && gameData.gameinfo.curGameOverData != null)
                UIManager.getInstance().closeUI(TuoGuanUI)
            if (gameData.gameinfo.time != 0)
                this.time = gameData.gameinfo.time-2
            this.schedule(this.loop, 1, this.time);
            this.node.getChildByName("time").getComponent(cc.Label).string = this.time + "s"
            this.node.getChildByName("label_time").getComponent(cc.Label).string = Utils.getTimeString(GameDataManager.getInstance().systemData.severTime)
        }
        catch (e)
        {
            GameManager.getInstance().handReconnect()
        }
    }

    iniViewByPlayBack(info, playerInfoMap, rule, gameType, startTime)
    {
        this.isPlayBackUI = true
        this.node.getChildByName("time").getComponent(cc.Label).string = ""
        this.initLayer(info, playerInfoMap, rule, gameType)
        this.initRule(rule, gameType)
        this.node.getChildByName("label_time").getComponent(cc.Label).string = Utils.getTimeString(startTime*1000)

    }

    iniViewByPlayBackDdz(info, playerInfoMap, rule, gameType, startTime)
    {
        this.isPlayBackUI = true
        this.node.getChildByName("time").getComponent(cc.Label).string = ""
        this.node.getChildByName("label_title2").getComponent(cc.Label).string = "底分"
        this.node.getChildByName("label_title3").getComponent(cc.Label).string = "倍数"
        this.initLayer(info, playerInfoMap, rule, GAME_TYPE.DDZ)
        this.initRule(rule, GAME_TYPE.DDZ)
        this.node.getChildByName("label_time").getComponent(cc.Label).string = Utils.getTimeString(startTime*1000)
    }

    updateViewByGameType()
    {
        var title2 = "剩余牌数"
        var title3 = "炸弹得分"
        var gameType =  GameDataManager.getInstance().curGameType
        if (gameType == GAME_TYPE.DDZ)
        {
            title2 = "底分"
            title3 = "倍数"
        }
        this.node.getChildByName("label_title2").getComponent(cc.Label).string = title2
        this.node.getChildByName("label_title3").getComponent(cc.Label).string = title3

    }


    /**初始化 */
    initLayer(playerBalance, playerInfoMap, rule, gameType) {
        this.checkIsUnion(rule)
        for (var seat = 0; seat < 4; ++seat)
            this.node.getChildByName("player"+seat).active = false
        var maxScore = 0;
        var idx = 0
        for (var balanceInfo of playerBalance) {
            var roundScore = balanceInfo.roundScore
            if (!roundScore)
                roundScore = 0
            if (roundScore > maxScore)
                maxScore = roundScore;
            var playerNode = this.node.getChildByName("player"+idx)
            playerNode.active = true
            idx += 1
            var win = false
            if (gameType == GAME_TYPE.DDZ)
                win = balanceInfo.roundScore > 0       // 斗地主是单局得分为正才算赢
            else
                win = balanceInfo.handCards.length == 0 // 跑得快是牌打完了才算赢
            this._index = win?this.win_index:this.lose_index
            if (balanceInfo.chairId == playerInfoMap.get(0).seat) {
              
                this.node.getChildByName("sp_title_defeat").active = !win;
                this.node.getChildByName("sp_title_win").active = win;
                playerNode.getChildByName("sp_game_score_self").active = true;
                playerNode.getChildByName("sp_game_score_self").getComponent(cc.Sprite).spriteFrame = this.spArg[this._index]
                playerNode.getChildByName("sp_game_score_self").getChildByName("sp_game_score_self").getComponent(cc.Sprite).spriteFrame = this.spArg[this._index]
                let color_index = win?this.win_title_index:this.lost_title_index
                this.node.getChildByName("label_title1").color = this.colorArg[color_index]
                this.node.getChildByName("label_title2").color = this.colorArg[color_index]
                this.node.getChildByName("label_title3").color = this.colorArg[color_index]
                this.node.getChildByName("label_title4").color = this.colorArg[color_index]
                this.node.getChildByName("label_rule").color = this.colorArg[color_index]
                this._index++
            }
            var nickName = ""
            playerInfoMap.forEach((infoObj, seat)=>{
                if (infoObj.seat == balanceInfo.chairId)
                    nickName = infoObj.name
            })

            var stringScore = 0
            if (this.isUnion)
                stringScore = balanceInfo.roundMoney/100
            else
                stringScore = roundScore
            var labelScore = playerNode.getChildByName("label_total").getComponent(cc.Label)
            labelScore.string = stringScore.toString();
           
            if(stringScore < 0)
            {
                labelScore.node.color = this.totoalScoreArg[1]
            }else{
                labelScore.node.color = this.totoalScoreArg[0]
                labelScore.string = "+"+labelScore.string
            }

            playerNode.getChildByName("label_name").getComponent(cc.Label).string = Utils.getShortName(nickName,10) 
            if(gameType == GAME_TYPE.DDZ)
            {
                playerNode.getChildByName("label_boom").getComponent(cc.Label).string = balanceInfo.times
                playerNode.getChildByName("label_card").getComponent(cc.Label).string = balanceInfo.baseScore
            }
            else
            {
                playerNode.getChildByName("label_boom").getComponent(cc.Label).string = balanceInfo.bombScore
                playerNode.getChildByName("label_card").getComponent(cc.Label).string = balanceInfo.handCards.length.toString()
            }
            if(this._index >= this.colorArg.length)
            {
                this._index = 0
            }
            playerNode.getChildByName("label_name").color = this.colorArg[this._index]
            playerNode.getChildByName("label_boom").color = this.colorArg[this._index]
            playerNode.getChildByName("label_card").color = this.colorArg[this._index]
        }
        this.node.active = true;
    }

    private initRule(oRule, gameType)
    {
        var info = {rule:JSON.stringify(oRule), gameType:gameType}
        var rule1 = Utils.getBase(info);
        var rule2 = Utils.getRule(info);
        this.node.getChildByName("label_rule").getComponent(cc.Label).string = "玩法：" + rule1 + " " + rule2;
        if(oRule.union && oRule.union.score_rate)
            this.node.getChildByName("label_basescore").getComponent(cc.Label).string = "底分：" + oRule.union.score_rate;
    }

    checkIsUnion(oRule)
    {
        if (oRule.union)
            this.isUnion = true
        else
            this.isUnion = false    
    }

    
    //继续游戏按钮
    continue_button() {
        AudioManager.getInstance().playSFX("button_click")
        if (this.isPlayBackUI)
        {
            UIManager.getInstance().closeUI(PdkRoundOver_UI);
            
        }
        else
        {
            UIManager.getInstance().closeUI(PdkRoundOver_UI);
            var gameData = GameDataManager.getInstance().getDataByCurGameType()
            if (gameData == null)
            {
                GameManager.getInstance().handReconnect()
                return
            }
            gameData.cleanRoundOver();
            if(GameDataManager.getInstance().curGameType == GAME_TYPE.DDZ){
                if (gameData.gameinfo.curGameOverData == null)
                    gameData.setGameState(GAME_STATE_DDZ.PER_BEGIN);
                else 
                    gameData.setGameState(GAME_STATE_DDZ.GAME_CLOSE);
            }
            else
            {
                if (gameData.gameinfo.curGameOverData == null)
                    gameData.setGameState(GAME_STATE_PDK.PER_BEGIN);
                else 
                    gameData.setGameState(GAME_STATE_PDK.GAME_CLOSE);
            }
            
        }
    }

    button_return()
    {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().closeUI(PdkRoundOver_UI);
    }


}
