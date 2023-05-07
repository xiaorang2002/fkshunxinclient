import { ListenerType } from './../data/ListenerType';
import { SocketManager } from './../../framework/Manager/SocketManager';
import { Utils } from './../../framework/Utils/Utils';
import { GameUIController } from './GameUIController';
import { ConstValue } from './../data/GameConstValue';
import { PhoneVerifyUI } from './PhoneVerifyUI';
import { LogWrap } from "../../framework/Utils/LogWrap";
import { HttpManager } from "../../framework/Manager/HttpManager";
import { BaseUI } from "../../framework/UI/BaseUI";
import * as GameConstValue from "../data/GameConstValue";
import { GameManager } from "../GameManager";
import { GameDataManager } from "../../framework/Manager/GameDataManager";
import { UIManager } from "../../framework/Manager/UIManager";
import { SdkManager } from "../../framework/Utils/SdkManager";
import { AudioManager } from "../../framework/Manager/AudioManager";
import { StringData } from "../data/StringData";
import { ListenerManager } from "../../framework/Manager/ListenerManager";
import { ClubUI } from "./ClubUI";
import * as Proto from "../../proto/proto-min";
import { MessageManager } from "../../framework/Manager/MessageManager";
import { WaitUI } from "./WaitUI";

const { ccclass, property } = cc._decorator;

@ccclass
export class LoginUI extends BaseUI {

    protected static className = "LoginUI";
    private progressCallBack: any = null;
    private progresTimes: number = 0;
    public isCheckVersion = false;

    @property(cc.Node)
    nodeLoading: cc.Node = null;
    @property(cc.Node)
    nodeLogin: cc.Node = null;
    @property(cc.Label)
    labelUpdate: cc.Label = null;
    @property(cc.ProgressBar)
    progressUpdate: cc.ProgressBar = null;
    @property(cc.EditBox)
    ebLoginEdit: cc.EditBox = null;
    @property(cc.Node)
    selectIpNode: cc.Node = null;
    @property(cc.EditBox)
    ebIpInputEdit: cc.EditBox = null;
    @property(cc.Label)
    labelVersion: cc.Label = null;

    @property({ type: [cc.SpriteFrame] })
    pingLvArg: Array<cc.SpriteFrame> = [];
    @property(cc.Sprite)
    pingLv: cc.Sprite = null
    private m_curUpdateTime = 1;
    // @property(cc.Node)
    // nodeIcon: cc.Node = null;

    onLoad() {
        //初始化位置
        this.nodeLoading.active = true;
        //从-490移动到-195
        this.nodeLogin.position = cc.v3(-7, -490);
        //初始化为获取更新
        this.labelUpdate.string = "检查更新中...";
        //初始化版本
        this.labelVersion.string = "version:" + GameConstValue.ConstValue.VERSION + GameConstValue.ConstValue.VERSION_NAME;

        ListenerManager.getInstance().add(ListenerType.newVersionChange, this, this.updateProgressSimulate);
        ListenerManager.getInstance().add(Proto.S2C_CLUBLIST_RES.MsgID.ID, this, this.onEnterClubResponse);
    }

    protected update(dt: number): void {
        this.m_curUpdateTime -= dt;
        if (this.m_curUpdateTime < 0) {
            this.m_curUpdateTime = 3;
            //LogWrap.log("GameDataManager.getInstance().getNetLevel():"+GameDataManager.getInstance().getNetLevel())
            this.pingLv.spriteFrame = this.pingLvArg[GameDataManager.getInstance().getNetLevel()]
        }
    }

    start() {
        this.isCheckVersion = false
        // SdkManager.getInstance().doIconImge(this.nodeIcon);
        if (GameDataManager.getInstance().gpsData == null || (GameDataManager.getInstance().gpsData.jingdu < 0 || GameDataManager.getInstance().gpsData.weidu < 0))
            SdkManager.getInstance().doGetLocation()
        this.checkConfig()
        GameManager.getInstance().changeMusic();
        this.node.getChildByName("node_logining").active = false;
        this.node.getChildByName("left_right_node").getChildByName("xiufu").active = cc.sys.isNative
    }

    public checkConfig() {
        if (SdkManager.getInstance().isEmulator()) {
            GameManager.getInstance().openSelectTipsUI("\n      设备受限，请用手机登录!", () => {
                cc.game.end()
            }, () => {
                cc.game.end()
            });
            return
        }
        if (this.node == null)
            return;
        if (GameConstValue.ConstValue.LOGIN_MODE == GameConstValue.LOGIN_TYPE.LOGIN_DEBUG && !GameConstValue.ConstValue.DEBUG_WX) {
            GameUIController.getInstance().preloadGameUIByType(0)
            this.getVersionResponse()
            return
        }
        var storageConfig = cc.sys.localStorage.getItem("aLiYunConfig");
        var storageReqConfigUrl = cc.sys.localStorage.getItem("currentReqConfigUrl");
        var outTime = cc.sys.localStorage.getItem("outTime");
        if(!outTime || outTime == 'undefined'){
            outTime = 5000
        }
        if (storageConfig && GameDataManager.getInstance().systemData.lastSuccessConfigUrl == "" && !GameConstValue.ConstValue.SELECT_IP) {
            try {
                var localConfig = JSON.parse(storageConfig)
                if (storageReqConfigUrl) {
                    GameDataManager.getInstance().systemData.lastSuccessConfigUrl = storageReqConfigUrl
                }

                if (localConfig.configList) {
                    GameDataManager.getInstance().systemData.curConfigList = localConfig.configList
                    GameDataManager.getInstance().systemData.curConfigList.forEach((element,index)=>{
                        GameDataManager.getInstance().systemData.curConfigList[index] = HttpManager.getInstance().decrypt(element,ConstValue.AESkey)
                    })
                    GameDataManager.getInstance().systemData.maxConfigGetNum = localConfig.configList.length
                    GameDataManager.getInstance().systemData.curConfigGetIndex = -1
                }
            }
            catch (e) { }
        }
        if (cc.sys.isNative && !SdkManager.getInstance().checkClientNetWorkReachable()) {
            let surefun = () => {
                if (UIManager.getInstance().getUI(LoginUI))
                    UIManager.getInstance().getUI(LoginUI).getComponent("LoginUI").checkConfig()
            }
            GameManager.getInstance().openStrongTipsUI(StringData.getString(10016), surefun);
            return
        }
        if (GameDataManager.getInstance().systemData.remoteConfigInfo != "") {
            this.getVersionResponse()
        }
        else {
            this.labelUpdate.string = "获取远程配置中...";
            var callBack = function (error, ret) {
                var success = false;
                if (ret != null) {
                    LogWrap.info("\n---configJson----拉取的配置信息:", ret);
                    GameDataManager.getInstance().systemData.remoteConfigInfo = ret
                    success = this.initConfig(ret);
                }
                if (success) {
                    this.getVersionResponse()
                    GameUIController.getInstance().preloadGameUIByType(0)
                }
                else {
                    GameDataManager.getInstance().systemData.remoteConfigInfo = ""
                    var configList = GameDataManager.getInstance().systemData.curConfigList
                    if (GameDataManager.getInstance().systemData.maxConfigGetNum > 0) {
                        for (var i = 0; i < configList.length; i++) {
                            if (i > GameDataManager.getInstance().systemData.curConfigGetIndex) {
                                if (configList[i].indexOf("config.json") >= 0) {
                                    GameDataManager.getInstance().systemData.lastSuccessConfigUrl = configList[i]
                                } else {
                                    GameDataManager.getInstance().systemData.lastSuccessConfigUrl = configList[i] + ConstValue.HOTFIX_DYMJ[ConstValue.LOGIN_MODE]
                                }
                                GameDataManager.getInstance().systemData.curConfigGetIndex = i
                                GameDataManager.getInstance().systemData.maxConfigGetNum -= 1
                                this.tryGetNextConfig()
                                return
                            }
                        }
                        this.onConfigGetFailed()
                    }
                    else
                        this.onConfigGetFailed()
                    GameUIController.getInstance().preloadGameUIByType(0)
                }
            }.bind(this);
            var configUrl = ConstValue.CONFIG_URL
            if (GameDataManager.getInstance().systemData.lastSuccessConfigUrl != "")
                configUrl = GameDataManager.getInstance().systemData.lastSuccessConfigUrl
            GameDataManager.getInstance().systemData.currentReqConfigUrl = configUrl
            HttpManager.getInstance().get(configUrl, "", null, callBack,Number(outTime));
        }
    }

    private initConfig(info) {
        if (!info || info == undefined)
            return false
        try {
            var data = JSON.parse(info)
            ConstValue.hotfixUrl = data.hotfix_url
            ConstValue.MAX_CLUB_PLAYER_LIMIT = data.clubPlayerLimit
            ConstValue.backstageUrl = HttpManager.getInstance().decrypt(data.backstage_url,ConstValue.AESkey)
            ConstValue.replaceUrl = HttpManager.getInstance().decrypt(data.replace_url,ConstValue.AESkey)
            ConstValue.shareUrl = HttpManager.getInstance().decrypt(data.share,ConstValue.AESkey)
            ConstValue.regionlist = data.regionlist
            let regionlist = data.regionlist
            for (let i = 0; i < regionlist.length; i++) {
                if (GameConstValue.ConstValue.NET_ADDRESS.search(regionlist[i]) != -1) {
                    ConstValue.backstageUrl = ConstValue.replaceUrl
                    break
                }
            }
            LogWrap.log("\n--initConfig--ConstValue.backstageUrl:", ConstValue.backstageUrl, "\n")
            var ipList = []
            if (data.address_list && data.address_list.length > 0)
                ipList = data.address_list
            else if (data.address)
                ipList = data.address.split("&")
            else
                return false
            LogWrap.enble = data.log > 0 ? true : false
            // if (data.address_list && data.address_list.length > 0)
            // {
            //     GameDataManager.getInstance().systemData.randomIpList = data.address_list
            // }
            ipList.forEach((element,index)=>{
                ipList[index] = HttpManager.getInstance().decrypt(element,ConstValue.AESkey)
            })
            LogWrap.log(ipList.toString())
            GameDataManager.getInstance().systemData.curIpList = ipList
            if (data.configList) {
                GameDataManager.getInstance().systemData.curConfigList = data.configList
                GameDataManager.getInstance().systemData.curConfigList.forEach((element,index)=>{
                    GameDataManager.getInstance().systemData.curConfigList[index] = HttpManager.getInstance().decrypt(element,ConstValue.AESkey)
                })
                GameDataManager.getInstance().systemData.maxConfigGetNum = data.configList.length
                GameDataManager.getInstance().systemData.curConfigGetIndex = -1
            }
            GameDataManager.getInstance().systemData.maxRoundRobinNum = ipList.length
            GameDataManager.getInstance().systemData.version = data.version
            if (data.kefu)
                GameDataManager.getInstance().systemData.kefu = data.kefu
            if (data.online_kefu_url)
                GameDataManager.getInstance().systemData.onlineKefuUrl = HttpManager.getInstance().decrypt(data.online_kefu_url,ConstValue.AESkey)
            if (data.wxAppId)
                ConstValue.WX_APP_ID = data.wxAppId
            if (data.wxAppSecret)
                ConstValue.WX_APP_SECRET = data.wxAppSecret
            ConstValue.initByConfig()
            cc.sys.localStorage.setItem("aLiYunConfig", GameDataManager.getInstance().systemData.remoteConfigInfo);
            cc.sys.localStorage.setItem("currentReqConfigUrl", GameDataManager.getInstance().systemData.currentReqConfigUrl);
            cc.sys.localStorage.setItem("outTime",data.timeOut);
            if (ConstValue.SELECT_IP) {
                this.inputIpData()
            }
            return true
        }
        catch (e) {
            LogWrap.info("initConfig error: " + e)
            return false
        }
    }

    // 首次拉取配置失败将使用默认地址
    private tryGetNextConfig() {
        this.checkConfig()
    }

    private onConfigGetFailed() {
        let surefun = () => {
            this.checkConfig()
        }
        let cancle = () => {
            var storageConfig = cc.sys.localStorage.getItem("aLiYunConfig");
            this.initConfig(storageConfig)
            this.getVersionResponse()
        }
        GameManager.getInstance().openSelectTipsUI("游戏配置获取失败，是否重新获取？（取消后将使用本地配置）", surefun, cancle);
    }

    private getVersionResponse() {
        this.labelUpdate.string = "检查更新中,请不要关闭游戏...";
        var remoteVersion = GameDataManager.getInstance().systemData.version
        var newver = parseInt(remoteVersion.split(".").join(""));
        var oldver = parseInt(ConstValue.VERSION_ARR[ConstValue.LOGIN_MODE].split(".").join(""));
        //是否需要更新
        if (newver - oldver >= 1000) {
            //弹出下载强提示
            let surefun = () => {
                cc.sys.openURL("http://url.iojba.com/GZYIY/")
                cc.game.end()
            }
            let cancle = () => {
                cc.sys.openURL("http://url.iojba.com/GZYIY/")
                cc.game.end()
            }

            GameManager.getInstance().openSelectTipsUI(StringData.getString(10025), surefun, cancle);
        }
        else if (newver > oldver) {
            //远程版本大于本地版本需要更新
            LogWrap.info("发现最新版本，前往热更");
            //格式化版本号
            let verstr = "ver_" + remoteVersion.replace(/\./g, '_');
            //远程版本大于当前版本，热更新
            this.node.getComponent("HotUpdate").checkUpdate(GameConstValue.ConstValue.HOT_UPDATE_URL, verstr);
        }
        else {
            var callBack2 = function (error, ret) {
                if (ret) {
                    GameDataManager.getInstance().systemData.shareSid = sid
                    GameDataManager.getInstance().systemData.shareData = ret
                }
            }
            let isInstallGame = cc.sys.localStorage.getItem("isInstallGame");
            if (!isInstallGame || isInstallGame == undefined) {
                cc.sys.localStorage.setItem("isInstallGame", "1");
                var sid = cc.sys.localStorage.getItem("installSid")
                if (sid == "" || !sid) {

                }
                else {
                    var para = { traceId: sid }
                    HttpManager.getInstance().post(ConstValue.SHARE_INSTALL_REP, "", null, JSON.stringify(para), callBack2);
                }
            }
            // 已经是最新版本
            SdkManager.getInstance().registerWxNativeData(ConstValue.WX_APP_ID, ConstValue.WX_APP_SECRET) //初始化微信登录数据部分
            this.isCheckVersion = true
            this.updateProgressSimulate();
            GameManager.getInstance().connectSocket();
        }
    }

    public onLogining() {
        this.node.getChildByName("node_logining").active = true;
        this.node.getChildByName("node_logining").getChildByName("desc").getComponent(cc.Label).string = "登录中,请稍后..."
        this.node.getChildByName("node_logining").getChildByName("sp_wait").runAction(cc.repeatForever(cc.rotateBy(1, 360)));
        this.schedule(this.onLoginingTimeOut, 10, 1)
    }

    public onLoginingSuccess() {
        this.unschedule(this.onLoginingTimeOut)
        this.node.getChildByName("node_logining").active = false;
        this.node.getChildByName("node_logining").getChildByName("sp_wait").stopAllActions()
    }

    public onLoginingTimeOut(time?, repeat?, delay?, tipsId = 10073) {
        this.unschedule(this.onLoginingTimeOut)
        if (UIManager.getInstance().getUI(LoginUI)) {
            if (tipsId == 10073)
                GameManager.getInstance().openStrongTipsUI(StringData.getString(tipsId), () => { });
            this.node.getChildByName("node_logining").active = false;
            this.node.getChildByName("node_logining").getChildByName("sp_wait").stopAllActions()
            this.nodeLogin.runAction(cc.moveTo(0.25, cc.v2(-7, -195)));
            this.nodeLoading.runAction(cc.moveTo(0.25, cc.v2(-7, -490)));
        }
    }

    //检测更新进度条模拟，完成之后调用登录按钮
    private updateProgressSimulate() {
        this.progresTimes = 0;
        this.progressCallBack = () => {
            if (this.progresTimes === 10) {
                this.unschedule(this.progressCallBack);
                this.changeLoginMode();
                this.node.getChildByName("sp_touzi").active = false
            }
            this.progressUpdate.progress += 0.1;
            this.node.getChildByName("sp_touzi").position = cc.v3(-451.5 + 904 * this.progressUpdate.progress, -251.2);
            this.progresTimes++;
        }
        this.schedule(this.progressCallBack, 0.1);
    }

    //切换为登录按钮模式
    private changeLoginMode() {
        if ((GameConstValue.ConstValue.LOGIN_MODE != GameConstValue.LOGIN_TYPE.LOGIN_DEBUG && !GameConstValue.ConstValue.SELECT_IP) || GameConstValue.ConstValue.DEBUG_WX) {
            // 只有当登录信息中未存储openid，并且本地记录中存在openid时才会自动登录
            if (GameDataManager.getInstance().loginInfoData.openId == "" && GameDataManager.getInstance().loginInfoData.checkLoginInfo()) {
                GameDataManager.getInstance().loginInfoData.setSaveLoginInfo();
                if (SocketManager.getInstance().getSocketConnect()) {
                    var phoneType = ""
                    if (cc.sys.os == cc.sys.OS_ANDROID) {
                        phoneType = "Android"

                    } else if (cc.sys.os == cc.sys.OS_IOS) {
                        phoneType = "Ios"
                    } else {
                        phoneType = "H5"
                    }
                    var localOpenId = GameDataManager.getInstance().loginInfoData.openId
                    var imei = SdkManager.getInstance().doGetNativeUniqueId()
                    let msgb = {
                        account: "",    // 账号
                        password: "",     // 密码
                        phone: "",      // 手机型号
                        phoneType: phoneType,  // 手机类型
                        imei: imei,       // 设备唯一码
                        ip: ConstValue.NET_IP,         // 客户端ip
                        version: GameConstValue.ConstValue.VERSION, // 版本号
                        channelId: "",      // 渠道号
                        packageName: GameConstValue.ConstValue.PACKAGE_NAME, // 安装包名字
                        ipArea: "",          // 客户端ip地区
                        platformId: "",      // 平台id
                        openId: localOpenId  // 唯一开放id
                    }
                    GameDataManager.getInstance().loginInfoData.isAccountLogin = false
                    MessageManager.getInstance().messageSend(Proto.CL_Login.MsgID.ID, msgb);
                    this.onLogining()
                    return;
                }
            }
        }
        this.nodeLogin.runAction(cc.moveTo(0.25, cc.v2(-7, -195)));
        this.nodeLoading.runAction(cc.moveTo(0.25, cc.v2(-7, -490)));
        this.selectIpNode.active = GameConstValue.ConstValue.SELECT_IP
        if ((GameConstValue.ConstValue.LOGIN_MODE == GameConstValue.LOGIN_TYPE.LOGIN_DEBUG && !GameConstValue.ConstValue.DEBUG_WX) || GameConstValue.ConstValue.RELEASE_TEST)
            this.ebLoginEdit.node.active = true;
        else
            this.ebLoginEdit.node.active = false;
    }

    //清除缓存
    private button_xiufu()
    {
        let surefun = () => {
            this.node.getComponent("HotUpdate").onClickXiuFu()
        };
        let closefun = () => {

        };
        GameManager.getInstance().openSelectTipsUI("是否清除缓存",surefun,closefun);
    }

    //登录按钮
    private button_login(event, customEvent) {
        AudioManager.getInstance().playSFX("button_click");
        //获取用户数据
        //微信获取，本地测试数据
        var promoter = 0
        var channelId = ""
        if (GameDataManager.getInstance().systemData.shareSid != "" && GameDataManager.getInstance().systemData.shareData != "") {
            try {
                var oMsg = JSON.parse(GameDataManager.getInstance().systemData.shareData)
                promoter = oMsg.data.params.promoter
                channelId = oMsg.data.params.channel_id
                GameDataManager.getInstance().systemData.promoter = promoter
                GameDataManager.getInstance().systemData.channelId = channelId
            }
            catch (e) {
                LogWrap.info(e)
            }
        }
        if ((GameConstValue.ConstValue.LOGIN_MODE == GameConstValue.LOGIN_TYPE.LOGIN_DEBUG && !GameConstValue.ConstValue.DEBUG_WX) || GameConstValue.ConstValue.RELEASE_TEST || GameConstValue.ConstValue.SELECT_IP) {
            //debug模式下随机账号进入
            let testId = "123456";
            if (this.ebLoginEdit.string !== "")
                testId = this.ebLoginEdit.string;
            else
                testId = Math.floor(Math.random() * 999999).toString();

            //封装玩家基本信息
            GameDataManager.getInstance().loginInfoData.openId = testId
            let msgb = {
                phoneType: "H5",  // 手机类型
                version: GameConstValue.ConstValue.VERSION, // 版本号
                packageName: GameConstValue.ConstValue.PACKAGE_NAME, // 安装包名字
                ip: ConstValue.NET_IP,         // 客户端ip
                openId: testId,  // 唯一开放id
                promoter: promoter,
                channelId: channelId
            }
            this.onLogining()
            GameDataManager.getInstance().loginInfoData.isAccountLogin = false
            MessageManager.getInstance().messageSend(Proto.CL_Login.MsgID.ID, msgb);
        }
        // else if (GameDataManager.getInstance().loginInfoData.openId != "") //  如果本地记录的openid不为空
        // {
        //     var phoneType = ""
        //     if (cc.sys.os == cc.sys.OS_ANDROID) {
        //         phoneType = "Android"

        //     } else if (cc.sys.os == cc.sys.OS_IOS) {
        //         phoneType = "Ios"
        //     } else {
        //         phoneType = "H5"
        //     }
        //     var localOpenId = GameDataManager.getInstance().loginInfoData.openId
        //     var imei = SdkManager.getInstance().doGetNativeUniqueId()
        //     let msgb = {
        //         account: "",    // 账号
        //         password: "",     // 密码
        //         phone: "",      // 手机型号
        //         phoneType: phoneType,  // 手机类型
        //         imei: imei,       // 设备唯一码
        //         ip: "",         // 客户端ip
        //         version: GameConstValue.ConstValue.VERSION, // 版本号
        //         channelId: "",      // 渠道号
        //         packageName: "dymj", // 安装包名字
        //         ipArea: "",          // 客户端ip地区
        //         platformId: "",      // 平台id
        //         openId: localOpenId  // 唯一开放id
        //     }
        //     MessageManager.getInstance().messageSend(Proto.CL_Login.MsgID.ID, msgb);
        //     if (UIManager.getInstance().getUI(LoginUI))
        //         UIManager.getInstance().getUI(LoginUI).getComponent("LoginUI").onLogining()
        // }
        else if (GameConstValue.ConstValue.LOGIN_MODE >= GameConstValue.LOGIN_TYPE.LOGIN_PRE || GameConstValue.ConstValue.DEBUG_WX) {
            SdkManager.getInstance().doWeChatLogin();
        }
    }

    private button_phone() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(PhoneVerifyUI, 1, () => {
            UIManager.getInstance().getUI(PhoneVerifyUI).getComponent("PhoneVerifyUI").setBtnVisible("login")
        })
    }

    private onEnterClubResponse(msg: any) {
        GameDataManager.getInstance().clubData = msg.clubs;

        //发完消息转场
        UIManager.getInstance().openUI(ClubUI, 0, () => {
            UIManager.getInstance().closeUI(LoginUI);
        });
    }
    private button_IpSelet(event, customEvent) {
        let ipMode = parseInt(customEvent)
        //如果是调试模式  预发布  正式环境 需要重新向服务器拉取配置再连接对应的ip
        if (ipMode >= 0 && ipMode < 3) {
            GameConstValue.ConstValue.LOGIN_MODE = ipMode;
            GameConstValue.ConstValue.resetConfig();
            GameDataManager.getInstance().systemData.version = "1.0.03";
            GameDataManager.getInstance().systemData.remoteConfigInfo = "";
            GameDataManager.getInstance().systemData.lastSuccessConfigUrl = "";
            cc.sys.localStorage.setItem("aLiYunConfig", "");
            this.checkConfig();
        }
        else if (ipMode == 3) {
            if (this.ebIpInputEdit.string == "") {
                GameManager.getInstance().openWeakTipsUI("IP不能为空！");
                return;
            } else {
                let inputIp = this.ebIpInputEdit.string;
                UIManager.getInstance().openUI(WaitUI, 100, () => {
                    SocketManager.getInstance().clientClose();
                    SocketManager.getInstance().connect(inputIp);
                });
            }
        }

    }
    inputIpData() {
        if (GameConstValue.ConstValue.LOGIN_MODE == GameConstValue.LOGIN_TYPE.LOGIN_DEBUG) {
            this.ebIpInputEdit.string = ConstValue.IP_ARR[ConstValue.LOGIN_MODE][0]
        }
        else {
            var sysData = GameDataManager.getInstance().systemData
            var connectIp = sysData.getRandomNewIp()
            if (connectIp.indexOf(":") >= 0)
                this.ebIpInputEdit.string = "ws://" + connectIp;
            else {
                this.ebIpInputEdit.string = "ws://" + connectIp + ":" + 8100;
            }
        }
    }
}
