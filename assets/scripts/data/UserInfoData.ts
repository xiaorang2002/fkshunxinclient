import { ListenerType } from './ListenerType';
import { LogWrap } from './../../framework/Utils/LogWrap';
import { GameDataManager } from './../../framework/Manager/GameDataManager';
import { MessageManager } from "../../framework/Manager/MessageManager";

export class UserInfoData {
    public static className = "UserInfo";

    //玩家id
    private _userId: number = 0;
    public get userId(): number {
        return this._userId;
    }
    public set userId(value: number) {
        this._userId = value;
    }

    //玩家名字
    private _userName: string = "";
    public get userName(): string {
        return this._userName;
    }
    public set userName(value: string) {
        this._userName = value;
    }

    //玩家性别
    private _userSex: number = 1; // 1男 2女
    public get userSex(): number {
        return this._userSex;
    }
    public set userSex(value: number) {
        this._userSex = value;
    }

    //玩家头像
    private _userHead: string = "";
    public get userHead(): string {
        return this._userHead;
    }
    public set userHead(value: string) {
        this._userHead = value;
    }

    //玩家openid
    private _openId: string = "";
    public get openId(): string {
        return this._openId;
    }
    public set openId(value: string) {
        this._openId = value;
    }

    //用户unionid
    private _unionId: string = "";
    public get unionId(): string {
        return this._unionId;
    }
    public set unionId(value: string) {
        this._unionId = value;
    }

    //玩家金币
    private _gold: number = 0;
    public get gold(): number {
        return this._gold;
    }
    public set gold(value: number) {
        this._gold = value;
        MessageManager.getInstance().messagePost(ListenerType.GoldChanged);
    }

    //玩家钻石
    private _diamond: number = 0;
    public get diamond(): number {
        return this._diamond;
    }
    public set diamond(value: number) {
        this._diamond = value;
        MessageManager.getInstance().messagePost(ListenerType.DiamondChanged);
    }

    //玩家房卡
    private _roomCard: number = 0;
    public get roomCard(): number {
        return this._roomCard;
    }
    public set roomCard(value: number) {
        this._roomCard = value ? value/100 : 0;
        MessageManager.getInstance().messagePost(ListenerType.RoomCardsChanged);
    }
    //玩家类型 0 普通玩家  1 代理 3 推广员
    private _playerType: number = 0;
    public get playerType(): number {
        return this._playerType;
    }
    public set playerType(value: number) {
        this._playerType = value;
    }
    //邮件
    private _mail: any = 0;
    public get mail(): any {
        return this._mail;
    }
    public set mail(value: any) {
        this._mail = value ? value : null;
        MessageManager.getInstance().messagePost(ListenerType.mailChange);
    }
    /**每日赠送金币 次数 */
    private _giveGoldTimes: number = 0;
    public get giveGoldTimes(): number {
        return this._giveGoldTimes
    }
    public set giveGoldTimes(value: number) {
        this._giveGoldTimes = value;
    }

    private _zjhAuth: boolean = false;
    public get zjhAuth(): boolean {
        return this._zjhAuth;
    }
    public set zjhAuth(value: boolean) {
        this._zjhAuth = value;
    }

    // 第三方平台授权的code
    private _loginCode: string = "";
    public get loginCode(): string {
        return this._loginCode;
    }
    public set loginCode(value: string) {
        this._loginCode = value;
    }

    private _platform: string = "";
    public get platform(): string {
        return this._platform;
    }
    public set platform(value: string) {
        this._platform = value;
    }

    public online = false;   // 是否在线标识
    public isRealCert = false;   // 是否实名认证


    //更新用户数据
    public updateUserDate(value: any) {
        this._userId = value.guid ? value.guid : this._userId;
        this._gold = value.pbBaseInfo.gold ? value.pbBaseInfo.gold : this._gold;
        this._diamond = value.pbBaseInfo.diamond ? value.pbBaseInfo.diamond : this._diamond;
        this._roomCard = value.pbBaseInfo.room_card ? value.pbBaseInfo.room_card : this._roomCard;
        this._userName = value.pbBaseInfo.nickname ? value.pbBaseInfo.nickname : this._userName;
        this._userSex = value.pbBaseInfo.sex ? value.pbBaseInfo.sex : this._userSex;
        this._userHead = value.pbBaseInfo.icon ? value.pbBaseInfo.icon : this._userHead;
        this._openId = GameDataManager.getInstance().loginInfoData.openId
        this._playerType = value.pbBaseInfo.role;
        this.isRealCert = value.pbBaseInfo.isBindPersonalId
        for (var i = 0; i< value.pbBaseInfo.money.length; i++)
        {
            if (value.pbBaseInfo.money[i].moneyId == 0)
                this.roomCard = value.pbBaseInfo.money[i].count
        } 
    }


    public setLoginInfo(platform, code)
    {
        this._platform = platform
        this._loginCode = code
    }

    //设置微信登录数据用户数据
    public setWxUserInfoData(value: any) {
        //json对象
        this._userName = value.nickname ? value.nickname : this._userName;
        this._userSex = value.sex;
        this._userHead = value.headimgurl ? value.headimgurl : this._userHead;
        this._unionId = value.unionid ? value.unionid : this._unionId;
        this._openId = value.openid ? value.openid : this._openId;

        if (this._userHead == "" || this._userHead == null)
            this._userHead = "0";

        this.saveLoginInfo();
    }

    //设置微信登录数据用户数据
    public setXlUserInfoData(value: any) {
        //json对象
        this._userName = value.nickName ? value.nickName : this._userName;
        this._userHead = value.originalAvatar ? value.originalAvatar : this._userHead;
        this._unionId = value.openId ? value.openId : this._unionId;
        this._openId = value.openId ? value.openId : this._openId;

        if (this._userHead == "" || this._userHead == null)
            this._userHead = "0";

        this.saveLoginInfo();
    }

    //设置微信登录数据用户数据
    public setCnUserInfoData(value: any) {
        //json对象
        this._userName = value.nickname ? value.nickname : this._userName;
        this._userHead = value.headpic ? value.headpic : this._userHead;
        this._unionId = value.unionid ? value.unionid : this._unionId;
        this._openId = value.openId ? value.openId : + this._openId;

        if (this._userHead == "" || this._userHead == null)
            this._userHead = "0";

        this.saveLoginInfo();
    }

    public checkLoginInfo(): Boolean {
        let info = cc.sys.localStorage.getItem("loginInfo");
        if (!info || info == undefined)
            return false;
        let value = JSON.parse(info);
        LogWrap.log(value);
        if (value.open == "") {
            LogWrap.info("get info null");
            return false;
        }
        return true;
    }

    //存储登录信息
    private saveLoginInfo() {
        let info = {
            open: this._openId,
        }
        cc.sys.localStorage.setItem("loginInfo", JSON.stringify(info));
    }

}