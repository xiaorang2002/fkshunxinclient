import { Utils } from './../../framework/Utils/Utils';
import { GameManager } from './../GameManager';
import { AudioManager } from './../../framework/Manager/AudioManager';
import { MessageManager } from './../../framework/Manager/MessageManager';
import { BaseUI } from "../../framework/UI/BaseUI";
import { LogWrap } from "../../framework/Utils/LogWrap";
import * as GameConstValue from "../data/GameConstValue";
import { ListenerManager } from "../../framework/Manager/ListenerManager";
import * as Proto from "../../proto/proto-min";
import { UIManager } from "../../framework/Manager/UIManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MailUI extends BaseUI {



    protected static className = "MailUI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_MAIL_DIR + this.className;
    }


    @property(cc.Prefab)
    mailPrefab: cc.Prefab = null;
    @property(cc.Node)
    nodeListContent: cc.Node = null;
    @property(cc.Node)
    nodeMailContent: cc.Node = null;
    @property(cc.Label)
    labelContent: cc.Label  = null

    /**对象池 */
    private mailPool = null;
    private userData = null;
    private mailList = []
    private mailNodeList = []
    private curSelectMailId = 0


    @property(cc.EditBox)
    edite: cc.EditBox = null;

    onLoad() {
        // super.onLoad()
        this.initListen();
    }

    /**初始化监听 */
    private initListen() {
        ListenerManager.getInstance().add(Proto.SC_PullMailDetail.MsgID.ID, this, this.onMailDetaiRec);
        ListenerManager.getInstance().add(Proto.SC_PullMailAttachment.MsgID.ID, this, this.onMailRewardGet);
        ListenerManager.getInstance().add(Proto.S2C_CREATE_CLUB_RES.MsgID.ID, this, this.onInviteChange);

         
    }

    private getIdxByMailId(mailId)
    {
        for (var i = 0; i < this.mailList.length; ++i)
        {
            if (mailId == this.mailList[i].id)
                return i
        }
        return -1
    }

    private onMailDetaiRec(msg)
    {
        if (this.curSelectMailId != 0)
        {
            var oldIdx = this.getIdxByMailId(this.curSelectMailId)
            this.mailNodeList[oldIdx].getComponent("Mail_item").setSelect(false)
        }

        this.curSelectMailId = msg.mail.id
        var idx = this.getIdxByMailId(this.curSelectMailId)
        this.mailNodeList[idx].getComponent("Mail_item").setSelect(true)
        this.updateContent(msg.mail)
        MessageManager.getInstance().disposeMsg();
    }

    private onInviteChange(msg)
    {
        GameManager.getInstance().openWeakTipsUI("创建成功");
        this.hideInviteButton()
        MessageManager.getInstance().disposeMsg();
    }

    private onMailRewardGet(msg)
    {
        var oldIdx = this.getIdxByMailId(this.curSelectMailId) 
        this.mailList[oldIdx].status = 1
        this.mailNodeList[oldIdx].getComponent("Mail_item").setMailStatus(1)
        MessageManager.getInstance().messageSend(Proto.CS_ReadMail.MsgID.ID, {mailId:this.curSelectMailId});
        MessageManager.getInstance().disposeMsg();
    }

    UpdateMailList(mailList) {
        this.mailList = mailList
        //根据已读和未读排序, 再按时间排序
        var mailRead = [];
        var mailUnRead = [];
        this.node.getChildByName("sp_empty").active = this.mailList.length == 0
        this.node.getChildByName("mail_content").active = this.mailList.length != 0
        if (this.mailList.length == 0)
            return
        for (var i = 0; i < mailList.length; ++i) {
            if (mailList[i].status > 0)
                mailRead.push(mailList[i]);
            else
                mailUnRead.push(mailList[i]);
        }
        mailRead = mailRead.sort(function (a, b) { return b.createTime - a.createTime })
        mailUnRead = mailUnRead.sort(function (a, b) { return b.createTime - a.createTime })
        this.mailList = mailUnRead.concat(mailRead);
        this.updateList();
    }

    updateContent(info)
    {
        var content = JSON.parse(info.content)
        var contentNode = this.node.getChildByName("mail_content")
        contentNode.getChildByName("label_title").getComponent(cc.Label).string = info.title
        contentNode.getChildByName("label_time").getComponent(cc.Label).string = Utils.getTimeString(parseInt(info.createTime) * 1000)
        contentNode.getChildByName("label_sender").getComponent(cc.Label).string = "发件人：" + info.sender.nickname
        if (content.type == "invite_create")
        {
            this.labelContent.string = "  玩家“"+info.sender.nickname +"”邀请您加入他的大联盟，请输入您的联盟昵称，点击创建，或者点击取消放弃加入"
            if (info.status > 0)
            {
                this.hideInviteButton()
                return
            }
            contentNode.getChildByName("node_invite_mail").active = true
        }
    }

    //更新列表
    updateList() {
        for (var i = 0; i < this.mailList.length; ++i) {
            var newnode = cc.instantiate(this.mailPrefab);
            newnode.parent = this.nodeListContent;
            var pnode = newnode.getComponent('Mail_item');
            pnode.setMailId(this.mailList[i].id)
            pnode.setTitle(this.mailList[i].title)
            pnode.setMailStatus(this.mailList[i].status);
            this.mailNodeList.push(pnode)
            if (i == 0){
                MessageManager.getInstance().messageSend(Proto.CS_PullMailDetail.MsgID.ID, {mailId:this.mailList[i].id});
            }
        }
        this.nodeListContent.height = 85 * this.mailList.length+2;
        if (this.nodeListContent.height < 544)
            this.nodeListContent.height = 544;
    }


    hideInviteButton()
    {
        var contentNode = this.node.getChildByName("mail_content")
        this.labelContent.string = this.labelContent.string + "\n该申请已处理"

        contentNode.getChildByName("node_invite_mail").active = false
    }

    //关闭按钮
    close_button() {
        UIManager.getInstance().closeUI(MailUI)
    }

    btn_get_reward()
    {
        AudioManager.getInstance().playSFX("button_click")
        MessageManager.getInstance().messageSend(Proto.CS_PullMailAttachment.MsgID.ID, {mailId:this.curSelectMailId});
        MessageManager.getInstance().messageSend(Proto.CS_ReadMail.MsgID.ID, {mailId:this.curSelectMailId});

    }

    btn_agree_invite()
    {
        AudioManager.getInstance().playSFX("button_click")
        if (this.edite.string == ""){
            GameManager.getInstance().openWeakTipsUI("请输入联盟昵称");
            return
        }
        if (this.edite.string.length > 10)
        {
            GameManager.getInstance().openWeakTipsUI("请输入10个字以内的昵称");
            return
        }
        var name = this.edite.string
        var clubInfo = {
            name: name,
        }
        MessageManager.getInstance().messageSend(Proto.C2S_CREATE_CLUB_WITH_INVITE_MAIL.MsgID.ID, {mailId : this.curSelectMailId, clubInfo: clubInfo});
        MessageManager.getInstance().messageSend(Proto.CS_ReadMail.MsgID.ID, {mailId:this.curSelectMailId});
        var oldIdx = this.getIdxByMailId(this.curSelectMailId) 
        this.mailList[oldIdx].status = 1
        this.mailNodeList[oldIdx].getComponent("Mail_item").setMailStatus(1)
    }

    btn_disagree_invite()
    {
        AudioManager.getInstance().playSFX("button_click")
        var oldIdx = this.getIdxByMailId(this.curSelectMailId) 
        this.mailList[oldIdx].status = 1
        this.mailNodeList[oldIdx].getComponent("Mail_item").setMailStatus(1)
        MessageManager.getInstance().messageSend(Proto.CS_ReadMail.MsgID.ID, {mailId:this.curSelectMailId});
        this.hideInviteButton()
    }

}
