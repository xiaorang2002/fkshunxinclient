import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import * as Proto from "../../../../proto/proto-min";
import { MessageManager } from "../../../../framework/Manager/MessageManager";
import { ListenerType } from "../../../data/ListenerType";


const { ccclass, property } = cc._decorator;

@ccclass
export class Mail_item extends cc.Component {

    private mailId = 0

    setMailId(id)
    {
        this.mailId = id
    }

    //设置标题
    setTitle(title) {
        this.node.getChildByName("label_name").getComponent(cc.Label).string = title;
        this.node.getChildByName("label_name_unselect").getComponent(cc.Label).string = title;
    }


    //设置邮件的类型
    setMailStatus(status) {
        this.node.getChildByName("sp_reddot").active = status == 0
    }

    //获取id
    getId() {
        return this.mailId
    }

    /**设置选中信息 */
    setSelect(bSelect) {
        this.node.getChildByName("select_bg").active = bSelect
        this.node.getChildByName("label_name").active = bSelect
        this.node.getChildByName("label_name_unselect").active = !bSelect
        this.node.getChildByName("select_bg_unselect").active = !bSelect

    }
    
    btn_click()
    {
        AudioManager.getInstance().playSFX("button_click");
        MessageManager.getInstance().messageSend(Proto.CS_PullMailDetail.MsgID.ID, {mailId:this.mailId});

    }


}
