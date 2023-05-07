export class ListenerType {
    //连接成功失败
    public static readonly OnSocketConnectFinish = 30001;
    public static readonly OnSocketConnectFail = 30002;
    public static readonly OnSocketReceive = 30003;

    // 滚动公告
    public static readonly noticeChanged = 30004;
    //改变用户资产
    public static readonly GoldChanged = 30005;
    public static readonly DiamondChanged = 30006;
    public static readonly RoomCardsChanged = 30007;

    //背景切换
    public static readonly gameBgChange = 30008;
    //牌背切换
    public static readonly cardBgChange = 30009;
    //邮件
    public static readonly mailSelect = 30010;
    public static readonly mailChange = 30011;
    public static readonly mailAccessoryChange = 30012;
    //规则界面消耗改变
    public static readonly ruleCostChanged = 30013;
    //已经是最新版本
    public static readonly newVersionChange = 30014;
    //已经是最新版本
    public static readonly sizeChange = 30015;

    public static readonly clubBgChange = 30016;

    // 联盟资产更新
    public static readonly PlayerScoreChanged = 30017;
    public static readonly CommissionScoreChanged = 30018;
    public static readonly ClubRoomCardsChanged = 30019;
    
    public static readonly messageWaiting = 30020;
    public static readonly messageStatusChanged = 30021;


    //亲友群消息
    public static readonly clubSelectShowChanged = 30116;
    public static readonly clubSelectClubChanged = 30117;
    public static readonly clubEnterChanged = 30118
    public static readonly clubFastListChanged = 30119;
    public static readonly clubPowerChanged = 30120
    public static readonly clubRoomListChanged = 30121;
    public static readonly clubPlayerNumChanged =30123;
    public static readonly clubRoomChanged = 30124
    public static readonly clubFastRoomChanged= 30126

    //红点更新
    public static readonly reddotCountChanged = 30127
    
    //倒计时
    public static readonly operateTimeChange = 30128

    //gps
    public static readonly updateLocation = 30129

    public static readonly clubFastGameListChanged= 30130

    public static readonly clubGameSelectChanged = 30131
    public static readonly clubTemplateSelectChanged = 30132

    // 托管
    public static readonly tuoGuanOver= 30133
    
    // 桌子批量刷新
    public static readonly clubRoomUpdateByNewSync= 30134

    // 返回大厅或者圈
    public static readonly returnClubFromGame= 30135
    // 返回房间
    public static readonly returnHallStatusChanged= 30136
    //游戏玩法置顶
    public static readonly clubGameTop = 30137

    //跑的快的消息  
     public static readonly pdk_playerNumChanged = 33001;
     public static readonly pdk_playerStateChanged = 33002;
     public static readonly pdk_playerScoreChanged = 33003;
     public static readonly pdk_ownerChanged = 33004;
     public static readonly pdk_curRoundChange = 33005;
     public static readonly pdk_dealerChanged = 33006;
     public static readonly pdk_curOperateChange = 33007;
     public static readonly pdk_gameState = 33008;
     public static readonly pdk_handCardChanged = 33009;
     public static readonly pdk_outCardChanged = 33010;
     public static readonly pdk_outCard = 33011;
     public static readonly pdk_getCard = 33012;
     public static readonly pdk_animationPlay = 33013;
     public static readonly pdk_start = 33014;
     public static readonly pdk_gameRoundOver = 33015;
     public static readonly pdk_gameOver = 33016;
     public static readonly pdk_dismissResponse = 33017;
     public static readonly pdk_selectOutMjNull = 33020
     public static readonly pdk_curTipsCardsChanged = 33021
     public static readonly pdk_voice = 33022
     
     
    // 斗地主消息
    public static readonly ddz_gameState = 33023;
    public static readonly ddz_voice = 33024
    public static readonly ddz_gameRoundOver = 33025
    public static readonly ddz_gameOver = 33026
    public static readonly ddz_callLandlordRoundChange = 33028
    public static readonly ddz_animationPlay=33027
    public static readonly ddz_multipleChange = 33029
    public static readonly ddz_baseScoreChange = 33030
    public static readonly ddz_landLordOver = 33031
    public static readonly ddz_callLandlordInfoChange = 33032
    public static readonly ddz_landlordCardsChange = 33033
    public static readonly ddz_landlordIdChange = 33034
    public static readonly ddz_landlordVoice = 33035

    public static readonly pdk_onTrusteeChanged = 33036
    public static readonly operateNoBigCard  = 33037

    
    //mj的通用消息
    public static readonly mj_playerNumChanged = 34001;
    public static readonly mj_playerStateChanged = 34002;
    public static readonly mj_playerScoreChanged = 34003;
    public static readonly mj_playedTing = 34004;
    public static readonly mj_ownerChanged = 34005;
    public static readonly mj_curRoundChange = 34006;
    public static readonly mj_curOverPlusChange = 34007;
    public static readonly mj_dealerChanged = 34008;
    public static readonly mj_curOperateChange = 34009;
    public static readonly mj_curMjSelectChanged = 34010;
    public static readonly mj_gameState = 34011;
    public static readonly mj_handMjChanged = 34012;
    public static readonly mj_outMjChanged = 34013;
    public static readonly mj_pgChanged = 34014;
    public static readonly mj_outMj = 34015;
    public static readonly mj_getMj = 34016;
    public static readonly mj_animationPlay = 34017;
    public static readonly mj_removeMark = 34018;
    public static readonly mj_selectOutMjNull = 34019;
    public static readonly mj_start = 34020;
    public static readonly mj_PGHTipsRec = 34021;
    public static readonly mj_gameRoundOver = 34022;
    public static readonly mj_gameOver = 34023;
    public static readonly mj_dismissResponse = 34024;
    public static readonly mj_huPaiNumChanged = 34025
    public static readonly mj_huPaiTipsRec = 34026
    public static readonly mj_tingPaiTipsRec = 34027
    public static readonly mj_huPaiTipsDisPlay = 34028
    public static readonly mj_VoteResponse = 34029
    public static readonly mj_onTrusteeChanged = 34030
    public static readonly mj_onGuoActionRec = 34031


    //捉鸡消息
    public static readonly mjzj_chickAction = 34100
    public static readonly mjzj_menChanged = 34101
    public static readonly mjzj_playedMen = 34104;
    public static readonly mjzj_guMaiScoreChange = 34105;
    public static readonly mjzj_onMyGuMai = 34106;
    
    // 血战麻将消息
    public static readonly mjxz_hpStatusChanged = 34200
    public static readonly mjxz_recHpResult= 34201
    public static readonly mjxz_dqStatusChanged = 34202;
    public static readonly mjxz_recDqResult = 34203;
    public static readonly mjxz_recHuInfo = 34204;
    public static readonly mjxz_piaoStatusChanged = 34205;
    public static readonly mjxz_recPiaoResult = 34206;
    public static readonly mjxz_BaotingStatusChanged = 34207;
    public static readonly mjxz_recBaoTingResult = 34208;

    // zjh消息
    public static readonly zjh_start = 34301
    public static readonly zjh_playerStateChanged = 34302
    public static readonly zjh_playerNumChanged = 34303
    public static readonly zjh_ownerChanged = 34304
    public static readonly zjh_curRoundChange = 34305
    public static readonly zjh_LunChanged = 34306
    public static readonly zjh_curOperateChange = 34307
    public static readonly zjh_gameState = 34308
    public static readonly zjh_dealerChanged = 34309
    public static readonly zjh_playerAllUseScoreChanged = 34310
    public static readonly zjh_handCardChanged = 34311
    public static readonly zjh_playerScoreChanged = 34312
    public static readonly zjh_dismissResponse = 34313
    public static readonly zjh_putChipsToTable = 34314
    public static readonly zjh_cardStateChanged = 34315
    public static readonly zjh_allScoreChanged = 34316
    public static readonly zjh_baseScoreChanged = 34317
    public static readonly zjh_biPaiAction = 34318
    public static readonly zjh_voice = 34319
    public static readonly zjh_gameRoundOver = 34320
    public static readonly zjh_allInAction = 34321
    public static readonly zjh_onStatusChanged = 34322
    
     // nn消息
     public static readonly nn_start = 34401
     public static readonly nn_playerStateChanged = 34402
     public static readonly nn_playerNumChanged = 34403
     public static readonly nn_ownerChanged = 34404
     public static readonly nn_curRoundChange = 34405
     public static readonly nn_gameState = 34408
     public static readonly nn_dealerChanged = 34409
     public static readonly nn_playerAllUseScoreChanged = 34410
     public static readonly nn_handCardChanged = 34411
     public static readonly nn_playerScoreChanged = 34412
     public static readonly nn_dismissResponse = 34413
     public static readonly nn_voice = 34419
     public static readonly nn_gameRoundOver = 34420
     public static readonly nn_playerRobBankerTimesChanged = 34421
     public static readonly nn_handCardTypeChanged = 34422
     public static readonly nn_onCallBankerEnd = 34423
     public static readonly nn_onStatusChanged = 34424

    //长牌的通用消息
    public static readonly cp_playerNumChanged = 34501;
    public static readonly cp_playerStateChanged = 34502;
    public static readonly cp_playerScoreChanged = 34503;
    public static readonly cp_playedTing = 34504;
    public static readonly cp_ownerChanged = 34505;
    public static readonly cp_curRoundChange = 34506;
    public static readonly cp_curOverPlusChange = 34507;
    public static readonly cp_dealerChanged = 34508;
    public static readonly cp_curOperateChange = 34509;
    public static readonly cp_curCpSelectChanged = 34510;
    public static readonly cp_gameState = 34511;
    public static readonly cp_handCpChanged = 34512;
    public static readonly cp_outCpChanged = 34513;
    public static readonly cp_pgChanged = 34514;
    public static readonly cp_outcp = 34515;
    public static readonly cp_getcp = 34516;
    public static readonly cp_animationPlay = 34517;
    public static readonly cp_removeMark = 34518;
    public static readonly cp_selectOutCpNull = 34519;
    public static readonly cp_start = 34520;
    public static readonly cp_PGHTipsRec = 34521;
    public static readonly cp_gameRoundOver = 34522;
    public static readonly cp_gameOver = 34523;
    public static readonly cp_dismissResponse = 34524;
    public static readonly cp_huPaiNumChanged = 34525
    public static readonly cp_tingPaiTipsRec = 34527
    public static readonly cp_huPaiTipsDisPlay = 34528
    public static readonly cp_VoteResponse = 34529
    public static readonly cp_onTrusteeChanged = 34530
    public static readonly cp_recHuInfo = 34532
    public static readonly cp_opencp = 34533
    public static readonly cp_play_toujia_ani = 34534
    public static readonly cp_tuosInfo = 34535
    public static readonly cp_round_over_hz = 34536
    public static readonly cp_BaotingStatusChanged = 34537;
    public static readonly cp_recBaoTingResult = 34538;
}