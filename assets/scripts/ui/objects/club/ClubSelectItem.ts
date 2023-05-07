import { ClubUI } from './../../ClubUI';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { ClubSelectUI } from './ClubSelectUI';
import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import * as Proto from "../../../../proto/proto-min";

const { ccclass, property } = cc._decorator;

@ccclass
export class Club_List_Item extends cc.Component {

    @property(cc.Label)
    labelName: cc.Label = null;

    @property(cc.Label)
    labelClub: cc.Label = null;

    private clubId = 0
    private idx = 0
    private type = 0

    initView(idx, clubId, name, type)
    {
        this.clubId = clubId
        this.idx = idx
        this.type = type
        this.labelClub.node.active = true
        this.labelName.string = name
        this.labelClub.string = "ID:" + clubId
    }

    btn_select()
    {
        var clubData = GameDataManager.getInstance().clubData
        clubData.curSelectClubId = this.clubId;
        cc.sys.localStorage.setItem("curClubId", clubData.curSelectClubId);
         UIManager.getInstance().openUI(ClubUI, 0, () => {
            UIManager.getInstance().closeUI(ClubSelectUI)
            UIManager.getInstance().getUI(ClubUI).getComponent("ClubUI").setOpenType(this.type);
        });
    }

}

