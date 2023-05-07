import { ListenerManager } from './../../../../framework/Manager/ListenerManager';
import { ConstValue } from './../../../data/GameConstValue';
import { HttpManager } from './../../../../framework/Manager/HttpManager';
import { SocketManager } from './../../../../framework/Manager/SocketManager';
import { SelectTipsUI } from './../../SelectTipsUI';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { Utils } from './../../../../framework/Utils/Utils';
import { BaseUI, UIClass } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { MessageManager } from "../../../../framework/Manager/MessageManager";
import * as Proto from "../../../../proto/proto-min";
import { AudioManager } from "../../../../framework/Manager/AudioManager";
import { SdkManager } from "../../../../framework/Utils/SdkManager";
import { GameManager } from "../../../GameManager";
import { StringData } from "../../../data/StringData";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class CreateClubUI extends BaseUI {

    protected static className = "CreateClubUI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_CLUB_DIR + this.className;
    }

    @property(cc.EditBox)
    eboxId: cc.EditBox = null;
    @property(cc.Label)
    labelWx1: cc.Label = null;
    @property(cc.Label)
    labelWx2: cc.Label = null;

    private isHallJoin = false

    onLoad() {
        super.onLoad()
        this.eboxId.string = "";
        var wxList = GameDataManager.getInstance().systemData.kefu.split(",")
        if (wxList.length >= 1)
            this.labelWx1.string = wxList[0]
        if (wxList.length >= 2)
            this.labelWx2.string = wxList[1]
        ListenerManager.getInstance().add(Proto.S2C_JOIN_CLUB_RES.MsgID.ID, this, this.clubJoinResponse);
    }
    
    private clubJoinResponse(msg: any) {
        GameManager.getInstance().openStrongTipsUI("申请成功，等候群主同意", () => { });
        UIManager.getInstance().closeUI(CreateClubUI);
        MessageManager.getInstance().disposeMsg();
    }

    initView(type)
    {
        this.node.getChildByName("node_create").active = type == "create"
        this.node.getChildByName("node_join").active = type == "join"
        this.eboxId.placeholder = "请输入群ID"
    }

    setHallJoin()
    {
        this.eboxId.placeholder = "请输入房间号"
        this.isHallJoin = true
    }

    private button_kefu()
    {
        AudioManager.getInstance().playSFX("button_click");
        var onlineKefuUrl = GameDataManager.getInstance().systemData.onlineKefuUrl
        if (onlineKefuUrl.length != 0)
        {
            cc.sys.openURL(onlineKefuUrl)
        }
        else
        {
            GameManager.getInstance().openWeakTipsUI("暂无在线客服");
        }
    }

    private button_copy_wx2() {
        AudioManager.getInstance().playSFX("button_click");
        SdkManager.getInstance().doNativeCopyClipbordText(this.labelWx2.string);
    }

    private button_num(event, customEventData) {
        AudioManager.getInstance().playSFX("button_click");
        let input = parseInt(customEventData);
        if (input < 10) {
            this.eboxId.string += input.toString();
        }
        else if (input === 10 && this.eboxId.string.length > 0) {
            this.eboxId.string = this.eboxId.string.substr(0, this.eboxId.string.length - 1);
        }
        else if (input === 11)
            this.eboxId.string = "";
        
    }

    private button_confirm()
    {
        AudioManager.getInstance().playSFX("button_click");
        if (this.eboxId.string.length === 6 || this.eboxId.string.length === 8) {
            if (this.isHallJoin && this.eboxId.string.length === 6){
                let msg = {
                    tableId: parseInt(this.eboxId.string),
                }
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
                            var tips = "进入房间需要获取GPS定位信息，是否获取"
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
                MessageManager.getInstance().messageSend(Proto.CS_JoinRoom.MsgID.ID, msg);
            }
            else
            {
                MessageManager.getInstance().messageSend(Proto.C2S_JOIN_CLUB_REQ.MsgID.ID, { clubId: parseInt(this.eboxId.string) });
            }
        }
        else
        {
            if (this.isHallJoin)
                GameManager.getInstance().openWeakTipsUI("请输入正确的房间号");
            else
                GameManager.getInstance().openWeakTipsUI("请输入正确的群ID");
        }
    }

    private button_close()
    {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().closeUI(CreateClubUI);
        
    }
}

