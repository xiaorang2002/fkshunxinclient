import { Utils } from './../../../../framework/Utils/Utils';
const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Manage_Item2 extends cc.Component {

    @property(cc.Sprite)
    spHead: cc.Sprite = null;
    @property(cc.Label)
    labelId: cc.Label = null;
    @property(cc.Label)
    labelName: cc.Label = null;

    initView(type, info)
    {
        if (info.playerinfo)
        {
            this.labelId.string = info.playerinfo.guid.toString();
            Utils.loadTextureFromNet(this.spHead, info.playerinfo.head_url);
            this.labelName.string = Utils.getShortName(info.playerinfo.nickname, 10);
        }
        
    }

    private button_member()
    {

    }

    private button_record()
    {
        
    }

}
