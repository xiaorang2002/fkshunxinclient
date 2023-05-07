import { StringData } from '../data/StringData';
import { BaseUI } from "../../framework/UI/BaseUI";
import { GameDataManager } from "../../framework/Manager/GameDataManager";
import { Utils } from "../../framework/Utils/Utils";
import { MessageManager } from "../../framework/Manager/MessageManager";
import * as Proto from "../../proto/proto-min";
import { LogWrap } from "../../framework/Utils/LogWrap";
import { AudioManager } from "../../framework/Manager/AudioManager";
import { ListenerManager } from "../../framework/Manager/ListenerManager";
import { GameManager } from "../GameManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class VoteUI extends BaseUI {
    protected static className = "VoteUI";

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
        this.updateLayer();
        this.initTime();
    }

    start()
    {
        ListenerManager.getInstance().add(Proto.SC_VoteTableCommit.MsgID.ID, this, this.onCommitRec);                 // 房间解散数据
        MessageManager.getInstance().disposeMsg(); // 需要等ui加载在完毕之后dispose，防止后面接不到消息
    }

    onShow() {
        this.updateLayer();
    }

    private initTime() {
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
        let voteData = gameData.voteData;
        this.curTime = voteData.datetime;
        let dateTime = GameDataManager.getInstance().systemData.severTime;
        this.timeout = voteData.timeout
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
        let voteData = gameData.voteData;
        if (!voteData)
            LogWrap.err("game error : gameApplyData not found");

        let isOperate = false;
        let cancelName = "";
        let applyName = "";

        if(voteData.status){
            //同步状态
            for (let i = 0; i < voteData.status.length; ++i) {
                var realSeat = gameData.getRealSeatByRemoteSeat(voteData.status[i].chairId)

                if (voteData.status[i].agree == 2)
                    cancelName = gameData.playerInfoMap.get(realSeat).name;
                if (realSeat == 0)
                    isOperate = true;
            }
            //按钮设置
            if (isOperate) {
                this.node.getChildByName("btn_cancel").getComponent(cc.Button).interactable = false;
                this.node.getChildByName("btn_sure").getComponent(cc.Button).interactable = false;
            }
            else {
                this.node.getChildByName("btn_cancel").getComponent(cc.Button).interactable = true;
                this.node.getChildByName("btn_sure").getComponent(cc.Button).interactable = true;
            }


        }
        var requestSeat = gameData.getRealSeatByRemoteSeat(voteData.requestChairId)
        applyName = gameData.playerInfoMap.get(requestSeat).name;
        //发起解散的玩家名字
        this.labelName.string = "【" + Utils.getShortName(applyName) + "】";
        var idx = 0
        gameData.playerInfoMap.forEach((infoObj, seat)=>{
            if (infoObj) {
                var selectStatus = false
                this.idx2Seat.push(seat)
                this.node.getChildByName("player" + idx).active = true;
                Utils.loadTextureFromNet(this.spHeadArray[idx], infoObj.headurl);
                this.node.getChildByName("player" + idx).getChildByName("label_name").getComponent(cc.Label).string = infoObj.name
                if (voteData.status)
                {
                    for (let j = 0; j < voteData.status.length; ++j) {
                        var realSeat = gameData.getRealSeatByRemoteSeat(voteData.status[j].chairId)
                        if (realSeat == seat){
                            selectStatus = true
                            this.node.getChildByName("player" + idx).getChildByName("node_state_0").active = false;
                            this.node.getChildByName("player" + idx).getChildByName("node_state_1").active = !voteData.status[j].agree;
                            this.node.getChildByName("player" + idx).getChildByName("node_state_2").active = voteData.status[j].agree;
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
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
        var realSeat = gameData.getRealSeatByRemoteSeat(msg.chairId)
        var idx = this.idx2Seat.indexOf(realSeat)
        if (idx <0 )
            return
        this.node.getChildByName("player" + idx).active = true;
        this.node.getChildByName("player" + idx).getChildByName("node_state_0").active = false;
        this.node.getChildByName("player" + idx).getChildByName("node_state_1").active = !msg.agree;
        this.node.getChildByName("player" + idx).getChildByName("node_state_2").active = msg.agree;
        if (idx == 0){
            this.node.getChildByName("btn_cancel").getComponent(cc.Button).interactable = false;
            this.node.getChildByName("btn_sure").getComponent(cc.Button).interactable = false;
        }
        if (!msg.agree){
            var cancelName = gameData.playerInfoMap.get(realSeat).name;
            GameManager.getInstance().openWeakTipsUI(StringData.getString(10072, [cancelName]));
        }
        MessageManager.getInstance().disposeMsg();
    }

    //同意
    private button_sure(event) {
        AudioManager.getInstance().playSFX("button_click");
        MessageManager.getInstance().messageSend(Proto.CS_VoteTableCommit.MsgID.ID, {agree: true});
        
    }

    //拒绝
    private button_cancel(event) {
        AudioManager.getInstance().playSFX("button_click");
        MessageManager.getInstance().messageSend(Proto.CS_VoteTableCommit.MsgID.ID, {agree: false});
    }
}