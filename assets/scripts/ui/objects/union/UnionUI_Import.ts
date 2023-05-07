import { Wait2UI } from './../../Wait2UI';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { GameManager } from './../../../GameManager';
import { BaseUI, UIClass } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { AudioManager } from "../../../../framework/Manager/AudioManager";
import * as  Proto from "../../../../proto/proto-min";


// enum IMPORT_ERROR_CODE{
// 	IEC_NIL = 0;
// 	IEC_IN_GAME = 0x1;
// 	IEC_IN_CLUB = 0x2;
// }

const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Import extends BaseUI {

    protected static className = "UnionUI_Import";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_UNION + this.className;
    }


    @property(cc.Prefab)
    clubItem: cc.Prefab = null;
    @property(cc.Node)
    clubListContent: cc.Node = null;
    
    private clubList = []
    private spacing = 0
    private selectClubId = 0
    private selectClubName = ""

    start()
    {
        this.updateClubList()
    }

    updateClubList()
    {
        // 排序
        this.clubListContent.removeAllChildren()
        this.clubList = [];
        var clubData = GameDataManager.getInstance().clubData
        if (!clubData)
            return
        this.node.getChildByName("label_tips").active = clubData.allMyClubList.length > 1
        //清空原始数据
        this.clubListContent.height = clubData.allMyClubList.length * (this.clubItem.data.height + this.spacing) + this.spacing;
        if (this.clubListContent.height < 260)
            this.clubListContent.height = 260;
        for (var i = 0; i < clubData.allMyClubList.length; ++i) {
            if (clubData.allMyClubList[i].cid == clubData.curSelectClubId)
                continue
            var item = cc.instantiate(this.clubItem);
            this.clubListContent.addChild(item);
            item.setPosition(0, -item.height * (0.5 + i) - this.spacing * (i + 1));
            let memberitem = item.getComponent("UnionUI_Import_Item");
            memberitem.setInfo(clubData.allMyClubList[i].cid, clubData.allMyClubList[i].name)
            this.clubList.push(item);
        }
    }

    onClubSelect(clubId, clubName)
    {
        this.selectClubId = clubId
        this.selectClubName = clubName
        if (this.selectClubId == 0)
        {
            GameManager.getInstance().openWeakTipsUI("请选择被导入的联盟");
            return
        }

        var clubData = GameDataManager.getInstance().clubData
        if (!clubData)
        {
            return;
        }
        var fromClubId = this.selectClubId
        let surefun = () => {
            var teamId = GameDataManager.getInstance().userInfoData.userId
            MessageManager.getInstance().messageSend(Proto.CS_CLUB_IMPORT_PLAYER_FROM_TEAM.MsgID.ID, {teamId:teamId, fromClub:fromClubId , toClub:clubData.curSelectClubId});
            UIManager.getInstance().closeUI(UnionUI_Import);
            UIManager.getInstance().openUI(Wait2UI, 40, ()=> {
                UIManager.getInstance().getUI(Wait2UI).getComponent("Wait2UI").onWait("正在导入中，请稍后...", 360)
            })
        };
        let closefun = () => {
            
        };
        var curClubId = clubData.curSelectClubId
        var curClubName = ""
        for (let i = 0; i < clubData.allMyClubList.length; ++i) {
            if (clubData.allMyClubList[i].cid == curClubId)
                curClubName = clubData.allMyClubList[i].name
        }
        var content = "将"+this.selectClubName+"【"+this.selectClubId+"】"+"导入到"+curClubName+"【"+curClubId+"】"+
        "，导入后将保留被导入盟的所有分数和人数，请确认当前联盟的分数是否足够"
        GameManager.getInstance().openSelectTipsUI(content, surefun, closefun);
    }

    button_close() {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().closeUI(UnionUI_Import);
    }

}
