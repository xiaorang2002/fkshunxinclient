import { BaseUI, UIClass } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { AudioManager } from "../../../../framework/Manager/AudioManager";


// enum IMPORT_ERROR_CODE{
// 	IEC_NIL = 0;
// 	IEC_IN_GAME = 0x1;
// 	IEC_IN_CLUB = 0x2;
// }

const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Import_Result extends BaseUI {

    protected static className = "UnionUI_Import_Result";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_UNION + this.className;
    }

    @property(cc.Prefab)
    reasonItem: cc.Prefab = null;
    @property(cc.Node)
    reasonListContent: cc.Node = null;
    @property(cc.Label)
    reasonLabel: cc.Label = null;
    
    private reasonList = []
    private spacing = 0

    updateView(msg)
    {
        try
        {
            var info = JSON.parse(msg.errorInfo)
            if (info.failed_info && info.failed_info.length > 0)
            {
                this.reasonLabel.string = "导入失败，有 " + info.failed_info.length +" 个玩家存在问题，请处理后重新导入"
                this.reasonListContent.removeAllChildren()
                this.reasonList = [];
                var len = info.failed_info.length
                if (len > 200)
                    len = 200
                this.reasonListContent.height =len * (this.reasonItem.data.height + this.spacing) + this.spacing;
                if (this.reasonListContent.height < 300)
                    this.reasonListContent.height = 300;
                for (var i = 0; i < len; ++i) {
                    var item = cc.instantiate(this.reasonItem);
                    this.reasonListContent.addChild(item);
                    let memberitem = item.getComponent("UnionUI_Import_Reason_Item");
                    memberitem.setInfo(info.failed_info[i])
                    this.reasonList.push(item);
                }
            }
           
        }
        catch (e)
        {
            console.log(e)
        }

    }


    button_close() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().closeUI(UnionUI_Import_Result);
    }

}
