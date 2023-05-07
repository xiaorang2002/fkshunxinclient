import { UnionUI_Analysis } from './UnionUI_Analysis';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { Utils } from './../../../../framework/Utils/Utils';


const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Analysis_Item1 extends cc.Component {

    @property(cc.Sprite)
    spHead: cc.Sprite = null;

    private playerId = 0;

    initView(info)
    {
        this.playerId = info.id;
        this.node.getChildByName("label_game").getComponent(cc.Label).string = info.game.toString()
        this.node.getChildByName("label_gx").getComponent(cc.Label).string = (info.commission/100).toString()
        this.node.getChildByName("label_player").getComponent(cc.Label).string = info.active.toString()
        if(info.icon && info.icon != ""){
            Utils.loadTextureFromNet(this.spHead, info.icon);
        }
        this.node.getChildByName("label_name").getComponent(cc.Label).string = Utils.getShortName(info.name);
        this.node.getChildByName("label_id").getComponent(cc.Label).string = "ID:" + info.id
    }

    private button_player()
    {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().getUI(UnionUI_Analysis).getComponent("UnionUI_Analysis").updateListByPlayerChange(this.playerId, "player")

    }

    private button_partner()
    {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().getUI(UnionUI_Analysis).getComponent("UnionUI_Analysis").updateListByPlayerChange(this.playerId, "partner")
    }

}