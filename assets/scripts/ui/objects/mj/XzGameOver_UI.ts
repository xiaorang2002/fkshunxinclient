import { GAME_STATE_MJ } from './../../../data/mj/defines';
import { GAME_NAME, GAME_TYPE } from './../../../data/GameConstValue';
import { Utils } from './../../../../framework/Utils/Utils';
import { GameUIController } from './../../GameUIController';
import { GameUI_MJ } from './GameUI_MJ';
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
import XzRoundOver_UI from './XzRoundOver_UI';
import ZgRoundOver_UI from './ZgRoundOver_UI';


const { ccclass, property } = cc._decorator;

@ccclass
export default class XzGameOver_UI extends BaseUI {

    protected static className = "XzGameOver_UI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_MJ_DIR + this.className;
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
        try
        {
            var gameData = GameDataManager.getInstance().getDataByCurGameType()
            var gameoverInfo =  gameData.gameinfo.curGameOverData
            gameData.gameinfo.curGameOverData = null
            this.isDismissed = gameData.gameinfo.isDismissed
            this.checkIsUnion()
            var tempList = []
            this._clubid = gameData.gameinfo.clubId
            for (var index = 0; index < gameoverInfo.players.length; index++)
            {
                var info = gameoverInfo.players[index]
                var totalScore = info.score
                if (!totalScore)
                    info.score = 0
                tempList.push(info)
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

    private initPlayerInfo(info)
    {
        var chairId = info.chairId
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
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
        if (info.score >= 0){
            playerNode.getChildByName("sp_win_down").active = true
        }
        scoreBg.spriteFrame = this.spWinBg[info.score>=0?0:1]
        if (realSeat == 0) // 如果是自己
            this.node.getChildByName("sp_self_win").position = playerNode.position
        
        for (var k=0; k < info.statistics.length; ++k)
        {
            var type = info.statistics[k].type
            var count = info.statistics[k].count
            var num = 0
            if(type == "zi_mo")
                num = 1
            else if (type == "hu")
                num = 2
            else if (type == "dian_pao")
                num = 3
            else if (type == "an_gang")
                num = 4
            else if (type == "ming_gang")
                num = 5
            else if (type == "cha_da_jiao")
                num = 6
            else
                continue
            playerNode.getChildByName("num"+num).getComponent(cc.Label).string = count.toString()
        }
        
    }

    public getRealSeatByRemoteSeat(seat)
    {
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
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
        if (UIManager.getInstance().getUI(GameUI_MJ)) {
            if (this._clubid == 0) {
                //转场大厅
                UIManager.getInstance().openUI(HallUI, 0, () => {
                    GameUIController.getInstance().closeCurGameUI()
                    UIManager.getInstance().closeUI(XzRoundOver_UI);
                    UIManager.getInstance().closeUI(XzGameOver_UI);
                    UIManager.getInstance().closeUI(ZgRoundOver_UI);
                });
            }
            else {
                cc.sys.localStorage.setItem("SaveClubId", this._clubid);
                var uiType =  parseInt(cc.sys.localStorage.getItem("curClubType")) ;
                MessageManager.getInstance().messageSend(Proto.C2S_CLUBLIST_REQ.MsgID.ID, {type : uiType});
                UIManager.getInstance().closeUI(XzGameOver_UI);
                UIManager.getInstance().closeUI(XzRoundOver_UI);
                UIManager.getInstance().closeUI(ZgRoundOver_UI);
            }
        }
        else {
            UIManager.getInstance().closeUI(XzGameOver_UI)
        }
    }

    btn_return_hall()
    {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().openUI(HallUI, 0, () => {
            GameUIController.getInstance().closeCurGameUI()
            UIManager.getInstance().closeUI(XzRoundOver_UI);
            UIManager.getInstance().closeUI(XzGameOver_UI);
            UIManager.getInstance().closeUI(ZgRoundOver_UI);
        });
        MessageManager.getInstance().messageSend(Proto.CS_StandUpAndExitRoom.MsgID.ID, {});
    }

    close_button(event) {
        AudioManager.getInstance().playSFX("button_click")
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
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
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
        if (this.isDismissed)
        {
            this.dismissed()
            return
        }
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
        gameData.clearDataByContinue() // 再来一局清理上一局数据
        MessageManager.getInstance().messageSend(Proto.CS_PlayOnceAgain.MsgID.ID, {});
        gameData.setGameState(GAME_STATE_MJ.PER_BEGIN);
        UIManager.getInstance().closeUI(XzGameOver_UI);
        UIManager.getInstance().closeUI(XzRoundOver_UI);
        UIManager.getInstance().closeUI(ZgRoundOver_UI);
    }


}
