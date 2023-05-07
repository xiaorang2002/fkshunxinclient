import { MessageManager } from "../../../framework/Manager/MessageManager";
import { ListenerType } from "../ListenerType";
import { SYNC_TYPE } from "../../../proto/proto-min";
import { GameManager } from "../../GameManager";
import { StringData } from "../StringData";



export enum CLUB_SHOW {
    CREATE = 0,
    JOIN,
    MAIN,
    MEMBER,
    RECORD,
    COUNT,
}

export enum CLUB_POWER {
    CRT_NOT_MEMBER = 0,
    CRT_PLAYER,
    CRT_PRATNER,
    CRT_ADMIN,
    CRT_BOSS
}

enum TABLE_SYNC_OPCODE {
	TSO_NIL = 0,
	TSO_CREATE = 1,
	TSO_DELETE = 2,
	TSO_JOIN = 3,
	TSO_LEAVE = 4,
	TSO_STATUS_CHANGE = 5,
	TSO_SEAT_CHANGE = 6,
}


export class ClubData {
    public static className = "ClubData";

    //当前俱乐部类型(0：亲友群  1：联盟)
    private _clubType: number = 0;
    public get clubType(): number {
        return this._clubType;
    }
    public set clubType(value: number) { 
        this._clubType = value;
    }

    //根节点
    private _rootId: number = 0;
    public get rootId(): number {
        return this._rootId;
    }
    public set rootId(value: number) { 
        if (value)
            this._rootId = value;
    }

    //团队房卡
    private _teamRoomCard: number = 0;
    public get teamRoomCard(): number {
        return this._teamRoomCard;
    }
    public set teamRoomCard(value: number) { 
        this._teamRoomCard = value/100;
        MessageManager.getInstance().messagePost(ListenerType.ClubRoomCardsChanged);
    }

    private _groupRoomCard: number = 0;
    public get groupRoomCard(): number {
        return this._groupRoomCard;
    }
    public set groupRoomCard(value: number) { 
        this._groupRoomCard = value/100.0;
    }

    private _playerScore: number = 0;
    public get playerScore(): number {
        return this._playerScore;
    }
    public set playerScore(value: number) { 
        this._playerScore = value/100.0;
        MessageManager.getInstance().messagePost(ListenerType.PlayerScoreChanged);
    }

    private _commission: number = 0;
    public get commission(): number {
        return this._commission;
    }
    public set commission(value: number) { 
        this._commission = value/100.0;
        MessageManager.getInstance().messagePost(ListenerType.CommissionScoreChanged);

    }

    private _fastGameList = [-1,-1,-1,-1]
    public get fastGameList() {
        return this._fastGameList;
    }
    public set fastGameList(value) { 
        this._fastGameList = value;
        MessageManager.getInstance().messagePost(ListenerType.clubFastGameListChanged);
    }

    private _openTemplateList = [];
    public get openTemplateList() {
        return this._openTemplateList;
    }
    public set openTemplateList(value) { 
        this._openTemplateList = value
    }

    //当前俱乐部父节点
    private _parentName = "";
    public get parentName() {
        for (var i =0; i <this._allMyClubList.length; i++)
        {
            if (this._allMyClubList[i].cid == this._curSelectClubId)
                return this._allMyClubList[i].parent
        }
        return "";
    }
    public set parentName(value) { 
        this._parentName = value;
    }

    //我所有的亲友群列表
    private _allMyClubList: any[] = [];
    public get allMyClubList(): any[] {
        return this._allMyClubList;
    }

    //当前选择的展示界面
    private _curSelectShow: CLUB_SHOW = null;
    public get curSelectShow(): CLUB_SHOW {
        return this._curSelectShow;
    }
    public set curSelectShow(value: CLUB_SHOW) {
        //当前显示不为统计的时候，不需要进入战绩查询对应id的玩家
        this._clubRecordPlayerId = 0;
        this._curSelectShow = value;
        MessageManager.getInstance().messagePost(ListenerType.clubSelectShowChanged);
    }

    //当前选择的亲友群id
    private _curSelectClubId: number = 0;
    public get curSelectClubId(): number {
        return this._curSelectClubId;
    }
    public set curSelectClubId(value: number) {
        this._curSelectClubId = value;
        cc.sys.localStorage.setItem("SaveClubId", this._curSelectClubId);
        MessageManager.getInstance().messagePost(ListenerType.clubSelectClubChanged);
    }

    //当前玩家在当前群权限
    private _roleType: number = 0;
    public get roleType(): number {
        return this._roleType;
    }
    public set roleType(value: number) {
        this._roleType = value;
    }

    //当前的公告id
    private _curSelectNoticeId: string = "";
    public get curSelectNoticeId(): string {
        return this._curSelectNoticeId;
    }
    public set curSelectNoticeId(value: string) {
        this._curSelectNoticeId = value;
    }


    //当前群状态(0正常 1打烊 2封禁)
    private _curClubStatus = 0;
    public get curClubStatus() {
        return this._curClubStatus;
    }
    public set curClubStatus(value) {
        this._curClubStatus = value;
    }

    private _teamStatusInfo = null;
    public get teamStatusInfo() {
        return this._teamStatusInfo;
    }
    public set teamStatusInfo(value) {
        this._teamStatusInfo = value;
    }


    
    //父级联盟状态(0正常 1打烊 2封禁)
    private _parentStatus = 0;
    public get parentStatus() {
        return this._parentStatus;
    }
    public set parentStatus(value) {
        this._parentStatus = value;
    }

    //快速加入列表
    private _clubFastList = [];
    public get clubFastList() {
        return this._clubFastList;
    }
    public set clubFastList(value: any) {
        this._clubFastList = value;
        this.sortClubFastList()
        MessageManager.getInstance().messagePost(ListenerType.clubFastListChanged);
    }

    //权限列表（可以玩的玩法列表）
    private _clubPower: any = [];
    public get clubPower(): any {
        return this._clubPower;
    }
    public set clubPower(value: any) {
        this._clubPower = value;
        MessageManager.getInstance().messagePost(ListenerType.clubPowerChanged);
    }

    //房间列表
    private _clubRoomList: any[] = [];
    public get clubRoomList(): any[] {
        return this._clubRoomList;
    }
    public set clubRoomList(value: any[]) {
        this._clubRoomList = value;
        MessageManager.getInstance().messagePost(ListenerType.clubRoomListChanged);
    }
    public updateClubRoomList(value: any[]) {
        this._clubRoomList = value;
    }
    //亲友群总人数
    private _clubAllPlayerNum: number = 0;
    public get clubAllPlayerNum(): number {
        return this._clubAllPlayerNum;
    }
    public set clubAllPlayerNum(value: number) {
        this._clubAllPlayerNum = value;
        MessageManager.getInstance().messagePost(ListenerType.clubPlayerNumChanged);
    }

    //亲友群在线人数
    private _clubOnlinePlayerNum: number = 0;
    public get clubOnlinePlayerNum(): number {
        return this._clubOnlinePlayerNum;
    }
    public set clubOnlinePlayerNum(value: number) {
        this._clubOnlinePlayerNum = value;
        MessageManager.getInstance().messagePost(ListenerType.clubPlayerNumChanged);
    }

    //亲友群需要查询战绩的玩家
    private _clubRecordPlayerId: number = 0;
    public get clubRecordPlayerId(): number {
        return this._clubRecordPlayerId;
    }
    public set clubRecordPlayerId(value: number) {
        this._clubRecordPlayerId = value;
    }

    private _clubSettings = "";
    public get clubSettings() {
        return this._clubSettings;
    }
    public set clubSettings(value) {
        this._clubSettings = value;
    }

    getCurSelectClubData()
    {
        for (var i = 0; i < this._allMyClubList.length; i++)
            if (this._allMyClubList[i].cid == this._curSelectClubId)
                return this._allMyClubList[i]
        return null
    }

    //-------------------------------------------------函数-------------------------------------------//

    public isTemplateOpen(templateId)
    {
        if (this.roleType >= CLUB_POWER.CRT_ADMIN)
            return true;
        if (this.openTemplateList.length == 0)
            return true;
        return this.openTemplateList.indexOf(templateId) >= 0
    }

    public isBigBossOfUnion()
    {
        return (this.roleType >= CLUB_POWER.CRT_ADMIN) && this.parentName == "" && this.clubType == 1
    }

    public updateClubData(value)
    {
        var clubMap = new Map<number, number>();
        var clubData = new Map<number, number>(); // 联盟id-》合伙人id
        var clubTempList = []
        var clubTempList1 = []
        this._allMyClubList = []
        for (var j = 0; j < value.length; ++j) {
            var parent = 0
            if(value[j].parent)
                clubMap.set(value[j].id, value[j].parent)
        }
        for (let i = 0; i < value.length; ++i) {
            this._clubType = value[i].type
            var parent = 0
            if(value[i].parent)
                parent = value[i].parent
            let clubinfo =
            {
                cid: value[i].id,
                name: value[i].name,
                parent:parent,
                visual_id:-1
            }
            if (parent != 0 && clubMap.get(parent)) // 是虚拟的盟
                clubData.set(parent, value[i].id)
            else
            {
                if (parent == 0)
                    clubTempList.push(clubinfo)
                else
                    clubTempList1.push(clubinfo)
            }
        }
        this._allMyClubList = clubTempList.concat(clubTempList1)
        for (var j = 0; j < this._allMyClubList.length; ++j)
        {
            if (clubData.get(this._allMyClubList[j].cid))
                this._allMyClubList[j].visual_id = clubData.get(this._allMyClubList[j].cid)
        }
        //获取当前选择的亲友群
        let saveClubId = cc.sys.localStorage.getItem("SaveClubId");
        if (saveClubId) {
            //寻找列表是有无对应id
            let clubid = parseInt(saveClubId);
            let ishas = false;
            for (let i = 0; i < this._allMyClubList.length; ++i) {
                if (this._allMyClubList[i].cid == clubid) {
                    ishas = true;
                    break;
                }
            }
            if (ishas) {
                this._curSelectClubId = parseInt(saveClubId);
                return;
            }
        }

        if (this._allMyClubList.length != 0)
            this._curSelectClubId = this._allMyClubList[0].cid;
        else
            this._curSelectClubId = 0;
    }

    public fastRoomInfoUpdate(info)
    {
        //更新的桌子id和当前选择一样
        if (info.template.clubId != this._curSelectClubId && this.rootId != info.rootClub)
            return;

        if (!this.isTemplateOpen(info.template.template.templateId))
        {
            return
        }
        if (info.sync == SYNC_TYPE.SYNC_ADD) {
            this._clubFastList.push(info.template);
            this.sortClubFastList()
        }
        else if (info.sync == SYNC_TYPE.SYNC_DEL) {
            for (let i = 0; i < this._clubFastList.length; ++i) {
                if (this.fastGameList.indexOf(info.template.template.templateId) >= 0)
                {
                    this.fastGameList[this.fastGameList.indexOf(info.template.template.templateId)] = -1
                    this.fastGameList = this._fastGameList
                }
                if (this._clubFastList[i].template.templateId == info.template.template.templateId) {
                    this._clubFastList.splice(i, 1);
                    break;
                }
            }
        }
        else if (info.sync == SYNC_TYPE.SYNC_UPDATE) {
            for (let i = 0; i < this._clubFastList.length; ++i) {
                if (this._clubFastList[i].template.templateId == info.template.template.templateId) {
                    this._clubFastList[i] = info.template;
                    break
                }
            }
        }
        MessageManager.getInstance().messagePost(ListenerType.clubFastRoomChanged, { index: info.template.template.templateId, type: info.sync, gameId: info.template.template.gameId});
    }


    //得到对应快速加入的桌子信息
    public getQuickInfoByIndex(index: number): any {

        if (index >= this._clubFastList.length) {
            GameManager.getInstance().openWeakTipsUI(StringData.getString(10048));
            return;
        }
        return this._clubFastList[index];
    }

    getTemplateInfoById(templateId)
    {   
        for (let i = 0; i < this._clubFastList.length; ++i) {
            if (this._clubFastList[i].template.templateId == templateId) {
                return this._clubFastList[i] 
            }
        }
        return null
    }

    getTemplateInfoByGameId(gameId)
    {
        var result = []
        for (let i = 0; i < this._clubFastList.length; ++i) {
            if (this._clubFastList[i].template.gameId == gameId)
                result.push(this._clubFastList[i])
        }
        return result
    }

    getPartnerClubId()
    {
        if (this.roleType != 2)
            return -1
        for (var i =0; i <this._allMyClubList.length; i++)
        {
            if (this._allMyClubList[i].cid == this._curSelectClubId)
                return this._allMyClubList[i].visual_id
        }
        return -1
    }

    //桌子实时更新
    public roomInfoUpdate(info: any) {
        //更新的桌子id和当前选择一样
        var gameId = 0
        var templateId = 0
        if (info.syncType != SYNC_TYPE.SYNC_DEL)
        {
            gameId = info.roomInfo.gameType
            templateId = info.roomInfo.templateId
        }
        if (info.clubId != this._curSelectClubId && this.rootId != info.rootClub)
            return;

        if (info.syncType == SYNC_TYPE.SYNC_ADD) {
            if(!this.isTemplateOpen(info.roomInfo.templateId)){
                return 
            }
            this._clubRoomList.push(info.roomInfo);
        }
        else if (info.syncType == SYNC_TYPE.SYNC_DEL) {
            for (let i = 0; i < this._clubRoomList.length; ++i) {
                if (this._clubRoomList[i].tableId == info.syncTableId) {
                    gameId = this._clubRoomList[i].gameType
                    templateId = this._clubRoomList[i].templateId
                    this._clubRoomList.splice(i, 1);
                    break;
                }
            }
        }
        else if (info.syncType == SYNC_TYPE.SYNC_UPDATE) {
            for (let i = 0; i < this._clubRoomList.length; ++i) {
                if (this._clubRoomList[i].tableId == info.syncTableId) {
                    var rule =  this._clubRoomList[i].rule
                    var gameType = this._clubRoomList[i].gameType
                    var template = this._clubRoomList[i].templateId
                    this._clubRoomList[i] = info.roomInfo;
                    this._clubRoomList[i].rule = rule
                    this._clubRoomList[i].gameType = gameType
                    this._clubRoomList[i].templateId = template
                }
            }
        }

        MessageManager.getInstance().messagePost(ListenerType.clubRoomChanged, { index: info.syncTableId, type: info.syncType, gameId:gameId, templateId:templateId });
    }

    public newRoomInfoUpdate(infoList)
    {
        for (var data of infoList) {
            var syncType = 0
            var gameId = 0
            var templateId = 0
            if(data.opcode == TABLE_SYNC_OPCODE.TSO_CREATE) // 新的创建房间
            {
                let roomInfo = {
                    tableId: data.tableId,
                    templateId: data.templateId,
                    seatList: [data.trigger],
                    roomCurRound: data.curRound,
                    gameType: data.gameType,
                    rule: data.rule,
                    tableStatus: data.status,
                }
                syncType = SYNC_TYPE.SYNC_ADD
                gameId = data.gameType
                templateId = data.templateId
                if(!this.isTemplateOpen(templateId)){
                    return 
                }
                this._clubRoomList.push(roomInfo);
            }
            else if (data.opcode == TABLE_SYNC_OPCODE.TSO_DELETE)
            {
                for (let i = 0; i < this._clubRoomList.length; ++i) {
                    if (this._clubRoomList[i].tableId == data.tableId) {
                        gameId = this._clubRoomList[i].gameType
                        templateId = this._clubRoomList[i].templateId
                        this._clubRoomList.splice(i, 1);
                        break;
                    }
                }
                syncType = SYNC_TYPE.SYNC_DEL
            }
            else if (data.opcode == TABLE_SYNC_OPCODE.TSO_JOIN)
            {
                for (let i = 0; i < this._clubRoomList.length; ++i) {
                    if (this._clubRoomList[i].tableId == data.tableId) {
                        var repeatPlayer = false
                        for (var player of this._clubRoomList[i].seatList)
                        {
                            if (player.playerInfo.guid == data.trigger.playerInfo.guid)
                            {
                                repeatPlayer = true
                            }
                        }
                        if (!repeatPlayer)
                        {
                            this._clubRoomList[i].seatList.push(data.trigger)
                            data.trigger.online = true
                            gameId = this._clubRoomList[i].gameType
                            templateId = this._clubRoomList[i].templateId
                            syncType = SYNC_TYPE.SYNC_UPDATE
                        }
                        break;
                    }
                }
            }
            else if (data.opcode == TABLE_SYNC_OPCODE.TSO_LEAVE)
            {
                for (let i = 0; i < this._clubRoomList.length; ++i) {
                    if (this._clubRoomList[i].tableId == data.tableId) {
                        for (var index = 0;index < this._clubRoomList[i].seatList.length; index++)
                        {
                            if (this._clubRoomList[i].seatList[index].chairId == data.trigger.chairId)
                            {
                                this._clubRoomList[i].seatList.splice(index, 1)
                                break
                            }
                        }
                        gameId = this._clubRoomList[i].gameType
                        templateId = this._clubRoomList[i].templateId
                        syncType = SYNC_TYPE.SYNC_UPDATE
                        break;
                    }
                }
            }
            else if (data.opcode == TABLE_SYNC_OPCODE.TSO_STATUS_CHANGE) // 目前仅用于房间开始游戏
            {
                for (let i = 0; i < this._clubRoomList.length; ++i) {
                    if (this._clubRoomList[i].tableId == data.tableId) {
                        this._clubRoomList[i].roomCurRound = data.curRound
                        gameId = this._clubRoomList[i].gameType
                        templateId = this._clubRoomList[i].templateId
                        syncType = SYNC_TYPE.SYNC_UPDATE
                        break
                    }
                }
            }
            else if (data.opcode == TABLE_SYNC_OPCODE.TSO_SEAT_CHANGE) // 用来同步状态（离线，托管）
            {
                for (let i = 0; i < this._clubRoomList.length; ++i) {
                    if (this._clubRoomList[i].tableId == data.tableId) {
                        for (var index = 0;index < this._clubRoomList[i].seatList.length; index++)
                        {
                            if (this._clubRoomList[i].seatList[index].chairId == data.trigger.chairId)
                            {
                                this._clubRoomList[i].seatList[index].online = data.trigger.online
                            }
                        }
                        gameId = this._clubRoomList[i].gameType
                        templateId = this._clubRoomList[i].templateId
                        syncType = SYNC_TYPE.SYNC_UPDATE
                        break;
                    }
                }
            }

            // MessageManager.getInstance().messagePost(ListenerType.clubRoomChanged, { index: data.tableId, type: syncType, gameId:gameId, templateId:templateId });
        }   
        MessageManager.getInstance().messagePost(ListenerType.clubRoomUpdateByNewSync, {});
    }




    private sortClubFastList()
    {
        this._clubFastList.sort(function (a, b) { return a.template.templateId - b.template.templateId });
        this.maoPaoSort(this._clubFastList)
    }

    maoPaoSort(temp)
    {
        for(let i=0;i<temp.length-1;i++){
            for(let j=0;j<temp.length-1-i;j++){
                if(temp[j].template.gameId > temp[j+1].template.gameId){
                let tmp = temp[j]
                temp[j] = temp[j+1]
                temp[j+1] = tmp
                }
            }
        }
    }
}