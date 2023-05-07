import { Wait2UI } from './ui/Wait2UI';
import { HttpManager } from './../framework/Manager/HttpManager';
import { GameUIController } from './ui/GameUIController';
import { LoginUI } from './ui/LoginUI';
import { SocketManager } from './../framework/Manager/SocketManager';
import * as GameConstValue from "./data/GameConstValue";
import * as  Proto from "../proto/proto-min";
import { MessageManager } from "../framework/Manager/MessageManager";
import { UIManager } from "../framework/Manager/UIManager";
import { WaitUI } from "../scripts/ui/WaitUI";
import { LogWrap } from "../framework/Utils/LogWrap";
import { WeakTipsUI } from "./ui/WeakTipsUI";
import { SelectTipsUI } from "./ui/SelectTipsUI";
import { StrongTipsUI } from "./ui/StrongTipsUI";
import { AudioManager } from "../framework/Manager/AudioManager";
import { GameDataManager } from "../framework/Manager/GameDataManager";
import { SdkManager } from "../framework/Utils/SdkManager";
import { StringData } from "./data/StringData";
import { Utils } from '../framework/Utils/Utils';
import TuoGuanUI from './ui/TuoGuanUI';
import { SelectTipsUI2 } from './ui/SelectTipsUI2';

export class GameManager {
    private static instance: GameManager;

    public static getInstance(): GameManager {
        if (this.instance == null)
            this.instance = new GameManager();

        return this.instance;
    }

    public recentMsgList = []
    public handRecList = []
    public hanRecTime = 5

    public initGame() {
        //游戏初始化 加载游戏配置
        this.loadProto();
        if (cc.sys.isNative) {
            (<any>window).__errorHandler = this.onErrorHandler.bind(this)
        }
    }

    //加载pb
    private loadProto() {
        //--------------------------------------------------------------发送PB--------------------------------------------------------
        //系统    
        MessageManager.getInstance().addProtoAction(Proto.CS_Logout.MsgID.ID, Proto.CS_Logout);
        MessageManager.getInstance().addProtoAction(Proto.CL_Login.MsgID.ID, Proto.CL_Login);
        MessageManager.getInstance().addProtoAction(Proto.CS_RequestPlayerInfo.MsgID.ID, Proto.CS_RequestPlayerInfo);
        MessageManager.getInstance().addProtoAction(Proto.CS_HeartBeat.MsgID.ID, Proto.CS_HeartBeat);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUBLIST_REQ.MsgID.ID, Proto.C2S_CLUBLIST_REQ);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CREATE_CLUB_REQ.MsgID.ID, Proto.C2S_CREATE_CLUB_REQ);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUB_INFO_REQ.MsgID.ID, Proto.C2S_CLUB_INFO_REQ);
        MessageManager.getInstance().addProtoAction(Proto.C2S_JOIN_CLUB_REQ.MsgID.ID, Proto.C2S_JOIN_CLUB_REQ);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUB_PLAYER_LIST_REQ.MsgID.ID, Proto.C2S_CLUB_PLAYER_LIST_REQ);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUB_OP_REQ.MsgID.ID, Proto.C2S_CLUB_OP_REQ);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUB_REQUEST_LIST_REQ.MsgID.ID, Proto.C2S_CLUB_REQUEST_LIST_REQ);
        MessageManager.getInstance().addProtoAction(Proto.C2S_EDIT_CLUB_GAME_TYPE_REQ.MsgID.ID, Proto.C2S_EDIT_CLUB_GAME_TYPE_REQ);
        MessageManager.getInstance().addProtoAction(Proto.CS_CreateRoom.MsgID.ID, Proto.CS_CreateRoom);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUB_TABLE_INFO_REQ.MsgID.ID, Proto.C2S_CLUB_TABLE_INFO_REQ);
        MessageManager.getInstance().addProtoAction(Proto.CS_JoinRoom.MsgID.ID, Proto.CS_JoinRoom);
        MessageManager.getInstance().addProtoAction(Proto.CS_Ready.MsgID.ID, Proto.CS_Ready);
        MessageManager.getInstance().addProtoAction(Proto.CS_Maajan_Action_Discard.MsgID.ID, Proto.CS_Maajan_Action_Discard);
        MessageManager.getInstance().addProtoAction(Proto.CS_Maajan_Do_Action.MsgID.ID, Proto.CS_Maajan_Do_Action);
        MessageManager.getInstance().addProtoAction(Proto.CS_StandUpAndExitRoom.MsgID.ID, Proto.CS_StandUpAndExitRoom);
        MessageManager.getInstance().addProtoAction(Proto.CS_DismissTableReq.MsgID.ID, Proto.CS_DismissTableReq);
        MessageManager.getInstance().addProtoAction(Proto.CS_DismissTableCommit.MsgID.ID, Proto.CS_DismissTableCommit);
        MessageManager.getInstance().addProtoAction(Proto.CL_Auth.MsgID.ID, Proto.CL_Auth);
        MessageManager.getInstance().addProtoAction(Proto.CS_GameServerCfg.MsgID.ID, Proto.CS_GameServerCfg);
        MessageManager.getInstance().addProtoAction(Proto.C2S_EDIT_TABLE_TEMPLATE.MsgID.ID, Proto.C2S_EDIT_TABLE_TEMPLATE);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CREATE_CLUB_WITH_INVITE_MAIL.MsgID.ID, Proto.C2S_CREATE_CLUB_WITH_INVITE_MAIL);
        MessageManager.getInstance().addProtoAction(Proto.C2S_INVITE_JOIN_CLUB.MsgID.ID, Proto.C2S_INVITE_JOIN_CLUB);
        MessageManager.getInstance().addProtoAction(Proto.CS_PullSummaryMails.MsgID.ID, Proto.CS_PullSummaryMails);
        MessageManager.getInstance().addProtoAction(Proto.CS_ReadMail.MsgID.ID, Proto.CS_ReadMail);
        MessageManager.getInstance().addProtoAction(Proto.CS_PullMailDetail.MsgID.ID, Proto.CS_PullMailDetail);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUB_TEAM_LIST_REQ.MsgID.ID, Proto.C2S_CLUB_TEAM_LIST_REQ);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUB_OP_REQ.MsgID.ID, Proto.C2S_CLUB_OP_REQ);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUB_TRANSFER_MONEY_REQ.MsgID.ID, Proto.C2S_CLUB_TRANSFER_MONEY_REQ);
        MessageManager.getInstance().addProtoAction(Proto.C2S_GET_CLUB_TEAM_TEMPLATE_CONFIG.MsgID.ID, Proto.C2S_GET_CLUB_TEAM_TEMPLATE_CONFIG);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CONFIG_CLUB_TEAM_TEMPLATE.MsgID.ID, Proto.C2S_CONFIG_CLUB_TEAM_TEMPLATE);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CONFIG_CLUB_TEMPLATE_COMMISSION.MsgID.ID, Proto.C2S_CONFIG_CLUB_TEMPLATE_COMMISSION);
        MessageManager.getInstance().addProtoAction(Proto.C2S_GET_CLUB_TEMPLATE_COMMISSION.MsgID.ID, Proto.C2S_GET_CLUB_TEMPLATE_COMMISSION);
        MessageManager.getInstance().addProtoAction(Proto.C2S_EXCHANGE_CLUB_COMMISSON_REQ.MsgID.ID, Proto.C2S_EXCHANGE_CLUB_COMMISSON_REQ);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUB_MONEY_REQ.MsgID.ID, Proto.C2S_CLUB_MONEY_REQ);
        MessageManager.getInstance().addProtoAction(Proto.CS_RED_DOT.MsgID.ID, Proto.CS_RED_DOT);
        MessageManager.getInstance().addProtoAction(Proto.CS_HuanPai.MsgID.ID, Proto.CS_HuanPai);
        MessageManager.getInstance().addProtoAction(Proto.CS_DingQue.MsgID.ID, Proto.CS_DingQue);
        MessageManager.getInstance().addProtoAction(Proto.CS_PiaoFen.MsgID.ID, Proto.CS_PiaoFen);
        MessageManager.getInstance().addProtoAction(Proto.CS_Baoting.MsgID.ID, Proto.CS_Baoting);
        MessageManager.getInstance().addProtoAction(Proto.CS_CP_Baoting.MsgID.ID, Proto.CS_CP_Baoting);
        MessageManager.getInstance().addProtoAction(Proto.CS_Trustee.MsgID.ID, Proto.CS_Trustee);
        MessageManager.getInstance().addProtoAction(Proto.CS_VoteTableReq.MsgID.ID, Proto.CS_VoteTableReq);
        MessageManager.getInstance().addProtoAction(Proto.CS_VoteTableCommit.MsgID.ID, Proto.CS_VoteTableCommit);
        MessageManager.getInstance().addProtoAction(Proto.CS_UpdateLocation.MsgID.ID, Proto.CS_UpdateLocation);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CONFIG_FAST_GAME_LIST.MsgID.ID, Proto.C2S_CONFIG_FAST_GAME_LIST);
        MessageManager.getInstance().addProtoAction(Proto.C2S_IMPORT_PLAYER_FROM_GROUP.MsgID.ID, Proto.C2S_IMPORT_PLAYER_FROM_GROUP);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUB_FORCE_DISMISS_TABLE.MsgID.ID, Proto.C2S_CLUB_FORCE_DISMISS_TABLE);
        MessageManager.getInstance().addProtoAction(Proto.CS_PdkDoAction.MsgID.ID, Proto.CS_PdkDoAction);
        MessageManager.getInstance().addProtoAction(Proto.C2SPlayerInteraction.MsgID.ID, Proto.C2SPlayerInteraction);
        MessageManager.getInstance().addProtoAction(Proto.CS_RequestSmsVerifyCode.MsgID.ID, Proto.CS_RequestSmsVerifyCode);
        MessageManager.getInstance().addProtoAction(Proto.CS_RequestBindPhone.MsgID.ID, Proto.CS_RequestBindPhone);
        MessageManager.getInstance().addProtoAction(Proto.CS_DdzDoAction.MsgID.ID, Proto.CS_DdzDoAction);
        MessageManager.getInstance().addProtoAction(Proto.CS_DdzCallLandlord.MsgID.ID, Proto.CS_DdzCallLandlord);
        MessageManager.getInstance().addProtoAction(Proto.CS_PERSONAL_ID_BIND.MsgID.ID, Proto.CS_PERSONAL_ID_BIND);
        MessageManager.getInstance().addProtoAction(Proto.CS_SearchPlayer.MsgID.ID, Proto.CS_SearchPlayer);
        MessageManager.getInstance().addProtoAction(Proto.CS_PlayOnceAgain.MsgID.ID, Proto.CS_PlayOnceAgain);
        MessageManager.getInstance().addProtoAction(Proto.CS_SEARCH_CLUB_PLAYER.MsgID.ID, Proto.CS_SEARCH_CLUB_PLAYER);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUB_EDIT_TEAM_CONFIG.MsgID.ID, Proto.C2S_CLUB_EDIT_TEAM_CONFIG);
        MessageManager.getInstance().addProtoAction(Proto.CS_MaajanGetTingTilesInfo.MsgID.ID, Proto.CS_MaajanGetTingTilesInfo);
        MessageManager.getInstance().addProtoAction(Proto.C2S_VoiceInteractive.MsgID.ID, Proto.C2S_VoiceInteractive);
        MessageManager.getInstance().addProtoAction(Proto.C2S_RESET_CLUB_TEMPLATE_COMMISSION.MsgID.ID, Proto.C2S_RESET_CLUB_TEMPLATE_COMMISSION);
        MessageManager.getInstance().addProtoAction(Proto.CS_CLUB_IMPORT_PLAYER_FROM_TEAM.MsgID.ID, Proto.CS_CLUB_IMPORT_PLAYER_FROM_TEAM);
        MessageManager.getInstance().addProtoAction(Proto.CS_TEAM_STATUS_INFO.MsgID.ID, Proto.CS_TEAM_STATUS_INFO);
        MessageManager.getInstance().addProtoAction(Proto.CS_CLUB_TEAM_TEMPLATE_INFO.MsgID.ID, Proto.CS_CLUB_TEAM_TEMPLATE_INFO);
        MessageManager.getInstance().addProtoAction(Proto.CS_CLUB_CHANGE_TEAM_TEMPLATE.MsgID.ID, Proto.CS_CLUB_CHANGE_TEAM_TEMPLATE);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUB_GET_TEAM_PARTNER_CONFIG.MsgID.ID, Proto.C2S_CLUB_GET_TEAM_PARTNER_CONFIG);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUB_EDIT_TEAM_PARTNER_CONFIG.MsgID.ID, Proto.C2S_CLUB_EDIT_TEAM_PARTNER_CONFIG);

        MessageManager.getInstance().addProtoAction(Proto.CS_ForceKickoutPlayer.MsgID.ID, Proto.CS_ForceKickoutPlayer);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUB_DISMISS_REQ.MsgID.ID, Proto.C2S_CLUB_DISMISS_REQ);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUB_EDIT_INFO.MsgID.ID, Proto.C2S_CLUB_EDIT_INFO);
        MessageManager.getInstance().addProtoAction(Proto.CS_NOTICE_REQ.MsgID.ID, Proto.CS_NOTICE_REQ);
        MessageManager.getInstance().addProtoAction(Proto.CS_PUBLISH_NOTICE.MsgID.ID, Proto.CS_PUBLISH_NOTICE);
        MessageManager.getInstance().addProtoAction(Proto.CS_EDIT_NOTICE.MsgID.ID, Proto.CS_EDIT_NOTICE);
        MessageManager.getInstance().addProtoAction(Proto.CS_DEL_NOTICE.MsgID.ID, Proto.CS_DEL_NOTICE);
        MessageManager.getInstance().addProtoAction(Proto.CS_SetNickname.MsgID.ID, Proto.CS_SetNickname);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUB_GET_CONFIG.MsgID.ID, Proto.C2S_CLUB_GET_CONFIG);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUB_EDIT_CONFIG.MsgID.ID, Proto.C2S_CLUB_EDIT_CONFIG);
        MessageManager.getInstance().addProtoAction(Proto.CS_RequestBindWx.MsgID.ID, Proto.CS_RequestBindWx);
        MessageManager.getInstance().addProtoAction(Proto.CS_MaajanZhuoJiGuMai.MsgID.ID, Proto.CS_MaajanZhuoJiGuMai);

        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUB_BLOCK_PULL_GROUPS.MsgID.ID, Proto.C2S_CLUB_BLOCK_PULL_GROUPS);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUB_BLOCK_NEW_GROUP.MsgID.ID, Proto.C2S_CLUB_BLOCK_NEW_GROUP);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUB_BLOCK_DEL_GROUP.MsgID.ID, Proto.C2S_CLUB_BLOCK_DEL_GROUP);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUB_BLOCK_ADD_PLAYER_TO_GROUP.MsgID.ID, Proto.C2S_CLUB_BLOCK_ADD_PLAYER_TO_GROUP);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUB_BLOCK_REMOVE_PLAYER_FROM_GROUP.MsgID.ID, Proto.C2S_CLUB_BLOCK_REMOVE_PLAYER_FROM_GROUP);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUB_INVITE_JOIN_ROOM.MsgID.ID, Proto.C2S_CLUB_INVITE_JOIN_ROOM);
        MessageManager.getInstance().addProtoAction(Proto.CS_CLUB_MEMBER_INFO.MsgID.ID, Proto.CS_CLUB_MEMBER_INFO);
        MessageManager.getInstance().addProtoAction(Proto.CS_FastJoinRoom.MsgID.ID, Proto.CS_FastJoinRoom);
        MessageManager.getInstance().addProtoAction(Proto.CS_ReconnectJoinRoom.MsgID.ID, Proto.CS_ReconnectJoinRoom);

        // 组长隔离
        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUB_BLOCK_TEAM_PULL_GROUPS.MsgID.ID, Proto.C2S_CLUB_BLOCK_TEAM_PULL_GROUPS);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUB_BLOCK_TEAM_NEW_GROUP.MsgID.ID, Proto.C2S_CLUB_BLOCK_TEAM_NEW_GROUP);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUB_BLOCK_TEAM_DEL_GROUP.MsgID.ID, Proto.C2S_CLUB_BLOCK_TEAM_DEL_GROUP);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUB_BLOCK_TEAM_ADD_TEAM_TO_GROUP.MsgID.ID, Proto.C2S_CLUB_BLOCK_TEAM_ADD_TEAM_TO_GROUP);
        MessageManager.getInstance().addProtoAction(Proto.C2S_CLUB_BLOCK_TEAM_REMOVE_TEAM_FROM_GROUP.MsgID.ID, Proto.C2S_CLUB_BLOCK_TEAM_REMOVE_TEAM_FROM_GROUP);

        // 炸金花
        MessageManager.getInstance().addProtoAction(Proto.CS_ZhaJinHuaGiveUp.MsgID.ID, Proto.CS_ZhaJinHuaGiveUp);
        MessageManager.getInstance().addProtoAction(Proto.CS_ZhaJinHuaLookCard.MsgID.ID, Proto.CS_ZhaJinHuaLookCard);
        MessageManager.getInstance().addProtoAction(Proto.CS_ZhaJinHuaFollowBet.MsgID.ID, Proto.CS_ZhaJinHuaFollowBet);
        MessageManager.getInstance().addProtoAction(Proto.CS_ZhaJinHuaAllIn.MsgID.ID, Proto.CS_ZhaJinHuaAllIn);
        MessageManager.getInstance().addProtoAction(Proto.CS_ZhaJinHuaAddScore.MsgID.ID, Proto.CS_ZhaJinHuaAddScore);
        MessageManager.getInstance().addProtoAction(Proto.CS_ZhaJinHuaCompareCards.MsgID.ID, Proto.CS_ZhaJinHuaCompareCards);
        MessageManager.getInstance().addProtoAction(Proto.CS_ZhaJinHuaStartGame.MsgID.ID, Proto.CS_ZhaJinHuaStartGame);

        // 拼十
        MessageManager.getInstance().addProtoAction(Proto.CS_OxStartGame.MsgID.ID, Proto.CS_OxStartGame);
        MessageManager.getInstance().addProtoAction(Proto.CS_OxCallBanker.MsgID.ID, Proto.CS_OxCallBanker);
        MessageManager.getInstance().addProtoAction(Proto.CS_OxAddScore.MsgID.ID, Proto.CS_OxAddScore);
        MessageManager.getInstance().addProtoAction(Proto.CS_OxSplitCards.MsgID.ID, Proto.CS_OxSplitCards);

        // 长牌
        MessageManager.getInstance().addProtoAction(Proto.CS_Changpai_Action_Discard.MsgID.ID, Proto.CS_Changpai_Action_Discard);
        MessageManager.getInstance().addProtoAction(Proto.CS_Changpai_Do_Action.MsgID.ID, Proto.CS_Changpai_Do_Action);
        //-------------------------------------------------------接受PB----------------------------------------------------------------

        //系统

        MessageManager.getInstance().addProtoAction(Proto.SC_Logout.MsgID.ID, Proto.SC_Logout);
        MessageManager.getInstance().addProtoAction(Proto.LC_Login.MsgID.ID, Proto.LC_Login);
        MessageManager.getInstance().addProtoAction(Proto.SC_ReplyPlayerInfo.MsgID.ID, Proto.SC_ReplyPlayerInfo);
        MessageManager.getInstance().addProtoAction(Proto.SC_HeartBeat.MsgID.ID, Proto.SC_HeartBeat);
        MessageManager.getInstance().addProtoAction(Proto.S2C_CLUBLIST_RES.MsgID.ID, Proto.S2C_CLUBLIST_RES);
        MessageManager.getInstance().addProtoAction(Proto.S2C_JOIN_CLUB_RES.MsgID.ID, Proto.S2C_JOIN_CLUB_RES);
        MessageManager.getInstance().addProtoAction(Proto.S2C_SYNC_TABLES_RES.MsgID.ID, Proto.S2C_SYNC_TABLES_RES);
        MessageManager.getInstance().addProtoAction(Proto.SC_CreateRoom.MsgID.ID, Proto.SC_CreateRoom);
        MessageManager.getInstance().addProtoAction(Proto.S2C_CLUB_INFO_RES.MsgID.ID, Proto.S2C_CLUB_INFO_RES);
        MessageManager.getInstance().addProtoAction(Proto.S2C_CREATE_CLUB_RES.MsgID.ID, Proto.S2C_CREATE_CLUB_RES);
        MessageManager.getInstance().addProtoAction(Proto.S2C_CLUB_PLAYER_LIST_RES.MsgID.ID, Proto.S2C_CLUB_PLAYER_LIST_RES);
        MessageManager.getInstance().addProtoAction(Proto.S2C_CLUB_OP_RES.MsgID.ID, Proto.S2C_CLUB_OP_RES);
        MessageManager.getInstance().addProtoAction(Proto.S2C_CLUB_REQUEST_LIST_RES.MsgID.ID, Proto.S2C_CLUB_REQUEST_LIST_RES);
        MessageManager.getInstance().addProtoAction(Proto.S2C_EDIT_CLUB_GAME_TYPE_RES.MsgID.ID, Proto.S2C_EDIT_CLUB_GAME_TYPE_RES);
        MessageManager.getInstance().addProtoAction(Proto.S2C_CLUB_TABLE_INFO_RES.MsgID.ID, Proto.S2C_CLUB_TABLE_INFO_RES);
        MessageManager.getInstance().addProtoAction(Proto.SC_JoinRoom.MsgID.ID, Proto.SC_JoinRoom);
        MessageManager.getInstance().addProtoAction(Proto.SC_NotifySitDown.MsgID.ID, Proto.SC_NotifySitDown);
        MessageManager.getInstance().addProtoAction(Proto.SC_NotifyStandUp.MsgID.ID, Proto.SC_NotifyStandUp);
        MessageManager.getInstance().addProtoAction(Proto.SC_StandUpAndExitRoom.MsgID.ID, Proto.SC_StandUpAndExitRoom);
        MessageManager.getInstance().addProtoAction(Proto.SC_Ready.MsgID.ID, Proto.SC_Ready);
        MessageManager.getInstance().addProtoAction(Proto.S2C_TRANSFER_ROOM_OWNER_RES.MsgID.ID, Proto.S2C_TRANSFER_ROOM_OWNER_RES);
        MessageManager.getInstance().addProtoAction(Proto.LC_Auth.MsgID.ID, Proto.LC_Auth);
        MessageManager.getInstance().addProtoAction(Proto.SC_WaitingTing.MsgID.ID, Proto.SC_WaitingTing);
        MessageManager.getInstance().addProtoAction(Proto.SC_PullMails.MsgID.ID, Proto.SC_PullMails);
        MessageManager.getInstance().addProtoAction(Proto.SC_PullMailDetail.MsgID.ID, Proto.SC_PullMailDetail);
        MessageManager.getInstance().addProtoAction(Proto.SYNC_OBJECT.MsgID.ID, Proto.SYNC_OBJECT);
        MessageManager.getInstance().addProtoAction(Proto.SC_ReceiveMail.MsgID.ID, Proto.SC_ReceiveMail);
        MessageManager.getInstance().addProtoAction(Proto.S2C_WARN_CODE_RES.MsgID.ID, Proto.S2C_WARN_CODE_RES);
        MessageManager.getInstance().addProtoAction(Proto.SC_RED_DOT.MsgID.ID, Proto.SC_RED_DOT);
        MessageManager.getInstance().addProtoAction(Proto.SC_Trustee.MsgID.ID, Proto.SC_Trustee);
        MessageManager.getInstance().addProtoAction(Proto.SC_TimeOutNotify.MsgID.ID, Proto.SC_TimeOutNotify);
        MessageManager.getInstance().addProtoAction(Proto.SC_VoteTableReq.MsgID.ID, Proto.SC_VoteTableReq);
        MessageManager.getInstance().addProtoAction(Proto.SC_VoteTableRequestInfo.MsgID.ID, Proto.SC_VoteTableRequestInfo);
        MessageManager.getInstance().addProtoAction(Proto.SC_VoteTableCommit.MsgID.ID, Proto.SC_VoteTableCommit);
        MessageManager.getInstance().addProtoAction(Proto.SC_VoteTable.MsgID.ID, Proto.SC_VoteTable);
        MessageManager.getInstance().addProtoAction(Proto.SC_UpdateLocation.MsgID.ID, Proto.SC_UpdateLocation);
        MessageManager.getInstance().addProtoAction(Proto.S2C_CONFIG_FAST_GAME_LIST.MsgID.ID, Proto.S2C_CONFIG_FAST_GAME_LIST);
        MessageManager.getInstance().addProtoAction(Proto.S2C_CLUB_FORCE_DISMISS_TABLE.MsgID.ID, Proto.S2C_CLUB_FORCE_DISMISS_TABLE);
        MessageManager.getInstance().addProtoAction(Proto.S2CPlayerInteraction.MsgID.ID, Proto.S2CPlayerInteraction);
        MessageManager.getInstance().addProtoAction(Proto.SC_RequestSmsVerifyCode.MsgID.ID, Proto.SC_RequestSmsVerifyCode);
        MessageManager.getInstance().addProtoAction(Proto.SC_RequestBindPhone.MsgID.ID, Proto.SC_RequestBindPhone);
        MessageManager.getInstance().addProtoAction(Proto.SC_SetNickname.MsgID.ID, Proto.SC_SetNickname);
        MessageManager.getInstance().addProtoAction(Proto.SC_SearchPlayer.MsgID.ID, Proto.SC_SearchPlayer);
        MessageManager.getInstance().addProtoAction(Proto.SC_SEARCH_CLUB_PLAYER.MsgID.ID, Proto.SC_SEARCH_CLUB_PLAYER);
        MessageManager.getInstance().addProtoAction(Proto.S2C_CLUB_EDIT_TEAM_CONFIG.MsgID.ID, Proto.S2C_CLUB_EDIT_TEAM_CONFIG);
        MessageManager.getInstance().addProtoAction(Proto.SC_NotifyOnline.MsgID.ID, Proto.SC_NotifyOnline);
        MessageManager.getInstance().addProtoAction(Proto.SC_StartTimer.MsgID.ID, Proto.SC_StartTimer);
        MessageManager.getInstance().addProtoAction(Proto.SC_CancelTimer.MsgID.ID, Proto.SC_CancelTimer);
        MessageManager.getInstance().addProtoAction(Proto.S2C_VoiceInteractive.MsgID.ID, Proto.S2C_VoiceInteractive);
        MessageManager.getInstance().addProtoAction(Proto.SC_CLUB_SYNC_TABLES.MsgID.ID, Proto.SC_CLUB_SYNC_TABLES);
        MessageManager.getInstance().addProtoAction(Proto.SC_ReconnectJoinRoom.MsgID.ID, Proto.SC_ReconnectJoinRoom);

        MessageManager.getInstance().addProtoAction(Proto.S2C_CLUB_EDIT_INFO.MsgID.ID, Proto.S2C_CLUB_EDIT_INFO);
        MessageManager.getInstance().addProtoAction(Proto.SC_NOTICE_RES.MsgID.ID, Proto.SC_NOTICE_RES);
        MessageManager.getInstance().addProtoAction(Proto.SC_PUBLISH_NOTICE.MsgID.ID, Proto.SC_PUBLISH_NOTICE);
        MessageManager.getInstance().addProtoAction(Proto.SC_EDIT_NOTICE.MsgID.ID, Proto.SC_EDIT_NOTICE);
        MessageManager.getInstance().addProtoAction(Proto.SC_DEL_NOTICE.MsgID.ID, Proto.SC_DEL_NOTICE);
        MessageManager.getInstance().addProtoAction(Proto.SC_RequestBindWx.MsgID.ID, Proto.SC_RequestBindWx);
        MessageManager.getInstance().addProtoAction(Proto.SC_PERSONAL_ID_BIND.MsgID.ID, Proto.SC_PERSONAL_ID_BIND);
        MessageManager.getInstance().addProtoAction(Proto.SC_PlayOnceAgain.MsgID.ID, Proto.SC_PlayOnceAgain);
        MessageManager.getInstance().addProtoAction(Proto.S2C_CLUB_INVITE_JOIN_ROOM.MsgID.ID, Proto.S2C_CLUB_INVITE_JOIN_ROOM);
        MessageManager.getInstance().addProtoAction(Proto.S2C_NOTIFY_INVITE_JOIN_ROOM.MsgID.ID, Proto.S2C_NOTIFY_INVITE_JOIN_ROOM);
        MessageManager.getInstance().addProtoAction(Proto.SC_ForceKickoutPlayer.MsgID.ID, Proto.SC_ForceKickoutPlayer);
        MessageManager.getInstance().addProtoAction(Proto.SC_NotifyNotice.MsgID.ID, Proto.SC_NotifyNotice);
        MessageManager.getInstance().addProtoAction(Proto.S2C_RESET_CLUB_TEMPLATE_COMMISSION.MsgID.ID, Proto.S2C_RESET_CLUB_TEMPLATE_COMMISSION);
        MessageManager.getInstance().addProtoAction(Proto.SC_CLUB_IMPORT_PLAYER_FROM_TEAM.MsgID.ID, Proto.SC_CLUB_IMPORT_PLAYER_FROM_TEAM);
        MessageManager.getInstance().addProtoAction(Proto.SC_TEAM_STATUS_INFO.MsgID.ID, Proto.SC_TEAM_STATUS_INFO);
        MessageManager.getInstance().addProtoAction(Proto.SC_FastJoinRoom.MsgID.ID, Proto.SC_FastJoinRoom);
        MessageManager.getInstance().addProtoAction(Proto.SC_CLUB_TEAM_TEMPLATE_INFO.MsgID.ID, Proto.SC_CLUB_TEAM_TEMPLATE_INFO);
        MessageManager.getInstance().addProtoAction(Proto.SC_CLUB_CHANGE_TEAM_TEMPLATE.MsgID.ID, Proto.SC_CLUB_CHANGE_TEAM_TEMPLATE);
        MessageManager.getInstance().addProtoAction(Proto.S2C_CLUB_GET_TEAM_PARTNER_CONFIG.MsgID.ID, Proto.S2C_CLUB_GET_TEAM_PARTNER_CONFIG);
        MessageManager.getInstance().addProtoAction(Proto.S2C_CLUB_EDIT_TEAM_PARTNER_CONFIG.MsgID.ID, Proto.S2C_CLUB_EDIT_TEAM_PARTNER_CONFIG);
        //--------------mj部分-----------------
        MessageManager.getInstance().addProtoAction(Proto.SC_Maajan_Desk_Enter.MsgID.ID, Proto.SC_Maajan_Desk_Enter);
        MessageManager.getInstance().addProtoAction(Proto.SC_Maajan_Discard_Round.MsgID.ID, Proto.SC_Maajan_Discard_Round);
        MessageManager.getInstance().addProtoAction(Proto.SC_Maajan_Desk_State.MsgID.ID, Proto.SC_Maajan_Desk_State);
        MessageManager.getInstance().addProtoAction(Proto.SC_Maajan_Tile_Left.MsgID.ID, Proto.SC_Maajan_Tile_Left);
        MessageManager.getInstance().addProtoAction(Proto.SC_Maajan_Action_Discard.MsgID.ID, Proto.SC_Maajan_Action_Discard)
        MessageManager.getInstance().addProtoAction(Proto.SC_Maajan_Draw.MsgID.ID, Proto.SC_Maajan_Draw)
        MessageManager.getInstance().addProtoAction(Proto.SC_WaitingDoActions.MsgID.ID, Proto.SC_WaitingDoActions)
        MessageManager.getInstance().addProtoAction(Proto.SC_Maajan_Do_Action.MsgID.ID, Proto.SC_Maajan_Do_Action)
        MessageManager.getInstance().addProtoAction(Proto.SC_Maajan_Game_Finish.MsgID.ID, Proto.SC_Maajan_Game_Finish)
        MessageManager.getInstance().addProtoAction(Proto.SC_DismissTableReq.MsgID.ID, Proto.SC_DismissTableReq);
        MessageManager.getInstance().addProtoAction(Proto.SC_DismissTableRequestInfo.MsgID.ID, Proto.SC_DismissTableRequestInfo);
        MessageManager.getInstance().addProtoAction(Proto.SC_DismissTable.MsgID.ID, Proto.SC_DismissTable);
        MessageManager.getInstance().addProtoAction(Proto.SC_DismissTableCommit.MsgID.ID, Proto.SC_DismissTableCommit);
        MessageManager.getInstance().addProtoAction(Proto.SC_Maajan_StopAction.MsgID.ID, Proto.SC_Maajan_StopAction);
        MessageManager.getInstance().addProtoAction(Proto.SC_GameServerCfg.MsgID.ID, Proto.SC_GameServerCfg);
        MessageManager.getInstance().addProtoAction(Proto.SC_TingTips.MsgID.ID, Proto.SC_TingTips);
        MessageManager.getInstance().addProtoAction(Proto.SC_Maajan_Final_Game_Over.MsgID.ID, Proto.SC_Maajan_Final_Game_Over);
        MessageManager.getInstance().addProtoAction(Proto.SC_MaajanZhuoJiGuMai.MsgID.ID, Proto.SC_MaajanZhuoJiGuMai);
        //MessageManager.getInstance().addProtoAction(Proto.SC_MaajanZhuoJiGuMaiData.MsgID.ID,Proto.SC_MaajanZhuoJiGuMaiData);
        MessageManager.getInstance().addProtoAction(Proto.SC_MaajanZhuoJiBeginGuMai.MsgID.ID, Proto.SC_MaajanZhuoJiBeginGuMai);
        MessageManager.getInstance().addProtoAction(Proto.SC_MaajanGetTingTilesInfo.MsgID.ID, Proto.SC_MaajanGetTingTilesInfo);
        MessageManager.getInstance().addProtoAction(Proto.SC_Maajan_Do_Action_Commit.MsgID.ID, Proto.SC_Maajan_Do_Action_Commit);

        MessageManager.getInstance().addProtoAction(Proto.SC_AllowPiaoFen.MsgID.ID, Proto.SC_AllowPiaoFen);
        MessageManager.getInstance().addProtoAction(Proto.SC_PiaoFen.MsgID.ID, Proto.SC_PiaoFen);
        MessageManager.getInstance().addProtoAction(Proto.SC_PiaoFenStatus.MsgID.ID, Proto.SC_PiaoFenStatus);
        MessageManager.getInstance().addProtoAction(Proto.SC_PiaoFenCommit.MsgID.ID, Proto.SC_PiaoFenCommit);
        MessageManager.getInstance().addProtoAction(Proto.SC_AllowBaoting.MsgID.ID, Proto.SC_AllowBaoting);
        MessageManager.getInstance().addProtoAction(Proto.SC_Baoting.MsgID.ID, Proto.SC_Baoting);
        MessageManager.getInstance().addProtoAction(Proto.SC_BaotingStatus.MsgID.ID, Proto.SC_BaotingStatus);
        MessageManager.getInstance().addProtoAction(Proto.SC_BaotingCommit.MsgID.ID, Proto.SC_BaotingCommit);
        MessageManager.getInstance().addProtoAction(Proto.SC_BaoTingInfos.MsgID.ID, Proto.SC_BaoTingInfos);
        // ------------------------ 联盟-----------------------

        MessageManager.getInstance().addProtoAction(Proto.S2C_EDIT_TABLE_TEMPLATE.MsgID.ID, Proto.S2C_EDIT_TABLE_TEMPLATE);
        MessageManager.getInstance().addProtoAction(Proto.S2C_NOTIFY_TABLE_TEMPLATE.MsgID.ID, Proto.S2C_NOTIFY_TABLE_TEMPLATE);
        MessageManager.getInstance().addProtoAction(Proto.S2C_INVITE_JOIN_CLUB.MsgID.ID, Proto.S2C_INVITE_JOIN_CLUB);
        MessageManager.getInstance().addProtoAction(Proto.S2C_CLUB_TEAM_LIST_RES.MsgID.ID, Proto.S2C_CLUB_TEAM_LIST_RES);
        MessageManager.getInstance().addProtoAction(Proto.S2C_CLUB_TRANSFER_MONEY_RES.MsgID.ID, Proto.S2C_CLUB_TRANSFER_MONEY_RES);
        MessageManager.getInstance().addProtoAction(Proto.S2C_CONFIG_CLUB_TEAM_TEMPLATE.MsgID.ID, Proto.S2C_CONFIG_CLUB_TEAM_TEMPLATE);
        MessageManager.getInstance().addProtoAction(Proto.S2C_GET_CLUB_TEAM_TEMPLATE_CONFIG.MsgID.ID, Proto.S2C_GET_CLUB_TEAM_TEMPLATE_CONFIG);
        MessageManager.getInstance().addProtoAction(Proto.S2C_CONFIG_CLUB_TEMPLATE_COMMISSION.MsgID.ID, Proto.S2C_CONFIG_CLUB_TEMPLATE_COMMISSION);
        MessageManager.getInstance().addProtoAction(Proto.S2C_GET_CLUB_TEMPLATE_COMMISSION.MsgID.ID, Proto.S2C_GET_CLUB_TEMPLATE_COMMISSION);
        MessageManager.getInstance().addProtoAction(Proto.S2C_EXCHANGE_CLUB_COMMISSON_RES.MsgID.ID, Proto.S2C_EXCHANGE_CLUB_COMMISSON_RES);
        MessageManager.getInstance().addProtoAction(Proto.S2C_CLUB_MONEY_RES.MsgID.ID, Proto.S2C_CLUB_MONEY_RES);
        MessageManager.getInstance().addProtoAction(Proto.S2C_IMPORT_PLAYER_FROM_GROUP.MsgID.ID, Proto.S2C_IMPORT_PLAYER_FROM_GROUP);

        MessageManager.getInstance().addProtoAction(Proto.S2C_CLUB_BLOCK_PULL_GROUPS.MsgID.ID, Proto.S2C_CLUB_BLOCK_PULL_GROUPS);
        MessageManager.getInstance().addProtoAction(Proto.S2C_CLUB_BLOCK_NEW_GROUP.MsgID.ID, Proto.S2C_CLUB_BLOCK_NEW_GROUP);
        MessageManager.getInstance().addProtoAction(Proto.S2C_CLUB_BLOCK_DEL_GROUP.MsgID.ID, Proto.S2C_CLUB_BLOCK_DEL_GROUP);
        MessageManager.getInstance().addProtoAction(Proto.S2C_CLUB_BLOCK_ADD_PLAYER_TO_GROUP.MsgID.ID, Proto.S2C_CLUB_BLOCK_ADD_PLAYER_TO_GROUP);
        MessageManager.getInstance().addProtoAction(Proto.S2C_CLUB_BLOCK_REMOVE_PLAYER_FROM_GROUP.MsgID.ID, Proto.S2C_CLUB_BLOCK_REMOVE_PLAYER_FROM_GROUP);
        MessageManager.getInstance().addProtoAction(Proto.S2C_CLUB_EDIT_CONFIG.MsgID.ID, Proto.S2C_CLUB_EDIT_CONFIG);
        MessageManager.getInstance().addProtoAction(Proto.S2C_CLUB_GET_CONFIG.MsgID.ID, Proto.S2C_CLUB_GET_CONFIG);
        MessageManager.getInstance().addProtoAction(Proto.SC_CLUB_MEMBER_INFO.MsgID.ID, Proto.SC_CLUB_MEMBER_INFO);

        // 组长隔离
        MessageManager.getInstance().addProtoAction(Proto.S2C_CLUB_BLOCK_TEAM_PULL_GROUPS.MsgID.ID, Proto.S2C_CLUB_BLOCK_TEAM_PULL_GROUPS);
        MessageManager.getInstance().addProtoAction(Proto.S2C_CLUB_BLOCK_TEAM_NEW_GROUP.MsgID.ID, Proto.S2C_CLUB_BLOCK_TEAM_NEW_GROUP);
        MessageManager.getInstance().addProtoAction(Proto.S2C_CLUB_BLOCK_TEAM_DEL_GROUP.MsgID.ID, Proto.S2C_CLUB_BLOCK_TEAM_DEL_GROUP);
        MessageManager.getInstance().addProtoAction(Proto.S2C_CLUB_BLOCK_TEAM_ADD_TEAM_TO_GROUP.MsgID.ID, Proto.S2C_CLUB_BLOCK_TEAM_ADD_TEAM_TO_GROUP);
        MessageManager.getInstance().addProtoAction(Proto.S2C_CLUB_BLOCK_TEAM_REMOVE_TEAM_FROM_GROUP.MsgID.ID, Proto.S2C_CLUB_BLOCK_TEAM_REMOVE_TEAM_FROM_GROUP);

        // -----------------------------血战------------------------------
        MessageManager.getInstance().addProtoAction(Proto.SC_AllowHuanPai.MsgID.ID, Proto.SC_AllowHuanPai);
        MessageManager.getInstance().addProtoAction(Proto.SC_HuanPai.MsgID.ID, Proto.SC_HuanPai);
        MessageManager.getInstance().addProtoAction(Proto.SC_HuanPaiCommit.MsgID.ID, Proto.SC_HuanPaiCommit);
        MessageManager.getInstance().addProtoAction(Proto.SC_HuanPaiStatus.MsgID.ID, Proto.SC_HuanPaiStatus);
        MessageManager.getInstance().addProtoAction(Proto.SC_AllowDingQue.MsgID.ID, Proto.SC_AllowDingQue);
        MessageManager.getInstance().addProtoAction(Proto.SC_DingQue.MsgID.ID, Proto.SC_DingQue);
        MessageManager.getInstance().addProtoAction(Proto.SC_DingQueStatus.MsgID.ID, Proto.SC_DingQueStatus);
        MessageManager.getInstance().addProtoAction(Proto.SC_DingQueCommit.MsgID.ID, Proto.SC_DingQueCommit);
        MessageManager.getInstance().addProtoAction(Proto.SC_MaajanXueZhanGameFinish.MsgID.ID, Proto.SC_MaajanXueZhanGameFinish);
        MessageManager.getInstance().addProtoAction(Proto.SC_MaajanZiGongGameFinish.MsgID.ID, Proto.SC_MaajanZiGongGameFinish);
        MessageManager.getInstance().addProtoAction(Proto.SC_AllowPiaoFen.MsgID.ID, Proto.SC_AllowPiaoFen);
        MessageManager.getInstance().addProtoAction(Proto.SC_PiaoFen.MsgID.ID, Proto.SC_PiaoFen);
        MessageManager.getInstance().addProtoAction(Proto.SC_PiaoFenStatus.MsgID.ID, Proto.SC_PiaoFenStatus);
        MessageManager.getInstance().addProtoAction(Proto.SC_PiaoFenCommit.MsgID.ID, Proto.SC_PiaoFenCommit);
        MessageManager.getInstance().addProtoAction(Proto.SC_HuStatus.MsgID.ID, Proto.SC_HuStatus);
        MessageManager.getInstance().addProtoAction(Proto.SC_PlayerHuStatus.MsgID.ID, Proto.SC_PlayerHuStatus);
        MessageManager.getInstance().addProtoAction(Proto.SC_MaajanXueZhanFinalGameOver.MsgID.ID, Proto.SC_MaajanXueZhanFinalGameOver);

        // -----------------------------跑得快------------------------------
        MessageManager.getInstance().addProtoAction(Proto.SC_PdkDeskEnter.MsgID.ID, Proto.SC_PdkDeskEnter);
        MessageManager.getInstance().addProtoAction(Proto.SC_PdkDiscardRound.MsgID.ID, Proto.SC_PdkDiscardRound);
        MessageManager.getInstance().addProtoAction(Proto.SC_PdkDoAction.MsgID.ID, Proto.SC_PdkDoAction);
        MessageManager.getInstance().addProtoAction(Proto.SC_PdkGameOver.MsgID.ID, Proto.SC_PdkGameOver);
        MessageManager.getInstance().addProtoAction(Proto.SC_PdkFinalGameOver.MsgID.ID, Proto.SC_PdkFinalGameOver);

        //-----------------------斗地主--------------------------------
        MessageManager.getInstance().addProtoAction(Proto.SC_DdzDeskEnter.MsgID.ID, Proto.SC_DdzDeskEnter);
        MessageManager.getInstance().addProtoAction(Proto.SC_DdzDiscardRound.MsgID.ID, Proto.SC_DdzDiscardRound);
        MessageManager.getInstance().addProtoAction(Proto.SC_DdzDoAction.MsgID.ID, Proto.SC_DdzDoAction);
        MessageManager.getInstance().addProtoAction(Proto.SC_DdzGameOver.MsgID.ID, Proto.SC_DdzGameOver);
        MessageManager.getInstance().addProtoAction(Proto.SC_DdzFinalGameOver.MsgID.ID, Proto.SC_DdzFinalGameOver);
        MessageManager.getInstance().addProtoAction(Proto.SC_DdzCallLandlordRound.MsgID.ID, Proto.SC_DdzCallLandlordRound);
        MessageManager.getInstance().addProtoAction(Proto.SC_DdzCallLandlord.MsgID.ID, Proto.SC_DdzCallLandlord);
        MessageManager.getInstance().addProtoAction(Proto.SC_DdzCallLandlordOver.MsgID.ID, Proto.SC_DdzCallLandlordOver);
        MessageManager.getInstance().addProtoAction(Proto.SC_DdzCallLandlordInfo.MsgID.ID, Proto.SC_DdzCallLandlordInfo);
        MessageManager.getInstance().addProtoAction(Proto.SC_DdzRestart.MsgID.ID, Proto.SC_DdzRestart);

        //-----------------------炸金花--------------------------------
        MessageManager.getInstance().addProtoAction(Proto.SC_ZhaJinHuaStart.MsgID.ID, Proto.SC_ZhaJinHuaStart);
        MessageManager.getInstance().addProtoAction(Proto.SC_ZhaJinHuaTurn.MsgID.ID, Proto.SC_ZhaJinHuaTurn);
        MessageManager.getInstance().addProtoAction(Proto.SC_ZhaJinHuaAddScore.MsgID.ID, Proto.SC_ZhaJinHuaAddScore);
        MessageManager.getInstance().addProtoAction(Proto.SC_ZhaJinHuaLookCard.MsgID.ID, Proto.SC_ZhaJinHuaLookCard);
        MessageManager.getInstance().addProtoAction(Proto.SC_ZhaJinHuaCompareCards.MsgID.ID, Proto.SC_ZhaJinHuaCompareCards);
        MessageManager.getInstance().addProtoAction(Proto.SC_ZhaJinHuaRound.MsgID.ID, Proto.SC_ZhaJinHuaRound);
        MessageManager.getInstance().addProtoAction(Proto.SC_ZhaJinHuaGiveUp.MsgID.ID, Proto.SC_ZhaJinHuaGiveUp);
        MessageManager.getInstance().addProtoAction(Proto.SC_ZhaJinHuaFollowBet.MsgID.ID, Proto.SC_ZhaJinHuaFollowBet);
        MessageManager.getInstance().addProtoAction(Proto.SC_ZhaJinHuaAllIn.MsgID.ID, Proto.SC_ZhaJinHuaAllIn);
        MessageManager.getInstance().addProtoAction(Proto.SC_ZhaJinHuaReconnect.MsgID.ID, Proto.SC_ZhaJinHuaReconnect);
        MessageManager.getInstance().addProtoAction(Proto.SC_ZhaJinHuaGameOver.MsgID.ID, Proto.SC_ZhaJinHuaGameOver);
        MessageManager.getInstance().addProtoAction(Proto.SC_ZhaJinHuaFinalOver.MsgID.ID, Proto.SC_ZhaJinHuaFinalOver);
        MessageManager.getInstance().addProtoAction(Proto.SC_ZhaJinHuaTableGamingInfo.MsgID.ID, Proto.SC_ZhaJinHuaTableGamingInfo);
        MessageManager.getInstance().addProtoAction(Proto.SC_ZhaJinHuaStartGame.MsgID.ID, Proto.SC_ZhaJinHuaStartGame);

        //------------------------------拼十-------------------------
        MessageManager.getInstance().addProtoAction(Proto.SC_OxStart.MsgID.ID, Proto.SC_OxStart);
        MessageManager.getInstance().addProtoAction(Proto.SC_OxCallBanker.MsgID.ID, Proto.SC_OxCallBanker);
        MessageManager.getInstance().addProtoAction(Proto.SC_OxAddScore.MsgID.ID, Proto.SC_OxAddScore);
        MessageManager.getInstance().addProtoAction(Proto.SC_OxSplitCards.MsgID.ID, Proto.SC_OxSplitCards);
        MessageManager.getInstance().addProtoAction(Proto.SC_OxTableInfo.MsgID.ID, Proto.SC_OxTableInfo);
        MessageManager.getInstance().addProtoAction(Proto.SC_OxBalance.MsgID.ID, Proto.SC_OxBalance);
        MessageManager.getInstance().addProtoAction(Proto.SC_OxFinalOver.MsgID.ID, Proto.SC_OxFinalOver);
        MessageManager.getInstance().addProtoAction(Proto.SC_OxStartGame.MsgID.ID, Proto.SC_OxStartGame);
        MessageManager.getInstance().addProtoAction(Proto.SC_OxDealCard.MsgID.ID, Proto.SC_OxDealCard);
        MessageManager.getInstance().addProtoAction(Proto.SC_AllowCallBanker.MsgID.ID, Proto.SC_AllowCallBanker);
        MessageManager.getInstance().addProtoAction(Proto.SC_AllowAddScore.MsgID.ID, Proto.SC_AllowAddScore);
        MessageManager.getInstance().addProtoAction(Proto.SC_OxBankerInfo.MsgID.ID, Proto.SC_OxBankerInfo);
        MessageManager.getInstance().addProtoAction(Proto.SC_AllowSplitCards.MsgID.ID, Proto.SC_AllowSplitCards);

        //------------------------------自贡长牌-------------------------
        MessageManager.getInstance().addProtoAction(Proto.SC_Changpai_Desk_Enter.MsgID.ID, Proto.SC_Changpai_Desk_Enter);
        MessageManager.getInstance().addProtoAction(Proto.SC_Changpai_Desk_State.MsgID.ID, Proto.SC_Changpai_Desk_State);
        MessageManager.getInstance().addProtoAction(Proto.SC_Changpai_Draw.MsgID.ID, Proto.SC_Changpai_Draw);
        MessageManager.getInstance().addProtoAction(Proto.SC_Changpai_Fan.MsgID.ID, Proto.SC_Changpai_Fan);
        MessageManager.getInstance().addProtoAction(Proto.SC_Changpai_Discard_Round.MsgID.ID, Proto.SC_Changpai_Discard_Round);
        MessageManager.getInstance().addProtoAction(Proto.SC_Changpai_Action_Discard.MsgID.ID, Proto.SC_Changpai_Action_Discard);
        MessageManager.getInstance().addProtoAction(Proto.SC_Changpai_Tile_Left.MsgID.ID, Proto.SC_Changpai_Tile_Left);
        MessageManager.getInstance().addProtoAction(Proto.SC_CP_WaitingDoActions.MsgID.ID, Proto.SC_CP_WaitingDoActions);
        MessageManager.getInstance().addProtoAction(Proto.SC_Changpai_Do_Action.MsgID.ID, Proto.SC_Changpai_Do_Action);
        MessageManager.getInstance().addProtoAction(Proto.SC_Changpai_StopAction.MsgID.ID, Proto.SC_Changpai_StopAction);
        MessageManager.getInstance().addProtoAction(Proto.SC_CP_WaitingTing.MsgID.ID, Proto.SC_CP_WaitingTing);
        MessageManager.getInstance().addProtoAction(Proto.SC_CP_TingTips.MsgID.ID, Proto.SC_CP_TingTips);
        MessageManager.getInstance().addProtoAction(Proto.SC_Changpai_Do_Action_Commit.MsgID.ID, Proto.SC_Changpai_Do_Action_Commit);
        MessageManager.getInstance().addProtoAction(Proto.SC_CP_HuStatus.MsgID.ID, Proto.SC_CP_HuStatus);
        MessageManager.getInstance().addProtoAction(Proto.SC_ChangpaiGameFinish.MsgID.ID, Proto.SC_ChangpaiGameFinish);
        MessageManager.getInstance().addProtoAction(Proto.SC_Changpai_Final_Game_Over.MsgID.ID, Proto.SC_Changpai_Final_Game_Over);
        MessageManager.getInstance().addProtoAction(Proto.Changpai_Toupaistate.MsgID.ID, Proto.Changpai_Toupaistate);
        MessageManager.getInstance().addProtoAction(Proto.SC_CP_Tuo_Num.MsgID.ID, Proto.SC_CP_Tuo_Num);
        MessageManager.getInstance().addProtoAction(Proto.SC_CP_Canbe_Baopai.MsgID.ID, Proto.SC_CP_Canbe_Baopai);

        MessageManager.getInstance().addProtoAction(Proto.SC_CP_AllowBaoting.MsgID.ID, Proto.SC_CP_AllowBaoting);
        MessageManager.getInstance().addProtoAction(Proto.SC_CP_Baoting.MsgID.ID, Proto.SC_CP_Baoting);
        MessageManager.getInstance().addProtoAction(Proto.SC_CP_BaotingStatus.MsgID.ID, Proto.SC_CP_BaotingStatus);
        MessageManager.getInstance().addProtoAction(Proto.SC_CP_BaotingCommit.MsgID.ID, Proto.SC_CP_BaotingCommit);
        MessageManager.getInstance().addProtoAction(Proto.SC_CP_BaoTingInfos.MsgID.ID, Proto.SC_CP_BaoTingInfos);
                 
        //加入第一优先级列表  
        MessageManager.getInstance().addFirstMsgList(Proto.SC_HeartBeat.MsgID.ID);
    }

    public connectSocket() {
        if (SocketManager.getInstance().getSocketConnect()) // socket 已经连接的情况下，不需要重新连接
            return;
        if (GameConstValue.ConstValue.LOGIN_MODE >= GameConstValue.LOGIN_TYPE.LOGIN_RELEASE &&
            cc.sys.isNative && !SdkManager.getInstance().checkClientNetWorkReachable()) {
            let surefun = () => {
                GameManager.getInstance().connectSocket()
            }
            GameManager.getInstance().openStrongTipsUI(StringData.getString(10016), surefun);
            return;
        }
        if (GameConstValue.ConstValue.SELECT_IP) {
            return;
        }
        else if (GameConstValue.ConstValue.LOGIN_MODE == GameConstValue.LOGIN_TYPE.LOGIN_DEBUG) {
            UIManager.getInstance().openUI(WaitUI, 100, () => {
                // SocketManager.getInstance().connect("ws://" + "csws.irqwk.com" + ":" + 8100);
                SocketManager.getInstance().connect(GameConstValue.ConstValue.SEVER_IP);
            });
        }
        else {
            UIManager.getInstance().openUI(WaitUI, 100, () => {
                var sysData = GameDataManager.getInstance().systemData
                var curIpList = sysData.curIpList
                var idx = sysData.curRoundRobinNum
                var connectIp = sysData.getRandomNewIp()
                sysData.allReadyConnectList.push(connectIp)
                if (connectIp == undefined || connectIp.length == 0) {
                    UIManager.getInstance().closeUI(WaitUI)
                    // let surefun = () => {
                    //     GameManager.getInstance().connectSocket()
                    // }
                    // GameManager.getInstance().openStrongTipsUI(StringData.getString(10016), surefun);
                    sysData.clearConnectLogic()
                    GameManager.getInstance().connectSocket()
                } else if (connectIp.indexOf(":") >= 0) {
                    SocketManager.getInstance().connect("ws://" + connectIp);
                } else {
                    SocketManager.getInstance().connect("ws://" + connectIp + ":" + 8100);
                }

            });

            // {
            //     // CDN获取ip
            //     var callBack = function (error, ret) {
            //         if (ret) {
            //             this.curIpLsit = ret.split("&")
            //             GameDataManager.getInstance().systemData.maxRoundRobinNum = this.curIpLsit.length
            //             LogWrap.info(ret);
            //             var idx = GameDataManager.getInstance().systemData.curRoundRobinNum
            //             SocketManager.getInstance().connect("ws://" + this.curIpLsit[idx] + ":" + 6100);
            //         }
            //     }.bind(this);
            //     HttpManager.getInstance().get(GameConstValue.ConstValue.LOGIN_CDN_URL, "", null, callBack);
            // }
        }
    }

    public getSocketState() {
        return SocketManager.getInstance().getSocketReadyState()
    }

    // 切换后台或者断开链接时触发
    public onLinkBreakOrBackground() {
        GameUIController.getInstance().onEventHideRec()
        GameDataManager.getInstance().clearCurGameData() // 清理当前的游戏旧数据
        MessageManager.getInstance().clearMsglist(); // 清理消息队列

    }

    public update(dt) {
        if (this.handRecList.length > 0) {
            this.hanRecTime -= dt;
            if (this.hanRecTime <= 0) {
                this.hanRecTime = 5
                GameManager.getInstance().onLinkBreakOrBackground()
                GameManager.getInstance().closeSocket();
                GameManager.getInstance().connectSocket();
                this.handRecList = []
            }
        }
    }

    public handReconnect(tag = "handReconnect") {
        this.handRecList.push(tag)
    }

    public clearGlobalUI() {
        UIManager.getInstance().closeUI(StrongTipsUI)
        UIManager.getInstance().closeUI(SelectTipsUI)
        UIManager.getInstance().closeUI(SelectTipsUI2)
        UIManager.getInstance().closeUI(WaitUI)
        UIManager.getInstance().closeUI(Wait2UI)
        UIManager.getInstance().closeUI(TuoGuanUI)
    }

    public addMsgId(id) {
        var date = new Date()
        var formatTime = Utils.getTimeString(date.getTime())
        this.recentMsgList.push({ "id:": id, "time:": formatTime + ":" + date.getMilliseconds() })
        if (this.recentMsgList.length > 100)
            this.recentMsgList.shift()
    }


    onErrorHandler(file, line, msg, error, withOutOpenId = false) {
        // if (error.indexOf("cocos2d-jsb.js:14548") >= 0 || error.indexOf("cocos2d-jsb.js:12160") >= 0 || error.indexOf("cocos2d-jsb.js:14549") >= 0)
        //     return
        // if (msg.indexOf("not a function") >= 0 || msg.indexOf("Cannot read property 'getContentSize' of null") >= 0 || msg.indexOf("updateParent") >= 0)
        //     return

        if (GameDataManager.getInstance().systemData.errorMap.get(msg))
            return
        var errorTime = GameDataManager.getInstance().systemData.errorRefreshTime
        GameDataManager.getInstance().systemData.errorMap.set(msg, errorTime)
        var guid = GameDataManager.getInstance().userInfoData.userId
        let info = cc.sys.localStorage.getItem("loginInfo");
        var openId = null
        if (!info || info == undefined)
            openId = ""
        else {
            var value = JSON.parse(info);
            openId = value.open
        }
        var phone_type = ""
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            phone_type = "Android"
        } else if (cc.sys.os == cc.sys.OS_IOS) {
            phone_type = "Ios"
        } else {
            phone_type = "H5"
        }
        var para = { guid: guid, content: JSON.stringify({ errorMsg: msg, errorLocation: error, openId: openId, phoneInfo: GameConstValue.ConstValue.PHONE_INFO, phoneType: phone_type, package: GameConstValue.ConstValue.PACKAGE_NAME, version: GameConstValue.ConstValue.VERSION }) }
        HttpManager.getInstance().post(GameConstValue.ConstValue.ERROR_REPORT_URL, "", null, JSON.stringify(para), null);
    }


    public importWxInfo(code) {
        GameDataManager.getInstance().userInfoData.loginCode = code
        LogWrap.log("code>>>>", code)
        if (GameDataManager.getInstance().userInfoData.online) {
            MessageManager.getInstance().messageSend(Proto.CS_RequestBindWx.MsgID.ID, { code: code });
            GameDataManager.getInstance().userInfoData.loginCode = ""
        }
    }

    onWebShareRec(sid, msg) {
        var data = JSON.parse(msg)
        if (data.code != 1)
            return
        var oMsg = data.data.params
        if (oMsg.type == "joinroom") {
            let surefun = () => {
                MessageManager.getInstance().messageSend(Proto.CS_JoinRoom.MsgID.ID, { tableId: oMsg.room, });
            };
            let closefun = () => {

            };
            this.openSelectTipsUI("玩家" + oMsg.nickname + "邀请您加入游戏", surefun, closefun);
        }
        else if (oMsg.type == "joinclub") {
            let surefun = () => {
                MessageManager.getInstance().messageSend(Proto.C2S_CLUB_OP_REQ.MsgID.ID, { op: 10, sid: sid, });
            };
            let closefun = () => {

            };
            this.openSelectTipsUI("玩家" + oMsg.nickname + "邀请您加入亲友群", surefun, closefun);
        }
    }

    // 游戏维护中
    public onGameWeiHu() {
        if (!UIManager.getInstance().getUI(LoginUI)) {
            UIManager.getInstance().closeAllExceptOpenUI(LoginUI)
            UIManager.getInstance().openUI(LoginUI, 0)
        }
    }


    public closeSocket() {
        //关闭心跳
        //关闭网络
        SocketManager.getInstance().clientClose();
        GameDataManager.getInstance().userInfoData.online = false;
        GameDataManager.getInstance().systemData.isHeartOpen = false;
    }



    //关闭等待UI
    public closeWaitUI() {
        UIManager.getInstance().closeUI(WaitUI);
    }

    //使用弱提示
    public openWeakTipsUI(tips: string) {
        LogWrap.log("弱提示................................")
        UIManager.getInstance().openUI(WeakTipsUI, 100, () => {
            UIManager.getInstance().getUI(WeakTipsUI).getComponent("WeakTipsUI").initUI(tips);
        });
    }

    //使用强提示
    public openStrongTipsUI(tips: string, surefunc: Function, title = "提 示") {
        LogWrap.log("提示................................")
        UIManager.getInstance().openUI(StrongTipsUI, 50, () => {
            UIManager.getInstance().getUI(StrongTipsUI).getComponent("StrongTipsUI").initUI(tips, surefunc, title);
        });
    }

    //使用选择提示 大提示框
    public openSelectTipsUI2(tips: string, surefunc: Function, cancelfunc: Function) {
        UIManager.getInstance().openUI(SelectTipsUI, 99, () => {
            UIManager.getInstance().getUI(SelectTipsUI).getComponent("SelectTipsUI").initUI(tips, surefunc, cancelfunc);
        });
    }

    //使用选择提示 小提示框
    public openSelectTipsUI(tips: string, surefunc: Function, cancelfunc: Function) {
        UIManager.getInstance().openUI(SelectTipsUI2, 99, () => {
            UIManager.getInstance().getUI(SelectTipsUI2).getComponent("SelectTipsUI2").initUI(tips, surefunc, cancelfunc);
        });
    }

    //改变音乐
    public changeMusic() {
        var musictype = cc.sys.localStorage.getItem("musicType");
        if (musictype == 0)
            AudioManager.getInstance().playBGM("music_qr");
        else if (musictype == 1)
            AudioManager.getInstance().playBGM("music_jq");
        else {
            AudioManager.getInstance().playBGM("music_hk");

            if (musictype != 2)
                cc.sys.localStorage.setItem("musicType", 2);
        }

    }

    public changeShakeOpen(isShake) {
        console.log("震动是否打开", isShake);
    }

}