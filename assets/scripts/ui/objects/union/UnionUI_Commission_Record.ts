import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { ListenerManager } from './../../../../framework/Manager/ListenerManager';
import { CLUB_POWER } from './../../../data/club/ClubData';
import { HttpManager } from './../../../../framework/Manager/HttpManager';
import { GameManager } from './../../../GameManager';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { BaseUI, UIClass } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { AudioManager } from "../../../../framework/Manager/AudioManager";
import * as  Proto from "../../../../proto/proto-min";

const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Commission_Record extends BaseUI {

    protected static className = "UnionUI_Commission_Record";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_UNION + this.className;
    }

    @property(cc.Prefab)
    item: cc.Prefab = null;
    
    @property(cc.Node)
    nodeListContent: cc.Node = null;
    @property(cc.Label)
    labelDesc: cc.Label = null;

    private nodeList = []
    private sending = false;          
    private playerName = ""   
    private curSelectPage = 1                               // 当前选择的页数
    private totalPage = 1                                      // 总页数
    private playerId = 0
    private startTime = 0
    private endTime = 0
    private sourceId = 0

    initView(playerId,startTime,endTime, commission, sourceId, playerName)
    {
        this.playerId = playerId
        this.startTime = startTime
        this.endTime = endTime
        this.sourceId = sourceId
        this.labelDesc.string = "【" + playerName + "】" + "今日给您增加了"+commission+"贡献值"
        this.queryDate()
        this.playerName = playerName
    }


    // 发送http请求向后台请求数据
    private queryDate()
    {
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        if (GameDataManager.getInstance().httpDataWaitTime > 0)
        {
            this.node.getChildByName("sp_empty").active = true
            GameManager.getInstance().openWeakTipsUI("请求频繁，请等待"+ Math.floor(GameDataManager.getInstance().httpDataWaitTime)+"后重试");
            return
        }
        let url = ""
        let params = ""
       
        var clubData = GameDataManager.getInstance().clubData
        var clubId = clubData.curSelectClubId
        url = GameConstValue.ConstValue.NEW_UNION_CONTRIBUTE_URL
        params = "club_id="+clubId+"&team_id="+this.sourceId+"&start_time="+this.startTime+"&end_time="+this.endTime + "&guid="+this.playerId +"&page="+this.curSelectPage
        url = HttpManager.getInstance().encryptUrl(url + "?" + params) + "&guid="+ GameDataManager.getInstance().userInfoData.userId
        GameDataManager.getInstance().onHttpDataSend()
        HttpManager.getInstance().get(url, "", "", this.dataResponse.bind(this));
        this.onSendStateChange(true)
    }

    // 收到数据
    private dataResponse(event, data) {
        GameDataManager.getInstance().onHttpDataRec()
        if (this.node == null)
            return;
        try{
            this.onSendStateChange(false)
            if (event != null && event.type == "timeout")
            {
                GameManager.getInstance().openWeakTipsUI("请求数据超时");
                this.node.getChildByName("sp_empty").active = true
                return
            }
            if (data == null)
            {
                GameManager.getInstance().openWeakTipsUI("未查询到数据");
                this.node.getChildByName("sp_empty").active = true
                return
            }
            var jsonData = JSON.parse(data)
            if (!jsonData.data.data || jsonData.data.data.length == 0)
            {
                this.nodeListContent.removeAllChildren();
                this.nodeList = [];
                this.totalPage = 1
                this.curSelectPage = 1
                this.updatePage()
                this.node.getChildByName("sp_empty").active = true
                return
            }
            this.totalPage = jsonData.data.last_page
            this.curSelectPage = jsonData.data.current_page
            this.updatePage()
            this.node.getChildByName("sp_empty").active = false
            this.updateList(jsonData.data.data)
        }
        catch (e)
        {
            console.log(e)
        }
        
    }


    private onSendStateChange(state)
    {
        this.sending = state
        this.node.getChildByName("sp_wait").active = state
        if (state)
            this.node.getChildByName("sp_empty").active = false
        if (this.sending)
            this.node.getChildByName("sp_wait").runAction(cc.repeatForever(cc.rotateBy(1, 360)));
        else
            this.node.getChildByName("sp_wait").stopAllActions()
    }

    private updateList(dataList)
    {
        this.nodeListContent.removeAllChildren()
        this.nodeList = []
        this.nodeListContent.height = dataList.length * (this.item.data.height);
        if (this.nodeListContent.height < 400)
            this.nodeListContent.height = 400;
        for (let i = 0; i < dataList.length; ++i) {
            var newnode = cc.instantiate(this.item);
            newnode.parent = this.nodeListContent;
            var pnode = newnode.getComponent('UnionUI_Commission_Record_Item');
            pnode.initView(dataList[i], this.playerName)
            this.nodeList.push(newnode)
        }
    }

    private updatePage()
    {
        this.node.getChildByName("label_page").getComponent(cc.Label).string = this.curSelectPage + "/" + this.totalPage
    }

    private nextPage() 
    {
        if (this.curSelectPage >= this.totalPage)
        {
            GameManager.getInstance().openWeakTipsUI("已经是最后一页了");
            return
        }
        this.curSelectPage += 1
        this.queryDate()
    }

    private lastPage()
    {
        if (this.curSelectPage == 1)
        {
            GameManager.getInstance().openWeakTipsUI("已经是最开始一页了");
            return
        }
        this.curSelectPage -= 1
        this.queryDate()
    }


    button_close() {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().closeUI(UnionUI_Commission_Record);
    }


}
