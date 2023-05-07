import { ListenerType } from './../data/ListenerType';
import { BaseUI } from "../../framework/UI/BaseUI";
import { AudioManager } from "../../framework/Manager/AudioManager";
import { UIManager } from "../../framework/Manager/UIManager";
import { GAME_TYPE } from "../data/GameConstValue";
import * as GameConstValue from "../data/GameConstValue";
import { GameDataManager } from "../../framework/Manager/GameDataManager";
import { MessageManager } from "../../framework/Manager/MessageManager";
import * as Proto from "../../proto/proto-min";
import { GameManager } from "../GameManager";
import { StringData } from "../data/StringData";
import { Utils } from "../../framework/Utils/Utils";

const { ccclass, property } = cc._decorator;

@ccclass
export class GameSettingUI extends BaseUI {
    protected static className = "GameSettingUI";

    @property(cc.Slider)
    slider_music: cc.Slider = null;
    @property(cc.Slider)
    slider_sound: cc.Slider = null;
    @property(cc.ProgressBar)
    progressBar_music: cc.ProgressBar = null;
    @property(cc.ProgressBar)
    progressBar_sound: cc.ProgressBar = null;
    @property([cc.Toggle])
    toggleBg: cc.Toggle[] = [];
    @property([cc.Toggle])
    card_toggle: cc.Toggle[] = [];
    @property([cc.Toggle])
    voice_toggle: cc.Toggle[] = [];
    @property(cc.Node)
    nodeSet: cc.Node = null;
    @property(cc.Node)
    nodeCardBg: cc.Node = null;
    @property([cc.SpriteFrame])
    spfBG: cc.SpriteFrame[] = [];

    @property(cc.Node)
    btnOut: cc.Node = null;
    @property(cc.Node)
    btnApply: cc.Node = null;
    @property(cc.Node)
    label_music: cc.Node = null;
    @property(cc.Node)
    label_sound: cc.Node = null;

    private gameType = null;
    private isInit = false;
    private voiceType = 1

    onLoad() {
        super.onLoad()
        this.initSetting();
        this.nodeSet.active = true;
    }

    start() {
        var blockInteraction = cc.sys.localStorage.getItem("blockInteraction");
        if (parseInt(blockInteraction) == 1)
            this.node.getChildByName("select").getChildByName("checkmark").active = true
        else
            this.node.getChildByName("select").getChildByName("checkmark").active = false
    }

    public initSetting() {
        var bgmVolume = AudioManager.getInstance().bgmVolume
        var sfxVolume = AudioManager.getInstance().sfxVolume
        this.slider_sound.progress = sfxVolume;
        this.slider_music.progress = bgmVolume;
        this.progressBar_sound.progress = this.slider_sound.progress;
        this.progressBar_music.progress = this.slider_music.progress;
        this.isInit = true;
        this.label_music.getChildByName("music").active = !(bgmVolume == 0);
        this.label_music.getChildByName("no_music").active = bgmVolume == 0;
        this.label_sound.getChildByName("sound").active = !(sfxVolume == 0);
        this.label_sound.getChildByName("no_sound").active = sfxVolume == 0;
        this.isInit = false;
        try {
            this.gameType = GameDataManager.getInstance().curGameType;
            if (GameDataManager.getInstance().getDataByCurGameType().gameinfo.mBTableStarted) {
                this.btnApply.active = true;
                this.btnOut.active = false;
            }
            else {
                this.btnApply.active = false;
                this.btnOut.active = true;
            }
            if (GameDataManager.getInstance().getDataByCurGameType().gameinfo.rule.option.request_dismiss == false) {
                this.btnApply.getComponent(cc.Button).interactable = false;
            }
        }
        catch (e) {
            this.btnApply.active = false;
            this.btnOut.active = false;
        }
        var bgid: number = 0;

        if (this.gameType == GAME_TYPE.MHXL || this.gameType == GAME_TYPE.LFMJ ||
            (this.gameType >= GAME_TYPE.XZMJ && this.gameType < GAME_TYPE.LRPDK || this.gameType == GAME_TYPE.YJMJ || this.gameType == GAME_TYPE.ZGMJ)) {
            bgid = cc.sys.localStorage.getItem("mjBgId")
        }
        else if (this.gameType == GAME_TYPE.PDK || this.gameType == GAME_TYPE.LRPDK || this.gameType == GAME_TYPE.SCPDK || this.gameType == GAME_TYPE.DDZ)
            bgid = cc.sys.localStorage.getItem("pdkBgId")
        else if (this.gameType == GAME_TYPE.ZGCP)
            bgid = cc.sys.localStorage.getItem("zgcpBgId")
        else if (this.gameType == GAME_TYPE.ZJH) {
            this.nodeSet.getChildByName("view").getChildByName("content").getChildByName("title_bj").active = false
            this.nodeSet.getChildByName("view").getChildByName("content").getChildByName("ToggleContainer").active = false
        }
        else if (this.gameType == GAME_TYPE.NN) {
            this.nodeSet.getChildByName("view").getChildByName("content").getChildByName("title_bj").active = false
            this.nodeSet.getChildByName("view").getChildByName("content").getChildByName("ToggleContainer").active = false
        }
        if (bgid === undefined || bgid === null)
            bgid = 0;
        this.toggleBg[bgid].check();

        if (Utils.isXzmj(this.gameType)) {
            this.voice_toggle[1].node.active = true;
            var vocieType = cc.sys.localStorage.getItem("xzmj_voice")
            this.voiceType = vocieType
            if (vocieType && parseInt(vocieType) == 2)
                this.voice_toggle[1].isChecked = true;
            else
                this.voice_toggle[0].isChecked = true;
        }

        this.nodeCardBg.active = false;
        this.nodeCardBg.parent.height = 480;
        if (Utils.isMj(this.gameType)) {
            this.nodeCardBg.active = true;
            this.nodeCardBg.parent.height = 750;
            var style = cc.sys.localStorage.getItem("mjStyle")
            if (style == "black")
                this.card_toggle[1].isChecked = true;
            else
                this.card_toggle[0].isChecked = true;
        }
        //修改对应背景
        for (let i = 0; i < this.spfBG.length / 2; ++i) {
            if (this.gameType == GAME_TYPE.MHXL || this.gameType == GAME_TYPE.LFMJ || (this.gameType >= GAME_TYPE.XZMJ && this.gameType < GAME_TYPE.LRPDK)
                || this.gameType == GAME_TYPE.YJMJ || this.gameType == GAME_TYPE.ZGMJ) {
                this.toggleBg[i].node.getChildByName("Background").getChildByName("Background").getComponent(cc.Sprite).spriteFrame = this.spfBG[i];
            }
            else if (this.gameType == GAME_TYPE.PDK || this.gameType == GAME_TYPE.LRPDK || this.gameType == GAME_TYPE.DDZ || this.gameType == GAME_TYPE.SCPDK) {
                this.toggleBg[i].node.getChildByName("Background").getChildByName("Background").getComponent(cc.Sprite).spriteFrame = this.spfBG[i + 3];
            }
            else if (this.gameType == GAME_TYPE.ZGCP) {
                this.toggleBg[i].node.getChildByName("Background").getChildByName("Background").getComponent(cc.Sprite).spriteFrame = this.spfBG[i];
            }
            else {
                return
            }
        }
    }

    public updateBtnByZjh(isGameing, isPoChan = false) {
        if (isPoChan) {
            this.btnApply.active = false;
            this.btnOut.active = false;
            return
        }
        this.btnApply.active = isGameing;
        this.btnOut.active = !isGameing;
    }

    private onSliderMusicEvent(sender, eventType) {
        this.isInit = true;
        var volume = sender.progress;
        this.progressBar_music.progress = volume;
        AudioManager.getInstance().setBGMVolume(volume);
        this.label_music.getChildByName("music").active = !(volume == 0);
        this.label_music.getChildByName("no_music").active = volume == 0;
        this.isInit = false;
    }

    private onSliderSoundEvent(sender, eventType) {
        this.isInit = true;
        var volume = sender.progress;
        this.progressBar_sound.progress = volume;
        AudioManager.getInstance().setSFXVolume(volume);
        this.label_sound.getChildByName("sound").active = !(volume == 0);
        this.label_sound.getChildByName("no_sound").active = volume == 0;
        this.isInit = false;
    }

    private button_close(event) {
        AudioManager.getInstance().recordSound();
        UIManager.getInstance().closeUI(GameSettingUI);
    }

    //背景选择
    private button_bg(event, CustomEvent) {
        var sType = "mjBgId"
        if (this.gameType == GAME_TYPE.PDK || this.gameType == GAME_TYPE.LRPDK || this.gameType == GAME_TYPE.DDZ || this.gameType == GAME_TYPE.SCPDK)
            sType = "pdkBgId"
        cc.sys.localStorage.setItem(sType, parseInt(CustomEvent));
        MessageManager.getInstance().messagePost(ListenerType.gameBgChange);
    }

    //mj牌背选择
    private button_card_bg(event, CustomEvent) {
        var style = cc.sys.localStorage.getItem("mjStyle")
        if (style == CustomEvent)
            return
        cc.sys.localStorage.setItem("mjStyle", CustomEvent)
        GameManager.getInstance().openWeakTipsUI("选择成功")
        MessageManager.getInstance().messagePost(ListenerType.cardBgChange);
        UIManager.getInstance().closeUI(GameSettingUI);
    }

    //解散按钮
    private button_apply(event) {
        AudioManager.getInstance().playSFX("button_click");
        var yesFun = () => {
            var gameData = GameDataManager.getInstance().getDataByCurGameType()
            if (gameData) {
                var roomId = gameData.gameinfo.roomId
                MessageManager.getInstance().messageSend(Proto.CS_DismissTableReq.MsgID.ID, { tableId: roomId });
            }
            UIManager.getInstance().closeUI(GameSettingUI);
        }
        GameManager.getInstance().openSelectTipsUI(StringData.getString(10062), yesFun, () => { })
    }

    //退出按钮
    private button_out(event) {
        AudioManager.getInstance().playSFX("button_click");
        MessageManager.getInstance().messageSend(Proto.CS_StandUpAndExitRoom.MsgID.ID, {});
        UIManager.getInstance().closeUI(GameSettingUI);
        // var yesFun = () => {
        //     MessageManager.getInstance().messageSend(Proto.CS_StandUpAndExitRoom.MsgID.ID, {});
        //     UIManager.getInstance().closeUI(GameSettingUI);
        // }
        // GameManager.getInstance().openSelectTipsUI(StringData.getString(10058), yesFun, () => { })

    }

    private button_voice_type(event, CustomEvent) {
        var type = ""
        if (!Utils.isXzmj(this.gameType))
            return
        if (this.voiceType == parseInt(CustomEvent))
            return
        this.voiceType = parseInt(CustomEvent)
        type = "xzmj_voice"
        cc.sys.localStorage.setItem("xzmj_voice", this.voiceType);
    }

    private button_return() // 返回大厅或者圈
    {
        AudioManager.getInstance().playSFX("button_click");
        MessageManager.getInstance().messagePost(ListenerType.returnClubFromGame);
        UIManager.getInstance().closeUI(GameSettingUI)
    }

    private button_block_interaction() {
        AudioManager.getInstance().playSFX("button_click");
        var active = this.node.getChildByName("select").getChildByName("checkmark").active
        this.node.getChildByName("select").getChildByName("checkmark").active = !active
        var blockInteraction = 0
        if (!active)
            blockInteraction = 1
        cc.sys.localStorage.setItem("blockInteraction", blockInteraction);
    }

}