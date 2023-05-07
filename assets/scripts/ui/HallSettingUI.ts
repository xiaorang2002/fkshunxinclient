import { ListenerType } from './../data/ListenerType';
import { SdkManager } from './../../framework/Utils/SdkManager';
import { MessageManager } from './../../framework/Manager/MessageManager';
import { SelectTipsUI } from './SelectTipsUI';
import { BaseUI } from "../../framework/UI/BaseUI";
import { AudioManager } from "../../framework/Manager/AudioManager";
import { UIManager } from "../../framework/Manager/UIManager";
import * as GameConstValue from "../data/GameConstValue";
import { LogWrap } from "../../framework/Utils/LogWrap";
import { GameDataManager } from "../../framework/Manager/GameDataManager";
import { Utils } from "../../framework/Utils/Utils";
import { GameManager } from "../GameManager";
import { HallUI } from "./HallUI";
import { LoginUI } from "./LoginUI";
import * as Proto from "../../proto/proto-min";


const { ccclass, property } = cc._decorator;

@ccclass
export class HallSettingUI extends BaseUI {
    protected static className = "HallSettingUI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_HALL_DIR + this.className;
    }

    @property(cc.Slider)
    slider_music: cc.Slider = null;
    @property(cc.Slider)
    slider_sound: cc.Slider = null;
    @property(cc.ProgressBar)
    progressBar_music: cc.ProgressBar = null;
    @property(cc.ProgressBar)
    progressBar_sound: cc.ProgressBar = null;

    @property([cc.Toggle])
    toggleMusic: cc.Toggle[] = [];
    @property([cc.Toggle])
    toggleBg: cc.Toggle[] = [];
    @property(cc.EditBox)
    editName: cc.EditBox = null;
    @property(cc.Sprite)
    spHead: cc.Sprite = null;

    private selectBgIndex = 1

    onLoad() {
        super.onLoad()
        this.initSetting();
        var isNotPremitInvite = cc.sys.localStorage.getItem("isNotPremitInvite");
        if (parseInt(isNotPremitInvite) == 1)
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
        this.node.getChildByName("label_music").getChildByName("music").active = !(bgmVolume == 0);
        this.node.getChildByName("label_music").getChildByName("no_music").active = bgmVolume == 0;
        this.node.getChildByName("label_sound").getChildByName("sound").active = !(sfxVolume == 0);
        this.node.getChildByName("label_sound").getChildByName("no_sound").active = sfxVolume == 0;

        //初始化音乐类型
        var musictype = cc.sys.localStorage.getItem("musicType");
        if (musictype == null)
            musictype = 0;
        for (var i = 0; i < 3; ++i)
            this.toggleMusic[i].isChecked = false;
        this.toggleMusic[musictype].isChecked = true;
        this.ruleSelect(this.toggleMusic[musictype], true);

        var isShake = cc.sys.localStorage.getItem("isShake");
        if (isShake == null)
            isShake = 0;
        this.editName.placeholder = GameDataManager.getInstance().userInfoData.userName;
        this.editName.string = GameDataManager.getInstance().userInfoData.userName;
        if(GameDataManager.getInstance().userInfoData.userHead && GameDataManager.getInstance().userInfoData.userHead != '')
        {
            Utils.loadTextureFromNet(this.spHead, GameDataManager.getInstance().userInfoData.userHead);
        }
       
        this.selectBgIndex = 1
        var curClubBgIdx = cc.sys.localStorage.getItem("clubBgIndex")
        if (curClubBgIdx)
            this.selectBgIndex = parseInt(curClubBgIdx)
        this.toggleBg[this.selectBgIndex - 1].isChecked = true;
    }

    updateName()
    {
        this.editName.string = GameDataManager.getInstance().userInfoData.userName;
        this.editName.placeholder = GameDataManager.getInstance().userInfoData.userName;
    }

    private onSliderMusicEvent(sender, eventType) {
        var volume = sender.progress;
        this.progressBar_music.progress = volume;
        AudioManager.getInstance().setBGMVolume(volume);
        this.node.getChildByName("label_music").getChildByName("music").active = !(volume == 0);
        this.node.getChildByName("label_music").getChildByName("no_music").active = volume == 0;
    }

    private onSliderSoundEvent(sender, eventType) {
        var volume = sender.progress;
        this.progressBar_sound.progress = volume;
        AudioManager.getInstance().setSFXVolume(volume);
        this.node.getChildByName("label_sound").getChildByName("sound").active = !(volume == 0);
        this.node.getChildByName("label_sound").getChildByName("no_sound").active = volume == 0;
    }


    //音乐类型
    button_music_type(event, CustomEvent) {
        var musictype = cc.sys.localStorage.getItem("musicType");
        this.ruleSelect(this.toggleMusic[musictype], false);
        if (musictype != 1 && musictype != 2)
            musictype = 0;
        this.ruleSelect(this.toggleMusic[parseInt(CustomEvent)], true);
        cc.sys.localStorage.setItem("musicType", parseInt(CustomEvent));
        GameManager.getInstance().changeMusic();
    }

    button_bg(event, CustomEvent) {
        if (this.selectBgIndex == parseInt(CustomEvent))
            return;
        this.selectBgIndex = parseInt(CustomEvent)
        cc.sys.localStorage.setItem("clubBgIndex", parseInt(CustomEvent));
        MessageManager.getInstance().messagePost(ListenerType.clubBgChange);
    }

    private button_close(event) {
        AudioManager.getInstance().recordSound();
        UIManager.getInstance().closeUI(HallSettingUI);
    }

    //注销登陆
    private button_change(event) {
        // GameDataManager.getInstance().loginInfoData.deleteLoginInfo();
        // GameManager.getInstance().closeSocket();
        // UIManager.getInstance().openUI(LoginUI, 0, () => {
        //     UIManager.getInstance().closeUI(HallSettingUI);
        //     UIManager.getInstance().closeUI(HallUI);
        // })
        MessageManager.getInstance().messageSend(Proto.CS_Logout.MsgID.ID, {});
        
    }

    //退出游戏
    private button_exit(event) {
        GameManager.getInstance().closeSocket();
        if (!cc.sys.isNative) {
            console.log("need native platform")
            return;
        }
        cc.game.end()
    }

    //规则按钮选择特效
    public ruleSelect(object : cc.Toggle, ischeck : boolean, isaction : boolean = true)
    {
        if (object == null)
            return;
        // let selectbg = object.node.getChildByName("sp_select_bg");
        let labeltitle = object.node.getChildByName("label_title");
        let outline = labeltitle.getComponent(cc.LabelOutline);
        if (ischeck)
        {
            // selectbg.active = true;
            let widthbg = labeltitle.width + 80;
            //需要动画

            if (isaction)
            {
                // labeltitle.color = new cc.Color(246, 233, 221);
                // outline.enabled = true;
                // let times = 0;
                // let action0 = cc.callFunc(()=> {
                //     if (times == 3)
                //     {
                //         labeltitle.color = new cc.Color(119, 12, 18);
                //         outline.enabled = true;
                //     }
                //     selectbg.width = (widthbg / 5) * times;
                //     times += 1;
                // }, this);
                // let action1 = cc.delayTime(0.05);
                // object.node.runAction(cc.repeat(cc.sequence(action0,action1), 6));
            }
            else
            {
                // outline.enabled = true;
                // labeltitle.color = new cc.Color(246, 233, 221);
                // selectbg.width = widthbg;
            }
        }
        else
        {
            // selectbg.active = false;
            // outline.enabled = false;
            // labeltitle.color = new cc.Color(124, 110, 100);
        }
    }

    private onNameEditFinish()
    {
        AudioManager.getInstance().playSFX("button_click");
        var name = this.editName.string
        if (name.length == 0)
        {
            this.editName.string = GameDataManager.getInstance().userInfoData.userName
            return
        }
        if (name == GameDataManager.getInstance().userInfoData.userName)
            return;
        MessageManager.getInstance().messageSend(Proto.CS_SetNickname.MsgID.ID, {nickname: name});
        // let surefunc = () => {
        //     var name = UIManager.getInstance().getUI(SelectTipsUI).getComponent("SelectTipsUI").getEditText()
        //     MessageManager.getInstance().messageSend(Proto.CS_SetNickname.MsgID.ID, {nickname: name});
        // };
        // let closefunc = () => {
        // };
        // UIManager.getInstance().openUI(SelectTipsUI, 50, () => {
        //     UIManager.getInstance().getUI(SelectTipsUI).getComponent("SelectTipsUI").initUI("请输入要修改的角色昵称：", surefunc, closefunc);
        //     UIManager.getInstance().getUI(SelectTipsUI).getComponent("SelectTipsUI").initEdit("请输入昵称")
        // });
    }


    private button_permit_invite()
    {
        AudioManager.getInstance().playSFX("button_click");
        var active = this.node.getChildByName("select").getChildByName("checkmark").active
        this.node.getChildByName("select").getChildByName("checkmark").active = !active
        var isNotPremitInvite = 0
        if (!active)
            isNotPremitInvite = 1
        cc.sys.localStorage.setItem("isNotPremitInvite", isNotPremitInvite);
    }
}