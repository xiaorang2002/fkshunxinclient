import { Club_Quick_Game_UI } from './Club_Quick_Game_UI';
import { GAME_TYPE, GAME_NAME } from './../data/GameConstValue';
import { UIManager } from './../../framework/Manager/UIManager';
import { AudioManager } from './../../framework/Manager/AudioManager';

const { ccclass, property } = cc._decorator;

@ccclass
export class Quick_Mid_Item extends cc.Component {

    @property(cc.Label)
    labelName: cc.Label = null;

    private gameType = 0
    private idx = -1

    setGameInfo(idx, type)
    {
        this.gameType = type
        this.idx = idx
        this.labelName.string = GAME_NAME[type]
    }

    setSelect(bSelect)
    {
        this.node.getChildByName("sp").active = bSelect
        var color = new cc.Color(255,253,238)
        if(bSelect)
            color = new cc.Color(107,47,0)
        this.labelName.node.color = color
    }

    getGameType()
    {
        return this.gameType
    }

    btn_select()
    {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().getUI(Club_Quick_Game_UI).getComponent("Club_Quick_Game_UI").selectLeftItem(this.idx);
    }

}