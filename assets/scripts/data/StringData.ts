
export class StringData {
    public static getString(msgid, args = []) {
        switch (msgid) {
            case 10001: return "是否需要关闭该亲友群？";
            case 10002: return "连接失败，请稍后重试！";
            case 10003: return "【" + args[0] + "】" + "拒绝解散房间！";
            case 10004: return "您是否要解散【" + args[0] + "】号牌桌？";
            case 10005: return "请联系客服领取奖品";
            case 10006: return "复制信息成功！";
            case 10007: return "兑换成功！";
            case 10008: return "领取成功！";
            case 10009: return "取消匹配成功";
            case 10010: return "退出房间，将由笨笨的机器人代打，输了可不要怪它哦！";
            case 10011: return "";
            case 10012: return "";
            case 10013: return "您的账号在其他设备登录！";
            case 10014: return "";
            case 10015: return "";
            case 10016: return "无法连接到网络，请检测网络后重试！";
            case 10017: return "您是否需要解散该亲友群？";
            case 10018: return "";
            case 10019: return "已经是最后一局了。";
            case 10020: return "已经是第一局了。";
            case 10021: return "请输入亲友群昵称";
            case 10022: return "";
            case 10023: return "提交成功";
            case 10024: return "提交失败，请稍后尝试。";
            case 10025: return "发现最新版本，前往下载";
            case 10026: return "网络中断，重新重连？";
            case 10027: return "金币不足请前往购买";
            case 10028: return "奖券不足请前往金币夺宝获得";
            case 10029: return "";
            case 10030: return "操作成功";
            case 10031: return "";
            case 10032: return "";
            case 10033: return "";
            case 10034: return "";
            case 10035: return "即将离开当前亲友群";
            case 10036: return "该房间已经被解散";
            case 10037: return "您输入字符过长 请重新输入";
            case 10038: return "您选择的牌不符合规则";
            case 10039: return "输入为空";
            case 10040: return "你被房主踢出了房间";
            case 10041: return "匹配失败";
            case 10042: return "金币不足，您是否需要前往商城购买";
            case 10043: return "金币超限，您是否需要前往推荐房间";
            case 10044: return "匹配成功 正在进入房间 请稍候";
            case 10045: return "";
            case 10046: return "当前没有可用玩法，请联系亲友群管理员";
            case 10047: return "操作成功";
            case 10048: return "您选择的快速加入游戏有误，请重新操作";
            case 10049: return "修改成功";
            case 10050: return "亲友群创建成功，您可以创建一个默认规则房间，让玩家快速加入游戏"
            case 10051: return "退出房间成功";
            case 10052: return "金币超限请您重新选择房间";
            case 10053: return "比赛中无法发送输入文字";
            case 10054: return "请输入正确姓名";
            case 10055: return "请输入正确地址";
            case 10056: return "修改地址信息成功";
            case 10057: return "修改地址信息失败";
            case 10058: return "您确定要退出房间吗";
            case 10059: return "您有未完成对局 是否回到对局";
            case 10060: return "没有安装闲聊，请先安装";
            case 10061: return "没有安装吹牛，请先安装";
            case 10062: return "您是否要申请解散";
            case 10063: return "该房间已经被管理员：【" + args[0] + "】解散，即将返回大厅";
            case 10064: return "领取成功";
            case 10065: return "您的金币不足" + args[0] + "点击领取\n剩余次数：" + args[1];
            case 10066: return "领取失败";
            case 10067: return "群主可以招收管理员，一起建设亲友群。管理员可以拉人，踢人，并可以使用暂停进房权限。";
            case 10068: return "数据出错请重试";
            case 10069: return "操作过于频繁，请稍后再试";
            case 10070: return "四带二，三带二，三带一，三不带必须选一个";
            case 10071: return "是否将全部的贡献值兑换成积分？";
            case 10072: return "【" + args[0] + "】" + "拒绝请求，投票取消！";
            case 10073: return "登录超时，请稍后再试";
            

            //快捷言语
            // 麻将
            case 9001: return "你太牛了！";
            case 9002: return "哈哈，手气真好。";
            case 9003: return "快点出牌哟。";
            case 9004: return "今天真高兴。";
            case 9005: return "你放炮，我不胡。";
            case 9006: return "你家里是开银行的吧。";
            case 9007: return "不好意思，我有事要先走一步了。";
            case 9008: return "你的牌打得太好了。";
            case 9009: return "大家好，很高兴见到各位。";
            case 9010: return "怎么又断线了，网络怎么这么差啊。";

            // 斗地主
            case 9101: return "搏一搏单车变摩托。";
            case 9102: return "风吹鸡蛋壳，牌去人安乐。";
            case 9103: return "姑娘，你真是条汉子。";
            case 9104: return "我等的假花都谢了。";
            case 9105: return "我炸你个桃花朵朵开。";
            case 9106: return "一走一停真有型，一秒一卡好潇洒。";
            case 9107: return "真怕猪一样的队友。";
            case 9108: return "各位真不好意思，我要离开一会。";
            case 9109: return "不要吵了，有什么好吵的，专心玩游戏吧。";

            // 跑得快和斗地主出牌错误码
            case 11001: return "您选择的牌不符合规则";
            case 11002: return "不允许四带二";
            case 11003: return "不允许四带三";
            case 11004: return "不允许三带一";
            case 11005: return "最后一手才允许三带一";
            case 11006: return "下家报单，必须出最大";
            case 11007: return "首出必须要带黑桃3";
            case 11008: return "不允许三带二";
            case 11009: return "不允许三张";
            case 11010: return "首出必须要带黑桃5";
            case 11011: return "最后一手才允许三张";
            case 11012: return "最后一手才允许飞机少带";
            case 11013: return "不允许飞机少带";
            
            //系统提示
            case 1: return "重复登录";
            case 3: return "帐号或密码错误";
            case 4: return "没有找到默认大厅";
            case 5: return "验证码过期";
            case 6: return "重复的请求";
            case 8: return "验证码错误，验证失败";
            case 24: return "请输入正确的验证码";
            case 25: return "昵称不能为空";
            case 28: return "手机号长度不正确";
            case 29: return "手机号不正确";
            case 30: return "手机号已被注册";
            case 32: return "服务器维护中";
            case 33: return "频繁登录";
            case 34: return "登陆中";
            case 35: return "排队中";
            case 40: return "同一个ip[" + args[0] + "]注册账号数已经到最大";
            case 44: return "授权出错";
            case 45: return "默认账号不存在,请重新打开客户端，进行授权登录";
            case 46: return "同一个ip登陆账号数已经到最大";
            case 47: return "同一个设备登陆账号数已经到最大";
            case 48: return "登录失败，请联系客服修改密码";
            
            case 51: return "游戏中无法退出";
            case 52: return "已经在房间中";
            case 53: return "已经退出房间";
            case 54: return "没有找到该房间";

            case 55: return "没有找到该牌桌";
            case 56: return "没有找到该座位";
            case 57: return "已经加入座位中";
            case 58: return "该座位已经有人了";
            case 59: return "玩家不在该座位";
            case 61: return "未找到游戏服务器";
            case 62: return "未满足房间进入条件";
            case 63: return "账号已经被冻结";
            case 64: return "游戏维护中";
            case 66: return "未满足房间进入条件";
            case 67: return "未满足房间进入条件";
            case 68: return "未满足房间进入条件";
            case 69: return "未满足房间进入条件";
            case 70: return "未满足房间进入条件";
            case 71: return "未满足房间进入条件";
            case 72: return "房间未找到";
            case 73: return "房间已满";

            case 79: return "出现了未知错误";
            case 80: return "超过拥有的亲友群最大数量限制";
            case 82: return "没有这个群";
            case 83: return "不是群成员";

            case 100: return "该房间已经不存在";
            case 102: return "当前房间正在游戏中";                                    
            case 103: return "操作已过期";
            case 105: return "已经申请等待处理";
            case 106: return "积分不足";
            case 107: return "房卡不足";
            case 108: return "重复操作";
            case 109: return "玩法不存在";

            case 224: return "您已被封号，请联系客服";
            case 225: return "即将进入维护，禁止创建房间";
            
            case 230: return "该玩家不存在";
            case 232: return "已经是群成员";
            case 233: return "玩家已经不在房间";
            case 234: return "该玩家正在游戏中，无法踢出";
            case 237: return "分数未清空，不能踢出";
            case 238: return "小于最低限制，无法进入";

            case 240: return "非法操作";
            case 251: return "参数非法";
            case 252: return "桌子模板不存在";

            case 253: return "该房间是IP防作弊房间，您与房间中玩家IP段相同，无法进入";
            case 254: return "该房间是GPS防作弊房间，您与房间中玩家距离过近，无法进入";
            case 255: return "您被禁止与房间中的某位玩家一起游戏，请联系群主";
            case 256: return "团队积分冻结，请联系群主解决";
            case 257: return "您被禁止加入游戏，请联系群主解决";
            case 258: return "群被封禁，请联系客服处理";
            case 259: return "打烊中，请联系群主处理";
            case 260: return "游戏已经开始，禁止中途加入";
            case 261: return "需要所有玩家都准备";
            case 262: return "团队禁止游戏，联系上级处理";
            case 263: return "导入前，两边团队都需要打烊";
            case 500: return "当前对局有玩家破产，对局结束";
            case 501: return "当前对局有玩家积分小于对局最低积分限制，对局结束";
            case 502: return "权限不足";
            case 503: return "代理玩家才能被设置为合伙人";
            case 504: return "已经绑定";
            case 505: return "您的手机未绑定账号，无法登陆";
            case 506: return "请求验证码失败，请稍后再试";
            case 507: return "俱乐部已经满员了";

            default: return "";
        }
    }
}