import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { UnionUI_Partner_Common } from './UnionUI_Partner_Common';
import { UnionUI_Commission_Record } from './UnionUI_Commission_Record';
import { UnionUI_Member_Common } from './UnionUI_Member_Common';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { ClubRecordUI } from './../club/ClubRecordUI';
import { Utils } from './../../../../framework/Utils/Utils';
const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Record_Item2 extends cc.Component {

    @property(cc.Sprite)
    spHead: cc.Sprite = null;
    @property(cc.Label)
    labelId: cc.Label = null;
    @property(cc.Label)
    labelName: cc.Label = null;

    private playerId = 0
    private playerName = ""
    private timeIdx = 0
    private commission = 0
    private sourceId = 0

    initView(info, type, timeIdx, sourceId)
    {
        this.timeIdx = timeIdx
        this.sourceId = sourceId
        if (info.playerinfo)
        {
            this.playerId = info.playerinfo.guid
            this.playerName = info.playerinfo.nickname
            this.labelId.string = info.playerinfo.guid.toString();
            if(info.playerinfo.head_url && info.playerinfo.head_url != ""){
                Utils.loadTextureFromNet(this.spHead, info.playerinfo.head_url);
            }
            this.labelName.string = Utils.getShortName(info.playerinfo.nickname, 10);
        }
        var parentName = ""
        var parentId = ""
        if (info.parent)
        {
            parentName = info.parent.nickname;
            parentId = info.parent.guid;
        }
        this.node.getChildByName("label_parent_id").getComponent(cc.Label).string = parentId
        this.node.getChildByName("label_parent_name").getComponent(cc.Label).string = Utils.getShortName(parentName, 10);
        if (type == "member")
        {
            var count = "0"
            var commission = "0"
            if (info.valid_count)
                count = info.valid_count
            if (info.commission)
                commission = info.commission
            this.commission = parseInt(commission)/100
            this.node.getChildByName("node_member").getChildByName("label_comission").getComponent(cc.Label).string = this.commission.toString()
            this.node.getChildByName("node_member").getChildByName("label_num").getComponent(cc.Label).string = parseFloat(count).toFixed(2).toString()            
        }
        else
        {
            var commission = "0"
            var valid = 0
            if (info.commission)
                commission = info.commission
            if (info.valid_count)
                valid = info.valid_count
            this.node.getChildByName("node_partner").getChildByName("label_yj").getComponent(cc.Label).string = (parseInt(commission)/100).toString()
            this.node.getChildByName("node_partner").getChildByName("label_valid").getComponent(cc.Label).string = valid.toFixed(2).toString()
        }


        this.node.getChildByName("node_partner").active = type == "partner"
        this.node.getChildByName("node_member").active = type == "member"
        if (type == "partner")
        {
            this.node.getChildByName("node_partner").getChildByName("btn_member").active = this.playerId != sourceId
            this.node.getChildByName("node_partner").getChildByName("btn_partner").active = this.playerId != sourceId
        }
    }

    private button_member()
    {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().openUI(UnionUI_Member_Common, 25, () => {
            UIManager.getInstance().getUI(UnionUI_Member_Common).getComponent("UnionUI_Member_Common").initView(this.playerId,this.playerName,"top_right",this.timeIdx)
        })
    }

    private button_partner()
    {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().openUI(UnionUI_Partner_Common, 20, () => {
            UIManager.getInstance().getUI(UnionUI_Partner_Common).getComponent("UnionUI_Partner_Common").initView(this.playerId,this.playerName,"top_right",this.timeIdx)
        })
    }

    private button_rizhi()
    {
        AudioManager.getInstance().playSFX("button_click")
        var startTime = Math.floor(new Date(new Date().toLocaleDateString()).getTime()/1000) - 24 * 60 * 60 * this.timeIdx;// 要查询的日期0点
        var endTime = startTime + 24*60*60 - 1
        UIManager.getInstance().openUI(UnionUI_Commission_Record, 26, () => {
            UIManager.getInstance().getUI(UnionUI_Commission_Record).getComponent("UnionUI_Commission_Record").initView(this.playerId,startTime,endTime, this.commission, this.sourceId, this.playerName)
        })
    }

    private button_record()
    {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().openUI(ClubRecordUI, 30, () => {
            UIManager.getInstance().getUI(ClubRecordUI).getComponent("ClubRecordUI").setQueryPlayerInfo(this.playerId,this.playerName,null, false)
            UIManager.getInstance().getUI(ClubRecordUI).getComponent("ClubRecordUI").updateView()
        })
    }

}
