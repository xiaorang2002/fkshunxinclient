import { GAME_STATE_MJ } from './../../../data/mj/defines';
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
import ZjScoreDetailPage_UI from './ZjScoreDetailPage_UI';


const { ccclass, property } = cc._decorator;

@ccclass
export default class MjGameOver_UI extends BaseUI {

    protected static className = "MjGameOver_UI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_MJ_DIR + this.className;
    }

    @property({type:[cc.Color]})
    scArg:Array<cc.Color> = []
    private _clubid = 0;
    private isUnion = false
    private isDismissed = false

    onLoad() {
        
    }

    start() {
        this.initUI();
    }
    initUI() {
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
        var gameoverInfo =  gameData.gameinfo.curGameOverData
        gameData.gameinfo.curGameOverData = null
        this.isDismissed = gameData.gameinfo.isDismissed
        this.checkIsUnion()
        var tempList = []
        this._clubid = gameData.gameinfo.clubId
        for (var index = 0; index < gameoverInfo.playerScores.length; index++)
        {
            var info = gameoverInfo.playerScores[index]
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
        var realSeat = gameData.getRealSeatByRemoteSeat(chairId)
        var nickName = gameData.overTempPlayerInfo.get(realSeat).name
        var playerId = gameData.overTempPlayerInfo.get(realSeat).id
        var icon = gameData.overTempPlayerInfo.get(realSeat).headurl
        var isOwner = false
        var totalScore = 0
        if (this.isUnion)
            totalScore = info.money/100
        else
            totalScore = info.score
        var playerNode = this.node.getChildByName("player" + (chairId-1))
        playerNode.getChildByName("label_name").getComponent(cc.Label).string = nickName
        playerNode.getChildByName("label_id").getComponent(cc.Label).string = "ID：" + playerId
        playerNode.getChildByName("label_score").getComponent(cc.Label).string = totalScore.toString();
        // if (totalScore < 0)
        //     playerNode.getChildByName("label_score").color = new cc.Color(104,132,173)
        // else
        //     playerNode.getChildByName("label_score").color = new cc.Color(236,128,53)
    
        playerNode.getChildByName("label_score").color = this.scArg[totalScore>=0?0:1]

        var headSp = playerNode.getChildByName("default_head").getComponent(cc.Sprite)
        playerNode.active = true
        Utils.loadTextureFromNet(headSp, icon);
        if (isOwner)
            playerNode.getChildByName("sp_fang").active = true
        if (realSeat == 0)
            playerNode.getChildByName("sp_game_score_self").active = true
        
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
                    UIManager.getInstance().closeUI(ZjScoreDetailPage_UI);
                    UIManager.getInstance().closeUI(MjGameOver_UI);
                });
            }
            else {
                cc.sys.localStorage.setItem("SaveClubId", this._clubid);
                var uiType =  parseInt(cc.sys.localStorage.getItem("curClubType")) ;
                MessageManager.getInstance().messageSend(Proto.C2S_CLUBLIST_REQ.MsgID.ID, {type : uiType});
                UIManager.getInstance().closeUI(MjGameOver_UI);
                UIManager.getInstance().closeUI(ZjScoreDetailPage_UI);
            }
        }
        else {
            UIManager.getInstance().closeUI(MjGameOver_UI)
        }
    }

    btn_return_hall()
    {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().openUI(HallUI, 0, () => {
            GameUIController.getInstance().closeCurGameUI()
            UIManager.getInstance().closeUI(ZjScoreDetailPage_UI);
            UIManager.getInstance().closeUI(MjGameOver_UI);
        });
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
        UIManager.getInstance().closeUI(MjGameOver_UI);
        UIManager.getInstance().closeUI(ZjScoreDetailPage_UI);
    }


}
