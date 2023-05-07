import { ClubKeyboardUI } from './ClubKeyboardUI';
import { BaseUI, UIClass } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { MessageManager } from "../../../../framework/Manager/MessageManager";
import * as Proto from "../../../../proto/proto-min";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import { ListenerManager } from "../../../../framework/Manager/ListenerManager";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { GameManager } from "../../../GameManager";
import { StringData } from "../../../data/StringData";
import { AudioManager } from "../../../../framework/Manager/AudioManager";
import { CLUB_POWER } from "../../../data/club/ClubData";

const { ccclass, property } = cc._decorator;

@ccclass
export class ClubMemberUI extends BaseUI {

    protected static className = "ClubMemberUI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_CLUB_DIR + this.className;
    }

    private clubData: any = null;
    private curShowArray: any = [];                          //当前显示数组
    private curMemberArray: any = [];                       //成员列表
    private items: any = [];                                //对象数组
    private spacing: number = 0;                            //对象之间的间隔
    private itemType = ""
    private curSelectPage = 1                               // 当前选择的页数
    private totalPage = 0                                      // 总页数
    private pageNum = 30 // 每一页的玩家数量


    @property(cc.Prefab)
    memberPrefab: cc.Prefab = null;
    @property(cc.Prefab)
    unionMemberPrefab: cc.Prefab = null;
    @property(cc.Node)
    nodeListContent: cc.Node = null;


    private curSelectType = null
    private curSelectPlayerId = null
    private waitTime = 3
    private isWaiting = false
    private isSearchView = false // 当前是否是搜索界面
    private searchId = null

    onLoad() {
        // super.onLoad()
        // ListenerManager.getInstance().add(Proto.S2C_CLUBLIST_RES.MsgID.ID, this, this.onClubListRec);
    }

    private initListen()
    {
        ListenerManager.getInstance().add(Proto.S2C_CLUB_PLAYER_LIST_RES.MsgID.ID, this, this.clubMemberListResponse);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_OP_RES.MsgID.ID, this, this.clubOpResponse);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_TRANSFER_MONEY_RES.MsgID.ID, this, this.scoreOpResponse);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_REQUEST_LIST_RES.MsgID.ID, this, this.clubApplyListRec);
        ListenerManager.getInstance().add(Proto.SC_SEARCH_CLUB_PLAYER.MsgID.ID, this, this.onSearchRec);
    }

    update(dt)
    {
        if (this.isWaiting)
        {
            this.waitTime -= dt;
            if (this.waitTime <= 0)
            {
                this.waitTime = 3
                this.isWaiting = false;
            }
        }
    }


    public initView(playerId = 0) {
        this.isSearchView = false;
        this.searchId = 0
        this.curSelectType = "member"
        this.initListen()
        this.clubData = GameDataManager.getInstance().clubData;
        this.curSelectPlayerId = playerId
        if (playerId == 0)
            this.curSelectPlayerId = GameDataManager.getInstance().userInfoData.userId
        this.node.getChildByName("btn_search").active = GameDataManager.getInstance().userInfoData.userId == this.curSelectPlayerId
        this.sendPlayerListRequest(this.curSelectPlayerId, 0)
        this.node.getChildByName("union_node").active = this.clubData.clubType != 0
        this.node.getChildByName("club_node").active = this.clubData.clubType == 0
        var onlineNum = this.clubData.clubOnlinePlayerNum + "/" + this.clubData.clubAllPlayerNum
        if (this.clubData.clubSettings != "")
        {
            var info = JSON.parse(this.clubData.clubSettings)
            if ((info.limit_online_player_num == true || info.limit_online_player_num == "true") && this.clubData.roleType < CLUB_POWER.CRT_ADMIN)
            {
                var str1 = this.clubData.clubOnlinePlayerNum.toString()
                var str2 = this.clubData.clubAllPlayerNum.toString()
                if (this.clubData.clubOnlinePlayerNum > 99)
                    str1 = "99+"
                if (this.clubData.clubAllPlayerNum>99)
                    str2 = "99+"
                onlineNum = str1 + "/" + str2    
            }
        }
        this.node.getChildByName("label_online").getComponent(cc.Label).string = "在线人数: " + onlineNum
    }

    public setSearchPlayerId(playerId)
    {
        this.searchId = playerId
    }


    private sendPlayerListRequest(partner,role)
    {
        this.isWaiting = true
        this.waitTime = 3
        var msg = {
            clubId:this.clubData.curSelectClubId,
            partner:partner,
            role:role,
            pageSize:this.pageNum,
            pageNum:this.curSelectPage,
        }
        this.node.getChildByName("sp_wait").active = true
        this.node.getChildByName("sp_wait").runAction(cc.repeatForever(cc.rotateBy(1, 360)));
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_PLAYER_LIST_REQ.MsgID.ID,msg)
    }

    clubMemberListResponse(msg: any) {
        this.isSearchView = false
        this.curMemberArray = [];
        for (var i = 0; i < msg.playerList.length; i++)
        {
            var info = {
                isApply:false,
                guid: msg.playerList[i].info.guid, 
                icon: msg.playerList[i].info.icon, 
                nickname: msg.playerList[i].info.nickname, 
                roleType: msg.playerList[i].role, 
                time: msg.playerList[i].info.time, 
                money: msg.playerList[i].money.count,
                extra: msg.playerList[i].extraData,
                parent: msg.playerList[i].parent,
                parentInfo: msg.playerList[i].parentInfo,
                isStopGame: msg.playerList[i].blockGaming,
                cansetpartner:msg.playerList[i].cansetpartner,
                isSearch:false
            }
            this.curMemberArray.push(info)
        }
        this.curShowArray = this.curMemberArray;
        this.node.getChildByName("btn_return").active = false
        if (this.clubData.clubType != 0)
            this.updateList("pratner");
        else
            this.updateList("player");
        this.curSelectPage = msg.pageNum
        this.totalPage = msg.totalPage
        if (this.totalPage == 0)
            this.totalPage = 1
        this.updatePage()
        this.isWaiting = false
        this.waitTime = 3
        this.node.getChildByName("sp_wait").active = false
        MessageManager.getInstance().disposeMsg();
    }

    onSearchRec(msg)
    {
        this.curMemberArray = [];
        for (var i = 0; i < msg.players.length; i++)
        {
            var info = {
                isApply:false,
                guid: msg.players[i].info.guid, 
                icon: msg.players[i].info.icon, 
                nickname: msg.players[i].info.nickname, 
                roleType: msg.players[i].role, 
                time: msg.players[i].info.time, 
                money: msg.players[i].money.count,
                extra: msg.players[i].extraData,
                parent: msg.players[i].parent,
                isStopGame: msg.players[i].blockGaming,
                parentInfo: msg.players[i].parentInfo,
                isSearch:(true && GameDataManager.getInstance().userInfoData.userId!=msg.players[i].parent)
            }
            this.curMemberArray.push(info)
        }
        this.curShowArray = this.curMemberArray;
        this.node.getChildByName("btn_return").active = GameDataManager.getInstance().userInfoData.userId == this.curSelectPlayerId
        if (this.clubData.clubType != 0)
            this.updateList("pratner");
        else
            this.updateList("player");
        this.curSelectPage = 1
        this.totalPage = 1
        this.updatePage()
        this.isSearchView = true
        GameManager.getInstance().openWeakTipsUI("搜索成功");
        MessageManager.getInstance().disposeMsg();
    }

    // onClubListRec(msg)
    // {
    //     this.curMemberArray = [];
    //     let userinfo = GameDataManager.getInstance().userInfoData;
    //     for (var i = 0; i< msg.clubs.length; i++)
    //     {
    //         var info = {
    //             isApply:false,
    //             guid: userinfo.userId, 
    //             icon: userinfo.userHead, 
    //             nickname: userinfo.userName, 
    //             money:0,
    //             commission:0,
    //             clubId:msg.clubs[i].id,
    //             clubName:msg.clubs[i].name,
    //             status:0
    //         }
    //         this.curMemberArray.push(info)
    //     }   
    //     this.curShowArray = this.curMemberArray;
    //     this.updateList("union");
    //     MessageManager.getInstance().disposeMsg();
    // }


    private clubOpResponse(msg: any) {
        if (msg.opType == 12) {
            //有人退出亲友群
            let surefun = () => {
                var uiType =  parseInt(cc.sys.localStorage.getItem("curClubType")) ;
                MessageManager.getInstance().messageSend(Proto.C2S_CLUBLIST_REQ.MsgID.ID, {type: uiType});
                MessageManager.getInstance().disposeMsg();
            };
            GameManager.getInstance().openStrongTipsUI(StringData.getString(10035), surefun);
            return;
        }
        GameManager.getInstance().openWeakTipsUI("操作成功");
        if (this.curSelectType == "apply")
            MessageManager.getInstance().messageSend(Proto.C2S_CLUB_REQUEST_LIST_REQ.MsgID.ID, { clubId: this.clubData.curSelectClubId})
        else
            this.sendPlayerListRequest(this.curSelectPlayerId, 0)
        MessageManager.getInstance().disposeMsg();
    }

    private scoreOpResponse(msg)
    {
        if (msg.result != 0)
        {
            if (msg.result == 51)
                GameManager.getInstance().openWeakTipsUI("玩家在游戏中，无法操作");
            else
                GameManager.getInstance().openWeakTipsUI(StringData.getString(msg.result));
            MessageManager.getInstance().disposeMsg();
            return;
        }

        GameManager.getInstance().openWeakTipsUI("操作成功");
        if (this.curSelectType == "apply")
            MessageManager.getInstance().messageSend(Proto.C2S_CLUB_REQUEST_LIST_REQ.MsgID.ID, { clubId: this.clubData.curSelectClubId})
        else{
            if (this.isSearchView && this.searchId != null) // 如果当前是搜索界面操作完成之后依然返回操作界面
            {
                MessageManager.getInstance().messageSend(Proto.CS_SEARCH_CLUB_PLAYER.MsgID.ID, {
                    guidPattern: this.searchId,
                    clubId: this.clubData.curSelectClubId,
                    partner: GameDataManager.getInstance().userInfoData.userId,
                })
            }
            else
            {
                if (this.curSelectType == "member")
                    var role = 0
                else
                    var role = 2
                this.sendPlayerListRequest(this.curSelectPlayerId, role)
            }
        }
        MessageManager.getInstance().disposeMsg();
    }

    private clubApplyListRec(msg){
        this.curMemberArray = [];
        for (var i = 0; i < msg.reqs.length; i++)
        {
            if (msg.reqs[i].type == "join"){
                var info = {
                    isApply:true,
                    reqId:msg.reqs[i].reqId,
                    type:msg.reqs[i].type,
                    guid: msg.reqs[i].who.guid, 
                    icon: msg.reqs[i].who.icon, 
                    nickname: msg.reqs[i].who.nickname, 
                    roleType: msg.reqs[i].who.roleType,
                    parent : 0,
                    parentInfo: null,
                    isSearch:false
                }
                this.curMemberArray.push(info)
            }
        }
        this.curShowArray = this.curMemberArray;
        this.updateList("player");
        MessageManager.getInstance().disposeMsg();
        
    }

    // private updateButtonSelect(curSelect){

    //     if (this.curSelectType != "")
    //     {
    //         this.node.getChildByName("btn_" + this.curSelectType).getChildByName("sp").active = false
    //         this.node.getChildByName("btn_" + this.curSelectType).getChildByName("label_name_unselect").active = true
    //         this.node.getChildByName("btn_" + this.curSelectType).getChildByName("label_name").active = false
    //     }
    //     this.curSelectType = curSelect
    //     this.node.getChildByName("btn_" + curSelect).getChildByName("sp").active = true
    //     this.node.getChildByName("btn_" + curSelect).getChildByName("label_name_unselect").active = false
    //     this.node.getChildByName("btn_" + curSelect).getChildByName("label_name").active = true
        // if (this.curSelectType == "member")
            // this.node.getChildByName("union_node").getChildByName("union_import").active = false
        // else if (this.curSelectType == "group")
            // this.node.getChildByName("union_node").getChildByName("union_import").active = false
        // else if (this.curSelectType == "import")
        // {
            // this.node.getChildByName("union_node").getChildByName("union_import").active = true
            // this.node.getChildByName("union_node").getChildByName("union_sp_mem_title1").active = false
        // }
    // }

    private clubAddPlayerResponse(msg: any) {
        //ToDo:可以根据具体情况做修改变更优化
        this.sendPlayerListRequest(this.curSelectPlayerId, 0)
        MessageManager.getInstance().disposeMsg();
    }

    //刷新列表
    private updateList(type) {
        // 排序
        this.nodeListContent.removeAllChildren()
        this.items = [];
        if (this.clubData.clubType == 0) // 亲友群
        {
             //清空原始数据
            this.itemType = "ClubMemberItem"
            this.nodeListContent.height = this.curShowArray.length * (this.memberPrefab.data.height + this.spacing) + this.spacing;
            if (this.nodeListContent.height < 400)
                this.nodeListContent.height = 400;
            for (var i = 0; i < this.curShowArray.length; ++i) {
                var item = cc.instantiate(this.memberPrefab);
                this.nodeListContent.addChild(item);
                item.setPosition(0, -item.height * (0.5 + i) - this.spacing * (i + 1));
                let memberitem = item.getComponent(this.itemType);
                memberitem.setInfo(i, this.curSelectType, this.clubData.curSelectClubId, this.curShowArray[i])
                this.items.push(item);
            }
        }
        else
        {
            //清空原始数据
            this.nodeListContent.height = this.curShowArray.length * (this.unionMemberPrefab.data.height + this.spacing) + this.spacing;
            if (this.nodeListContent.height < 400)
                this.nodeListContent.height = 400;
            for (var i = 0; i < this.curShowArray.length; ++i) {
                this.itemType = "UnionUI_Member_Item"
                var item = cc.instantiate(this.unionMemberPrefab);
                this.nodeListContent.addChild(item);
                item.setPosition(0, -item.height * (0.5 + i) - this.spacing * (i + 1));
                let memberitem = item.getComponent(this.itemType);
                memberitem.setInfo(i, this.curSelectType, this.clubData.curSelectClubId, this.curShowArray[i])
                this.items.push(item);
            }
        }
        this.nodeListContent.getComponent(cc.Layout).resizeMode = cc.Layout.ResizeMode.NONE
    }


    importPlayerByClubId(clubId)
    {
        GameManager.getInstance().openWeakTipsUI("导入中，请稍后");
        GameDataManager.getInstance().isImport = true
        MessageManager.getInstance().messageSend(Proto.C2S_IMPORT_PLAYER_FROM_GROUP.MsgID.ID, { clubId: GameDataManager.getInstance().clubData.curSelectClubId, groupId: clubId});

    }

    public updateListByItemClick(type, playerId)
    {
        this.curSelectPage = 1
        if (type == "member")
            this.sendPlayerListRequest(playerId, 0)
        else
            this.sendPlayerListRequest(playerId, CLUB_POWER.CRT_PRATNER)
        this.curSelectPlayerId = playerId;
    }

    private updatePage()
    {
        this.node.getChildByName("label_page").getComponent(cc.Label).string = this.curSelectPage + "/" + this.totalPage
    }

    private button_mymem(){
        AudioManager.getInstance().playSFX("button_click");
        this.updateListByItemClick("member",GameDataManager.getInstance().userInfoData.userId)
    }

    //搜索返回
    private button_find(event) {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(ClubKeyboardUI, 20, () => {
            UIManager.getInstance().getUI(ClubKeyboardUI).getComponent("ClubKeyboardUI").initView(1)
        })
    }

    private button_close() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().closeUI(ClubMemberUI);
    }

    // private button_member_list()
    // {
    //     AudioManager.getInstance().playSFX("button_click");
    //     if (this.curSelectType == "member")
    //         return
    //     this.updateButtonSelect("member")
    //     this.curSelectPage = 1
    //     this.sendPlayerListRequest(this.curSelectPlayerId, 0)
    // }

    // private button_apply_list()
    // {
    //     AudioManager.getInstance().playSFX("button_click");
    //     if (this.curSelectType == "apply")
    //         return 
    //     this.updateButtonSelect("apply")
    //     MessageManager.getInstance().messageSend(Proto.C2S_CLUB_REQUEST_LIST_REQ.MsgID.ID, { clubId: this.clubData.curSelectClubId})

    // }

    // // 合伙人列表按钮
    // private button_group()
    // {
    //     AudioManager.getInstance().playSFX("button_click");
    //     if (this.curSelectType == "group")
    //         return 
    //     this.updateButtonSelect("group")
    //     this.curSelectPage = 1
    //     this.sendPlayerListRequest(this.curSelectPlayerId, CLUB_POWER.CRT_PRATNER)
    // }

    // 导入按钮
    // private button_import()
    // {
    //     AudioManager.getInstance().playSFX("button_click");
    //     if (this.curSelectType == "import")
    //         return 
    //     this.updateButtonSelect("import")
    //     MessageManager.getInstance().messageSend(Proto.C2S_CLUBLIST_REQ.MsgID.ID, {type : 0, ownedMyself: true});

    // }
    
    private nextPage() 
    {
        if (this.curSelectPage >= this.totalPage)
        {
            GameManager.getInstance().openWeakTipsUI("已经是最后一页了");
            return
        }
        this.curSelectPage += 1
        var role = 0
        if (this.curSelectType == "group")
            role = CLUB_POWER.CRT_PRATNER
        this.sendPlayerListRequest(this.curSelectPlayerId, role)
    }

    private lastPage()
    {
        if (this.curSelectPage == 1)
        {
            GameManager.getInstance().openWeakTipsUI("已经是最开始一页了");
            return
        }
        this.curSelectPage -= 1
        var role = 0
        if (this.curSelectType == "group")
            role = CLUB_POWER.CRT_PRATNER
        this.sendPlayerListRequest(this.curSelectPlayerId, role)

    }

    private button_sort(event, customEventData)
    {
        if (this.curMemberArray.length > 0)
        {
            if (customEventData == "up")
                this.curMemberArray.sort(function (a, b) { return a.money - b.money})
            else
                this.curMemberArray.sort(function (a, b) { return b.money - a.money})
            this.node.getChildByName("union_node").getChildByName("jiantou1").getChildByName("jiantou2").active = customEventData == "up"
            this.updateList("player");
        }
    }


}
