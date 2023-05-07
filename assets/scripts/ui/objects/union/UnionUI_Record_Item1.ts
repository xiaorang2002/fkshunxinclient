import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { UnionUI_Partner_Common } from './UnionUI_Partner_Common';
import { UnionUI_Member_Common } from './UnionUI_Member_Common';
import { ClubRecordUI } from './../club/ClubRecordUI';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { Utils } from './../../../../framework/Utils/Utils';
const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Record_Item1 extends cc.Component {

    @property(cc.Sprite)
    spHead: cc.Sprite = null;
    @property(cc.Label)
    labelId: cc.Label = null;
    @property(cc.Label)
    labelName: cc.Label = null;

    private playerId = 0
    private playerName = ""
    private timeIdx = 0

    initView(info, type, timeIdx, sourceId)
    {
        this.timeIdx = timeIdx
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
        var score = 0
        var bigWin = "0"
        var count = "0";
        if (info.bigwin_count)
            bigWin = info.bigwin_count
        if (info.play_count)
            count = info.play_count
        if (info.winlose)
            score = parseInt(info.winlose)/100
        this.node.getChildByName("label_bigwin").getComponent(cc.Label).string = bigWin
        this.node.getChildByName("label_score").getComponent(cc.Label).string = score.toString()
        this.node.getChildByName("label_count").getComponent(cc.Label).string = count
        this.node.getChildByName("btn_member").active = type == "partner" && this.playerId != sourceId
        this.node.getChildByName("btn_partner").active = type == "partner" && this.playerId != sourceId
        this.node.getChildByName("btn_record").active = type == "member"
        
    }

    private button_member()
    {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().openUI(UnionUI_Member_Common, 25, () => {
            UIManager.getInstance().getUI(UnionUI_Member_Common).getComponent("UnionUI_Member_Common").initView(this.playerId,this.playerName,"top_left",this.timeIdx)
        })
    }

    private button_partner()
    {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().openUI(UnionUI_Partner_Common, 20, () => {
            UIManager.getInstance().getUI(UnionUI_Partner_Common).getComponent("UnionUI_Partner_Common").initView(this.playerId,this.playerName,"top_left",this.timeIdx)
        })
    }

    private button_record()
    {
        AudioManager.getInstance().playSFX("button_click")
        if (this.playerId == 0)
            return
        UIManager.getInstance().openUI(ClubRecordUI, 30, () => {
            UIManager.getInstance().getUI(ClubRecordUI).getComponent("ClubRecordUI").setQueryPlayerInfo(this.playerId,this.playerName,null, false)
            UIManager.getInstance().getUI(ClubRecordUI).getComponent("ClubRecordUI").updateView()
        })
    }

}
