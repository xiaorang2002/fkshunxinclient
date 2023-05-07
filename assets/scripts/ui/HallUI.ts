import { GameUIRepeatMsgManage } from './GameUIRepeatMsgManage';
import { PhoneVerifyUI } from './PhoneVerifyUI';
import { ClubSelectUI } from './objects/club/ClubSelectUI';
import { ThirdSelectUI } from './ThirdSelectUI';
import { NoticeUI } from './NoticeUI';
import { RealCertUI } from './RealCertUI';
import { SdkManager } from './../../framework/Utils/SdkManager';
import { KefuUI } from './KefuUI';
import { CreateClubUI } from './objects/club/CreateClubUI';
import { HelpUI } from './HelpUI';
import { StringData } from './../data/StringData';
import { GameManager } from './../GameManager';
import { REDDOT_TYPE,ConstValue } from './../data/GameConstValue';
import { Utils } from './../../framework/Utils/Utils';
import { GameUIController } from './GameUIController';
import { BaseUI, UIClass } from "../../framework/UI/BaseUI";
import { GameDataManager } from "../../framework/Manager/GameDataManager";
import { ListenerManager } from "../../framework/Manager/ListenerManager";
import { ListenerType } from "../data/ListenerType";
import { UIManager } from "../../framework/Manager/UIManager";
import { ClubUI } from "./ClubUI";
import { RuleUI } from "./RuleUI";
import * as Proto from "../../proto/proto-min";
import { MessageManager } from "../../framework/Manager/MessageManager";
import MailUI from "./MailUI";
import { HallSettingUI } from "./HallSettingUI";
import { AudioManager } from "../../framework/Manager/AudioManager";
import { ClubRecordUI } from "./objects/club/ClubRecordUI";
import { LogWrap } from '../../framework/Utils/LogWrap';
import GameNet from './GameNet';
import { ActivityUI } from './ActivityUI';



const { ccclass, property } = cc._decorator;

@ccclass
export class HallUI extends BaseUI {

    protected static className = "HallUI";
    @property(cc.Node)
    nodeTop: cc.Node = null;
    @property(cc.Node)
    nodeMid: cc.Node = null;
    @property(cc.Node)
    nodeBottom: cc.Node = null;

    //组件
    @property(cc.Node)
    nodeHead: cc.Node = null;
    @property(cc.Node)
    nodeGold: cc.Node = null;
    @property(cc.Label)
    labelRoomCard: cc.Label = null;
    @property(cc.Node)
    nodeRollNotice: cc.Node = null;
    @property([cc.SpriteFrame])
    clubBgSpf: cc.SpriteFrame[] = [];

    @property({ type: [cc.SpriteFrame] })
    pingLvArg: Array<cc.SpriteFrame> = [];
    @property(cc.Sprite)
    pingLv: cc.Sprite = null
    @property(cc.Label)
    labelSigle: cc.Label = null;

    private openUIType = 0
    private ssActionStatus = 0
    private loadingClub = false
    private waitTime = 3   // 亲友群点击等待时间3秒
    private m_curUpdateTime = 1; // 两秒更新一次电量和时间

    onLoad() {

        //加入消息监听
        ListenerManager.getInstance().add(ListenerType.noticeChanged, this, this.updateNotice);
        ListenerManager.getInstance().add(ListenerType.RoomCardsChanged, this, this.onRoomCardsChanged);
        ListenerManager.getInstance().add(ListenerType.reddotCountChanged, this, this.updateRedDotView);
        ListenerManager.getInstance().add(ListenerType.clubEnterChanged, this, this.clubEnterChanged);
        ListenerManager.getInstance().add(ListenerType.clubBgChange, this, this.onClubBgChanged);
        ListenerManager.getInstance().add(ListenerType.returnHallStatusChanged, this, this.onReturnHallStatusRec);
        
        ListenerManager.getInstance().add(Proto.SC_CreateRoom.MsgID.ID, this, this.onEnterRoomResponse);
        ListenerManager.getInstance().add(Proto.SC_JoinRoom.MsgID.ID, this, this.onJoinRoomResponse);
        ListenerManager.getInstance().add(Proto.S2C_CLUBLIST_RES.MsgID.ID, this, this.onEnterClubResponse);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_OP_RES.MsgID.ID, this, this.onClubOpRec);
        ListenerManager.getInstance().add(Proto.SC_PullMails.MsgID.ID, this, this.onMailListRec);
        ListenerManager.getInstance().add(Proto.S2C_CREATE_CLUB_RES.MsgID.ID, this, this.clubCreateResponse);
        ListenerManager.getInstance().add(Proto.SC_SetNickname.MsgID.ID, this, this.onNickNameChange);
        ListenerManager.getInstance().add(Proto.SC_RequestBindWx.MsgID.ID, this, this.onWxImportRec);

        
    }

    update(dt)
    {
        if (this.loadingClub)
        {
            this.waitTime -= dt;
            if (this.waitTime <= 0)
            {
                this.waitTime = 3
                this.loadingClub = false;
            }
        }

        this.m_curUpdateTime -= dt;
        if (this.m_curUpdateTime < 0) {
            this.m_curUpdateTime = 3;
            this.labelSigle.string = GameDataManager.getInstance().systemData.ping + "ms";
            //LogWrap.log("GameDataManager.getInstance().getNetLevel():"+GameDataManager.getInstance().getNetLevel())
            this.pingLv.spriteFrame = this.pingLvArg[GameDataManager.getInstance().getNetLevel()]
        }
    }

    start() {
        this.initData();
        cc.sys.localStorage.setItem("inClub", false);
        this.updateRedDotView()
        MessageManager.getInstance().messageSend(Proto.CS_GameServerCfg.MsgID.ID, {}); // 请求当前游戏服信息
        this.updateNotice({type:1})
        this.onClubBgChanged()
        this.onReturnHallStatusRec()
    }

    onShow()
    {
        this.loadingClub = false
        this.onReturnHallStatusRec()
        MessageManager.getInstance().messageSend(Proto.CS_GameServerCfg.MsgID.ID, {}); // 请求当前游戏服信息
    }

    //初始化数据
    private initData() {
        //初始化头像信息
        let userinfo = GameDataManager.getInstance().userInfoData;
        this.nodeHead.getComponent("BasePlayerInfoUI").updateInfo(userinfo.userHead, userinfo.userName, userinfo.userId);
        this.node.getChildByName("btn_invite").active = userinfo.playerType == 3 
    }

    //大厅滚动公告更新
    private updateNotice(msg) {
        let systeminfo = GameDataManager.getInstance().systemData;
        var content = systeminfo.hallNotice
        if (content == "")
            content = "本游戏仅供休闲娱乐，禁止赌博，一经发现立刻封停账号！！！"
        this.node.getChildByName("node_top").getChildByName("message_sprite").active = true
        this.node.getChildByName("node_top").getChildByName("mask").active = true
        if (msg.type == 2 && systeminfo.globalNoticeList.length > 0)
            return
        if (systeminfo.globalNoticeList.length > 0)
        {
            this.nodeRollNotice.getComponent("BaseRollNotice").startGlobalNotice(systeminfo.globalNoticeList);
            this.nodeRollNotice.getComponent("BaseRollNotice").setDefautNotice(content)
        }
        else
        {
            this.nodeRollNotice.getComponent("BaseRollNotice").updateInfo(content);
            this.nodeRollNotice.getComponent("BaseRollNotice").initAction();
        }
    }

    private updateRedDotView()
    {
        var oRedDot = GameDataManager.getInstance().ReddotData;
        var count = oRedDot.getReddotByType(REDDOT_TYPE.MAIL)
        this.node.getChildByName("node_bottom").getChildByName("di").getChildByName("sp_reddot").active = count > 0
    }

    private clubEnterChanged()
    {
        this.loadingClub = false
        UIManager.getInstance().closeUI(HallUI);
    }        


    private onMailListRec(msg)
    {
        UIManager.getInstance().openUI(MailUI, 1, () => {
            UIManager.getInstance().getUI(MailUI).getComponent("MailUI").UpdateMailList(msg.mails);
        });
        MessageManager.getInstance().disposeMsg();

    }

    private onClubBgChanged()
    {
        var curClubBgIdx = cc.sys.localStorage.getItem("clubBgIndex")
        if (!curClubBgIdx)
            return
        this.node.getChildByName("sp_hall_bg").getComponent(cc.Sprite).spriteFrame = this.clubBgSpf[parseInt(curClubBgIdx) - 1] 
    }

    private onReturnHallStatusRec()
    {
        this.node.getChildByName("btn_return_room").active = GameDataManager.getInstance().returnHallStatus
    }

    private clubCreateResponse(msg)
    {
        GameDataManager.getInstance().isCreatingClub = false
        var uiType = parseInt(cc.sys.localStorage.getItem("curClubType")) ;
        MessageManager.getInstance().messageSend(Proto.C2S_CLUBLIST_REQ.MsgID.ID, {type: uiType});
        //创建成功弹出提示，说明板子
        GameManager.getInstance().openStrongTipsUI(StringData.getString(10050), () => { });
        UIManager.getInstance().closeUI(CreateClubUI);
        MessageManager.getInstance().disposeMsg();
    }

    private onNickNameChange(msg)
    {
        let userinfo = GameDataManager.getInstance().userInfoData;
        userinfo.userName = msg.nickname
        GameManager.getInstance().openWeakTipsUI("修改昵称成功");
        this.nodeHead.getComponent("BasePlayerInfoUI").updateInfo(userinfo.userHead, userinfo.userName, userinfo.userId);
        if (UIManager.getInstance().getUI(HallSettingUI))
            UIManager.getInstance().getUI(HallSettingUI).getComponent("HallSettingUI").updateName()
        MessageManager.getInstance().disposeMsg();
    }

    private onWxImportRec(msg)
    {
        GameManager.getInstance().openWeakTipsUI("导入微信昵称，头像成功");
        let userinfo = GameDataManager.getInstance().userInfoData;
        userinfo.userName = msg.pbBaseInfo.nickname
        userinfo.userSex = msg.pbBaseInfo.sex
        userinfo.userHead = msg.pbBaseInfo.icon
        this.nodeHead.getComponent("BasePlayerInfoUI").updateInfo(userinfo.userHead, userinfo.userName, userinfo.userId);
        MessageManager.getInstance().disposeMsg();
    }

    onClubOpRec(msg)
    {
        if (msg.op == 10)
        {
            GameManager.getInstance().openWeakTipsUI("操作成功");
        }
        MessageManager.getInstance().disposeMsg();
    }

    onRoomCardsChanged()
    {
        this.labelRoomCard.string = Utils.FormatNum(GameDataManager.getInstance().userInfoData.roomCard,0)
    }

    // private doMoreSSAction(type) // 更多按钮的伸缩动画
    // {
    //     var size = this.node.getContentSize()
    //     var leftNode = this.node.getChildByName("node_left")
    //     if (type == 0) // 伸开
    //     {
    //         leftNode.position = cc.v2(-size.width/2-63,0)
    //         var action = cc.moveTo(0.2, cc.v2(-size.width/2, 0));
    //         this.ssActionStatus = 1
    //         this.moreBtnNode.angle = 180
    //     }
    //     else // 缩回
    //     {
    //         leftNode.position = cc.v2(-size.width/2, 0)
    //         var action = cc.moveTo(0.2, cc.v2(-size.width/2-63, 0));
    //         this.ssActionStatus = 0
    //         this.moreBtnNode.angle = 0
    //     }
    //     leftNode.runAction(action)    
    // }

    //加入房间按钮
    private button_join() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(CreateClubUI, 1, () => {
            UIManager.getInstance().getUI(CreateClubUI).getComponent("CreateClubUI").initView("join");
            UIManager.getInstance().getUI(CreateClubUI).getComponent("CreateClubUI").setHallJoin()
        });
    }
    

    //创建房间按钮
    private button_create() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(RuleUI, 1, () => {
            UIManager.getInstance().getUI(RuleUI).getComponent("RuleUI").setGameTypeData(GameDataManager.getInstance().systemData.gameTypeList);
            UIManager.getInstance().getUI(RuleUI).getComponent("RuleUI").initUI(0);
        });
    }
    //邮件按钮
    private button_Mail() {
        AudioManager.getInstance().playSFX("button_click");
        MessageManager.getInstance().messageSend(Proto.CS_PullSummaryMails.MsgID.ID, {});
    }
    //详细信息按钮
    private button_userInfo() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(HallSettingUI, 1);
    }

    //亲友群按钮
    private button_club() {
        AudioManager.getInstance().playSFX("button_click");
        if (this.loadingClub)
        {
            GameManager.getInstance().openWeakTipsUI("亲友群加载中");
            return;
        }
        this.openUIType = 0
        this.loadingClub = true
        MessageManager.getInstance().messageSend(Proto.C2S_CLUBLIST_REQ.MsgID.ID, {type : 0});
    }


    //战绩
    private button_record() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(ClubRecordUI, 1, () => {
            let userinfo = GameDataManager.getInstance().userInfoData;
            UIManager.getInstance().getUI(ClubRecordUI).getComponent("ClubRecordUI").setQueryPlayerInfo(userinfo.userId, userinfo.userName, userinfo.userHead)
            UIManager.getInstance().getUI(ClubRecordUI).getComponent("ClubRecordUI").updateView()
        })
    }

    //设置
    private button_setting() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(HallSettingUI, 1);
    }

    /**商店 */
    private button_shop() {
        AudioManager.getInstance().playSFX("button_click");
        GameManager.getInstance().openWeakTipsUI("制作中，敬请期待");
        return

    }

    /**赛事按钮 */
    private button_match() {
        AudioManager.getInstance().playSFX("button_click");
        if (this.loadingClub)
        {
            GameManager.getInstance().openWeakTipsUI("赛事加载中");
            return;
        }
        this.openUIType = 1
        this.loadingClub = true
        MessageManager.getInstance().messageSend(Proto.C2S_CLUBLIST_REQ.MsgID.ID, {type : 1});
    }

    private button_help()
    {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(HelpUI, 1, () => {
            UIManager.getInstance().getUI(HelpUI).getComponent("HelpUI").setGameTypeData()
        });
    }

    private button_active()
    {
        AudioManager.getInstance().playSFX("button_click");
        GameManager.getInstance().openWeakTipsUI("制作中，敬请期待");
    }

    // /**更多选项按钮 */
    // private button_more() {
    //     AudioManager.getInstance().playSFX("button_click");
    //     if (this.ssActionStatus == 0) // 伸出
    //         this.doMoreSSAction(0)
    //     else // 缩回
    //         this.doMoreSSAction(1)
    // }

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

    private button_shareActive()
    {
        AudioManager.getInstance().playSFX("button_click");
        
    }

    private button_wx()
    {
        AudioManager.getInstance().playSFX("button_click");
        SdkManager.getInstance().doWeChatLogin();
    }

    private button_bdzh()
    {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(PhoneVerifyUI, 1, ()=> {
            UIManager.getInstance().getUI(PhoneVerifyUI).getComponent("PhoneVerifyUI").setBtnVisible("bind","hall")
        })
    }

    private button_realcert()
    {
        AudioManager.getInstance().playSFX("button_click");
        let userinfo = GameDataManager.getInstance().userInfoData;
        if (userinfo.isRealCert)
        {
            GameManager.getInstance().openWeakTipsUI("您已实名认证");
            return
        }
        UIManager.getInstance().openUI(RealCertUI, 1)
    }

    private button_net()
    {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(GameNet, 1);
    }

    private button_notice()
    {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(NoticeUI, 1)
    }
    private button_zhaoMu()
    {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(ActivityUI, 1)
    }
    private button_return_room()
    {
        AudioManager.getInstance().playSFX("button_click");
        GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_ReconnectJoinRoom.MsgID.ID, {});
    }

    private button_tgy()
    {
        AudioManager.getInstance().playSFX("button_click");
        var id = GameDataManager.getInstance().userInfoData.userId
        var para = {guid: id}
        UIManager.getInstance().openUI(ThirdSelectUI, 98, () => {
            UIManager.getInstance().getUI(ThirdSelectUI).getComponent("ThirdSelectUI").initPara(para);
        })
        // HttpManager.getInstance().post(ConstValue.QR_SHARE_URL, "", null, JSON.stringify(para),
        // (error, ret) => {
        //     if (ret) {
        //         var retMsg = JSON.parse(ret)
        //         var url = retMsg.data.url
        //         cc.sys.openURL(url)
        //     }
        // });
    }

    private onJoinRoomResponse(msg)
    {
        if (GameDataManager.getInstance().isJoinRoom)
            GameDataManager.getInstance().isJoinRoom = false
        if (msg.result != 0) {
            GameManager.getInstance().openWeakTipsUI(StringData.getString(msg.result));
            MessageManager.getInstance().disposeMsg();
            return;
        }
        this.onEnterRoomResponse(msg)
    }

    //创建房间回调
    private onEnterRoomResponse(msg: any) {
        try{
            if (GameDataManager.getInstance().isCreatingRoom)
                GameDataManager.getInstance().isCreatingRoom = false
            if (msg.result != 0) {
                GameManager.getInstance().openWeakTipsUI(StringData.getString(msg.result));
                MessageManager.getInstance().disposeMsg();
                return;
            }
            GameDataManager.getInstance().curGameType = msg.info.gameType
            var curGameData = GameDataManager.getInstance().getDataByCurGameType()
            curGameData.updateTableInfo(msg.info, msg.roundInfo.roundId)
            for(var info of msg.seatList)
                curGameData.addPlayer(info, false)
            GameUIController.getInstance().startGameByType(msg.info.gameType, false, true)
            UIManager.getInstance().closeUI(RuleUI);
            UIManager.getInstance().closeUI(HallUI);
            UIManager.getInstance().closeUI(CreateClubUI);
        }
        catch(e) {
            MessageManager.getInstance().disposeMsg();
        }
    }

    private onEnterClubResponse(msg: any) {
        // if (msg.clubs.length == 0 && this.openUIType == 1)
        // {
        //     GameManager.getInstance().openWeakTipsUI("制作中，敬请期待");
        //     this.loadingClub = false
        //     MessageManager.getInstance().disposeMsg();
        //     return
        // }
        if (msg.clubs.length == 0)
        {
            this.loadingClub = false
            UIManager.getInstance().openUI(ClubSelectUI, 1);
            MessageManager.getInstance().disposeMsg();
            return
        }
        //处理错误码
        GameDataManager.getInstance().clubData = msg.clubs;
        // this.loadingClub = false;
        // UIManager.getInstance().openUI(ClubSelectUI, 1, () => {
        //     UIManager.getInstance().getUI(ClubSelectUI).getComponent("ClubSelectUI").setOpenType(this.openUIType);
        // });
        // MessageManager.getInstance().disposeMsg();
        // 发完消息转场
        UIManager.getInstance().openUI(ClubUI, 0, () => {
            UIManager.getInstance().getUI(ClubUI).getComponent("ClubUI").setOpenType(this.openUIType);
        });
    }

    /**已有对局回调 */
    resHaveRoom(event) {
        MessageManager.getInstance().messageSend(Proto.C2S_DDZ_Glod_Sync_Room_Info_Res.MsgID.ID, { roomType: 4 });
    }

}
