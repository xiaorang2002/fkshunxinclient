export class LoginInfoData {
    public static className = "LoginInfoData";

	private _guid = "";							            // 成功返回玩家的guid
	private _account = "";						            // 账号
	private _gameId = 0;						            // 在哪个游戏服务器
	private _isGuest = false; 						        // 是否是游客
	private _password = "";					                // 密码
	private _alipayAccount ="";	         	                // 支付宝账号
	private _alipayName ="";					            // 支付宝名字
	private _isValidatebox = false;				            // 是否有登陆验证框
    private _valiQuest = 0;	                                // 登陆验证框问题
    private _valiAnswer = 0;	                            // 登陆验证框答案
	private _changeAlipayNum = 0;			                // 支付宝剩余绑定次数
	private _ipArea = "";					                // 客户端ip地区
	private _enableTransfer = false;				        // 1能够转账，0不能给其他玩家转账
	private _isFirst = 0;					                // 1第一次，2非第一次
	private _hasBankPassword = false; 			            // 是否设置银行密码，false：没有设置，true：已经设置
	private _imei = "";						                // 设备唯一码
	private _platformId = "";				                // 客户端 平台id
	private _bankCardName = "";				                // 银行卡姓名
	private _bankCardNum = "";				                // 银行卡号
	private _changeBankcardNum = 0;			                // 银行卡剩余绑定次数
    private _bankName = "";		
    private _ip = "";
    private _channelId = "";
    private _nickname = "";
    private _phoneType = "";
    private _smsNo = "";
    private _inviteCode = "";

    private _openId: string = "";
    public get openId(): string {
        return this._openId;
    }
    public set openId(value: string) {
        this._openId = value;
        this.saveLoginInfo()
    }

    private _isAccountLogin: boolean = false
    public get isAccountLogin(): boolean {
        return this._isAccountLogin;
    }
    public set isAccountLogin(value: boolean) {
        this._isAccountLogin = value;
    }

    private _phone: string = "";
    public get phone(): string {
        return this._phone;
    }
    public set phone(value: string) {
        this._phone = value;
    }

    updateValue(value)
    {
        this._guid = value.guid;					     
        this._account = value.account;	
        this._gameId = value.gameId;						  
        this._isGuest = value.isGuest;	
        this._password = value.password;	
        this._alipayAccount = value.alipayAccount;	
        this._alipayName = value.alipayName;	
        this._isValidatebox = value.isValidatebox;
        if (value.pbValidatebox)
        {
            this._valiQuest = value.pbValidatebox.valiQuest;	         
            this._valiAnswer =  value.pbValidatebox.valiAnswer;	   
        }		  
        this._changeAlipayNum = value.changeAlipayNum;	
        this._ipArea = value.ipArea;			     
        this._enableTransfer = value.enableTransfer;		      
        this._isFirst = value.isFirst;				        
        this._hasBankPassword = value.hasBankPassword;	
        this._imei = value.imei;		   
        this._platformId = value.platformId;		      
        this._bankCardName = value.bankCardName;	   
        this._bankCardNum = value.bankCardNum;			  
        this._changeBankcardNum = value.changeBankcardNum;			       
        this._bankName = value.bankName;		
        this._ip = value.ip;
        this._channelId = value.channelId;
        this._openId =value.openId;
        this._nickname= value.nickname;
        this._phone =value.phone;
        this._phoneType =value.phoneType;
        this._smsNo =value.smsNo;
        this._inviteCode =value.inviteCode;

        this.saveLoginInfo()
    }

    //存储登录信息
    private saveLoginInfo() {
        let info = {
            open: this._openId,
        }
        cc.sys.localStorage.setItem("loginInfo", JSON.stringify(info));
    }

    public checkLoginInfo()
    {
        let info = cc.sys.localStorage.getItem("loginInfo");
        if (!info || info == undefined)
            return false;
        let value = JSON.parse(info);
        if (value.open == "") {
            return false;
        }
        return true;
    }

    public setSaveLoginInfo() {
        let value = JSON.parse(cc.sys.localStorage.getItem("loginInfo"));
        this._openId = value.open ? value.open : this._openId;
    }

    public deleteLoginInfo() {
        this._openId = ""
        cc.sys.localStorage.removeItem("loginInfo");
    }
}
