export enum GAME_STATE_MJ {
	PER_BEGIN       		= 0,	//预开始
    XI_PAI		    		= 1,    //洗牌 
	CHECK_TING				= 2,	//补花
	WAIT_MO_PAI  			= 4,	//等待 摸牌
	WAIT_CHU_PAI  			= 5,	//等待 出牌
	WAIT_ACTION_AFTER_CHU_PAI	= 6,	//等待 碰 杠 胡 用户出牌的时候
	WAIT_ACTION_AFTER_MO_PAI 	= 7,	//等待 胡 用户巴杠的时候，抢胡
	WAIT_QIANG_GANG_HU			= 8,
	GAME_BALANCE			= 15,	//结算
	GAME_CLOSE				= 16,	//关闭游戏
	HUAN_PAI				= 17,	//换牌
	DING_QUE				= 18,	//定缺
	GU_MAI					= 21,	//估卖
	PIAO_FEN				= 22,	//飘分
	BAO_TING				= 23,	//报听
	GAME_IDLE_HEAD			= 0x1000, //用于客户端播放动画延迟

}


export enum SECTION_TYPE {
	four = 0,
	AnGang = 1,
	MingGang = 2,
	BaGang = 3,
	DuiZi = 4,
	Three = 5,
	Peng = 6,
	Chi = 7,
	LeftChi = 8,
	MidChi = 9,
	RightChi = 10,
	FreeBaGang = 11,
	FreeAnGang = 12,
	RuanAnGang = 13,
	RuanMingGang = 14,
	RuanBaGang = 15,
	RuanPeng = 16,
}

export var HZ_ROUND_OVER_HU_TYPE = {
	1 : "天胡",
	5 : "清一色",
	23 : "胡",
	30 : "自摸",
	42 : "抢杠胡",
	48 : "七对",
	67 : "碰碰胡",
	83 : "点炮胡",
	84 : "黄庄",
	85 : "黄庄",
	89 : "庄闲",
	116 : "无红中",
}

export var ROUND_OVER_HU_TYPE = {
	0 : "未胡",
	1 : "天胡",
	2 : "地胡",
	3 : "人胡",
	4 : "天听",
	5 : "清一色",
	6 : "全花",
	7 : "字一色",
	8 : "妙手回春",
	9 : "海底",
	10 : "杠上花",
	11 : "全求人",
	12 : "双暗杠",
	13 : "双箭刻",
	14 : "混一色",
	15 : "不求人",
	16 : "双明杠",
	17 : "胡绝张",
	18 : "箭刻",
	19 : "门前清",
	20 : "暗杠",
	21 : "中张",
	22 : "四归一",
	23 : "平胡",
	24 : "双暗刻",
	25 : "三暗刻",
	26 : "四暗刻",
	27 : "报听",
	28 : "门风刻",
	29 : "圈风刻",
	30 : "自摸",
	31 : "金钩钓",
	32 : "一般高",
	33 : "老少副",
	34 : "连六",
	35 : "幺九刻",
	36 : "明杠",
	37 : "大三风",
	38 : "小三风",
	39 : "碰碰胡",
	40 : "三杠",
	41 : "全带幺",
	42 : "抢杠胡",
	43 : "花牌",
	44 : "大七星",
	45 : "连七对",
	46 : "三元七对子",
	47 : "四喜七对子",
	48 : "七对",
	49 : "大于五",
	50 : "小于五",
	51 : "大四喜",
	52 : "小四喜",
	53 : "大三元",
	54 : "小三元",
	55 : "九莲宝灯",
	56 : "18罗汉",
	57 : "一色双龙会",
	58 : "一色四同顺",
	59 : "一色四节高",
	60 : "一色四步高",
	61 : "混幺九",
	62 : "一色三节高",
	63 : "一色三同顺",
	64 : "四字刻",
	65 : "清龙",
	66 : "一色三步高",
	67 : "碰碰胡",
	68 : "龙七对",
	69 : "清七对",
	70 : "清龙七对",
	71 : "清大对",
	72 : "清单吊",
	73 : "鸡 牌",
	74 : "翻牌鸡",
	75 : "冲锋鸡",
	76 : "责任鸡",
	77 : "乌骨鸡",
	78 : "摇摆鸡",
	79 : "本 鸡",
	80 : "星期鸡",
	81 : "吹风鸡",
	82 : "补杠",

	83 : "点炮",
	84 : "黄庄",
	85 : "黄庄",
	86 : "闷",
	87 : "自摸闷",
	88 : "连庄", 	//连庄
	89 : "庄",	//庄家
	90 : "硬报",	//天听硬报
	91 : "软报",	//天听软报
	92 : "杀报",
	93 : "红中",
	94 : "冲锋乌骨鸡",	//冲锋乌骨鸡
	95 : "责任乌骨鸡",	//责任乌骨鸡
	96 : "金鸡",
	97 : "金乌骨鸡",
	98 : "冲锋金鸡",
	99 : "冲锋金乌..",
	100 : "责任金鸡",
	101 : "责任金乌骨鸡",
	102 : "杠上炮",
	103 : "将对",
	104 : "将七对",
	105 : "全幺九",
	106 : "四归一",
	107 : "地龙",
	108 : "清地龙",
	109 : "卡二条",
	110 : "夹心五",
	111 : "四对",
	112 : "龙四对",
	113 : "清四对",
	114 : "清龙四对",
	115 : "估卖" ,
	116 : "无鸡",
	117 : "四鸡",
	118 : "软暗杠",
	119 : "软明杠",
	120 : "软补杠",
	121 : "海底炮",
	122 : "一条龙",
	123 : "卡五条",
}

// // 钱log操作类型
// enum LOG_MONEY_OPT_TYPE {
// 	LOG_MONEY_OPT_TYPE_NIL  = 0;
// 	LOG_MONEY_OPT_TYPE_BUY_ITEM = 1;						// 购买物品花钱
// 	LOG_MONEY_OPT_TYPE_BOX = 2;								// 开宝箱得到钱
// 	LOG_MONEY_OPT_TYPE_REWARD_LOGIN = 3;					// 登陆奖励
// 	LOG_MONEY_OPT_TYPE_REWARD_ONLINE = 4;					// 在线奖励
// 	LOG_MONEY_OPT_TYPE_RELIEF_PAYMENT = 5;					// 救济金
// 	LOG_MONEY_OPT_TYPE_LAND = 6;							// 斗地主
// 	LOG_MONEY_OPT_TYPE_ZHAJINHUA = 7;						// 诈金花
// 	LOG_MONEY_OPT_TYPE_SHOWHAND = 8;						// 梭哈
// 	LOG_MONEY_OPT_TYPE_OX = 9;								// 牛牛
// 	LOG_MONEY_OPT_TYPE_FURIT = 10;							// 水果机
// 	LOG_MONEY_OPT_TYPE_BENZ_BMW = 11;						// 奔驰宝马
// 	LOG_MONEY_OPT_TYPE_TEXAS = 12;							// 德州扑克
// 	LOG_MONEY_OPT_TYPE_BUYU = 13;                           // 捕鱼
// 	LOG_MONEY_OPT_TYPE_SLOTMA = 14;                         // 老虎机
// 	LOG_MONEY_OPT_TYPE_RESET_ACCOUNT = 15;					// 开户有奖
// 	LOG_MONEY_OPT_TYPE_CASH_MONEY = 16;					    // 用户提现
// 	LOG_MONEY_OPT_TYPE_RECHARGE_MONEY = 17;					// 用户充值
// 	LOG_MONEY_OPT_TYPE_GM = 18;								// GM修改金币
// 	LOG_MONEY_OPT_TYPE_INVITE = 19;							// 邀请税收分成
// 	LOG_MONEY_OPT_TYPE_CASH_MONEY_FALSE = 20;			    // 用户提现回退
// 	LOG_MONEY_OPT_TYPE_CREATE_PRIVATE_ROOM = 21;			// 开私有房间费
// 	LOG_MONEY_OPT_TYPE_BANKER_OX = 22;			   			// 抢庄牛牛
// 	LOG_MONEY_OPT_TYPE_CLASSICS_OX = 23;			   	    // 经典牛牛
// 	LOG_MONEY_OPT_TYPE_THIRTEEN_WATER = 24;		   			// 十三水
// 	LOG_MONEY_OPT_TYPE_AGENTTOAGENT_MONEY = 25;				// 代理商间充值
// 	LOG_MONEY_OPT_TYPE_AGENTTOPLAYER_MONEY = 26;			// 代理商给玩家充值
// 	LOG_MONEY_OPT_TYPE_PLAYERTOAGENT_MONEY = 27;			// 玩家退钱给代理商
// 	LOG_MONEY_OPT_TYPE_AGENTBANKTOPLAYER_MONEY = 28;		// 代理商通过银行给玩家充值
// 	LOG_MONEY_OPT_TYPE_BANKDRAW = 29;						// 银行取钱
// 	LOG_MONEY_OPT_TYPE_BANKDEPOSIT = 30;					// 银行存钱
// 	LOG_MONEY_OPT_TYPE_BANKDRAWBACK= 31;					// 银行取钱成功后 未找到玩家信息 回存取出的金钱
// 	LOG_MONEY_OPT_TYPE_BANKTRANSFER= 32;					// 用户转账给代理商
//     LOG_MONEY_OPT_TYPE_REDBLACK = 33;						// 红黑大战
//     LOG_MONEY_OPT_TYPE_SANGONG = 34;						// 三公
//     LOG_MONEY_OPT_TYPE_BIGTWO = 35;							// 锄大地
//     LOG_MONEY_OPT_TYPE_BACCARAT = 36;						// 百家乐
//     LOG_MONEY_OPT_TYPE_SAVE_BACK = 37;						// 用户存取钱异常回退
//     LOG_MONEY_OPT_TYPE_TWENTY_ONE = 38;						//二十一点
// 	LOG_MONEY_OPT_TYPE_SHAIBAO = 39;                        // 骰宝
// 	LOG_MONEY_OPT_TYPE_FIVESTAR = 40;                       // 五星宏辉
// 	LOG_MONEY_OPT_TYPE_TORADORA = 41;                       // 龙虎斗
//     LOG_MONEY_OPT_TYPE_REDBLACK_PRIZEPOOL = 42;             // 红黑奖池
// 	LOG_MONEY_OPT_TYPE_BONUS_HONGBAO = 43;					// 红包奖励
// 	LOG_MONEY_OPT_TYPE_SHAIBAO_PRIZEPOOL = 44;				// 骰宝奖池
// 	LOG_MONEY_OPT_TYPE_SHELONGMEN = 45;//射龙门
// 	LOG_MONEY_OPT_TYPE_PROXY_CASH_MONEY = 46;				//代理提现
// 	LOG_MOENY_OPT_TYPE_MAAJAN_MENHU = 47;				//贵州麻将
// 	LOG_MONEY_OPT_TYPE_CASH_MONEY_IN_CLUB = 48;			//联盟下分
// 	LOG_MONEY_OPT_TYPE_RECHAGE_MONEY_IN_CLUB = 49;		//联盟上分
// 	LOG_MONEY_OPT_TYPE_ROOM_FEE = 50;					//房费
// 	LOG_MONEY_OPT_TYPE_CLUB_COMMISSION = 51;			//返佣
// 	LOG_MONEY_OPT_TYPE_GAME_TAX = 52;					//游戏税收
// 	LOG_MONEY_OPT_TYPE_INIT_GIFT = 53;					//初始金币
// 	LOG_MONEY_OPT_TYPE_MAAJAN_XUEZHAN = 54;				//血战麻将
// 	LOG_MONEY_OPT_TYPE_PDK = 55;						//跑得快
// 	LOG_MONEY_OPT_TYPE_MAAJAN_LIANGFANG = 56;			//两房麻将
// 	LOG_MONEY_OPT_TYPE_MAAJAN_XUEZHAN_ER_YI = 57;		//血战麻将(二人一房)
// 	LOG_MONEY_OPT_TYPE_MAAJAN_XUEZHAN_ER_ER = 58;		//血战麻将(二人二房)
// 	LOG_MONEY_OPT_TYPE_MAAJAN_XUEZHAN_ER_SAN = 59;		//血战麻将(二人三房)
// 	LOG_MONEY_OPT_TYPE_MAAJAN_XUEZHAN_SAN_ER = 60;		//血战麻将(三人二房)
// 	LOG_MONEY_OPT_TYPE_MAAJAN_XUEZHAN_SI_ER = 61;		//血战麻将(四人二房)
// }