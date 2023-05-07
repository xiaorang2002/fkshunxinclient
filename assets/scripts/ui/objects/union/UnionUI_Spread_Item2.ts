import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { GameManager } from './../../../GameManager';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { UnionUI_Spread_Single } from './UnionUI_Spread_Single';
import { Utils } from './../../../../framework/Utils/Utils';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import * as  Proto from "../../../../proto/proto-min";

const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Spread_Item1 extends cc.Component {


    @property(cc.Sprite)
    spHead: cc.Sprite = null;

    @property(cc.EditBox)
    edit: cc.EditBox = null;


    private _clubId: number = 0;
    private _playerId: number = 0;
    private _commission = 0

    setInfo(info)
    {
        this._clubId = info.clubId
        this._playerId = info.guid
        this._commission = 0
        this.setId(info.guid);
        this.setNameHead(info.icon, info.nickname);
        var percent = 0
        try
        {
            var remoteConf = JSON.parse(info.conf)
            if (remoteConf)
            {
                percent = remoteConf.percent
                percent /= 100
            }
            
        }
        catch (e){}
        if (isNaN(percent))
            percent = 0
        this.edit.string = percent.toString()
    }

    //设置id
    public setId(pid: number) {
        this.node.getChildByName("label_player_id").getComponent(cc.Label).string = pid.toString()
    }

    //设置头像
    public setNameHead(headurl: string, name: string) {
        if(headurl && headurl != ""){
            Utils.loadTextureFromNet(this.spHead, headurl);
        }
        this.node.getChildByName("label_player_name").getComponent(cc.Label).string = Utils.getShortName(name);
    }
    
    onConfigChanged() {
        var commission = parseInt(this.edit.string)
        if (isNaN(commission)){
            this.edit.string = this._commission.toString()
            GameManager.getInstance().openWeakTipsUI("只能输入数字")
            return
        }
        else if (commission < 0)
        {
            this.edit.string =this._commission.toString()
            GameManager.getInstance().openWeakTipsUI("不能输入负百分比")
            return
        }
        else if (commission > 100)
        {
            this.edit.string = this._commission.toString()
            GameManager.getInstance().openWeakTipsUI("输入的百分比不能超过100")
            return
        }
        var clubData = GameDataManager.getInstance().clubData
        this._commission = commission
        var conf = JSON.stringify({commission:{percent:commission*100}}) 
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_EDIT_TEAM_PARTNER_CONFIG.MsgID.ID, {clubId: clubData.curSelectClubId, partner:this._playerId, conf:conf})
    }

    btn_setting()
    {
        AudioManager.getInstance().playSFX("button_click");
        UIManager.getInstance().openUI(UnionUI_Spread_Single, 5, () => {
            UIManager.getInstance().getUI(UnionUI_Spread_Single).getComponent("UnionUI_Spread_Single").updateView(this._clubId, this._playerId);
        });
    }


}
