import { ShowRuleUI } from './../rule/ShowRuleUI';
import { ClubGameOpenUI } from './ClubGameOpenUI';
import { GAME_TYPE, GAME_NAME } from './../../../data/GameConstValue';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
const { ccclass, property } = cc._decorator;

@ccclass
export class ClubGameOpenTemplateItem extends cc.Component {

    private idx = -1
    private templateId = 0
    private info = null

    @property(cc.Label)
    labelDesc: cc.Label = null;
    @property(cc.Label)
    labelGame: cc.Label = null;

    setInfo(idx, info, isOpen)
    {
        try{
            this.info = info
            this.idx = idx
            this.templateId = info.templateId
            this.labelDesc.string = info.description
            this.labelGame.string = GAME_NAME[this.info.gameId]
            this.node.getChildByName("checkmark").active = isOpen != false
        }
        catch (e)
        {
            this.labelDesc.string = "找不到桌子"
        }
    }


    getRound() {

    }

    btn_detail(){
        AudioManager.getInstance().playSFX("button_click");
        let info =
        {
            rule: this.info.rule,
            gameType: this.info.gameId,
        }
        UIManager.getInstance().openUI(ShowRuleUI, 5, () => {
            UIManager.getInstance().getUI(ShowRuleUI).getComponent("ShowRuleUI").initUI(info, 5);
        })
    }


    btn_click()
    {
        AudioManager.getInstance().playSFX("button_click");
        this.node.getChildByName("checkmark").active = !this.node.getChildByName("checkmark").active
        if (UIManager.getInstance().getUI(ClubGameOpenUI))
            UIManager.getInstance().getUI(ClubGameOpenUI).getComponent("ClubGameOpenUI").openTemplate(this.templateId);
    }


}
