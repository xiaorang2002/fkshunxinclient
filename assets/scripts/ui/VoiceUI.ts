import { GameManager } from './../GameManager';
import { BaseUI } from "../../framework/UI/BaseUI";
import { VoiceManager } from "../../framework/Utils/VoiceManager";
import { AudioManager } from "../../framework/Manager/AudioManager";
import { LogWrap } from "../../framework/Utils/LogWrap";
import { MessageManager } from "../../framework/Manager/MessageManager";
import * as Proto from "../../proto/proto-min";

const { ccclass, property } = cc._decorator;

@ccclass
export class VoiceUI extends BaseUI {

    protected static className = "VoiceUI";

    @property(cc.Node)
    VoiceButton: cc.Node = null;
    @property(cc.Node)
    VoiceRoot: cc.Node = null;
    @property(cc.Node)
    VolumeRoot: cc.Node = null;
    private _lastTouchTime = null;
    private _lastCheckTime = -1;
    private MAX_TIME = 15000;

    // use this for initialization
    onLoad() {

        this.VoiceRoot.active = false;

        for (var i = 1; i < this.VolumeRoot.children.length; ++i) {
            this.VolumeRoot.children[i].active = false;
        }

        var self = this;
        var btnVoice = this.VoiceButton;
        if (btnVoice) {
            btnVoice.on(cc.Node.EventType.TOUCH_START, function () {
                if (self.node.getParent().getComponent("GameUI_ZJH"))
                { 
                    if (self.node.getParent().getComponent("GameUI_ZJH").isBlockVocie())
                    {
                        GameManager.getInstance().openWeakTipsUI("本局禁止语音，详情请联系群主");
                        return
                    }
                }
                else if (self.node.getParent().getComponent("GameUI_NN"))
                {
                    if (self.node.getParent().getComponent("GameUI_NN").isBlockVocie())
                    {
                        GameManager.getInstance().openWeakTipsUI("本局禁止语音，详情请联系群主");
                        return
                    }
                }
                VoiceManager.getInstance().prepare("record.amr");
                self._lastTouchTime = Date.now();
                self.VoiceRoot.active = true;
                AudioManager.getInstance().pauseAll();
            });

            btnVoice.on(cc.Node.EventType.TOUCH_MOVE, function () {
            });

            btnVoice.on(cc.Node.EventType.TOUCH_END, function () {
                if (self.node.getParent().getComponent("GameUI_ZJH"))
                { 
                    if (self.node.getParent().getComponent("GameUI_ZJH").isBlockVocie())
                        return
                }
                else if (self.node.getParent().getComponent("GameUI_NN"))
                {
                    if(self.node.getParent().getComponent("GameUI_NN").isBlockVocie())
                        return
                }
                //音频时间少1秒
                if (Date.now() - self._lastTouchTime < 1000) {
                    self.VoiceRoot.active = false;
                    VoiceManager.getInstance().cancel();
                }
                else {
                    self.onVoiceOK();
                }
                self._lastTouchTime = null;
                AudioManager.getInstance().resumeAll();
            });

            btnVoice.on(cc.Node.EventType.TOUCH_CANCEL, function () {
                if (self.node.getParent().getComponent("GameUI_ZJH"))
                { 
                    if (self.node.getParent().getComponent("GameUI_ZJH").isBlockVocie())
                        return
                }
                else if (self.node.getParent().getComponent("GameUI_NN"))
                {
                    if (self.node.getParent().getComponent("GameUI_NN").isBlockVocie())
                        return
                }
                VoiceManager.getInstance().cancel();
                self._lastTouchTime = null;
                self.VoiceRoot.active = false;
                AudioManager.getInstance().resumeAll();
            });
        }
    }

    onVoiceOK() {
        if (this._lastTouchTime != null) {
            VoiceManager.getInstance().release();
            //音频时间
            var time = Date.now() - this._lastTouchTime;
            //音频内容
            var info = VoiceManager.getInstance().getVoiceData("record.amr");
            MessageManager.getInstance().messageSend(Proto.C2S_VoiceInteractive.MsgID.ID,
                { content: info, receiver :0, time:time});
        }
        this.VoiceRoot.active = false;
    }

    // called every frame, uncomment this function to activate update callback
    update(dt) {
        if (this.VoiceRoot.active == true) {
            if (Date.now() - this._lastCheckTime > 300) {
                for (var i = 0; i < this.VolumeRoot.children.length; ++i) {
                    this.VolumeRoot.children[i].active = false;
                }
                var v = VoiceManager.getInstance().getVoiceLevel(7);
                if (v >= 1 && v <= 7) {
                    this.VolumeRoot.children[v - 1].active = true;
                }
                this._lastCheckTime = Date.now();
            }
        }

        if (this._lastTouchTime) {
            var time = Date.now() - this._lastTouchTime;
            if (time >= this.MAX_TIME) {
                this.onVoiceOK();
                this._lastTouchTime = null;
            }
            else {
                var percent = time / this.MAX_TIME;
            }
        }
    }
}