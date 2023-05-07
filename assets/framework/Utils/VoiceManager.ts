import { ConstValue } from './../../scripts/data/GameConstValue';
let radix = 12;
let base = 128 - radix;
function crypto(value) {
    value -= base;
    let h = Math.floor(value / radix) + base;
    let l = value % radix + base;
    return String.fromCharCode(h) + String.fromCharCode(l);
}

let encodermap = {}
let decodermap = {}
for (let i = 0; i < 256; ++i) {
    let code = null;
    let v = i + 1;
    if (v >= base) {
        code = crypto(v);
    }
    else {
        code = String.fromCharCode(v);
    }

    encodermap[i] = code;
    decodermap[code] = i;
}

/**
 * 编码音频
 * @param data
 * @returns {string}
 */
function encode(data) {
    let content = "";
    let len = data.length;
    let a = (len >> 24) & 0xff;
    let b = (len >> 16) & 0xff;
    let c = (len >> 8) & 0xff;
    let d = len & 0xff;
    content += encodermap[a];
    content += encodermap[b];
    content += encodermap[c];
    content += encodermap[d];
    for (let i = 0; i < data.length; ++i) {
        content += encodermap[data[i]];
    }
    return content;
}

function getCode(content, index) {
    let c = content.charCodeAt(index);
    if (c >= base) {
        c = content.charAt(index) + content.charAt(index + 1);
    }
    else {
        c = content.charAt(index);
    }
    return c;
}
function decode(content) {
    let index = 0;
    let len = 0;
    for (let i = 0; i < 4; ++i) {
        let c = getCode(content, index);
        index += c.length;
        let v = decodermap[c];
        len |= v << (3 - i) * 8;
    }

    let newData = new Uint8Array(len);
    let cnt = 0;
    while (index < content.length) {
        let c = getCode(content, index);
        index += c.length;
        newData[cnt] = decodermap[c];
        cnt++;
    }
    return newData;
}

export class VoiceManager {

    private static instance: VoiceManager;
    public static getInstance(): VoiceManager {
        if (this.instance == null)
            this.instance = new VoiceManager();

        return this.instance;
    }

    private onPlayCallback: Function = null;
    private _voiceMediaPath = null;
    //老包
    //private AndroidPackageName = "com/dyscyjoid/org";
    //新包
    private AndroidPackageName = ConstValue.NEW_VERSION ? "com/shmmpjfd/org" : "com/dyscyjoid/org";

    constructor() {
        if (cc.sys.isNative) {
            if (cc.sys.OS_IOS) {
                this._voiceMediaPath = jsb.fileUtils.getWritablePath() + "voicemsgs/";
            } else if (cc.sys.OS_ANDROID) {
                this._voiceMediaPath = jsb.fileUtils.getWritablePath() + "\voicemsgs/";
            }
            this.setStorageDir(this._voiceMediaPath);
        }
    }

    prepare(filename, onVoiceStartCallBack = null) {
        if (!cc.sys.isNative) {
            console.log("非原生平台不进行初始化")
            return;
        }
        //1.暂停音效功能，防止录制背景音乐等等
        if (onVoiceStartCallBack != null) {
            onVoiceStartCallBack();
        }
        this.clearCache(filename);
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod(this.AndroidPackageName + "/voicesdk/VoiceRecorder", "prepare", "(Ljava/lang/String;)V", filename);
        }
        else if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod("VoiceSDK", "prepareRecord:", filename);
        }
    }

    release(onReleaseCallBack = null) {
        if (!cc.sys.isNative) {
            return;
        }
        //2.还原音效功能，播放背景音乐等等
        if (onReleaseCallBack != null) {
            onReleaseCallBack();
        }
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod(this.AndroidPackageName + "/voicesdk/VoiceRecorder", "release", "()V");
        }
        else if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod("VoiceSDK", "finishRecord");
        }
    }

    cancel(onCancelVoiceCallBack = null) {
        if (!cc.sys.isNative) {
            return;
        }
        //3.还原音效功能，播放背景音乐等等
        if (onCancelVoiceCallBack != null) {
            onCancelVoiceCallBack();
        }
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod(this.AndroidPackageName + "/voicesdk/VoiceRecorder", "cancel", "()V");
        }
        else if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod("VoiceSDK", "cancelRecord");
        }
    }

    writeVoice(filename, voiceData) {
        if (!cc.sys.isNative) {
            return;
        }
        if (voiceData && voiceData.length > 0) {
            let fileData = decode(voiceData);
            let url = this._voiceMediaPath + filename;
            this.clearCache(filename);
            jsb.fileUtils.writeDataToFile(fileData, url);
        }
    }

    writeAndPlay(fileName, voiceData, onVoicePlayCallBack) {
        this.writeVoice(fileName, voiceData);
        this.play(fileName, onVoicePlayCallBack);
    }

    clearCache(filename) {
        if (cc.sys.isNative) {
            let url = this._voiceMediaPath + filename;
            if (jsb.fileUtils.isFileExist(url)) {
                //console.log("remove:" + url);
                jsb.fileUtils.removeFile(url);
            }
            if (jsb.fileUtils.isFileExist(url + ".wav")) {
                //console.log("remove:" + url + ".wav");
                jsb.fileUtils.removeFile(url + ".wav");
            }
        }
    }

    play(filename, onVoicePlayCallBack) {
        if (!cc.sys.isNative) {
            return;
        }
        //1.暂停音效功能，防止录制背景音乐等等
        if (onVoicePlayCallBack != null) {
            onVoicePlayCallBack();
        }
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod(this.AndroidPackageName + "/voicesdk/VoicePlayer", "play", "(Ljava/lang/String;)V", filename);
        }
        else if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod("VoiceSDK", "play:", filename);
        }
        else {
        }
    }

    stop(onVoiceStopCallBack = null) {
        if (!cc.sys.isNative) {
            return;
        }
        //2.还原音效功能，播放背景音乐等等
        if (onVoiceStopCallBack != null) {
            onVoiceStopCallBack();
        }
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod(this.AndroidPackageName + "/voicesdk/VoicePlayer", "stop", "()V");
        }
        else if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod("VoiceSDK", "stopPlay");
        }
        else {
        }
    }

    getVoiceLevel(maxLevel) {
        return Math.floor(Math.random() * maxLevel + 1);
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            return jsb.reflection.callStaticMethod(this.AndroidPackageName + "/voicesdk/VoiceRecorder", "getVoiceLevel", "(I)I", maxLevel);
        }
        else if (cc.sys.os == cc.sys.OS_IOS) {
        }
        else {
            return Math.floor(Math.random() * maxLevel + 1);
        }
    }

    getVoiceData(filename) {
        if (cc.sys.isNative) {
            let url = this._voiceMediaPath + filename;
            let fileData = jsb.fileUtils.getDataFromFile(url);
            if (fileData) {
                let content = encode(fileData);
                return content;
            }
        }
        return "";
    }

    setStorageDir(dir) {
        if (!cc.sys.isNative) {
            return;
        }
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod(this.AndroidPackageName + "/voicesdk/VoiceRecorder", "setStorageDir", "(Ljava/lang/String;)V", dir);
        }
        else if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod("VoiceSDK", "setStorageDir:", dir);
            if (!jsb.fileUtils.isDirectoryExist(dir)) {
                jsb.fileUtils.createDirectory(dir);
            }
        }
    }
}

