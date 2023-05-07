import { SdkManager } from './../../framework/Utils/SdkManager';
import { Utils } from './../../framework/Utils/Utils';
import { LoginUI } from './LoginUI';
import { GameDataManager } from './../../framework/Manager/GameDataManager';
import { StringData } from './../data/StringData';
import { ConstValue } from './../data/GameConstValue';
import { MessageManager } from './../../framework/Manager/MessageManager';
import { ListenerManager } from './../../framework/Manager/ListenerManager';
import { GameManager } from './../GameManager';
import { BaseUI } from "../../framework/UI/BaseUI";
import * as GameConstValue from "../data/GameConstValue";
import { LogWrap } from "../../framework/Utils/LogWrap";
import { UIManager } from "../../framework/Manager/UIManager";
import { AudioManager } from "../../framework/Manager/AudioManager";
import * as Proto from "../../proto/proto-min";

const { ccclass, property } = cc._decorator;

@ccclass
export class PhoneVerifyUI extends BaseUI {

    protected static className = "PhoneVerifyUI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_SYSTEM_DIR + this.className;
    }

    @property(cc.EditBox)
    phoneNumEdit: cc.EditBox = null;

    @property(cc.EditBox)
    firstCodeEdit: cc.EditBox = null;

    @property(cc.EditBox)
    secondCodeEdit: cc.EditBox = null;

    @property(cc.Label)
    sendLabel: cc.Label = null;


    private phoneNum = ""
    private time = 0

    start() {
        // ListenerManager.getInstance().add(Proto.SC_RequestSmsVerifyCode.MsgID.ID, this, this.onVerifyRec);
        ListenerManager.getInstance().add(Proto.SC_RequestBindPhone.MsgID.ID, this, this.onBindMsgRec);
    }

    initUI(type) { // type 1.登录  2.绑定
        //初始化位置
        // this.sendLabel.string = "发送"
        // this.time = 60
        // this.node.getChildByName("btn_send").getComponent(cc.Button).interactable = true;
    }

    // loop()
    // {   
    //     if (this.time > 0)
    //     {
    //         this.time -= 1
    //         this.sendLabel.string =  "已发送" + this.time + "s"
    //     }
    //     else
    //     {
    //         this.unschedule(this.loop)
    //         this.sendLabel.string = "发送"
    //         this.node.getChildByName("btn_send").getComponent(cc.Button).interactable = true;
    //     }
    // }

    public setBtnVisible(type,where = "default")
    {
        if (type == "login")
        {
            this.node.getChildByName("btn_login").active = true
            this.node.getChildByName("btn_close").active = true
            this.node.getChildByName("label_1").getComponent(cc.Label).string = "账号："
            this.phoneNumEdit.placeholder = "请输入游戏ID或者手机号"
            // this.node.getChildByName("tips_1").active = true
            this.node.getChildByName("btn_password").active = true

        }
        else
        {
            // this.node.getChildByName("btn_close").active = where == "hall"
            this.phoneNumEdit.placeholder = "可以不用填写"
            this.node.getChildByName("btn_close").active = true
            this.node.getChildByName("btn_bind").active = true
            this.node.getChildByName("lable_tips").active = true
            this.node.getChildByName("editbox_2").active = true
            this.node.getChildByName("label_2").active = true
            this.node.getChildByName("btn_password").active = false
            
        }   
    }

    // private onVerifyRec(msg) // 验证码回复
    // {
    //     if (msg.result != 0)
    //     {
    //         GameManager.getInstance().openWeakTipsUI(StringData.getString(msg.result));
    //     }
    //     else
    //     {
    //         this.phoneNum = msg.phoneNumber
    //     }
    //     this.node.getChildByName("btn_send").getComponent(cc.Button).interactable = false;
    //     this.sendLabel.string = "已发送"+msg.timeout+"s"
    //     this.time = msg.timeout
    //     this.schedule(this.loop, 1, msg.timeout);
    //     MessageManager.getInstance().disposeMsg();
    // }

    private onBindMsgRec(msg)
    {
        GameDataManager.getInstance().loginInfoData.phone = msg.phoneNumber
        GameManager.getInstance().openWeakTipsUI("绑定成功");
        MessageManager.getInstance().disposeMsg();
        UIManager.getInstance().closeUI(PhoneVerifyUI);
    }

    // checkVerifyStr()
    // {
    //     var verifyStr = this.verifyEdit.string
    //     if (verifyStr == "")
    //     {
    //         GameManager.getInstance().openWeakTipsUI("验证码不可为空");
    //         return false
    //     }
    //     return true
    // }
    checkFistEdit()
    {
        var firstStr = this.firstCodeEdit.string
        if (firstStr == "")
        {
            GameManager.getInstance().openWeakTipsUI("密码不可为空");
            return false
        }
        return true
    }

    checkSecondEdit()
    {
        var secondStr = this.secondCodeEdit.string
        var firstStr = this.firstCodeEdit.string

        if (secondStr == "")
        {
            GameManager.getInstance().openWeakTipsUI("确认密码不能为空");
            return false
        }
        if (secondStr != firstStr)
        {
            GameManager.getInstance().openWeakTipsUI("两次密码不一致");
            return false
        }
        return true
    }

    button_verify() // 获取验证码入口
    {
        var phoneNum = this.phoneNumEdit.string
        if (phoneNum.length != 11)
        {
            GameManager.getInstance().openWeakTipsUI("错误的手机号");
            return
        }
        MessageManager.getInstance().messageSend(Proto.CS_RequestSmsVerifyCode.MsgID.ID, {phoneNumber: phoneNum});

    }

    button_bind() {
        AudioManager.getInstance().playSFX("button_click");
        var phoneNum = this.phoneNumEdit.string
        if (!this.checkFistEdit())
            return
        if (!this.checkSecondEdit())
            return
        var firstStr = this.firstCodeEdit.string
        if (firstStr.length < 6)
        {
            GameManager.getInstance().openWeakTipsUI("密码长度不得低于6位");
            return
        }
        var isEasyPassword= Utils.isEasyPassword(firstStr)
        if (isEasyPassword)
        {
            GameManager.getInstance().openWeakTipsUI("密码过于简单");
            return
        }
        let re = /^\w+$/;
        if(!re.test(firstStr)) {
            GameManager.getInstance().openWeakTipsUI("用户名必须只包含字母、数字和下划线！");
            return
        }
        re = /[0-9]/;
        if(!re.test(firstStr)) {
            GameManager.getInstance().openWeakTipsUI("密码必须包含至少一个数字(0至9)!");
            return false;
        }
        re = /[a-z]/;
        if(!re.test(firstStr)) {
            GameManager.getInstance().openWeakTipsUI("密码必须包含至少一个小写字母(a-z)!");
            return false;
        }
        // re = /[A-Z]/;
        // if(!re.test(firstStr)) {
        //     GameManager.getInstance().openWeakTipsUI("密码必须包含至少一个大写字母(A-Z)!");
        //     return false;
        // }
        if (phoneNum.length == 11)
            MessageManager.getInstance().messageSend(Proto.CS_RequestBindPhone.MsgID.ID, {phoneNumber:phoneNum, password:firstStr});
        else
            MessageManager.getInstance().messageSend(Proto.CS_RequestBindPhone.MsgID.ID, {password:firstStr});
            
    }

    button_login() {
        AudioManager.getInstance().playSFX("button_click");
        if (!this.checkFistEdit())
            return
        var account = this.phoneNumEdit.string
        var phoneType = ""
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            phoneType = "Android"

        } else if (cc.sys.os == cc.sys.OS_IOS) {
            phoneType = "Ios"
        } else {
            phoneType = "H5"
        }
        var promoter = 0
        var channelId = ""
        if (GameDataManager.getInstance().systemData.shareSid != "" && GameDataManager.getInstance().systemData.shareData != "")
        {
            try
            {
                var oMsg = JSON.parse(GameDataManager.getInstance().systemData.shareData)
                promoter = oMsg.data.params.promoter
                channelId = oMsg.data.params.channel_id
            }
            catch(e)
            {
                console.log(e)
            }
        }

        var mima = this.firstCodeEdit.string
        var imei = SdkManager.getInstance().doGetNativeUniqueId()
        if (mima.length < 6)
        {
            GameManager.getInstance().openWeakTipsUI("密码长度不得低于6位");
            return
        }
        var isEasyPassword= Utils.isEasyPassword(mima)
        if (isEasyPassword)
        {
            GameManager.getInstance().openWeakTipsUI("不允许使用过于简单的密码登录");
            return
        }
        let msgb = {
            account: account,    // 账号
            password: mima,     // 密码
            phone: "",      // 手机型号
            phoneType: phoneType,  // 手机类型
            imei: imei,       // 设备唯一码
            ip: ConstValue.NET_IP,         // 客户端ip
            version: ConstValue.VERSION, // 版本号
            channelId: channelId,      // 渠道号
            packageName: ConstValue.PACKAGE_NAME, // 安装包名字
            ipArea: "",          // 客户端ip地区
            platformId: "",      // 平台id
            openId: "",  // 唯一开放id
            smsVerifyNo: "", // 玩家输入的验证码
            promoter:promoter,
        }
        GameDataManager.getInstance().loginInfoData.isAccountLogin = true
        MessageManager.getInstance().messageSend(Proto.CL_Login.MsgID.ID, msgb);
        UIManager.getInstance().closeUI(PhoneVerifyUI);
        if (UIManager.getInstance().getUI(LoginUI))
            UIManager.getInstance().getUI(LoginUI).getComponent("LoginUI").onLogining()
    }

    btn_close()
    {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().closeUI(PhoneVerifyUI);
    }
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
}
