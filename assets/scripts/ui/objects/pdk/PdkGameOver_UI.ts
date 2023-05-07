import { GAME_TYPE } from './../../../data/GameConstValue';
import { GAME_STATE_PDK } from './../../../data/game_pdk/GameInfo_PDK';
import { GameUI_PDK } from './GameUI_PDK';
import { GAME_NAME } from '../../../data/GameConstValue';
import { Utils } from '../../../../framework/Utils/Utils';
import { GameUIController } from '../../GameUIController';
import { BaseUI } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { HallUI } from "../../HallUI";
import { AudioManager } from "../../../../framework/Manager/AudioManager";
import { MessageManager } from "../../../../framework/Manager/MessageManager";
import * as Proto from "../../../../proto/proto-min";
import PdkRoundOver_UI from './PdkRoundOver_UI';


const { ccclass, property } = cc._decorator;

@ccclass
export default class PdkGameOver_UI extends BaseUI {

    protected static className = "PdkGameOver_UI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_PDK_DIR + this.className;
    }

    @property({ type: [cc.SpriteFrame] })
    spWinBg: Array<cc.SpriteFrame> = [];

    private _clubid = 0;
    private isUnion = false
    private isDismissed = false
    private biggestScore = 0
    private playerViewPosList3 = [[-338,12], [0,12], [338,12]]
    private playerViewPosList4 = [[-397,12], [-127,12], [144,12], [414,12]]

    onLoad() {
        
    }

    start() {
        this.initUI();
    }
    initUI() {
        try
        {
            var gameData = GameDataManager.getInstance().getDataByCurGameType()
            var gameoverInfo =  gameData.gameinfo.curGameOverData
            gameData.gameinfo.curGameOverData = null
            gameData.roundOverDataUesed = true
            this.isDismissed = gameData.gameinfo.isDismissed
            this.checkIsUnion()
            var tempList = []
            this._clubid = gameData.gameinfo.clubId
            this.biggestScore = this.getBiggestScore(gameoverInfo.players)
            var posList = this.playerViewPosList3
            if (gameoverInfo.players.length == 4)
                posList = this.playerViewPosList4
            for (var index = 0; index < gameoverInfo.players.length; index++)
            {
                
                var info = gameoverInfo.players[index]
                var totalScore = info.score
                if (!totalScore)
                    info.score = 0
                tempList.push(info)
                this.node.getChildByName("player" + (info.chairId-1)).x = posList[info.chairId-1][0]
                this.initPlayerInfo(info)
            }
            tempList.sort(function (a, b) { return b.score - a.score})
            if (gameData.gameinfo.isDismissed)
            {
                this.node.getChildByName("btn_again").getComponent(cc.Button).enableAutoGrayEffect = true;
                this.node.getChildByName("btn_again").getComponent(cc.Button).interactable = false
               // this.node.getChildByName("btn_again").getChildByName("New Label").getComponent(cc.LabelOutline).enabled = false;
            }
        }
        catch (e)
        {
            this.btn_return_hall()
        }
    }

    checkIsUnion()
    {
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
        var oRule = gameData.gameinfo.rule
        if (oRule.union)
            this.isUnion = true
        else
            this.isUnion = false    
    }

    private getBiggestScore(balance){
        var score = 0
        for (var index = 0; index < balance.length; index++)
        {
            if (balance[index].score && balance[index].score > score)
                score = balance[index].score
        }
        return score
    }


    private initPlayerInfo(info)
    {
        var chairId = info.chairId
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
        var realSeat = this.getRealSeatByRemoteSeat(chairId)
        var nickName = gameData.overTempPlayerInfo.get(realSeat).name 
        var playerId = gameData.overTempPlayerInfo.get(realSeat).id
        var icon = gameData.overTempPlayerInfo.get(realSeat).headurl
        var totalScore = 0
        if (this.isUnion)
            totalScore = info.money/100
        else
            totalScore = info.score
        var playerNode = this.node.getChildByName("player" + (chairId-1))
        var scoreBg = playerNode.getComponent(cc.Sprite)
        playerNode.getChildByName("label_name").getComponent(cc.Label).string = Utils.getShortName(nickName,10)
        playerNode.getChildByName("label_id").getComponent(cc.Label).string = "ID:" + playerId
        playerNode.getChildByName("sp_win_down").active = this.biggestScore == info.score && this.biggestScore != 0
        var labelScore = playerNode.getChildByName("label_total_score").getComponent(cc.Label)
        var pre = ''
        if (totalScore < 0) {
            var color = new cc.Color(125, 230, 244)
        }
        else {
            var color = new cc.Color(255,227,87)
            pre = '+'
        }
       
        labelScore.string = pre + totalScore.toString();
        labelScore.node.color = color
        var headSp = playerNode.getChildByName("default_head").getComponent(cc.Sprite)
        playerNode.active = true
        Utils.loadTextureFromNet(headSp, icon);
       
        scoreBg.spriteFrame = this.spWinBg[totalScore>=0?0:1]
        
        if (realSeat == 0) // 如果是自己
            this.node.getChildByName("sp_self_win").position = playerNode.position

        for (var k=0; k < info.statistics.length; ++k)
        {
            var type = info.statistics[k].type
            var count = info.statistics[k].count
            var num = 0
            if(type == 1)
                num = 3
            else if (type == 2)
                num = 1
            else if (type == 3)
                num = 2
            else
                continue
            playerNode.getChildByName("num"+num).getComponent(cc.Label).string = count.toString()
        }
        
    }

    private getRealSeatByRemoteSeat(seat)
    {

        var gameData = GameDataManager.getInstance().getDataByCurGameType()
        var playerNum = gameData.getCurTypePlayerNum()
        var myInfo = gameData.overTempPlayerInfo.get(0)
        var offset = myInfo.realSeat - myInfo.seat
        var otherRealSeat = (seat + offset + playerNum)%playerNum
        var seatMap = []
        if (playerNum == 3) // 3人坐0,1,3号位
            seatMap = [0,1,3]
        else if (playerNum == 2) // 2人坐0,2
            seatMap = [0,2]
        else if (playerNum == 4) // 2人坐0,2
            seatMap = [0,1,2,3]
        return seatMap[otherRealSeat]
    }

    //分享按钮
    share_button(event) {
        AudioManager.getInstance().playSFX("button_click")
        return
    }

    public dismissed() {
        if (UIManager.getInstance().getUI(GameUI_PDK)) {
            if (this._clubid == 0) {
                //转场大厅
                UIManager.getInstance().openUI(HallUI, 0, () => {
                    GameUIController.getInstance().closeCurGameUI()
                    UIManager.getInstance().closeUI(PdkRoundOver_UI);
                    UIManager.getInstance().closeUI(PdkGameOver_UI);
                });
            }
            else {
                cc.sys.localStorage.setItem("SaveClubId", this._clubid);
                var uiType =  parseInt(cc.sys.localStorage.getItem("curClubType")) ;
                MessageManager.getInstance().messageSend(Proto.C2S_CLUBLIST_REQ.MsgID.ID, {type : uiType});
                UIManager.getInstance().closeUI(PdkGameOver_UI);
            }
        }
        else {
            UIManager.getInstance().closeUI(PdkGameOver_UI)
        }
    }

    btn_return_hall()
    {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().openUI(HallUI, 0, () => {
            GameUIController.getInstance().closeCurGameUI()
            UIManager.getInstance().closeUI(PdkRoundOver_UI);
            UIManager.getInstance().closeUI(PdkGameOver_UI);
        });
    }

    continue_button() // 再来一局
    {
        AudioManager.getInstance().playSFX("button_click")
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
        if (this.isDismissed)
        {
            this.dismissed()
            return
        }
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
        gameData.clearDataByContinue() // 再来一局清理上一局数据
        MessageManager.getInstance().messageSend(Proto.CS_PlayOnceAgain.MsgID.ID, {});
        gameData.setGameState(GAME_STATE_PDK.PER_BEGIN);
        UIManager.getInstance().closeUI(PdkGameOver_UI);
        UIManager.getInstance().closeUI(PdkRoundOver_UI);

    }


    close_button(event) {
        AudioManager.getInstance().playSFX("button_click")
        if (this.isDismissed)
        {
            this.dismissed()
            return
        }
        MessageManager.getInstance().messageSend(Proto.CS_StandUpAndExitRoom.MsgID.ID, {});
        
    }

}
