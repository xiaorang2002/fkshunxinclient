import { UnionUI_Import } from './UnionUI_Import';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { Utils } from './../../../../framework/Utils/Utils';

const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Member_Item extends cc.Component {

    private _clubId: number = 0;
    private _clubName = ""

    @property(cc.Label)
    labelId: cc.Label = null;
    @property(cc.Label)
    labelName: cc.Label = null;

    setInfo(id, name)
    {
        this._clubId = id;
        this._clubName = name
        this.labelId.string = "ID:" + id 
        this.labelName.string = Utils.getShortName(name,16)
    }

    button_click()
    {
        AudioManager.getInstance().playSFX("button_click");
        if (UIManager.getInstance().getUI(UnionUI_Import))
        {
            UIManager.getInstance().getUI(UnionUI_Import).getComponent("UnionUI_Import").onClubSelect(this._clubId, this._clubName)
        }
    }

}

