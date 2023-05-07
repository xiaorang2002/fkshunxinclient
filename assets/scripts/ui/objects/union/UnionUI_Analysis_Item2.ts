import { ClubRecordUI } from './../club/ClubRecordUI';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { Utils } from './../../../../framework/Utils/Utils';


const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Analysis_Item2 extends cc.Component {

    @property(cc.Sprite)
    spHead: cc.Sprite = null;

    private playerId = 0;
    private icon = null;
    private nickname = "";

    initView(info)
    {
        this.playerId = info.id;
        this.icon = info.icon
        this.nickname = info.name
        if (info.gameCout)
            this.node.getChildByName("label_game").getComponent(cc.Label).string = info.gameCout.toString()
        else
            this.node.getChildByName("label_game").getComponent(cc.Label).string = "0"
        if (info.dyjCount)
            this.node.getChildByName("label_dyj").getComponent(cc.Label).string = info.dyjCount.toString()
        else
            this.node.getChildByName("label_dyj").getComponent(cc.Label).string = "0"
        this.node.getChildByName("label_score").getComponent(cc.Label).string = (info.score/100).toString()
        if(info.icon && info.icon != ""){
            Utils.loadTextureFromNet(this.spHead, info.icon);
        }
        this.node.getChildByName("label_name").getComponent(cc.Label).string = Utils.getShortName(info.name);
        this.node.getChildByName("label_id").getComponent(cc.Label).string = "ID:" + info.id
    }

    private button_record()
    {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().openUI(ClubRecordUI, 1, () => {
            UIManager.getInstance().getUI(ClubRecordUI).getComponent("ClubRecordUI").setQueryPlayerInfo(this.playerId,this.nickname, this.icon)
            UIManager.getInstance().getUI(ClubRecordUI).getComponent("ClubRecordUI").updateView()
        })

    }

}