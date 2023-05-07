import { GameManager } from './../../../GameManager';
import { BaseUI, UIClass } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { MessageManager } from "../../../../framework/Manager/MessageManager";
import * as Proto from "../../../../proto/proto-min";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import { ListenerManager } from "../../../../framework/Manager/ListenerManager";
import { Utils } from "../../../../framework/Utils/Utils";
import { CLUB_POWER } from "../../../data/club/ClubData";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { AudioManager } from "../../../../framework/Manager/AudioManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class ClubMemberPlyaerInfoUI extends BaseUI {

    protected static className = "ClubMemberPlyaerInfoUI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_CLUB_DIR + this.className;
    }

    @property(cc.Label)
    labelName: cc.Label = null;
    @property(cc.Sprite)
    spHead: cc.Sprite = null;
    @property(cc.Label)
    labelId: cc.Label = null;
    @property(cc.Sprite)
    nodeBtnTitle: cc.Sprite = null;
    @property(cc.Sprite)
    nodeStopTitle: cc.Sprite = null;
    @property({type:[cc.SpriteFrame]})
    spFrames: Array<cc.SpriteFrame> = [];

    private roleType: any = null;
    private isStopGame: any = null;
    private memberInfo = null

    public updateShow(info) {
        this.labelName.string = Utils.getShortName(info.nickname);
        Utils.loadTextureFromNet(this.spHead, info.icon);
        this.labelId.string = "" + info.guid;
        this.roleType = info.roleType;
        this.isStopGame = info.isStopGame;
        var clubData = GameDataManager.getInstance().clubData;
        this.memberInfo = info


        //禁止进房-- "取消禁止"
        if (this.isStopGame)
            this.node.getChildByName("btn_stop").getChildByName("New Sprite").getComponent(cc.Sprite).spriteFrame = this.spFrames[0]

        if (this.roleType < clubData.roleType)
            this.nodeStopTitle.node.getComponent(cc.Button).interactable = true;
        else
        {
            this.node.getChildByName("btn_stop").getComponent(cc.Button).interactable = false;
        }
        this.nodeStopTitle.node.active = true;

        //设为管理--"移除管理"
        if (this.roleType == CLUB_POWER.CRT_ADMIN)
            this.node.getChildByName("btn_manager").getChildByName("New Sprite").getComponent(cc.Sprite).spriteFrame = this.spFrames[1]
        if (info.roleType >= clubData.roleType || GameDataManager.getInstance().userInfoData.userId == info.guid)
        {
            this.node.getChildByName("btn_manager").getComponent(cc.Button).interactable = false;
        }
        else if (clubData.roleType == CLUB_POWER.CRT_ADMIN)
        {
            this.node.getChildByName("btn_manager").getComponent(cc.Button).interactable = false;
        }
        else
            this.nodeBtnTitle.node.getComponent(cc.Button).interactable = true;
        this.nodeBtnTitle.node.active = true;

        //踢出亲友圈
        if (this.roleType < clubData.roleType)
            this.node.getChildByName("btn_out").getComponent(cc.Button).interactable = true;
        else
        {
            this.node.getChildByName("btn_out").getComponent(cc.Button).interactable = false;
        }
        this.node.getChildByName("btn_out").active = true;
        MessageManager.getInstance().disposeMsg();
    }

    //关闭按钮
    private button_close(event) {
        UIManager.getInstance().closeUI(ClubMemberPlyaerInfoUI);
    }

    //禁止游戏按钮
    private button_black(event) {
        AudioManager.getInstance().playSFX("button_click");
        var clubData = GameDataManager.getInstance().clubData;
        var op = 1
        if (this.isStopGame)
            op = 2
        var msg =
        {
            clubId: clubData.curSelectClubId,
            targetId: this.memberInfo.guid,
            op: op
        }
       
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_OP_REQ.MsgID.ID, msg);
        UIManager.getInstance().closeUI(ClubMemberPlyaerInfoUI);
    }

    //管理员设置
    private button_manager(event) {
        AudioManager.getInstance().playSFX("button_click");
        let msg = null;
        var clubData = GameDataManager.getInstance().clubData;
        if (this.roleType == CLUB_POWER.CRT_ADMIN) {
            var op = 4
        }
        else {
            var op = 3
        }
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_OP_REQ.MsgID.ID, {
            clubId: clubData.curSelectClubId,
            targetId: this.memberInfo.guid,
            op:op
        })
        UIManager.getInstance().closeUI(ClubMemberPlyaerInfoUI);

    }

    private button_out(event) {
        AudioManager.getInstance().playSFX("button_click");
        var clubData = GameDataManager.getInstance().clubData;
        let msg = null;
        if(this.memberInfo.roleType >= CLUB_POWER.CRT_PRATNER)
        {
            GameManager.getInstance().openWeakTipsUI("请先解除职务之后再踢出");
            return  
        }
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_OP_REQ.MsgID.ID, {
            clubId: clubData.curSelectClubId,
            targetId: this.memberInfo.guid,
            op:9
        })
        UIManager.getInstance().closeUI(ClubMemberPlyaerInfoUI);

    }
}