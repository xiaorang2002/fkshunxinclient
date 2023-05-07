import { ListenerManager } from './../../../../framework/Manager/ListenerManager';
import { LogWrap } from './../../../../framework/Utils/LogWrap';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { GameManager } from './../../../GameManager';
import { BaseUI } from "../../../../framework/UI/BaseUI";
import * as Proto from "../../../../proto/proto-min";
import * as GameConstValue from "../../../data/GameConstValue";

const { ccclass, property } = cc._decorator;

@ccclass
export class ClubNotice extends BaseUI {

    protected static className = "ClubNotice";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_CLUB_DIR + this.className;
    }

    @property(cc.EditBox)
    edit: cc.EditBox = null;

    start()
    {
        ListenerManager.getInstance().add(Proto.SC_EDIT_NOTICE.MsgID.ID, this, this.onNoticeChanged);
        ListenerManager.getInstance().add(Proto.SC_PUBLISH_NOTICE.MsgID.ID, this, this.onNoticeChanged);
        var clubData = GameDataManager.getInstance().clubData
        if (clubData.curSelectNoticeId != "") //有公告
        {
            this.node.getChildByName("btn_mem").getChildByName("tj").active = false
            this.node.getChildByName("btn_mem").getChildByName("xg").active = true
        }else{
            this.node.getChildByName("btn_mem").getChildByName("tj").active = true
            this.node.getChildByName("btn_mem").getChildByName("xg").active = false
        }
            
    }

    public onNoticeChanged()
    {
        GameManager.getInstance().openWeakTipsUI("操作成功");
        var clubData = GameDataManager.getInstance().clubData
        MessageManager.getInstance().messageSend(Proto.CS_NOTICE_REQ.MsgID.ID, {clubId:clubData.curSelectClubId});
        UIManager.getInstance().closeUI(ClubNotice);
        MessageManager.getInstance().disposeMsg();
    }

    btn_publish()
    {   
        var clubData = GameDataManager.getInstance().clubData
        var content = this.edit.string
        if (content == "")
        {
            GameManager.getInstance().openWeakTipsUI("不能为空");
            return
        }
        if (clubData.curSelectNoticeId != "") //有公告
        {
            MessageManager.getInstance().messageSend(Proto.CS_EDIT_NOTICE.MsgID.ID, {
                notice:{
                    where:3,
                    content:JSON.stringify({content:content}),
                    clubId:clubData.curSelectClubId,
                    id:clubData.curSelectNoticeId
                }
            })
        }
        else{
            MessageManager.getInstance().messageSend(Proto.CS_PUBLISH_NOTICE.MsgID.ID, {
                notice:{
                    where:3,
                    content:JSON.stringify({content:content}),
                    clubId:clubData.curSelectClubId
                }
            })
        }
       
    }
    
    private button_del() {
        AudioManager.getInstance().playSFX("button_click"); 
        var clubData = GameDataManager.getInstance().clubData
        if (clubData.curSelectNoticeId == "")
        {
            GameManager.getInstance().openWeakTipsUI("当前没有发布任何公告");
            return
        }
        MessageManager.getInstance().messageSend(Proto.CS_DEL_NOTICE.MsgID.ID, {
            id:clubData.curSelectNoticeId
        })
        UIManager.getInstance().closeUI(ClubNotice);
    }

    private button_close() {
        AudioManager.getInstance().playSFX("button_click"); 
        UIManager.getInstance().closeUI(ClubNotice);
    }

}

