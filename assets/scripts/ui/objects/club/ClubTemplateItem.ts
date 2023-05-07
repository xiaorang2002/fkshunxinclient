import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { ListenerType } from './../../../data/ListenerType';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { GAME_NAME } from '../../../data/GameConstValue';

const { ccclass, property } = cc._decorator;

@ccclass
export class ClubTemplateItem extends cc.Component {

    private templateId = 0 
    private idx = 0

    setInfo(index, templateId)
    {
        this.idx = index
        this.templateId = templateId
        var clubData = GameDataManager.getInstance().clubData
        if (index == 0)
        {
            this.node.getChildByName("label_name_select").getComponent(cc.Label).string = "全 部"
            this.node.getChildByName("label_name_unselect").getComponent(cc.Label).string = "全 部"

        }
        else
        {
            var templateInfo = clubData.getTemplateInfoById(templateId)
            this.node.getChildByName("label_name_select").getComponent(cc.Label).string = templateInfo.template.description
            this.node.getChildByName("label_name_unselect").getComponent(cc.Label).string = templateInfo.template.description

        }
        

    }

    getTemplateId(){
        return this.templateId
    }

    setSelect(bSelect)
    {
        this.node.getChildByName("unselect").active = !bSelect
        this.node.getChildByName("select").active = bSelect
        this.node.getChildByName("label_name_select").active = bSelect
        this.node.getChildByName("label_name_unselect").active = !bSelect

    }

    btn_click(event)
    {
        MessageManager.getInstance().messagePost(ListenerType.clubTemplateSelectChanged, { idx: this.idx })
        
    }


}

