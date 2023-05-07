import { ClubGameOpenUI } from './ClubGameOpenUI';
import { GameUIRepeatMsgManage } from './../../GameUIRepeatMsgManage';
import { ListenerType } from './../../../data/ListenerType';
import { ClubMemberUI } from './ClubMemberUI';
import { ClubRecordUI } from './ClubRecordUI';
import { ClubMemberUI_New } from './ClubMemberUI_New';
import { UnionUI_Daily_Record } from './../union/UnionUI_Daily_Record';
import { UnionUI_Manage } from './../union/UnionUI_Manage';
import { UnionUI_Record } from './../union/UnionUI_Record';
import { PreferentData } from './../../../data/PreferentData';
import { ClubFastJoinUI } from './ClubFastJoinUI';
import { UnionUI_Import } from './../union/UnionUI_Import';
import { Wait2UI } from './../../Wait2UI';
import { UnionUI_Statistics } from './../union/UnionUI_Statistics';
import { ClubKeyboardUI } from './ClubKeyboardUI';
import { ClubNotice } from './ClubNotice';
import { UnionUI_Table_Blacklist } from './../union/UnionUI_Table_Blacklist';
import { UnionUI_Analysis } from './../union/UnionUI_Analysis';
import { Club_Quick_Game_UI } from './../../Club_Quick_Game_UI';
import * as Proto from "../../../../proto/proto-min";
import { Utils } from './../../../../framework/Utils/Utils';
import { UnionUI_Spread } from './../union/UnionUI_Spread';
import { BaseUI, UIClass } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { MessageManager } from "../../../../framework/Manager/MessageManager";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import { ListenerManager } from "../../../../framework/Manager/ListenerManager";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { RuleUI } from "../../RuleUI";
import { SYNC_TYPE } from "../../../../proto/proto-min";
import { AudioManager } from "../../../../framework/Manager/AudioManager";
import { GameManager } from "../../../GameManager";
import { StringData } from "../../../data/StringData";
import { CLUB_POWER } from "../../../data/club/ClubData";
import { ConstValue } from '../../../data/GameConstValue';

const { ccclass, property } = cc._decorator;

@ccclass
export class ClubMainUI extends BaseUI {

    protected static className = "ClubMainUI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_CLUB_DIR + this.className;
    }

    private clubData: any = null;
    private curShowArray: any = [];                          //当前显示数组
    private curSelectGameIdx = -1; // 当前选择的游戏下标
    private curSelectTemplateIdx = -1;  // 当前选择的模板下标
    private gameTemplateMap = new Map();
    private gameNodeList = [];
    private tableNodeList = [];
    private templateNodeList = [];
    private curWidth = 0

    // 动态滚动框加载
    private scrollView = null
    private updateTimer: number = 0;                        //刷新时间记录
    private updateInterval: number = 0.2;                   //刷新间隔时间
    private lastContentPosX: number = 0;                    //容器Y轴记录
    private spacing: number = 40;                            //对象之间的间隔
    private sortTableTime: number = 2;                      //重新对桌子排序

    private leftSsActionStatus = 0
    private rightSsActionStatus = 0

    @property(cc.Prefab)
    roomPrefab: cc.Prefab = null;
    @property(cc.Prefab)
    gamePrefab: cc.Prefab = null;
    @property(cc.Prefab)
    templatePrefab: cc.Prefab = null;
    @property(cc.Node)
    templateListContent: cc.Node = null;
    @property(cc.Node)
    gameListContent: cc.Node = null;
    @property(cc.Node)
    tableListContent: cc.Node = null;
    @property(cc.Node)
    leftSsBtnNode: cc.Node = null;
    @property(cc.Node)
    rightSsBtnNode: cc.Node = null;

    private bMangz: boolean = false

    private bInitData = false
    private data_temp = {}

    onLoad() {
        this.clubData = GameDataManager.getInstance().clubData;
        var parentSize = this.node.getParent().getContentSize()
        this.node.setContentSize(parentSize.width, parentSize.height);
        this.curWidth = 1200 / GameConstValue.ConstValue.SCREEN_W * parentSize.width
        this.scrollView = this.node.getChildByName("table_scroll").getComponent(cc.ScrollView)

        this.scrollView.brake = 0.9
        ListenerManager.getInstance().add(Proto.S2C_EDIT_CLUB_GAME_TYPE_RES.MsgID.ID, this, this.onGameListChanged);
        ListenerManager.getInstance().add(ListenerType.clubRoomListChanged, this, this.clubRoomListChanged);
        ListenerManager.getInstance().add(ListenerType.clubFastRoomChanged, this, this.clubFastRoomChanged);
        ListenerManager.getInstance().add(ListenerType.clubRoomChanged, this, this.clubRoomChanged);
        ListenerManager.getInstance().add(ListenerType.clubGameSelectChanged, this, this.onGameSelect);
        ListenerManager.getInstance().add(ListenerType.clubTemplateSelectChanged, this, this.onTemplateSelect);
        ListenerManager.getInstance().add(ListenerType.clubRoomUpdateByNewSync, this, this.onClubRoomUpdateByNewSync);
        ListenerManager.getInstance().add(ListenerType.returnHallStatusChanged, this, this.onReturnHallStatusRec);
        ListenerManager.getInstance().add(ListenerType.clubGameTop, this, this.clubGameTop);
        

        // ListenerManager.getInstance().add(ListenerType.clubFastGameListChanged, this, this.onFastGameListChanged);
    }

    onDestroy() {
        super.onDestroy()
        this.clubData = null
    }

    start() {
        this.curSelectGameIdx = -1
        this.curSelectTemplateIdx = -1
        this.node.getChildByName("pinbi").active = false
        this.updateGameData(); // 初始化模板数据
        this.initTableList()
        if (this.gameTemplateMap.size != 0) {
            this.updateGameList()
            this.selectTemplateByPrefer() // 根据偏好选到用户想要的模板
        }
        MessageManager.getInstance().messagePost(ListenerType.clubEnterChanged);
        if (this.clubData.clubType == 0) // 亲友群
        {
            this.node.getChildByName("bottom").getChildByName("btn_import").active = false
            this.node.getChildByName("bottom").getChildByName("btn_geli").active = false
            this.node.getChildByName("bottom").getChildByName("btn_rizhi").active = false
            this.node.getChildByName("bottom").getChildByName("bottom_btn1").active = this.clubData.roleType >= CLUB_POWER.CRT_PRATNER
            this.node.getChildByName("bottom").getChildByName("btn_spread").active = false
            // this.node.getChildByName("bottom").getChildByName("btn_jztz").active = this.clubData.roleType >= CLUB_POWER.CRT_ADMIN
            this.node.getChildByName("bottom").getChildByName("btn_notice").active = this.clubData.roleType == CLUB_POWER.CRT_BOSS
            this.node.getChildByName("bottom").getChildByName("btn_edit").active = this.clubData.roleType >= CLUB_POWER.CRT_BOSS
            this.node.getChildByName("bottom").getChildByName("button_jyfx").active = this.clubData.roleType >= CLUB_POWER.CRT_ADMIN
            this.node.getChildByName("bottom").getChildByName("btn_dismiss").active = this.clubData.roleType >= CLUB_POWER.CRT_ADMIN
        }
        else {
            this.node.getChildByName("bottom").getChildByName("btn_manage").active = this.clubData.roleType >= CLUB_POWER.CRT_PRATNER
            this.node.getChildByName("bottom").getChildByName("btn_rizhi").active = this.clubData.roleType == CLUB_POWER.CRT_PLAYER
            this.node.getChildByName("bottom").getChildByName("btn_notice").active = this.clubData.roleType == CLUB_POWER.CRT_BOSS
            this.node.getChildByName("bottom").getChildByName("bottom_btn1").active = this.clubData.roleType >= CLUB_POWER.CRT_PRATNER
            this.node.getChildByName("bottom").getChildByName("btn_dismiss").active = this.clubData.roleType >= CLUB_POWER.CRT_ADMIN
            this.node.getChildByName("bottom").getChildByName("btn_import").active = (this.clubData.roleType >= CLUB_POWER.CRT_PRATNER && this.clubData.roleType != CLUB_POWER.CRT_ADMIN)
            // this.node.getChildByName("bottom").getChildByName("btn_geli").active = false

            if (this.clubData.isBigBossOfUnion()) // 大盟主或者大联盟管理员
            {
                // this.node.getChildByName("bottom").getChildByName("btn_jztz").active = true
                this.node.getChildByName("bottom").getChildByName("btn_edit").active = this.clubData.roleType != CLUB_POWER.CRT_ADMIN
                this.node.getChildByName("bottom").getChildByName("btn_spread").active = this.clubData.roleType != CLUB_POWER.CRT_ADMIN
                this.node.getChildByName("bottom").getChildByName("btn_geli").active = this.clubData.roleType != CLUB_POWER.CRT_ADMIN
            }
            else if (this.clubData.roleType == CLUB_POWER.CRT_PRATNER) // 合伙人
            {
                this.node.getChildByName("bottom").getChildByName("btn_spread").active = true
                this.node.getChildByName("bottom").getChildByName("btn_geli").active = true
                this.node.getChildByName("bottom").getChildByName("btn_edit").active = false
                // this.node.getChildByName("bottom").getChildByName("btn_jztz").active = false
            }
            else {
                this.node.getChildByName("bottom").getChildByName("btn_edit").active = false
                this.node.getChildByName("bottom").getChildByName("btn_spread").active = false
                // this.node.getChildByName("bottom").getChildByName("btn_jztz").active = false
            }
        }
        if (UIManager.getInstance().getUI(Wait2UI)) {
            UIManager.getInstance().getUI(Wait2UI).getComponent("Wait2UI").stopWait()
        }
        this.resetScrollAndTable()
        this.onReturnHallStatusRec()
    }

    //房间列表刷新
    private clubRoomListChanged(msg: any) {
        this.updateGameData()
        if (this.gameTemplateMap.size != 0)
            this.updateGameList()
    }
    public onChangeTableListData(msg: any) {
        //this.updateGameData()
        this.refreshCurTable()
    }

    //房间信息改变同步
    private clubRoomChanged(msg: any) {
        if (this.curSelectGameIdx > 0 && this.curSelectGameIdx < this.gameNodeList.length)// 当前选中的不是全部，且增加的玩法不是当前选中的玩法
        {
            var curSelectGameType = this.gameNodeList[this.curSelectGameIdx].getComponent('ClubGameItem').getGameType()
            if (curSelectGameType != msg.gameId)
                return
            if (this.curSelectTemplateIdx != 0 && this.templateNodeList.length > this.curSelectTemplateIdx) {
                var curSelectTemplateId = this.templateNodeList[this.curSelectTemplateIdx].getComponent('ClubTemplateItem').getTemplateId()
                if (msg.templateId != curSelectTemplateId)
                    return
            }
        }
        if (msg.type == SYNC_TYPE.SYNC_DEL) {
            for (var i = 0; i < this.curShowArray.length; ++i) {
                if (this.curShowArray[i].tableId == msg.index) {
                    // this.tableNodeList[i].removeFromParent(); // 从父节点移除
                    // this.tableNodeList.splice(i, 1) // 删除节点
                    this.curShowArray.splice(i, 1)
                    this.updateCurTableNodeData()
                    break;
                }
            }
        }
        else if (msg.type == SYNC_TYPE.SYNC_UPDATE) { // 桌子信息更新
            var updateInfo = null;
            for (var i = 0; i < this.clubData.clubRoomList.length; ++i) {
                if (this.clubData.clubRoomList[i].tableId == msg.index) {
                    updateInfo = this.clubData.clubRoomList[i];
                    break;
                }
            }
            for (var i = 0; i < this.tableNodeList.length; ++i) {
                if (this.tableNodeList[i].getComponent("ClubTableItem").getUniqueId() == msg.index) {
                    this.curShowArray[i] = updateInfo
                    this.setItemInfo(this.tableNodeList[i], i);
                    break;
                }
            }
        }
        else if (msg.type == SYNC_TYPE.SYNC_ADD) {
            for (var i = 0; i < this.clubData.clubRoomList.length; ++i) {
                if (this.clubData.clubRoomList[i].tableId == msg.index) {
                    // let item = cc.instantiate(this.roomPrefab);
                    this.curShowArray.push(this.clubData.clubRoomList[i]); // 插入到末尾
                    // this.setItemInfo(item, this.curShowArray.length - 1);
                    // this.tableListContent.addChild(item);
                    // this.tableNodeList.push(item)
                    this.updateCurTableNodeData()
                    this.tableListContent.width = this.roomPrefab.data.width * Math.ceil(this.curShowArray.length / 2);
                    if (this.tableListContent.width < this.curWidth)
                        this.tableListContent.width = this.curWidth;
                    break;
                }
            }
        }
        this.updateTableNum()
    }

    private onClubRoomUpdateByNewSync() {
        if (this.gameTemplateMap.size != 0)
            this.updateTableList()
    }

    private onReturnHallStatusRec() {
        this.node.getChildByName("btn_return_room").active = GameDataManager.getInstance().returnHallStatus
    }

    // 模板信息变化
    clubFastRoomChanged(msg) {
        this.updateGameData()
        if (this.gameTemplateMap.size != 0) {
            if (msg.type != SYNC_TYPE.SYNC_DEL) {
                var selectGameIdx = this.curSelectGameIdx
                this.updateGameList(false)
                if (this.curSelectGameIdx != 0) // 没有选中全部且当前的的玩法不是增加的玩法
                {
                    var curSelectGameType = this.gameNodeList[this.curSelectGameIdx].getComponent('ClubGameItem').getGameType()
                    if (curSelectGameType != msg.gameId)
                        return
                }
                if (msg.type == SYNC_TYPE.SYNC_ADD) // 增加一个模板
                {
                    if (this.curSelectGameIdx == 0) // 选中的是全部
                    {
                        if (this.curSelectTemplateIdx == 0)
                            this.updateTemplateList(false)
                    }
                    if (this.curSelectTemplateIdx != 0) // 当前选中的不是全部
                    {
                        var curSelectTemplateId = -1
                        if (this.curSelectTemplateIdx < this.templateNodeList.length)
                            curSelectTemplateId = this.templateNodeList[this.curSelectTemplateIdx].getComponent('ClubTemplateItem').getTemplateId()
                        if (msg.index != curSelectTemplateId) // 当前增加的模板不等于当前选中模板
                        {
                            this.updateTemplateList(false)
                            return
                        }
                    }
                    if (selectGameIdx == -1 && this.curSelectGameIdx == 0) // 如果没有任何模板首次创建，为了避免重复刷新在此处判断
                        return
                    // let item = cc.instantiate(this.roomPrefab);
                    this.addDefaultTemplateById(msg.index)
                    this.updateCurTableNodeData()
                    // var lastIdx = this.curShowArray.length - 1
                    // this.setItemInfo(item, lastIdx);
                    // this.tableListContent.addChild(item);
                    // this.tableNodeList.push(item)
                    this.tableListContent.width = this.roomPrefab.data.width * Math.ceil(this.curShowArray.length / 2);
                    if (this.tableListContent.width < this.curWidth)
                        this.tableListContent.width = this.curWidth;
                    if (this.curSelectGameIdx != 0) // 不是选中全部玩法时，没有下方模板列表
                        this.updateTemplateList(false)
                }
                else if (msg.type == SYNC_TYPE.SYNC_UPDATE) // 更新一个模板
                {
                    var templateInfo = this.clubData.getTemplateInfoById(msg.index)
                    for (var i = 0; i < this.tableNodeList.length; ++i) {
                        if (this.tableNodeList[i].getComponent("ClubTableItem").getUniqueId() == msg.index) {
                            var info =
                            {
                                seatList: [],
                                mbTableStarted: false,
                                tableId: 0,
                                roomCurRound: -1,
                                rule: templateInfo.template.rule,
                                gameType: templateInfo.template.gameId,
                                templateId: templateInfo.template.templateId,
                                name: templateInfo.template.description
                            }
                            this.curShowArray[i] = info
                            this.setItemInfo(this.tableNodeList[i], i);
                        }
                    }

                    for (var i = 0; i < this.templateNodeList.length; ++i) {
                        var tempId = this.templateNodeList[i].getComponent('ClubTemplateItem').getTemplateId()
                        if (tempId == msg.index)
                            this.templateNodeList[i].getComponent('ClubTemplateItem').setInfo(i, tempId)
                    }

                }
            }
            else {
                this.updateGameList()
            }
        }
        else {
            this.gameListContent.removeAllChildren()
            this.templateListContent.removeAllChildren()
            this.curShowArray = []
            this.gameNodeList = [];
            this.templateNodeList = [];
            this.updateCurTableNodeData()
        }
    }

    // 初始化
    private updateGameData() {
        this.gameTemplateMap.clear()
        // 遍历所有的玩法列表
        for (let i = 0; i < this.clubData.clubFastList.length; ++i) {
            var gameId = this.clubData.clubFastList[i].template.gameId
            var templateId = this.clubData.clubFastList[i].template.templateId
            var templateList = this.gameTemplateMap.get(gameId)
            if (templateList) {
                templateList.push(templateId)
                this.gameTemplateMap.set(gameId, templateList)
            }
            else
                this.gameTemplateMap.set(gameId, [templateId])
        }
    }

    private updateGameList(needRefresh = true) {
        this.gameListContent.removeAllChildren()
        this.gameNodeList = []
        let itemSize = (this.clubData.roleType >= CLUB_POWER.CRT_PRATNER || this.clubData.clubAllPlayerNum < ConstValue.MAX_CLUB_PLAYER_LIMIT) ? (this.gameTemplateMap.size + 1) : this.gameTemplateMap.size
        this.gameListContent.height = 95 * itemSize
        if (this.gameListContent.height < 570)
            this.gameListContent.height = 570;
        var allItem = cc.instantiate(this.gamePrefab) // 增加一个全部按钮
        this.gameListContent.addChild(allItem);
        allItem.getComponent('ClubGameItem').setInfo(0, -1)
        allItem.setPosition(0, -allItem.height * 0.5 - 5);
        if(allItem.getChildByName("zhiding"))
        {
            allItem.getChildByName("zhiding").active = false
        }
        
        this.gameNodeList.push(allItem)
        var idx = 1
        //获取置顶的GameID
        let topGameId = cc.sys.localStorage.getItem("topGameId")
        if (topGameId != null) {
            topGameId = Number(topGameId)
            if(this.gameTemplateMap.has(topGameId)){
                let item = cc.instantiate(this.gamePrefab)
                this.gameListContent.addChild(item)
                item.getComponent('ClubGameItem').setInfo(idx, topGameId)
                let posIndex = (this.clubData.roleType >= CLUB_POWER.CRT_PRATNER || this.clubData.clubAllPlayerNum < ConstValue.MAX_CLUB_PLAYER_LIMIT) ? idx : (idx - 1)
                item.setPosition(0, -allItem.height * (0.5 + posIndex) - 5)
                item.getChildByName("zhiding").active = true
                this.gameNodeList.push(item)
                idx += 1
            }         
        }
        this.gameTemplateMap.forEach((list, gameId) => {
            if(topGameId != gameId){
                let item = cc.instantiate(this.gamePrefab)
                this.gameListContent.addChild(item)
                item.getComponent('ClubGameItem').setInfo(idx, gameId)
                let posIndex = (this.clubData.roleType >= CLUB_POWER.CRT_PRATNER || this.clubData.clubAllPlayerNum < ConstValue.MAX_CLUB_PLAYER_LIMIT) ? idx : (idx - 1)
                item.setPosition(0, -allItem.height * (0.5 + posIndex) - 5)
                item.getChildByName("zhiding").active = false
                this.gameNodeList.push(item)
                idx += 1
            }
        })
        if (this.curSelectGameIdx == -1) {
            if (this.clubData.roleType == CLUB_POWER.CRT_PLAYER && this.clubData.clubAllPlayerNum >= ConstValue.MAX_CLUB_PLAYER_LIMIT && this.gameNodeList.length > 1) {
                this.gameNodeList[1].getComponent('ClubGameItem').btn_click()
            }else if (topGameId != null && this.gameTemplateMap.has(topGameId)) {
                this.gameNodeList[1].getComponent('ClubGameItem').btn_click()
            }
            else {
                allItem.getComponent('ClubGameItem').btn_click()
            }
        }
        else if (!needRefresh) {
            this.gameNodeList[this.curSelectGameIdx].getComponent('ClubGameItem').setSelect(true)
        }
        else {
            var selectIdx = this.curSelectGameIdx
            this.curSelectGameIdx = -1
            if (selectIdx > this.gameNodeList.length - 1)
                this.gameNodeList[this.gameNodeList.length - 1].getComponent('ClubGameItem').btn_click(null, null, true)
            else
                this.gameNodeList[selectIdx].getComponent('ClubGameItem').btn_click(null, null, true)
        }
        allItem.active = (this.clubData.roleType >= CLUB_POWER.CRT_PRATNER || this.clubData.clubAllPlayerNum < ConstValue.MAX_CLUB_PLAYER_LIMIT);

    }

    private onGameSelect(msg) {
        var idx = msg.idx
        if (idx == this.curSelectGameIdx)
            return
        if (this.curSelectGameIdx != -1)
            this.gameNodeList[this.curSelectGameIdx].getComponent('ClubGameItem').setSelect(false)
        if (idx >= this.gameNodeList.length) {
            // 出现了问题
            this.clubData = GameDataManager.getInstance().clubData;
            this.curSelectGameIdx = -1
            this.curSelectTemplateIdx = -1
            this.gameNodeList = [];
            this.templateNodeList = [];
            this.gameListContent.removeAllChildren()
            this.templateListContent.removeAllChildren()
            this.updateGameData();
            if (this.gameTemplateMap.size != 0)
                this.updateGameList()
            return
        }
        this.gameNodeList[idx].getComponent('ClubGameItem').setSelect(true)
        this.curSelectGameIdx = idx
        if (idx == 0) // 选中的事全部
        {
            this.curSelectTemplateIdx = -1
            this.updateTemplateList()
        }
        else {
            this.updateTemplateList()
            if (this.rightSsActionStatus == 0 && msg.autoSelect == false) // 伸出
                this.doRightSsAction(0)
        }
    }

    private updateTemplateList(needRefresh = true) {
        this.bInitData = true
        this.templateListContent.removeAllChildren()
        this.templateNodeList = []
        var dataList = []
        if (this.curSelectGameIdx != 0) // 选中的不是全部
        {
            var curSelectGameType = this.gameNodeList[this.curSelectGameIdx].getComponent('ClubGameItem').getGameType()
            dataList = this.gameTemplateMap.get(curSelectGameType)
        }
        else {
            for (let i = 0; i < this.clubData.clubFastList.length; ++i) {
                var templateId = this.clubData.clubFastList[i].template.templateId
                dataList.push(templateId)
            }
        }

        let itemSize = (this.clubData.roleType >= CLUB_POWER.CRT_PRATNER || this.clubData.clubAllPlayerNum < ConstValue.MAX_CLUB_PLAYER_LIMIT) ? (dataList.length + 1) : dataList.length
        this.templateListContent.height = 90 * itemSize
        if (this.templateListContent.height < 570)
            this.templateListContent.height = 570;

        var allItem = cc.instantiate(this.templatePrefab) // 增加一个全部按钮
        this.templateListContent.addChild(allItem);
        allItem.getComponent('ClubTemplateItem').setInfo(0, -1)
        allItem.setPosition(-allItem.width / 2, -(allItem.height * 0.5 + 5));
        this.templateNodeList.push(allItem)
        var idx = 1
        for (var id of dataList) {
            let item = cc.instantiate(this.templatePrefab);
            this.templateListContent.addChild(item);
            item.getComponent('ClubTemplateItem').setInfo(idx, id)
            let posIndex = (this.clubData.roleType >= CLUB_POWER.CRT_PRATNER || this.clubData.clubAllPlayerNum < ConstValue.MAX_CLUB_PLAYER_LIMIT) ? idx:(idx-1)
            item.setPosition(-allItem.width / 2, -(item.height * (posIndex + 0.5) + 5));
            this.templateNodeList.push(item)
            idx += 1
        }

        if (this.curSelectTemplateIdx == -1) {
            if (this.clubData.roleType == CLUB_POWER.CRT_PLAYER && this.clubData.clubAllPlayerNum >= ConstValue.MAX_CLUB_PLAYER_LIMIT) {
                this.templateNodeList[1].getComponent('ClubTemplateItem').btn_click()
            } else {
                allItem.getComponent('ClubTemplateItem').btn_click()
            }

        }
        else if (!needRefresh) {
            this.templateNodeList[this.curSelectTemplateIdx].getComponent('ClubTemplateItem').setSelect(true)
        }
        else {
            var selectIdx = this.curSelectTemplateIdx
            this.curSelectTemplateIdx = -1
            if (selectIdx > this.templateNodeList.length - 1)
                this.templateNodeList[this.templateNodeList.length - 1].getComponent('ClubTemplateItem').btn_click()
            else
                this.templateNodeList[selectIdx].getComponent('ClubTemplateItem').btn_click()
        }
        allItem.active = (this.clubData.roleType >= CLUB_POWER.CRT_PRATNER || this.clubData.clubAllPlayerNum < ConstValue.MAX_CLUB_PLAYER_LIMIT);
        this.bInitData = false
    }

    private onTemplateSelect(msg) {
        if (this.templateNodeList.length == 0) {
            this.data_temp = msg;
            return
        }
        this.data_temp = null
        this.resetScrollAndTable()
        var idx = msg.idx
        if (idx == this.curSelectTemplateIdx)
            return
        try {
            if (this.curSelectTemplateIdx != -1 && this.templateNodeList[this.curSelectTemplateIdx]) {
                this.templateNodeList[this.curSelectTemplateIdx].getComponent('ClubTemplateItem').setSelect(false)
            }
            this.templateNodeList[idx].getComponent('ClubTemplateItem').setSelect(true)
            this.curSelectTemplateIdx = idx
            this.requestTableData()
        }
        catch (e) {
            GameManager.getInstance().openWeakTipsUI("加载桌子失败");
        }
    }

    private initTableList() {
        var initNum = 24
        if (initNum % 2 != 0)
            initNum += 1
        for (var i = 0; i < initNum; ++i) {
            let item = cc.instantiate(this.roomPrefab);
            this.tableListContent.addChild(item);
            item.getComponent('ClubTableItem').hideSelf(true)
            item.getComponent('ClubTableItem').setTabelIndex(i)
            this.tableNodeList.push(item)
        }


    }

    resetScrollAndTable() {
        this.scrollView.content.x = 0;
        var count = 0
        var posx = 0
        var posy = 0
        for (var i = 0; i < this.tableNodeList.length; ++i) {
            if (i % 2 == 0) // 偶数列
            {
                posx = this.tableNodeList[i].width * (0.5 + count)
                posy = -150
                count++
            }
            else {
                posy = -410
            }
            this.tableNodeList[i].setPosition(posx, posy)
            this.tableNodeList[i].getComponent('ClubTableItem').setTabelIndex(i)
        }
    }

    // 用于重新给桌子排序
    public refreshCurTable() {
        if (this.curSelectGameIdx == -1 && this.curSelectTemplateIdx == -1)
            return
        if ((this.curSelectGameIdx == -1 || this.curSelectTemplateIdx == -1) && this.clubData.roleType == CLUB_POWER.CRT_PLAYER)
            return
        if (this.gameTemplateMap.size != 0)
            this.updateTableList()
    }

    private updateTableList() {
        if (this.curSelectGameIdx == 0 && this.curSelectTemplateIdx == 0) // 选中的是全部玩法
            this.selectGameOrWait(1);
        else if (this.curSelectTemplateIdx == 0 && this.curSelectGameIdx != 0) // 选中的某种游戏的全部模板
            this.selectGameOrWait(2);
        else
            this.selectGameOrWait(3);
        this.tableListContent.width = this.roomPrefab.data.width * Math.ceil(this.curShowArray.length / 2);

        if (this.tableListContent.width < this.curWidth)
            this.tableListContent.width = this.curWidth;
        this.updateCurTableNodeData()
        this.updateTableNum()
    }

    getPositionInView(item) {
        let worldPos = item.parent.convertToWorldSpaceAR(item.position);
        let viewPos = this.scrollView.node.convertToNodeSpaceAR(worldPos);
        return viewPos;
    }

    update(dt) {
        this.updateTimer += dt;
        this.sortTableTime -= dt;
        if (this.sortTableTime <= 0) {
            this.sortTableTime = 2
            this.refreshCurTable()
        }
        if (this.updateTimer < this.updateInterval)
            return;
        this.updateTimer = 0;
        let items = this.tableNodeList;
        let isLeft = this.scrollView.content.x < this.lastContentPosX;
        if (this.scrollView.content.x == this.lastContentPosX)
            return
        let offset = (this.roomPrefab.data.width) * items.length / 2;
        for (let i = 0; i < items.length; ++i) {
            let viewPos = this.getPositionInView(items[i]);
            if (isLeft) {
                if (viewPos.x < -1.5 * this.roomPrefab.data.width) {
                    items[i].x = items[i].x + offset;
                    let item = items[i].getComponent('ClubTableItem');
                    let itemId = item.getTabelIndex() + items.length;
                    this.setItemInfo(items[i], itemId);
                }
            }
            else {
                if (viewPos.x > offset - this.roomPrefab.data.width * 1.5) {
                    items[i].x = items[i].x - offset;
                    let item = items[i].getComponent('ClubTableItem');
                    let itemId = item.getTabelIndex() - items.length;
                    this.setItemInfo(items[i], itemId);
                }
            }
        }
        this.lastContentPosX = this.scrollView.content.x;
        if (this.data_temp && !this.bInitData) {
            this.onTemplateSelect(this.data_temp)
        }
    }

    private updateCurTableNodeData() { // 手动刷新当前所有的tablenode节点的数据
        for (let i = 0; i < this.tableNodeList.length; ++i) {
            let item = this.tableNodeList[i].getComponent('ClubTableItem');
            let dataIdx = item.getTabelIndex();
            this.setItemInfo(this.tableNodeList[i], dataIdx);
        }
    }

    private setItemInfo(item, idx) {
        let roomitem = item.getComponent('ClubTableItem');
        if (idx >= this.curShowArray.length) {
            roomitem.setTabelIndex(idx);
            roomitem.hideSelf(true)
            return;
        }
        if (idx < 0) {
            roomitem.setTabelIndex(idx);
            roomitem.hideSelf(true)
            return;
        }
        roomitem.setTabelIndex(idx);
        var itemInfo = this.curShowArray[idx]
        roomitem.setGameType(itemInfo.gameType, itemInfo);
        roomitem.hideSelf(false);
        roomitem.setState(itemInfo.roomCurRound > 0)
        roomitem.setPlayer(itemInfo.seatList);
    }

    //筛选等待中还是游戏中
    private selectGameOrWait(type) {
        this.curShowArray = [];
        if (type == 1) {
            for (let i = 0; i < this.clubData.clubRoomList.length; ++i)
                this.curShowArray.push(this.clubData.clubRoomList[i]);
            this.curShowArray.sort(function (a, b) { return a.roomCurRound - b.roomCurRound });
            for (let i = 0; i < this.clubData.clubFastList.length; ++i)
                this.addDefaultTemplateById(this.clubData.clubFastList[i].template.templateId)
        }
        else if (type == 2) {
            var curSelectGameType = this.gameNodeList[this.curSelectGameIdx].getComponent('ClubGameItem').getGameType()
            var tempList = this.gameTemplateMap.get(curSelectGameType)
            for (let i = 0; i < this.clubData.clubRoomList.length; ++i) {
                var tempId = this.clubData.clubRoomList[i].templateId
                if (tempList.indexOf(tempId) >= 0)
                    this.curShowArray.push(this.clubData.clubRoomList[i]);
            }
            this.curShowArray.sort(function (a, b) { return a.roomCurRound - b.roomCurRound });
            for (var temlateId of tempList)
                this.addDefaultTemplateById(temlateId)
        }
        else {
            if (this.templateNodeList.length > this.curSelectTemplateIdx && this.templateNodeList[this.curSelectTemplateIdx]) //当找不到选中的模板的时候
            {
                var curSelectTemplateId = this.templateNodeList[this.curSelectTemplateIdx].getComponent('ClubTemplateItem').getTemplateId()
                for (let i = 0; i < this.clubData.clubRoomList.length; ++i) {
                    var tempId = this.clubData.clubRoomList[i].templateId
                    if (tempId == curSelectTemplateId)
                        this.curShowArray.push(this.clubData.clubRoomList[i]);
                }
                this.curShowArray.sort(function (a, b) { return a.roomCurRound - b.roomCurRound });
                this.addDefaultTemplateById(curSelectTemplateId)
            }
        }
    }

    // private updateFastGameBtn()
    // {
    //     for (var idx = 1; idx < 5; idx++)
    //     {
    //         var name = "未配置"
    //         if (this.clubData.fastGameList[idx - 1] >= 0)
    //         {
    //             var templateInfo = this.clubData.getTemplateInfoById(this.clubData.fastGameList[idx - 1])
    //             if (!templateInfo)
    //             {
    //                 this.clubData.fastGameList[idx - 1] = -1
    //                 if (this.clubData.roleType > CLUB_POWER.CRT_PRATNER)
    //                     MessageManager.getInstance().messageSend(Proto.C2S_CONFIG_FAST_GAME_LIST.MsgID.ID, { clubId:this.clubData.curSelectClubId, templateIds:{1:this.clubData.fastGameList[0], 2:this.clubData.fastGameList[1],
    //                         3:this.clubData.fastGameList[2], 4:this.clubData.fastGameList[3]}});
    //                 this.node.getChildByName("node_config").getChildByName("btn_config"+idx).getChildByName("label_con1").getComponent(cc.Label).string = name
    //                 continue
    //             }
    //             name = Utils.getShortName(templateInfo.template.description)
    //         }
    //         this.node.getChildByName("node_config").getChildByName("btn_config"+idx).getChildByName("label_con1").getComponent(cc.Label).string = name
    //     }
    // }

    addDefaultTemplateById(templateId) {
        for (let i = 0; i < this.clubData.clubFastList.length; ++i) {
            if (templateId == this.clubData.clubFastList[i].template.templateId) {
                let info =
                {
                    seatList: [],
                    mbTableStarted: false,
                    tableId: 0,
                    roomCurRound: -1,
                    rule: this.clubData.clubFastList[i].template.rule,
                    gameType: this.clubData.clubFastList[i].template.gameId,
                    templateId: this.clubData.clubFastList[i].template.templateId,
                    name: this.clubData.clubFastList[i].template.description
                }
                this.curShowArray.push(info);
            }
        }
    }

    addTestTable(num) {
        for (let i = 0; i < num; ++i) {
            let info =
            {
                seatList: [],
                mbTableStarted: false,
                tableId: 0,
                roomCurRound: -1,
                rule: "{}",
                gameType: 210,
                templateId: 0,
                name: ""
            }
            this.curShowArray.push(info);
        }
    }

    updateTableNum() {
        var wait = 0
        var gamingNum = 0
        for (var i = 0; i < this.curShowArray.length; ++i) {
            if (this.curShowArray[i].roomCurRound == 0)
                wait += 1
            else if (this.curShowArray[i].roomCurRound > 0)
                gamingNum += 1
        }
        var finalDisplay = "满人 " + gamingNum + " 桌\n等待 " + wait + " 桌"
        if (this.clubData.clubSettings != "") {
            var info = JSON.parse(this.clubData.clubSettings)
            if ((info.limit_table_num == true || info.limit_table_num == "true") && this.clubData.roleType < CLUB_POWER.CRT_ADMIN) {
                var str1 = gamingNum.toString()
                var str2 = wait.toString()
                if (gamingNum > 20)
                    str1 = "20+"
                if (wait > 20)
                    str2 = "20+"
                finalDisplay = "满人 " + str1 + " 桌\n等待 " + str2 + " 桌"
            }
        }
        this.node.parent.parent.getChildByName("label_des").getComponent(cc.Label).string = finalDisplay
    }

    private button_add() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(RuleUI, 1, () => {
            UIManager.getInstance().getUI(RuleUI).getComponent("RuleUI").setGameTypeData(this.clubData.clubPower)
            UIManager.getInstance().getUI(RuleUI).getComponent("RuleUI").initUI(2);
        });

    }

    private doLeftSsAction(type) // 左侧游戏伸缩
    {
        var size = this.node.getContentSize()
        var leftNode = this.node.getChildByName("game_scroll")
        leftNode.stopAllActions();
        let rootnode = this.node.parent.parent
        //let btn_more = rootnode.getChildByName("btn_more")
        //let btn_more2 = rootnode.getChildByName("clubScroll").getChildByName("btn_more")
        var status = 0
        if (type == 0) // 伸开
        {
            leftNode.position = cc.v3(-size.width / 2 - 128, leftNode.position.y)
            var action = cc.moveTo(0.2, cc.v2(-size.width / 2 + 128, leftNode.position.y));
            status = 1
            // this.leftSsBtnNode.angle = 180
        }
        else // 缩回
        {
            leftNode.position = cc.v3(-size.width / 2 + 128, leftNode.position.y)
            var action = cc.moveTo(0.2, cc.v2(-size.width / 2 - 128, leftNode.position.y));
            cc.find("game_scroll/helpBtn/wordbg", this.node).active = false
            status = 0
            // this.leftSsBtnNode.angle = 0
        }
        var action1 = cc.callFunc(function () {
            this.leftSsActionStatus = status
            if (status == 1)
                this.node.getChildByName("pinbi").active = true
            if (this.leftSsActionStatus == 0 && this.rightSsActionStatus == 0)
                this.node.getChildByName("pinbi").active = false

            // if(type == 1)
            // {
            //     btn_more.active = false
            //     btn_more2.active = true
            // }
        }.bind(this))
        let seq = cc.sequence(action, action1);
        leftNode.runAction(seq)
        // if(type == 0)
        // {
        //     btn_more2.active = false
        //     btn_more.active = true
        // }   
    }

    private doRightSsAction(type) // 右侧玩法伸缩
    {
        var size = this.node.getContentSize()
        var rightNode = this.node.getChildByName("template_scroll")
        var status = 0
        if (type == 0) // 伸开
        {
            rightNode.position = cc.v3(size.width / 2 + 250, rightNode.position.y)
            var action = cc.moveTo(0.2, cc.v2(size.width / 2, rightNode.position.y));
            status = 1
            // this.rightSsBtnNode.angle = 180
        }
        else // 缩回
        {
            rightNode.position = cc.v3(size.width / 2, rightNode.position.y)
            var action = cc.moveTo(0.2, cc.v2(size.width / 2 + 250, rightNode.position.y));
            status = 0
            // this.rightSsBtnNode.angle = 0           
        }
        var action1 = cc.callFunc(function () {
            this.rightSsActionStatus = status
            if (status == 1)
                this.node.getChildByName("pinbi").active = true
            if (this.leftSsActionStatus == 0 && this.rightSsActionStatus == 0) {
                this.node.getChildByName("pinbi").active = false
            }
        }.bind(this))
        let seq = cc.sequence(action, action1);
        rightNode.runAction(seq)
    }

    private selectTemplateByPrefer() {
        if (this.templateNodeList.length == 0)
            return
        var preferEnterTemplateList = PreferentData.getInstance().getPreferTemplateList()
        if (preferEnterTemplateList.length == 0)
            return
        PreferentData.getInstance().clearEnterGamePrefer()
        for (var preferId of preferEnterTemplateList) {
            for (var templateNode of this.templateNodeList) {
                if (templateNode.getComponent('ClubTemplateItem').getTemplateId() == preferId) {
                    templateNode.getComponent('ClubTemplateItem').btn_click()
                    return
                }
            }
        }
    }


    private button_leftss() {
        AudioManager.getInstance().playSFX("button_click");
        if (this.leftSsActionStatus == 0) // 伸出
            this.doLeftSsAction(0)
        else // 缩回
            this.doLeftSsAction(1)
    }

    private button_rightss() {
        AudioManager.getInstance().playSFX("button_click");
        if (this.rightSsActionStatus == 0) // 伸出
            this.doRightSsAction(0)
        else // 缩回
            this.doRightSsAction(1)
    }

    private button_pinbi() {
        if (this.leftSsActionStatus != 0)
            this.doLeftSsAction(1)
        if (this.rightSsActionStatus != 0)
            this.doRightSsAction(1)
        this.node.getChildByName("pinbi").active = false
        cc.find("game_scroll/helpBtn/wordbg", this.node).active = false
    }

    // 配置玩法
    private button_edit_game() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(Club_Quick_Game_UI, 1, () => {
            // UIManager.getInstance().getUI(Club_Quick_Game_UI).getComponent("Club_Quick_Game_UI").initUI();
        });

    }

    private button_jyfx() {
        if (this.clubData.roleType == CLUB_POWER.CRT_BOSS)
            UIManager.getInstance().openUI(UnionUI_Analysis, 1)
        else {
            if (this.clubData.clubSettings != "") {
                var info = JSON.parse(this.clubData.clubSettings)
                if (info.admin_analysis) {
                    UIManager.getInstance().openUI(UnionUI_Analysis, 1)
                    return
                }
            }
            GameManager.getInstance().openWeakTipsUI("暂无权限，请联系群主获取权限");
        }

    }

    private button_notice() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(ClubNotice, 1)
    }


    // 推广设置按钮
    private button_tg() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(UnionUI_Spread, 1);
    }

    //禁止同桌
    private button_jztz() {
        AudioManager.getInstance().playSFX("button_click");
        if (this.clubData.curClubStatus == 2) {
            GameManager.getInstance().openWeakTipsUI("处于封禁状态无法处理");
            return
        }
        UIManager.getInstance().openUI(UnionUI_Table_Blacklist, 6)
    }

    //成员
    private button_member() {
        AudioManager.getInstance().playSFX("button_click");
        if (this.clubData.curClubStatus == 2 || this.clubData.parentStatus == 2) {
            GameManager.getInstance().openWeakTipsUI("处于封禁状态无法处理");
            return
        }
        if (this.clubData.roleType == CLUB_POWER.CRT_PLAYER) {
            GameManager.getInstance().openWeakTipsUI("暂未开放此功能");
            return
        }
        if (this.clubData.clubType == 0) {
            UIManager.getInstance().openUI(ClubMemberUI, 1, () => {
                UIManager.getInstance().getUI(ClubMemberUI).getComponent("ClubMemberUI").initView(GameDataManager.getInstance().userInfoData.userId)
            })
        }
        else {
            UIManager.getInstance().openUI(ClubMemberUI_New, 1, () => {
                UIManager.getInstance().getUI(ClubMemberUI_New).getComponent("ClubMemberUI_New").initView(GameDataManager.getInstance().userInfoData.userId)
            })
        }
    }

    //战绩
    private button_record() {
        AudioManager.getInstance().playSFX("button_click");
        var clubData = GameDataManager.getInstance().clubData;
        if (!clubData)
            return
        if (clubData.clubType != 0 && clubData.roleType >= CLUB_POWER.CRT_PRATNER)
            UIManager.getInstance().openUI(UnionUI_Record, 1, () => { })
        else {
            UIManager.getInstance().openUI(ClubRecordUI, 1, () => {
                let userinfo = GameDataManager.getInstance().userInfoData;
                UIManager.getInstance().getUI(ClubRecordUI).getComponent("ClubRecordUI").setQueryPlayerInfo(userinfo.userId, userinfo.userName, null)
                UIManager.getInstance().getUI(ClubRecordUI).getComponent("ClubRecordUI").updateView()
            })
        }
    }

    //管理
    private button_manage() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(UnionUI_Manage, 5, () => { })
    }



    private button_config(event, customEventData) {
        AudioManager.getInstance().playSFX("button_click");
        // 快速进入房间
        var idx = parseInt(customEventData)
        if (this.clubData.fastGameList[idx - 1] >= 0) {
            if (GameDataManager.getInstance().isCreatingRoom) {
                GameManager.getInstance().openWeakTipsUI("房间创建中，请稍后");
                return
            }
            var templateInfo = this.clubData.getTemplateInfoById(this.clubData.fastGameList[idx - 1])
            var rule = JSON.parse(templateInfo.template.rule)
            if (rule.option.gps_distance > 0) {
                if (!Utils.checkGps())
                    return
            }
            let msg =
            {
                clubId: this.clubData.curSelectClubId,
                templateId: this.clubData.fastGameList[idx - 1],
            }

            GameDataManager.getInstance().isCreatingRoom = true
            MessageManager.getInstance().messageSend(Proto.CS_CreateRoom.MsgID.ID, msg);
        }
        else { // 配置房间
            if (this.clubData.roleType <= CLUB_POWER.CRT_PRATNER) {
                GameManager.getInstance().openWeakTipsUI("暂未配置可用的快捷玩法");
                return
            }
            UIManager.getInstance().openUI(Club_Quick_Game_UI, 1, () => {
                UIManager.getInstance().getUI(Club_Quick_Game_UI).getComponent("Club_Quick_Game_UI").setConfig(idx - 1);
            });
        }
    }

    private button_rizhi() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(UnionUI_Daily_Record, 5, () => {
            UIManager.getInstance().getUI(UnionUI_Daily_Record).getComponent("UnionUI_Daily_Record").initView(GameDataManager.getInstance().userInfoData.userId)
        })
    }

    private button_dismiss() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(ClubKeyboardUI, 20, () => {
            UIManager.getInstance().getUI(ClubKeyboardUI).getComponent("ClubKeyboardUI").initView(5, null)
        })
    }

    private button_import() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(UnionUI_Import, 5)
    }

    private button_fast_game() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(ClubFastJoinUI, 5)
    }

    private button_geli() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(ClubGameOpenUI, 5)
    }
    private button_return_room() {
        AudioManager.getInstance().playSFX("button_click");
        GameUIRepeatMsgManage.getInstance().messageSendBeforeCheck(Proto.CS_ReconnectJoinRoom.MsgID.ID, {});
    }
    private button_help(event, customData) {
        let wordbg = event.target.getChildByName("wordbg")
        wordbg.active = !wordbg.active
    }
    private onGameListChanged(msg) {
        GameManager.getInstance().openWeakTipsUI(StringData.getString(10047));
        MessageManager.getInstance().disposeMsg();
    }
    //成员每次选择游戏或者该游戏玩法的时候需要重新请求桌子数据
    private requestTableData() {
        //非成员才显示全部按钮  所以成员的时候只有游戏和玩法都选择了才请求数据 
        if (this.clubData.roleType == CLUB_POWER.CRT_PLAYER && this.clubData.clubAllPlayerNum >= ConstValue.MAX_CLUB_PLAYER_LIMIT && this.curSelectTemplateIdx > 0 && this.curSelectGameIdx > 0) {
            var curSelectGameType = this.gameNodeList[this.curSelectGameIdx].getComponent('ClubGameItem').getGameType()
            var curSelectTemplateId = this.templateNodeList[this.curSelectTemplateIdx].getComponent('ClubTemplateItem').getTemplateId()
            let tableType = cc.sys.localStorage.getItem("tableType")
            if(tableType == null || tableType == undefined){
                tableType = 1
            }
            let msg =
            {
                clubId: this.clubData.curSelectClubId,
                gameType: curSelectGameType,
                templateid: curSelectTemplateId,
                type: Number(tableType),
            }
            MessageManager.getInstance().messageSend(Proto.C2S_CLUB_TABLE_INFO_REQ.MsgID.ID, msg)
            UIManager.getInstance().openUI(Wait2UI, 40, () => {
                UIManager.getInstance().getUI(Wait2UI).getComponent("Wait2UI").onWait("正在加载中，请稍后...")
            })
        } else {
            this.updateTableList()
        }
    }
    private clubGameTop(){
        this.curSelectGameIdx = -1
        this.updateGameList()
    }
}
