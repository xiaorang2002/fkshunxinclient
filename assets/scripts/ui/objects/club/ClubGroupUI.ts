import { ClubKeyboardUI } from './ClubKeyboardUI';
import { ClubMemberUI } from './ClubMemberUI';
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
export class ClubGroupUI extends BaseUI {

    protected static className = "ClubGroupUI";
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
    unionMemberPrefab: cc.Prefab = null;
    @property(cc.Node)
    nodeListContent: cc.Node = null;


    private curSelectType = null
    private curSelectPlayerId = null

    private waitTime = 3
    private isWaiting = false

    onLoad()
    {
        
    }

    
    start() {

       
    }
    
    private initListen(){
        ListenerManager.getInstance().add(Proto.SC_SEARCH_CLUB_PLAYER.MsgID.ID, this, this.onSearchRec);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_PLAYER_LIST_RES.MsgID.ID, this, this.clubMemberListResponse);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_OP_RES.MsgID.ID, this, this.clubOpResponse);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_EDIT_TEAM_CONFIG.MsgID.ID, this, this.onJjLimitResponse);
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
        this.curSelectType = "group"
        this.initListen()
        this.clubData = GameDataManager.getInstance().clubData;
        this.curSelectPlayerId = playerId
        if (playerId == 0)
            this.curSelectPlayerId = GameDataManager.getInstance().userInfoData.userId
        this.sendPlayerListRequest(this.curSelectPlayerId, CLUB_POWER.CRT_PRATNER)
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
        this.curMemberArray = [];
        if (msg.role != CLUB_POWER.CRT_PRATNER)
        {
            MessageManager.getInstance().disposeMsg();
            return
        }
        for (var i = 0; i < msg.playerList.length; i++)
        {
            var teamMoney = 0
            if (msg.playerList[i].teamMoney)
                teamMoney = msg.playerList[i].teamMoney.count
            var commission = 0
            if (msg.playerList[i].commission)
                commission = msg.playerList[i].commission
            var info = {
                isApply:false,
                guid: msg.playerList[i].info.guid, 
                icon: msg.playerList[i].info.icon, 
                nickname: msg.playerList[i].info.nickname, 
                roleType: msg.playerList[i].role, 
                time: msg.playerList[i].info.time, 
                money: msg.playerList[i].money.count,
                extra: msg.playerList[i].extraData,
                parentInfo: msg.playerList[i].parentInfo,
                parent: msg.playerList[i].parent,
                isStopGame: msg.playerList[i].blockGaming,
                teamMoney:teamMoney,
                isSearch:false,
                commission:commission,
                cansetpartner:msg.playerList[i].cansetpartner,
            }
            this.curMemberArray.push(info)
        }
        this.curShowArray = this.curMemberArray;
        this.node.getChildByName("btn_return").active = GameDataManager.getInstance().userInfoData.userId != this.curSelectPlayerId
        this.updateList();
        this.curSelectPage = msg.pageNum
        this.totalPage = msg.totalPage
        if (this.totalPage == 0)
            this.totalPage = 1
        this.isWaiting = false
        this.waitTime = 3
        this.node.getChildByName("sp_wait").active = false
        this.updatePage()
        MessageManager.getInstance().disposeMsg();
    }

    onSearchRec(msg)
    {
        this.curMemberArray = [];
        for (var i = 0; i < msg.players.length; i++)
        {
            if (msg.players[i].role != CLUB_POWER.CRT_PRATNER)
                continue
            var teamMoney = 0
            if (msg.players[i].teamMoney)
                teamMoney = msg.players[i].teamMoney.count
            var commission = 0
            if (msg.players[i].commission)
                commission = msg.players[i].commission
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
                parentInfo: msg.players[i].parentInfo,
                isStopGame: msg.players[i].blockGaming,
                teamMoney:teamMoney,
                commission:commission,
                cansetpartner:msg.players[i].cansetpartner,
                isSearch:(true && GameDataManager.getInstance().userInfoData.userId!=msg.players[i].parent)
            }
            this.curMemberArray.push(info)
        }
        this.curShowArray = this.curMemberArray;
        this.node.getChildByName("btn_return").active = GameDataManager.getInstance().userInfoData.userId == this.curSelectPlayerId
        this.updateList();
        this.curSelectPage = 1
        this.totalPage = 1
        this.updatePage()
        GameManager.getInstance().openWeakTipsUI("搜索成功");
        MessageManager.getInstance().disposeMsg();
    }

    private clubOpResponse(msg: any) {
        GameManager.getInstance().openWeakTipsUI("操作成功");
        this.sendPlayerListRequest(this.curSelectPlayerId, 2)
        MessageManager.getInstance().disposeMsg();
    }

    // 收到警戒值改变
    private onJjLimitResponse(msg)
    {
        GameManager.getInstance().openWeakTipsUI("操作成功");
        for (var i = 0; i < this.items.length; ++i) {
            var item = this.items[i];
            let memberitem = item.getComponent(this.itemType);
            if (memberitem.getPartnerId() == msg.partner)
            {
                var data = JSON.parse(msg.conf)
                memberitem.updateJinJie(data.credit)
            }
        }
        MessageManager.getInstance().disposeMsg();
    }

    //刷新列表
    private updateList() {
        // 排序
        this.nodeListContent.removeAllChildren()
        this.items = [];
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
            memberitem.setInfo(i, this.curSelectType, this.clubData.curSelectClubId, this.curShowArray[i],this.curSelectPlayerId)
            this.items.push(item);
        }
        this.nodeListContent.getComponent(cc.Layout).resizeMode = cc.Layout.ResizeMode.NONE
    }

    public updateListByItemClick(type, playerId)
    {
        if (type == "member")
        {
            UIManager.getInstance().openUI(ClubMemberUI, 5, () => { 
            UIManager.getInstance().getUI(ClubMemberUI).getComponent("ClubMemberUI").initView(playerId)})
        }
        else
        {
            this.curSelectPage = 1
            this.sendPlayerListRequest(playerId, CLUB_POWER.CRT_PRATNER)
        }
        this.curSelectPlayerId = playerId;
    }

    private updatePage()
    {
        this.node.getChildByName("label_page").getComponent(cc.Label).string = this.curSelectPage + "/" + this.totalPage
    }

    //搜索返回
    private button_find(event) {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(ClubKeyboardUI, 20, () => {
            UIManager.getInstance().getUI(ClubKeyboardUI).getComponent("ClubKeyboardUI").initView(1)
        })
    }

    private button_mymem(){
        AudioManager.getInstance().playSFX("button_click");
        this.updateListByItemClick("group",GameDataManager.getInstance().userInfoData.userId)
    }

    private button_close() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().closeUI(ClubGroupUI);
    }
    
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


}
