import * as GameConstValue from "../../scripts/data/GameConstValue";

export class AudioManager {
    private static instance: AudioManager;

    public static getInstance(): AudioManager {
        if (this.instance == null) {
            this.instance = new AudioManager();
        }
        return this.instance;
    }

    private _bgmVolume: number = 1.0;
    public get bgmVolume(): number {
        return this._bgmVolume;
    }

    private _sfxVolume: number = 1.0;
    public get sfxVolume(): number {
        return this._sfxVolume;
    }
    private bgmAudioID: number = -1;


    constructor() {
        var t = cc.sys.localStorage.getItem("bgmVolume");
        if (t != null)
            this._bgmVolume = parseFloat(t);

        var t = cc.sys.localStorage.getItem("sfxVolume");
        if (t != null)
            this._sfxVolume = parseFloat(t);
    }

    public playBGM(url: string) {
        try{
            var audioUrl = GameConstValue.ConstValue.AUDIO_DIR + url;
            if (this.bgmAudioID >= 0)
                cc.audioEngine.stop(this.bgmAudioID);
            cc.resources.load(audioUrl, cc.AudioClip, function (err, clip) {
                this.bgmAudioID = cc.audioEngine.play(clip, true, this._bgmVolume);
            }.bind(this));
        }
        catch (e) {}
    }

    public playSFX(url: string, isloop: boolean = false) {
        try
        {
            var audioUrl = GameConstValue.ConstValue.AUDIO_DIR + url;
            if (this._sfxVolume > 0)
                cc.resources.load(audioUrl, cc.AudioClip, function (err, clip) {
                    cc.audioEngine.play(clip, isloop, this._sfxVolume);
                }.bind(this));
        }
        catch (e) {}
    }

    public setSFXVolume(v: number) {
        if (this._sfxVolume != v)
            this._sfxVolume = v;
    }

    public setBGMVolume(v: number) {
        if (this._bgmVolume != v) {
            this._bgmVolume = v;
            cc.audioEngine.setVolume(this.bgmAudioID, v);
        }
    }

    public pauseAll() {
        cc.audioEngine.pauseAll();
    }

    public resumeAll() {
        cc.audioEngine.resumeAll();
    }

    public recordSound() {
        cc.sys.localStorage.setItem("bgmVolume", this._bgmVolume);
        cc.sys.localStorage.setItem("sfxVolume", this._sfxVolume);
    }
}