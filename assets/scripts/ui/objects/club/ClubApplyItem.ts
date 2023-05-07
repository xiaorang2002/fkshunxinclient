import { BaseUI, UIClass } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { MessageManager } from "../../../../framework/Manager/MessageManager";
import * as Proto from "../../../../proto/proto-min";
import { Utils } from "../../../../framework/Utils/Utils";
import { AudioManager } from "../../../../framework/Manager/AudioManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class ClubApplyItem extends BaseUI {

    protected static className = "ClubApplyItem";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_CLUB_DIR + this.className;
    }

    private _clubId: number = 0;
    private _playerId: number = 0;
    private _reqId: number = 0;
    private _itemId: number = 0;
    private _info = null;
    public get itemID(): number {
        return this._itemId;
    }
    public set itemID(value: number) {
        this._itemId = value;
    }

    @property(cc.Sprite)
    spHead: cc.Sprite = null;
    @property(cc.Label)
    labelId: cc.Label = null;
    @property(cc.Label)
    labelName: cc.Label = null;

    onLoad() {

    }

    public setInfo(idx, type, iClub, info)
    {
        this.itemID = idx
        this._info = info
        this.setId(iClub, info.guid);
        this.setNameHead(info.icon, info.nickname);
        this._reqId = info.reqId
    }

    // setIdx()
    // {
    //     if(this.itemID%2 == 0)
    //         var isSp = true
    //     else
    //         var isSp = false
    //     this.node.getChildByName("sp_bg").active = !isSp
    // }

    //设置头像
    public setNameHead(headurl: string, name: string) {
        Utils.loadTextureFromNet(this.spHead, headurl);
        this.labelName.string = Utils.getShortName(name);
    }

    //设置id
    public setId(clubid: number, pid: number) {
        this._clubId = clubid;
        this._playerId = pid;
        this.labelId.string = "ID：" + pid;
    }

    public setManager(isManager)
    {
        return
    }

    //同意
    button_yes(event) {
        AudioManager.getInstance().playSFX("button_click");
        let msg =
        {
            clubId: this._clubId,
            targetId: this._playerId,
            op: 10,
            requestId: this._reqId
        }
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_OP_REQ.MsgID.ID, msg);
    }

    //拒绝
    button_no(event) {
        AudioManager.getInstance().playSFX("button_click");
        let msg =
        {
            clubId: this._clubId,
            targetId: this._playerId,
            op: 11,
            requestId: this._reqId,
        }
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_OP_REQ.MsgID.ID, msg);
    }
}

