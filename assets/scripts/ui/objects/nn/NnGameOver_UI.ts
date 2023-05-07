import { GAME_STATE_ZJH } from './../../../data/zjh/GameInfo_ZJH';
import { GameUI_NN } from './GameUI_NN';
import { GAME_STATE_MJ } from './../../../data/mj/defines';
import { Utils } from './../../../../framework/Utils/Utils';
import { GameUIController } from './../../GameUIController';
import { BaseUI } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { HallUI } from "../../HallUI";
import { AudioManager } from "../../../../framework/Manager/AudioManager";
import { MessageManager } from "../../../../framework/Manager/MessageManager";
import * as Proto from "../../../../proto/proto-min";


const { ccclass, property } = cc._decorator;

@ccclass
export default class NnGameOver_UI extends BaseUI {

    protected static className = "NnGameOver_UI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_NN_DIR + this.className;
    }

    private _clubid = 0;
    private time = 15
    private isDismissed = false;
    private biggestScore = 0
    private isUnion = false

    // @property(cc.Font)
    // fontNumZ: cc.Font = null
    // @property(cc.Font)
    // fontNumF: cc.Font = null
    @property({type:[cc.Color]})
    scArg:Array<cc.Color> = []

    @property({type:[cc.SpriteFrame]})
    playerbg:Array<cc.SpriteFrame> = []

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
            this.checkIsUnion()
            gameData.gameinfo.curGameOverData = null
            gameData.roundOverDataUesed = true
            this.isDismissed = gameData.gameinfo.isDismissed
            this._clubid = gameData.gameinfo.clubId
            if (gameData.gameinfo.rule.trustee.second_opt >= 0)
            {
                var timeList = [5,10,15,30,45]
                var time = timeList[gameData.gameinfo.rule.trustee.second_opt]
                if(time > 5)
                    this.time = time - 2
                else
                    this.time = time
            }
            this.schedule(this.loop, 1)
            this.biggestScore = this.getBiggestScore(gameoverInfo.balances)
            for (var index = 0; index < gameoverInfo.balances.length; index++)
            {
                var info = gameoverInfo.balances[index]
                this.initPlayerInfo(info)
            }
            if (gameData.gameinfo.isDismissed || gameData.gameinfo.rule.play.continue_game == false)
            {
                this.node.getChildByName("btn_again").getComponent(cc.Button).enableAutoGrayEffect = true;
                this.node.getChildByName("btn_again").getComponent(cc.Button).interactable = false
                //this.node.getChildByName("btn_again").getChildByName("New Label").getComponent(cc.LabelOutline).enabled = false;
            }
        }
       catch (e){
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
            if (balance[index].totalMoney > score)
                score = balance[index].totalMoney
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
        var totalScore = info.totalMoney/100
        var playerNode = this.node.getChildByName("player" + (chairId-1))
        playerNode.getChildByName("big_win").active = info.totalMoney == this.biggestScore && this.biggestScore != 0
        playerNode.getChildByName("label_name").getComponent(cc.Label).string = Utils.getShortName(nickName,10)
        playerNode.getChildByName("label_id").getComponent(cc.Label).string = "ID：" + playerId
        let zf = totalScore < 0?"":"+"
        let color_ins = totalScore >= 0?0:1
        if (!this.isUnion)
        {
            var labelScore = playerNode.getChildByName("label_score").getComponent(cc.Label)
            // if (totalScore < 0) {
            //    // labelScore.font = this.fontNumF;
            //     labelScore.string = "/" + totalScore;
            // }
            // else {
            //    // labelScore.font = this.fontNumZ;
            //     labelScore.string = "/" + totalScore;
            // }
            labelScore.node.color = this.scArg[color_ins]
            labelScore.string = zf+totalScore
            labelScore.node.active = true
        }
        else
        {
            var labelScore = playerNode.getChildByName("label_score_union").getComponent(cc.Label)
            // var fuhao = ""
            // if (totalScore < 0) 
            //     var color = new cc.Color(120,206,255)
            // else
            // {
            //     fuhao = "+"
            //     var color = new cc.Color(255,172,115)
            // }
            // labelScore.string = fuhao+totalScore.toString();
            // labelScore.node.color = color
            labelScore.string = zf+totalScore.toString();
            labelScore.node.color = this.scArg[color_ins]
            labelScore.node.active = true;
        }
        playerNode.getChildByName("bg").getComponent(cc.Sprite).spriteFrame = this.playerbg[color_ins]
        var headSp = playerNode.getChildByName("sp_head").getComponent(cc.Sprite)
        playerNode.active = true
        if(icon && icon != "")
        {
            Utils.loadTextureFromNet(headSp, icon);
        }
       
        if (realSeat == 0)
            playerNode.getChildByName("sp_self").active = true
        
    }

    private getRealSeatByRemoteSeat(seat)
    {
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
        var playerNum = gameData.getCurTypePlayerNum()
        var myInfo = gameData.overTempPlayerInfo.get(0)
        var offset = myInfo.realSeat - myInfo.seat
        var otherRealSeat = (seat + offset + playerNum)%playerNum
        if (playerNum == 6 && otherRealSeat != 0)
            otherRealSeat += 1
        return otherRealSeat
    }

    public dismissed() {
        if (UIManager.getInstance().getUI(GameUI_NN)) {
            if (this._clubid == 0) {
                //转场大厅
                UIManager.getInstance().openUI(HallUI, 0, () => {
                    GameUIController.getInstance().closeCurGameUI()
                    UIManager.getInstance().closeUI(NnGameOver_UI);
                });
            }
            else {
                cc.sys.localStorage.setItem("SaveClubId", this._clubid);
                var uiType =  parseInt(cc.sys.localStorage.getItem("curClubType")) ;
                MessageManager.getInstance().messageSend(Proto.C2S_CLUBLIST_REQ.MsgID.ID, {type : uiType});
                UIManager.getInstance().closeUI(NnGameOver_UI);
            }
        }
        else {
            UIManager.getInstance().closeUI(NnGameOver_UI)
        }
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
            this.close_button(null)
        }
    }

    btn_return_hall()
    {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().openUI(HallUI, 0, () => {
            GameUIController.getInstance().closeCurGameUI()
            UIManager.getInstance().closeUI(NnGameOver_UI);
        });
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

    continue_button() // 再来一局
    {
        try
        {
            AudioManager.getInstance().playSFX("button_click")
            var gameData = GameDataManager.getInstance().getDataByCurGameType()
            if (this.isDismissed)
            {
                this.dismissed()
                return
            }
            gameData.clearDataByContinue() // 再来一局清理上一局数据
            MessageManager.getInstance().messageSend(Proto.CS_PlayOnceAgain.MsgID.ID, {});
            gameData.setGameState(GAME_STATE_ZJH.PER_BEGIN);
            UIManager.getInstance().closeUI(NnGameOver_UI);
        }
        catch (e) {
            this.btn_return_hall()
        }
    }


}
