import { ConstValue } from './../../scripts/data/GameConstValue';
import { LogWrap } from "./LogWrap";
import { GameDataManager } from "../Manager/GameDataManager";
import { GameManager } from "../../scripts/GameManager";
import { HttpManager } from "../Manager/HttpManager";
import * as GameConstValue from "../../scripts/data/GameConstValue";
import { StringData } from "../../scripts/data/StringData";
import { Utils } from "./Utils";


export class SdkManager {

    private static instance: SdkManager;
    public static getInstance(): SdkManager {
        if (this.instance == null)
            this.instance = new SdkManager();

        return this.instance;
    }

    //老包
    //private ANDROID_API = "com/dyscyjoid/org/SDKAPI";
    //新包
    private ANDROID_API = ConstValue.NEW_VERSION ? "com/shmmpjfd/org/SDKAPI":"com/dyscyjoid/org/SDKAPI";
    private IOS_API = "AppController";
    private _isCapturing: boolean = false;
    private location_num: number = 3

    //------------------------------------------微信-------------------------------------------//

    //微信登录
    doWeChatLogin() {
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod(this.ANDROID_API, "Login", "()V");
        } else if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod(this.IOS_API, "login");
        } else {
            LogWrap.log("platform:" + cc.sys.os + " dosn't wx login.");
        }
    }

    getBaoMing(){
       if (cc.sys.os == cc.sys.OS_IOS) {
            let bm = jsb.reflection.callStaticMethod(this.IOS_API, "baoming");
            if(bm != null && bm != undefined)
            {
                GameConstValue.ConstValue.PACKAGE_NAME = bm
            }
        } 
     
    }


    /**
     * 微信支付
     *  partnerId  商户号
     *  prepayId
     *  packageValue Sign=WXPay
     *  nonceStr 随机字符串
     *  timeStamp 时间戳
     *  sign 应用签名
     */
    doWeiChatPay(partnerId, prepayId, packageValue, nonceStr, timeStamp, sign) {
        if (!cc.sys.isNative) {
            return;
        }
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod(this.ANDROID_API, "doWeiChatPay", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V",
                partnerId, prepayId, packageValue, nonceStr, timeStamp, sign);
        } else if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod(this.IOS_API, "doWeiChatPay:prepayId:packageValue:nonceStr:timeStamp:sign:",
                partnerId, prepayId, packageValue, nonceStr, timeStamp, sign);
        } else {
            LogWrap.log("platform:" + cc.sys.os + " dosn't pay.");
        }
    }

    /**
    * 微信分享文字
    *  "0" 是微信好友 "1" 微信朋友圈
    */
    doShareText(thirdType: GameConstValue.THIRD_TYPE, title, desc, shareType) {
        if (!cc.sys.isNative) {
            return;
        }
        let fullPath = jsb.fileUtils.getWritablePath() + 'Icon.png';;
        if (thirdType == GameConstValue.THIRD_TYPE.WX) {
            if (cc.sys.os == cc.sys.OS_ANDROID) {
                jsb.reflection.callStaticMethod(this.ANDROID_API, "Share", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V",
                    this.getUrl(), title, desc, shareType, fullPath);
            } else if (cc.sys.os == cc.sys.OS_IOS) {
                jsb.reflection.callStaticMethod(this.IOS_API, "share:shareTitle:shareDesc:type:", this.getUrl(), title, desc, shareType);
            } else {
                LogWrap.log(this.getUrl());
                LogWrap.log("platform:" + cc.sys.os + " dosn't implement share.");
            }
        }
    }

    /**
    * 微信图片分享
    */
    // doShareImge(thirdType: GameConstValue.THIRD_TYPE, shareType: number, parent: cc.Node) {
    //     LogWrap.log("doWeiChatShareImge");
    //     if (this._isCapturing) {
    //         return;
    //     }
    //     if (!cc.sys.isNative) {
    //         return;
    //     }

    //     this._isCapturing = true;
    //     let node = new cc.Node();
    //     node.parent = cc.director.getScene();
    //     node.width = parent.getContentSize().width;
    //     node.height = parent.getContentSize().height;
    //     node.position = cc.v3(node.width / 2, node.height / 2);
    //     let camera = node.addComponent(cc.Camera);

    //     // 新建一个 RenderTexture，并且设置 camera 的 targetTexture 为新建的 RenderTexture，这样 camera 的内容将会渲染到新建的 RenderTexture 中。
    //     let texture = new cc.RenderTexture();
    //     // 如果截图内容中不包含 Mask 组件，可以不用传递第三个参数
    //     let gl = cc.game["_renderContext"];
    //     texture.initWithSize(node.width, node.height, gl.STENCIL_INDEX8);
    //     camera.targetTexture = texture;

    //     // 渲染一次摄像机，即更新一次内容到 RenderTexture 中
    //     parent.scaleY = -1;
    //     camera.render(node.parent);
    //     parent.scaleY = 1;

    //     // 这样我们就能从 RenderTexture 中获取到数据了
    //     let data = texture.readPixels();
    //     let width = texture.width;
    //     let height = texture.height;
    //     LogWrap.log(data,width, height, "doShareImge--------")
    //     let fullPath = jsb.fileUtils.getWritablePath() + 'Image.png';
    //     if (jsb.fileUtils.isFileExist(fullPath)) {
    //         jsb.fileUtils.removeFile(fullPath);
    //     }
    //     jsb.saveImageData(data, width, height, fullPath);
    //     let tryTimes = 0;
    //     let self = this;
    //     let fn = function () {
    //         if (jsb.fileUtils.isFileExist(fullPath)) {
    //             if (thirdType == GameConstValue.THIRD_TYPE.WX) {
    //                 if (cc.sys.os == cc.sys.OS_ANDROID) {
    //                     jsb.reflection.callStaticMethod(self.ANDROID_API, "ShareIMG", "(Ljava/lang/String;IILjava/lang/String;)V", fullPath, width, height, shareType);
    //                 } else if (cc.sys.os == cc.sys.OS_IOS) {
    //                     jsb.reflection.callStaticMethod(self.IOS_API, "shareIMG:type:", fullPath, shareType);
    //                 } else {
    //                     console.log("platform:" + cc.sys.os + " dosn't implement share.");
    //                 }
    //             }
    //             self._isCapturing = false;
    //         } else {
    //             tryTimes++;
    //             if (tryTimes > 10) {
    //                 console.log("time out...");
    //                 return;
    //             }
    //             setTimeout(fn, 50);
    //         }
    //     }
    //     setTimeout(fn, 50);
    // }

    //微信登录回调
    onLoginResp(msg) {
        if (!cc.sys.isNative) {
            return;
        }
        if (cc.sys.os == cc.sys.OS_IOS) {
            msg = JSON.parse(msg);
        }
        //获取到微信code,然后将code 传入http接口，接口返回玩家信息
        // let msginfo = { Code: msg.data };
        // GameDataManager.getInstance().setLoginInfo("wx", msg.data);
        GameManager.getInstance().importWxInfo(msg.data);
        // 之前客户端授权，现在改用服务端授权
        // HttpManager.getInstance().post(GameConstValue.ConstValue.WX_LOGIN_PLAYER_INFO_URL, "", null, JSON.stringify(msginfo),
        //     (error, ret) => {
        //         if (ret) {
        //             let loginInfo = JSON.parse(ret);
        //             if (loginInfo.Code != 0)
        //                 GameManager.getInstance().openWeakTipsUI(loginInfo.Msg);
        //             else {
        //                 GameDataManager.getInstance().setWxUserInfoData(JSON.parse(loginInfo.Data));
        //                 GameManager.getInstance().connectSocket();
        //             }
        //         }
        //     });

    }


    onLocationResp(msg) {
        LogWrap.log("gps返回:", JSON.stringify(msg))
        if (cc.sys.os == cc.sys.OS_IOS) {
            msg = JSON.parse(msg);
        }
        GameDataManager.getInstance().gpsData = msg
        try {
            if (msg.jingdu < 0 || msg.weidu < 0) {
                if (msg.reason) {
                    GameManager.getInstance().openWeakTipsUI("未能获取gps，" + msg.reason);
                }

                GameDataManager.getInstance().gpsData = null
                this.location_num--
                if (this.location_num > 0) {
                    this.doGetLocation()
                }
                return
            }
            this.location_num = 3
            msg.date = new Date().getTime()
            var successGps = JSON.stringify(msg)
            cc.sys.localStorage.setItem("gpsdata", successGps);
        }
        catch (e) { }

    }

    // 通知原生平台此时玩家已经登录完毕，原生端会将url分享的一些东西传过来
    onPlayerLoadFinish() {
        if (!cc.sys.isNative) {
            console.log("不是原生平台")
            return;
        }
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            if(ConstValue.NEW_VERSION){
                jsb.reflection.callStaticMethod("com/shmmpjfd/org/SDKAPI", "onPlayerLoadFinish", "()V");
            }else{
                jsb.reflection.callStaticMethod("com/dyscyjoid/org/SDKAPI", "onPlayerLoadFinish", "()V");
            }            
        } else if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod("AppController", "onPlayerLoadFinish");
        } else {
            console.log("未知平台")
        }
    }

    onWebShareRec(msg) {
        if (cc.sys.os == cc.sys.OS_IOS) {
            msg = JSON.parse(msg);
        }
        var para = { sid: msg.data.slice(4, msg.data.length) }
        HttpManager.getInstance().post(ConstValue.SHARE_RESULT_REP, "", null, JSON.stringify(para),
            (error, ret) => {
                if (ret) {
                    GameManager.getInstance().onWebShareRec(msg.data.slice(4, msg.data.length), ret)
                }
            });
    }


    // 获得剪切板数据
    doNativeGetCopyText() {
        var text = ""
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            text = jsb.reflection.callStaticMethod(this.ANDROID_API, "doAndroidGetClipbordText", "()Ljava/lang/String;");
        } else if (cc.sys.os == cc.sys.OS_IOS) {
            text = jsb.reflection.callStaticMethod("AppController", "doIosGetClipbordText");
        } else {
            LogWrap.log("platform:" + cc.sys.os + " dosn't implement share.");
        }
        return text
    }

    registerWxNativeData(appId, appSecret) {
        // 暂时不用
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod(this.ANDROID_API, "registerWxData", "(Ljava/lang/String;Ljava/lang/String;)V", appId, appSecret);
        }
        else {
            LogWrap.log("platform:" + cc.sys.os + " dosn't implement share.");
        }
    }

    //获取设备唯一标识
    doGetNativeUniqueId() {
        let uniqueId = "";
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            uniqueId = jsb.reflection.callStaticMethod(this.ANDROID_API, "getUniqueAndroidIdentity", "()Ljava/lang/String;");
        } else if (cc.sys.os == cc.sys.OS_IOS) {
            uniqueId = jsb.reflection.callStaticMethod(this.IOS_API, "getUniqueIosIdentity");
        } else {
            //LogWrap.log("platform:" + cc.sys.os + " dosn't implement BatteryLevel.");
        }
        return uniqueId;
    }

    //分享地址gameurl
    getUrl() {
        return "https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxfa1d6102ff520839" +
            "&redirect_uri=http%3A%2F%2Fcfqpnew.geekyoyo.com%2Fagent%2Fuser%2Fwxlogin%3FplayerId%3D" + GameDataManager.getInstance().userInfoData.userId +
            "&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect";
    }

    getXLUrl() {
        return "https://open.xianliao.updrips.com/connect/oauth2/authorize?appid=wxfa1d6102ff520839" +
            "&redirect_uri=http%3A%2F%2Fcfqpnew.geekyoyo.com%2Fagent%2Fuser%2Fxllogin%3FplayerId%3D" + GameDataManager.getInstance().userInfoData.userId +
            "&response_type=code&state=STATE#xianliao_redirect";
    }

    //--------------------系统函数--------------------------------------------
    //复制文本
    doNativeCopyClipbordText(text, respStr = "复制信息成功！") {
        if (text == null || text == "" || (typeof text !== "string")) {
            text = "复制文本";
        }
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod(this.ANDROID_API, "doAndroidCopyClipbordText", "(Ljava/lang/String;)V", text);
        } else if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod(this.IOS_API, "doiOSCopyClipbordText:", text);
        } else {
            LogWrap.log("platform:" + cc.sys.os + " dosn't implement share.");
        }
        GameManager.getInstance().openWeakTipsUI(respStr);
    }

    //获取电量 0.0-1.0
    doGetNativeBatteryLevel() {
        let fLevel = 0;
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            fLevel = jsb.reflection.callStaticMethod(this.ANDROID_API, "getAndroidBatteryLevel", "()F");
        } else if (cc.sys.os == cc.sys.OS_IOS) {
            fLevel = jsb.reflection.callStaticMethod(this.IOS_API, "getiOSBatteryLevel");
        } else {
            //LogWrap.log("platform:" + cc.sys.os + " dosn't implement BatteryLevel.");
        }
        return fLevel;
    }

    doGetLocation() {
        if (!cc.sys.isNative) {
           // GameDataManager.getInstance().gpsData = { jingdu: Utils.reandomNumBoth(0, 180), weidu: Utils.reandomNumBoth(0, 90) }
        //    https://freegeoip.app/json
           let path = "http://ip-api.com/json"
            console.log("不是原生平台")
            HttpManager.getInstance().getHttp(path, null, (xhr: XMLHttpRequest) => {
                console.log(xhr.responseText)
                let response = JSON.parse(xhr.responseText)
                GameDataManager.getInstance().gpsData = { jingdu:response['lat'], weidu:response['lon'] }
                
            }, (status_text) => {
                console.log("failed.....................:" + status_text)
    
            })
            return;
        }
        LogWrap.log("gps请求...................")
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            if(ConstValue.NEW_VERSION){
                jsb.reflection.callStaticMethod("com/shmmpjfd/org/SDKAPI", "getLocation", "()V");
            }else{
                jsb.reflection.callStaticMethod("com/dyscyjoid/org/SDKAPI", "getLocation", "()V");
            }           
        } else if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod("AppController", "getLocation");
        } else {
            //LogWrap.log("platform:" + cc.sys.os + " dosn't implement BatteryLevel.");
        }
    }

    //检测网络
    //3 移动
    //2 联通
    //1 wifi
    checkClientNetWorkReachable() {
        // let ret = -1;
        // if (cc.sys.os == cc.sys.OS_ANDROID) {
        //     ret = jsb.reflection.callStaticMethod(this.ANDROID_API, "GetNetType", "()I");
        // } else if (cc.sys.os == cc.sys.OS_IOS) {
        //     ret = jsb.reflection.callStaticMethod(this.IOS_API, "GetNetType");
        // }
        // console.log("网络类型：" + ret);
        // return ret != -1;
        return true
    }

    //获取网络状态
    getWifiState(): number {
        if (!cc.sys.isNative) {
            //console.log("不是原生平台")
            return 3;
        }
        LogWrap.log("获取网络状态.........................")
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            return jsb.reflection.callStaticMethod(this.ANDROID_API, "getWifiState", "()I");
        } else if (cc.sys.os == cc.sys.OS_IOS) {
            return jsb.reflection.callStaticMethod(this.IOS_API, "getWifiState");
        } else {
            //LogWrap.log("platform:" + cc.sys.os + " dosn't implement BatteryLevel.");
        }
    }

    //获得外网ip
    doGetNetIp() {
        let netip = "";
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            netip = jsb.reflection.callStaticMethod(this.ANDROID_API, "getNetIp", "()Ljava/lang/String;");
        } else if (cc.sys.os == cc.sys.OS_IOS) {
            netip = jsb.reflection.callStaticMethod(this.IOS_API, "getNetIp");
        } else {
            LogWrap.log("platform:" + cc.sys.os + " dosn't implement getNetIp.");
        }
        return netip;
    }

    //振动
    doPhoneVibrate() {
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod(this.ANDROID_API, "phoneVibrate", "()V");
        } else if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod(this.IOS_API, "phoneVibrate");
        } else {
            LogWrap.log("platform:" + cc.sys.os + " dosn't vibrate.");
        }
    }

    //错误信息打印提示
    doSDKLog(msgid: number) {
        GameManager.getInstance().openWeakTipsUI(StringData.getString(msgid));
    }

    /**
* 生成图标图片
*/
    doIconImge(parent: cc.Node) {

        if (!cc.sys.isNative) {
            return;
        }

        let camera = parent.getComponent(cc.Camera);
        // 新建一个 RenderTexture，并且设置 camera 的 targetTexture 为新建的 RenderTexture，这样 camera 的内容将会渲染到新建的 RenderTexture 中。
        let texture = new cc.RenderTexture();
        // 如果截图内容中不包含 Mask 组件，可以不用传递第三个参数
        let gl = cc.game["_renderContext"];
        texture.initWithSize(108, 108, gl.STENCIL_INDEX8);
        camera.targetTexture = texture;

        // 渲染一次摄像机，即更新一次内容到 RenderTexture 中
        parent.scaleY = -1;
        camera.render(parent);
        parent.scaleY = 1;

        // 这样我们就能从 RenderTexture 中获取到数据了
        let data = texture.readPixels();
        let width = texture.width;
        let height = texture.height;
        let fullPath = jsb.fileUtils.getWritablePath() + 'Icon.png';
        if (jsb.fileUtils.isFileExist(fullPath)) {
            jsb.fileUtils.removeFile(fullPath);
        }
        jsb.saveImageData(data, width, height, fullPath);
    }

    //请求玩家的网络地址
    request_network_ip() {
        // {
        //     "rs": 1,
        //     "code": 0,
        //     "address": "泰国  曼谷 曼谷 ",
        //     "ip": "202.172.18.228",
        //     "isDomain": 0
        //   }
        let path = "https://www.ip.cn/api/index?ip=&type=0"
        if (!cc.sys.isNative) {
            let response =
            {
                "rs": 1,
                "code": 0,
                "address": "福建 泉州 泉州",
                "ip": "202.172.18.228",
                "isDomain": 0
            }
            GameConstValue.ConstValue.NET_IP = response['ip']
            GameConstValue.ConstValue.NET_ADDRESS = response['address']
            return
        }
        //let path = "https://api.ipify.org/?format=json"
        HttpManager.getInstance().getHttp(path, null, (xhr: XMLHttpRequest) => {
            console.log("sdkManager.request_network_ip",xhr.responseText)
            let response = xhr.responseText
            if(typeof xhr.responseText == "string" && xhr.responseText.indexOf("{") == 0)
            {
                response = JSON.parse(xhr.responseText)
            }
            GameConstValue.ConstValue.NET_IP = response['ip']
            GameConstValue.ConstValue.NET_ADDRESS = response['address']
            LogWrap.log("network_ip:", response['ip'] ," address:",response['address'])
            if(GameConstValue.ConstValue.NET_ADDRESS == undefined)
            {
                return
            }
            for(let i=0;i< ConstValue.regionlist.length;i++){
                if(GameConstValue.ConstValue.NET_ADDRESS.search(ConstValue.regionlist[i]) != -1)
                {
                    ConstValue.backstageUrl = ConstValue.replaceUrl
                    ConstValue.initByConfig()
                    LogWrap.log("\n--request_network_ip--ConstValue.backstageUrl:",ConstValue.backstageUrl,"\n")
                    break
                }
            }       
        }, (status_text) => {
            console.log("failed.....................:" + status_text)

        })
    }

    //是否为模拟器
    isEmulator():boolean
    {
        if (!cc.sys.isNative) {
            return false;
        }
        if (cc.sys.OS_ANDROID == cc.sys.os) {
            console.log("isEmulator")
            return jsb.reflection.callStaticMethod(this.ANDROID_API, 'isEmulator', '()Z');
        }
        //ios没有模拟器
        return false;
    }

      //获取手机基本信息
      getPhoneInfo() {
      
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            ConstValue.PHONE_INFO = jsb.reflection.callStaticMethod(this.ANDROID_API, "getPhoneInfo", "()Ljava/lang/String;");
           // LogWrap.log("phone_info:"+ConstValue.PHONE_INFO)
            return ConstValue.PHONE_INFO
        } 
        // else if (cc.sys.os == cc.sys.OS_IOS) {
        //     netip = jsb.reflection.callStaticMethod(this.IOS_API, "getPhoneInfo");
        // } else {
        //     LogWrap.log("platform:" + cc.sys.os + " dosn't implement getNetIp.");
        // }
        return "";
    }
}