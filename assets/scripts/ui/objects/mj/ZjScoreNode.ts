import { Utils } from './../../../../framework/Utils/Utils';
import { ROUND_OVER_HU_TYPE } from './../../../data/mj/defines';
const { ccclass, property } = cc._decorator;

@ccclass
export class ZjScoreNode extends cc.Component {

    private iconDir = "zj_little_sp/"
    
    updateTitleInfo(type)
    {
        var scoreStr = ""
        var iconImg = ""
        this.node.getChildByName("label_type").active = false
        var spTitle = this.node.getChildByName("sp_title").getComponent(cc.Sprite)
        this.node.getChildByName("sp_title").active = true
        if (type == 2)
        {
            Utils.loadTextureFromLocal(spTitle, this.iconDir + "zj_jiao");
        }
        else
        {
            Utils.loadTextureFromLocal(spTitle, this.iconDir + "zj_weijiao");
        }
        this.node.getChildByName("sp_type").active = iconImg != ""
        this.node.getChildByName("label_score").getComponent(cc.Label).string = scoreStr
    }


    updateHuInfo(bigType, info)
    {
        var scoreStr = ""
        if (info.score)
        {
            if (info.count > 1)
                scoreStr = info.score + "x" + info.count;
            else
                scoreStr= info.score.toString();
            if (info.score < 0)
                this.node.getChildByName("label_score").color = new cc.Color(104,132,173)
            else
                this.node.getChildByName("label_score").color = new cc.Color(236,128,53)
        }
        var iconImg = ""
        var name = ""
        if (bigType == 1) // 胡
        {
            if (info.score > 0){
                if(info.type == 90){
                    iconImg = this.iconDir + "zj_ying_bao"
                }
                else if (info.type == 91)
                {
                    iconImg = this.iconDir + "zj_ruan_bao"
                }
                else if(info.type == 92)
                {
                    iconImg = this.iconDir + "zj_sha_bao"
                }
                else if(info.type == 10)
                {
                    iconImg = this.iconDir + "zj_gang_shang_hua"
                }
                else if(info.type == 102)
                {
                    iconImg = this.iconDir + "zj_re_pao"
                }
                else{
                    iconImg = ""
                }
            }
            else{
                if(info.type == 90){
                    iconImg = this.iconDir + "zj_ying_bao"
                }
                else if (info.type == 91)
                {
                    iconImg = this.iconDir + "zj_ruan_bao"
                }
                else if(info.type == 92)
                {
                    iconImg = this.iconDir + "zj_sha_bao"
                }
                else if(info.type == 10)
                {
                    iconImg = this.iconDir + "zj_gang_shang_hua"
                }
                else if(info.type == 102)
                {
                    iconImg = this.iconDir + "zj_re_pao"
                }
                else{
                    iconImg = this.iconDir + "zj_dian_pao"
                }
            }
            name = ROUND_OVER_HU_TYPE[info.type]

        }
        else if (bigType == 2) // 自摸
        {
            if (info.score > 0)
            {
                if(info.type == 90){
                    iconImg = this.iconDir + "zj_ying_bao"
                }
                else if (info.type == 91)
                {
                    iconImg = this.iconDir + "zj_ruan_bao"
                }
                else if(info.type == 92)
                {
                    iconImg = this.iconDir + "zj_sha_bao"
                }
                else{
                    iconImg = this.iconDir +  "zj_zm"
                }
            }
            else
            {
                if(info.type == 90){
                    iconImg = this.iconDir + "zj_ying_bao"
                }
                else if (info.type == 91)
                {
                    iconImg = this.iconDir + "zj_ruan_bao"
                }
                else if(info.type == 92)
                {
                    iconImg = this.iconDir + "zj_sha_bao"
                }
                else{
                    iconImg = ""
                }
            }
            name = ROUND_OVER_HU_TYPE[info.type]
        }
        else if (bigType == 3) // 闷胡
        {
            if (info.score > 0)
                iconImg = this.iconDir + "zj_jp"
            else
                iconImg = this.iconDir + "zj_dp"
            name = ROUND_OVER_HU_TYPE[info.type]
        }
        else if (bigType == 4) // 闷自摸
        {
            if (info.score > 0)
                iconImg = this.iconDir + "zj_zm_mh"
            else
                iconImg = this.iconDir + "zj_zm_bmh"
            name = ROUND_OVER_HU_TYPE[info.type]
        }
        name = ROUND_OVER_HU_TYPE[info.type]
        this.node.getChildByName("sp_type").active = iconImg != ""
        var spIcon = this.node.getChildByName("sp_type").getComponent(cc.Sprite)
        Utils.loadTextureFromLocal(spIcon, iconImg);
        this.node.getChildByName("label_type").getComponent(cc.Label).string = name + "："
        this.node.getChildByName("label_score").getComponent(cc.Label).string = scoreStr        
    }

    updateGangInfo(sKey, count)
    {
        var info = sKey.split('^')
        var type = parseInt(info[0])
        var scoreStr = info[2]
        var iconImg = ""
        var name = ""
        if (count > 1)
            scoreStr = info[2] + "x" + count;
        if (parseInt(info[2]) < 0)
        {
            if (type == 20){
                iconImg = this.iconDir + "zj_bei_men"
                name = "闷 豆："
            }
            else if (type == 36)
            {
                iconImg = this.iconDir + "zj_bei_ming_dou"
                name = "点明豆："
            }
            else if (type == 82)
            {
                iconImg = this.iconDir + "zj_bei_zhuan_wan"
                name = "转弯豆："
            }
        }
        else{
            if (type == 20){
                iconImg = this.iconDir + "zj_men"
                name = "闷 豆："
            }
            else if (type == 36)
            {
                iconImg = this.iconDir + "zj_ming_dou"
                name = "明 豆："
            }
            else if (type == 82)
            {
                iconImg = this.iconDir + "zj_zhuan_wan"
                name = "转弯豆："
            }
        }

        this.node.getChildByName("sp_type").active = false
        this.node.getChildByName("mj_ji").active = true
        this.node.getChildByName("label_score").getComponent(cc.Label).string = scoreStr
        this.node.getChildByName("label_type").getComponent(cc.Label).string = name
        var spIcon = this.node.getChildByName("mj_ji").getChildByName("mj_sp").getComponent(cc.Sprite)
        Utils.loadTextureFromLocal(spIcon, "/card_mj/mj_" + info[1]);
        if (parseInt(info[2]) < 0)
            this.node.getChildByName("label_score").color = new cc.Color(104,132,173)
        else
            this.node.getChildByName("label_score").color = new cc.Color(236,128,53)
        // var spIcon = this.node.getChildByName("sp_type").getComponent(cc.Sprite)
        // Utils.loadTextureFromLocal(spIcon, iconImg);
    }

    updateJiInfo(sKey, count)
    {
        var info = sKey.split('^')
        var scoreStr = info[2];
        var type = parseInt(info[0])
        var iconImg = ""
        var name = ROUND_OVER_HU_TYPE[type]
        if (count > 1)
            scoreStr = info[2] + "x" + count
        if (type == 76){
            iconImg = this.iconDir + "zj_zrj"
            this.node.getChildByName("sp_type").active = true
            this.node.getChildByName("mj_ji").active = false
            var spIcon = this.node.getChildByName("sp_type").getComponent(cc.Sprite)
            Utils.loadTextureFromLocal(spIcon, iconImg);
        }
        else{
            this.node.getChildByName("sp_type").active = false
            this.node.getChildByName("mj_ji").active = true
            var spIcon = this.node.getChildByName("mj_ji").getChildByName("mj_sp").getComponent(cc.Sprite)
            Utils.loadTextureFromLocal(spIcon, "/card_mj/mj_" + info[1]);
        }
        this.node.getChildByName("label_type").getComponent(cc.Label).string = name + "："
        this.node.getChildByName("label_score").getComponent(cc.Label).string = scoreStr
        if (info[2] < 0)
            this.node.getChildByName("label_score").color = new cc.Color(104,132,173)
        else
            this.node.getChildByName("label_score").color = new cc.Color(236,128,53)
    }
}