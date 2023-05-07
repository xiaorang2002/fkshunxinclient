import { CLUB_POWER } from './../../../data/club/ClubData';
import { Utils } from './../../../../framework/Utils/Utils';


const { ccclass, property } = cc._decorator;

@ccclass
export class UnionUI_Score_Record_Item extends cc.Component {


    @property(cc.Label)
    labelType: cc.Label = null;

    @property(cc.Label)
    labelScore: cc.Label = null;

    @property(cc.Label)
    labelChange: cc.Label = null;

    @property(cc.Label)
    labelTime: cc.Label = null;

    @property(cc.Label)
    labelConsume: cc.Label = null;
    @property(cc.Sprite)
    spHead: cc.Sprite = null;
    @property(cc.Label)
    labelId: cc.Label = null;
    @property(cc.Label)
    labelName: cc.Label = null;

    private type2Game = {6:"斗地主", 7:"三张牌",9:"拼十", 47:"闷胡血流", 54:"血战麻将", 55:"跑得快", 56:"两房麻将", 57:"二人一房", 58:"二人二房"
    , 59:"二人三房", 60:"三人二房", 61:"四人二房", 62:"二人跑得快",63:"四川跑得快",65:"幺鸡麻将",66:"红中麻将",68:"自贡长牌",69:"自贡麻将"}

    initView(info, selectType)
    {      
        this.node.getChildByName("node_"+selectType).active = true;
        if (selectType == "consume")
        {
            this.labelConsume.string = -1 * Math.floor(info.amount/100) + "张"
            this.labelTime.string = Utils.formatDate(info.date,2);  
            return
        }
        if (selectType == "record")
        {
            var myId = info.guid
            if (info.operator)
                var opId = info.operator.guid
            else
                var opId = info.guid
            var headUrl = "";
            var nickname = "";
            var playerId = "";
            if (info.source.guid == opId)
            {
                if (info.target)
                {
                    playerId = info.target.guid
                    headUrl = info.target.head_url
                    nickname = info.target.nickname
                }
            }
            else
            {
                playerId = info.source.guid
                headUrl = info.source.head_url
                nickname = info.source.nickname
            }
            if(headUrl && headUrl != ""){
                Utils.loadTextureFromNet(this.spHead, headUrl);
            }
            this.labelName.string = Utils.getShortName(nickname, 10);
            this.labelId.string = playerId.toString();
            this.labelTime.string = Utils.getTimeString(info.created_time,"-");  
            var scoreChange = 0
            var fuhao = ""
            if (opId == myId)
                scoreChange = info.old_money - info.new_money
            else
                scoreChange = info.new_money - info.old_money
            if (scoreChange > 0)
            {
                var color = new cc.Color(97,61,30)
                fuhao = "+"
            }
            else
                var color =  new cc.Color(104,132,173)
            var changeNode = this.node.getChildByName("node_record").getChildByName("label_change")
            var scoreNode = this.node.getChildByName("node_record").getChildByName("label_score")
            if (info.operator)
            {
                this.node.getChildByName("node_record").getChildByName("label_op_name").getComponent(cc.Label).string = info.operator.guid.toString()
                this.node.getChildByName("node_record").getChildByName("label_op_id").getComponent(cc.Label).string = Utils.getShortName(info.operator.nickname, 10);
            }
            changeNode.getComponent(cc.Label).string = fuhao + scoreChange/100
            changeNode.color = color
            scoreNode.getComponent(cc.Label).string = (info.new_money/100).toString()
            return
        }
        var myId = info.guid
        var eventString = ""
        var scoreChange = 0
        if (info.reason == 49||info.reason == 48)
            scoreChange = info.new_money - info.old_money
        else
            scoreChange = info.delta_money
        if (scoreChange > 0)
            var color = new cc.Color(97,61,30)
        else
            var color =  new cc.Color(104,132,173)
        var type = ""
        var changeScore = 0
        
        if(info.reason == 49)
        {
            if (myId == info.source_id)
            {
                type = "我增加【"+ info.target_id+"】积分"
                changeScore = scoreChange/100
                // eventString = "【"+myId+"】给【"+ info.target_id+"】增加了 " +(-1*scoreChange/100) +" 分"

            }
            else
            {
                type = "【"+ info.source_id+"】增加我的积分"
                changeScore = scoreChange/100
            }                   
                // eventString = "【"+ info.source_id+"】给【"+myId+"】增加了 " + scoreChange/100 +" 分"
        }
        else if (info.reason == 48)
        {
            if (myId == info.target_id)
            {
                type = "我减少【"+ info.source_id+"】积分"
                changeScore = scoreChange/100
            }
                // eventString = "【"+myId+"】扣除了【"+ info.source_id+"】 " + scoreChange/100 +" 分"
            else        
            {
                type = "【"+ info.target_id+"】减少我的积分"
                changeScore = scoreChange/100
            }           
                // eventString = "【"+ info.target_id+"】扣除了【"+myId+"】 " + (-1*scoreChange/100) +" 分"

        }
        else if (info.reason == 6 || info.reason == 47 ||  (info.reason < 70 && info.reason >53)||info.reason == 7||info.reason == 9)
        {
            if(scoreChange >= 0)
            {
                type = this.type2Game[info.reason]
                changeScore = scoreChange/100
            }
                // eventString = "在【"+this.type2Game[info.reason]+"】中，赢了"+scoreChange/100 + "分"
            else
            {
                type = this.type2Game[info.reason]
                changeScore = scoreChange/100
            }
                // eventString = "在【"+this.type2Game[info.reason]+"】中，输了"+(-1*scoreChange/100) + "分"
        }
        else if (info.reason == 51)
        {
            type = "兑换业绩"
            changeScore = scoreChange/100
            // eventString = "兑换了自己的贡献值，增加了" + scoreChange/100 + "分"
        }
        else if (info.reason == 52)
        {
            type = "消耗"
            changeScore = scoreChange/100
            // eventString = -1*scoreChange/100 + "分"
        }
        else if (info.reason == 53)
        {
            type = "初始"
            changeScore = scoreChange/100
            // eventString = "初始积分 " + scoreChange/100 + "分"
        }
        else if (info.reason == 64)
        {
            type = "自动兑换业绩"
            changeScore = scoreChange/100
            // eventString = "初始积分 " + scoreChange/100 + "分"
        }
        else if (info.reason == 65)
        {
            type = this.type2Game[info.reason]
            changeScore = scoreChange/100
        }
        this.labelChange.string = changeScore.toString()
        this.labelType.string = type
        this.labelChange.node.color = color
        this.labelTime.string = Utils.getTimeString(info.created_time,"-");  
        this.labelScore.string = (info.new_money/100).toString()      
    }

}
