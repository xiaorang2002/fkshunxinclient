import { ListenerType } from './../../scripts/data/ListenerType';
import { OX_CARD_TYPE_TO_NAME } from './../../scripts/data/nn/GameInfo_NN';
import { GameManager } from './../../scripts/GameManager';
import { GAME_TYPE, GAME_NAME } from './../../scripts/data/GameConstValue';
import { SdkManager } from './SdkManager';
import { SelectTipsUI } from './../../scripts/ui/SelectTipsUI';
import { UIManager } from './../Manager/UIManager';
import { LogWrap } from "./LogWrap";
import { GameDataManager } from "../Manager/GameDataManager";
import { MessageManager } from "../Manager/MessageManager";

enum STANDUP_REASON {
    STANDUP_REASON_NORMAL = 0,
    STANDUP_REASON_DISMISS = 1,
    STANDUP_REASON_OFFLINE = 2, //掉线踢出
    STANDUP_REASON_FORCE = 3, //强制退出
    STANDUP_REASON_ADMIN_DISMISS_FORCE = 4,	//管理员解散房间
    STANDUP_REASON_DISMISS_REQUEST = 5,	//申请解散房间离开
    STANDUP_REASON_DISMISS_TRUSTEE = 6,	//托管自动离开
    STANDUP_REASON_BANKRUPCY = 7,	//破产
    STANDUP_REASON_TABLE_TIMEOUT = 8, //桌子超过最长时间
    STANDUP_REASON_NO_READY_TIMEOUT = 9, //超时未准备
    STANDUP_REASON_MAINTAIN = 10, //游戏维护
    STANDUP_REASON_BLOCK_GAMING = 12,//被禁止游戏
    STANDUP_REASON_CLUB_CLOSE = 13,
    STANDUP_REASON_DELAY_KICKOUT_TIMEOUT = 14, //离线超时踢出
    STANDUP_REASON_LESS_ROOM_FEE = 15, //房卡不足
}

enum DISMISS_REASON {
    DISMISS_REASON_NORMAL = 0,
    DISMISS_REASON_REQUEST = 1,	//申请解散
    DISMISS_REASON_ADMIN_FORCE = 2,	//管理强制解散
    DISMISS_REASON_BANKRUPCY = 3,	//破产解散
    DISMISS_REASON_TRUSTEE_AUTO = 4, //托管自动解散
    DISMISS_REASON_TIMEOUT = 5, //超时解散
    DISMISS_REASON_MAINTAIN = 6, //游戏维护
    DISMISS_REASON_LESS_ROOM_FEE = 8,
}

export class Utils {
    //获得时间
    public static getTimeString(time: number, sign: string = "-", isAccurateDay: boolean = false) {
        let date = new Date(time);
        let str = " ";
        str += date.getFullYear() + sign + (date.getMonth() + 1) + sign + date.getDate();

        if (isAccurateDay)
            return str;

        str += " " + date.getHours() + ":";
        if (date.getMinutes() < 10)
            str += "0" + date.getMinutes();
        else
            str += date.getMinutes();
        str += ":";
        if (date.getSeconds() < 10)
            str += "0" + date.getSeconds();
        else
            str += date.getSeconds();
        return str;
    }

    //计算字节长度
    public static getByteLen(val: string) {
        let len = 0;
        for (let i = 0; i < val.length; i++) {
            if (val[i].match(/[^\x00-\xff]/ig) != null) //全角
                len += 2;
            else
                len += 1;
        }
        return len;
    }

    // //名字缩短处理
    // public static getShortName(name: string) {
    //     // let str = "";
    //     // let num = 0;
    //     // for (let i = 0; i < name.length; ++i) {
    //     //     num += this.getByteLen(name[i]);
    //     //     if (num <= 10)
    //     //         str += name[i];
    //     //     else
    //     //         break;
    //     // }
    //     return name;
    // }

    public static getByteByBinary(binaryCode) {
        /**
         * 二进制 Binary system,es6表示时以0b开头
         * 八进制 Octal number system,es5表示时以0开头,es6表示时以0o开头
         * 十进制 Decimal system
         * 十六进制 Hexadecimal,es5、es6表示时以0x开头
         */
        var byteLengthDatas = [0, 1, 2, 3, 4];
        var len = byteLengthDatas[Math.ceil(binaryCode.length / 8)];
        return len;
    }
    /* 通过文字十六进制得到文字字节数 */
    public static getByteByHex(hexCode) {
        return Utils.getByteByBinary(parseInt(hexCode, 16).toString(2));
    }

    public static getShortName(str, maxLength = 10) {
        var result = "";
        var flag = false;
        var len = 0;
        var length = 0;
        var length2 = 0;
        for (var i = 0; i < str.length; i++) {
            var code = str.codePointAt(i).toString(16);
            if (code.length > 4) {
                i++;
                if ((i + 1) < str.length) {
                    flag = str.codePointAt(i + 1).toString(16) == "200d";
                }
            }
            if (flag) {
                len += Utils.getByteByHex(code);
                if (i == str.length - 1) {
                    length += len;
                    if (length <= maxLength) {
                        result += str.substr(length2, i - length2 + 1);
                    } else {
                        break
                    }
                }
            } else {
                if (len != 0) {
                    length += len;
                    length += Utils.getByteByHex(code);
                    if (length <= maxLength) {
                        result += str.substr(length2, i - length2 + 1);
                        length2 = i + 1;
                    } else {
                        break
                    }
                    len = 0;
                    continue;
                }
                length += Utils.getByteByHex(code);
                if (length <= maxLength) {
                    if (code.length <= 4) {
                        result += str[i]
                    } else {
                        result += str[i - 1] + str[i]
                    }
                    length2 = i + 1;
                } else {
                    break
                }
            }
        }
        return result;
    }

    //动态加载外部图片
    public static loadTextureFromNet(loadnode: cc.Sprite, url: string) {
        if (url == "0") {
            this.loadTextureFromLocal(loadnode, "public/default_head");
            return;
        }
        if (url.indexOf("http") == -1 && url != "") {
            this.loadTextureFromLocal(loadnode, "head_sp/" + parseInt(url) % 30)
            return
        }
        if (url == null || url == "") {
            loadnode.spriteFrame = null;
            return;
        }

        if (loadnode == null)
            return;

        //头像节点
        cc.assetManager.loadRemote(url, { ext: '.png' }, function (err, texture: cc.Texture2D) {
            if (err) {
                LogWrap.err("net texture load error");
                return
            }
            if (texture) {
                let spriteFrame = new cc.SpriteFrame(texture, new cc.Rect(0, 0, texture.width, texture.height));
                if (loadnode.node)
                    loadnode.spriteFrame = spriteFrame;
            }
        });
    }

    //动态加载本地图片
    public static loadTextureFromLocal(loadnode: cc.Sprite, url: string, callback: any = null) {
        if (url == null || url == "") {
            loadnode.spriteFrame = null;
            if (callback != null)
                callback();
            return;
        }

        if (loadnode == null)
            return;
        cc.resources.load(url, cc.SpriteFrame,
            function (err, spriteFrame) {
                if (err) {
                    LogWrap.err("local texture load error");
                    return;
                }
                if (loadnode.node)
                    loadnode.spriteFrame = spriteFrame;
                if (callback != null)
                    callback();
            }.bind(this));
    }

    public static reandomNumBoth(min: number, max: number): number {
        let Range = max - min;
        let Rand = Math.random();
        return min + Math.round(Rand * Range);
    }

    public static reandomNum(min: number, max: number): number {
        let Range = max - min;
        let Rand = Math.random();
        return min + Math.floor(Rand * Range);
    }

    public static getPdkColorAndMjTextureId(cardId) {
        var color = Math.floor(cardId / 20)  // 黑红梅方 0,1,2,3
        var textureId = cardId - color * 20
        if (textureId == 14) // A是14
            textureId = 1
        else if (textureId == 15)
            textureId = 2
        else if (textureId == 16) // 小王
            textureId = 53
        else if (textureId == 17) // 大王
            textureId = 54

        if (color == 0) // 黑桃
            textureId += 39
        else if (color == 1) // 红桃
            textureId += 26
        else if (color == 2)
            textureId += 13
        else if (color == 4 && textureId != 53 && textureId != 54)
            textureId += 99

        return textureId
    }

    public static getPdkCardValue(cardId) {
        var color = Math.floor(cardId / 20) // 黑红梅方 0,1,2,3
        var cardValue = cardId - color * 20
        // if (cardValue == 14) // A是14
        //     cardValue = 1
        // else if (cardValue == 15)
        //     cardValue = 2
        if (cardValue == 16) // 小王
            cardValue = 53
        else if (cardValue == 17) // 大王
            cardValue = 54
        return cardValue
    }

    public static getNnCardRealValue(cardId) {
        var color = Math.floor(cardId / 20) // 黑红梅方 0,1,2,3
        var cardValue = cardId - color * 20
        if (cardValue == 14) // A是14
            cardValue = 1
        else if (cardValue == 15)
            cardValue = 2
        else if (cardValue > 10)
            cardValue = 10
        return cardValue
    }



    public static getNnCardSortValue(cardId) {
        var color = Math.floor(cardId / 20)
        var cardValue = cardId - color * 20
        if (cardValue == 14) // A是14
            cardValue = 1
        else if (cardValue == 15)
            cardValue = 2
        return cardValue
    }


    /**得到客户端对应id */
    public static getClientMjId(serverId) {
        if (serverId < 10)
            return serverId;
        else if (serverId < 19)
            return serverId + 1;
        else if (serverId < 28)
            return serverId + 2;
        else
            return serverId + 3;
    }
    /**得到服务器对应id */
    public static getSeverMjId(clientId) {
        if (clientId < 10)
            return clientId;
        else if (clientId < 20)
            return clientId - 1;
        else if (clientId < 30)
            return clientId - 2;
        else
            return clientId - 3;
    }

    //计算时间差
    public static getTimeDifference(lasttime) {
        var date1 = new Date(lasttime);
        var date2 = new Date(GameDataManager.getInstance().systemData.severTime);
        var date3 = date2.getTime() - date1.getTime();

        //计算出相差天数
        var days = Math.floor(date3 / (24 * 3600 * 1000));
        if (days > 0)
            return days + "天前";

        //计算出小时数
        var leave1 = date3 % (24 * 3600 * 1000);
        var hours = Math.floor(leave1 / (3600 * 1000));
        if (hours > 0)
            return hours + "小时前";

        //计算相差分钟数
        var leave2 = leave1 % (3600 * 1000);
        var minutes = Math.floor(leave2 / (60 * 1000));
        if (minutes > 0)
            return minutes + "分钟前";

        //计算相差秒数
        var leave3 = leave2 % (60 * 1000)      //计算分钟数后剩余的毫秒数
        var seconds = Math.round(leave3 / 1000);

        return "刚刚";
    }

    /**格式化字符串 ——钱 */
    public static FormatNum(money, num) {
        // num = (num == -1 ? 0 : 2);
        var forma;
        if (money < 10000) {
            forma = money
            return forma;
        }
        if (money >= 10000 && money < 100000000) {
            forma = money / 10000;
            num = (parseInt(forma) == forma ? 0 : 1)
            forma = forma.toFixed(num) + "万";
            return forma;
        }
        if (money >= 100000000) {
            forma = money / 100000000;
            forma = forma.toFixed(num) + "亿";
            return forma;
        }
    }

    //重置屏幕尺寸 适配
    public static curDR: cc.Size = null;
    public static resize() {

        var cvs = cc.find('Canvas').getComponent(cc.Canvas);
        //保存原始设计分辨率，供屏幕大小变化时使用
        if (!this.curDR) {
            this.curDR = cvs.designResolution;
        }
        var dr = this.curDR;
        var s = cc.view.getFrameSize();
        var rw = s.width;
        var rh = s.height;
        var finalW = rw;
        var finalH = rh;

        if ((rw / rh) > (dr.width / dr.height)) {
            //!#zh: 是否优先将设计分辨率高度撑满视图高度。 */
            //cvs.fitHeight = true;

            //如果更长，则用定高
            finalH = dr.height;
            finalW = finalH * rw / rh;
        }
        else {
            /*!#zh: 是否优先将设计分辨率宽度撑满视图宽度。 */
            //cvs.fitWidth = true;
            //如果更短，则用定宽
            finalW = dr.width;
            finalH = rh / rw * finalW;
        }
        cvs.designResolution = cc.size(finalW, finalH);
        cvs.node.width = finalW;
        cvs.node.height = finalH;
        MessageManager.getInstance().messagePost(ListenerType.sizeChange);
    }

    // // 下载远程图片
    // public static downloadRemoteImageAndSave(url, callback, caller, index, type) {
    //     if (url == null || url == "") {
    //         // LogWrap.log("12")
    //         return;
    //     }
    //     if (jsb == null) {
    //         //  LogWrap.log("13")
    //         callback(caller, null);
    //     } else {
    //         let dirpath = jsb.fileUtils.getWritablePath() + 'customRes/';
    //         let formatedFilename = this.convertPathRemoveDirectory(url);
    //         // LogWrap.log("14")
    //         if (formatedFilename == null || formatedFilename == "") {
    //             // LogWrap.log("15")
    //             callback(caller, null);
    //             return;
    //         }
    //         // LogWrap.log("16")
    //         let filepath = dirpath + formatedFilename;
    //         if (!this.isValidCommonSuffix(this.getSuffixFromPath(filepath))) {
    //             // 防止有的网址不带图片后缀
    //             filepath += '.png';
    //         }
    //         // LogWrap.log("17")
    //         let self = this;
    //         if (jsb.fileUtils.isFileExist(filepath)) {
    //             // 图片存在，直接加载
    //             //   LogWrap.log("18")
    //             Utils.saveResTextrue(index, type, filepath)
    //             // self.loadImage(filepath, callback, caller);
    //             return;
    //         }

    //         var saveFile = function (data) {
    //             if (data) {
    //                 if (!jsb.fileUtils.isDirectoryExist(dirpath)) {
    //                     // 目录不存在，创建
    //                     jsb.fileUtils.createDirectory(dirpath);
    //                 }
    //                 if (jsb.fileUtils.writeDataToFile(new Uint8Array(data), filepath)) {
    //                     // 成功将下载下来的图片写入本地
    //                     //    LogWrap.log("19")
    //                     Utils.saveResTextrue(index, type, filepath);
    //                     // self.loadImage(filepath, callback, caller);
    //                 } else {
    //                     callback(caller, null);
    //                 }
    //             } else {
    //                 callback(caller, null);
    //             }
    //         };
    //     }
    //     var xhr = new XMLHttpRequest();
    //     xhr.onreadystatechange = function () {
    //         if (xhr.readyState === 4) {
    //             if (xhr.status === 200) {
    //                 //  LogWrap.log("20")
    //                 saveFile(xhr.response);
    //             } else {
    //                 saveFile(null);
    //             }
    //         }
    //     }.bind(this);
    //     //responseType一定要在外面设置
    //     xhr.responseType = 'arraybuffer';
    //     xhr.open("GET", url, true);
    //     xhr.send();
    //     // LogWrap.log("30")
    // }

    // 将网址中的"/"转换成"__"
    public static convertPathRemoveDirectory(path) {
        if (path == null) {
            return "";
        }

        let len = path.length;
        path = path.substr(8, len);
        path = path.replace(/\//g, '__');
        return path;
    }

    public static getSuffixFromPath(path) {
        let index = path.lastIndexOf('.');
        if (index < 0) {
            return "";
        }

        return path.substr(index);
    }

    public static isValidCommonSuffix(s) {
        if (typeof s !== "string" || s == "" || s == "unknown") {
            return false;
        }
        if (s.length > 4) {
            return false;
        }

        let index = s.indexOf('.');
        if (index == -1) {
            return false;
        }

        return true;
    }

    public static sortHandCardByQue(que, list, gameType = 0) {
        var moPai = -1
        if (gameType == 0)
            gameType = GameDataManager.getInstance().curGameType
        if (list.length % 3 == 2) {
            moPai = list[list.length - 1]
            list.splice(list.indexOf(moPai), 1)
        }
        for (var i = 0; i < list.length; i++) {
            if (Math.floor(list[i] / 10) == que)
                list[i] += 1000
        }
        var resultList = list.sort(function (a, b) { return a - b })
        for (var i = 0; i < resultList.length; i++)
            if (resultList[i] > 1000)
                resultList[i] %= 1000

        if (gameType == GAME_TYPE.YJMJ) {
            var laiziList = []
            var lastList = []
            for (var i = 0; i < resultList.length; i++) {
                if (resultList[i] == 21)
                    laiziList.push(resultList[i])
                else
                    lastList.push(resultList[i])
            }
            resultList = laiziList.concat(lastList)
        }

        if (gameType == GAME_TYPE.ZGMJ) {
            var laiziList = []
            var lastList = []
            for (var i = 0; i < resultList.length; i++) {
                if (resultList[i] == 37)
                    laiziList.push(resultList[i])
                else
                    lastList.push(resultList[i])
            }
            resultList = laiziList.concat(lastList)
        }

        if (moPai >= 0)
            resultList.push(moPai)
        return resultList
    }

    /**将下载下来的图片地址保存在数据中 */
    public static saveResTextrue(index, type, url) {

    }

    public static getUnionTaxTypeByRule(rule) {
        var oRule = JSON.parse(rule)
        if (oRule.union && oRule.union.tax) {
            if (oRule.union.tax.AA != null)
                return 0 // aa
            else
                return 1 // bigWinner
        }
        return -1
    }

    public static encodeUtf8(inputStr) {
        var outputStr = "";

        for (var i = 0; i < inputStr.length; i++) {
            var temp = inputStr.charCodeAt(i);

            //0xxxxxxx
            if (temp < 128) {
                outputStr += String.fromCharCode(temp);
            }
            //110xxxxx 10xxxxxx
            else if (temp < 2048) {
                outputStr += String.fromCharCode((temp >> 6) | 192);
                outputStr += String.fromCharCode((temp & 63) | 128);
            }
            //1110xxxx 10xxxxxx 10xxxxxx
            else if (temp < 65536) {
                outputStr += String.fromCharCode((temp >> 12) | 224);
                outputStr += String.fromCharCode(((temp >> 6) & 63) | 128);
                outputStr += String.fromCharCode((temp & 63) | 128);
            }
            //11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
            else {
                outputStr += String.fromCharCode((temp >> 18) | 240);
                outputStr += String.fromCharCode(((temp >> 12) & 63) | 128);
                outputStr += String.fromCharCode(((temp >> 6) & 63) | 128);
                outputStr += String.fromCharCode((temp & 63) | 128);
            }
        }

        return outputStr;
    }

    public static formatDate(time, type = 0) {
        var oDate = new Date(time * 1000);   //创建一个指定的日期对象
        var year = oDate.getFullYear();  //取得4位数的年份
        var month = oDate.getMonth() + 1;  //取得日期中的月份，其中0表示1月，11表示12月
        var date = oDate.getDate();      //返回日期月份中的天数（1到31）
        var hour = oDate.getHours();     //返回日期中的小时数（0到23）
        var minute = oDate.getMinutes(); //返回日期中的分钟数（0到59）
        var second = oDate.getSeconds(); //返回日期中的秒数（0到59）
        if (type == 1)
            return hour + ":" + minute + ":" + second
        if (type == 2)
            return year + "-" + month + "-" + date
        else
            return year + "-" + month + "-" + date + " " + hour + ":" + minute + ":" + second;
    }

    public static calculateLength(pos1, pos2) {
        var radLat1 = pos1.latitude * Math.PI / 180.0;
        var radLat2 = pos2.latitude * Math.PI / 180.0;
        var a = radLat1 - radLat2;
        var b = pos1.longitude * Math.PI / 180.0 - pos2.longitude * Math.PI / 180.0;
        var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
            Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
        s = s * 6378.137;// EARTH_RADIUS;
        if (s > 1) {
            s = Math.round(s * 10) / 10;
            return s + "km";
        }
        else {
            s = Math.floor(s * 1000)
            return s + "m";
        }

    }

    public static checkGps() {
        if (GameDataManager.getInstance().gpsData == null || (GameDataManager.getInstance().gpsData.jingdu < 0 || GameDataManager.getInstance().gpsData.weidu < 0)) {
            try {
                var localStoreGps = false
                // var storeGps = cc.sys.localStorage.getItem("gpsdata")
                var storeGps = null
                if (!storeGps || storeGps == undefined || storeGps == "")
                    localStoreGps = false
                else {
                    var localGpsInfo = JSON.parse(storeGps)
                    var nowTime = new Date().getTime()
                    if (localGpsInfo.date && nowTime - localGpsInfo.date < 60 * 60 * 12 * 1000) // 12小时不过期
                        localStoreGps = true
                }
                if (!localStoreGps) {
                    var tips = "该房间是GPS防作弊房间，进入房间需要获取GPS定位信息，是否获取"
                    UIManager.getInstance().openUI(SelectTipsUI, 50, () => {
                        UIManager.getInstance().getUI(SelectTipsUI).getComponent("SelectTipsUI").initUI(tips, SdkManager.getInstance().doGetLocation, null);
                    });
                    return false
                }
                else {
                    GameDataManager.getInstance().gpsData = JSON.parse(storeGps)
                    return true
                }
            }
            catch (e) {
                return false
            }
        }
        return true
    }


    public static isXzmj(gameType) {
        if (gameType == GAME_TYPE.YJMJ || gameType == GAME_TYPE.ZGMJ)
            return true
        if (gameType >= GAME_TYPE.XZMJ && gameType < GAME_TYPE.LRPDK)
            return true;
        return false;
    }

    public static isMj(gameType) {
        if (gameType == GAME_TYPE.YJMJ || gameType == GAME_TYPE.ZGMJ)
            return true
        if (gameType >= GAME_TYPE.MHXL && gameType < GAME_TYPE.LRPDK)
            return true;
        return false;
    }

    //得到对应的基本规则
    public static getBase(info): string {
        let str = "";
        var rule = JSON.parse(info.rule);
        var js = [8, 16,];
        var gameName = GAME_NAME[info.gameType]
        str = str + gameName + " "
        if (info.gameType == GAME_TYPE.SCPDK) {
            var playerNumList = [4, 3, 2]
            str += playerNumList[rule.room.player_count_option] + "人 ";
        }
        if (info.gameType == GAME_TYPE.DDZ) {
            var playerNumList = [3, 2]
            str += playerNumList[rule.room.player_count_option] + "人 ";
        }
        if (info.gameType == GAME_TYPE.YJMJ) {
            var playerNumList = [4, 3, 2]
            str += playerNumList[rule.room.player_count_option] + "人 ";
        }

        if (info.gameType == GAME_TYPE.ZGMJ) {
            var playerNumList = [2, 3]
            str += playerNumList[rule.room.player_count_option] + "人 ";
        }
        if (info.gameType == GAME_TYPE.ZGCP) {
            var playerNumList = [3, 2]
            str += playerNumList[rule.room.player_count_option] + "人 ";
        }

        if (Utils.isXzmj(info.gameType))
            js = [4, 8, 16]
        else if (info.gameType == GAME_TYPE.PDK || info.gameType == GAME_TYPE.LRPDK || info.gameType == GAME_TYPE.SCPDK)
            js = [8, 12, 20]
        else if (info.gameType == GAME_TYPE.ZJH)
            js = [8, 12, 16, 20]
        else if (info.gameType == GAME_TYPE.NN)
            js = [8, 12, 16, 20]
        else if (info.gameType == GAME_TYPE.DDZ)
            js = [8, 12, 20]
        else if (info.gameType == GAME_TYPE.ZGMJ)
            js = [4, 6, 10, 16]
        else if (info.gameType == GAME_TYPE.ZGCP)
            js = [4, 6, 8, 10]
        str += js[rule.round.option] + "局 ";
        if (rule.pay.option == 1)
            str += "AA支付 ";
        else if (rule.pay.option == 2)
            str += "老板支付 "
        else
            str += "房主支付 "
        if (Utils.isXzmj(info.gameType)) {
            var fan = [3, 4, 5, 6]
            str += fan[rule.fan.max_option] + "番"
        }
        else if (info.gameType == GAME_TYPE.DDZ) {
            var times = [16, 32, 64]
            str += times[rule.play.max_times] + "倍"
        }
        else if (info.gameType == GAME_TYPE.ZGMJ) {
            var times = [3, 4, 5]
            str += times[rule.play.max_option] + "番"
        }
        else if (info.gameType == GAME_TYPE.ZGCP) {
            let fanShu = ["3番", "4番", "不封顶"]
            str += fanShu[rule.fan.max_option]
        }
        return str;
    }

    //得到对应的玩法规则
    public static getRule(info): string {
        let str = "";
        var rule = JSON.parse(info.rule);
        if (info.gameType == GAME_TYPE.MHXL || info.gameType == GAME_TYPE.LFMJ) {
            if (rule.play.yi_zhang_bao_ting)
                str += "打一张可报听 "
            if (rule.play.bao_ting_ke_men)
                str += "报听可闷 "
            if (rule.play.dai_zhong)
                str += "带红中"
            if (rule.play.gu_mai)
                str += "估卖 "
            if (rule.play.xiao_hu_men)
                str += "小胡必闷 "
            if (rule.play.hu_tips)
                str += "胡牌提示 "
            if (rule.play.fan_pai_ji)
                str += "翻牌鸡 "
            if (rule.play.yao_bai_ji)
                str += "摇摆鸡 "
            if (rule.play.ben_ji)
                str += "本鸡 "
            if (rule.play.wu_gu_ji)
                str += "乌骨鸡 "
            if (rule.play.xing_qi_ji)
                str += "星期鸡 "
            if (rule.play.chui_feng_ji)
                str += "吹风鸡 "
            if (rule.play.di_long)
                str += "地龙 "
            if (rule.play.yi_kou_er)
                str += "一扣二 "
            if (rule.play.lian_zhuang)
                str += "连庄 "
            if (rule.play.tong_san)
                str += "通三 "
            if (rule.play.win_zhuang)
                str += "赢家坐庄 "
            if (rule.option.ip_stop_cheat)
                str += "IP防作弊 "
            if (rule.option.gps_distance > 0)
                str += "GPS防作弊 "
            if (rule.option.hand_ready)
                str += "手动准备 "
            if (rule.option.block_hu_dong)
                str += "禁止互动 "

        }
        else if (info.gameType == GAME_TYPE.YJMJ) {
            if (rule.huan.count_opt == 0)
                str += "换三张 "
            if (rule.huan.count_opt == 1)
                str += "换四张 "
            if (rule.huan.type_opt == 0)
                str += "单色换 "
            if (rule.huan.type_opt == 1)
                str += "任意换 "
            if (rule.play.zi_mo_jia_di)
                str += "自摸加底 "
            if (rule.play.zi_mo_jia_fan)
                str += "自摸加番 "
            if (rule.play.dgh_zi_mo)
                str += "点杠花(自摸) "
            if (rule.play.dgh_dian_pao)
                str += "点杠花(点炮) "
            if (rule.play.cha_da_jiao)
                str += "查大叫 "
            if (rule.play.cha_xiao_jiao)
                str += "查小叫 "
            if (rule.play.men_qing)
                str += "门清 "
            if (rule.play.zhong_zhang)
                str += "中张 "
            if (rule.play.hai_di)
                str += "海底 "
            if (rule.play.tian_di_hu)
                str += "天地胡 "
            if (rule.play.jin_gou_gou)
                str += "金钩钩 "
            if (rule.play.hu_tips)
                str += "胡牌提示 "
            if (rule.play.guo_zhuang_hu)
                str += "放牛必须过庄胡 "
            if (rule.play.dismiss_all_agree)
                str += "所有人同意才解散 "
            if (rule.play.guo_shou_peng)
                str += "过手碰 "
            if (rule.play.exchange_tips)
                str += "换牌提示 "
            if (rule.option.ip_stop_cheat)
                str += "IP防作弊 "
            if (rule.option.gps_distance > 0)
                str += "GPS防作弊 "
            if (rule.option.hand_ready)
                str += "手动准备 "
            if (rule.option.block_hu_dong)
                str += "禁止互动 "
            if (rule.option.request_dismiss == false)
                str += "禁止解散 "
            if (rule.play.ready_timeout_option >= 0) {
                var secondList = ["10秒", "15秒", "30秒", "60秒", "90秒"]
                str += "准备时间" + secondList[rule.play.ready_timeout_option] + " "
            }
            if (rule.trustee.second_opt >= 0) {
                var secondList = ["30秒", "60秒", "120秒"]
                str += secondList[rule.trustee.second_opt]
                if (rule.room.auto_dismiss)
                    str += " 托管" + rule.room.auto_dismiss.trustee_round + "局"
                else
                    str += " 托管到底"
            }
        }
        else if (info.gameType == GAME_TYPE.ZGMJ) {

            if (rule.piao) {

                if (rule.piao.piao_option == 0) {
                    str += "随飘 "
                }
                if (rule.piao.piao_option == 1) {
                    str += "必飘 "
                }
            }
            else {
                str += "不飘 "
            }

            if (rule.luobo) {
                if (rule.luobo.luobo_option == 0) {
                    str += "1萝卜 "
                }

                if (rule.luobo.luobo_option == 1) {
                    str += "2萝卜 "
                }
            }

            if (rule.play.zi_mo_jia_di)
                str += "自摸加底 "
            if (rule.play.zi_mo_jia_fan)
                str += "自摸加番 "
            if (rule.play.zi_mo_bu_jia)
                str += "自摸不加 "
            if (rule.play.dgh_zi_mo)
                str += "点杠花(自摸) "
            if (rule.play.dgh_dian_pao)
                str += "点杠花(点炮) "
            if (rule.play.jin_gou_gou)
                str += "金钩钓 "
            if (rule.play.bao_jiao)
                str += "报叫 "
            if (rule.play.hu_tips)
                str += "胡牌提示 "
            if (rule.play.guo_zhuang_hu)
                str += "过张升番可胡 "
            if (rule.play.dismiss_all_agree)
                str += "所有人同意才解散 "
            if (rule.play.lai_zi)
                str += "有癞子 "
            if (rule.play.bo_zi_mo)
                str += "搏自摸 "
            if (rule.option.ip_stop_cheat)
                str += "IP防作弊 "
            if (rule.option.gps_distance > 0)
                str += "GPS防作弊 "
            if (rule.option.hand_ready)
                str += "手动准备 "
            if (rule.option.block_hu_dong)
                str += "禁止互动 "
            if (rule.option.request_dismiss == false)
                str += "禁止解散 "
            if (rule.play.ready_timeout_option >= 0) {
                var secondList = ["15秒", "20秒", "30秒", "60秒", "90秒"]
                str += "准备时间" + secondList[rule.play.ready_timeout_option] + " "
            }
            if (rule.trustee.second_opt >= 0) {
                var secondList = ["30秒", "60秒", "120秒"]
                str += secondList[rule.trustee.second_opt]
                if (rule.room.auto_dismiss)
                    str += " 托管" + rule.room.auto_dismiss.trustee_round + "局"
                else
                    str += " 托管到底"
            }
        }
        else if (Utils.isXzmj(info.gameType)) {
            if ((info.gameType == GAME_TYPE.FR2F || info.gameType == GAME_TYPE.TR1F) && rule.play.tile_count)
                str += rule.play.tile_count + "张牌 "
            if (rule.play.qing_yi_se_fan)
                str += "清一色" + rule.play.qing_yi_se_fan + "番 "
            if (rule.huan.count_opt == 0)
                str += "换三张 "
            if (rule.huan.count_opt == 1)
                str += "换四张 "
            if (rule.huan.type_opt == 0)
                str += "单色换 "
            if (rule.huan.type_opt == 1)
                str += "任意换 "
            if (rule.play.zi_mo_jia_di)
                str += "自摸加底 "
            if (rule.play.zi_mo_jia_fan)
                str += "自摸加番 "
            if (rule.play.dgh_zi_mo)
                str += "点杠花(自摸) "
            if (rule.play.dgh_dian_pao)
                str += "点杠花(点炮) "
            if (rule.play.cha_da_jiao)
                str += "查大叫 "
            if (rule.play.cha_xiao_jiao)
                str += "查小叫 "
            if (rule.play.yao_jiu)
                str += "幺九将对 "
            if (rule.play.men_qing)
                str += "门清中张 "
            if (rule.play.tian_di_hu)
                str += "天地胡 "
            if (rule.play.hu_tips)
                str += "胡牌提示 "
            if (rule.play.guo_zhuang_hu)
                str += "放牛必须过庄胡 "
            if (rule.play.dismiss_all_agree)
                str += "所有人同意才解散 "
            if (rule.play.guo_shou_peng)
                str += "过手碰 "
            if (rule.play.exchange_tips)
                str += "换牌提示 "
            if (rule.play.jia_xin_5)
                str += "夹心五 "
            if (rule.play.ka_er_tiao)
                str += "卡二条 "
            if (rule.play.hu_at_least_2)
                str += "二分起胡 "
            if (rule.play.da_dui_zi_fan_2)
                str += "对对胡2番 "
            if (rule.play.si_dui)
                str += "四对 "
            if (rule.option.ip_stop_cheat)
                str += "IP防作弊 "
            if (rule.option.gps_distance > 0)
                str += "GPS防作弊 "
            if (rule.option.hand_ready)
                str += "手动准备 "
            if (rule.option.block_hu_dong)
                str += "禁止互动 "
            if (rule.option.request_dismiss == false)
                str += "禁止解散 "
            if (rule.play.ready_timeout_option >= 0) {
                var secondList = ["10秒", "15秒", "30秒", "60秒", "90秒"]
                str += "准备时间" + secondList[rule.play.ready_timeout_option] + " "
            }
            if (rule.trustee.second_opt >= 0) {
                var secondList = ["30秒", "60秒", "120秒"]
                str += secondList[rule.trustee.second_opt]
                if (rule.room.auto_dismiss)
                    str += " 托管" + rule.room.auto_dismiss.trustee_round + "局"
                else
                    str += " 托管到底"
            }
        }
        else if (info.gameType == GAME_TYPE.PDK || info.gameType == GAME_TYPE.LRPDK) {
            if (rule.play.card_num >= 0)
                str += rule.play.card_num + "张牌 "
            if (rule.play.zhuang.normal_round == 0)
                str += "赢家先出 "
            if (rule.play.zhuang.normal_round == 1)
                str += "轮流先出 "
            if (rule.play.zhuang.normal_round == 2)
                str += "黑桃三先出 "
            if (rule.play.first_discard && rule.play.first_discard.with_3)
                str += "首出必带黑桃三 "
            if (rule.play.must_discard)
                str += "能出必出 "
            if (rule.play.bao_dan_discard_max)
                str += "报单必须出最大"
            if (rule.play.san_dai_yi)
                str += "最后一手可三带一 "
            if (rule.play.si_dai_er)
                str += "可四带二 "
            if (rule.play.si_dai_san)
                str += "可四带三 "
            if (rule.play.lastone_not_consume)
                str += "剩一张不输分 "
            if (rule.play.zhuang.first_round == 4)
                str += "首局随机先出 "
            if (rule.play.AAA_is_bomb)
                str += "AAA为炸弹 "
            if (rule.play.bomb_score == 10)
                str += "炸弹10分 "
            else
                str += "炸弹5分 "
            if (rule.play.abandon_3_4)
                str += "去掉3,4 "
            if (rule.play.fan_chun != false)
                str += "反春 "
            if (rule.play.plane_with_mix != false)
                str += "最后一手飞机允许少带 "
            if (rule.room.dismiss_all_agree)
                str += "所有人同意才解散 "
            if (rule.option.ip_stop_cheat)
                str += "IP防作弊 "
            if (rule.option.gps_distance > 0)
                str += "GPS防作弊 "
            if (rule.option.hand_ready)
                str += "手动准备 "
            if (rule.option.block_hu_dong)
                str += "禁止互动 "
            if (rule.option.request_dismiss == false)
                str += "禁止解散 "
            if (rule.play.ready_timeout_option >= 0) {
                var secondList = ["10秒", "15秒", "30秒", "60秒", "90秒"]
                str += "准备时间" + secondList[rule.play.ready_timeout_option] + " "
            }
            if (rule.trustee.second_opt >= 0) {
                var secondList = ["30秒", "60秒", "120秒"]
                str += secondList[rule.trustee.second_opt] + "托管"
                if (rule.room.auto_dismiss)
                    str += " 托管" + rule.room.auto_dismiss.trustee_round + "局"
                else
                    str += " 托管到底"
            }
        }
        else if (info.gameType == GAME_TYPE.SCPDK) {
            if (rule.play.zhuang.normal_round == 0)
                str += "赢家先出 "
            if (rule.play.zhuang.normal_round == 2)
                str += "黑五先出 "
            if (rule.play.first_discard && rule.play.first_discard.with_5)
                str += "首出必带黑五 "
            if (rule.play.bomb_type_option == 0)
                str += "3,4张算炸弹 "
            if (rule.play.bomb_type_option == 1)
                str += "4张算炸弹 "
            if (rule.play.bomb_type_option == 2)
                str += "不带炸弹 "
            if (rule.play.bomb_type_option == 0) {
                str += "3炸" + rule.play.bomb_score[0] + "分 "
                str += "4炸" + rule.play.bomb_score[1] + "分 "
            }
            if (rule.play.bomb_type_option == 1) {
                str += "4炸" + rule.play.bomb_score[1] + "分 "
            }
            if (rule.play.zha_niao)
                str += "红十扎鸟 "
            if (rule.play.lai_zi)
                str += "有癞子 "
            if (rule.play.zi_mei_dui)
                str += "姊妹对 "
            if (rule.play.fan_chun != false)
                str += "反春 "
            if (rule.play.lastone_not_consume)
                str += "剩一张不输分 "
            if (rule.play.que_yi_se)
                str += "缺一色 "
            if (rule.play.special_score > 0)
                str += "全黑，全红，全大，全小，全单，全双加" + rule.play.special_score + "分 "
            if (rule.room.dismiss_all_agree)
                str += "所有人同意才解散 "
            if (rule.play.must_discard)
                str += "能出必出 "
            if (rule.option.ip_stop_cheat)
                str += "IP防作弊 "
            if (rule.option.gps_distance > 0)
                str += "GPS防作弊 "
            if (rule.option.hand_ready)
                str += "手动准备 "
            if (rule.option.block_hu_dong)
                str += "禁止互动 "
            if (rule.option.request_dismiss == false)
                str += "禁止解散 "
            if (rule.play.ready_timeout_option >= 0) {
                var secondList = ["10秒", "15秒", "30秒", "60秒", "90秒"]
                str += "准备时间" + secondList[rule.play.ready_timeout_option] + " "
            }
            if (rule.trustee.second_opt >= 0) {
                var secondList = ["30秒", "60秒", "120秒"]
                str += secondList[rule.trustee.second_opt] + "托管"
                if (rule.room.auto_dismiss)
                    str += " 托管" + rule.room.auto_dismiss.trustee_round + "局"
                else
                    str += " 托管到底"
            }
        }
        else if (info.gameType == GAME_TYPE.DDZ) {
            if (rule.play.call_landlord)
                str += "叫地主 "
            if (rule.play.call_score)
                str += "叫分 "
            if (rule.play.must_discard)
                str += "能出必出 "
            if (rule.play.random_call)
                str += "随机首叫 "
            if (rule.play.san_da_must_call)
                str += "三大必抓 "
            if (rule.play.si_dai_er)
                str += "可四带二 "
            if (rule.play.san_dai_er)
                str += "可三带二 "
            if (rule.play.san_zhang)
                str += "可三张 "
            if (rule.room.dismiss_all_agree)
                str += "所有人同意才解散 "
            if (rule.option.ip_stop_cheat)
                str += "IP防作弊 "
            if (rule.option.gps_distance > 0)
                str += "GPS防作弊 "
            if (rule.option.hand_ready)
                str += "手动准备 "
            if (rule.option.block_hu_dong)
                str += "禁止互动 "
            if (rule.option.request_dismiss == false)
                str += "禁止解散 "
            if (rule.play.ready_timeout_option >= 0) {
                var secondList = ["10秒", "15秒", "30秒", "60秒", "90秒"]
                str += "准备时间" + secondList[rule.play.ready_timeout_option] + " "
            }
            if (rule.trustee.second_opt >= 0) {
                var secondList = ["30秒", "60秒", "120秒"]
                str += secondList[rule.trustee.second_opt] + "托管"
                if (rule.room.auto_dismiss)
                    str += " 托管" + rule.room.auto_dismiss.trustee_round + "局"
                else
                    str += " 托管到底"
            }
        }
        else if (info.gameType == GAME_TYPE.ZJH) {
            var ren = [2, 3, 4, 5, 6]
            var men = [0, 1, 2, 3, 5]
            var lun = [8, 10, 12]
            str += "底分:" + rule.play.base_score + "分"
            if (rule.room.min_gamer_count >= 0) {
                if (rule.room.owner_start == true)
                    str += " 房主开桌"
                else
                    str += " 满" + ren[rule.room.min_gamer_count] + "人开"
            }
            str += " 轮数:" + lun[rule.play.max_turn_option] + "轮"
            if (rule.play.men_turn_option > 0)
                str += " 闷圈:" + men[rule.play.men_turn_option] + "圈 "
            else
                str += " 不闷圈 "
            if (rule.play.can_add_score_in_men_turns && rule.play.men_turn_option > 0)
                str += "必闷可加注 "
            if (rule.play.lose_compare_first)
                str += "先比为输 "
            if (rule.play.base_men_score)
                str += "闷注:" + rule.play.base_men_score + "分 "
            if (rule.play.color_compare)
                str += "黑红梅方 "
            if (rule.play.bonus_shunjin)
                str += "顺金收喜 "
            if (rule.play.bonus_bao_zi)
                str += "豹子收喜 "
            if (rule.play.baozi_less_than_235)
                str += "235>豹子 "
            if (rule.play.small_A23)
                str += "A23<234 "
            if (rule.play.double_compare)
                str += "双倍比牌 "
            if (rule.play.show_card)
                str += "公布底牌 "
            if (rule.option.block_hu_dong)
                str += "禁止互动 "
            if (rule.option.block_voice)
                str += "禁止语音 "
            if (rule.play.continue_game)
                str += "大局连开 "
            if (rule.option.request_dismiss == false)
                str += "禁止解散 "
            if (rule.play.ready_timeout_option >= 0) {
                var secondList = ["5秒", "10秒", "15秒", "30秒", "60秒", "90秒"]
                str += "准备时间" + secondList[rule.play.ready_timeout_option] + " "
            }
            if (rule.trustee.second_opt >= 0) {
                var secondList = ["5秒", "10秒", "15秒", "30秒", "45秒"]
                str += secondList[rule.trustee.second_opt] + "托管 "
                if (rule.play.trustee_drop)
                    str += "超时弃牌"
                else if (rule.play.trustee_follow)
                    str += "超时跟注"

            }
        }
        else if (info.gameType == GAME_TYPE.NN) {
            var ren = [2, 3, 4, 5, 6]
            if (rule.room.min_gamer_count >= 0) {
                if (rule.room.owner_start == true)
                    str += " 房主开桌 "
                else
                    str += " 满" + ren[rule.room.min_gamer_count] + "人开 "
            }
            if (rule.play.call_banker)
                str += "明牌抢庄 "
            if (rule.play.no_banker_compare)
                str += "无庄通比 "
            if (rule.play.banker_take_turn)
                str += "轮流坐庄 "
            if (rule.play.call_banker_times > 0 && rule.play.call_banker)
                str += "抢庄倍数" + rule.play.call_banker_times + "倍 "
            if (rule.play.an_pai_option >= 0) {
                var anPaiList = ["全暗", "暗一", "暗二", "暗三", "暗四"]
                str += anPaiList[rule.play.an_pai_option] + " "
            }
            if (rule.play.base_score && rule.play.base_score.length > 0) {
                var desc = rule.play.base_score.join(",")
                str += "底分:(" + desc + ")  【"
            }
            for (var i = 0; i < 29; i++) {
                if (rule.play.ox_times[i] >= 2) {
                    str += OX_CARD_TYPE_TO_NAME[i] + ":" + rule.play.ox_times[i] + "倍 "
                }
            }

            if (rule.play.continue_game)
                str += "】 大局连开 "
            if (rule.option.block_hu_dong)
                str += "禁止互动 "
            if (rule.option.block_voice)
                str += "禁止语音 "
            if (rule.option.request_dismiss == false)
                str += "禁止解散 "
            if (rule.play.ready_timeout_option >= 0) {
                var secondList = ["5秒", "10秒", "15秒", "30秒", "60秒", "90秒"]
                str += "准备时间" + secondList[rule.play.ready_timeout_option] + " "
            }
            if (rule.trustee.second_opt >= 0) {
                var secondList = ["5秒", "10秒", "15秒", "30秒", "45秒"]
                str += secondList[rule.trustee.second_opt] + "超时 "
            }

        }
        else if (info.gameType == GAME_TYPE.ZGCP) {
            let fanShu = ["3番 ", "4番 ", "不封顶 "]
            str += fanShu[rule.fan.max_option]
            if (rule.fan.max_option == 1) {
                let chaoFan = ["不加底 ", "+1 ", "+2 ", "+5 ", "+10 "]
                str += "超番" + chaoFan[rule.fan.chaoFan]
            }

            if (rule.play.chi_piao)
                str += "吃飘 "
            if (rule.room.dismiss_all_agree)
            str += "所有人同意才解散 "
            if (rule.option.ip_stop_cheat)
                str += "IP防作弊 "
            if (rule.option.gps_distance > 0)
                str += "GPS防作弊 "
            if (rule.option.hand_ready)
                str += "手动准备 "
            if (rule.option.block_hu_dong)
                str += "禁止互动 "
            if (rule.option.request_dismiss == false)
                str += "禁止解散 "
            if (rule.play.ready_timeout_option >= 0) {
                var secondList = ["10秒", "15秒", "30秒", "60秒", "90秒"]
                str += "准备时间" + secondList[rule.play.ready_timeout_option] + " "
            }
            if (rule.trustee.second_opt >= 0) {
                var secondList = ["30秒", "60秒", "120秒"]
                str += secondList[rule.trustee.second_opt] + "托管"
                if (rule.room.auto_dismiss)
                    str += " 托管" + rule.room.auto_dismiss.trustee_round + "局"
                else
                    str += " 托管到底"
            }

        }
        if (str == "玩法：")
            str += "无";
        return str;
    }

    public static pdkWenDingSort(cards) {
        //接下来我们用冒泡排序的方法来给这个数组排序
        for (let i = 0; i < cards.length - 1; i++) {
            for (let j = 0; j < cards.length - 1 - i; j++) {
                if (Utils.getPdkCardValue(cards[j]) < Utils.getPdkCardValue(cards[j + 1])) {
                    //如果这一项比后一项大就交换位置了
                    let tmp = cards[j]
                    cards[j] = cards[j + 1]
                    cards[j + 1] = tmp
                }
            }
        }
    }

    public static sortWithLaiZi(cards, reverse = false) {
        var commonList = []
        var laiZiList = []
        for (var cardId of cards) {
            if (Math.floor(cardId / 20) == 4)
                laiZiList.push(cardId)
            else
                commonList.push(cardId)
        }
        if (laiZiList.length > 0) {
            if (reverse)
                return commonList.concat(laiZiList)
            else
                return laiZiList.concat(commonList)
        }
        else
            return cards
    }

    public static getLaiZiList(tagetList, laiZiValue) {
        if (laiZiValue == 0)
            return []
        var result = []
        for (var card of tagetList) {
            if (Utils.getPdkCardValue(card) == laiZiValue)
                result.push(card)
        }
        return result
    }

    public static getOutLaiZiList(tagetList, laiZiValue) {
        if (laiZiValue == 0)
            return tagetList
        var result = []
        for (var card of tagetList) {
            if (Utils.getPdkCardValue(card) != laiZiValue)
                result.push(card)
        }
        return result
    }


    public static standupByReason(reason) {
        var str = ""
        if (reason == STANDUP_REASON.STANDUP_REASON_ADMIN_DISMISS_FORCE)
            str = "房间被管理员或群主解散"
        else if (reason == STANDUP_REASON.STANDUP_REASON_TABLE_TIMEOUT)
            str = "房间超过最大存在时间，已解散"
        else if (reason == STANDUP_REASON.STANDUP_REASON_NO_READY_TIMEOUT)
            str = "超时未准备，被踢出"
        else if (reason == STANDUP_REASON.STANDUP_REASON_MAINTAIN)
            str = "游戏即将维护，房间解散"
        else if (reason == STANDUP_REASON.STANDUP_REASON_BLOCK_GAMING)
            str = "您被禁止游戏，请联系群主处理"
        else if (reason == STANDUP_REASON.STANDUP_REASON_CLUB_CLOSE)
            str = "群打烊中，房间解散"
        else if (reason == STANDUP_REASON.STANDUP_REASON_FORCE)
            str = "您被踢出房间"
        else if (reason == STANDUP_REASON.STANDUP_REASON_DELAY_KICKOUT_TIMEOUT)
            str = "离线时间过长，被踢出房间"
        else if (reason == STANDUP_REASON.STANDUP_REASON_LESS_ROOM_FEE)
            str = "房卡不足，房间解散"
        else if (reason == STANDUP_REASON.STANDUP_REASON_BANKRUPCY)
            str = "您的分数不足，从房间离开"
        else if (reason == STANDUP_REASON.STANDUP_REASON_DISMISS_TRUSTEE)
            str = "有玩家托管局数过多，房间解散"
        if (str != "")
            GameManager.getInstance().openWeakTipsUI(str);
    }

    public static getRecordDismissReason(reason) {
        var str = ""
        if (reason == STANDUP_REASON.STANDUP_REASON_ADMIN_DISMISS_FORCE)
            str = "被管理员或群主解散"
        else if (reason == STANDUP_REASON.STANDUP_REASON_TABLE_TIMEOUT)
            str = "超时解散"
        else if (reason == STANDUP_REASON.STANDUP_REASON_NO_READY_TIMEOUT)
            str = "超时未准备"
        else if (reason == STANDUP_REASON.STANDUP_REASON_MAINTAIN)
            str = "游戏维护"
        else if (reason == STANDUP_REASON.STANDUP_REASON_BLOCK_GAMING)
            str = "禁止游戏"
        else if (reason == STANDUP_REASON.STANDUP_REASON_CLUB_CLOSE)
            str = "圈打烊"
        else if (reason == STANDUP_REASON.STANDUP_REASON_FORCE)
            str = "踢出房间"
        else if (reason == STANDUP_REASON.STANDUP_REASON_DELAY_KICKOUT_TIMEOUT)
            str = "离线过长"
        else if (reason == STANDUP_REASON.STANDUP_REASON_LESS_ROOM_FEE)
            str = "房卡不足"
        else if (reason == STANDUP_REASON.STANDUP_REASON_BANKRUPCY)
            str = "分数不足"
        else if (reason == STANDUP_REASON.STANDUP_REASON_DISMISS_TRUSTEE)
            str = "托管解散"
        else if (reason == STANDUP_REASON.STANDUP_REASON_DISMISS_REQUEST)
            str = "申请解散"
        return str
    }

    public static isEasyPassword(password: string) {
        var easyPasswordList = ["123456", "1234567", "12345678", "123456789", "654321", "7654321",
            "87654321", "987654321"]
        for (var i = 0; i <= 9; i++) {
            for (var j = 6; j <= 9; j++) {
                var easyList = ""
                for (var k = 0; k < j; k++) {
                    easyList += i
                }
                easyPasswordList.push(easyList)
            }
        }
        if (easyPasswordList.indexOf(password) >= 0)
            return true
        else
            return false
    }

    public static pushStackToServer(type, content, stack = true) {
        try {
            //a = 4
        }
        catch (e) {
            if (stack)
                content = content + " stack:" + e.stack
            GameManager.getInstance().onErrorHandler(null, null, type, content)
        }
    }

    public static isPhoneX() {
        if (cc.sys.isNative && cc.sys.platform == cc.sys.IPHONE) {
            var size = cc.view.getFrameSize();
            if (size.width == 812 && size.height == 375)
                return 1
            else if (size.width == 896 && size.height == 414)
                return 2
            else if (size.width == 896 && size.height == 414)
                return 3
            else if (size.width == 844 && size.height == 390)
                return 4
            else
                return 0
        }
        return 0
    }


}