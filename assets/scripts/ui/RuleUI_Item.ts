import { UnionUI_Analysis } from './objects/union/UnionUI_Analysis';
import { UIManager } from './../../framework/Manager/UIManager';
import { AudioManager } from './../../framework/Manager/AudioManager';
import { GAME_NAME } from './../data/GameConstValue';
import { RuleUI } from './RuleUI';
const { ccclass, property } = cc._decorator;

@ccclass
export class RuleUI_Item extends cc.Component {

    private idx = -1

    setInfo(idx, gameId)
    {
        this.idx = idx
        this.node.getChildByName("label_name").getComponent(cc.Label).string = GAME_NAME[gameId]
        this.node.getChildByName("label_name_unselect").getComponent(cc.Label).string = GAME_NAME[gameId]
    }

    setSelect(bSelect)
    {
        this.node.getChildByName("select_bg").active = bSelect
        this.node.getChildByName("label_name").active = bSelect
        this.node.getChildByName("label_name_unselect").active = !bSelect
        this.node.getChildByName("select_bg_unselect").active = !bSelect
    }

    setAllInfo()
    {
        this.idx = 0
        this.node.getChildByName("label_name").getComponent(cc.Label).string = "全 部"
        this.node.getChildByName("label_name_unselect").getComponent(cc.Label).string = "全 部"
    }

    
    btn_click()
    {
        AudioManager.getInstance().playSFX("button_click");
        if (UIManager.getInstance().getUI(RuleUI))
            UIManager.getInstance().getUI(RuleUI).getComponent("RuleUI").selectGameItem(this.idx);
        else if (UIManager.getInstance().getUI(UnionUI_Analysis))
            UIManager.getInstance().getUI(UnionUI_Analysis).getComponent("UnionUI_Analysis").selectGameItem(this.idx);
    }


}
