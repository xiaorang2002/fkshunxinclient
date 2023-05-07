import { CLUB_POWER } from './../../../data/club/ClubData';
import { Utils } from './../../../../framework/Utils/Utils';


const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Commission_Record_Item extends cc.Component {

    @property(cc.Label)
    labelDesc: cc.Label = null;

    initView(info, playerName)
    {
        var commission = 0
        var game = ""
        var time = ""
        var name = Utils.getShortName(playerName, 5)
        if (info.commission)
            commission = info.commission/100
        if (info.template)
            game = "在玩法" + "【"+ info.template + "】"+ "中"
        if (info.create_time)
            time = Utils.formatDate(info.create_time, 1)
        var desc = time + " " + "【" +name + "】"+  game + "给您贡献了" + commission + "分"
        this.labelDesc.string = desc
    }   

}
