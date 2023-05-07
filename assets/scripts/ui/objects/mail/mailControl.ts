import { ListenerType } from './../../../data/ListenerType';
import { BaseUI } from "../../../../framework/UI/BaseUI";
import { MessageManager } from "../../../../framework/Manager/MessageManager";
import * as Proto from "../../../../proto/proto-min";
import { ListenerManager } from "../../../../framework/Manager/ListenerManager";
import { GameManager } from "../../../GameManager";
import { StringData } from "../../../data/StringData";
import { Utils } from "../../../../framework/Utils/Utils";



const { ccclass, property } = cc._decorator;

@ccclass
export class mailControl extends BaseUI {

    @property(cc.Label)
    labelSystemContent: cc.Label = null;
    @property(cc.Label)
    labelMailContent: cc.Label = null;
    @property(cc.Label)
    labelMailTitle: cc.Label = null;
    @property(cc.Label)
    labelAwardsNum: cc.Label[] = [];
    @property(cc.Label)
    labelSendTime: cc.Label = null;
    @property(cc.Node)
    nodeSystem: cc.Node = null;
    @property(cc.Node)
    btnGet: cc.Node = null;
    @property(cc.Node)
    nodeMail: cc.Node = null;
    @property(cc.Node)
    nodeAwards: cc.Node[] = [];
    @property(cc.SpriteFrame)
    spf_lq: cc.SpriteFrame = null;
    @property(cc.SpriteFrame)
    spf_ylq: cc.SpriteFrame = null;;
    private mail_id = null;
    private mail_state = null;

    onLoad() {
        this.initListen();
    }
    private initListen() {
        ListenerManager.getInstance().add(ListenerType.mailAccessoryChange, this, this.getAwardResponse);
    }
    private initLayer(info) {
        this.updateMail(info);
    }
    start() {

    }

    //更新列表
    private updateMail(info) {
        this.mail_id = info.mailId;
        this.mail_state = info.mailStatus;

        if (info.type > 1) {
            //系统公告
            this.nodeSystem.active = true;
            this.nodeMail.active = false;
            //内容
            this.labelSystemContent.string = info.content;
        }
        else {
            //系统邮件
            this.nodeSystem.active = false;
            this.nodeMail.active = true;
            //标题
            this.labelMailTitle.string = info.mailTitle;
            //设置时间
            console.log(info)
            this.labelSendTime.string = Utils.getTimeString(parseInt(info.sendTime) * 1000);
            //内容
            this.labelMailContent.string = "  " + info.mailContent;
            //附件
            var ok = false;
            if (info.mailType == 0) {
                this.nodeMail.getChildByName("label_fj_title").active = true;
                var awardInfo = [info.accessory.roomCard, info.accessory.goldCoin, info.accessory.diamond, info.accessory.score];
                //有附件
                for (var i = 0; i < awardInfo.length; ++i) {
                    if (awardInfo[i] != 0) {
                        this.nodeAwards[i].active = true;
                        this.labelAwardsNum[i].string = "X" + awardInfo[i];
                        ok = true;
                    }
                    else
                        this.nodeAwards[i].active = false;
                }
            }
            else {
                this.nodeMail.getChildByName("label_fj_title").active = false;
                for (var i = 0; i < 4; ++i)
                    this.nodeAwards[i].active = false;
            }

            this.btnGet.active = ok;
            if (this.mail_state == 2) {
                //已经领取
                this.btnGet.getComponent(cc.Button).interactable = false;
                this.btnGet.getComponent(cc.Sprite).spriteFrame = this.spf_ylq

            }
            else {
                //未领取
                this.btnGet.getComponent(cc.Button).interactable = true;
                this.btnGet.getComponent(cc.Sprite).spriteFrame = this.spf_lq

            }
        }
    }
    //领取奖励回调
    getAwardResponse(event) {
        //处理错误码
      /*  if (event.result != 0) {
            GameManager.getInstance().openWeakTipsUI(StringData.getString(event.result))
            return;
        }*/

        //领取成功提示
        GameManager.getInstance().openWeakTipsUI(StringData.getString(10008))
        //已经领取
        this.btnGet.getComponent(cc.Button).interactable = false;
        this.btnGet.getComponent(cc.Sprite).spriteFrame = this.spf_ylq;
    }
    //领取按钮
    get_button() {
        //发送领取公告
        MessageManager.getInstance().messageSend(Proto.mail.MsgID.ID, { mailId: this.mail_id });
    }
}
