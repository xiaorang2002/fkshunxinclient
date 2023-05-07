import { GAME_NAME, GAME_TYPE } from './../../../data/GameConstValue';
import { Utils } from './../../../../framework/Utils/Utils';
import { GameUIController } from './../../GameUIController';
import { GameUI_CP } from './GameUI_CP';
import { BaseUI } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { HallUI } from "../../HallUI";
import { AudioManager } from "../../../../framework/Manager/AudioManager";
import { MessageManager } from "../../../../framework/Manager/MessageManager";
import * as Proto from "../../../../proto/proto-min";
import { ThirdSelectUI } from "../../ThirdSelectUI";
import CpRoundOver_UI from './CpRoundOver_UI';
import { GameData_ZGCP } from '../../../data/cp/GameData_ZGCP';
import { GAME_STATE_CP } from '../../../data/cp/cpDefines';


const { ccclass, property } = cc._decorator;

@ccclass
export default class CpGameOver_UI extends BaseUI {

    protected static className = "CpGameOver_UI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_CP_DIR + this.className;
    }

    private _clubid = 0;
    private isUnion = false
    private isDismissed = false

    
    @property({ type: [cc.SpriteFrame] })
    spWinBg: Array<cc.SpriteFrame> = [];

    onLoad() {
        
    }
    
    start() {
        this.initUI();
    }
    initUI() {
        var gameData:GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType()
        var gameoverInfo =  gameData.gameinfo.curGameOverData
        gameData.gameinfo.curGameOverData = null
        this.isDismissed = gameData.gameinfo.isDismissed
        this.checkIsUnion()
        //var tempList = []
        this._clubid = gameData.gameinfo.clubId
        let win_max_score = -1 // 赢钱最多的人的钱
        for (var index = 0; index < gameoverInfo.playerScores.length; index++) {
            const element = gameoverInfo.playerScores[index];
            win_max_score = Math.max(win_max_score, element.score)
        }

        for (var index = 0; index < gameoverInfo.playerScores.length; index++)
        {
            //var info = gameoverInfo.playerScores[index]
            // var totalScore = info.score
            // if (!totalScore)
            //     info.score = 0
            //tempList.push(info)
            this.initPlayerInfo(gameoverInfo.playerScores[index], win_max_score)
        }
        //tempList.sort(function (a, b) { return b.score - a.score})
        if (gameData.gameinfo.isDismissed)
        {
            this.node.getChildByName("btn_again").getComponent(cc.Button).enableAutoGrayEffect = true;
            this.node.getChildByName("btn_again").getComponent(cc.Button).interactable = false
           // this.node.getChildByName("btn_again").getChildByName("New Label").getComponent(cc.LabelOutline).enabled = false;
        }

        // try
        // {
        // }
        // catch (e)
        // {
        //     this.btn_return_hall()
        // }
    }

    checkIsUnion()
    {
        var gameData:GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType()
        var oRule = gameData.gameinfo.rule
        if (oRule.union)
            this.isUnion = true
        else
            this.isUnion = false    
    }

    private initPlayerInfo(info, win_max_score)
    {
        var chairId = info.chairId
        var gameData:GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType()
        var realSeat = this.getRealSeatByRemoteSeat(chairId)
        var nickName = gameData.overTempPlayerInfo.get(realSeat).name 
        var playerId = gameData.overTempPlayerInfo.get(realSeat).id
        var icon = gameData.overTempPlayerInfo.get(realSeat).headurl
        // var isOwner = gameData.gameinfo.creator==playerId
        var playerNode = this.node.getChildByName("player" + (chairId-1))
        var scoreBg = playerNode.getComponent(cc.Sprite)
        playerNode.getChildByName("label_name").getComponent(cc.Label).string = Utils.getShortName(nickName,10)
        playerNode.getChildByName("label_id").getComponent(cc.Label).string = "ID:" + playerId
        var labelScore = playerNode.getChildByName("label_total_score").getComponent(cc.Label)
        var stringScore = 0
        var pre = ''
        if (this.isUnion)
            stringScore = info.money/100
        else
            stringScore = info.score
        if (info.score < 0) {
            var color = new cc.Color(125, 230, 244)
        }
        else {
            var color = new cc.Color(255,227,87)
            pre = '+'
        }
        labelScore.string = pre + stringScore.toString();
        labelScore.node.color = color
        var headSp = playerNode.getChildByName("default_head").getComponent(cc.Sprite)
        playerNode.active = true
        Utils.loadTextureFromNet(headSp, icon);
        if (info.score > 0 && info.score==win_max_score){
            playerNode.getChildByName("sp_win_down").active = true
        }
        scoreBg.spriteFrame = this.spWinBg[info.score>=0?0:1]
        if (realSeat == 0) // 如果是自己
            this.node.getChildByName("sp_self_win").position = playerNode.position        

        // 点炮次数
        if (info.dianpaonum) {
            playerNode.getChildByName("num3").getComponent(cc.Label).string = info.dianpaonum
        }
        
        // 胡牌次数
        if (info.hucount) {
            playerNode.getChildByName("num1").getComponent(cc.Label).string = info.hucount
        }
    }

    public getRealSeatByRemoteSeat(seat)
    {
        var gameData:GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType()
        var playerNum = gameData.getCurTypePlayerNum()
        var myInfo = gameData.overTempPlayerInfo.get(0)
        var offset = myInfo.realSeat - myInfo.seat
        var otherRealSeat = (seat + offset + playerNum)%playerNum
        var seatMap = []
        if (playerNum == 2) // 2人坐0,2
            seatMap = [0,2]
        else if (playerNum == 3) // 3人坐0,1,3号位
            seatMap = [0,1,3]
        else
            seatMap = [0,1,2,3]
        return seatMap[otherRealSeat]
    }

    //分享按钮
    share_button(event) {
        AudioManager.getInstance().playSFX("button_click")
        return
    }

    public dismissed() {
        if (UIManager.getInstance().getUI(GameUI_CP)) {
            if (this._clubid == 0) {
                //转场大厅
                UIManager.getInstance().openUI(HallUI, 0, () => {
                    GameUIController.getInstance().closeCurGameUI()
                    UIManager.getInstance().closeUI(CpRoundOver_UI);
                    UIManager.getInstance().closeUI(CpGameOver_UI);
                });
            }
            else {
                cc.sys.localStorage.setItem("SaveClubId", this._clubid);
                var uiType =  parseInt(cc.sys.localStorage.getItem("curClubType")) ;
                MessageManager.getInstance().messageSend(Proto.C2S_CLUBLIST_REQ.MsgID.ID, {type : uiType});
                UIManager.getInstance().closeUI(CpGameOver_UI);
                UIManager.getInstance().closeUI(CpRoundOver_UI);
            }
        }
        else {
            GameUIController.getInstance().closeCurGameUI()
            UIManager.getInstance().closeUI(CpRoundOver_UI);
            UIManager.getInstance().closeUI(CpGameOver_UI);
        }
    }

    btn_return_hall()
    {
        AudioManager.getInstance().playSFX("button_click")
        // UIManager.getInstance().openUI(HallUI, 0, () => {
        //     GameUIController.getInstance().closeCurGameUI()
        //     // UIManager.getInstance().closeUI(CpRoundOver_UI);
        //     UIManager.getInstance().closeUI(CpGameOver_UI);
        // });
        this.dismissed()
        MessageManager.getInstance().messageSend(Proto.CS_StandUpAndExitRoom.MsgID.ID, {});
    }

    close_button(event) {
        AudioManager.getInstance().playSFX("button_click")
        var gameData:GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType()
        if (this.isDismissed)
        {
            this.dismissed()
            return
        }
        MessageManager.getInstance().messageSend(Proto.CS_StandUpAndExitRoom.MsgID.ID, {});
        
    }

    continue_button() // 再来一局
    {
        AudioManager.getInstance().playSFX("button_click")
        let gameData:GameData_ZGCP = GameDataManager.getInstance().getDataByCurGameType()
        if (this.isDismissed)
        {
            this.dismissed()
            return
        }

        gameData.clearDataByContinue() // 再来一局清理上一局数据
        MessageManager.getInstance().messageSend(Proto.CS_PlayOnceAgain.MsgID.ID, {});
        gameData.setGameState(GAME_STATE_CP.PER_BEGIN);
        UIManager.getInstance().closeUI(CpGameOver_UI);
        UIManager.getInstance().closeUI(CpRoundOver_UI);
    }


}
