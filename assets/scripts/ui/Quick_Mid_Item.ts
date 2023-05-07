import { Club_Quick_Game_UI } from './Club_Quick_Game_UI';
import { GAME_TYPE } from './../data/GameConstValue';
import { UIManager } from './../../framework/Manager/UIManager';
import { AudioManager } from './../../framework/Manager/AudioManager';

const { ccclass, property } = cc._decorator;

@ccclass
export class Quick_Game_Item extends cc.Component {

    @property(cc.Label)
    labelName: cc.Label = null;

    private templateId = 0
    private gameType = 0
    private idx = -1

    setTamplateInfo(idx, info)
    {
        this.templateId = info.template.templateId
        this.gameType = info.template.gameId
        this.idx = idx
        this.node.getChildByName("label_name_unselect").getComponent(cc.Label).string = info.template.description
        this.node.getChildByName("label_name").getComponent(cc.Label).string = info.template.description
    }

    setSelect(bSelect)
    {
        this.node.getChildByName("select_bg").active = bSelect
        this.node.getChildByName("label_name").active = bSelect
        this.node.getChildByName("label_name_unselect").active = !bSelect
        this.node.getChildByName("select_bg_unselect").active = !bSelect

    }

    setName(desc){
        this.node.getChildByName("label_name_unselect").getComponent(cc.Label).string = desc
        this.node.getChildByName("label_name").getComponent(cc.Label).string = desc
    }

    getTempateId()
    {
        return this.templateId
    }

    getGameType()
    {
        return this.gameType
    }

    btn_select()
    {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().getUI(Club_Quick_Game_UI).getComponent("Club_Quick_Game_UI").selectMidItem(this.idx);
    }

}



