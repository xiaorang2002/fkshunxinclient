import { fail } from "assert";
import { LogWrap } from "../../framework/Utils/LogWrap";

/*
 * @Description: In User Settings Edit
 * @Author: your name
 * @Date: 2019-04-09 11:04:45
 * @LastEditTime: 2019-08-10 10:29:29
 * @LastEditors: Please set LastEditors
 */
export enum LOGIN_TYPE {
    LOGIN_DEBUG = 0,  //调试模式
    LOGIN_PRE,        //预发布
    LOGIN_RELEASE,    //正式模式
}

export enum MONEY_TYPE {
    GOLD = 0,
    ROOMCARD,
    DIAMOND,
}

export enum GAME_TYPE {
    MHXL = 100,
    LFMJ = 110,
    XZMJ = 200,
    FR2F = 201,
    SR2F = 202,
    TR3F = 203,
    TR2F = 204,
    TR1F = 205,
    LRPDK = 210,
    PDK = 211,
    SCPDK = 212,
    DDZ = 220,
    YJMJ = 230,
    ZJH = 300,
    NN = 310,
    ZGCP = 350,
    ZGMJ = 260,
}

export var GAME_NAME = {
    100: "闷胡血流",
    110: "两房麻将",
    200: "血战麻将",
    201: "四人两房",
    202: "三人两房",
    203: "二人三房",
    204: "二人两房",
    205: "二人一房",
    210: "二人跑得快",
    211: "跑得快",
    212: "四川跑得快",
    220: "斗地主",
    230: "幺鸡麻将",
    240: "红中麻将",
    250: "咪牌点子牛牛",
    300: "三张牌",
    310: "拼十",
    350: "自贡长牌",
    260: "自贡麻将",
}



export enum MJ_ACTION {
    SESSION_ID = -1,
    ACTION_NIL = 0,
    ACTION_TRUSTEE = 0x1,
    ACTION_PENG = 0x2,
    ACTION_AN_GANG = 0x4,
    ACTION_MING_GANG = 0x8,
    ACTION_BA_GANG = 0x10,
    ACTION_HU = 0x20,
    ACTION_PASS = 0x40,
    ACTION_LEFT_CHI = 0x80,
    ACTION_MID_CHI = 0x100,
    ACTION_RIGHT_CHI = 0x200,
    ACTION_TING = 0x400,
    ACTION_JIA_BEI = 0x800,
    ACTION_CHU_PAI = 0x1000,
    ACTION_ZI_MO = 0x2000,
    ACTION_MEN = 0X4000,
    ACTION_MO_PAI = 0x8000,
    ACTION_MEN_ZI_MO = 0x10000,
    ACTION_FREE_BA_GANG = 0x20000,
    ACTION_FREE_AN_GANG = 0X40000,
    ACTION_QIANG_GANG_HU = 0x200000,
    ACTION_GANG_HUAN_PAI = 0x400000,
    ACTION_RUAN_AN_GANG = 0x800000,
    ACTION_RUAN_MING_GANG = 0x1000000,
    ACTION_RUAN_BA_GANG = 0x2000000,
    ACTION_RUAN_PENG = 0x4000000,
}

export enum CP_ACTION {
    SESSION_ID = -1,
    ACTION_NIL = 0,
    ACTION_TRUSTEE = 0x1,
    ACTION_PENG = 0x2,
    ACTION_TOU = 0x4,
    ACTION_MING_GANG = 0x8,
    ACTION_BA_GANG = 0x10,
    ACTION_HU = 0x20,
    ACTION_PASS = 0x40,
    ACTION_CHI = 0x80,
    ACTION_MID_CHI = 0x100,
    ACTION_RIGHT_CHI = 0x200,
    ACTION_TING = 0x400,
    ACTION_TIAN_HU = 0x800,
    ACTION_CHU_PAI = 0x1000,
    ACTION_ZI_MO = 0x2000,
    ACTION_MEN = 0X4000,
    ACTION_MO_PAI = 0x8000,
    ACTION_MEN_ZI_MO = 0x10000,
    ACTION_FREE_BA_GANG = 0x20000,
    ACTION_FREE_AN_GANG = 0X40000,
    ACTION_QIANG_GANG_HU = 0x200000,
    ACTION_GANG_HUAN_PAI = 0x400000,
    ACTION_RUAN_AN_GANG = 0x800000,
    ACTION_RUAN_MING_GANG = 0x1000000,
    ACTION_RUAN_BA_GANG = 0x2000000,
    ACTION_RUAN_PENG = 0x4000000,
}

export enum THIRD_TYPE {
    WX = 1,
}

export enum REDDOT_TYPE {
    MAIL = 1001,
}


export class ConstValue {

    //登录方式
    public static LOGIN_MODE: LOGIN_TYPE = LOGIN_TYPE.LOGIN_RELEASE;
    //在release环境下测试
    public static readonly RELEASE_TEST: boolean = false
    //在debug环境下微信登录
    public static readonly DEBUG_WX: boolean = false
    //是否自己选择服务器ip
    public static readonly SELECT_IP: boolean = false
    //是否是新版本
    public static readonly NEW_VERSION: boolean = false

    public static readonly SCREEN_W: number = 1366

    public static NET_IP: string = ""
    public static NET_ADDRESS: string = ""
    public static PHONE_INFO: string = ""
    public static readonly AESkey: string = "98wtqWhcMdFcDFGZ/uZ1YU2zAZE3kLpG"
    //--------------------------------------------------------------------老包-------------------------------------------------------------------/
    //  private static readonly WX_APPID = {
    //     "Android":{
    //         "appid":"wx807df7b5c1746fa0",
    //         "secret":"dc90c270a6963c2a35547e6bcfcc152a"
    //     },
    //     "iOS":{
    //         "appid":"wx807df7b5c1746fa0",
    //         "secret":"dc90c270a6963c2a35547e6bcfcc152a"
    //     }
    // }
    // private static readonly BAO_MING = {
    //     "Android":"dymj",
    //     "iOS":"dymj"
    // }

    // //0-调试模式 1-预发布 2-正式模式
    // public static readonly HOTFIX_DYMJ = [
    //     "/hotfix_dymj/config.json",
    //     "/hotfix_dymj/config.json",
    //     "/hotfix_dymj/config.json"
    // ]

    // public static readonly CONFIG_URL_ARR = [
    //     ["https://dymjtest.oss-cn-hongkong.aliyuncs.com"],
    //     ["https://dymjpre.oss-cn-hongkong.aliyuncs.com"],
    //     ["https://dymjpass.oss-cn-hongkong.aliyuncs.com"]
    // ]

    // public static readonly HOT_UPDATE_URL_ARR = [
    //     "https://dymjtest.oss-accelerate.aliyuncs.com/hotfix_dymj/",
    //     "https://dymjpre.oss-accelerate.aliyuncs.com/hotfix_dymj/",
    //     "https://dymjupdate.oss-cn-shenzhen.aliyuncs.com/hotfix_dymj/",
    // ]

    //-------------------------------------------------------------------------老包end------------------------------------------------------------------------/

    //--------------------------------------------------------------------------新包--------------------------------------------------------------------------/
    private static readonly WX_APPID = ConstValue.NEW_VERSION ?
        {
            "Android": {
                "appid": "wx83d078ca4927fc0e",
                "secret": "c8c427cfe94e9bdea804e51c456f39ee"
            },
            "iOS": {
                "appid": "wx48a8b9e950b21592",
                "secret": "d333d14f81180f5286d62ce25757493b"
            }
        }
        :
        {
            "Android": {
                "appid": "wx807df7b5c1746fa0",
                "secret": "dc90c270a6963c2a35547e6bcfcc152a"
            },
            "iOS": {
                "appid": "wx807df7b5c1746fa0",
                "secret": "dc90c270a6963c2a35547e6bcfcc152a"
            }
        }
    private static readonly BAO_MING = ConstValue.NEW_VERSION ?
        {
            "Android": "sxnew",
            "iOS": "sxnew"
        }
        :
        {
            "Android": "dymj",
            "iOS": "dymj"
        }

    //0-调试模式 1-预发布 2-正式模式
    public static readonly HOTFIX_DYMJ = ConstValue.NEW_VERSION ?
        [
            "/hotfix_dymj/config.json",
            "/hotfix_dymj/config.json",
            "/hotfix-dymj/config.json"
        ]
        :
        [
            "/hotfix_dymj/config.json",
            "/hotfix_dymj/config.json",
            "/hotfix_dymj/config.json"
        ]

    public static readonly CONFIG_URL_ARR = ConstValue.NEW_VERSION ?
        [
            ["https://dymjtest.oss-cn-hongkong.aliyuncs.com"],
            ["https://dymjpre.oss-cn-hongkong.aliyuncs.com"],
            ["https://dymjdeploy.oss-cn-hongkong.aliyuncs.com", "https://shunxin.blob.core.windows.net", "https://dymjdeploy.clqvq.com"]
        ]
        :
        [
            ["https://dymjtest.oss-cn-hongkong.aliyuncs.com"],
            ["https://dymjpre.oss-cn-hongkong.aliyuncs.com"],
            ["https://dymjpass.oss-cn-hongkong.aliyuncs.com"]
        ]

    public static readonly HOT_UPDATE_URL_ARR = ConstValue.NEW_VERSION ?
        [
            "https://dymjtest.oss-accelerate.aliyuncs.com/hotfix_dymj/new/",
            "https://dymjpre.oss-accelerate.aliyuncs.com/hotfix_dymj/new/",
            "https://dymjupdate.oss-cn-shenzhen.aliyuncs.com/hotfix_dymj/new/",
        ]
        :
        [
            "https://dymjtest.oss-accelerate.aliyuncs.com/hotfix_dymj/",
            "https://dymjpre.oss-accelerate.aliyuncs.com/hotfix_dymj/",
            "https://dymjupdate.oss-cn-shenzhen.aliyuncs.com/hotfix_dymj/",
        ]

    //------------------------------------------------------------------------------新包end-----------------------------------------------------------------------/


    public static readonly COMMON_URL_ARR = [
        "http://192.168.2.50:8877",
        "https://csapi.irqwk.com",
        "https://api.gwjgu.com"
    ]

    public static readonly IP_ARR = [
        // ['ws://csws.irqwk.com:8100'],
        ['ws://192.168.2.35:6100'],
        ["ws.zamyq.com:8100"],
        ["sxws.awoeo.com:8100", "103.39.231.249:8100", "103.39.231.102:8200"]
    ]

    public static readonly VERSION_NAME_ARR = [
        "测试",
        "预发布",
        "正式"
    ]


    public static readonly VERSION_ARR = [
        "1.0.35",
        "1.0.100",
        "1.0.84"
    ]


    public static OS = cc.sys.os == cc.sys.OS_IOS ? "iOS" : "Android"

    //游戏版本
    public static readonly VERSION = ConstValue.VERSION_ARR[ConstValue.LOGIN_MODE]
    public static readonly VERSION_NAME = ConstValue.VERSION_NAME_ARR[ConstValue.LOGIN_MODE]
    //微信appid，secret 
    public static WX_APP_ID = ConstValue.WX_APPID[ConstValue.OS]["appid"]
    public static WX_APP_SECRET = ConstValue.WX_APPID[ConstValue.OS]["secret"]
    public static PACKAGE_NAME = ConstValue.BAO_MING[ConstValue.OS]

    //ui目录
    public static readonly UI_DIR = "ui_prefab/";
    public static readonly UI_RULE_DIR = "ui_prefab/rule_ui/";
    public static readonly UI_KD_DIR = "ui_prefab/kd_ui/";
    public static readonly UI_HALL_DIR = "ui_prefab/hall_ui/";
    public static readonly UI_MAIL_DIR = "ui_prefab/mail_ui/";
    public static readonly UI_SYSTEM_DIR = "ui_prefab/system_ui/";
    public static readonly UI_CLUB_DIR = "ui_prefab/club_ui/";
    public static readonly UI_GOLDDDZ_DIR = "ui_prefab/match_ui/";
    public static readonly UI_PDK_DIR = "ui_prefab/pdk_ui/";
    public static readonly UI_MJ_DIR = "ui_prefab/mj_ui/";
    public static readonly UI_UNION = "ui_prefab/union_ui/";
    public static readonly UI_ZJH_DIR = "ui_prefab/zjh_ui/";
    public static readonly UI_NN_DIR = "ui_prefab/nn_ui/";
    public static readonly UI_CP_DIR = "ui_prefab/cp_ui/";

    //声音目录
    public static readonly AUDIO_DIR = "audio/";

    public static hotfixUrl = ""    // 下载地址前缀
    public static backstageUrl = ""   // 后台地址前缀
    public static replaceUrl = ""   // 后台地址前缀
    public static regionlist = [];  //白名单地址
    public static shareUrl = ""

    //拉取配置地主
    //public static CONFIG_URL  = ConstValue.LOGIN_MODE ==   LOGIN_TYPE.LOGIN_DEBUG?"https://dymjtest.oss-cn-hongkong.aliyuncs.com/hotfix_dymj/config.json": "https://updatedymj.oss-cn-hongkong.aliyuncs.com/hotfix_dymj/config.json" //对方的线上配置
    public static CONFIG_URL = ConstValue.CONFIG_URL_ARR[ConstValue.LOGIN_MODE][0] + ConstValue.HOTFIX_DYMJ[ConstValue.LOGIN_MODE]
    //热更新地址
    public static HOT_UPDATE_URL = ConstValue.HOT_UPDATE_URL_ARR[ConstValue.LOGIN_MODE]
    // 战绩大局查询地址
    public static RECORD_ALL_QUERY_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/log/GetMemberRound";

    public static QUERY_TEAM_RECORD_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/log/GetTeamRound";
    // 战绩查询地址
    public static RECORD_QUERY_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/log/GetGameDetail";
    // 用于分享链接的url
    public static SHARE_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/share"
    // 用于请求分享参数的url
    public static SHARE_RESULT_REP = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/share/shareParams"
    // 带分享参数安装的url
    public static SHARE_INSTALL_REP = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/share/traceParams"
    // 二维码分享
    public static QR_SHARE_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/share/qrcodelink"
    // 反馈提交url
    public static FEED_BACK_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/feedback/submit";
    // 经营分析合伙
    public static PARTNER_ANALYSIS_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/log/partnerDailyStatistics"
    // 普通玩家
    public static PLAYER_ANALYSIS_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/log/playerDailyStatistics"
    // 统计-业绩
    public static PLAYER_DALIY_COMMISSION_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/statistics/daily_commission"
    // 统计-输赢
    public static PLAYER_DAILY_WIN_LOSE_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/statistics/playerDailyWinlose"
    // 统计-局数
    public static PLAYER_DAILY_PLAY_COUNT_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/statistics/playerDailyPlayCount"
    // 统计-贡献
    public static TEAM_MEMBER_DAIL_CONTRIBUTE_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/statistics/teamMemberDailyContribute"
    //统计-房卡消耗
    public static DAILY_ROOM_CARD_COST_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/gather/GetDailyCardDeplete"
    //日志-业绩
    public static LOG_PLAYER_COMISSION_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/log/GetMemberCommission"
    // 日志-贡献t
    public static LOG_TEAM_MEMBER_CONTRIBUTE_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/log/GetMemberContribute"
    // 日志-积分 
    public static PLAYER_SCORE_RECORD_QUERY_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/log/GetMemberVary";
    // 日志-上下分记录
    public static PLAYER_OP_SCORE_RECORD_QUERY_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/log/GetMemberOrders";
    // 群统计  
    public static CLUB_DAILY_RECORD = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/gather/GetTeamMemberDaily"
    // 客户端报错提交url
    public static ERROR_REPORT_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "api/bug/submit"
    // 进退群记录
    public static CLUB_MEMBER_CHANGE_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/log/GetClubMessage"
    // 新版战绩统计-成员
    public static NEW_MEMBER_RECORD_STATISTICS_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/gather/GetClubMemberGame"
    // 新版战绩统计-组长
    public static NEW_MEMBER_RECORD_STATISTICS_PARTNER_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/gather/GetTeamMemberGame"
    // 新版联盟统计-成员
    public static NEW_UNION_STATISTICS_MEMBER_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/gather/GetClubCommissionPaied"
    // 新版联盟统计-团队
    public static NEW_UNION_STATISTICS_PARTNER_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/gather/GetClubCommissionIncome"
    // 新版联盟统计-团队
    public static NEW_UNION_CONTRIBUTE_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/log/GetMemberContribute"
    // 查伙牌
    public static HUO_PAI_CHEAT_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/gather/GetAntiCheat"

    // 服务器地址
    //public static readonly SEVER_IP = "ws://192.168.2.215:6100"    
    public static readonly SEVER_IP = ConstValue.IP_ARR[ConstValue.LOGIN_MODE][0]

    public static readonly MESSAGE_WAIT_TIME = 3;
    //心跳频率 间隔多少时间一次
    public static readonly HEART_TIME = 10;
    //断线检测
    public static readonly BREAK_LINE_TIME = 30;
    //重连尝试次数
    public static RECONNECT_TIMES = 5;
    // 查询战绩最大天数
    public static readonly MAX_CLUB_RECORD_DATE = 7;
    // 最大人数限制 当俱乐部人数低于此值时普通成员要显示全部按钮
    public static MAX_CLUB_PLAYER_LIMIT = 5000;

    public static readonly MHXL_PLAYER_NUM_LIST = [4, 3, 2]
    public static readonly LFMJ_PLAYER_NUM_LIST = [3, 2]
    public static readonly ZGMJ_PLAYER_NUM_LIST = [2, 3]
    public static readonly ZGCP_PLAYER_NUM_LIST = [3, 2]

    public static initByConfig() {
        //ConstValue.backstageUrl = "http://192.168.2.50:8878"  //213  50
        //老包
        //ConstValue.HOT_UPDATE_URL = ConstValue.hotfixUrl + "/hotfix_dymj/";
        //新包
        ConstValue.HOT_UPDATE_URL = ConstValue.hotfixUrl + (ConstValue.NEW_VERSION ? "/hotfix_dymj/new/":"/hotfix_dymj/");
        ConstValue.RECORD_QUERY_URL = ConstValue.backstageUrl + "/api/log/GetGameDetail";
        ConstValue.RECORD_ALL_QUERY_URL = ConstValue.backstageUrl + "/api/log/GetMemberRound";
        ConstValue.QUERY_TEAM_RECORD_URL = ConstValue.backstageUrl + "/api/log/GetTeamRound";
        ConstValue.SHARE_URL = ConstValue.backstageUrl + "/api/share"
        ConstValue.SHARE_RESULT_REP = ConstValue.backstageUrl + "/api/share/shareParams"
        ConstValue.SHARE_INSTALL_REP = ConstValue.backstageUrl + "/api/share/traceParams"
        ConstValue.QR_SHARE_URL = ConstValue.backstageUrl + "/api/share/qrcodelink"
        ConstValue.FEED_BACK_URL = ConstValue.backstageUrl + "/api/feedback/submit";
        ConstValue.PARTNER_ANALYSIS_URL = ConstValue.backstageUrl + "/api/log/partnerDailyStatistics";
        ConstValue.PLAYER_ANALYSIS_URL = ConstValue.backstageUrl + "/api/log/playerDailyStatistics";

        ConstValue.PLAYER_DALIY_COMMISSION_URL = ConstValue.backstageUrl + "/api/statistics/daily_commission";
        ConstValue.PLAYER_DAILY_WIN_LOSE_URL = ConstValue.backstageUrl + "/api/statistics/playerDailyWinlose";
        ConstValue.PLAYER_DAILY_PLAY_COUNT_URL = ConstValue.backstageUrl + "/api/statistics/playerDailyPlayCount";
        ConstValue.TEAM_MEMBER_DAIL_CONTRIBUTE_URL = ConstValue.backstageUrl + "/api/statistics/teamMemberDailyContribute";
        ConstValue.DAILY_ROOM_CARD_COST_URL = ConstValue.backstageUrl + "/api/gather/GetDailyCardDeplete";
        ConstValue.CLUB_DAILY_RECORD = ConstValue.backstageUrl + "/api/gather/GetTeamMemberDaily";

        ConstValue.LOG_PLAYER_COMISSION_URL = ConstValue.backstageUrl + "/api/log/GetMemberCommission";
        ConstValue.LOG_TEAM_MEMBER_CONTRIBUTE_URL = ConstValue.backstageUrl + "/api/log/GetMemberContribute";
        ConstValue.PLAYER_SCORE_RECORD_QUERY_URL = ConstValue.backstageUrl + "/api/log/GetMemberVary";
        ConstValue.PLAYER_OP_SCORE_RECORD_QUERY_URL = ConstValue.backstageUrl + "/api/log/GetMemberOrders";
        ConstValue.ERROR_REPORT_URL = ConstValue.backstageUrl + "/api/bug/submit"
        ConstValue.CLUB_MEMBER_CHANGE_URL = ConstValue.backstageUrl + "/api/log/GetClubMessage";
        ConstValue.NEW_MEMBER_RECORD_STATISTICS_URL = ConstValue.backstageUrl + "/api/gather/GetClubMemberGame"
        ConstValue.NEW_MEMBER_RECORD_STATISTICS_PARTNER_URL = ConstValue.backstageUrl + "/api/gather/GetTeamMemberGame"
        ConstValue.NEW_UNION_STATISTICS_MEMBER_URL = ConstValue.backstageUrl + "/api/gather/GetClubCommissionPaied"
        ConstValue.NEW_UNION_STATISTICS_PARTNER_URL = ConstValue.backstageUrl + "/api/gather/GetClubCommissionIncome"
        ConstValue.NEW_UNION_CONTRIBUTE_URL = ConstValue.backstageUrl + "/api/log/GetMemberContribute"
        ConstValue.HUO_PAI_CHEAT_URL = ConstValue.backstageUrl + "/api/gather/GetAntiCheat"
        LogWrap.log("------initByConfig()----ConstValue.backstageUrl:", ConstValue.backstageUrl)
    }
    public static resetConfig() {
        ConstValue.CONFIG_URL = ConstValue.CONFIG_URL_ARR[ConstValue.LOGIN_MODE][0] + ConstValue.HOTFIX_DYMJ[ConstValue.LOGIN_MODE]
        //热更新地址
        ConstValue.HOT_UPDATE_URL = ConstValue.HOT_UPDATE_URL_ARR[ConstValue.LOGIN_MODE]
        // 战绩大局查询地址
        ConstValue.RECORD_ALL_QUERY_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/log/GetMemberRound";
        ConstValue.QUERY_TEAM_RECORD_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/log/GetTeamRound";
        // 战绩查询地址
        ConstValue.RECORD_QUERY_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/log/GetGameDetail";
        // 用于分享链接的url
        ConstValue.SHARE_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/share"
        // 用于请求分享参数的url
        ConstValue.SHARE_RESULT_REP = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/share/shareParams"
        // 带分享参数安装的url
        ConstValue.SHARE_INSTALL_REP = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/share/traceParams"
        // 二维码分享
        ConstValue.QR_SHARE_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/share/qrcodelink"
        // 反馈提交url
        ConstValue.FEED_BACK_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/feedback/submit";
        // 经营分析合伙
        ConstValue.PARTNER_ANALYSIS_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/log/partnerDailyStatistics"
        // 普通玩家
        ConstValue.PLAYER_ANALYSIS_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/log/playerDailyStatistics"
        // 统计-业绩
        ConstValue.PLAYER_DALIY_COMMISSION_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/statistics/daily_commission"
        // 统计-输赢
        ConstValue.PLAYER_DAILY_WIN_LOSE_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/statistics/playerDailyWinlose"
        // 统计-局数
        ConstValue.PLAYER_DAILY_PLAY_COUNT_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/statistics/playerDailyPlayCount"
        // 统计-贡献
        ConstValue.TEAM_MEMBER_DAIL_CONTRIBUTE_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/statistics/teamMemberDailyContribute"
        //统计-房卡消耗
        ConstValue.DAILY_ROOM_CARD_COST_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/gather/GetDailyCardDeplete"
        //日志-业绩
        ConstValue.LOG_PLAYER_COMISSION_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/log/GetMemberCommission"
        // 日志-贡献t
        ConstValue.LOG_TEAM_MEMBER_CONTRIBUTE_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/log/GetMemberContribute"
        // 日志-积分 
        ConstValue.PLAYER_SCORE_RECORD_QUERY_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/log/GetMemberVary";
        // 日志-上下分记录
        ConstValue.PLAYER_OP_SCORE_RECORD_QUERY_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/log/GetMemberOrders";
        // 群统计  
        ConstValue.CLUB_DAILY_RECORD = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/gather/GetTeamMemberDaily"
        // 客户端报错提交url
        ConstValue.ERROR_REPORT_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/bug/submit"
        // 进退群记录
        ConstValue.CLUB_MEMBER_CHANGE_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/log/GetClubMessage"
        // 新版战绩统计-成员
        ConstValue.NEW_MEMBER_RECORD_STATISTICS_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/gather/GetClubMemberGame"
        // 新版战绩统计-组长
        ConstValue.NEW_MEMBER_RECORD_STATISTICS_PARTNER_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/gather/GetTeamMemberGame"
        // 新版联盟统计-成员
        ConstValue.NEW_UNION_STATISTICS_MEMBER_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/gather/GetClubCommissionPaied"
        // 新版联盟统计-团队
        ConstValue.NEW_UNION_STATISTICS_PARTNER_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/gather/GetClubCommissionIncome"
        // 新版联盟统计-团队
        ConstValue.NEW_UNION_CONTRIBUTE_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/log/GetMemberContribute"
        // 查伙牌
        ConstValue.HUO_PAI_CHEAT_URL = ConstValue.COMMON_URL_ARR[ConstValue.LOGIN_MODE] + "/api/gather/GetAntiCheat"
    }
}