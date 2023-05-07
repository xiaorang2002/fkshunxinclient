import { ClubUI } from './ClubUI';
import { UIManager } from './../../framework/Manager/UIManager';
import { AudioManager } from './../../framework/Manager/AudioManager';
const { ccclass, property } = cc._decorator;

@ccclass
export class Club_List_Item extends cc.Component {

    @property(cc.Label)
    labelName: cc.Label = null;

    @property(cc.Label)
    labelClub: cc.Label = null;


    private idx = 0
    private info = null


    initView(idx, info, type)
    {
        this.idx = idx
        this.info = info
        this.labelClub.node.active = true
        this.labelName.string = info.name
        this.labelClub.string = info.id
        this.node.getChildByName("label_club").color = new cc.Color(188,113,72); 
        this.node.getChildByName("label_name").color = new cc.Color(188,113,72); 
    }

    getInfo()
    {
        return this.info
    }

    setSelect(bSelect)
    {
        this.node.getChildByName("unselect_bg").active = !bSelect
        this.node.getChildByName("select_bg").active = bSelect
        this.node.getChildByName("label_club").getComponent(cc.LabelOutline).enabled = bSelect;
        this.node.getChildByName("label_name").getComponent(cc.LabelOutline).enabled = bSelect;
        if (bSelect)
        {
            this.node.getChildByName("label_club").color = new cc.Color(255,255,255);
            this.node.getChildByName("label_name").color = new cc.Color(255,255,255);
        }
        else
        {
            this.node.getChildByName("label_club").color = new cc.Color(188,113,72); 
            this.node.getChildByName("label_name").color = new cc.Color(188,113,72); 
        }

    }

    setNewName(sName)
    {
        this.labelName.string = sName
    }

    btn_select()
    {
        if (UIManager.getInstance().getUI(ClubUI))
            UIManager.getInstance().getUI(ClubUI).getComponent("ClubUI").selectClub(this.idx);

    }

}

