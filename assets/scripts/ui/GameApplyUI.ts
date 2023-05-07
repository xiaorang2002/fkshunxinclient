import { UIManager } from './../../framework/Manager/UIManager';
import { GAME_TYPE } from './../data/GameConstValue';
import { Utils } from './../../framework/Utils/Utils';
import { BaseUI } from "../../framework/UI/BaseUI";
import { GameDataManager } from "../../framework/Manager/GameDataManager";
import { MessageManager } from "../../framework/Manager/MessageManager";
import * as Proto from "../../proto/proto-min";
import { LogWrap } from "../../framework/Utils/LogWrap";
import { AudioManager } from "../../framework/Manager/AudioManager";
import { ListenerManager } from "../../framework/Manager/ListenerManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class GameApplyUI extends BaseUI {
    protected static className = "GameApplyUI";

    @property(cc.Label)
    labelName: cc.Label = null;
    @property(cc.Label)
    labelTime: cc.Label = null;
    @property([cc.Sprite])
    spHeadArray: cc.Sprite[] = [];

    private curTime: number = 0;
    private timeout = 0
    private idx2Seat = []
    onLoad() {
        super.onLoad()
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
        if (!gameData)
        {
            UIManager.getInstance().closeUI(GameApplyUI)
            return
        }
        this.updateLayer();
        this.initTime();
    }

    start()
    {
        ListenerManager.getInstance().add(Proto.SC_DismissTableCommit.MsgID.ID, this, this.onCommitRec);                 // 房间解散数据
        MessageManager.getInstance().disposeMsg(); // 需要等ui加载在完毕之后dispose，防止后面接不到消息
    }

    onShow() {
        this.updateLayer();
    }

    private initTime() {
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
        let applyData = gameData.gameApplyData;
        this.curTime = applyData.datetime;
        let dateTime = GameDataManager.getInstance().systemData.severTime;
        this.timeout = applyData.timeout
        if (this.timeout < 0)
            this.timeout = 0;
        this.labelTime.string = this.timeout + "秒";

        this.schedule(function () {
            this.timeout -= 1
            if ( this.timeout < 0)
                this.timeout = 0;
            this.labelTime.string = this.timeout + "秒";
        }, 1);
    }

    //刷新显示
    private updateLayer() {

        var gameData = GameDataManager.getInstance().getDataByCurGameType()
        let applyData = null;
        if (gameData)
            applyData = gameData.gameApplyData
        if (!applyData)
        {
            LogWrap.err("game error : gameApplyData not found");
            UIManager.getInstance().closeUI(GameApplyUI)
            return
        }

        let isOperate = false;
        let cancelName = "";
        let applyName = "";

        if(applyData.status){
            //同步状态
            for (let i = 0; i < applyData.status.length; ++i) {
                var realSeat = gameData.getRealSeatByRemoteSeat(applyData.status[i].chairId)

                if (applyData.status[i].agree == 2)
                    cancelName = gameData.playerInfoMap.get(realSeat).name;
                if (realSeat == 0)
                    isOperate = true;
            }
            //按钮设置
            if (isOperate) {
                this.node.getChildByName("btn_cancel").getComponent(cc.Button).interactable = false;
               // this.node.getChildByName("btn_cancel").getChildByName("New Label").getComponent(cc.LabelOutline).enabled = false;
                this.node.getChildByName("btn_sure").getComponent(cc.Button).interactable = false;
               //this.node.getChildByName("btn_sure").getChildByName("New Label").getComponent(cc.LabelOutline).enabled = false;
            }
            else {
                this.node.getChildByName("btn_cancel").getComponent(cc.Button).interactable = true;
                this.node.getChildByName("btn_sure").getComponent(cc.Button).interactable = true;
            }
        }
        var requestSeat = gameData.getRealSeatByRemoteSeat(applyData.requestChairId)
        if (gameData.playerInfoMap.get(requestSeat))
        {
            applyName = gameData.playerInfoMap.get(requestSeat).name;
            //发起解散的玩家名字
            this.labelName.string = "【" + Utils.getShortName(applyName) + "】";
            if(requestSeat == 0){
                this.node.getChildByName("btn_cancel").getComponent(cc.Button).interactable = false;
                this.node.getChildByName("btn_sure").getComponent(cc.Button).interactable = false;
            }
        }
        var idx = 0
        if (gameData.playerInfoMap.size > 4)
        {
            for(var k = 0; k < 4; k++)
            {
                this.node.getChildByName("player" + k).scale = 0.6
                this.node.getChildByName("player" + k).y = 49
            }
        }
        gameData.playerInfoMap.forEach((infoObj, seat)=>{
            if (infoObj && GameDataManager.getInstance().curGameType == GAME_TYPE.ZJH && !infoObj.isGaming)
            {
                console.log("zjh中未参与的玩家，不进行投票")
            }
            else if(infoObj)
            {
                this.idx2Seat.push(infoObj.seat)
                var selectStatus = false
                this.node.getChildByName("player" + idx).active = true;
                Utils.loadTextureFromNet(this.spHeadArray[idx], infoObj.headurl);
                this.node.getChildByName("player" + idx).getChildByName("label_name").getComponent(cc.Label).string = Utils.getShortName(infoObj.name) 
                if (applyData.status)
                {
                    for (let j = 0; j < applyData.status.length; ++j) {
                        if (applyData.status[j].chairId == infoObj.seat){
                            selectStatus = true
                            this.node.getChildByName("player" + idx).getChildByName("node_state_0").active = false;
                            this.node.getChildByName("player" + idx).getChildByName("node_state_1").active = !applyData.status[j].agree;
                            this.node.getChildByName("player" + idx).getChildByName("node_state_2").active = applyData.status[j].agree;
                        }
                    }
                }
                
                if (!selectStatus){
                    this.node.getChildByName("player" + idx).getChildByName("node_state_0").active = true;
                    this.node.getChildByName("player" + idx).getChildByName("node_state_1").active = false;
                    this.node.getChildByName("player" + idx).getChildByName("node_state_2").active = false;
                }
                idx += 1
            }
        })
    }

    onCommitRec(msg)
    {
        var idx = this.idx2Seat.indexOf(msg.chairId)
        if (idx < 0)
            return
        this.node.getChildByName("player" + idx).active = true;
        this.node.getChildByName("player" + idx).getChildByName("node_state_0").active = false;
        this.node.getChildByName("player" + idx).getChildByName("node_state_1").active = !msg.agree;
        this.node.getChildByName("player" + idx).getChildByName("node_state_2").active = msg.agree;
        if (idx == 0){
            this.node.getChildByName("btn_cancel").getComponent(cc.Button).interactable = false;
           // this.node.getChildByName("btn_cancel").getChildByName("New Label").getComponent(cc.LabelOutline).enabled = false;
            this.node.getChildByName("btn_sure").getComponent(cc.Button).interactable = false;
            //this.node.getChildByName("btn_sure").getChildByName("New Label").getComponent(cc.LabelOutline).enabled = false;
        }
        MessageManager.getInstance().disposeMsg();
    }

    //同意
    private button_sure(event) {
        AudioManager.getInstance().playSFX("button_click");
        MessageManager.getInstance().messageSend(Proto.CS_DismissTableCommit.MsgID.ID, {agree: true});
        
    }

    //拒绝
    private button_cancel(event) {
        AudioManager.getInstance().playSFX("button_click");
        MessageManager.getInstance().messageSend(Proto.CS_DismissTableCommit.MsgID.ID, {agree: false});
    }

    private button_close(event0)
    {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().closeUI(GameApplyUI);
    }
    
}