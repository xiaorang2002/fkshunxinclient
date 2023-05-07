import { ListenerType } from './../../scripts/data/ListenerType';
import { GameData_ZJH } from './../../scripts/data/zjh/GameData_ZJH';
import { GameData_DDZ } from './../../scripts/data/ddz/GameData_DDZ';
import { MessageManager } from './MessageManager';
import { GameData_ZJMJ } from './../../scripts/data/mj/GameData_ZJMJ';
import { GameData_XZMJ } from './../../scripts/data/mj/GameData_XZMJ';
import { ReddotData } from './../../scripts/data/ReddotData';
import { GAME_TYPE } from './../../scripts/data/GameConstValue';
import { GameData_Mj } from './../../scripts/data/mj/GameData_Mj';
import { GameData_ZGCP } from './../../scripts/data/cp/GameData_ZGCP';
import { GameData_PDK } from '../../scripts/data/game_pdk/GameData_PDK';
import { ClubData } from './../../scripts/data/club/ClubData';
import { SystemData } from './../../scripts/data/SystemData';
import { LoginInfoData } from './../../scripts/data/LoginInfoData';
import { LogWrap } from './../Utils/LogWrap';
import { UserInfoData } from './../../scripts/data/UserInfoData';
import { GameData_NN } from '../../scripts/data/nn/GameData_NN';
import { GameData_SCPDK } from '../../scripts/data/game_pdk/GameData_SCPDK';

export class GameDataManager {
    private static instance: GameDataManager;

    public static getInstance(): GameDataManager {
        if (this.instance == null)
            this.instance = new GameDataManager();

        return this.instance;
    }

    private _curGameType = 0;
    public set curGameType(value: any) {
        this._curGameType = value
    }
    public get curGameType() {
        return this._curGameType
    }

    private _isCreatingRoom = false // 是否正在创建房间
    public set isCreatingRoom(value: any) {
        this._isCreatingRoom = value

    }
    public get isCreatingRoom() {
        return this._isCreatingRoom
    }

    private _isCreatingClub = false // 是否正在创建群
    public set isCreatingClub(value: any) {
        this._isCreatingClub = value

    }
    public get isCreatingClub() {
        return this._isCreatingClub
    }

    private _isJoinRoom = false // 是否正在加入房间
    public set isJoinRoom(value: any) {
        this._isJoinRoom = value
    }
    public get isJoinRoom() {
        return this._isJoinRoom
    }

    public httpDataWaitTime = 0 // 后台请求数据等待时间

    public onHttpDataSend() {
        this.httpDataWaitTime = 15 // 15s内不能重复请求
    }

    public onHttpDataRec() {
        this.httpDataWaitTime = 0
    }

    public isImport = false // 是否正在导入玩家

    private _returnHallStatus = null
    public set returnHallStatus(value: any) {
        this._returnHallStatus = value
        MessageManager.getInstance().messagePost(ListenerType.returnHallStatusChanged);
    }
    public get returnHallStatus() {
        return this._returnHallStatus
    }

    private _gpsData = null // gps数据，放在全局中
    public set gpsData(value: any) {
        this._gpsData = value
        MessageManager.getInstance().messagePost(ListenerType.updateLocation);

    }
    public get gpsData() {
        return this._gpsData
    }


    //初始化用户信息
    private _userInfoDate: UserInfoData = new UserInfoData();
    public setLoginInfo(platform, code) {
        this._userInfoDate.setLoginInfo(platform, code);
    }

    public setWxUserInfoData(value: any) {
        this._userInfoDate.setWxUserInfoData(value);
    }
    public setXlUserInfoData(value: any) {
        this._userInfoDate.setXlUserInfoData(value);
    }
    public setCnUserInfoData(value: any) {
        this._userInfoDate.setCnUserInfoData(value);
    }
    public set userInfoData(value: any) {
        if (value == null) {
            LogWrap.log("userinfo is null");
            return;
        }
        this._userInfoDate.updateUserDate(value);
    }
    public get userInfoData(): any {
        return this._userInfoDate;
    }

    private _loginInfoData: LoginInfoData = new LoginInfoData();
    public set loginInfoData(value: any) {
        if (value == null) {
            LogWrap.log("userinfo is null");
            return;
        }
        this._loginInfoData.updateValue(value);
    }
    public get loginInfoData(): any {
        return this._loginInfoData;
    }

    //获取信号等级
    public getNetLevel(): any {
        if (this._systemDate.ping > 600) {
            return 0;
        } else if (this._systemDate.ping > 360) {
            return 1;
        } else if (this._systemDate.ping > 200) {
            return 2;
        } else if (this._systemDate.ping > 100) {
            return 3;
        } else if (this._systemDate.ping >= 0) {
            return 4;
        }
    }

    //系统信息
    private _systemDate: SystemData = new SystemData();
    public set systemData(value: any) {
        if (value == null) {
            LogWrap.log("userinfo is null");
            return;
        }
    }
    public get systemData(): any {
        return this._systemDate;
    }

    //亲友群数据
    private _clubData: ClubData = null;
    public set clubData(value: any) {
        if (value == null) {
            this._clubData = null;
            return;
        }
        else {
            if (!this._clubData)
                this._clubData = new ClubData();
            this._clubData.updateClubData(value);

        }
    }
    public get clubData(): any {
        return this._clubData;
    }

    /**跑得快数据 */
    private _pdkData: GameData_PDK = null;
    public set pdkData(value) {
        this._pdkData = value
    }
    public get pdkData(): any {
        if (!this._pdkData) {
            this._pdkData = new GameData_PDK();
        }
        return this._pdkData;
    }

    /**自贡长牌数据 */
    private _zgcpData: GameData_ZGCP = null;
    public set zgcpData(value:GameData_ZGCP) {
        this._zgcpData = value
    }
    public get zgcpData(): GameData_ZGCP {
        if (!this._zgcpData) {
            this._zgcpData = new GameData_ZGCP();
        }
        return this._zgcpData;
    }

    /**四川跑得快数据 */
    private _scpdkData: GameData_PDK = null;
    public set scpdkData(value) {
        this._scpdkData = value
    }
    public get scpdkData(): any {
        if (!this._scpdkData) {
            this._scpdkData = new GameData_SCPDK();
        }
        return this._scpdkData;
    }

    /**炸金花数据 */
    private _zjhData: GameData_ZJH = null;
    public set zjhData(value) {
        this._zjhData = value
    }
    public get zjhData(): any {
        if (!this._zjhData) {
            this._zjhData = new GameData_ZJH();
        }
        return this._zjhData;
    }

    /**牛牛数据 */
    private _nnData: GameData_NN = null;
    public set nnData(value) {
        this._nnData = value
    }
    public get nnData(): any {
        if (!this._nnData) {
            this._nnData = new GameData_NN();
        }
        return this._nnData;
    }


    /**斗地主数据 */
    private _ddzData: GameData_DDZ = null;
    public set ddzData(value) {
        this._ddzData = value
    }
    public get ddzData(): any {
        if (!this._ddzData) {
            this._ddzData = new GameData_DDZ();
        }
        return this._ddzData;
    }

    /**闷胡血流数据 */
    private _mjMHXLData: GameData_ZJMJ = null;
    public set mjMHXLData(value) {
        this._mjMHXLData = value
    }
    public get mjMHXLData(): any {
        if (!this._mjMHXLData) {
            this._mjMHXLData = new GameData_ZJMJ();
        }
        return this._mjMHXLData;
    }

    /**两房麻将数据 */
    private _mjLFMJData: GameData_ZJMJ = null;
    public set mjLFMJData(value) {
        this._mjLFMJData = value
    }
    public get mjLFMJData(): any {
        if (!this._mjLFMJData) {
            this._mjLFMJData = new GameData_ZJMJ();
        }
        return this._mjLFMJData;
    }

    /**血战麻将数据 */
    private _mjXZData: GameData_Mj = null;
    public set mjXZData(value) {
        this._mjXZData = value
    }
    public get mjXZData(): any {
        if (!this._mjXZData) {
            this._mjXZData = new GameData_XZMJ();
        }
        return this._mjXZData;
    }


    /**红点数据 */
    private _ReddotData: ReddotData = new ReddotData();
    public set ReddotData(value) {
        this._ReddotData = value
    }
    public get ReddotData(): any {
        return this._ReddotData;
    }

    /**根据传入的游戏类型得到对应的数据容器 */
    getDataByCurGameType() {
        if (this._curGameType == GAME_TYPE.MHXL)
            return this.mjMHXLData
        if (this._curGameType == GAME_TYPE.LFMJ)
            return this.mjLFMJData
        else if (GAME_TYPE.XZMJ <= this._curGameType && GAME_TYPE.LRPDK > this._curGameType)
            return this.mjXZData
        else if (this._curGameType == GAME_TYPE.PDK || this._curGameType == GAME_TYPE.LRPDK)
            return this.pdkData
        else if (this._curGameType == GAME_TYPE.DDZ)
            return this.ddzData
        else if (this._curGameType == GAME_TYPE.ZJH)
            return this.zjhData
        else if (this._curGameType == GAME_TYPE.NN)
            return this.nnData
        else if (this._curGameType == GAME_TYPE.SCPDK)
            return this.scpdkData
        else if (this._curGameType == GAME_TYPE.ZGCP)
            return this.zgcpData
        else if (GAME_TYPE.YJMJ == this._curGameType)  // 幺鸡麻将作为有癞子的血战麻将
            return this.mjXZData
        else if (this._curGameType == GAME_TYPE.ZGMJ)
            return this.mjXZData
        else
            return null
    }

    clearCurGameData() {
        if (this._mjLFMJData) {
            this._mjLFMJData.clear()
            delete this._mjLFMJData;
        }
        if (this._mjMHXLData) {
            this._mjMHXLData.clear()
            delete this._mjMHXLData;
        }
        if (this._mjXZData) {
            this._mjXZData.clear()
            delete this._mjXZData;
        }
        if (this._pdkData) {
            this._pdkData.clear()
            delete this._pdkData
        }
        if (this._scpdkData) {
            this._scpdkData.clear()
            delete this._scpdkData
        }
        if (this._ddzData) {
            this._ddzData.clear()
            delete this._ddzData
        }
        if (this._zjhData) {
            this._zjhData.clear()
            delete this._zjhData
        }
        if (this._nnData) {
            this._nnData.clear()
            delete this._nnData
        }
        if (this._zgcpData) {
            this._zgcpData.clear()
            delete this._zgcpData
        }
        this._curGameType = 0
    }

}
