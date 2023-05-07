import { CLUB_POWER } from './../../../data/club/ClubData';
import { Utils } from './../../../../framework/Utils/Utils';
import { LogWrap } from '../../../../framework/Utils/LogWrap';


const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Daily_Record_Item extends cc.Component {


    @property(cc.Sprite)
    spHead: cc.Sprite = null;

    @property(cc.Sprite)
    spItem: cc.Sprite = null;

    @property(cc.Label)
    labelStatus: cc.Label = null;

    private type2Game = {6:"斗地主", 7:"三张牌",9:"拼十", 47:"闷胡血流",48:"加扣积分", 52:"AA消耗房费",54:"血战麻将", 55:"跑得快", 56:"两房麻将", 57:"二人一房", 58:"二人二房"
    , 59:"二人三房", 60:"三人二房", 61:"四人二房", 62:"二人跑得快",63:"四川跑得快",65:"幺鸡麻将",66:"红中麻将",68:"自贡长牌",69:"自贡麻将"}

    initView(info,type,selectPlayerId)
    {      
        if (type == "jf")
        {
            this.node.getChildByName("label_jf_1").active = true
            this.node.getChildByName("label_jf_2").active = true
            this.node.getChildByName("label_jf_3").active = true
            var myId = info.guid
            var eventString = ""
            var scoreChange = 0
            if (info.reason == 49||info.reason == 48)
                scoreChange = info.new_money - info.old_money
            else
                scoreChange = info.delta_money
            if (scoreChange > 0)
                var color = new cc.Color(221,94,0)
            else
                var color =  new cc.Color(75, 153, 25)
            if(info.reason == 49)
            {
                if (myId == info.source_id)
                    eventString = "【"+myId+"】给【"+ info.target_id+"】增加了 " +(-1*scoreChange/100) +" 分"
                else                   
                    eventString = "【"+ info.source_id+"】给【"+myId+"】增加了 " + scoreChange/100 +" 分"
            }
            else if (info.reason == 48)
            {
                if (myId == info.target_id)
                    eventString = "【"+myId+"】扣除了【"+ info.source_id+"】 " + scoreChange/100 +" 分"
                else                   
                    eventString = "【"+ info.target_id+"】扣除了【"+myId+"】 " + (-1*scoreChange/100) +" 分"

            }
            else if (info.reason == 6 || info.reason == 47 || (info.reason < 70 && info.reason >52)||info.reason == 7||info.reason == 9)
            {
                if(scoreChange >= 0)
                    eventString = "在【"+this.type2Game[info.reason]+"】中，赢了"+scoreChange/100 + "分"
                else
                    eventString = "在【"+this.type2Game[info.reason]+"】中，输了"+(-1*scoreChange/100) + "分"
            }
            else if(info.reason == 52){
                if(scoreChange < 0)
                {
                    scoreChange = -1*scoreChange
                }
                eventString = "AA房费扣除了 " + scoreChange/100 +" 分"
            }
            else if (info.reason == 51)
            {
                eventString = "兑换了自己的贡献值，增加了" + scoreChange/100 + "分"
            }
            else if (info.reason == 52)
            {
                eventString = -1*scoreChange/100 + "分"
            }
            else if (info.reason == 53)
            {
                eventString = "初始积分 " + scoreChange/100 + "分"
            }else{
                LogWrap.log("info.reason:",info.reason,"eventString:"+eventString)
            }
            this.node.getChildByName("label_jf_1").getComponent(cc.Label).string = eventString
            this.node.getChildByName("label_jf_1").color = color
            this.node.getChildByName("label_jf_3").getComponent(cc.Label).string = Utils.getTimeString(info.created_time,"-");  
            this.node.getChildByName("label_jf_2").getComponent(cc.Label).string = (info.new_money/100).toString()
        }
        else if (type == "yj")
        {
            this.node.getChildByName("label_yj_1").active = true
            this.node.getChildByName("label_yj_2").active = true
            this.node.getChildByName("label_yj_3").active = true
            this.node.getChildByName("label_yj_4").active = true
            this.node.getChildByName("label_yj_1").getComponent(cc.Label).string = info.guid.toString()
            this.node.getChildByName("label_yj_2").getComponent(cc.Label).string = (info.commission/100).toString()
            this.node.getChildByName("label_yj_3").getComponent(cc.Label).string = info.round_id.slice(24,-1)
            this.node.getChildByName("label_yj_4").getComponent(cc.Label).string = Utils.getTimeString(info.create_time*1000,"-");  

        }
        else
        {
            this.node.getChildByName("label_gx_1").active = true
            this.node.getChildByName("label_gx_2").active = true
            this.node.getChildByName("node_head").active = true
            this.node.getChildByName("label_player_id").active = true
            this.node.getChildByName("label_player_name").active = true
            if (info.playerinfo)
            {
                this.setId(info.playerinfo.guid);
                this.setNameHead(info.playerinfo.head_url, info.playerinfo.nickname);
                if(info.playerinfo.guid != selectPlayerId)
                    this.setRoleIcon(info.role)
            }
            this.node.getChildByName("label_gx_1").getComponent(cc.Label).string = (info.commission/100).toString()
            this.node.getChildByName("label_gx_2").getComponent(cc.Label).string = Utils.getTimeString(info.create_time*1000,"-");  
        }
    }

    //设置id
    public setId(pid: number) {
        this.node.getChildByName("label_player_id").getComponent(cc.Label).string = pid.toString()
    }

    //设置头像
    public setNameHead(headurl: string, name: string) {
        if(headurl && headurl != ""){
            Utils.loadTextureFromNet(this.spHead, headurl);
        }
        this.node.getChildByName("label_player_name").getComponent(cc.Label).string = Utils.getShortName(name, 10);
    }
    
    setRoleIcon(type)
    {
        this.spItem.node.active = true;
        if (type == CLUB_POWER.CRT_BOSS)
            this.labelStatus.string = "盟 主"
        else if (type == CLUB_POWER.CRT_PRATNER) // 合伙人
            this.labelStatus.string = "合伙人"
        else if (type == CLUB_POWER.CRT_ADMIN)
            this.labelStatus.string = "管理员"
        else
            this.spItem.node.active = false;
    }

}
