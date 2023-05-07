import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { GameManager } from './../../../GameManager';
import { Utils } from './../../../../framework/Utils/Utils';
const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Import_Reason_Item extends cc.Component {

    private IMPORT_ERROR_CODE = {
        0 : "nil",
        1 : "玩家正在游戏中",
        2 : "玩家同时在导入和被导入盟中",
        4 : "玩家在导入盟和被导入盟身份不同",
        8  : "玩家在导入盟和被导入盟的上级不同",
    }
    private reasonList =[]

    setInfo(data)
    {
        this.node.getChildByName("label_name").getComponent(cc.Label).string = Utils.getShortName(data.name) 
        this.node.getChildByName("label_id").getComponent(cc.Label).string = data.guid.toString()
        if ((data.status & 1) == 1)
            this.reasonList.push(this.IMPORT_ERROR_CODE[1])
        if ((data.status & 2) == 2)
            this.reasonList.push(this.IMPORT_ERROR_CODE[2])   
        if ((data.status & 4) == 4)
            this.reasonList.push(this.IMPORT_ERROR_CODE[4])  
        if ((data.status & 8) == 8)
            this.reasonList.push(this.IMPORT_ERROR_CODE[8])  
        
        if (this.reasonList.length == 1)
            this.node.getChildByName("label_reason").getComponent(cc.Label).string = this.reasonList[0]
        else if (this.reasonList.length > 1)
            this.node.getChildByName("btn_detail").active = true
        else
            this.node.getChildByName("label_reason").getComponent(cc.Label).string = "玩家导入失败，错误状态："+ data.status
    }

    button_detail()
    {
        AudioManager.getInstance().playSFX("button_click");
        var content = "";
        console.log(this.reasonList)
        for (var i = 0; i < this.reasonList.length; i++)
        {
            if (i == this.reasonList.length - 1)
                content += (i+1) + "："+ this.reasonList[i]
            else
                content += (i+1) + "："+ this.reasonList[i]+" \n"
        }
        GameManager.getInstance().openStrongTipsUI(content, () => { });
    }

}

