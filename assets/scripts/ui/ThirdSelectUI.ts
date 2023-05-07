import { GameDataManager } from './../../framework/Manager/GameDataManager';
import { ConstValue } from './../data/GameConstValue';
import { HttpManager } from './../../framework/Manager/HttpManager';
import { BaseUI } from "../../framework/UI/BaseUI";
import * as GameConstValue from "../data/GameConstValue";
import { UIManager } from "../../framework/Manager/UIManager";
import { SdkManager } from "../../framework/Utils/SdkManager";
import { AudioManager } from "../../framework/Manager/AudioManager";
import { LogWrap } from '../../framework/Utils/LogWrap';

const { ccclass, property } = cc._decorator;

@ccclass
export class ThirdSelectUI extends BaseUI {

    protected static className = "ThirdSelectUI";

    private para = null
    private localStore = null

    onLoad() {
        // super.onLoad()
    }

    start() {

    }

    public initPara(info, oClubStore = null) {
        this.para = info;
        this.localStore = oClubStore
    }


    //链接
    private button_linkShare() {
        AudioManager.getInstance().playSFX("button_click");
       // LogWrap.log(ConstValue.shareUrl)
        SdkManager.getInstance().doNativeCopyClipbordText(ConstValue.shareUrl, "复制分享链接成功，发送给好友即可");  
        return
        if (this.para.type != "joinroom")
        {
            HttpManager.getInstance().post(ConstValue.SHARE_URL, "", null, JSON.stringify(this.para),
            (error, ret) => {
                console.log(ret)
                if (ret) {
                    var retMsg = JSON.parse(ret)
                    var url = retMsg.data.url
                    SdkManager.getInstance().doNativeCopyClipbordText(url, "复制分享链接成功，发送给好友即可");  
                }
            });
        }
        else
        {
            HttpManager.getInstance().post(ConstValue.SHARE_URL, "", null, JSON.stringify(this.para),
            (error, ret) => {
                if (ret) {
                    var retMsg = JSON.parse(ret)
                    var url = retMsg.data.url
                    if(this.localStore != null)
                    {
                        var clubData = GameDataManager.getInstance().clubData
                        this.localStore[clubData.curSelectClubId] = url
                        cc.sys.localStorage.setItem("shareClubUrl", JSON.stringify(this.localStore));
                    }
                    SdkManager.getInstance().doNativeCopyClipbordText(url, "复制分享链接成功，发送给好友即可");  
                }
            });
        }
    }

    //链接
    private button_QRShare() {
        AudioManager.getInstance().playSFX("button_click");
        SdkManager.getInstance().doNativeCopyClipbordText(ConstValue.shareUrl, "复制分享链接成功，发送给好友即可");  
        return
        HttpManager.getInstance().post(ConstValue.QR_SHARE_URL, "", null, JSON.stringify(this.para),
        (error, ret) => {
            if (ret) {
                var retMsg = JSON.parse(ret)
                var url = retMsg.data.url
                cc.sys.openURL(url)
            }
        });
        // var url = ""
        // if (this.para.type == "joinroom")
        //     url = "?" + "type=" + this.para.type + "&room=" + this.para.room + "&guid=" + this.para.guid
        // else
        //     url = "?" + "type=" + this.para.type + "&club=" + this.para.club + "&guid=" + this.para.guid
    }

    private button_close() {
        UIManager.getInstance().closeUI(ThirdSelectUI);
    }
}
