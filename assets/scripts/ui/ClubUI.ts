import { ListenerType } from './../data/ListenerType';
import { Wait2UI } from './Wait2UI';
import { ClubInvitePlyaerInfoUI } from './objects/club/ClubInvitePlyaerInfoUI';
import { ThirdSelectUI } from './ThirdSelectUI';
import { SdkManager } from './../../framework/Utils/SdkManager';
import { ClubKeyboardUI } from './objects/club/ClubKeyboardUI';
import { SelectTipsUI } from './SelectTipsUI';
import { UnionUI_Message } from './objects/union/UnionUI_Message';
import { ClubInfoUI } from './objects/club/ClubInfoUI';
import { CreateClubUI } from './objects/club/CreateClubUI';
import { Club_Quick_Game_UI } from './Club_Quick_Game_UI';
import { BaseUI, UIClass } from "../../framework/UI/BaseUI";
import { GameDataManager } from "../../framework/Manager/GameDataManager";
import { MessageManager } from "../../framework/Manager/MessageManager";
import { ClubData, CLUB_SHOW, CLUB_POWER } from "../data/club/ClubData";
import { UIManager } from "../../framework/Manager/UIManager";
import { HallUI } from "./HallUI";
import { LogWrap } from "../../framework/Utils/LogWrap";
import { ListenerManager } from "../../framework/Manager/ListenerManager";
import * as Proto from "../../proto/proto-min";
import { ClubMainUI } from "./objects/club/ClubMainUI";
import { ClubTableInfoUI } from "./objects/club/ClubTableInfoUI";
import { GameManager } from "../GameManager";
import { StringData } from "../data/StringData";
import { AudioManager } from "../../framework/Manager/AudioManager";
import { ShowRuleUI } from "./objects/rule/ShowRuleUI";
import { GameUIController } from "./GameUIController";
import { UnionUI_Import_Result } from "./objects/union/UnionUI_Import_Result";
import GameNet from './GameNet';
import { ConstValue } from '../data/GameConstValue';



const { ccclass, property } = cc._decorator;

@ccclass
export class ClubUI extends BaseUI {

    protected static className = "ClubUI";

    @property(cc.Prefab)
    clubListItem: cc.Prefab = null;
    @property(cc.Node)
    nodeContent: cc.Node = null;
    @property(cc.Node)
    nodeView: cc.Node = null;
    @property(cc.Label)
    labelRoomCard: cc.Label = null;
    @property(cc.Label)
    labelPlayerScore: cc.Label = null;
    @property(cc.Label)
    labelCommissionScore: cc.Label = null;
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


    private clubData: ClubData = null;
    private clubShowPrefab: cc.Node = null;
    private isEnterRoom: boolean = false; //是否已经准备进入房间，用于屏蔽实时更新数据
    private isInit: boolean = false;//是否在初始化
    private curShowIdx: number = -1;  //记录当前显示的亲友群id
    private clubItemList = []
    private scrollHeight = 340
    private ssActionOfClubStatus = 0
    private m_curUpdateTime = 1; // 两秒更新一次电量和时间
    private showTimer = null;

    onLoad() {
        this.isInit = true;
        this.isEnterRoom = false;
        //服务器消息回调
        ListenerManager.getInstance().add(Proto.S2C_CREATE_CLUB_RES.MsgID.ID, this, this.clubCreateResponse);
        ListenerManager.getInstance().add(Proto.S2C_NOTIFY_TABLE_TEMPLATE.MsgID.ID, this, this.clubFastRoomSync);

        ListenerManager.getInstance().add(Proto.S2C_SYNC_TABLES_RES.MsgID.ID, this, this.clubRoomInfoResponse);
        ListenerManager.getInstance().add(Proto.SC_CLUB_SYNC_TABLES.MsgID.ID, this, this.onClubRoomSyncInfoRec); // 批量更新的房间刷新消息
        ListenerManager.getInstance().add(Proto.SC_CreateRoom.MsgID.ID, this, this.onEnterRoomResponse);
        ListenerManager.getInstance().add(Proto.SC_JoinRoom.MsgID.ID, this, this.onJoinRoomResponse);
        ListenerManager.getInstance().add(Proto.SC_FastJoinRoom.MsgID.ID, this, this.onJoinRoomResponse);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_INFO_RES.MsgID.ID, this, this.clubInfoResponse);
        ListenerManager.getInstance().add(Proto.S2C_CLUBLIST_RES.MsgID.ID, this, this.onEnterClubResponse);
        ListenerManager.getInstance().add(Proto.S2C_INVITE_JOIN_CLUB.MsgID.ID, this, this.onInviteResponse);
        ListenerManager.getInstance().add(Proto.S2C_EXCHANGE_CLUB_COMMISSON_RES.MsgID.ID, this, this.onCommissionExchanged);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_OP_RES.MsgID.ID, this, this.onClubOpRec);
        ListenerManager.getInstance().add(Proto.S2C_CONFIG_FAST_GAME_LIST.MsgID.ID, this, this.onFastGameListRec);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_FORCE_DISMISS_TABLE.MsgID.ID, this, this.onForceDismissTable);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_EDIT_INFO.MsgID.ID, this, this.onEditRec);
        ListenerManager.getInstance().add(Proto.SC_DEL_NOTICE.MsgID.ID, this, this.onDelRes);
        ListenerManager.getInstance().add(Proto.SC_ForceKickoutPlayer.MsgID.ID, this, this.onForceKickPlayer);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_GET_CONFIG.MsgID.ID, this, this.onClubConfigRec);
        ListenerManager.getInstance().add(Proto.SC_SearchPlayer.MsgID.ID, this, this.onPlayerInfoFind);  
        ListenerManager.getInstance().add(Proto.SC_CLUB_IMPORT_PLAYER_FROM_TEAM.MsgID.ID, this, this.onImportRec);
        ListenerManager.getInstance().add(Proto.SC_TEAM_STATUS_INFO.MsgID.ID, this, this.onTeamStatusRec);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_TABLE_INFO_RES.MsgID.ID, this, this.onUpdateTableListData);
        
        //客户端消息回调
        ListenerManager.getInstance().add(ListenerType.clubSelectShowChanged, this, this.clubSelectShowChanged);
        ListenerManager.getInstance().add(ListenerType.clubEnterChanged, this, this.clubEnterChanged);
        // ListenerManager.getInstance().add(ListenerType.RoomCardsChanged, this, this.onRoomCardsChanged);
        ListenerManager.getInstance().add(ListenerType.PlayerScoreChanged, this, this.onPlayerScoreChanged);
        ListenerManager.getInstance().add(ListenerType.CommissionScoreChanged, this, this.onCommissionScoreChanged);
        ListenerManager.getInstance().add(ListenerType.noticeChanged, this, this.globalNoticeCheck);

        //1满人 或  2等待
        let tableType = cc.sys.localStorage.getItem("tableType")
        if (tableType == null || tableType == undefined) {
            cc.sys.localStorage.setItem("tableType", 1)
        } else if (tableType == "1") {
            cc.find("tableToggle/manzToggle", this.node).getComponent(cc.Toggle).isChecked = true
        } else if (tableType == "2") {
            cc.find("tableToggle/wmanzToggle", this.node).getComponent(cc.Toggle).isChecked = true
        }
    }

    protected update(dt: number): void {
        this.m_curUpdateTime -= dt;
        if (this.m_curUpdateTime < 0) {
            this.m_curUpdateTime = 3;
            this.labelSigle.string = GameDataManager.getInstance().systemData.ping + "ms";
            //LogWrap.log("GameDataManager.getInstance().getNetLevel():"+GameDataManager.getInstance().getNetLevel())
            this.pingLv.spriteFrame = this.pingLvArg[GameDataManager.getInstance().getNetLevel()]
        }
    }

    start() {
        this.isInit = true;
        this.updateView();
        this.globalNoticeCheck({type:1})
        this.onClubBgChanged()
    }

    onShow(): void {
        this.isInit = true;
        var uiType = parseInt(cc.sys.localStorage.getItem("curClubType")) ;
        this.curShowIdx = -1
        if (this.clubShowPrefab != null) {
            this.clubShowPrefab.destroy();
            this.clubShowPrefab = null
        }
        MessageManager.getInstance().messageSend(Proto.C2S_CLUBLIST_REQ.MsgID.ID, {type:uiType});
    }

    onDestroy()
    {
        clearTimeout(this.showTimer)
        super.onDestroy()
        this.clubData = null
    }

    private onClubBgChanged()
    {
        var curClubBgIdx = cc.sys.localStorage.getItem("clubBgIndex")
        if (!curClubBgIdx)
            return
        this.node.getChildByName("sp_club_bg").getComponent(cc.Sprite).spriteFrame = this.clubBgSpf[parseInt(curClubBgIdx) - 1] 
    }

    //---------------------------------------刷新函数--------------------------------//
    private updateView() {

        this.clubData = GameDataManager.getInstance().clubData;
        this.node.getChildByName("union").active = this.clubData.clubType >= 1
        //刷新亲友群列表
        this.updateClubList();
        this.onPlayerScoreChanged()
        this.onCommissionScoreChanged()
        // this.onRoomCardsChanged()
        this.isInit = false;
        MessageManager.getInstance().disposeMsg();
    }

    private updateClubList() {

         //清空原始数据
         this.nodeContent.removeAllChildren();
         this.clubItemList = [];

        var defautId = cc.sys.localStorage.getItem("curClubId")
        var bFind = false
        if (this.clubData.allMyClubList.length == 0){
            this.button_club_opt(null, "join")
            return
        }
        //改变大小
        this.nodeContent.height = this.clubData.allMyClubList.length * this.clubListItem.data.height;
        if (this.nodeContent.height < this.scrollHeight)
            this.nodeContent.height = this.scrollHeight;

        for (var index = 0; index < this.clubData.allMyClubList.length; ++index) {
            let item = cc.instantiate(this.clubListItem);
            this.nodeContent.addChild(item);
            var info = {
                id: this.clubData.allMyClubList[index].cid,
                name: this.clubData.allMyClubList[index].name,
                parentName: this.clubData.allMyClubList[index].parent
            }
            item.setPosition(0, -item.height * (0.5 + index));
            item.getComponent('Club_List_Item').initView(index, info, this.clubData.clubType)
            this.clubItemList.push(item);
            if (defautId == this.clubData.allMyClubList[index].cid){
                bFind = true
                item.getComponent('Club_List_Item').btn_select()
            }
        }
        if (!bFind)
            this.clubItemList[0].getComponent('Club_List_Item').btn_select()

    }
    onUpdateTableListData(msg){
        MessageManager.getInstance().disposeMsg();
        this.clubData.updateClubRoomList(msg.tableList ? msg.tableList : this.clubData.clubRoomList);
        if (this.clubShowPrefab != null && this.clubData.roleType == CLUB_POWER.CRT_PLAYER && this.clubData.clubAllPlayerNum >= ConstValue.MAX_CLUB_PLAYER_LIMIT) {
            if (UIManager.getInstance().getUI(Wait2UI))
            {
                UIManager.getInstance().getUI(Wait2UI).getComponent("Wait2UI").stopWait()
            }
            this.clubShowPrefab.getComponent("ClubMainUI").onChangeTableListData()
        }
    }
    onClubOpRec(msg)
    {
        if (msg.op == 14)
        {
            GameManager.getInstance().openWeakTipsUI("俱乐部开始营业");
            this.clubData.curClubStatus = 0
            this.node.getChildByName("node_btn").getChildByName("btn_dayang").active = this.clubData.curClubStatus != 1
            this.node.getChildByName("node_btn").getChildByName("btn_kaiye").active = this.clubData.curClubStatus == 1
        }
        else if (msg.op == 13)
        {
            GameManager.getInstance().openWeakTipsUI("俱乐部打烊中....");
            this.clubData.curClubStatus = 1
            this.node.getChildByName("node_btn").getChildByName("btn_dayang").active = this.clubData.curClubStatus != 1
            this.node.getChildByName("node_btn").getChildByName("btn_kaiye").active = this.clubData.curClubStatus == 1
        }
        else if (msg.op == 16)        
        {
            GameManager.getInstance().openWeakTipsUI("团队打烊中....");
            this.clubData.teamStatusInfo.status = 1
            this.clubData.teamStatusInfo.canUnblock = true
            this.node.getChildByName("node_btn").getChildByName("btn_dayang").active = this.clubData.teamStatusInfo.status != 1
            this.node.getChildByName("node_btn").getChildByName("btn_kaiye").active = this.clubData.teamStatusInfo.status == 1
        }
        else if (msg.op == 17)        
        {
            GameManager.getInstance().openWeakTipsUI("团队开始营业");
            this.clubData.teamStatusInfo.status = 0
            this.clubData.teamStatusInfo.canUnblock = false
            this.node.getChildByName("node_btn").getChildByName("btn_dayang").active = this.clubData.teamStatusInfo.status != 1
            this.node.getChildByName("node_btn").getChildByName("btn_kaiye").active = this.clubData.teamStatusInfo.status == 1
            MessageManager.getInstance().messageSend(Proto.CS_TEAM_STATUS_INFO.MsgID.ID, {clubId: this.clubData.curSelectClubId});
            
        }
        else if (msg.op == 10)
        {
            GameManager.getInstance().openWeakTipsUI("加入成功");
        }
        MessageManager.getInstance().disposeMsg();
            
    }

    onFastGameListRec(msg)
    {
        this.clubData.fastGameList = [msg.templateIds[1], msg.templateIds[2],msg.templateIds[3],msg.templateIds[4]]
        MessageManager.getInstance().disposeMsg();
    }

    onForceDismissTable()
    {
        GameManager.getInstance().openWeakTipsUI("解散成功");
        MessageManager.getInstance().disposeMsg();
    }

    private onDelRes(msg)
    {
        GameManager.getInstance().openWeakTipsUI("删除公告成功");
        this.clubData.curSelectNoticeId = ""
        let systeminfo = GameDataManager.getInstance().systemData;
        MessageManager.getInstance().disposeMsg();
        if (systeminfo.globalNoticeList.length > 0)
            return
        this.node.getChildByName("message_sprite").active = false
        this.node.getChildByName("mask").active = false
    }

    private onForceKickPlayer(msg)
    {
        GameManager.getInstance().openWeakTipsUI("踢出玩家成功");
        MessageManager.getInstance().disposeMsg();
    }

    private onEditRec(msg)
    {
        GameManager.getInstance().openWeakTipsUI("修改成功");
        this.updateClubName(msg.name)
        MessageManager.getInstance().disposeMsg();
    }

    private onClubConfigRec(msg)
    {
        if (msg.conf != "" && msg.conf != "{}")
            this.clubData.clubSettings = msg.conf
        MessageManager.getInstance().disposeMsg();
    }

    onPlayerInfoFind(msg)
    {
        UIManager.getInstance().openUI(ClubInvitePlyaerInfoUI, 21, () => {
            UIManager.getInstance().getUI(ClubInvitePlyaerInfoUI).getComponent("ClubInvitePlyaerInfoUI").onPlayerInfoFind(msg);
        })
        MessageManager.getInstance().disposeMsg();
    }

    onImportRec(msg)
    {
        if (UIManager.getInstance().getUI(Wait2UI))
        {
            UIManager.getInstance().getUI(Wait2UI).getComponent("Wait2UI").stopWait()
        }
        if (msg.result != 0)
        {
            if (msg.result == 106) // 导入所需的团队积分不足
                GameManager.getInstance().openWeakTipsUI("导入失败，需要的积分不足");
            else if (msg.result == 51)
                GameManager.getInstance().openWeakTipsUI("导入失败，有玩家在游戏中");
            else if (msg.result == 251)
                GameManager.getInstance().openWeakTipsUI("导入失败");
            else
                GameManager.getInstance().openWeakTipsUI(StringData.getString(msg.result));
            MessageManager.getInstance().disposeMsg();
            return
        }
        try
        {
            var info = JSON.parse(msg.errorInfo)
            if (info.failed_info && info.failed_info.length > 0)
            {
                UIManager.getInstance().openUI(UnionUI_Import_Result, 10, ()=>{
                    UIManager.getInstance().getUI(UnionUI_Import_Result).getComponent("UnionUI_Import_Result").updateView(msg)
                })
            }
        }
        catch (e)
        {
            console.log(e)
        }
        GameManager.getInstance().openWeakTipsUI("操作完成！");
        MessageManager.getInstance().disposeMsg();
    }

    onTeamStatusRec(msg)
    {
        if (msg.teamStatusInfo && msg.teamStatusInfo.clubId == this.clubData.curSelectClubId)
        {
            this.clubData.teamStatusInfo = msg.teamStatusInfo
        }    
        MessageManager.getInstance().disposeMsg();
        
    }

    public globalNoticeCheck(msg)
    {
        if (msg.type != 1)
            return
        let systeminfo = GameDataManager.getInstance().systemData;
        if (systeminfo.globalNoticeList.length > 0)
        {
            this.node.getChildByName("message_sprite").active = true
            this.node.getChildByName("mask").active = true
            this.nodeRollNotice.getComponent("BaseRollNotice").startGlobalNotice(systeminfo.globalNoticeList);
        } 

    }

    updateNotice(content, id, clubId)
    {
        if (!this.clubData)
            return
        if (this.clubData.curSelectClubId != clubId)
            return
        this.nodeRollNotice.getComponent("BaseRollNotice").setDefautNotice(content)
        let systeminfo = GameDataManager.getInstance().systemData;
        if (systeminfo.globalNoticeList.length > 0)
            return
        this.clubData.curSelectNoticeId = id
        this.node.getChildByName("message_sprite").active = true
        this.node.getChildByName("mask").active = true
        this.nodeRollNotice.getComponent("BaseRollNotice").updateInfo(content);
        this.nodeRollNotice.getComponent("BaseRollNotice").initAction();
    }

    updateClubName(sName)
    {
        this.node.getChildByName("btn_rename").getChildByName("bg").getChildByName("label_name").getComponent(cc.Label).string = sName
        this.clubItemList[this.curShowIdx].getComponent("Club_List_Item").setNewName(sName)
    }

    setOpenType(type)
    {
        if (type == 1) // 赛事按钮
        {
            // this.scrollHeight = 300
            // this.node.getChildByName("clubScroll").getChildByName("btn_create").active = false
            this.node.getChildByName("clubScroll").getChildByName("btn_join_club").active = false
            // this.node.getChildByName("club_info").getChildByName("list").getChildByName("contentNode").getChildByName("sp_bg2").height = 300
        }
        else{}
            // this.scrollHeight = 300
        cc.sys.localStorage.setItem("curClubType", type);
    }

    private updateShow() {
        cc.resources.load(ClubMainUI.getUrl(), cc.Prefab, function (error, prefab) {
                if (error) {
                    LogWrap.err(error);
                    return;
                }
                if (this.clubShowPrefab != null) {
                    this.clubShowPrefab.destroy();
                }
                this.clubShowPrefab = cc.instantiate(prefab);
                this.clubShowPrefab.parent = this.nodeView;
            }.bind(this));
    }

    private updateTopShow() {
        var clubClose = (this.clubData.roleType == CLUB_POWER.CRT_BOSS) || (this.clubData.roleType == CLUB_POWER.CRT_PRATNER) // 打烊权限
        this.node.getChildByName("node_btn").getChildByName("btn_yq").active = this.clubData.roleType >= CLUB_POWER.CRT_PRATNER
        // this.node.getChildByName("node_btn").getChildByName("btn_share").active = this.clubData.roleType >= CLUB_POWER.CRT_PRATNER //分享功能暂时关闭
        this.node.getChildByName("btn_rename").getChildByName("bg").getComponent(cc.Button).interactable = this.clubData.roleType == CLUB_POWER.CRT_BOSS
        this.node.getChildByName("union").active = this.clubData.clubType != 0
        if (this.clubData.clubType == 0) // 亲友群中，权限小于管理员没有消息按钮
        {
            if (this.clubData.roleType >= CLUB_POWER.CRT_ADMIN)
                this.node.getChildByName("node_btn").getChildByName("btn_top_message").active = true
        }
        this.node.getChildByName("node_btn").getChildByName("btn_setting").active = this.clubData.roleType == CLUB_POWER.CRT_BOSS
        if (this.clubData.roleType != CLUB_POWER.CRT_ADMIN)
            this.node.getChildByName("union").getChildByName("btn_gx").active = this.clubData.roleType >= CLUB_POWER.CRT_PRATNER
        if (clubClose)
        {
            if (this.clubData.roleType == CLUB_POWER.CRT_BOSS)
            {
                this.node.getChildByName("node_btn").getChildByName("btn_dayang").active = this.clubData.curClubStatus != 1
                this.node.getChildByName("node_btn").getChildByName("btn_kaiye").active = this.clubData.curClubStatus == 1
            }
            else if (this.clubData.teamStatusInfo)
            {
                // 只有当自己有权限时
                if (this.clubData.teamStatusInfo.canUnblock)
                {
                    this.node.getChildByName("node_btn").getChildByName("btn_dayang").active = this.clubData.teamStatusInfo.status != 1 
                    this.node.getChildByName("node_btn").getChildByName("btn_kaiye").active = this.clubData.teamStatusInfo.status == 1
                }
                else
                {
                    this.node.getChildByName("node_btn").getChildByName("btn_dayang").active = true
                    this.node.getChildByName("node_btn").getChildByName("btn_kaiye").active = false
                }
            }   
            else
            {
                this.node.getChildByName("node_btn").getChildByName("btn_dayang").active = true
                this.node.getChildByName("node_btn").getChildByName("btn_kaiye").active = false
            }
        }
        else
        {
            this.node.getChildByName("node_btn").getChildByName("btn_dayang").active = clubClose
            this.node.getChildByName("node_btn").getChildByName("btn_kaiye").active = clubClose
        }
    
    }

    //---------------------------------------服务器消息回调函数--------------------------------//
    private clubCreateResponse(msg: any) {
        GameDataManager.getInstance().isCreatingClub = false
        var uiType = parseInt(cc.sys.localStorage.getItem("curClubType")) ;
        MessageManager.getInstance().messageSend(Proto.C2S_CLUBLIST_REQ.MsgID.ID, {type: uiType});
        //创建成功弹出提示，说明板子
        GameManager.getInstance().openStrongTipsUI(StringData.getString(10050), () => { });
        UIManager.getInstance().closeUI(CreateClubUI);
        MessageManager.getInstance().disposeMsg();
    }

    private clubFastRoomSync(msg: any) {
        if (this.clubData == null)
        {
            MessageManager.getInstance().disposeMsg();
            return
        }
        if(msg.rootClub != this.clubData.curSelectClubId)
        {
            MessageManager.getInstance().disposeMsg();
            return
        }
        this.clubData.fastRoomInfoUpdate(msg)
        MessageManager.getInstance().disposeMsg();
    }

    private clubRoomInfoResponse(msg: any) {
        if (this.clubData == null)
        {
            MessageManager.getInstance().disposeMsg();
            return
        }
        if(msg.clubId != this.clubData.curSelectClubId)
        {
            MessageManager.getInstance().disposeMsg();
            return
        }
        if (this.isEnterRoom) {
            MessageManager.getInstance().disposeMsg();
            return;
        }
        this.clubData.roomInfoUpdate(msg)
        MessageManager.getInstance().disposeMsg();
    }

    private onClubRoomSyncInfoRec(msg)
    {
        if (this.clubData == null)
        {
            MessageManager.getInstance().disposeMsg();
            return
        }
        if(msg.clubId != this.clubData.curSelectClubId)
        {
            MessageManager.getInstance().disposeMsg();
            return
        }
        if (this.isEnterRoom) {
            MessageManager.getInstance().disposeMsg();
            return;
        }
        this.clubData.newRoomInfoUpdate(msg.syncs)
        MessageManager.getInstance().disposeMsg();
    }

    onPlayerScoreChanged()
    {
        if (this.clubData == null)
            return;
        var playerScore = 0
        if (this.clubData.playerScore)
            playerScore = this.clubData.playerScore
        this.labelPlayerScore.string = playerScore.toString()
    }

    onCommissionScoreChanged()
    {
        if (this.clubData == null)
            return;
        var commission = 0
        if (this.clubData.commission)
            commission = this.clubData.commission
        this.labelCommissionScore.string = commission.toString()
    }

    // onRoomCardsChanged()
    // {
    //     this.labelRoomCard.string = Utils.FormatNum(GameDataManager.getInstance().userInfoData.roomCard,0)
    // }

    onCommissionExchanged()
    {
        GameManager.getInstance().openWeakTipsUI("兑换成功");
        MessageManager.getInstance().disposeMsg();
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

    //创建或者加入房间回调
    private onEnterRoomResponse(msg: any) {
        try{
            if (GameDataManager.getInstance().isCreatingRoom)
                    GameDataManager.getInstance().isCreatingRoom = false
            if (msg.result != 0) {
                GameManager.getInstance().openWeakTipsUI(StringData.getString(msg.result));
                MessageManager.getInstance().disposeMsg();
                return;
            }
            this.isEnterRoom = true;
            GameDataManager.getInstance().curGameType = msg.info.gameType
            var curGameData = GameDataManager.getInstance().getDataByCurGameType()
            curGameData.updateTableInfo(msg.info, msg.roundInfo.roundId)
            for(var info of msg.seatList)
                curGameData.addPlayer(info, false)
            GameUIController.getInstance().startGameByType(msg.info.gameType, false, true)
            UIManager.getInstance().closeUI(Club_Quick_Game_UI);
            UIManager.getInstance().closeUI(ClubUI);
            UIManager.getInstance().closeUI(ClubTableInfoUI);
            UIManager.getInstance().closeUI(ShowRuleUI);
        }
        catch (e)
        {
            MessageManager.getInstance().disposeMsg();
        }
    }


    clubInfoResponse(msg: any) {
        //改变数据
        this.clubData.curSelectNoticeId = ""
        this.clubData.roleType = msg.myTeamInfo.role;
        this.clubData.playerScore = msg.myTeamInfo.money.count;
        this.clubData.commission = msg.selfInfo.commission;
        this.clubData.clubFastList = msg.tableTemplates ? msg.tableTemplates : this.clubData.clubFastList;
        this.clubData.clubPower = msg.gamelist.sort(function (a, b) { return a - b});
        this.clubData.clubRoomList = msg.tableList ? msg.tableList : this.clubData.clubRoomList;
        this.clubData.clubAllPlayerNum = msg.status.playerCount ? msg.status.playerCount : this.clubData.clubAllPlayerNum;
        this.clubData.clubOnlinePlayerNum = msg.status.onlinePlayerCount ? msg.status.onlinePlayerCount : this.clubData.clubOnlinePlayerNum;
        this.clubData.curClubStatus =  msg.status.status;
        this.clubData.teamStatusInfo = msg.teamStatus
        this.clubData.parentStatus = msg.status.statusInClub
        this.clubData.rootId = msg.root
        this.clubData.openTemplateList = msg.teamTemplateIds
        this.node.getChildByName("club_close").active = false
        cc.find("tableToggle", this.node).active = (this.clubData.clubAllPlayerNum >= ConstValue.MAX_CLUB_PLAYER_LIMIT)
        if (msg.fastTemplates[1] && this.clubData.clubFastList.length != 0)
            this.clubData.fastGameList = [msg.fastTemplates[1], msg.fastTemplates[2],msg.fastTemplates[3],msg.fastTemplates[4]]
        var closeDesc = ""
        var canUnblock = false
        if (this.clubData.roleType == CLUB_POWER.CRT_BOSS)
            canUnblock = true
        if (this.clubData.curClubStatus == 1)
        {
            if(this.clubData.clubType == 0)
                closeDesc = "亲友群打烊中...."
            else
                closeDesc = "联盟打烊中...."
        }
        else if (this.clubData.curClubStatus == 2)
        {
            if(this.clubData.clubType == 0)
                closeDesc = "您的亲友群被禁止游戏，请联系客服解封"
            else
                closeDesc = "您的联盟被禁止游戏，请联系客服解封"
        }
        else // 没有打样
        {
            if(this.clubData.clubType != 0 && this.clubData.teamStatusInfo)//联盟
            {
                if (this.clubData.teamStatusInfo.status == 1)
                {
                    if(this.clubData.teamStatusInfo.canUnblock)
                        closeDesc = "团队打烊中...."
                    else
                        closeDesc = "上级团队打烊中...."
                }
                else if (this.clubData.teamStatusInfo.status == 2)
                {
                    closeDesc = "团队禁止游戏...."
                }
            }
        }
        this.node.getChildByName("club_close").getChildByName("label_desc").getComponent(cc.Label).string = closeDesc
        this.node.getChildByName("club_close").active = (closeDesc.length > 0 && this.clubData.roleType != CLUB_POWER.CRT_BOSS)
        if (closeDesc.length == 0 || this.clubData.roleType == CLUB_POWER.CRT_BOSS || (this.clubData.roleType == CLUB_POWER.CRT_PRATNER && this.clubData.teamStatusInfo.canUnblock))
        {
            this.node.getChildByName("club_close").active = false
            this.clubData.curSelectShow = CLUB_SHOW.MAIN;
        }
        if (UIManager.getInstance().getUI(Wait2UI))
        {
            UIManager.getInstance().getUI(Wait2UI).getComponent("Wait2UI").stopWait()
        }
        MessageManager.getInstance().messagePost(ListenerType.clubEnterChanged);
        let systeminfo = GameDataManager.getInstance().systemData;
        if (systeminfo.globalNoticeList.length == 0)
        {
            this.node.getChildByName("message_sprite").active = false
            this.node.getChildByName("mask").active = false
        }
        this.node.getChildByName("touch_node").active = false
        MessageManager.getInstance().messageSend(Proto.CS_NOTICE_REQ.MsgID.ID, {clubId:this.clubData.curSelectClubId});
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_GET_CONFIG.MsgID.ID, { clubId: this.clubData.curSelectClubId});
        MessageManager.getInstance().disposeMsg();
    }




    private onEnterClubResponse(msg: any) {
        GameDataManager.getInstance().clubData = msg.clubs;
        this.updateView();
    }

    private onInviteResponse(msg)
    {
        GameManager.getInstance().openWeakTipsUI("邀请成功！");
        MessageManager.getInstance().disposeMsg();
    }

    private onAbandonClubResponse(msg: any) {
        MessageManager.getInstance().disposeMsg();
        for (let i = 0; i < this.clubData.allMyClubList.length; ++i) {
            if (this.clubData.allMyClubList[i].cid == msg.clubId) {
                this.clubData.allMyClubList.splice(i, 1);
                break;
            }
        }

        this.updateTopShow();
        var uiType = parseInt(cc.sys.localStorage.getItem("curClubType")) ;
        MessageManager.getInstance().messageSend(Proto.C2S_CLUBLIST_REQ.MsgID.ID, {type:uiType});
    }
 
    //---------------------------------------客户端消息回调函数--------------------------------//
    private clubSelectShowChanged() {
        this.updateShow();
    }

    private clubEnterChanged() {
        this.updateTopShow();
    }

    public selectClub(idx)
    {
        if (this.ssActionOfClubStatus == 1)
            this.doClubSSAction(1)
        let curId = this.clubItemList[idx].getComponent("Club_List_Item").getInfo().id;
        if (this.curShowIdx != idx) {
            UIManager.getInstance().openUI(Wait2UI, 40, ()=> {
                UIManager.getInstance().getUI(Wait2UI).getComponent("Wait2UI").onWait("正在加载中，请稍后...")
            })
            if (this.curShowIdx != -1 && this.curShowIdx < this.clubItemList.length)
                this.clubItemList[this.curShowIdx].getComponent("Club_List_Item").setSelect(false)
            this.curShowIdx = idx;
            this.clubData.curSelectClubId = curId;
            cc.sys.localStorage.setItem("curClubId", this.clubData.curSelectClubId);
            this.clubItemList[idx].getComponent("Club_List_Item").setSelect(true)
            MessageManager.getInstance().messageSend(Proto.C2S_CLUB_INFO_REQ.MsgID.ID, { clubId: this.clubData.curSelectClubId });
            // this.node.getChildByName("club_info").getChildByName("label_club").getComponent(cc.Label).string ="ID:" + curId;
            for (let i = 0; i < this.clubData.allMyClubList.length; ++i) {
                if (this.clubData.allMyClubList[i].cid == curId)
                    this.node.getChildByName("btn_rename").getChildByName("bg").getChildByName("label_name").getComponent(cc.Label).string = this.clubData.allMyClubList[i].name
                    this.node.getChildByName("btn_rename").getChildByName("bg_id").getChildByName("label_name").getComponent(cc.Label).string = "ID:"+curId
            }
        }
    }

    private doClubSSAction(type)
    {
        var size = this.node.getContentSize()
        var clubNode = this.node.getChildByName("clubScroll")
        clubNode.stopAllActions()
        //let btn_more = this.node.getChildByName("btn_more")
        //let btn_more2 = clubNode.getChildByName("btn_more")
        //btn_more.active = false;
        //btn_more2.active = true
        if (type == 0) // 伸开
        {
            clubNode.position = cc.v3(-size.width/2-130,clubNode.position.y)
            var action = cc.moveTo(0.2, cc.v2(-size.width/2+130, clubNode.position.y));
            var ssActionOfClubStatus = 1
        }
        else // 缩回
        {
            clubNode.position = cc.v3(-size.width/2+130,clubNode.position.y)
            var action = cc.moveTo(0.2, cc.v2(-size.width/2-130,clubNode.position.y));
            var ssActionOfClubStatus = 0
        }
        var action1 = cc.callFunc(function () {
            this.ssActionOfClubStatus = ssActionOfClubStatus
            this.node.getChildByName("touch_node").active = ssActionOfClubStatus == 1
           
        }.bind(this))
        let seq = cc.sequence(action, action1);
        clubNode.runAction(seq)

    }

    //---------------------------------------按钮响应-----------------------------------------//
    //返回
    private button_back() {
    AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(HallUI, 0, () => {
            UIManager.getInstance().closeUI(ClubUI);
        });
    }

   //亲友群加入、创建
   private button_club_opt(event, CustomEventData) {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(CreateClubUI, 1, () => {
            UIManager.getInstance().getUI(CreateClubUI).getComponent("CreateClubUI").initView(CustomEventData);
            });
    }

    public button_club_info(){
        AudioManager.getInstance().playSFX("button_click");
        if (this.ssActionOfClubStatus == 0) // 伸出
            this.doClubSSAction(0)
        else // 缩回
            this.doClubSSAction(1)
    }
 

    // 打烊
    private button_close_union()
    {
        AudioManager.getInstance().playSFX("button_click");
        if (this.clubData.parentStatus == 1)
        {
            GameManager.getInstance().openWeakTipsUI("上级联盟打烊中，无法执行该操作");
            return
        }
        if(this.clubData.curClubStatus == 2 || this.clubData.parentStatus == 2)
        {
            GameManager.getInstance().openWeakTipsUI("处于封禁状态无法处理");
            return
        }
        if (this.clubData.roleType == CLUB_POWER.CRT_BOSS)
        {
            var str = "营业中，打烊？"
            if(this.clubData.curClubStatus == 1)
                str = "打烊中，取消打烊？"
            var yesFun = () => {
                if(!this.clubData)
                    return
                var op = 13
                if (this.clubData.curClubStatus == 1)
                    op = 14
                let msg =
                {
                    clubId: this.clubData.curSelectClubId,
                    op: op,
                }
                MessageManager.getInstance().messageSend(Proto.C2S_CLUB_OP_REQ.MsgID.ID, msg);
            }
            GameManager.getInstance().openSelectTipsUI(str, yesFun.bind(this), () => { })
        }
        else
        {
            var dayang = this.node.getChildByName("node_btn").getChildByName("btn_dayang").active
            var str = "营业中，打烊？"
            if(!dayang)
                str = "打烊中，取消打烊？"
            var yesFun = () => {
                if(!this.clubData)
                    return
                if (!this.clubData.teamStatusInfo)
                    return
                var op = 16
                if (!dayang)
                    op = 17
                let msg =
                {
                    clubId: this.clubData.curSelectClubId,
                    targetId:GameDataManager.getInstance().userInfoData.userId,
                    op: op,
                }
                MessageManager.getInstance().messageSend(Proto.C2S_CLUB_OP_REQ.MsgID.ID, msg);
            }
            GameManager.getInstance().openSelectTipsUI(str, yesFun.bind(this), () => { })
        }
    }

    // 贡献值兑换
    private button_convert()
    {   
        if (this.clubData.commission == 0)
        {
            GameManager.getInstance().openWeakTipsUI("贡献值为0，不可兑换");
            return
        }
        var clubId = this.clubData.curSelectClubId
        let surefun = () => {
            MessageManager.getInstance().messageSend(Proto.C2S_EXCHANGE_CLUB_COMMISSON_REQ.MsgID.ID, {clubId: clubId, count: -1});
        };
        let closefun = () => {
            
        };
        GameManager.getInstance().openSelectTipsUI(StringData.getString(10071), surefun, closefun);
    }

    private button_message()
    {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(UnionUI_Message, 1)
    }

    private button_setting()
    {
        AudioManager.getInstance().playSFX("button_click");
        if (this.clubData.roleType != CLUB_POWER.CRT_BOSS)
            return;
        UIManager.getInstance().openUI(ClubInfoUI, 1)
    }

    private button_invite(event)
    {
        AudioManager.getInstance().playSFX("button_click");
        if(this.clubData.curClubStatus == 2 || this.clubData.parentStatus == 2)
        {
            GameManager.getInstance().openWeakTipsUI("处于封禁状态无法处理");
            return
        }
        UIManager.getInstance().openUI(ClubKeyboardUI, 20, () => {
            UIManager.getInstance().getUI(ClubKeyboardUI).getComponent("ClubKeyboardUI").initView(3, null)
        })
        // UIManager.getInstance().openUI(UnionUI_Invite, 20)
    }

    button_share() {
        AudioManager.getInstance().playSFX("button_click")
        let storeUrl = cc.sys.localStorage.getItem("shareClubUrl");
        var clubData = GameDataManager.getInstance().clubData;
        if (!storeUrl || storeUrl == undefined)
        {
            var oMsg = {}
            for (var index = 0; index < clubData.allMyClubList.length; ++index) 
                oMsg[clubData.allMyClubList[index].cid] = 0
        }
        else
        {
            var oMsg = JSON.parse(storeUrl) as {}
        }
        if (oMsg[clubData.curSelectClubId] != 0)
        {
            SdkManager.getInstance().doNativeCopyClipbordText(oMsg[clubData.curSelectClubId], "复制分享链接成功，发送给好友即可");

        }
        else
        {
            var type = "joinclub"
            var id = GameDataManager.getInstance().userInfoData.userId
            var para = {type : type, club: clubData.curSelectClubId, guid: id}
            UIManager.getInstance().openUI(ThirdSelectUI, 98, () => {
                UIManager.getInstance().getUI(ThirdSelectUI).getComponent("ThirdSelectUI").initPara(para, oMsg);
            })
        }
        
    }

    private button_rename()
    {
        AudioManager.getInstance().playSFX("button_click");
        if (this.clubData.roleType != CLUB_POWER.CRT_BOSS)
            return;
        let surefunc = () => {
            var name = UIManager.getInstance().getUI(SelectTipsUI).getComponent("SelectTipsUI").getEditText()
            MessageManager.getInstance().messageSend(Proto.C2S_CLUB_EDIT_INFO.MsgID.ID, { clubId: this.clubData.curSelectClubId, name: name});
        };
        let closefunc = () => {
        };
        var str = "请输入联盟名称："
        if (this.clubData.clubType == 0)
            str = "请输入群名称："
        UIManager.getInstance().openUI(SelectTipsUI, 50, () => {
            UIManager.getInstance().getUI(SelectTipsUI).getComponent("SelectTipsUI").initUI(str, surefunc, closefunc);
            UIManager.getInstance().getUI(SelectTipsUI).getComponent("SelectTipsUI").initEdit("请输入昵称")
        });
    }

    private button_background()
    {
        if (this.ssActionOfClubStatus == 1)
            this.doClubSSAction(1)
    }

    private button_net()
    {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(GameNet, 1);
    }
    private toggle_tableType(target, customEventData) {
        let tableType = cc.sys.localStorage.getItem("tableType")
        if (tableType == customEventData || this.isInit) {
            this.isInit = false
            return
        }
        cc.sys.localStorage.setItem("tableType", customEventData)
        if (this.clubShowPrefab != null && this.clubData.roleType == CLUB_POWER.CRT_PLAYER && this.clubData.clubAllPlayerNum >= ConstValue.MAX_CLUB_PLAYER_LIMIT) {
            if (UIManager.getInstance().getUI(Wait2UI)) {
                UIManager.getInstance().getUI(Wait2UI).getComponent("Wait2UI").stopWait()
            }
            this.clubShowPrefab.getComponent("ClubMainUI").requestTableData()
        }
        cc.find("tableToggle/graySp", this.node).active = true
        this.showTimer = setTimeout(() => {
            cc.find("tableToggle/graySp", this.node).active = false
        }, 2500)
    }
}