import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { ClubRecordUI } from './ClubRecordUI';
import { UIManager } from "../../../../framework/Manager/UIManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class ClubRecordDateUI extends cc.Component {

    private curDateIndex = 0 

    udpateInfo(index, str)
    {
        this.curDateIndex = index
        this.node.getChildByName("label_date").getComponent(cc.Label).string = str
    }

    setSelect(bSelect)
    {
        this.node.getChildByName("sp_bg").active = bSelect
        this.node.getChildByName("label_date").getComponent(cc.LabelOutline).enabled = bSelect;
        if (bSelect)
           this.node.getChildByName("label_date").color = new cc.Color(255,255,255);
        else
            this.node.getChildByName("label_date").color = new cc.Color(188,113,72); 
    }

    btn_select(event)
    {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().getUI(ClubRecordUI).getComponent("ClubRecordUI").clearPage()
        UIManager.getInstance().getUI(ClubRecordUI).getComponent("ClubRecordUI").queryDate(this.curDateIndex);
        
    }


}

