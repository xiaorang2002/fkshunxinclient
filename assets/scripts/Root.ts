import { ConstValue, LOGIN_TYPE, GAME_TYPE } from './data/GameConstValue';
import { UnionUI_Manage } from './ui/objects/union/UnionUI_Manage';
import { ClubMemberUI_New } from './ui/objects/club/ClubMemberUI_New';
import { UnionUI_Daily_Record } from './ui/objects/union/UnionUI_Daily_Record';
import { UnionUI_Statistics } from './ui/objects/union/UnionUI_Statistics';
import { UnionUI_Spread } from './ui/objects/union/UnionUI_Spread';
import { ClubGroupUI } from './ui/objects/club/ClubGroupUI';
import { GameUIRepeatMsgManage } from './ui/GameUIRepeatMsgManage';
import { WaitUI } from './ui/WaitUI';
import { Wait2UI } from './ui/Wait2UI';
import { ClubRecordUI } from './ui/objects/club/ClubRecordUI';
import { InviteJoinUI } from './ui/InviteJoinUI';
import { ClubUI } from './ui/ClubUI';
import { PhoneVerifyUI } from './ui/PhoneVerifyUI';
import { VoteUI } from './ui/VoteUI';
import { GameUIController } from './ui/GameUIController';
import { GameManager } from "./GameManager";
import * as Proto from "../proto/proto-min";
import { LoginUI } from "../scripts/ui/LoginUI";
import { HallUI } from "../scripts/ui/HallUI";
import { LogWrap } from "../framework/Utils/LogWrap";
import { UIManager } from "../framework/Manager/UIManager";
import { ListenerType } from "./data/ListenerType";
import { MessageManager } from "../framework/Manager/MessageManager";
import { ListenerManager } from "../framework/Manager/ListenerManager";
import { GameDataManager } from "../framework/Manager/GameDataManager"
import { StringData } from "./data/StringData";
import { SdkManager } from "../framework/Utils/SdkManager";
import { Utils } from "../framework/Utils/Utils";
import { GameApplyUI } from './ui/GameApplyUI';
import TuoGuanUI from './ui/TuoGuanUI';
import { TimeOutUI } from './ui/TimeOutUI';
import { ClubMemberUI } from './ui/objects/club/ClubMemberUI';
import { UnionUI_Spread_Detail } from './ui/objects/union/UnionUI_Spread_Detail';
import { Club_Quick_Game_UI } from './ui/Club_Quick_Game_UI';
import { UnionUI_Record } from './ui/objects/union/UnionUI_Record';
import GameNet from './ui/GameNet';
import { WeakTipsUI } from "./ui/WeakTipsUI";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Root extends cc.Component {

    public gameGlobalPrefab: cc.Node = null;
    private isNeedReconnect = false // 是否需要重连
    private locationTips = false
    private roomCreatWaitTime = 3
    private roomJoinWaitTime = 30

    onLoad() {
        ListenerManager.getInstance().add(ListenerType.OnSocketConnectFinish, this, this.onSocketConnectFinishResponse);
        ListenerManager.getInstance().add(ListenerType.OnSocketConnectFail, this, this.onSocketConnectFailResponse);
        ListenerManager.getInstance().add(ListenerType.OnSocketReceive, this, this.onSocketReceiveResponse);
        ListenerManager.getInstance().add(ListenerType.updateLocation, this, this.onUpdateLocation);
        ListenerManager.getInstance().add(ListenerType.messageWaiting, this, this.onMessageWaitingResponse);
        ListenerManager.getInstance().add(ListenerType.messageStatusChanged, this, this.onMessageStatusChanged);
        ListenerManager.getInstance().add(ListenerType.tuoGuanOver, this, this.onTuoGuanOver);

        ListenerManager.getInstance().add(Proto.SC_ReplyPlayerInfo.MsgID.ID, this, this.onPlayerInfoRec);
        ListenerManager.getInstance().add(Proto.SC_HeartBeat.MsgID.ID, this, this.onHeartBackResponse);
        ListenerManager.getInstance().add(Proto.LC_Login.MsgID.ID, this, this.onLoginInfoRec);
        // ListenerManager.getInstance().add(Proto.SC_JoinRoom.MsgID.ID, this, this.onReconnectJoinRoom);
        ListenerManager.getInstance().add(Proto.SC_ReconnectJoinRoom.MsgID.ID, this, this.onReconnectJoinRoom);
        ListenerManager.getInstance().add(Proto.SC_DismissTableRequestInfo.MsgID.ID, this, this.onReconnectDisMiss);                 // 房间解散重连数据
        ListenerManager.getInstance().add(Proto.SC_VoteTableRequestInfo.MsgID.ID, this, this.onReconnectVote);                 // 投票重连数据
        ListenerManager.getInstance().add(Proto.SC_NOTICE_RES.MsgID.ID, this, this.onNoticeRec);                 // 收到公告
        ListenerManager.getInstance().add(Proto.SC_NotifyNotice.MsgID.ID, this, this.onNoticeUpdate);                 // 公告更新

        ListenerManager.getInstance().add(Proto.LC_Auth.MsgID.ID, this, this.onAuthRec);
        ListenerManager.getInstance().add(Proto.SYNC_OBJECT.MsgID.ID, this, this.onSyncDataRec);
        ListenerManager.getInstance().add(Proto.SC_Logout.MsgID.ID, this, this.onLogout);

        // ListenerManager.getInstance().add(Proto.S2C_MARQUEE_RES.MsgID.ID, this, this.onNoticeChangeResponse);
        ListenerManager.getInstance().add(Proto.S2C_WARN_CODE_RES.MsgID.ID, this, this.onErrorResponse);
        ListenerManager.getInstance().add(Proto.SC_Trustee.MsgID.ID, this, this.onTrusteeRec);
        ListenerManager.getInstance().add(Proto.S2C_IMPORT_PLAYER_FROM_GROUP.MsgID.ID, this, this.onImportRec);
        ListenerManager.getInstance().add(Proto.S2C_NOTIFY_INVITE_JOIN_ROOM.MsgID.ID, this, this.onClubInviteRec);
        ListenerManager.getInstance().add(Proto.SC_GameServerCfg.MsgID.ID, this, this.onGameServerInfoRec);


        Utils.resize();

        cc.game.on(cc.game.EVENT_HIDE, function (event) {
            LogWrap.info("切换后台");
            GameDataManager.getInstance().systemData.clearConnectLogic()
            GameManager.getInstance().onLinkBreakOrBackground()
            if (GameManager.getInstance().getSocketState() != -1) {
                GameManager.getInstance().closeSocket();
                UIManager.getInstance().openUI(WaitUI, 100)
            }
            GameUIRepeatMsgManage.getInstance().clearMsgLimitMap()
        });
        cc.game.on(cc.game.EVENT_SHOW, function (event) {
            LogWrap.info("切换前台");
            if (UIManager.getInstance().getUI(LoginUI) && !UIManager.getInstance().getUI(LoginUI).getComponent("LoginUI").isCheckVersion)
                return;
            GameManager.getInstance().clearGlobalUI()
            GameManager.getInstance().connectSocket();
        });

    }

    onDestroy() {
        ListenerManager.getInstance().removeAll(this);
    }

    start() {

        GameManager.getInstance().initGame();
        SdkManager.getInstance().request_network_ip()
        SdkManager.getInstance().getPhoneInfo()
        window["sdkmanager"] = SdkManager.getInstance();
        if (ConstValue.LOGIN_MODE == LOGIN_TYPE.LOGIN_DEBUG)
            cc.debug.setDisplayStats(false);
        SdkManager.getInstance().getBaoMing()
        var sid = SdkManager.getInstance().doNativeGetCopyText()
        if (sid != "" && sid != null && sid != undefined) {
            cc.sys.localStorage.setItem("installSid", sid);
            if (cc.sys.os == cc.sys.OS_IOS)
                GameManager.getInstance().onErrorHandler(null, null, "installSid", sid, true);
        }
        else {
            // GameManager.getInstance().onErrorHandler(null, null, "installSid","copy text is null", true)
        }
        UIManager.getInstance().openUI(LoginUI, 0);
        ConstValue.RECONNECT_TIMES = GameDataManager.getInstance().systemData.curIpList.length
    }

    update(dt) {
        if (GameDataManager.getInstance().isCreatingRoom) {
            this.roomCreatWaitTime -= dt;
            if (this.roomCreatWaitTime <= 0) {
                this.roomCreatWaitTime = 3
                GameDataManager.getInstance().isCreatingRoom = false;
            }
        }
        if (GameDataManager.getInstance().isJoinRoom) {
            this.roomJoinWaitTime -= dt;
            if (this.roomJoinWaitTime <= 0) {
                this.roomJoinWaitTime = 30
                GameDataManager.getInstance().isJoinRoom = false;
            }
        }
        if (GameDataManager.getInstance().httpDataWaitTime > 0) {
            GameDataManager.getInstance().httpDataWaitTime -= dt
            if (GameDataManager.getInstance().httpDataWaitTime <= 0)
                GameDataManager.getInstance().httpDataWaitTime = 0
        }
        GameUIRepeatMsgManage.getInstance().updateMsgTime(dt)
        //心跳检测
        if (GameDataManager.getInstance().systemData.sendHeart(dt))
            MessageManager.getInstance().messageSend(Proto.CS_HeartBeat.MsgID.ID, {});
        //断线检测
        GameDataManager.getInstance().systemData.updateBreakTime(dt);
        GameDataManager.getInstance().systemData.refreshErrorMap(dt);
        MessageManager.getInstance().updateWaitList(dt)
        GameManager.getInstance().update(dt)
    }

    onLogout(msg) {
        GameManager.getInstance().openWeakTipsUI("账号成功登出");
        GameDataManager.getInstance().loginInfoData.deleteLoginInfo();
        UIManager.getInstance().closeAllExceptOpenUI(LoginUI)
        GameDataManager.getInstance().clearCurGameData()
        UIManager.getInstance().openUI(LoginUI, 0)
        MessageManager.getInstance().disposeMsg();
    }

    //连接成功
    onSocketConnectFinishResponse(msg) {
        //如果当前正在切换线路不用再次登录
        //if( GameDataManager.getInstance().systemData.isExchangeIP ) {return}
        ConstValue.RECONNECT_TIMES = GameDataManager.getInstance().systemData.curIpList.length
        var phoneType = ""
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            phoneType = "Android"

        } else if (cc.sys.os == cc.sys.OS_IOS) {
            phoneType = "Ios"
        } else {
            phoneType = "H5"
        }
        var localOpenId = GameDataManager.getInstance().loginInfoData.openId
        var loginCode = GameDataManager.getInstance().userInfoData.loginCode
        var imei = SdkManager.getInstance().doGetNativeUniqueId()
        if (localOpenId != "") {
            let msgb = {
                account: "",    // 账号
                password: "",     // 密码
                phone: "",      // 手机型号
                phoneType: phoneType,  // 手机类型
                imei: imei,       // 设备唯一码
                ip: ConstValue.NET_IP,         // 客户端ip
                version: ConstValue.VERSION, // 版本号
                channelId: "",      // 渠道号
                packageName: ConstValue.PACKAGE_NAME, // 安装包名字
                ipArea: "",          // 客户端ip地区
                platformId: "",      // 平台id
                openId: localOpenId  // 唯一开放id
            }
            GameDataManager.getInstance().loginInfoData.isAccountLogin = false
            MessageManager.getInstance().messageSend(Proto.CL_Login.MsgID.ID, msgb);
            if (UIManager.getInstance().getUI(LoginUI))
                UIManager.getInstance().getUI(LoginUI).getComponent("LoginUI").onLogining()
        }
        else if (loginCode != "") {
            var sid = cc.sys.localStorage.getItem("installSid")
            if (!sid || sid == undefined)
                sid = ""
            let msgb = {
                code: loginCode,
                authPlatform: "wx",
                phoneType: phoneType,  // 手机类型
                packageName: ConstValue.PACKAGE_NAME, // 安装包名字
                version: ConstValue.VERSION, // 版本号
                promoter: GameDataManager.getInstance().systemData.promoter,
                channelId: GameDataManager.getInstance().systemData.channelId,
                sid: sid,
                imei: imei,       // 设备唯一码
            }
            MessageManager.getInstance().messageSend(Proto.CL_Auth.MsgID.ID, msgb);
            GameDataManager.getInstance().userInfoData.loginCode = ""
            if (UIManager.getInstance().getUI(LoginUI))
                UIManager.getInstance().getUI(LoginUI).getComponent("LoginUI").onLogining()
        }
        GameDataManager.getInstance().systemData.isHeartOpen = true;
        GameDataManager.getInstance().systemData.clearConnectLogic()
        GameManager.getInstance().closeWaitUI();
    }

    //连接失败
    onSocketConnectFailResponse(msg) {
        GameDataManager.getInstance().systemData.isHeartOpen = false;
        GameDataManager.getInstance().systemData.reconnectSocket();
    }

    //接收到消息重置断线时间
    onSocketReceiveResponse(msg) {
        GameDataManager.getInstance().systemData.resetBreakTime();
    }

    onMessageWaitingResponse() {
        GameManager.getInstance().openWeakTipsUI("数据请求中...");
    }

    onMessageStatusChanged(msg) {
        if (msg.status == "send")
            UIManager.getInstance().openUI(TimeOutUI, 99)
        else
            UIManager.getInstance().closeUI(TimeOutUI)
    }

    onTuoGuanOver() {
        if (UIManager.getInstance().getUI(TuoGuanUI))
            UIManager.getInstance().closeUI(TuoGuanUI)
    }

    onUpdateLocation() {
        this.locationTips = true
        if (GameDataManager.getInstance().userInfoData.userId == 0)
            return
        var myLocation = GameDataManager.getInstance().gpsData
        if (myLocation == null)
            return
        let location = {
            longitude: myLocation.jingdu,
            latitude: myLocation.weidu,
        }
        MessageManager.getInstance().messageSend(Proto.CS_UpdateLocation.MsgID.ID, location);
    }


    //接收心跳
    onHeartBackResponse(msg) {
        if (LogWrap.HEART_LOG_SWITCH)
            LogWrap.info("heart sucess");

        //分发延迟
        GameDataManager.getInstance().systemData.receiveHeart();
        //同步服务器时间
        GameDataManager.getInstance().systemData.severTime = msg.severTime;
    }

    // 收到登录信息
    onLoginInfoRec(msg) {
        if (msg.result != 0) {
            if (msg.result == 1) // 如果时重复登录
            {
                GameManager.getInstance().openWeakTipsUI(StringData.getString(msg.result));
                MessageManager.getInstance().disposeMsg();
                return
            }
            if (msg.result == 3 && msg.psErrorCounts) {
                GameManager.getInstance().openWeakTipsUI("密码错误，剩余次数" + msg.psErrorCounts);
                if (UIManager.getInstance().getUI(LoginUI))
                    UIManager.getInstance().getUI(LoginUI).getComponent("LoginUI").onLoginingTimeOut(0, 0, 0, msg.result)
                MessageManager.getInstance().disposeMsg();
                return
            }
            GameManager.getInstance().openWeakTipsUI(StringData.getString(msg.result));
            if (UIManager.getInstance().getUI(LoginUI))
                UIManager.getInstance().getUI(LoginUI).getComponent("LoginUI").onLoginingTimeOut(0, 0, 0, msg.result)
            MessageManager.getInstance().disposeMsg();
            return
        }
        else if (msg.result == 0 && GameDataManager.getInstance().loginInfoData.isAccountLogin) {  //账号密码登录 则大厅不再提示绑定账号
            cc.sys.localStorage.setItem("haveSetPassWord", 1)
        }

        GameDataManager.getInstance().loginInfoData = msg;
        if (msg.reconnect)
            this.isNeedReconnect = true
        else
            this.isNeedReconnect = false
        MessageManager.getInstance().disposeMsg();
        MessageManager.getInstance().messageSend(Proto.CS_RequestPlayerInfo.MsgID.ID, {});
    }

    onAuthRec(msg) {
        cc.sys.localStorage.setItem("installSid", "")
        if (msg.result != 0) {
            GameManager.getInstance().openWeakTipsUI(StringData.getString(msg.result, [msg.errmsg]));
            if (UIManager.getInstance().getUI(LoginUI))
                UIManager.getInstance().getUI(LoginUI).getComponent("LoginUI").onLoginingTimeOut(0, 0, 0, msg.result)
            MessageManager.getInstance().disposeMsg();
            return
        }
        MessageManager.getInstance().disposeMsg();
    }


    // 收到玩家信息，打开大厅，或者重连
    onPlayerInfoRec(msg) {
        GameDataManager.getInstance().userInfoData = msg;
        GameDataManager.getInstance().userInfoData.online = true;
        GameDataManager.getInstance().isCreatingRoom = false
        GameDataManager.getInstance().isJoinRoom = false
        if (UIManager.getInstance().getUI(LoginUI))
            UIManager.getInstance().getUI(LoginUI).getComponent("LoginUI").onLoginingSuccess()
        if (GameDataManager.getInstance().systemData.remoteConfigInfo != "")
            cc.sys.localStorage.setItem("aLiYunConfig", GameDataManager.getInstance().systemData.remoteConfigInfo);
        this.locationTips = false
        this.onUpdateLocation()
        if (this.isNeedReconnect) {
            UIManager.getInstance().openUI(Wait2UI, 40, () => {
                MessageManager.getInstance().messageSend(Proto.CS_ReconnectJoinRoom.MsgID.ID, {});
                UIManager.getInstance().getUI(Wait2UI).getComponent("Wait2UI").onReconnect()
            })
        }
        else {
            GameDataManager.getInstance().clearCurGameData()
            if (UIManager.getInstance().getUI(ClubUI)) {
                UIManager.getInstance().openUI(ClubUI, 0, () => {
                    UIManager.getInstance().closeUIExceptWhiteList([ClubUI, ClubRecordUI, PhoneVerifyUI, ClubMemberUI,
                        ClubGroupUI, UnionUI_Spread, UnionUI_Statistics, UnionUI_Daily_Record, UnionUI_Spread_Detail, Club_Quick_Game_UI,
                        ClubMemberUI_New, UnionUI_Record, UnionUI_Manage]) // 这些界面暂时不关闭
                });
            }
            else {
                this.enterClub()
            }

        }
        GameDataManager.getInstance().ReddotData.updateReddotData()
        SdkManager.getInstance().onPlayerLoadFinish()
        MessageManager.getInstance().disposeMsg();
        //注释微信重复绑定
        // var loginCode = GameDataManager.getInstance().userInfoData.loginCode
        // if (loginCode != "")
        // {
        //     MessageManager.getInstance().messageSend(Proto.CS_RequestBindWx.MsgID.ID, {code: loginCode,});
        //     GameDataManager.getInstance().userInfoData.loginCode = ""
        // }
    }

    private enterClub() {
        UIManager.getInstance().openUI(HallUI, 0, () => {
            UIManager.getInstance().closeUIExceptWhiteList([HallUI, ClubRecordUI, PhoneVerifyUI, GameNet, WeakTipsUI])
            if (GameDataManager.getInstance().systemData.isFirstStartGame) {
                let setValue = cc.sys.localStorage.getItem("haveSetPassWord")
                if (setValue != "1") // 未绑定账号
                {
                    UIManager.getInstance().openUI(PhoneVerifyUI, 1, () => {
                        UIManager.getInstance().getUI(PhoneVerifyUI).getComponent("PhoneVerifyUI").setBtnVisible("bind")
                        MessageManager.getInstance().messageSend(Proto.CS_NOTICE_REQ.MsgID.ID, {}); // 暂时不放出公告
                    })
                }
                else {
                    MessageManager.getInstance().messageSend(Proto.CS_NOTICE_REQ.MsgID.ID, {});
                }
                GameDataManager.getInstance().systemData.isFirstStartGame = false
            }
            if (GameDataManager.getInstance().systemData.shareSid != "" && GameDataManager.getInstance().systemData.shareData != "") {
                GameManager.getInstance().onWebShareRec(GameDataManager.getInstance().systemData.shareSid, GameDataManager.getInstance().systemData.shareData)
                GameDataManager.getInstance().systemData.shareSid = ""
                GameDataManager.getInstance().systemData.shareData = ""
            }
        });
    }


    onReconnectJoinRoom(msg) {
        if (msg.result != 0) {
            this.isNeedReconnect = false
            if (msg.result == 100 || msg.result == 55) //房间不存在的情况下
            {
                if (GameDataManager.getInstance().returnHallStatus) {
                    GameManager.getInstance().openWeakTipsUI("房间已经解散");
                    GameDataManager.getInstance().returnHallStatus = false
                }
                else
                    this.enterClub()
                MessageManager.getInstance().disposeMsg();
                return
            }
            GameManager.getInstance().openWeakTipsUI(StringData.getString(msg.result));
            if (UIManager.getInstance().getUI(Wait2UI))
                UIManager.getInstance().getUI(Wait2UI).getComponent("Wait2UI").onReconnectFailed()
            MessageManager.getInstance().disposeMsg();
            return;
        }
        if (UIManager.getInstance().getUI(Wait2UI))
            UIManager.getInstance().getUI(Wait2UI).getComponent("Wait2UI").onReconnectSuccess()
        // 如果当前是切后台导致的瞬连
        if (GameUIController.getInstance().isGameStart(msg.info.gameType)) {
            GameDataManager.getInstance().returnHallStatus = false
            GameDataManager.getInstance().curGameType = msg.info.gameType
            var curGameData = GameDataManager.getInstance().getDataByCurGameType()
            curGameData.updateTableInfo(msg.info, msg.roundInfo.roundId)
            for (var info of msg.seatList)
                curGameData.addPlayer(info, false)
            GameUIController.getInstance().resetDataOnBack()
            GameUIController.getInstance().closeOtherUIshowCurGameUI(msg.info.gameType)
            MessageManager.getInstance().disposeMsg();
        }
        else {
            GameDataManager.getInstance().returnHallStatus = false
            GameDataManager.getInstance().curGameType = msg.info.gameType
            var curGameData = GameDataManager.getInstance().getDataByCurGameType()
            curGameData.updateTableInfo(msg.info, msg.roundInfo.roundId)
            for (var info of msg.seatList)
                curGameData.addPlayer(info)
            GameUIController.getInstance().startGameByType(msg.info.gameType, this.isNeedReconnect)
            UIManager.getInstance().closeUIExceptWhiteList([TimeOutUI]);
        }
        this.isNeedReconnect = false
    }

    onReconnectDisMiss(msg) {
        GameDataManager.getInstance().getDataByCurGameType().gameApplyData = msg
        UIManager.getInstance().openUI(GameApplyUI, 5,);
    }

    onReconnectVote(msg) {
        GameDataManager.getInstance().getDataByCurGameType().voteData = msg
        UIManager.getInstance().openUI(VoteUI, 30,);
        MessageManager.getInstance().disposeMsg();
    }

    //游戏错误消息
    onErrorResponse(msg: any) {
        GameManager.getInstance().openStrongTipsUI(StringData.getString(msg.warnCode), () => { });
        if (msg.warnCode == 500) //破产
        {
            var gameData = GameDataManager.getInstance().getDataByCurGameType()
            if (!gameData) {
                MessageManager.getInstance().disposeMsg();
                return
            }
            gameData.gameinfo.isDismissed = true;
        }
        MessageManager.getInstance().disposeMsg();
    }

    onTrusteeRec(msg) {
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
        if (GameDataManager.getInstance().curGameType == GAME_TYPE.ZJH) {
            MessageManager.getInstance().disposeMsg();
            return;
        }
        if (!gameData) {
            MessageManager.getInstance().disposeMsg();
            return
        }

        var realSeat = gameData.getRealSeatByRemoteSeat(msg.chairId)
        gameData.setTrustee(realSeat, msg.isTrustee)
        if (realSeat == 0) {
            if (msg.isTrustee)
                UIManager.getInstance().openUI(TuoGuanUI, 98);
            else
                UIManager.getInstance().closeUI(TuoGuanUI);
        }
        MessageManager.getInstance().disposeMsg();
    }

    onImportRec(msg) {
        GameManager.getInstance().openWeakTipsUI("导入成功");
        GameDataManager.getInstance().isImport = false
        MessageManager.getInstance().disposeMsg();
    }

    onClubInviteRec(msg) {
        try {
            var isNotPremitInvite = cc.sys.localStorage.getItem("isNotPremitInvite");
            if (parseInt(isNotPremitInvite) == 1) {
                MessageManager.getInstance().disposeMsg();
                return
            }
            var isNotPremitInviteBy5 = cc.sys.localStorage.getItem("isNotPremitInviteBy5");
            var nowTime = new Date().getTime()
            if (isNotPremitInviteBy5) {
                if (nowTime - parseInt(isNotPremitInviteBy5) < 300 * 1000) {
                    MessageManager.getInstance().disposeMsg();
                    return
                }
            }
            UIManager.getInstance().openUI(InviteJoinUI, 10, () => {
                UIManager.getInstance().getUI(InviteJoinUI).getComponent("InviteJoinUI").updateView(msg)
            })
        }
        catch (e) {
            UIManager.getInstance().openUI(InviteJoinUI, 10, () => {
                UIManager.getInstance().getUI(InviteJoinUI).getComponent("InviteJoinUI").updateView(msg)
            })
        }

        MessageManager.getInstance().disposeMsg();

    }

    private onGameServerInfoRec(msg) {
        GameDataManager.getInstance().systemData.gameTypeList = msg.gameSeverInfo.sort(function (a, b) { return a - b })
        MessageManager.getInstance().disposeMsg();
    }

    onNoticeRec(msg) {
        var globalRollNoticeList = []
        for (var info of msg.notices) {
            if (info.where == 1) // 全服公告
            {

                var msg = JSON.parse(info.content)
                var curTime = new Date().getTime() / 1000
                if (info.startTime <= curTime && (info.endTime >= curTime || info.endTime == -1)) {

                    if (info.type == 2) {
                        var title = "公 告"
                        if (msg.title)
                            title = msg.title
                        if (UIManager.getInstance().getUI(PhoneVerifyUI))
                            UIManager.getInstance().hideUI(PhoneVerifyUI)
                        GameManager.getInstance().openStrongTipsUI(msg.content, () => {
                            if (UIManager.getInstance().getUI(PhoneVerifyUI))
                                UIManager.getInstance().showUI(PhoneVerifyUI)
                        }, title);
                    }

                    else {
                        var noticeData = { playCount: info.playCount, content: msg.content, interval: info.interval }
                        globalRollNoticeList.push(noticeData)
                    }
                }
            }
            else if (info.where == 2) // 大厅公告
            {
                var msg = JSON.parse(info.content)
                var curTime = new Date().getTime() / 1000
                if (info.startTime <= curTime && (info.endTime >= curTime || info.endTime == -1)) {
                    if (UIManager.getInstance().getUI(HallUI)) {
                        if (info.type == 2) {
                            var title = "公 告"
                            if (msg.title)
                                title = msg.title
                            if (UIManager.getInstance().getUI(PhoneVerifyUI))
                                UIManager.getInstance().hideUI(PhoneVerifyUI)
                            GameManager.getInstance().openStrongTipsUI(msg.content, () => {
                                if (UIManager.getInstance().getUI(PhoneVerifyUI))
                                    UIManager.getInstance().showUI(PhoneVerifyUI)
                            }, title);
                        }
                        else {
                            let systeminfo = GameDataManager.getInstance().systemData;
                            systeminfo.hallNotice = msg.content
                        }

                    }
                }
            }
            else if (info.where == 3) // 俱乐部公告
            {

                if (UIManager.getInstance().getUI(ClubUI)) {
                    var contentData = JSON.parse(info.content)
                    UIManager.getInstance().getUI(ClubUI).getComponent("ClubUI").updateNotice(contentData.content, info.id, info.clubId)
                }
            }
        }
        if (globalRollNoticeList.length > 0) {
            let systeminfo = GameDataManager.getInstance().systemData;
            systeminfo.globalNoticeList = globalRollNoticeList
        }
        MessageManager.getInstance().disposeMsg();
    }

    onNoticeUpdate(msg) {
        // op: 0 nil, 1 ad, 2 del, 3 modeify
        var info = msg.notice
        if (info.where == 1) // 全服公告
        {
            if (msg.op == 2)
                return
            var msg = JSON.parse(info.content)
            var curTime = new Date().getTime() / 1000
            if (info.startTime <= curTime && (info.endTime >= curTime || info.endTime == -1)) {
                if (info.type == 2) {
                    var title = "公 告"
                    if (msg.title)
                        title = msg.title
                    if (UIManager.getInstance().getUI(PhoneVerifyUI))
                        UIManager.getInstance().hideUI(PhoneVerifyUI)
                    GameManager.getInstance().openStrongTipsUI(msg.content, () => {
                        if (UIManager.getInstance().getUI(PhoneVerifyUI))
                            UIManager.getInstance().showUI(PhoneVerifyUI)
                    }, title);
                }
                else {
                    var noticeData = { playCount: info.playCount, content: msg.content, interval: info.interval }
                    let systeminfo = GameDataManager.getInstance().systemData;
                    systeminfo.globalNoticeList = [noticeData]

                }
            }
        }
        else if (info.where == 2) // 大厅公告
        {
            var msg = JSON.parse(info.content)
            if (UIManager.getInstance().getUI(HallUI)) {
                if (info.type == 2) {
                    var title = "公 告"
                    if (msg.title)
                        title = msg.title
                    if (UIManager.getInstance().getUI(PhoneVerifyUI))
                        UIManager.getInstance().hideUI(PhoneVerifyUI)
                    GameManager.getInstance().openStrongTipsUI(msg.content, () => {
                        if (UIManager.getInstance().getUI(PhoneVerifyUI))
                            UIManager.getInstance().showUI(PhoneVerifyUI)
                    }, title);
                }
                else {
                    let systeminfo = GameDataManager.getInstance().systemData;
                    if (msg.op == 2)
                        systeminfo.hallNotice = ""
                    else
                        systeminfo.hallNotice = msg.content
                }

            }
        }
        else if (info.where == 3) // 俱乐部公告
        {

            if (UIManager.getInstance().getUI(ClubUI)) {
                var contentData = JSON.parse(info.content)
                UIManager.getInstance().getUI(ClubUI).getComponent("ClubUI").updateNotice(contentData.content, info.id, info.clubId)
            }
        }
        MessageManager.getInstance().disposeMsg();
    }

    // 同步数据
    onSyncDataRec(msg) {
        var idJson = null
        var info = null
        try {
            idJson = JSON.parse(msg.id)
            info = JSON.parse(msg.data)
        }
        catch (e) { }
        if (idJson == null || info == null) {
            MessageManager.getInstance().disposeMsg();
            return
        }
        if (idJson.type == "PARTNER" || idJson.type == "BOSS") {
            var clubData = GameDataManager.getInstance().clubData
            // 数据改变的是我当前选择的群
            if (clubData != null && (clubData.curSelectClubId == idJson.club_id || clubData.getPartnerClubId() == idJson.club_id)) {
                if (info.money != null)
                    clubData.playerScore = info.money
                if (info.commission != null)
                    clubData.commission = info.commission
            }
        }
        else if (idJson.type == "PLAYER") {
            if (idJson.guid == GameDataManager.getInstance().userInfoData.userId) {
                if (idJson.money_id == 0)
                    GameDataManager.getInstance().userInfoData.roomCard = info.money
                else {
                    var clubData = GameDataManager.getInstance().clubData
                    if (clubData != null && (clubData.curSelectClubId == idJson.club_id || clubData.getPartnerClubId() == idJson.club_id)) {
                        if (info.money != null)
                            clubData.playerScore = info.money
                        if (info.commission != null)
                            clubData.commission = info.commission
                    }
                }
            }
        }
        else if (idJson.type == "GAME") {
            var gameData = GameDataManager.getInstance().getDataByCurGameType()
            if (gameData) {
                for (var i = 0; i < info.players.length; i++) {
                    var realSeat = gameData.getRealSeatByRemoteSeat(info.players[i].chair_id)
                    gameData.updatePlayerScore(realSeat, info.players[i].money)
                }
            }
        }
        MessageManager.getInstance().disposeMsg();
    }

}
