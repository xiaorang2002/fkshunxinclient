import { Utils } from './../../framework/Utils/Utils';
import { UIManager } from './../../framework/Manager/UIManager';
import { AudioManager } from './../../framework/Manager/AudioManager';
import { HttpManager } from './../../framework/Manager/HttpManager';
import { GameManager } from './../GameManager';
import { GameDataManager } from './../../framework/Manager/GameDataManager';
import { ConstValue } from './../data/GameConstValue';
import { LogWrap } from './../../framework/Utils/LogWrap';
import { BaseUI } from "../../framework/UI/BaseUI";

const { ccclass, property } = cc._decorator;

@ccclass
export class GameUI_JF extends BaseUI {

    protected static className = "GameUI_JF";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return ConstValue.UI_SYSTEM_DIR + this.className;
    }
    
    @property(cc.Prefab)
    item: cc.Prefab = null;
    
    @property(cc.Node)
    nodeListContent: cc.Node = null;

    private nodeList = []
    private sending = false;             
    private spacing: number = 0;                            //对象之间的间隔
    private roundId = 0
    private curRecordArray: any = [];                       //战绩列表
    private playerNum = 0

    start()
    {
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
        this.roundId = gameData.gameinfo.roundId
        this.queryDate()
        this.initPlayer()
    }

    // 发送http请求向后台请求数据
    private queryDate(searchId = 0)
    {
        if (this.sending)
        {
            GameManager.getInstance().openWeakTipsUI("数据请求中");
            return
        }
        let begintime = GameDataManager.getInstance().systemData.severTime/1000 - 24 * 60 * 60;
        let endtime = GameDataManager.getInstance().systemData.severTime/1000;
        let url = ConstValue.RECORD_QUERY_URL + "?start_time="+begintime+"&end_time="+endtime+"&guid="+ GameDataManager.getInstance().userInfoData.userId +"&page=1"+"&round_id="+this.roundId
        url = HttpManager.getInstance().encryptUrl(url) + "&guid="+ GameDataManager.getInstance().userInfoData.userId

        this.sending = true
        HttpManager.getInstance().get(url, "", "", this.dataResponse.bind(this));

    }

    // 收到数据
    private dataResponse(event, data) {
        this.sending = false
        if (event != null && event.type == "timeout")
        {
            GameManager.getInstance().openWeakTipsUI("请求数据超时");
            return
        }
        if (data == null)
        {
            GameManager.getInstance().openWeakTipsUI("未查询到当日对局信息");
            return
        }
        var jsonData = JSON.parse(data)
        if (jsonData.data.data.length == 0)
        {
            this.nodeListContent.removeAllChildren();
            this.nodeList = []
            this.curRecordArray = []
            return
        }
        this.curRecordArray = jsonData.data.data
        try
        {
            this.updateList()
        }
        catch(e)
        {
            console.log(e)
        }
    }

    private initPlayer()
    {
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
        this.playerNum = gameData.playerInfoMap.size
        gameData.playerInfoMap.forEach((infoObj, seat)=>{
           this.node.getChildByName("player"+ infoObj.seat).getComponent(cc.Label).string = Utils.getShortName(infoObj.name)
        })
       
        
    }

    private updateList()
    {
        this.nodeListContent.removeAllChildren()
        this.nodeList = []
        //改变大小
        this.nodeListContent.width = (this.curRecordArray.length+1) * (this.item.data.width + this.spacing) + this.spacing;
        if (this.nodeListContent.width < 310)
            this.nodeListContent.width = 310;
        var allItem = cc.instantiate(this.item);
        this.nodeListContent.addChild(allItem);
        allItem.setPosition(allItem.width * 0.5, 0);
        allItem.getComponent('GameUI_JF_Item').setAll(this.curRecordArray, this.playerNum)
        this.nodeList.push(allItem);

        for (var index = 0; index < this.curRecordArray.length; ++index) {
            let item = cc.instantiate(this.item);
            this.nodeListContent.addChild(item);
            item.setPosition(item.width * (0.5 + index + 1), 0);
            item.getComponent('GameUI_JF_Item').setInfo(this.curRecordArray.length-index, this.curRecordArray[index])
            this.nodeList.push(item);
        }
    }


    button_close() {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().closeUI(GameUI_JF);
    }

}
