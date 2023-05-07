import { PreferentData } from './../../../data/PreferentData';
import { SdkManager } from './../../../../framework/Utils/SdkManager';
import { SelectTipsUI } from './../../SelectTipsUI';
import { BaseUI, UIClass } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { MessageManager } from "../../../../framework/Manager/MessageManager";
import * as Proto from "../../../../proto/proto-min";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { Utils } from "../../../../framework/Utils/Utils";
import { ListenerManager } from "../../../../framework/Manager/ListenerManager";
import { GameManager } from "../../../GameManager";
import { StringData } from "../../../data/StringData";
import { AudioManager } from "../../../../framework/Manager/AudioManager";
import { ShowRuleUI } from "../rule/ShowRuleUI";

const { ccclass, property } = cc._decorator;

@ccclass
export class ClubTableInfoUI extends BaseUI {

    protected static className = "ClubTableInfoUI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_CLUB_DIR + this.className;
    }

    private clubData: any = null;
    private roomInfo: any = null;

    @property(cc.Node)
    nodePlayerInfo: cc.Node = null;


    onLoad() {
        super.onLoad()
        this.clubData = GameDataManager.getInstance().clubData;

        ListenerManager.getInstance().add(Proto.S2C_CLUB_KICK_PLAYER_RES.MsgID.ID, this, this.clubLetOutResponse);
        ListenerManager.getInstance().add(Proto.SC_DismissTableReq.MsgID.ID, this, this.clubAbandonResponse);
    }

    public initUI(roomInfo: number) {
        //寻找对应的游戏并初始化
        if (!roomInfo)
        {
            
            this.node.getChildByName("btn_abandon").active = false
            this.node.getChildByName("btn_tablerule").active = false
            GameManager.getInstance().openWeakTipsUI("桌子信息不存在");
            return;
        }
        this.roomInfo = roomInfo;
        this.updatePlayerInfo();
        this.node.getChildByName("btn_join").active = true
        // else
        //     this.node.getChildByName("btn_abandon").position = cc.v2(0,-274.587)

    }

    private updatePlayerInfo() {
        //玩家信息
        for (let i = 0; i < 8; ++i) {
            if (i < this.roomInfo.seatList.length) {
                var playerNode = this.node.getChildByName("player" + i)
                playerNode.active = true
                if(this.roomInfo.seatList[i].playerInfo.icon && this.roomInfo.seatList[i].playerInfo.icon != "")
                {
                    Utils.loadTextureFromNet(playerNode.getChildByName("sp_head").getComponent(cc.Sprite), this.roomInfo.seatList[i].playerInfo.icon);
                }
               
                playerNode.getChildByName("label_name").getComponent(cc.Label).string = Utils.getShortName(this.roomInfo.seatList[i].playerInfo.nickname, 10);
                playerNode.getChildByName("label_id").getComponent(cc.Label).string = "ID:"+this.roomInfo.seatList[i].playerInfo.guid;
                playerNode.getChildByName("btn_ti").active = true;
            }
            else {
                this.node.getChildByName("player" + i).active = false
            }
        }
    }

    private clubLetOutResponse(msg: any) {
        for (var i = 0; i < this.roomInfo.seatList.length; ++i) {
            if (this.roomInfo.seatList[i].playerId == msg.guid) {
                this.roomInfo.seatList.splice(i, 1)
                break;
            }
        }
        MessageManager.getInstance().disposeMsg();
    }

    private clubAbandonResponse(msg: any) {
        if (msg.result != 0) {
            GameManager.getInstance().openWeakTipsUI(StringData.getString(msg.result));
            MessageManager.getInstance().disposeMsg();
            return;
        }
        UIManager.getInstance().closeUI(ClubTableInfoUI);
        MessageManager.getInstance().disposeMsg();
    }

    private button_add() {
        if (GameDataManager.getInstance().isJoinRoom){
            GameManager.getInstance().openWeakTipsUI("加入房间中，请稍后");
            return
        }
        let msg =
        {
            tableId: this.roomInfo.tableId,
        }
        if (this.roomInfo.rule && this.roomInfo.rule.option && this.roomInfo.rule.option.gps_distance > 0) // gps防作弊
        {
            if (GameDataManager.getInstance().gpsData == null || (GameDataManager.getInstance().gpsData.jingdu<0 || GameDataManager.getInstance().gpsData.weidu<0))
            {
                try{
                    var localStoreGps = false
                    // var storeGps = cc.sys.localStorage.getItem("gpsdata")
                    var storeGps = null
                    if (!storeGps || storeGps == undefined || storeGps == "")
                        localStoreGps = false
                    else
                    {
                        var localGpsInfo = JSON.parse(storeGps)
                        var nowTime = new Date().getTime()
                        if (localGpsInfo.date && nowTime-localGpsInfo.date < 60*60*12*1000) // 12小时不过期
                            localStoreGps = true
                    }
                    if (!localStoreGps)
                    {
                        var tips = "该房间是GPS防作弊房间，进入房间需要获取GPS定位信息，是否获取"
                        UIManager.getInstance().openUI(SelectTipsUI, 50, () => {
                            UIManager.getInstance().getUI(SelectTipsUI).getComponent("SelectTipsUI").initUI(tips, SdkManager.getInstance().doGetLocation, null);
                        });
                        return
                    }
                    else
                    {
                        GameDataManager.getInstance().gpsData = JSON.parse(storeGps)
                    }
                }
                catch (e)
                {
                    return
                }
            }
        }
        GameDataManager.getInstance().isJoinRoom = true
        PreferentData.getInstance().updateEnterGamePreferent(this.roomInfo.templateId)
        MessageManager.getInstance().messageSend(Proto.CS_JoinRoom.MsgID.ID, msg);
        UIManager.getInstance().closeUI(ClubTableInfoUI);
    }

    private button_abandon() {
        AudioManager.getInstance().playSFX("button_click");
        let msg = {
            clubId: this.clubData.curSelectClubId,
            tableId: this.roomInfo.tableId,
        };
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_FORCE_DISMISS_TABLE.MsgID.ID, msg);
        UIManager.getInstance().closeUI(ClubTableInfoUI);
    }

    private button_let_player_out(event, CustomEvent) {
        AudioManager.getInstance().playSFX("button_click");
        try{
            let index = parseInt(CustomEvent);
            let msg =
            {
                clubId: this.clubData.curSelectClubId,
                guid: this.roomInfo.seatList[index].playerInfo.guid,
            }
            MessageManager.getInstance().messageSend(Proto.CS_ForceKickoutPlayer.MsgID.ID, msg);
            UIManager.getInstance().closeUI(ClubTableInfoUI);
        }
        catch (e)
        {
            GameManager.getInstance().openWeakTipsUI("提出失败，玩家已经不在桌子中");
        }
    }

    private button_close() {
        UIManager.getInstance().closeUI(ClubTableInfoUI);
    }

    private button_open_rule(event) {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().openUI(ShowRuleUI, 5, () => {
            UIManager.getInstance().getUI(ShowRuleUI).getComponent("ShowRuleUI").initUI(this.roomInfo,this.clubData.clubType, null);
        });
    }
}

