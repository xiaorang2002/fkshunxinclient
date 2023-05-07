import { Utils } from './../../../../framework/Utils/Utils';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Member_Manage_Item extends cc.Component {

    private type2Game = {6:"斗地主", 7:"三张牌",9:"拼十", 47:"闷胡血流", 54:"血战麻将", 55:"跑得快", 56:"两房麻将", 57:"二人一房", 58:"二人二房"
    , 59:"二人三房", 60:"三人二房", 61:"四人二房", 62:"二人跑得快",63:"四川跑得快",65:"幺鸡麻将",66:"红中麻将",68:"自贡长牌",69:"自贡麻将"}

    initView(info, type)
    {
        if (type == "score")
        {
            this.node.getChildByName("label_time").getComponent(cc.Label).string = Utils.getTimeString(info.created_time,"-");
            this.node.getChildByName("label_last").getComponent(cc.Label).string = (info.new_money/100).toString()
            var myId = info.guid
            var eventString = ""
            var scoreChange = 0
            if (info.reason == 49||info.reason == 48)
                scoreChange = info.new_money - info.old_money
            else
                scoreChange = info.delta_money
                
            if (scoreChange > 0)
                var color = new cc.Color(236,128,53)
            else
                var color =  new cc.Color(104,132,173)
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
            else if (info.reason == 6 || info.reason == 47 || (info.reason < 70 && info.reason >53)||info.reason == 7||info.reason == 9)
            {
                if(scoreChange >= 0)
                    eventString = "在【"+this.type2Game[info.reason]+"】中，赢了"+scoreChange/100 + "分"
                else
                    eventString = "在【"+this.type2Game[info.reason]+"】中，输了"+(-1*scoreChange/100) + "分"
            }
            else if (info.reason == 51)
            {
                eventString = "兑换了自己的贡献值，增加了" + scoreChange/100 + "分"
            }
            else if (info.reason == 52)
            {
                eventString = "支出房费" + -1*scoreChange/100 + "分"
            }
            else if (info.reason == 53)
            {
                eventString = "初始积分 " + scoreChange/100 + "分"
            }
            this.node.getChildByName("label_event").getComponent(cc.Label).string = eventString
            this.node.getChildByName("label_event").color = color
        }
        else if (type == "commission")
        {
            this.node.getChildByName("label_time").getComponent(cc.Label).string = Utils.getTimeString(info.date*1000,"-",true);   
            this.node.getChildByName("label_last").getComponent(cc.Label).string = (parseInt(info.comission)/100.0).toString()
        }
    }
}
